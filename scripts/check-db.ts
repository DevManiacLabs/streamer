import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function checkDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('content');

    // Get counts
    const totalCount = await collection.countDocuments();
    const availableMovies = await collection.countDocuments({ type: 'movie', available: true });
    const availableTVShows = await collection.countDocuments({ type: 'tvshow', available: true });

    console.log('Database Status:');
    console.log(`Total documents: ${totalCount}`);
    console.log(`Available movies: ${availableMovies}`);
    console.log(`Available TV shows: ${availableTVShows}`);

    // Get some sample content
    console.log('\nSample Movies:');
    const movies = await collection.find({ type: 'movie', available: true })
      .limit(5)
      .toArray();
    movies.forEach(movie => {
      console.log(`- ${movie.data.title} (ID: ${movie.tmdbId})`);
    });

    console.log('\nSample TV Shows:');
    const tvShows = await collection.find({ type: 'tvshow', available: true })
      .limit(5)
      .toArray();
    tvShows.forEach(show => {
      console.log(`- ${show.data.name} (ID: ${show.tmdbId})`);
    });

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await client.close();
  }
}

checkDatabase(); 