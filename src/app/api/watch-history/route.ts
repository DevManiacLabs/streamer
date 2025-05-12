import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authOptions } from '../auth/[...nextauth]/auth';

// Types for watch history
interface WatchHistoryItem {
  id: string;
  userId: string;
  contentType: 'movie' | 'tvshow';
  contentId: string;
  contentName: string;
  posterPath: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeName?: string;
  watchedAt: string;
}

// File storage for development mode
const WATCH_HISTORY_FILE = path.join(process.cwd(), 'dev-watch-history.json');

// Read watch history from file
const readWatchHistory = (): WatchHistoryItem[] => {
  try {
    if (fs.existsSync(WATCH_HISTORY_FILE)) {
      const data = fs.readFileSync(WATCH_HISTORY_FILE, 'utf8');
      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error('Error parsing watch history file (invalid JSON):', parseError);
        // Create a backup of the corrupted file
        const backupPath = `${WATCH_HISTORY_FILE}.corrupted.${Date.now()}.bak`;
        fs.copyFileSync(WATCH_HISTORY_FILE, backupPath);
        console.log(`Created backup of corrupted file at ${backupPath}`);
        return [];
      }
    }
    console.log('Watch history file does not exist, creating new one');
    return [];
  } catch (err) {
    console.error('Error reading watch history file:', err);
    return [];
  }
};

// Write watch history to file
const writeWatchHistory = (history: WatchHistoryItem[]): boolean => {
  try {
    // Create a backup before writing
    if (fs.existsSync(WATCH_HISTORY_FILE)) {
      const backupPath = `${WATCH_HISTORY_FILE}.bak`;
      fs.copyFileSync(WATCH_HISTORY_FILE, backupPath);
    }
    
    // Format with indentation for readability
    fs.writeFileSync(WATCH_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing watch history file:', err);
    return false;
  }
};

// GET handler for retrieving watch history
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const history = readWatchHistory();
    
    // Filter history by user ID
    const userHistory = history.filter(item => item.userId === userId);
    
    return NextResponse.json(userHistory);
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watch history' },
      { status: 500 }
    );
  }
}

// POST handler for adding an item to watch history
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const data = await request.json();
    
    // Validate required fields
    if (!data.contentType || !data.contentId || !data.contentName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Read current history first to check for duplicates
    let history = readWatchHistory();
    
    // Check for exact duplicates before creating a new entry
    const exactDuplicate = history.find(item => 
      item.userId === userId && 
      item.contentType === data.contentType && 
      item.contentId === data.contentId &&
      (data.contentType === 'movie' || 
        (item.seasonNumber === data.seasonNumber && 
         item.episodeNumber === data.episodeNumber))
    );
    
    // If it's an exact duplicate that was added within the last minute, don't add it again
    if (exactDuplicate && new Date().getTime() - new Date(exactDuplicate.watchedAt).getTime() < 60000) {
      console.log(`Skipping duplicate watch history entry (added within the last minute): ${data.contentType} - ${data.contentName}${data.contentType === 'tvshow' ? ` S${data.seasonNumber}E${data.episodeNumber}` : ''}`);
      return NextResponse.json(
        { message: 'Watch history already updated recently', item: exactDuplicate },
        { status: 200 }
      );
    }
    
    // Create new history item
    const newItem: WatchHistoryItem = {
      id: uuidv4(),
      userId,
      contentType: data.contentType,
      contentId: data.contentId,
      contentName: data.contentName,
      posterPath: data.posterPath || null,
      seasonNumber: data.seasonNumber,
      episodeNumber: data.episodeNumber,
      episodeName: data.episodeName,
      watchedAt: new Date().toISOString()
    };
    
    console.log(`Adding item to watch history: ${data.contentType} - ${data.contentName}${data.contentType === 'tvshow' ? ` S${data.seasonNumber}E${data.episodeNumber}` : ''}`);
    console.log(`Current history length: ${history.length}`);
    
    // Find and remove existing entries based on content type
    if (data.contentType === 'movie') {
      // For movies, remove exact matches (same movie)
      const movieIndices = history
        .map((item, index) => 
          (item.userId === userId && 
           item.contentType === 'movie' && 
           item.contentId === data.contentId) ? index : -1
        )
        .filter(index => index !== -1);
      
      console.log(`Found ${movieIndices.length} existing entries for this movie`);
      
      // Remove all previous entries for this movie (from last to first to maintain correct indices)
      for (let i = movieIndices.length - 1; i >= 0; i--) {
        history.splice(movieIndices[i], 1);
      }
    } else if (data.contentType === 'tvshow') {
      // For TV shows, remove any episode from the same show (same contentId)
      // This ensures only the most recent episode of a series appears in history
      const tvIndices = history
        .map((item, index) => 
          (item.userId === userId && 
           item.contentType === 'tvshow' && 
           item.contentId === data.contentId) ? index : -1
        )
        .filter(index => index !== -1);
      
      console.log(`Found ${tvIndices.length} existing entries for this TV show`);
      
      // Remove all previous entries for this TV show (from last to first to maintain correct indices)
      for (let i = tvIndices.length - 1; i >= 0; i--) {
        history.splice(tvIndices[i], 1);
      }
    }
    
    // Add new item to the beginning (most recent)
    history.unshift(newItem);
    
    // Limit history to last 50 items per user
    const userHistoryCount = history.filter(item => item.userId === userId).length;
    if (userHistoryCount > 50) {
      // Find indices of user's history items
      const userIndices = history
        .map((item, index) => item.userId === userId ? index : -1)
        .filter(index => index !== -1)
        .slice(50); // Get indices beyond the 50th item
        
      // Remove excess items (from oldest to newest)
      for (let i = userIndices.length - 1; i >= 0; i--) {
        history.splice(userIndices[i], 1);
      }
    }
    
    // Save updated history
    const writeSuccess = writeWatchHistory(history);
    
    if (!writeSuccess) {
      return NextResponse.json(
        { error: 'Failed to write watch history file' },
        { status: 500 }
      );
    }
    
    console.log(`Updated watch history. New length: ${history.length}`);
    
    return NextResponse.json(
      { message: 'Watch history updated', item: newItem },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating watch history:', error);
    return NextResponse.json(
      { error: 'Failed to update watch history' },
      { status: 500 }
    );
  }
}

// DELETE handler for removing items from watch history
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';
    
    const history = readWatchHistory();
    
    if (clearAll) {
      // Remove all items for this user
      const newHistory = history.filter(item => item.userId !== userId);
      writeWatchHistory(newHistory);
      
      return NextResponse.json(
        { message: 'Watch history cleared' },
        { status: 200 }
      );
    } else if (itemId) {
      // Remove specific item
      const newHistory = history.filter(
        item => !(item.id === itemId && item.userId === userId)
      );
      
      if (newHistory.length === history.length) {
        return NextResponse.json(
          { error: 'Item not found or not authorized to delete' },
          { status: 404 }
        );
      }
      
      writeWatchHistory(newHistory);
      
      return NextResponse.json(
        { message: 'Item removed from watch history' },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: 'Missing id parameter or clearAll flag' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error deleting from watch history:', error);
    return NextResponse.json(
      { error: 'Failed to delete from watch history' },
      { status: 500 }
    );
  }
} 