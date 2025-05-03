import { NextResponse } from 'next/server';
import { getPopularMovies, getPopularTVShows } from '@/api/tmdb';
import { checkAndCacheAvailability, cleanupOldCache } from '@/api/mongodb';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Clean up old cache entries
    await cleanupOldCache();

    // Fetch popular movies and TV shows
    const [movies, tvShows] = await Promise.all([
      getPopularMovies(1),
      getPopularTVShows(1)
    ]);

    // Check availability for all items
    const availabilityChecks = [
      ...movies.content.map(movie => checkAndCacheAvailability(movie, 'movie')),
      ...tvShows.content.map(tvShow => checkAndCacheAvailability(tvShow, 'tvshow'))
    ];

    await Promise.all(availabilityChecks);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating cache:', error);
    return NextResponse.json({ error: 'Failed to update cache' }, { status: 500 });
  }
} 