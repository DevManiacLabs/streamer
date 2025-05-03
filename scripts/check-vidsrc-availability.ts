import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import axios, { AxiosError } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import fs from 'fs';
import { createWriteStream } from 'fs';
import { Writable } from 'stream';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import os from 'os';

// Load environment variables
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Verify MongoDB URI and TMDB API key are set
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set in either .env or .env.local');
  process.exit(1);
}

if (!process.env.TMDB_API_KEY) {
  console.error('TMDB_API_KEY is not set in either .env or .env.local');
  process.exit(1);
}

// Configuration
const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const NUM_WORKERS = Math.max(1, Math.min(4, os.cpus().length - 1)); // Use at most 4 workers
const BATCH_SIZE = 100; // Increased batch size for efficiency
const WORKER_BATCH_SIZE = 25; // Increased worker batch size
const PROXY_TIMEOUT = 5000; // Increased timeout
const PROXY_REFRESH_INTERVAL = 180000;
const PROGRESS_UPDATE_INTERVAL = 5000; // Increased update interval

// Proxy list
const PROXY_LIST = [
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
  '156.228.79.145:3128',
  '156.228.99.177:3128',
  '156.248.83.88:3128',
  '156.248.84.233:3128',
  '156.228.176.235:3128',
  '156.249.56.187:3128',
  '156.228.85.244:3128',
  '156.228.84.183:3128',
  '156.228.105.196:3128',
  '156.253.165.55:3128',
  '156.240.99.208:3128',
  '156.249.59.81:3128',
  '156.228.104.221:3128',
  '156.253.169.182:3128',
  '156.228.89.201:3128',
  '156.253.171.93:3128',
  '156.228.77.59:3128',
  '156.228.82.206:3128',
  '156.253.165.33:3128',
  '156.249.59.5:3128',
  '156.228.109.177:3128',
  '156.228.102.38:3128',
  '156.233.86.75:3128',
  '156.253.170.187:3128',
  '156.228.105.194:3128',
  '156.253.173.171:3128',
  '156.228.90.179:3128',
  '156.228.104.61:3128',
  '156.228.100.108:3128',
  '156.228.185.77:3128',
  '156.228.175.88:3128',
  '45.201.11.229:3128',
  '156.228.171.115:3128',
  '156.228.171.130:3128',
  '156.249.61.151:3128',
  '154.213.166.127:3128',
  '45.201.11.211:3128',
  '45.202.79.224:3128',
  '156.248.87.179:3128',
  '156.233.85.186:3128',
  '156.228.109.109:3128',
  '156.228.190.234:3128',
  '156.242.37.182:3128',
  '156.242.41.171:3128',
  '156.228.80.52:3128',
  '156.228.100.126:3128',
  '156.228.79.202:3128',
  '45.202.76.5:3128',
  '156.228.115.212:3128',
  '156.242.44.120:3128',
  '154.213.197.241:3128',
  '156.228.99.132:3128',
  '154.213.204.21:3128',
  '156.249.138.62:3128',
  '156.249.62.194:3128',
  '154.213.202.141:3128',
  '156.228.189.234:3128',
  '156.253.179.72:3128',
  '154.94.12.61:3128',
  '156.249.137.119:3128',
  '156.242.39.48:3128',
  '156.228.124.98:3128',
  '156.233.95.51:3128',
  '156.253.177.248:3128',
  '156.249.57.199:3128',
  '156.242.46.5:3128',
  '156.228.174.172:3128',
  '156.228.106.101:3128',
  '156.242.42.84:3128',
  '156.228.112.21:3128',
  '156.253.179.43:3128',
  '156.228.176.92:3128',
  '156.233.87.55:3128',
  '156.228.180.14:3128',
  '154.94.14.197:3128',
  '156.228.76.151:3128',
  '156.249.138.157:3128',
  '154.213.198.12:3128',
  '156.228.118.8:3128',
  '156.228.77.96:3128',
  '156.228.105.35:3128',
  '154.213.167.134:3128',
  '156.228.90.159:3128',
  '156.242.41.232:3128',
  '156.233.73.88:3128',
  '156.242.46.45:3128'
].map(proxy => `http://${proxy}`);

