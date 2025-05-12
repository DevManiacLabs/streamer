import { MongoClient, Collection } from 'mongodb';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Load environment variables
dotenv.config();

// Constants
const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const LOG_DIR = 'logs';
const LOG_FILE = `tmdb-vidsrc-tv-sync-${new Date().toISOString().replace(/:/g, '-')}.log`;
const PROGRESS_FILE = path.join(process.cwd(), 'tv-progress.json');
const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const RATE_LIMIT_DELAY = 250; // milliseconds between API requests
const MAX_RETRIES = 3;
const BATCH_SIZE = 10; // concurrent requests

if (!TMDB_API_KEY) {
  throw new Error('TMDB_API_KEY environment variable is not set');
}

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

// Type definitions
interface TVShow {
  id: number;
  name: string;
  first_air_date: string;
  popularity: number;
  vote_average: number;
  poster_path: string;
  overview: string;
  number_of_seasons: number;
  number_of_episodes: number;
  [key: string]: any;
}

interface Season {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  [key: string]: any;
}

interface ContentDocument {
  tmdbId: number;
  type: 'movie' | 'tvshow';
  data: TVShow;
  seasons?: {
    seasonNumber: number;
    episodeCount: number;
    available: boolean;
    lastChecked: Date;
  }[];
  available: boolean;
  lastChecked: Date;
}

interface ProgressData {
  lastProcessedPage: number;
  lastProcessedIndex: number;
  totalPages: number;
}

// Command line arguments
interface Options {
  startPage: number;
  dryRun: boolean;
  concurrency: number;
}

// Database connection
const client = new MongoClient(MONGODB_URI as string);
let contentCollection: Collection<ContentDocument>;

// VidSrc domains to check
const vidSrcDomains = [
  'vidsrc.me',
  'vidsrc.in',
  'vidsrc.pm',
  'vidsrc.net',
  'vidsrc.xyz',
  'vidsrc.io',
  'vidsrc.vc'
];

// Keep the proxy list for fallback
const proxies = [
  '154.213.165.20:3128',
  '156.242.34.42:3128',
  '156.249.138.20:3128',
  '156.233.92.28:3128',
  '156.233.84.24:3128',
  '156.253.176.141:3128',
  '156.228.76.219:3128',
  '156.242.40.3:3128',
  '154.213.202.112:3128',
  '154.213.167.104:3128',
  '154.94.13.245:3128',
  '154.213.199.24:3128',
  '156.242.47.132:3128',
  '156.228.114.150:3128',
  '156.228.79.145:3128'
];

let currentProxyIndex = 0;
let currentDomainIndex = 0;

// Setup logging
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFilePath = path.join(LOG_DIR, LOG_FILE);
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

function logger(message: string, level: 'INFO' | 'ERROR' | 'DEBUG' | 'WARNING' = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  
  // Log to console
  console.log(logMessage);
  
  // Log to file
  logStream.write(logMessage + '\n');
}

// Function to get the next proxy in the rotation
function getNextProxy() {
  const proxy = proxies[currentProxyIndex];
  currentProxyIndex = (currentProxyIndex + 1) % proxies.length;
  return proxy;
}

// Function to get the next domain in the rotation
function getNextDomain() {
  const domain = vidSrcDomains[currentDomainIndex];
  currentDomainIndex = (currentDomainIndex + 1) % vidSrcDomains.length;
  return domain;
}

// Save progress to file for resumability
function saveProgress(progress: ProgressData): void {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    logger(`Progress saved: Page ${progress.lastProcessedPage}, Index ${progress.lastProcessedIndex}`);
  } catch (error) {
    logger(`Failed to save progress: ${error}`, 'ERROR');
  }
}

// Load progress from file for resumability
function loadProgress(): ProgressData {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
      const progress = JSON.parse(data) as ProgressData;
      logger(`Resuming from progress: Page ${progress.lastProcessedPage}, Index ${progress.lastProcessedIndex}`);
      return progress;
    }
  } catch (error) {
    logger(`Failed to load progress, starting fresh: ${error}`, 'ERROR');
  }
  
  return {
    lastProcessedPage: 1,
    lastProcessedIndex: 0,
    totalPages: 0
  };
}

