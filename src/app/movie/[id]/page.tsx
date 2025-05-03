'use client';

import { useMovieDetails } from "@/hooks/useTMDB";
import { getMovieEmbedUrl } from "@/api/vidsrc";
import { getPosterUrl, getBackdropUrl } from "@/api/tmdb";
import { useEffect, useState } from "react";
import { useWatchHistory } from "@/hooks/useWatchHistory";

export default function MoviePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: movie, isLoading } = useMovieDetails(parseInt(id));
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { addToHistory, isAuthenticated } = useWatchHistory();

  useEffect(() => {
    if (movie) {
      const url = getMovieEmbedUrl(movie.id.toString());
      setEmbedUrl(url);
    }
  }, [movie]);

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 bg-gray-800 rounded w-48 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold">Movie not found</h1>
      </div>
    );
  }

  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handlePlayClick = () => {
    setIsPlaying(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Add to watch history if user is authenticated
    if (isAuthenticated && movie) {
      addToHistory.mutate({
        contentType: 'movie',
        contentId: movie.id.toString(),
        contentName: movie.title,
        posterPath: movie.poster_path
      });
    }
  };

  return (
    <div className="w-full">
      {isPlaying && embedUrl ? (
        <div className="w-full bg-black pt-[56.25%] relative">
          <iframe
            src={embedUrl}
            className="absolute top-0 left-0 w-full h-full"
            allowFullScreen
          ></iframe>
        </div>
      ) : (
        <div className="relative w-full h-[70vh]">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${getBackdropUrl(movie.backdrop_path)})`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          
          <div className="relative h-full container mx-auto flex flex-col justify-end pb-16 px-4 md:px-8">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">{movie.title}</h1>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6 text-sm text-white/70">
                <span>{new Date(movie.release_date).getFullYear()}</span>
                {movie.runtime && <span>{formatRuntime(movie.runtime)}</span>}
                <span>{movie.vote_average.toFixed(1)} ★</span>
                <span className="uppercase">{movie.original_language}</span>
              </div>
              
              <p className="text-lg text-white/90 mb-8 max-w-2xl line-clamp-3 md:line-clamp-none">{movie.overview}</p>
              
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={handlePlayClick}
                  className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-medium rounded gap-2 hover:bg-white/90 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Play
                </button>
                
                <button 
                  className="inline-flex items-center justify-center px-8 py-3 bg-gray-600/80 text-white font-medium rounded gap-2 hover:bg-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                  </svg>
                  My List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">About this movie</h2>
            <p className="text-white/80 mb-6">{movie.overview}</p>
            
            {movie.genres && movie.genres.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((genre: any) => (
                    <span key={genre.id} className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Movie Info</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="text-white/60 w-24">Release Date:</span>
                  <span>{new Date(movie.release_date).toLocaleDateString()}</span>
                </div>
                
                {movie.runtime && (
                  <div className="flex">
                    <span className="text-white/60 w-24">Runtime:</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                  </div>
                )}
                
                <div className="flex">
                  <span className="text-white/60 w-24">Rating:</span>
                  <span>{movie.vote_average.toFixed(1)} ★ ({movie.vote_count} votes)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 