// Create log file with timestamp
const logFileName = `availability-check-${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
const logStream = createWriteStream(logFileName, { flags: 'a' });

// Create a writable stream that writes to both console and file
const dualStream = new Writable({
  write(chunk, encoding, callback) {
    console.log(chunk.toString());
    logStream.write(chunk, encoding, callback);
  }
});

// Helper function for logging
function log(message: string) {
  dualStream.write(message + '\n');
}

// Worker thread function
if (!isMainThread) {
  const { proxyList, tmdbApiKey } = workerData;
  const titleCache = new Map<string, string>();

  async function getTitleFromTMDB(type: string, tmdbId: string): Promise<string> {
    const cacheKey = `${type}-${tmdbId}`;
    if (titleCache.has(cacheKey)) {
      return titleCache.get(cacheKey)!;
    }

    try {
      const endpoint = type === 'movie' ? 'movie' : 'tv';
      const response = await axios.get(`${TMDB_API_BASE}/${endpoint}/${tmdbId}`, {
        params: { api_key: tmdbApiKey }
      });
      const title = type === 'movie' ? response.data.title : response.data.name;
      titleCache.set(cacheKey, title);
      return title;
    } catch (error) {
      return 'Unknown Title';
    }
  }

  async function checkVidSrcAvailability(url: string, proxy: string): Promise<boolean> {
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        const agent = new HttpsProxyAgent(proxy);
        const response = await axios.get(url, {
          httpsAgent: agent,
          timeout: PROXY_TIMEOUT,
          validateStatus: (status) => true,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        // Check for specific response patterns that indicate availability
        const isAvailable = response.status === 200 && 
          (response.data.includes('vidsrc') || 
           response.data.includes('player') || 
           response.data.includes('embed'));

        if (isAvailable) {
          return true;
        }

        // If we get a 404, content is definitely not available
        if (response.status === 404) {
          return false;
        }

        // For other status codes, retry with a different proxy
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
      }
    }
    
    // If we've exhausted all retries, assume content is not available
    return false;
  }

  parentPort?.on('message', async (items) => {
    const results = await Promise.all(items.map(async (item: any) => {
      // Try multiple proxies for each item
      const proxies = [...proxyList].sort(() => Math.random() - 0.5).slice(0, 3);
      let isAvailable = false;
      
      for (const proxy of proxies) {
        const streamUrl = item.type === 'movie' 
          ? `https://vidsrc.xyz/embed/movie/${item.tmdbId}`
          : `https://vidsrc.xyz/embed/tv/${item.tmdbId}/1/1`;
        
        isAvailable = await checkVidSrcAvailability(streamUrl, proxy);
        if (isAvailable) break;
      }
      
      const title = await getTitleFromTMDB(item.type, item.tmdbId);
      
      return {
        ...item,
        isAvailable,
        title,
        timestamp: new Date().toISOString()
      };
    }));

    parentPort?.postMessage(results);
  });
}

