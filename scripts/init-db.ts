import { updatePopularContent, cleanupOldContent } from '../src/api/mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function initDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Clean up old content
    console.log('Cleaning up old content...');
    await cleanupOldContent();
    
    // Update popular content
    console.log('Updating popular content...');
    await updatePopularContent();
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase(); 