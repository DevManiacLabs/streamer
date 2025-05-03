'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useLatestMovies, useLatestTVShows, useLatestEpisodes } from '@/hooks/useVidSrc';
import Link from 'next/link';

// Dashboard component
export default function Dashboard() {
  return (
    <ProtectedRoute adminOnly>
      <DashboardContent />
    </ProtectedRoute>
  );
}

// The actual dashboard content
function DashboardContent() {
  const [apiStatus, setApiStatus] = useState<{
    movies: 'loading' | 'success' | 'error';
    tvshows: 'loading' | 'success' | 'error';
    episodes: 'loading' | 'success' | 'error';
  }>({
    movies: 'loading',
    tvshows: 'loading',
    episodes: 'loading',
  });

  const [latestFetch, setLatestFetch] = useState<string>('Never');

  // Fetch data
  const { data: moviesData, isLoading: moviesLoading, isError: moviesError } = useLatestMovies(1, {
    refetchOnWindowFocus: false,
  });

  const { data: tvShowsData, isLoading: tvShowsLoading, isError: tvShowsError } = useLatestTVShows(1, {
    refetchOnWindowFocus: false,
  });

  const { data: episodesData, isLoading: episodesLoading, isError: episodesError } = useLatestEpisodes(1, {
    refetchOnWindowFocus: false,
  });

  // Update API status based on data fetch state
  useEffect(() => {
    setApiStatus({
      movies: moviesLoading ? 'loading' : moviesError ? 'error' : 'success',
      tvshows: tvShowsLoading ? 'loading' : tvShowsError ? 'error' : 'success',
      episodes: episodesLoading ? 'loading' : episodesError ? 'error' : 'success',
    });
    
    if (!moviesLoading && !tvShowsLoading && !episodesLoading) {
      setLatestFetch(new Date().toLocaleString());
    }
  }, [
    moviesLoading, moviesError, 
    tvShowsLoading, tvShowsError, 
    episodesLoading, episodesError
  ]);

  // Calculate statistics
  const totalMovies = moviesData?.result?.length || 0;
  const totalMoviePages = moviesData?.pages || 0;
  const totalTvShows = tvShowsData?.result?.length || 0;
  const totalTvShowPages = tvShowsData?.pages || 0;
  const totalEpisodes = episodesData?.result?.length || 0;
  const totalEpisodePages = episodesData?.pages || 0;

  const getStatusBadgeClass = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500';
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Monitor API data and system performance
        </p>
      </div>

      {/* API Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">API Status</h2>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Movies API</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(apiStatus.movies)}`}>
                {apiStatus.movies.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {apiStatus.movies === 'loading' ? (
                'Fetching data...'
              ) : apiStatus.movies === 'error' ? (
                'Failed to fetch data'
              ) : (
                <>Data loaded successfully</>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">TV Shows API</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(apiStatus.tvshows)}`}>
                {apiStatus.tvshows.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {apiStatus.tvshows === 'loading' ? (
                'Fetching data...'
              ) : apiStatus.tvshows === 'error' ? (
                'Failed to fetch data'
              ) : (
                <>Data loaded successfully</>
              )}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Episodes API</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(apiStatus.episodes)}`}>
                {apiStatus.episodes.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {apiStatus.episodes === 'loading' ? (
                'Fetching data...'
              ) : apiStatus.episodes === 'error' ? (
                'Failed to fetch data'
              ) : (
                <>Data loaded successfully</>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Last Updated: {latestFetch}
        </div>
      </div>

      {/* Data Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Data Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold">
              {totalMovies}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Movies (Current Page)
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold">
              {totalMoviePages}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Movie Pages
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold">
              {totalTvShows}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              TV Shows (Current Page)
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold">
              {totalTvShowPages}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total TV Show Pages
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold">
              {totalEpisodes}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Episodes (Current Page)
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold">
              {totalEpisodePages}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Episode Pages
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold">
              {totalMoviePages ? (totalMoviePages * totalMovies) : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Estimated Total Movies
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-center">
            <div className="text-3xl font-bold">
              {totalTvShowPages ? (totalTvShowPages * totalTvShows) : 0}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Estimated Total TV Shows
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Content</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Latest Movies</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      IMDB ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Quality
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {moviesLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : moviesData?.result && moviesData.result.length > 0 ? (
                    moviesData.result.slice(0, 5).map((movie) => (
                      <tr key={movie.imdb_id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {movie.title}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {movie.imdb_id}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            {movie.quality}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <Link
                            href={`/movie/${movie.imdb_id}`}
                            target="_blank"
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                        No movies found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <Link 
                href="/admin/movies" 
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all movies →
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Latest TV Shows</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse table-auto">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      IMDB ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tvShowsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : tvShowsData?.result && tvShowsData.result.length > 0 ? (
                    tvShowsData.result.slice(0, 5).map((show) => (
                      <tr key={show.imdb_id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                          {show.title}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {show.imdb_id}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          <Link
                            href={`/tv/${show.imdb_id}`}
                            target="_blank"
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                        No TV shows found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-right">
              <Link 
                href="/admin/tvshows" 
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all TV shows →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 