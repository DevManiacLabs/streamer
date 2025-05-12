import { MongoClient, Collection } from 'mongodb';
import dotenv from 'dotenv';
import { table } from 'table';

// Load environment variables
dotenv.config();

// Constants
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable is not set');
}

interface ContentDocument {
  tmdbId: number;
  type: 'movie' | 'tvshow';
  data: any;
  available: boolean;
  lastChecked: Date;
}

async function checkSyncStatus() {
  const client = new MongoClient(MONGODB_URI as string);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    const db = client.db();
    const contentCollection = db.collection<ContentDocument>('content');

    // Get counts
    const totalCount = await contentCollection.countDocuments();
    const availableMovies = await contentCollection.countDocuments({ type: 'movie', available: true });
    const unavailableMovies = await contentCollection.countDocuments({ type: 'movie', available: false });
    const totalMovies = availableMovies + unavailableMovies;
    const notCheckedMovies = await contentCollection.countDocuments({ type: 'movie', lastChecked: { $exists: false } });
    
    // Calculate statistics
    const availablePercentage = totalMovies > 0 ? (availableMovies / totalMovies * 100).toFixed(2) : '0.00';
    
    // Create table data
    const tableData = [
      ['Metric', 'Count', 'Percentage'],
      ['Total Documents', totalCount.toString(), '100%'],
      ['Total Movies', totalMovies.toString(), (totalMovies / totalCount * 100).toFixed(2) + '%'],
      ['Available Movies', availableMovies.toString(), availablePercentage + '%'],
      ['Unavailable Movies', unavailableMovies.toString(), (100 - Number(availablePercentage)).toFixed(2) + '%'],
      ['Not Checked Movies', notCheckedMovies.toString(), (notCheckedMovies / totalCount * 100).toFixed(2) + '%']
    ];
    
    // Print table
    console.log('\nMovie Sync Status:');
    console.log(table(tableData));
    
    // Get 5 most recently added available movies
    const recentMovies = await contentCollection.find({ 
      type: 'movie', 
      available: true 
    })
    .sort({ lastChecked: -1 })
    .limit(5)
    .toArray();
    
    console.log('\nMost Recently Added Available Movies:');
    if (recentMovies.length === 0) {
      console.log('No available movies found');
    } else {
      const movieTable = [
        ['TMDB ID', 'Title', 'Last Checked']
      ];
      
      recentMovies.forEach(movie => {
        movieTable.push([
          movie.tmdbId.toString(),
          movie.data?.title || 'Unknown',
          new Date(movie.lastChecked).toLocaleString()
        ]);
      });
      
      console.log(table(movieTable));
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await client.close();
  }
}

// Run the check
checkSyncStatus(); 