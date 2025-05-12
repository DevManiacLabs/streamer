/**
 * Utility script to clean up duplicate entries in the watch history file
 * 
 * This script reads the watch history file, removes duplicate entries for the same content,
 * and writes the cleaned data back to the file.
 */

import fs from 'fs';
import path from 'path';

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

const WATCH_HISTORY_FILE = path.join(process.cwd(), 'dev-watch-history.json');

function readWatchHistory(): WatchHistoryItem[] {
  try {
    if (fs.existsSync(WATCH_HISTORY_FILE)) {
      const data = fs.readFileSync(WATCH_HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading watch history file:', err);
  }
  return [];
}

function writeWatchHistory(history: WatchHistoryItem[]): void {
  try {
    // Create a backup before writing
    if (fs.existsSync(WATCH_HISTORY_FILE)) {
      const backupPath = `${WATCH_HISTORY_FILE}.bak`;
      fs.copyFileSync(WATCH_HISTORY_FILE, backupPath);
      console.log(`Created backup at ${backupPath}`);
    }
    
    fs.writeFileSync(WATCH_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8');
    console.log(`Successfully wrote ${history.length} items to ${WATCH_HISTORY_FILE}`);
  } catch (err) {
    console.error('Error writing watch history file:', err);
  }
}

function cleanWatchHistory(): void {
  console.log('Starting watch history cleanup...');
  
  // Read current history
  const history = readWatchHistory();
  console.log(`Read ${history.length} items from watch history file`);
  
  // Group by user and content identifier (contentType + contentId)
  const groupedEntries = new Map<string, WatchHistoryItem[]>();
  
  history.forEach(item => {
    const key = `${item.userId}-${item.contentType}-${item.contentId}`;
    if (!groupedEntries.has(key)) {
      groupedEntries.set(key, []);
    }
    groupedEntries.get(key)?.push(item);
  });
  
  // Filter to keep only the most recent entry for each group
  let cleanedHistory: WatchHistoryItem[] = [];
  let duplicatesRemoved = 0;
  
  groupedEntries.forEach((items, key) => {
    if (items.length > 1) {
      // Sort by watchedAt descending (most recent first)
      items.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
      cleanedHistory.push(items[0]);
      duplicatesRemoved += (items.length - 1);
      console.log(`Found ${items.length} entries for ${items[0].contentName}, keeping only the most recent (${items[0].contentType === 'tvshow' ? `S${items[0].seasonNumber}E${items[0].episodeNumber}` : 'movie'})`);
    } else {
      cleanedHistory.push(items[0]);
    }
  });
  
  // Sort by watchedAt descending (most recent first)
  cleanedHistory.sort((a, b) => new Date(b.watchedAt).getTime() - new Date(a.watchedAt).getTime());
  
  console.log(`Removed ${duplicatesRemoved} duplicate entries`);
  console.log(`Cleaned history has ${cleanedHistory.length} entries (${history.length - cleanedHistory.length} total entries removed)`);
  
  // Write cleaned history back to file
  writeWatchHistory(cleanedHistory);
  console.log('Watch history cleanup complete!');
}

// Run the cleanup script
cleanWatchHistory(); 