import { getPopularMovies, getPopularTVShows } from '../src/api/tmdb';
import { checkAndCacheAvailability, connectToDatabase } from '../src/api/mongodb';
import dotenv from 'dotenv';
import path from 'path';
import { Movie, TVShow } from '../src/types/tmdb';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading environment variables from:', envPath);
dotenv.config({ path: envPath });

// Debug environment variables
console.log('Environment variables:');
console.log('NEXT_PUBLIC_TMDB_API_KEY:', process.env.NEXT_PUBLIC_TMDB_API_KEY ? 'Set' : 'Not Set');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not Set');

// Check if required environment variables are set
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_TMDB_API_KEY) {
  console.error('NEXT_PUBLIC_TMDB_API_KEY environment variable is not set');
  process.exit(1);
}

// Adapter functions to match the expected interface
const getPopularMoviesAdapter = async (page: number): Promise<{ results: Movie[]; total_pages: number }> => {
  const { content, totalPages } = await getPopularMovies(page);
  return {
    results: content,
    total_pages: totalPages
  };
};

const getPopularTVShowsAdapter = async (page: number): Promise<{ results: TVShow[]; total_pages: number }> => {
  const { content, totalPages } = await getPopularTVShows(page);
  return {
    results: content,
    total_pages: totalPages
  };
};

// Function to fetch all pages of content
async function fetchAllPages<T>(
  fetchFunction: (page: number) => Promise<{ results: T[]; total_pages: number }>,
  type: string
): Promise<T[]> {
  console.log(`Fetching all pages of ${type}...`);
  const firstPage = await fetchFunction(1);
  const totalPages = Math.min(firstPage.total_pages, 100); // TMDB limits to 100 pages
  console.log(`Found ${totalPages} pages of ${type}`);

  const allResults = [...firstPage.results];
  
  // Fetch remaining pages
  for (let page = 2; page <= totalPages; page++) {
    console.log(`Fetching page ${page}/${totalPages} of ${type}...`);
    const response = await fetchFunction(page);
    allResults.push(...response.results);
  }

  console.log(`Total ${type} fetched: ${allResults.length}`);
  return allResults;
}

async function initCache() {
  console.log('Starting cache initialization...');

  try {
    // Connect to MongoDB first
    await connectToDatabase();
    console.log('Connected to MongoDB');

    // Fetch all pages of popular movies and TV shows
    const [allMovies, allTVShows] = await Promise.all([
      fetchAllPages(getPopularMoviesAdapter, 'movies'),
      fetchAllPages(getPopularTVShowsAdapter, 'TV shows')
    ]);

    console.log(`Found ${allMovies.length} movies and ${allTVShows.length} TV shows`);

    // Check availability for all items
    console.log('Checking availability for items...');
    const availabilityChecks = [
      ...allMovies.map(movie => checkAndCacheAvailability(movie, 'movie')),
      ...allTVShows.map(show => checkAndCacheAvailability(show, 'tvshow'))
    ];

    const results = await Promise.all(availabilityChecks);
    const availableCount = results.filter(Boolean).length;

    console.log(`Cache initialized. ${availableCount} items are available.`);
    process.exit(0);
  } catch (error) {
    console.error('Error initializing cache:', error);
    process.exit(1);
  }
}

initCache(); 