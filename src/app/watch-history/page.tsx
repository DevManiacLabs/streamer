'use client';

import { useWatchHistory } from '@/hooks/useWatchHistory';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

// Static export to avoid prerendering
export const dynamic = 'force-dynamic';

// Loading skeleton component
function WatchHistorySkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Watch History</h1>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-zinc-800 rounded-lg p-4 animate-pulse h-24"></div>
        ))}
      </div>
    </div>
  );
}

// Main content component
function WatchHistoryContent() {
  const { watchHistory, isLoading, removeFromHistory, clearHistory, isAuthenticated } = useWatchHistory();
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  // Use useEffect for navigation to avoid issues during static generation
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login?callbackUrl=/watch-history');
    }
  }, [isAuthenticated, router]);

  // If authentication is still loading or we've determined user is not authenticated, show loading
  if (isLoading || isAuthenticated === false) {
    return <WatchHistorySkeleton />;
  }

  const handleClearHistory = async () => {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to clear your watch history?')) {
      setIsClearing(true);
      try {
        await clearHistory.mutateAsync();
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleRemoveItem = async (id: string) => {
    await removeFromHistory.mutateAsync(id);
  };

  // No history items
  if (!watchHistory || watchHistory.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Watch History</h1>
        <div className="bg-zinc-900 rounded-lg p-8 text-center">
          <h2 className="text-xl font-medium mb-2">Your watch history is empty</h2>
          <p className="text-gray-400 mb-6">Start watching movies and TV shows to build your history</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white font-medium rounded gap-2 hover:bg-red-700 transition-colors"
          >
            Discover content
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Watch History</h1>
        <button
          onClick={handleClearHistory}
          disabled={isClearing || watchHistory.length === 0}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isClearing ? 'Clearing...' : 'Clear History'}
        </button>
      </div>

      <div className="space-y-4">
        {watchHistory.map((item) => (
          <div key={item.id} className="bg-zinc-900 rounded-lg overflow-hidden">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-48 h-32 sm:h-auto relative">
                {item.posterPath ? (
                  <Image
                    src={`https://image.tmdb.org/t/p/w300${item.posterPath}`}
                    alt={item.contentName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
                    <span className="text-2xl font-medium">{item.contentName.substring(0, 1)}</span>
                  </div>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-medium mb-1">{item.contentName}</h2>
                      <div className="flex items-center text-sm text-gray-400 space-x-3">
                        <span>
                          {item.contentType === 'movie' ? 'Movie' : 'TV Show'}
                        </span>
                        {item.contentType === 'tvshow' && item.seasonNumber && item.episodeNumber && (
                          <span>• Season {item.seasonNumber}, Episode {item.episodeNumber}</span>
                        )}
                        {item.episodeName && (
                          <span>• {item.episodeName}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-gray-400 hover:text-white p-1"
                      aria-label="Remove from history"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-400">
                    Watched {formatDistanceToNow(new Date(item.watchedAt), { addSuffix: true })}
                  </div>
                  <Link
                    href={item.contentType === 'movie' 
                      ? `/movie/${item.contentId}`
                      : `/tv/${item.contentId}${item.seasonNumber && item.episodeNumber 
                          ? `/season/${item.seasonNumber}/episode/${item.episodeNumber}`
                          : ''}`
                    }
                    className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
                  >
                    {item.contentType === 'movie' ? 'Watch Movie' : 'Continue Watching'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main export with suspense boundary
export default function WatchHistoryPage() {
  return (
    <Suspense fallback={<WatchHistorySkeleton />}>
      <WatchHistoryContent />
    </Suspense>
  );
} 