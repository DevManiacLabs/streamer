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
const LOG_FILE = `tmdb-vidsrc-tv-episodes-sync-${new Date().toISOString().replace(/:/g, '-')}.log`;
const PROGRESS_FILE = path.join(process.cwd(), 'tv-episodes-progress.json');
const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const RATE_LIMIT_DELAY = 250; // milliseconds between API requests
const MAX_RETRIES = 3;
const BATCH_SIZE = 5; // concurrent requests (lower due to episode checks)

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
  episodes?: Episode[];
  [key: string]: any;
}

interface Episode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  still_path: string;
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
    episodes?: {
      episodeNumber: number;
      available: boolean;
      lastChecked: Date;
    }[];
  }[];
  available: boolean;
  lastChecked: Date;
}

interface ProgressData {
  lastProcessedShowIndex: number;
  lastProcessedSeasonIndex: number;
  lastProcessedEpisodeIndex: number;
  processedShows: number[];
}

// Command line arguments
interface Options {
  limit: number;
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
    logger(`Progress saved: Shows ${progress.processedShows.length}, Season ${progress.lastProcessedSeasonIndex}, Episode ${progress.lastProcessedEpisodeIndex}`);
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
      logger(`Resuming from progress: Shows ${progress.processedShows.length}, Season ${progress.lastProcessedSeasonIndex}, Episode ${progress.lastProcessedEpisodeIndex}`);
      return progress;
    }
  } catch (error) {
    logger(`Failed to load progress, starting fresh: ${error}`, 'ERROR');
  }
  
  return {
    lastProcessedShowIndex: 0,
    lastProcessedSeasonIndex: 0,
    lastProcessedEpisodeIndex: 0,
    processedShows: []
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

// Fetch available TV shows from MongoDB
async function fetchAvailableTVShows(limit: number, excludeIds: number[]): Promise<TVShow[]> {
  try {
    const shows = await contentCollection
      .find({ 
        type: 'tvshow', 
        available: true,
        tmdbId: { $nin: excludeIds }
      })
      .sort({ 'data.popularity': -1 })
      .limit(limit)
      .toArray();
    
    logger(`Fetched ${shows.length} available TV shows from MongoDB`);
    return shows.map(show => show.data as TVShow);
  } catch (error) {
    logger(`Failed to fetch TV shows from MongoDB: ${error}`, 'ERROR');
    return [];
  }
}

// Fetch season details from TMDB
async function fetchSeasonDetails(tvShowId: number, seasonNumber: number): Promise<Season | null> {
  try {
    const url = `${TMDB_API_BASE}/tv/${tvShowId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`;
    const response = await axios.get(url);
    const seasonData = response.data;
    
    logger(`Fetched details for ${seasonData.name} (${tvShowId}, season ${seasonNumber}) with ${seasonData.episodes?.length || 0} episodes`);
    return seasonData;
  } catch (error) {
    logger(`Failed to fetch season ${seasonNumber} details for TV show ${tvShowId}: ${error}`, 'ERROR');
    return null;
  }
}

// Check if an episode is available on VidSrc
async function checkEpisodeAvailability(
  tvShowId: number, 
  seasonNumber: number, 
  episodeNumber: number
): Promise<boolean> {
  let isAvailable = false;
  let attemptCount = 0;
  const maxAttempts = vidSrcDomains.length * 2;

  while (!isAvailable && attemptCount < maxAttempts) {
    const domain = getNextDomain();
    const streamUrl = `https://${domain}/embed/tv/${tvShowId}/${seasonNumber}-${episodeNumber}`;
    
    try {
      logger(`Checking episode S${seasonNumber}E${episodeNumber} of show ${tvShowId} on ${domain}`, 'DEBUG');
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
        logger(`Found episode S${seasonNumber}E${episodeNumber} of show ${tvShowId} available on ${domain}`);
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
            logger(`Found episode S${seasonNumber}E${episodeNumber} of show ${tvShowId} available on ${domain} via proxy ${proxy}`);
            break;
          }
        } catch (proxyError) {
          logger(`Error with proxy ${proxy}: ${proxyError}`, 'ERROR');
        }
      }
    } catch (error) {
      logger(`Error checking ${domain} for episode S${seasonNumber}E${episodeNumber} of show ${tvShowId}: ${error}`, 'ERROR');
    }
    
    attemptCount++;
    
    // Add a small delay between attempts to avoid triggering rate limits
    if (!isAvailable && attemptCount < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
    }
  }

  return isAvailable;
}

// Update episode information in MongoDB
async function updateEpisodeInformation(
  tvShowId: number, 
  seasonNumber: number, 
  episodeNumber: number, 
  isAvailable: boolean
): Promise<void> {
  try {
    const now = new Date();

    // Find the TV show document
    const tvShowDoc = await contentCollection.findOne({ tmdbId: tvShowId, type: 'tvshow' });
    
    if (!tvShowDoc) {
      logger(`TV show ${tvShowId} not found in database, cannot update episode info`, 'ERROR');
      return;
    }

    // Check if the season exists
    const seasons = tvShowDoc.seasons || [];
    const seasonIndex = seasons.findIndex(s => s.seasonNumber === seasonNumber);
    
    if (seasonIndex === -1) {
      // Add the season if it doesn't exist
      seasons.push({
        seasonNumber,
        episodeCount: episodeNumber, // Assume at least this many episodes
        available: isAvailable,
        lastChecked: now,
        episodes: [{
          episodeNumber,
          available: isAvailable,
          lastChecked: now
        }]
      });
    } else {
      // Check if the episode exists
      const season = seasons[seasonIndex];
      const episodes = season.episodes || [];
      const episodeIndex = episodes.findIndex(e => e.episodeNumber === episodeNumber);
      
      if (episodeIndex === -1) {
        // Add the episode if it doesn't exist
        episodes.push({
          episodeNumber,
          available: isAvailable,
          lastChecked: now
        });
        season.episodes = episodes;
      } else {
        // Update the existing episode
        episodes[episodeIndex] = {
          episodeNumber,
          available: isAvailable,
          lastChecked: now
        };
      }
      
      // Update the season with the updated episodes
      seasons[seasonIndex] = season;
    }
    
    // Update the document in MongoDB
    await contentCollection.updateOne(
      { tmdbId: tvShowId, type: 'tvshow' },
      { $set: { seasons } }
    );
    
    logger(`Updated episode S${seasonNumber}E${episodeNumber} of show ${tvShowId} with availability: ${isAvailable}`);
  } catch (error) {
    logger(`Failed to update episode information for S${seasonNumber}E${episodeNumber} of show ${tvShowId}: ${error}`, 'ERROR');
  }
}

