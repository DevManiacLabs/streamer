import { connectToDatabase, checkAndCacheAvailability } from '../src/api/mongodb';
import { Movie, TVShow } from '../src/types/tmdb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from both .env and .env.local
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Verify MongoDB URI is set
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is not set in either .env or .env.local');
  process.exit(1);
}

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const CONCURRENT_REQUESTS = 5; // Number of concurrent availability checks
const MAX_PAGES = 500; // Maximum pages to fetch

async function fetchTMDB(endpoint: string, page: number) {
  const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint} page ${page}`);
  return res.json();
}

// Process items in batches
async function processBatch(items: (Movie | TVShow)[], type: 'movie' | 'tvshow', processed: number) {
  const batch = items.map(async (item) => {
    try {
      // First check if it's in the database
      const { contentCollection } = await connectToDatabase();
      const dbItem = await contentCollection?.findOne({ tmdbId: item.id });
      
      // If it's in DB and was checked in the last hour, trust it
      if (dbItem && (new Date().getTime() - dbItem.lastChecked.getTime() < 60 * 60 * 1000)) {
        processed++;
        console.log(`[${processed}] ${type.toUpperCase()}: ${'title' in item ? item.title : item.name} - USING CACHED STATUS`);
        return dbItem.available ? 1 : 0;
      }

      // Otherwise check availability
      console.log(`Checking availability for ${type} ${item.id} - "${('title' in item ? item.title : item.name)}"`);
      const available = await checkAndCacheAvailability(item, type);
      
      if (available) {
        processed++;
        console.log(`[${processed}] ${type.toUpperCase()}: ${'title' in item ? item.title : item.name} - AVAILABLE`);
        return 1;
      } else {
        console.log(`${type.toUpperCase()} ${item.id} - "${('title' in item ? item.title : item.name)}": NOT AVAILABLE`);
        return 0;
      }
    } catch (error) {
      console.error(`Error processing ${type} ${item.id}:`, error);
      return 0;
    }
  });

  const results = await Promise.all(batch);
  return results.reduce((sum: number, count: number) => sum + count, 0);
}

async function main() {
  const { db, contentCollection } = await connectToDatabase();

  if (!contentCollection) {
    throw new Error('Failed to connect to database: contentCollection is null');
  }

  let totalProcessed = 0;
  let totalItems = 0;

  for (const [type, endpoint] of [
    ['movie', 'discover/movie'],
    ['tvshow', 'discover/tv'],
  ] as const) {
    console.log(`\nStarting to fetch ${type}s...`);

    // First, get total pages
    const initialData = await fetchTMDB(endpoint, 1);
    const totalPages = Math.min(initialData.total_pages, MAX_PAGES);
    totalItems += initialData.total_results;

    // Create array of page numbers
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    
    // Process pages in chunks to avoid memory issues
    const chunkSize = 10;
    for (let i = 0; i < pages.length; i += chunkSize) {
      const pageChunk = pages.slice(i, i + chunkSize);
      
      // Fetch chunk of pages in parallel
      const pagePromises = pageChunk.map(page => fetchTMDB(endpoint, page));
      const pagesData = await Promise.all(pagePromises);
      
      // Process all items from these pages
      const allItems = pagesData.flatMap(page => page.results) as (Movie | TVShow)[];
      
      // Process items in batches
      for (let j = 0; j < allItems.length; j += CONCURRENT_REQUESTS) {
        const batch = allItems.slice(j, j + CONCURRENT_REQUESTS);
        const newProcessed = await processBatch(batch, type, totalProcessed);
        totalProcessed += newProcessed;

        // Log progress
        const progress = ((totalProcessed / totalItems) * 100).toFixed(2);
        console.log(`\n[PROGRESS] ${totalProcessed}/${totalItems} (${progress}%)\n`);
      }

      console.log(`Completed pages ${i + 1} to ${Math.min(i + chunkSize, totalPages)} of ${totalPages} for ${type}s`);
    }
  }

  console.log('\nFetch and availability check complete!');
  console.log(`Total items processed: ${totalProcessed}`);
  console.log(`Total available items: ${totalProcessed}`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
}); 