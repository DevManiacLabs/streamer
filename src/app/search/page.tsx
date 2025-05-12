'use client';

import { useSearchMovies, useSearchTVShows } from "@/hooks/useTMDB";
import { Card } from "@/components/ui/Card";
import { getPosterUrl } from "@/api/tmdb";
import { useState, useEffect, Suspense } from "react";
import { Movie, TVShow } from "@/types/tmdb";
import { useSearchParams } from 'next/navigation';
import { classNames } from "@/lib/utils";
import { UI_CONFIG } from "@/lib/config";

/**
 * SearchInput component for handling user search input
 */
function SearchInput({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-8">
      <label htmlFor="search-input" className="sr-only">
        Search movies and TV shows
      </label>
      <input
        id="search-input"
        type="search"
        placeholder="Search movies and TV shows..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-primary focus:outline-none"
        aria-label="Search for movies and TV shows"
        autoComplete="off"
      />
    </div>
  );
}

/**
 * TabButton component for content type selection
 */
function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "px-4 py-2 rounded-md transition-colors",
        active ? "bg-primary text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

/**
 * Loading skeleton grid component
 */
function LoadingGrid() {
  return (
    <div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      aria-label="Loading content"
      role="status"
    >
      {Array.from({ length: 20 }).map((_, index) => (
        <div 
          key={index} 
          className="aspect-[2/3] rounded-lg bg-gray-800 animate-pulse"
          aria-hidden="true"
        ></div>
      ))}
      <span className="sr-only">Loading results</span>
    </div>
  );
}

/**
 * Pagination component for navigating through result pages
 */
function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: { 
  currentPage: number; 
  totalPages: number; 
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex justify-center gap-2 mt-8" role="navigation" aria-label="Pagination">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Go to previous page"
      >
        Previous
      </button>
      <span className="px-4 py-2" aria-current="page">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Go to next page"
      >
        Next
      </button>
    </div>
  );
}

/**
 * ContentGrid component for displaying search results
 */
function ContentGrid<T extends Movie | TVShow>({ 
  items, 
  type 
}: { 
  items: T[]; 
  type: "movie" | "tvshow";
}) {
  if (!items.length) {
    return <div className="text-center text-gray-400 my-8">No results found</div>;
  }
  
  return (
    <div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
      role="list"
      aria-label={type === "movie" ? "Movie results" : "TV Show results"}
    >
      {items.map((item) => (
        <Card
          key={item.id}
          id={item.id.toString()}
          title={type === "movie" ? (item as Movie).title : (item as TVShow).name}
          type={type}
          posterUrl={getPosterUrl(item.poster_path)}
          rating={item.vote_average}
          releaseDate={type === "movie" ? 
            (item as Movie).release_date : 
            (item as TVShow).first_air_date
          }
        />
      ))}
    </div>
  );
}

/**
 * SearchContent component that uses useSearchParams
 */
function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialTab = (searchParams.get('type') as "movies" | "tv") || "movies";
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [activeTab, setActiveTab] = useState<"movies" | "tv">(
    initialTab === "tv" ? "tv" : "movies"
  );
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      // Reset to page 1 on new search
      setPage(1);
    }, UI_CONFIG.DEBOUNCE_TIME);

    return () => clearTimeout(handler);
  }, [query]);
  
  const { data: moviesData, isLoading: isLoadingMovies } = useSearchMovies(debouncedQuery, page, {
    enabled: debouncedQuery.length > 0 && activeTab === "movies",
    refetchOnWindowFocus: false,
  });

  const { data: tvData, isLoading: isLoadingTV } = useSearchTVShows(debouncedQuery, page, {
    enabled: debouncedQuery.length > 0 && activeTab === "tv",
    refetchOnWindowFocus: false,
  });

  const movies = moviesData?.content || [];
  const tvShows = tvData?.content || [];
  const totalPages = activeTab === "movies" ? moviesData?.totalPages || 0 : tvData?.totalPages || 0;

  // Handle tab change
  const handleTabChange = (tab: "movies" | "tv") => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6 sr-only">Search</h1>
      
      <SearchInput value={query} onChange={setQuery} />

      <div className="flex gap-4 mb-8" role="tablist" aria-label="Content type">
        <TabButton 
          active={activeTab === "movies"} 
          onClick={() => handleTabChange("movies")}
        >
          Movies
        </TabButton>
        <TabButton 
          active={activeTab === "tv"} 
          onClick={() => handleTabChange("tv")}
        >
          TV Shows
        </TabButton>
      </div>

      {debouncedQuery.length === 0 ? (
        <div className="text-center text-gray-400 my-12">
          Enter a search query to find movies and TV shows
        </div>
      ) : activeTab === "movies" ? (
        isLoadingMovies ? (
          <LoadingGrid />
        ) : (
          <>
            <ContentGrid items={movies} type="movie" />
            {movies.length > 0 && (
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={setPage} 
              />
            )}
          </>
        )
      ) : (
        isLoadingTV ? (
          <LoadingGrid />
        ) : (
          <>
            <ContentGrid items={tvShows} type="tvshow" />
            {tvShows.length > 0 && (
              <Pagination 
                currentPage={page} 
                totalPages={totalPages} 
                onPageChange={setPage} 
              />
            )}
          </>
        )
      )}
    </div>
  );
}

/**
 * Main SearchPage component wrapped in Suspense
 */
export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingGrid />}>
      <SearchContent />
    </Suspense>
  );
} 