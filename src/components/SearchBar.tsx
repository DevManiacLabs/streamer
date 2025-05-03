'use client';

import { useSearchMovies, useSearchTVShows } from "@/hooks/useTMDB";
import { Movie, TVShow } from "@/types/tmdb";
import { getPosterUrl } from "@/api/tmdb";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: moviesData, isLoading: isLoadingMovies } = useSearchMovies(query, 1, {
    enabled: query.length > 0,
    refetchOnWindowFocus: false,
  });

  const { data: tvData, isLoading: isLoadingTV } = useSearchTVShows(query, 1, {
    enabled: query.length > 0,
    refetchOnWindowFocus: false,
  });

  const movies = moviesData?.content || [];
  const tvShows = tvData?.content || [];

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  const toggleSearch = () => {
    if (!isFocused) {
      setIsFocused(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className={`flex items-center transition-all duration-300 ${isFocused ? 'bg-black border border-white/30' : 'bg-transparent'} rounded-sm`}>
        <button 
          onClick={toggleSearch}
          className="text-white/70 hover:text-white p-2"
          aria-label="Search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        
        <form onSubmit={handleSearch} className={`transition-all duration-300 ${isFocused ? 'w-48 md:w-64' : 'w-0'} overflow-hidden`}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Titles, people, genres"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setIsFocused(true);
              setIsOpen(true);
            }}
            className="w-full bg-transparent text-white placeholder-white/50 text-sm py-1 px-1 focus:outline-none"
          />
        </form>
      </div>

      {isOpen && query.length > 0 && (
        <div className="absolute top-full right-0 w-64 md:w-80 mt-2 bg-black/95 rounded border border-gray-800 shadow-xl max-h-[70vh] overflow-y-auto z-50">
          {isLoadingMovies || isLoadingTV ? (
            <div className="p-4 text-center text-gray-400">Loading...</div>
          ) : movies.length === 0 && tvShows.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              {moviesData?.filteredFromOriginal || tvData?.filteredFromOriginal ? (
                <>
                  No available results found
                  <div className="text-xs mt-1">
                    {moviesData?.filteredFromOriginal || 0} movies and {tvData?.filteredFromOriginal || 0} TV shows are currently unavailable
                  </div>
                </>
              ) : (
                'No results found'
              )}
            </div>
          ) : (
            <>
              {movies.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-400 px-2 py-1">Movies</h3>
                  {movies.slice(0, 4).map((movie: Movie) => (
                    <Link
                      key={movie.id}
                      href={`/movie/${movie.id}`}
                      className="flex items-center gap-3 p-2 hover:bg-white/10 rounded transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <img
                        src={getPosterUrl(movie.poster_path, "w92")}
                        alt={movie.title}
                        className="w-10 h-15 rounded object-cover"
                      />
                      <div>
                        <div className="font-medium text-sm">{movie.title}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(movie.release_date).getFullYear()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {tvShows.length > 0 && (
                <div className="p-2">
                  <h3 className="text-xs font-semibold text-gray-400 px-2 py-1">TV Shows</h3>
                  {tvShows.slice(0, 4).map((show: TVShow) => (
                    <Link
                      key={show.id}
                      href={`/tv/${show.id}`}
                      className="flex items-center gap-3 p-2 hover:bg-white/10 rounded transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <img
                        src={getPosterUrl(show.poster_path, "w92")}
                        alt={show.name}
                        className="w-10 h-15 rounded object-cover"
                      />
                      <div>
                        <div className="font-medium text-sm">{show.name}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(show.first_air_date).getFullYear()}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {(movies.length > 0 || tvShows.length > 0) && (
                <div className="p-2 border-t border-gray-800">
                  <Link
                    href={`/search?q=${encodeURIComponent(query)}`}
                    className="block text-center text-sm text-white/70 hover:text-white py-1 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    View all results
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
} 