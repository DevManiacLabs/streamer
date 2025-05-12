import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { API_CONFIG, CACHE_CONFIG } from "@/lib/config";

/**
 * Watch history item representing a movie or TV show episode that a user has watched
 */
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

/**
 * Payload for adding an item to watch history
 */
export type AddToHistoryPayload = Omit<WatchHistoryItem, 'id' | 'userId' | 'watchedAt'>;

// Query keys for watch history
const watchHistoryKeys = {
  all: ['watchHistory'] as const,
};

/**
 * Hook for fetching and managing watch history
 */
export function useWatchHistory() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const isAuthenticated = status === 'authenticated';
  const endpoint = API_CONFIG.INTERNAL.WATCH_HISTORY_ENDPOINT;

  // Fetch watch history
  const { 
    data: watchHistory = [], 
    isLoading, 
    isError,
    error 
  } = useQuery<WatchHistoryItem[]>({
    queryKey: watchHistoryKeys.all,
    queryFn: async () => {
      if (!isAuthenticated) return [];
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch watch history: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: CACHE_CONFIG.DEFAULT.staleTime,
    gcTime: CACHE_CONFIG.DEFAULT.gcTime,
    refetchOnWindowFocus: false,  // Prevent refetching on window focus
    refetchOnMount: true,         // Fetch on mount but not on every mount
  });

  // Add item to watch history with optimistic updates
  const addToHistory = useMutation({
    mutationFn: async (item: AddToHistoryPayload) => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update watch history: ${response.status}`);
      }
      
      return response.json();
    },
    onMutate: async (newItem) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: watchHistoryKeys.all });
      
      // Snapshot the previous value
      const previousHistory = queryClient.getQueryData<WatchHistoryItem[]>(watchHistoryKeys.all) || [];
      
      if (!session?.user?.id) return { previousHistory };
      
      // Optimistically update the history by creating a temporary item
      const optimisticItem: WatchHistoryItem = {
        id: `temp-${Date.now()}`, // Temporary ID
        userId: session.user.id,
        contentType: newItem.contentType,
        contentId: newItem.contentId,
        contentName: newItem.contentName,
        posterPath: newItem.posterPath,
        seasonNumber: newItem.seasonNumber,
        episodeNumber: newItem.episodeNumber,
        episodeName: newItem.episodeName,
        watchedAt: new Date().toISOString(),
      };
      
      // Filter out any existing items of the same content (same behavior as the API)
      const filteredHistory = previousHistory.filter(item => 
        !(item.userId === optimisticItem.userId && 
          item.contentType === optimisticItem.contentType && 
          item.contentId === optimisticItem.contentId)
      );
      
      // Insert optimistic item at the beginning
      const updatedHistory = [optimisticItem, ...filteredHistory];
      
      queryClient.setQueryData(watchHistoryKeys.all, updatedHistory);
      
      return { previousHistory };
    },
    onError: (err, newItem, context) => {
      // If the mutation fails, revert back to the previous state
      if (context?.previousHistory) {
        queryClient.setQueryData(watchHistoryKeys.all, context.previousHistory);
      }
    },
    onSettled: () => {
      // Always invalidate to ensure data consistency, but with a delay
      // This prevents multiple immediate refetches
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: watchHistoryKeys.all });
      }, 300);
    },
  });

  // Remove item from watch history
  const removeFromHistory = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`${endpoint}?id=${itemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove item from watch history: ${response.status}`);
      }
      
      return response.json();
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: watchHistoryKeys.all });
      const previousHistory = queryClient.getQueryData<WatchHistoryItem[]>(watchHistoryKeys.all) || [];
      
      const updatedHistory = previousHistory.filter(item => item.id !== itemId);
      queryClient.setQueryData(watchHistoryKeys.all, updatedHistory);
      
      return { previousHistory };
    },
    onError: (err, itemId, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(watchHistoryKeys.all, context.previousHistory);
      }
    },
    onSettled: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: watchHistoryKeys.all });
      }, 300);
    },
  });

  // Clear all watch history
  const clearHistory = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${endpoint}?clearAll=true`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear watch history: ${response.status}`);
      }
      
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: watchHistoryKeys.all });
      const previousHistory = queryClient.getQueryData<WatchHistoryItem[]>(watchHistoryKeys.all) || [];
      
      queryClient.setQueryData(watchHistoryKeys.all, []);
      
      return { previousHistory };
    },
    onError: (err, _, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(watchHistoryKeys.all, context.previousHistory);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: watchHistoryKeys.all });
    },
  });

  // Helper function to get the latest watched item for continuing
  const getLastWatched = (type?: 'movie' | 'tvshow') => {
    if (watchHistory.length === 0) return null;
    
    if (type) {
      const filtered = watchHistory.filter(item => item.contentType === type);
      return filtered.length > 0 ? filtered[0] : null;
    }
    
    return watchHistory[0];
  };

  // Helper to check if an item is in watch history
  const isInWatchHistory = (
    contentId: string, 
    contentType: 'movie' | 'tvshow', 
    seasonNumber?: number, 
    episodeNumber?: number
  ) => {
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
    if (contentType === 'movie') {
      return watchHistory.find(item => 
        item.contentId === contentId && item.contentType === 'movie'
      );
    } else {
      // For TV shows, find the most recently watched episode
      // Since the watchHistory array is already sorted by watchedAt (newest first),
      // we can just take the first match
      return watchHistory.find(item => 
        item.contentId === contentId && item.contentType === 'tvshow'
      );
    }
  };

  return {
    watchHistory,
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