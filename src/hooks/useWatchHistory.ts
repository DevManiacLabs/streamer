import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export interface WatchHistoryItem {
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

// Hook for fetching and managing watch history
export function useWatchHistory() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const isAuthenticated = status === 'authenticated';

  // Fetch watch history
  const { data: watchHistory, isLoading, isError, error } = useQuery<WatchHistoryItem[]>({
    queryKey: ['watchHistory'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      
      const response = await fetch('/api/watch-history');
      if (!response.ok) {
        throw new Error('Failed to fetch watch history');
      }
      return response.json();
    },
    // Don't fetch if not authenticated
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  });

  // Add item to watch history
  const addToHistory = useMutation({
    mutationFn: async (item: Omit<WatchHistoryItem, 'id' | 'userId' | 'watchedAt'>) => {
      const response = await fetch('/api/watch-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update watch history');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
    },
  });

  // Remove item from watch history
  const removeFromHistory = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/watch-history?id=${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove item from watch history');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
    },
  });

  // Clear all watch history
  const clearHistory = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/watch-history?clearAll=true', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to clear watch history');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchHistory'] });
    },
  });

  // Helper function to get the latest watched item for continuing
  const getLastWatched = (type?: 'movie' | 'tvshow') => {
    if (!watchHistory || watchHistory.length === 0) return null;
    
    if (type) {
      const filtered = watchHistory.filter(item => item.contentType === type);
      return filtered.length > 0 ? filtered[0] : null;
    }
    
    return watchHistory[0];
  };

  // Helper to check if an item is in watch history
  const isInWatchHistory = (contentId: string, contentType: 'movie' | 'tvshow', seasonNumber?: number, episodeNumber?: number) => {
    if (!watchHistory) return false;
    
    return watchHistory.some(item => 
      item.contentId === contentId && 
      item.contentType === contentType &&
      (contentType === 'movie' || 
        (seasonNumber === item.seasonNumber && 
         episodeNumber === item.episodeNumber))
    );
  };

  // Find a specific item in watch history
  const findInWatchHistory = (contentId: string, contentType: 'movie' | 'tvshow') => {
    if (!watchHistory) return null;
    
    if (contentType === 'movie') {
      return watchHistory.find(item => 
        item.contentId === contentId && item.contentType === 'movie'
      );
    } else {
      // For TV shows, find the most recently watched episode
      const tvEntries = watchHistory.filter(item => 
        item.contentId === contentId && item.contentType === 'tvshow'
      );
      
      return tvEntries.length > 0 ? tvEntries[0] : null;
    }
  };

  return {
    watchHistory: watchHistory || [],
    isLoading,
    isError,
    error,
    addToHistory,
    removeFromHistory,
    clearHistory,
    getLastWatched,
    isInWatchHistory,
    findInWatchHistory,
    isAuthenticated
  };
} 