// Connect to MongoDB
async function connectToMongoDB() {
  try {
    await client.connect();
    const db = client.db();
    contentCollection = db.collection<ContentDocument>('content');
    logger('Connected to MongoDB successfully');
    return true;
  } catch (error) {
    logger(`MongoDB connection failed: ${error}`, 'ERROR');
    return false;
  }
}

// Fetch total number of pages from TMDB
async function fetchTotalPages(): Promise<number> {
  try {
    const url = `${TMDB_API_BASE}/discover/tv?api_key=${TMDB_API_KEY}&page=1`;
    const response = await axios.get(url);
    const totalPages = response.data.total_pages || 500; // Default to 500 if not specified
    logger(`Total TV show pages from TMDB: ${totalPages}`);
    return totalPages;
  } catch (error) {
    logger(`Failed to fetch total pages: ${error}`, 'ERROR');
    return 500; // Default value
  }
}

// Fetch TV shows from a specific page
async function fetchTVShowsFromPage(page: number): Promise<TVShow[]> {
  try {
    const url = `${TMDB_API_BASE}/discover/tv?api_key=${TMDB_API_KEY}&page=${page}`;
    const response = await axios.get(url);
    const tvShows = response.data.results || [];
    logger(`Fetched ${tvShows.length} TV shows from page ${page}`);
    return tvShows;
  } catch (error) {
    logger(`Failed to fetch TV shows from page ${page}: ${error}`, 'ERROR');
    return [];
  }
}

// Fetch seasons for a TV show
async function fetchTVShowDetails(tvShowId: number): Promise<TVShow> {
  try {
    const url = `${TMDB_API_BASE}/tv/${tvShowId}?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    logger(`Failed to fetch details for TV show ${tvShowId}: ${error}`, 'ERROR');
    return {} as TVShow;
  }
}

// Check if a TV show is available on VidSrc
async function checkVidSrcAvailability(tvShow: TVShow): Promise<boolean> {
  const tmdbId = tvShow.id;
  let isAvailable = false;
  let attemptCount = 0;
  const maxAttempts = vidSrcDomains.length * 2;

  while (!isAvailable && attemptCount < maxAttempts) {
    const domain = getNextDomain();
    const streamUrl = `https://${domain}/embed/tv/${tmdbId}`;
    
    try {
      logger(`Checking TV show ${tmdbId} (${tvShow.name}) on ${domain}`, 'DEBUG');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(streamUrl, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      // Consider it available if we get a 200 response
      isAvailable = response.status === 200;
      
      if (isAvailable) {
        logger(`Found TV show ${tmdbId} (${tvShow.name}) available on ${domain}`);
        break;
      }
      
      // If rate limited, try with a proxy
      if (response.status === 429) {
        logger(`Rate limited on ${domain}, trying with proxy...`, 'WARNING');
        const proxy = getNextProxy();
        logger(`Using proxy ${proxy} for ${domain}`, 'DEBUG');
        
        try {
          const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);
          const proxyResponse = await fetch(streamUrl, {
            method: 'HEAD',
            signal: controller.signal,
            //@ts-ignore - agent is not in the type definition but is supported
            agent: proxyAgent
          });
          
          isAvailable = proxyResponse.status === 200;
          
          if (isAvailable) {
            logger(`Found TV show ${tmdbId} (${tvShow.name}) available on ${domain} via proxy ${proxy}`);
            break;
          }
        } catch (proxyError) {
          logger(`Error with proxy ${proxy}: ${proxyError}`, 'ERROR');
        }
      }
    } catch (error) {
      logger(`Error checking ${domain} for TV show ${tmdbId}: ${error}`, 'ERROR');
    }
    
    attemptCount++;
    
    // Add a small delay between attempts to avoid triggering rate limits
    if (!isAvailable && attemptCount < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }

  return isAvailable;
}

// Upsert a TV show in MongoDB
async function upsertTVShow(tvShow: TVShow, isAvailable: boolean): Promise<void> {
  try {
    const now = new Date();
    
    // Fetch detailed information if available
    let detailedShow = tvShow;
    if (isAvailable) {
      try {
        const details = await fetchTVShowDetails(tvShow.id);
        if (details && details.id) {
          detailedShow = details;
        }
      } catch (error) {
        logger(`Failed to fetch detailed info for TV show ${tvShow.id}: ${error}`, 'ERROR');
      }
    }
    
    // Create seasons data if available
    const seasons = detailedShow.seasons?.map((season: Season) => ({
      seasonNumber: season.season_number,
      episodeCount: season.episode_count,
      available: isAvailable,
      lastChecked: now
    })) || [];
    
    await contentCollection.updateOne(
      { tmdbId: tvShow.id, type: 'tvshow' },
      {
        $set: {
          tmdbId: tvShow.id,
          type: 'tvshow',
          data: detailedShow,
          seasons: seasons,
          available: isAvailable,
          lastChecked: now
        }
      },
      { upsert: true }
    );
    logger(`Upserted TV show ${tvShow.id} (${tvShow.name}) with availability: ${isAvailable}`);
  } catch (error) {
    logger(`Failed to upsert TV show ${tvShow.id}: ${error}`, 'ERROR');
  }
}

// Process TV shows with concurrency
async function processTVShowsWithConcurrency(tvShows: TVShow[], options: Options): Promise<void> {
  const concurrency = options.concurrency || BATCH_SIZE;
  const batches = [];
  
  for (let i = 0; i < tvShows.length; i += concurrency) {
    batches.push(tvShows.slice(i, i + concurrency));
  }
  
  for (const batch of batches) {
    const tasks = batch.map(async (tvShow) => {
      try {
        // Check if TV show already exists in DB and is recent
        const existingTVShow = await contentCollection.findOne({ tmdbId: tvShow.id, type: 'tvshow' });
        const now = new Date();
        
        if (existingTVShow && (now.getTime() - existingTVShow.lastChecked.getTime() < 24 * 60 * 60 * 1000)) {
          logger(`TV show ${tvShow.id} (${tvShow.name}) already processed recently, skipping`);
          return;
        }
        
        // Only check availability if not in dry run mode
        if (!options.dryRun) {
          const isAvailable = await checkVidSrcAvailability(tvShow);
          await upsertTVShow(tvShow, isAvailable);
        } else {
          logger(`[DRY RUN] Would check availability for TV show ${tvShow.id} (${tvShow.name})`);
        }
      } catch (error) {
        logger(`Error processing TV show ${tvShow.id}: ${error}`, 'ERROR');
      }
    });
    
    await Promise.all(tasks);
    
    // Add a delay between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY * concurrency));
  }
}

// Parse command line arguments
function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    startPage: 1,
    dryRun: false,
    concurrency: BATCH_SIZE
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--start-page' && args[i + 1]) {
      options.startPage = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--concurrency' && args[i + 1]) {
      options.concurrency = parseInt(args[i + 1]);
      i++;
    }
  }
  
  return options;
}

