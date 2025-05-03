'use client';

import { usePopularMovies, usePopularTVShows } from "@/hooks/useTMDB";
import { Card } from "@/components/ui/Card";
import { getPosterUrl, getBackdropUrl } from "@/api/tmdb";
import { useState, useRef } from "react";
import { Movie, TVShow } from "@/types/tmdb";
import Link from "next/link";
import { ContinueWatching } from "@/components/features/ContinueWatching";

export default function HomePage() {
  const [moviesPage, setMoviesPage] = useState(1);
  const [tvPage, setTVPage] = useState(1);

  const { data: moviesData, isLoading: isLoadingMovies } = usePopularMovies(moviesPage, {
    refetchOnWindowFocus: false,
  });

  const { data: tvData, isLoading: isLoadingTV } = usePopularTVShows(tvPage, {
    refetchOnWindowFocus: false,
  });

  const movies = moviesData?.content || [];
  const tvShows = tvData?.content || [];
  const moviesTotalPages = moviesData?.totalPages || 0;
  const tvTotalPages = tvData?.totalPages || 0;

  return (
    <div className="w-full">
      {/* Hero Section */}
      {movies.length > 0 && (
        <section className="relative w-full h-[85vh]">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${getBackdropUrl(movies[0].backdrop_path)})`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
          </div>
          <div className="relative h-full container mx-auto flex flex-col justify-end pb-24 px-4 md:px-8">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">{movies[0].title}</h1>
              <p className="text-xl text-white/80 mb-8 line-clamp-3 md:line-clamp-none max-w-lg">{movies[0].overview}</p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href={`/movie/${movies[0].id}`}
                  className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-medium rounded gap-2 hover:bg-white/90 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Play
                </Link>
                <button 
                  className="inline-flex items-center justify-center px-8 py-3 bg-gray-600/80 text-white font-medium rounded gap-2 hover:bg-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  More Info
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="bg-gradient-to-b from-black/40 to-black relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Continue Watching Section */}
          <ContinueWatching />

          {/* Popular Movies Section */}
          <section className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Popular Movies</h2>
              <Link href="/movies" className="text-sm text-white/70 hover:text-white transition-colors">
                View All
              </Link>
            </div>
            
            {isLoadingMovies ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="aspect-[2/3] rounded-md bg-gray-800 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="relative -mx-4">
                <div className="flex overflow-x-auto scrollbar-hide gap-4 px-4 pb-8 row-container">
                  {movies.map((movie: Movie) => (
                    <div key={movie.id} className="flex-none w-[180px] md:w-[200px]">
                      <Card
                        id={movie.id.toString()}
                        title={movie.title}
                        type="movie"
                        posterUrl={getPosterUrl(movie.poster_path)}
                        rating={movie.vote_average}
                        releaseDate={movie.release_date}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Popular TV Shows Section */}
          <section className="mb-16">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Popular TV Shows</h2>
              <Link href="/tv" className="text-sm text-white/70 hover:text-white transition-colors">
                View All
              </Link>
            </div>
            
            {isLoadingTV ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="aspect-[2/3] rounded-md bg-gray-800 animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="relative -mx-4">
                <div className="flex overflow-x-auto scrollbar-hide gap-4 px-4 pb-8 row-container">
                  {tvShows.map((show: TVShow) => (
                    <div key={show.id} className="flex-none w-[180px] md:w-[200px]">
                      <Card
                        id={show.id.toString()}
                        title={show.name}
                        type="tvshow"
                        posterUrl={getPosterUrl(show.poster_path)}
                        rating={show.vote_average}
                        releaseDate={show.first_air_date}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
