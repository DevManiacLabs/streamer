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
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading watch history file:', err);
  }
  return [];
};

// Write watch history to file
const writeWatchHistory = (history: WatchHistoryItem[]) => {
  try {
    fs.writeFileSync(WATCH_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing watch history file:', err);
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
    
    // Read current history
    const history = readWatchHistory();
    
    // Find and remove any existing entry for the same content
    const existingItemIndex = history.findIndex(
      item => item.userId === userId && 
      item.contentType === data.contentType && 
      item.contentId === data.contentId &&
      (data.contentType === 'movie' || 
        (item.seasonNumber === data.seasonNumber && 
         item.episodeNumber === data.episodeNumber))
    );
    
    if (existingItemIndex !== -1) {
      history.splice(existingItemIndex, 1);
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
    writeWatchHistory(history);
    
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