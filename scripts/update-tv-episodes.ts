import { connectToDatabase, bulkUpdateTVShowSeasonData } from '../src/api/mongodb';
import { getTVShowDetails } from '../src/api/tmdb';
import { TVShow, Season } from '../src/types/tmdb';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import os from 'os';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Verify MongoDB URI is set
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set in either .env or .env.local');
  process.exit(1);
}

// Verify TMDB API key is set
if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
  console.error('NEXT_PUBLIC_TMDB_API_KEY is not set in either .env or .env.local');
  process.exit(1);
}

// Dynamic concurrency management
let CONCURRENT_REQUESTS = 25; // Initial value, will be adjusted dynamically
const MAX_CONCURRENT_REQUESTS = 50; // Upper limit
const MIN_CONCURRENT_REQUESTS = 10; // Lower limit
const MEMORY_THRESHOLD = 0.8; // If memory usage exceeds 80%, reduce concurrency
const BATCH_SIZE = 50; // Process this many shows at once
const BULK_UPDATE_SIZE = 100; // How many shows to update in one MongoDB operation
const RETRY_ATTEMPTS = 3; // Retry API calls this many times
const RETRY_DELAY = 200; // ms between retries
const RATE_LIMIT_WAIT = 1000; // ms to wait if rate limited
const MEMORY_CHECK_INTERVAL = 30000; // Check memory usage every 30 seconds

// Helper to safely access TV show data
interface TVShowDocument {
  tmdbId: number;
  data: {
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Create an axios instance with optimized settings
const tmdbAPI = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: 10000,
  params: {
    api_key: process.env.NEXT_PUBLIC_TMDB_API_KEY,
    language: 'en-US'
  }
});

