'use client';

import { usePopularMovies, usePopularTVShows } from "@/hooks/useTMDB";
import { Card } from "@/components/ui/Card";
import { getPosterUrl, getBackdropUrl } from "@/api/tmdb";
import { useState } from "react";
import { Movie, TVShow, SearchResponse } from "@/types/tmdb";
import Link from "next/link";
import { ContinueWatching } from "@/components/features/ContinueWatching";
import { ROUTE_CONFIG } from "@/lib/config";
import { truncateText } from "@/lib/utils";

/**
 * HeroSection component displays the featured movie at the top of the homepage
 */
const HeroSection = ({ movie }: { movie: Movie }) => {
  if (!movie) return null;
  
  return (
    <section className="relative w-full h-[85vh]" aria-labelledby="hero-title">
      {/* Background image with gradient overlays */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${getBackdropUrl(movie.backdrop_path)})` }}
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      </div>
      
      {/* Content overlay */}
      <div className="relative h-full container mx-auto flex flex-col justify-end pb-24 px-4 md:px-8">
        <div className="max-w-2xl">
          <h1 id="hero-title" className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4">
            {movie.title}
          </h1>
          <p className="text-xl text-white/80 mb-8 line-clamp-3 md:line-clamp-none max-w-lg">
            {truncateText(movie.overview, 200)}
          </p>
          
          {/* Action buttons */}
          <div className="flex flex-wrap gap-4">
            <Link 
              href={ROUTE_CONFIG.MOVIES.DETAILS(movie.id.toString())}
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-black font-medium rounded gap-2 hover:bg-white/90 transition-colors"
            >
              <PlayIcon />
              Play
            </Link>
            <button 
              className="inline-flex items-center justify-center px-8 py-3 bg-gray-600/80 text-white font-medium rounded gap-2 hover:bg-gray-600 transition-colors"
              aria-label="More information about this movie"
            >
              <InfoIcon />
              More Info
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * ContentRow component for displaying horizontal scrollable content
 */
const ContentRow = <T extends Movie | TVShow>({
  title,
  items,
  isLoading,
  viewAllLink,
  type
}: {
  title: string;
  items: T[];
  isLoading: boolean;
  viewAllLink: string;
  type: "movie" | "tvshow";
}) => {
  return (
    <section className="mb-16" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}>
      <div className="flex justify-between items-center mb-6">
        <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`} className="text-2xl font-bold">{title}</h2>
        <Link href={viewAllLink} className="text-sm text-white/70 hover:text-white transition-colors">
          View All
        </Link>
      </div>
      
      {isLoading ? (
        <LoadingSkeletons />
      ) : (
        <div className="relative -mx-4">
          <div className="flex overflow-x-auto scrollbar-hide gap-4 px-4 pb-8 row-container">
            {items.map((item) => (
              <div key={item.id} className="flex-none w-[180px] md:w-[200px]">
                <Card
                  id={item.id.toString()}
                  title={type === "movie" ? (item as Movie).title : (item as TVShow).name}
                  type={type}
                  posterUrl={getPosterUrl(item.poster_path)}
                  rating={item.vote_average}
                  releaseDate={type === "movie" ? (item as Movie).release_date : (item as TVShow).first_air_date}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

/**
 * Loading skeleton placeholder for content rows
 */
const LoadingSkeletons = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="aspect-[2/3] rounded-md bg-gray-800 animate-pulse"></div>
    ))}
  </div>
);

/**
 * Icon components for better readability
 */
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);

/**
 * HomePage component - the main entry point for the application
 */
export default function HomePage() {
  const [moviesPage, setMoviesPage] = useState(1);
  const [tvPage, setTVPage] = useState(1);

  // Fetch popular movies with React Query
  const { 
    data: moviesData, 
    isLoading: isLoadingMovies 
  } = usePopularMovies(moviesPage, {
    refetchOnWindowFocus: false,
  });

  // Fetch popular TV shows with React Query
  const { 
    data: tvData, 
    isLoading: isLoadingTV 
  } = usePopularTVShows(tvPage, {
    refetchOnWindowFocus: false,
  });

  // Extract and provide fallbacks for content
  const movies = (moviesData as SearchResponse<Movie> | undefined)?.content || [];
  const tvShows = (tvData as SearchResponse<TVShow> | undefined)?.content || [];
  const featuredMovie = movies[0];

  return (
    <div className="w-full">
      {/* Hero Section - Featured Movie */}
      {movies.length > 0 && <HeroSection movie={featuredMovie} />}

      {/* Content Sections */}
      <div className="bg-gradient-to-b from-black/40 to-black relative z-10">
        <div className="container mx-auto px-4 py-8">
          {/* Continue Watching Section */}
          <ContinueWatching />

          {/* Popular Movies Row */}
          <ContentRow
            title="Popular Movies"
            items={movies}
            isLoading={isLoadingMovies}
            viewAllLink={ROUTE_CONFIG.MOVIES.LIST}
            type="movie"
          />

          {/* Popular TV Shows Row */}
          <ContentRow
            title="Popular TV Shows"
            items={tvShows}
            isLoading={isLoadingTV}
            viewAllLink={ROUTE_CONFIG.TV.LIST}
            type="tvshow"
          />
        </div>
      </div>
    </div>
  );
}
