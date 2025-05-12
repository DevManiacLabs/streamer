'use client';

import { usePopularMovies } from "@/hooks/useTMDB";
import { Card } from "@/components/ui/Card";
import { getPosterUrl } from "@/api/tmdb";
import { useState } from "react";
import { Movie, SearchResponse } from "@/types/tmdb";

interface MovieResponse {
  content: Movie[];
  totalPages: number;
  currentPage?: number;
}

export default function MoviesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePopularMovies(page, {
    refetchOnWindowFocus: false,
  });

  // Handle different possible data shapes with type assertions
  const typedData = data as MovieResponse | undefined;
  const movies = typedData?.content || [];
  const totalPages = typedData?.totalPages || 0;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Popular Movies</h1>

      {isLoading ? (
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
        </>
      )}
    </div>
  );
} 