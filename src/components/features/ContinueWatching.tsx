'use client';

import { useWatchHistory, WatchHistoryItem } from '@/hooks/useWatchHistory';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export function ContinueWatching() {
  const { watchHistory, isLoading, isAuthenticated } = useWatchHistory();
  
  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }
  
  // No items to show
  if (!isLoading && (!watchHistory || watchHistory.length === 0)) {
    return null;
  }
  
  // Generate the URL for a specific item
  const getItemUrl = (item: WatchHistoryItem) => {
    if (item.contentType === 'movie') {
      return `/movie/${item.contentId}`;
    } else {
      // TV Show with season and episode
      if (item.seasonNumber && item.episodeNumber) {
        return `/tv/${item.contentId}/season/${item.seasonNumber}/episode/${item.episodeNumber}`;
      }
      // Default to show page
      return `/tv/${item.contentId}`;
    }
  };

  // Show a loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <section className="py-6">
        <h2 className="text-2xl font-bold mb-4">Continue Watching</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div 
              key={i} 
              className="aspect-video bg-gray-800 animate-pulse rounded"
            />
          ))}
        </div>
      </section>
    );
  }

  // Limit to 6 most recent items
  const recentItems = watchHistory.slice(0, 6);

  return (
    <section className="py-6">
      <h2 className="text-2xl font-bold mb-4">Continue Watching</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {recentItems.map((item) => (
          <Link 
            key={item.id} 
            href={getItemUrl(item)}
            className="block group relative aspect-video bg-gray-900 rounded-md overflow-hidden"
          >
            {item.posterPath ? (
              <Image
                src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                alt={item.contentName}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <span className="text-lg font-medium">{item.contentName.substring(0, 1)}</span>
              </div>
            )}
            
            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black via-black/90 to-transparent">
              <h3 className="text-sm font-medium text-white line-clamp-1">
                {item.contentName}
              </h3>
              
              <div className="flex justify-between items-center mt-1">
                <div className="text-xs text-gray-400">
                  {item.contentType === 'tvshow' && item.seasonNumber && item.episodeNumber && (
                    <span>S{item.seasonNumber} E{item.episodeNumber}</span>
                  )}
                  {item.contentType === 'movie' && (
                    <span>Movie</span>
                  )}
                </div>
                
                <div className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(item.watchedAt), { addSuffix: true })}
                </div>
              </div>
              
              <div className="mt-2 flex items-center">
                <div className="w-full bg-gray-700 rounded-full h-1">
                  <div className="bg-red-600 h-1 rounded-full w-1/3"></div>
                </div>
              </div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40">
              <div className="bg-red-600 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
} 