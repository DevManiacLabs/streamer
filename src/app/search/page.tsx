'use client';

import { useSearchMovies, useSearchTVShows } from "@/hooks/useTMDB";
import { Card } from "@/components/ui/Card";
import { getPosterUrl } from "@/api/tmdb";
import { useState } from "react";
import { Movie, TVShow } from "@/types/tmdb";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"movies" | "tv">("movies");
  const [page, setPage] = useState(1);

  const { data: moviesData, isLoading: isLoadingMovies } = useSearchMovies(query, page, {
    enabled: query.length > 0 && activeTab === "movies",
    refetchOnWindowFocus: false,
  });

  const { data: tvData, isLoading: isLoadingTV } = useSearchTVShows(query, page, {
    enabled: query.length > 0 && activeTab === "tv",
    refetchOnWindowFocus: false,
  });

  const movies = moviesData?.content || [];
  const tvShows = tvData?.content || [];
  const totalPages = activeTab === "movies" ? moviesData?.totalPages || 0 : tvData?.totalPages || 0;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search movies and TV shows..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          className="w-full p-4 rounded-lg bg-gray-800 text-white"
        />
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("movies")}
          className={`px-4 py-2 rounded-md ${
            activeTab === "movies" ? "bg-primary text-white" : "bg-gray-800 text-gray-400"
          }`}
        >
          Movies
        </button>
        <button
          onClick={() => setActiveTab("tv")}
          className={`px-4 py-2 rounded-md ${
            activeTab === "tv" ? "bg-primary text-white" : "bg-gray-800 text-gray-400"
          }`}
        >
          TV Shows
        </button>
      </div>

      {query.length === 0 ? (
        <div className="text-center text-gray-400">Enter a search query to find movies and TV shows</div>
      ) : activeTab === "movies" ? (
        isLoadingMovies ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] rounded-lg bg-gray-800 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {movies.map((movie: Movie) => (
                <Card
                  key={movie.id}
                  id={movie.id.toString()}
                  title={movie.title}
                  type="movie"
                  posterUrl={getPosterUrl(movie.poster_path)}
                  rating={movie.vote_average}
                  releaseDate={movie.release_date}
                />
              ))}
            </div>

            {movies.length > 0 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )
      ) : (
        isLoadingTV ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 20 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] rounded-lg bg-gray-800 animate-pulse"></div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {tvShows.map((show: TVShow) => (
                <Card
                  key={show.id}
                  id={show.id.toString()}
                  title={show.name}
                  type="tvshow"
                  posterUrl={getPosterUrl(show.poster_path)}
                  rating={show.vote_average}
                  releaseDate={show.first_air_date}
                />
              ))}
            </div>

            {tvShows.length > 0 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-4 py-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-md bg-primary text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
} 