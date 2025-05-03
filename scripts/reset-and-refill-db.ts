// scripts/reset-and-refill-db.ts

import { connectToDatabase, checkAndCacheAvailability } from '../src/api/mongodb';
import { Movie, TVShow } from '../src/types/tmdb';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const CONCURRENT_REQUESTS = 5; // Number of concurrent availability checks

async function fetchTMDB(endpoint: string, page: number) {
  const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${TMDB_API_KEY}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint} page ${page}`);
  return res.json();
}

// Process items in batches
async function processBatch(items: (Movie | TVShow)[], type: 'movie' | 'tvshow', processed: number) {
  const batch = items.map(async (item) => {
    const available = await checkAndCacheAvailability(item, type);
    if (available) {
      processed++;
      console.log(`[${processed}] ${type.toUpperCase()}: ${'title' in item ? item.title : item.name} - AVAILABLE`);
    }
    return available ? 1 : 0;
  });

  const results = await Promise.all(batch);
  return results.reduce((sum: number, count: number) => sum + count, 0);
}

async function main() {
  const { db, contentCollection } = await connectToDatabase();

  if (!contentCollection) {
    throw new Error('Failed to connect to database: contentCollection is null');
  }

  // 1. Delete all documents
  console.log('Deleting all documents from content collection...');
  await contentCollection.deleteMany({});
  console.log('All documents deleted.');

  // 2. Fetch and process movies and TV shows
  const maxPages = 10; // Adjust as needed for full fetch
  let processed = 0;

  for (const [type, endpoint] of [
    ['movie', 'movie/popular'],
    ['tvshow', 'tv/popular'],
  ] as const) {
    // Fetch all pages first
    const pagePromises = Array.from({ length: maxPages }, (_, i) => 
      fetchTMDB(endpoint, i + 1)
    );
    
    const pages = await Promise.all(pagePromises);
    console.log(`Fetched all ${type} pages, processing items...`);

    // Process all items from all pages
    const allItems = pages.flatMap(page => page.results) as (Movie | TVShow)[];
    
    // Process in batches of CONCURRENT_REQUESTS
    for (let i = 0; i < allItems.length; i += CONCURRENT_REQUESTS) {
      const batch = allItems.slice(i, i + CONCURRENT_REQUESTS);
      const newProcessed = await processBatch(batch, type, processed);
      processed += newProcessed;
    }

    console.log(`Finished processing all ${type}s`);
  }

  console.log('Database reset and refill complete!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