// Main function to run the TMDB to VidSrc sync
async function main() {
  try {
    logger('Initializing TMDB to VidSrc TV Show Sync...');
    
    // Parse command line arguments
    const options = parseArgs();
    logger(`Options: startPage=${options.startPage}, dryRun=${options.dryRun}, concurrency=${options.concurrency}`);
    
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }
    
    // Load progress or initialize from command line arguments
    let progress = loadProgress();
    if (options.startPage > 1) {
      progress.lastProcessedPage = options.startPage - 1;
      progress.lastProcessedIndex = 0;
    }
    
    // Fetch total number of pages if not already loaded
    if (!progress.totalPages) {
      progress.totalPages = await fetchTotalPages();
      saveProgress(progress);
    }
    
    // Process TV shows page by page
    for (let page = progress.lastProcessedPage; page <= progress.totalPages; page++) {
      logger(`Processing page ${page} of ${progress.totalPages}`);
      
      // Fetch TV shows for the current page
      const tvShows = await fetchTVShowsFromPage(page);
      
      // Skip already processed TV shows if resuming from a specific index
      const startIndex = page === progress.lastProcessedPage ? progress.lastProcessedIndex : 0;
      const tvShowsToProcess = tvShows.slice(startIndex);
      
      if (tvShowsToProcess.length > 0) {
        await processTVShowsWithConcurrency(tvShowsToProcess, options);
      }
      
      // Update progress
      progress.lastProcessedPage = page;
      progress.lastProcessedIndex = tvShows.length;
      saveProgress(progress);
    }
    
    logger('TV show sync completed successfully!');
    process.exit(0);
  } catch (error) {
    logger(`Sync failed: ${error}`, 'ERROR');
    process.exit(1);
  } finally {
    // Close the log stream and MongoDB connection
    logStream.end();
    await client.close();
  }
}

// Run the script
main(); 