// Process episodes with concurrency
async function processEpisodesWithConcurrency(
  tvShow: TVShow, 
  season: Season, 
  options: Options
): Promise<void> {
  const concurrency = options.concurrency || BATCH_SIZE;
  const episodes = season.episodes || [];
  const batches = [];
  
  for (let i = 0; i < episodes.length; i += concurrency) {
    batches.push(episodes.slice(i, i + concurrency));
  }
  
  for (const batch of batches) {
    const tasks = batch.map(async (episode: Episode) => {
      try {
        // Only check availability if not in dry run mode
        if (!options.dryRun) {
          const isAvailable = await checkEpisodeAvailability(
            tvShow.id, 
            episode.season_number, 
            episode.episode_number
          );
          
          await updateEpisodeInformation(
            tvShow.id, 
            episode.season_number, 
            episode.episode_number, 
            isAvailable
          );
        } else {
          logger(`[DRY RUN] Would check availability for S${episode.season_number}E${episode.episode_number} of ${tvShow.name}`);
        }
      } catch (error) {
        logger(`Error processing S${episode.season_number}E${episode.episode_number} of ${tvShow.name}: ${error}`, 'ERROR');
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
    limit: 10, // Default to processing 10 shows
    dryRun: false,
    concurrency: BATCH_SIZE
  };
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1]);
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

// Main function to run the TMDB to VidSrc episode sync
async function main() {
  try {
    logger('Initializing TMDB to VidSrc TV Episode Sync...');
    
    // Parse command line arguments
    const options = parseArgs();
    logger(`Options: limit=${options.limit}, dryRun=${options.dryRun}, concurrency=${options.concurrency}`);
    
    // Connect to MongoDB
    const connected = await connectToMongoDB();
    if (!connected) {
      throw new Error('Failed to connect to MongoDB');
    }
    
    // Load progress
    let progress = loadProgress();
    
    // Fetch TV shows to process (get more than needed to account for already processed ones)
    const tvShows = await fetchAvailableTVShows(options.limit * 2, progress.processedShows);
    
    if (tvShows.length === 0) {
      logger('No TV shows to process. Either all shows have been processed or no shows are available.');
      process.exit(0);
    }
    
    // Process shows one by one
    let processedCount = 0;
    for (let showIndex = progress.lastProcessedShowIndex; showIndex < tvShows.length && processedCount < options.limit; showIndex++) {
      const tvShow = tvShows[showIndex];
      logger(`Processing TV show ${tvShow.id} (${tvShow.name}), ${processedCount + 1} of ${options.limit}`);
      
      // Get seasons from the existing data
      const totalSeasons = tvShow.number_of_seasons || 0;
      
      // Process each season
      for (let seasonIndex = progress.lastProcessedSeasonIndex; seasonIndex < totalSeasons; seasonIndex++) {
        const seasonNumber = seasonIndex + 1; // Season numbers are 1-based
        
        // Fetch season details from TMDB
        const seasonDetails = await fetchSeasonDetails(tvShow.id, seasonNumber);
        
        if (!seasonDetails) {
          logger(`Skipping season ${seasonNumber} of ${tvShow.name} due to error fetching details`, 'WARNING');
          continue;
        }
        
        logger(`Processing season ${seasonNumber} of ${tvShow.name} with ${seasonDetails.episodes?.length || 0} episodes`);
        
        // Process episodes for this season
        if (seasonDetails.episodes && seasonDetails.episodes.length > 0) {
          // Start from the last processed episode if we're resuming this season
          const startEpisodeIndex = seasonIndex === progress.lastProcessedSeasonIndex ? 
            progress.lastProcessedEpisodeIndex : 0;
          
          const episodesToProcess = seasonDetails.episodes.slice(startEpisodeIndex);
          
          // Process episodes in batches
          await processEpisodesWithConcurrency(tvShow, seasonDetails, options);
          
          // Update progress for this season
          progress.lastProcessedEpisodeIndex = seasonDetails.episodes.length;
        }
        
        // Update progress after each season
        progress.lastProcessedSeasonIndex = seasonIndex + 1;
        progress.lastProcessedEpisodeIndex = 0;
        saveProgress(progress);
      }
      
      // Reset season counter for the next show
      progress.lastProcessedShowIndex = showIndex + 1;
      progress.lastProcessedSeasonIndex = 0;
      progress.lastProcessedEpisodeIndex = 0;
      progress.processedShows.push(tvShow.id);
      processedCount++;
      
      // Save progress after each show
      saveProgress(progress);
    }
    
    logger('TV episode sync completed successfully!');
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