// Helper function to get TV show details with retries
async function fetchTVShowWithRetries(tmdbId: number, attempt = 1): Promise<any> {
  try {
    const response = await tmdbAPI.get(`/tv/${tmdbId}`, {
      params: {
        append_to_response: 'seasons,episode_groups,credits,external_ids,content_ratings',
        include_image_language: 'en,null',
        include_video_language: 'en,null'
      }
    });
    return response.data;
  } catch (error: any) {
    // Handle rate limiting
    if (error.response && error.response.status === 429) {
      console.log(`Rate limited when fetching TV show ${tmdbId}, waiting ${RATE_LIMIT_WAIT}ms...`);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_WAIT));
      return fetchTVShowWithRetries(tmdbId, attempt);
    }
    
    // Retry on failure if we haven't exhausted our attempts
    if (attempt < RETRY_ATTEMPTS) {
      const delay = RETRY_DELAY * attempt;
      console.log(`Retrying TV show ${tmdbId} after ${delay}ms (attempt ${attempt})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchTVShowWithRetries(tmdbId, attempt + 1);
    }
    
    throw error;
  }
}

// Process a batch of TV shows in parallel
async function processBatch(batch: TVShowDocument[], batchNumber: number, totalBatches: number) {
  console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} shows)...`);
  const startTime = Date.now();
  
  // Create a queue of tasks
  const queue = [...batch];
  const inProgress = new Set();
  const results: { success: number, failed: number } = { success: 0, failed: 0 };
  const bulkUpdateData: Array<{tvId: number, seasons: Season[]}> = [];
  
  // Process the queue with limited concurrency
  async function processQueue() {
    while (queue.length > 0 || inProgress.size > 0) {
      // Fill up to our concurrency limit
      while (queue.length > 0 && inProgress.size < CONCURRENT_REQUESTS) {
        const tvShow = queue.shift()!;
        
        // Add to in-progress set
        inProgress.add(tvShow.tmdbId);
        
        // Process this TV show asynchronously
        processTVShow(tvShow)
          .then(result => {
            results.success++;
            inProgress.delete(tvShow.tmdbId);
            
            // If we have seasons data, add to bulk update
            if (result && result.seasons && result.seasons.length > 0) {
              bulkUpdateData.push({
                tvId: tvShow.tmdbId,
                seasons: result.seasons
              });
              
              // If we've reached the bulk update size, perform update
              if (bulkUpdateData.length >= BULK_UPDATE_SIZE) {
                performBulkUpdate();
              }
            }
          })
          .catch(error => {
            results.failed++;
            inProgress.delete(tvShow.tmdbId);
            console.error(`Failed to process TV show ${tvShow.tmdbId}:`, error.message);
          });
      }
      
      // Wait a bit before checking again
      if (inProgress.size >= CONCURRENT_REQUESTS || (queue.length === 0 && inProgress.size > 0)) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Perform any remaining bulk updates
    if (bulkUpdateData.length > 0) {
      await performBulkUpdate();
    }
  }
  
  // Perform a bulk update of TV show season data
  async function performBulkUpdate() {
    try {
      const dataToUpdate = [...bulkUpdateData];
      bulkUpdateData.length = 0; // Clear the array
      
      console.log(`\nPerforming bulk update for ${dataToUpdate.length} shows...`);
      await bulkUpdateTVShowSeasonData(dataToUpdate);
      console.log(`Bulk update completed.`);
    } catch (error) {
      console.error('Error performing bulk update:', error);
    }
  }
  
  // Process a single TV show
  async function processTVShow(tvShow: TVShowDocument) {
    try {
      // Fetch updated TV show details with seasons
      const updatedDetails = await fetchTVShowWithRetries(tvShow.tmdbId);
      
      // If seasons information is available, mark as success
      if (updatedDetails.seasons && updatedDetails.seasons.length > 0) {
        process.stdout.write('✓');
        return updatedDetails;
      } else {
        process.stdout.write('⚠');
        return null;
      }
    } catch (error) {
      process.stdout.write('✗');
      throw error;
    }
  }
  
  // Start processing
  await processQueue();
  
  const duration = (Date.now() - startTime) / 1000;
  console.log(`\nBatch ${batchNumber}/${totalBatches} completed in ${duration.toFixed(2)}s`);
  console.log(`${results.success} succeeded, ${results.failed} failed`);
  return results;
}

// Function to monitor memory usage and adjust concurrency
function startMemoryMonitoring() {
  const interval = setInterval(() => {
    // Get memory usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = 1 - (freeMemory / totalMemory);
    
    // CPU load average (last minute)
    const loadAvg = os.loadavg()[0];
    const cpuCount = os.cpus().length;
    const loadPercent = loadAvg / cpuCount;
    
    // Log current system stats
    console.log(`\nSystem stats: Memory used: ${(memoryUsage * 100).toFixed(1)}%, CPU load: ${(loadPercent * 100).toFixed(1)}%, Concurrency: ${CONCURRENT_REQUESTS}`);
    
    // Adjust concurrency based on memory and CPU usage
    if (memoryUsage > MEMORY_THRESHOLD || loadPercent > 0.8) {
      // Reduce concurrency if resources are strained
      CONCURRENT_REQUESTS = Math.max(
        MIN_CONCURRENT_REQUESTS, 
        Math.floor(CONCURRENT_REQUESTS * 0.8)
      );
      console.log(`Reducing concurrency to ${CONCURRENT_REQUESTS} due to high resource usage`);
    } else if (memoryUsage < MEMORY_THRESHOLD * 0.7 && loadPercent < 0.6) {
      // Increase concurrency if resources are available
      CONCURRENT_REQUESTS = Math.min(
        MAX_CONCURRENT_REQUESTS,
        Math.floor(CONCURRENT_REQUESTS * 1.2)
      );
      console.log(`Increasing concurrency to ${CONCURRENT_REQUESTS} due to available resources`);
    }
  }, MEMORY_CHECK_INTERVAL);
  
  return interval;
}

async function updateTVShowEpisodes() {
  try {
    console.log('Starting to update TV show episode information...');
    const startTime = Date.now();
    
    // Start memory monitoring
    const memoryMonitorInterval = startMemoryMonitoring();
    
    // Connect to database
    const { db, contentCollection } = await connectToDatabase();
    if (!contentCollection) {
      throw new Error('Failed to connect to content collection');
    }
    
    // Get all TV shows efficiently by only retrieving the needed fields
    const tvShows = await contentCollection.find({ 
      type: 'tvshow',
      available: true
    }, {
      projection: {
        tmdbId: 1,
        'data.name': 1
      }
    }).toArray() as TVShowDocument[];
    
    console.log(`Found ${tvShows.length} TV shows to update`);
    
    // Process in optimized batches
    const totalBatches = Math.ceil(tvShows.length / BATCH_SIZE);
    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < tvShows.length; i += BATCH_SIZE) {
      const batch = tvShows.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      const results = await processBatch(batch, batchNumber, totalBatches);
      totalSuccess += results.success;
      totalFailed += results.failed;
    }
    
    // Stop memory monitoring
    clearInterval(memoryMonitorInterval);
    
    const totalDuration = (Date.now() - startTime) / 1000;
    const minutesElapsed = (totalDuration / 60).toFixed(2);
    const avgTimePerShow = (totalDuration / tvShows.length).toFixed(2);
    
    console.log('\n--- Final Results ---');
    console.log(`Total time: ${minutesElapsed} minutes`);
    console.log(`Shows processed: ${totalSuccess + totalFailed} (${totalSuccess} succeeded, ${totalFailed} failed)`);
    console.log(`Average time per show: ${avgTimePerShow} seconds`);
    console.log(`Throughput: ${Math.round(tvShows.length / (totalDuration / 60))} shows/minute`);
    console.log('TV show episode information has been updated successfully!');
  } catch (error) {
    console.error('Error updating TV show episodes:', error);
    process.exit(1);
  }
}

// Run the optimized update process
updateTVShowEpisodes(); 