'use client';

import { useSearchMovies, useSearchTVShows } from "@/hooks/useTMDB";
import { Movie, TVShow } from "@/types/tmdb";
import { getPosterUrl } from "@/api/tmdb";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ROUTE_CONFIG, UI_CONFIG } from "@/lib/config";
import { classNames } from "@/lib/utils";

/**
 * SearchResult component that renders a single search result item
 */
function SearchResultItem({
  title,
  year,
  imageUrl,
  href,
  onClick
}: {
  title: string;
  year: number | string;
  imageUrl: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-2 hover:bg-white/10 rounded transition-colors"
      onClick={onClick}
    >
      <img
        src={imageUrl}
        alt={`${title} poster`}
        className="w-10 h-15 rounded object-cover"
        loading="lazy"
      />
      <div>
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-gray-400">{year}</div>
      </div>
    </Link>
  );
}

/**
 * SearchResults component that renders the dropdown of search results
 */
function SearchResults({
  query,
  movies,
  tvShows,
  isLoading,
  moviesFiltered = 0,
  tvShowsFiltered = 0,
  onResultClick
}: {
  query: string;
  movies: Movie[];
  tvShows: TVShow[];
  isLoading: boolean;
  moviesFiltered?: number;
  tvShowsFiltered?: number;
  onResultClick: () => void;
}) {
  if (isLoading) {
    return (
      <div 
        className="p-4 text-center text-gray-400" 
        aria-live="polite"
        role="status"
      >
        <div className="animate-pulse flex flex-col gap-2">
          <div className="h-4 bg-gray-800 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2 mx-auto"></div>
        </div>
        <span className="sr-only">Loading search results</span>
      </div>
    );
  }

  if (movies.length === 0 && tvShows.length === 0) {
    return (
      <div 
        className="p-4 text-center text-gray-400"
        aria-live="polite" 
      >
        {moviesFiltered > 0 || tvShowsFiltered > 0 ? (
          <>
            No available results found
            <div className="text-xs mt-1">
              {moviesFiltered} movies and {tvShowsFiltered} TV shows are currently unavailable
            </div>
          </>
        ) : (
          'No results found'
        )}
      </div>
    );
  }

  return (
    <>
      {/* Movie results */}
      {movies.length > 0 && (
        <div className="p-2">
          <h3 
            className="text-xs font-semibold text-gray-400 px-2 py-1"
            id="search-movies-heading"
          >
            Movies
          </h3>
          <div 
            role="list" 
            aria-labelledby="search-movies-heading"
          >
            {movies.slice(0, 4).map((movie: Movie) => (
              <SearchResultItem
                key={movie.id}
                title={movie.title}
                year={movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'}
                imageUrl={getPosterUrl(movie.poster_path, "w92")}
                href={ROUTE_CONFIG.MOVIES.DETAILS(movie.id.toString())}
                onClick={onResultClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* TV Show results */}
      {tvShows.length > 0 && (
        <div className="p-2">
          <h3 
            className="text-xs font-semibold text-gray-400 px-2 py-1"
            id="search-tv-heading"
          >
            TV Shows
          </h3>
          <div 
            role="list" 
            aria-labelledby="search-tv-heading"
          >
            {tvShows.slice(0, 4).map((show: TVShow) => (
              <SearchResultItem
                key={show.id}
                title={show.name}
                year={show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'Unknown'}
                imageUrl={getPosterUrl(show.poster_path, "w92")}
                href={ROUTE_CONFIG.TV.DETAILS(show.id.toString())}
                onClick={onResultClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* View all results link */}
      {(movies.length > 0 || tvShows.length > 0) && (
        <div className="p-2 border-t border-gray-800">
          <Link
            href={`/search?q=${encodeURIComponent(query)}`}
            className="block text-center text-sm text-white/70 hover:text-white py-1 transition-colors"
            onClick={onResultClick}
          >
            View all results
          </Link>
        </div>
      )}
    </>
  );
}

/**
 * Main SearchBar component
 */
export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search query to reduce API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, UI_CONFIG.DEBOUNCE_TIME);

    return () => clearTimeout(handler);
  }, [query]);

  // Search API calls
  const { data: moviesData, isLoading: isLoadingMovies } = useSearchMovies(debouncedQuery, 1, {
    enabled: debouncedQuery.length > 0,
    refetchOnWindowFocus: false,
  });

  const { data: tvData, isLoading: isLoadingTV } = useSearchTVShows(debouncedQuery, 1, {
    enabled: debouncedQuery.length > 0,
    refetchOnWindowFocus: false,
  });

  const movies = moviesData?.content || [];
  const tvShows = tvData?.content || [];
  const isLoading = isLoadingMovies || isLoadingTV;

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Close search on Escape key
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setIsFocused(false);
        inputRef.current?.blur();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  // Open search input
  const toggleSearch = () => {
    if (!isFocused) {
      setIsFocused(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  // Close dropdown and reset focus
  const handleResultClick = () => {
    setIsOpen(false);
    setIsFocused(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div 
        className={classNames(
          "flex items-center transition-all duration-300 rounded-sm",
          isFocused ? 'bg-black border border-white/30' : 'bg-transparent'
        )}
      >
        <button 
          onClick={toggleSearch}
          className="text-white/70 hover:text-white p-2 transition-colors"
          aria-label="Search"
          aria-expanded={isFocused}
          aria-controls="search-input"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        
        <form 
          onSubmit={handleSearch} 
          className={classNames(
            "transition-all duration-300 overflow-hidden",
            isFocused ? 'w-48 md:w-64' : 'w-0'
          )}
        >
          <input
            id="search-input"
            ref={inputRef}
            type="search"
            placeholder="Titles, people, genres"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(e.target.value.length > 0);
            }}
            onFocus={() => {
              setIsFocused(true);
              setIsOpen(query.length > 0);
            }}
            className="w-full bg-transparent text-white placeholder-white/50 text-sm py-1 px-1 focus:outline-none"
            aria-label="Search for movies and TV shows"
            aria-autocomplete="list"
            aria-controls={isOpen ? "search-results" : undefined}
            autoComplete="off"
          />
        </form>
      </div>

      {isOpen && query.length > 0 && (
        <div 
          id="search-results"
          className="absolute top-full right-0 w-64 md:w-80 mt-2 bg-black/95 rounded border border-gray-800 shadow-xl max-h-[70vh] overflow-y-auto z-50"
          role="region"
          aria-label="Search results"
        >
          <SearchResults
            query={query}
            movies={movies}
            tvShows={tvShows}
            isLoading={isLoading}
            moviesFiltered={moviesData?.filteredFromOriginal || 0}
            tvShowsFiltered={tvData?.filteredFromOriginal || 0}
            onResultClick={handleResultClick}
          />
        </div>
      )}
    </div>
  );
} 