// Main thread function
async function updateContentAvailability() {
  const client = new MongoClient(process.env.MONGODB_URI!, {
    connectTimeoutMS: 60000,
    socketTimeoutMS: 60000,
    serverSelectionTimeoutMS: 60000,
    maxPoolSize: 20,
    minPoolSize: 5,
    retryWrites: true,
    retryReads: true
  });
  
  try {
    let connected = false;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (!connected && retryCount < maxRetries) {
      try {
        await client.connect();
        connected = true;
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          log(`Connection attempt ${retryCount} failed, retrying in 5 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
          throw error;
        }
      }
    }
    
    const db = client.db();
    const contentCollection = db.collection('content');
    
    const totalCount = await contentCollection.countDocuments();
    log(`Found ${totalCount} items in the database`);
    log(`Using ${PROXY_LIST.length} proxies`);
    log(`Starting ${NUM_WORKERS} worker threads`);
    log(`Processing ${BATCH_SIZE} items per batch`);
    log(`Logging to file: ${logFileName}`);
    
    let processedCount = 0;
    let updatedCount = 0;
    let removedCount = 0;
    let lastProgressUpdate = Date.now();
    let startTime = Date.now();
    
    // Create worker threads with proper error handling
    const workers = Array.from({ length: NUM_WORKERS }, () => {
      const worker = new Worker(__filename, {
        workerData: {
          proxyList: PROXY_LIST,
          tmdbApiKey: TMDB_API_KEY
        }
      });
      
      worker.on('error', (error) => {
        log(`Worker error: ${error}`);
      });
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          log(`Worker stopped with exit code ${code}`);
        }
      });
      
      return worker;
    });

    // Process in batches with proper error handling
    while (processedCount < totalCount) {
      let batch;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          batch = await contentCollection
            .find()
            .skip(processedCount)
            .limit(BATCH_SIZE)
            .toArray();
          break;
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            log(`Batch fetch attempt ${retryCount} failed, retrying in 2 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw error;
          }
        }
      }
      
      if (!batch || batch.length === 0) break;
      
      const currentBatch = Math.floor(processedCount / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(totalCount / BATCH_SIZE);
      
      log(`\nProcessing batch ${currentBatch}/${totalBatches} (${batch.length} items)`);
      
      // Split batch among workers
      const workerBatches: any[][] = Array.from({ length: NUM_WORKERS }, () => []);
      batch.forEach((item, index) => {
        workerBatches[index % NUM_WORKERS].push(item);
      });
      
      // Process each worker's batch sequentially
      for (let i = 0; i < NUM_WORKERS; i++) {
        if (workerBatches[i].length > 0) {
          const results = await new Promise<any[]>((resolve) => {
            workers[i].once('message', resolve);
            workers[i].postMessage(workerBatches[i]);
          });
          
          // Process results immediately
          for (const result of results) {
            const { _id, type, tmdbId, isAvailable, title, timestamp } = result;
            
            if (isAvailable) {
              log(`[${timestamp}] ${type.toUpperCase()} ${tmdbId} - "${title}": AVAILABLE`);
              await contentCollection.updateOne(
                { _id },
                { 
                  $set: { 
                    available: true,
                    lastChecked: new Date(),
                    [`data.${type === 'movie' ? 'title' : 'name'}`]: title
                  }
                }
              );
              updatedCount++;
            } else {
              log(`[${timestamp}] ${type.toUpperCase()} ${tmdbId} - "${title}": NOT AVAILABLE - DELETING`);
              
              await contentCollection.updateOne(
                { _id },
                { 
                  $set: { 
                    available: false,
                    lastChecked: new Date()
                  }
                }
              );
              
              let deleted = false;
              let deleteRetryCount = 0;
              const maxDeleteRetries = 3;
              
              while (!deleted && deleteRetryCount < maxDeleteRetries) {
                try {
                  await contentCollection.deleteOne({ _id });
                  deleted = true;
                  removedCount++;
                  log(`[${timestamp}] DELETED: ${type.toUpperCase()} ${tmdbId} - "${title}"`);
                } catch (error) {
                  deleteRetryCount++;
                  if (deleteRetryCount < maxDeleteRetries) {
                    log(`Delete attempt ${deleteRetryCount} failed for ${type} ${tmdbId}, retrying in 2 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                  } else {
                    log(`Failed to delete ${type} ${tmdbId} after ${maxDeleteRetries} attempts`);
                    throw error;
                  }
                }
              }
            }
            
            processedCount++;
            
            if (Date.now() - lastProgressUpdate > PROGRESS_UPDATE_INTERVAL) {
              const elapsedSeconds = (Date.now() - startTime) / 1000;
              const itemsPerSecond = processedCount / elapsedSeconds;
              const estimatedRemainingSeconds = (totalCount - processedCount) / itemsPerSecond;
              const estimatedCompletionTime = new Date(Date.now() + estimatedRemainingSeconds * 1000);
              
              log(`\n[PROGRESS] ${processedCount}/${totalCount} (${((processedCount / totalCount) * 100).toFixed(2)}%)`);
              log(`[BATCH] ${currentBatch}/${totalBatches}`);
              log(`[RATE] ${itemsPerSecond.toFixed(2)} items/second`);
              log(`[WORKERS] Active: ${NUM_WORKERS}/${NUM_WORKERS}`);
              log(`[ETA] ${estimatedCompletionTime.toLocaleTimeString()}`);
              log(`[STATS] Updated: ${updatedCount} | Deleted: ${removedCount}\n`);
              lastProgressUpdate = Date.now();
            }
          }
        }
      }
    }
    
    // Terminate workers
    workers.forEach(worker => worker.terminate());
    
    const totalTime = (Date.now() - startTime) / 1000;
    log('\n[FINAL SUMMARY]');
    log(`Total items processed: ${processedCount}`);
    log(`Items updated: ${updatedCount}`);
    log(`Items deleted: ${removedCount}`);
    log(`Total processing time: ${(totalTime / 60).toFixed(2)} minutes`);
    log(`Average processing rate: ${(processedCount / totalTime).toFixed(2)} items/second`);
    
  } catch (error) {
    log(`Error updating content availability: ${error}`);
    process.exit(1);
  } finally {
    try {
      await client.close();
    } catch (error) {
      log(`Error closing MongoDB connection: ${error}`);
    }
    logStream.end();
  }
}

// Run the update if this is the main thread
if (isMainThread) {
  updateContentAvailability();
} 