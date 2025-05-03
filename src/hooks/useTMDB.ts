import { useQuery } from '@tanstack/react-query';
import { Movie, TVShow, Season, Episode, SearchResponse } from '@/types/tmdb';
import { 
  getPopularMovies, 
  getPopularTVShows, 
  getMovieDetails, 
  getTVShowDetails, 
  getTVSeasonDetails,
  getTVEpisodeDetails,
  searchMovies, 
  searchTVShows
} from "@/api/tmdb";

// Global cache settings
const CACHE_CONFIG = {
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  retry: 1,
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000 // 1 hour (formerly cacheTime)
};

async function fetchMovies(category: string = 'popular', page: number = 1) {
  const response = await fetch(`/api/movies?category=${category}&page=${page}`);
  if (!response.ok) {
    throw new Error('Failed to fetch movies');
  }
  return response.json();
}

async function fetchTVShows(category: string = 'popular', page: number = 1) {
  const response = await fetch(`/api/tv?category=${category}&page=${page}`);
  if (!response.ok) {
    throw new Error('Failed to fetch TV shows');
  }
  return response.json();
}

export function usePopularMovies(page: number, options = {}) {
  return useQuery({
    queryKey: ["popularMovies", page],
    queryFn: async () => {
      const response = await fetch(`/api/movies?category=popular&page=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }
      const data = await response.json();
      return data;
    },
    ...CACHE_CONFIG,
    ...options,
  });
}

export function usePopularTVShows(page: number, options = {}) {
  return useQuery({
    queryKey: ["popularTVShows", page],
    queryFn: async () => {
      const response = await fetch(`/api/tv?category=popular&page=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch TV shows');
      }
      const data = await response.json();
      return data;
    },
    ...CACHE_CONFIG,
    ...options,
  });
}

export function useLatestMovies(page: number = 1, options = {}) {
  return useQuery({
    queryKey: ['movies', 'latest', page],
    queryFn: () => fetchMovies('latest', page),
    ...CACHE_CONFIG,
    ...options
  });
}

export function useLatestTVShows(page: number = 1, options = {}) {
  return useQuery({
    queryKey: ['tvshows', 'latest', page],
    queryFn: () => fetchTVShows('latest', page),
    ...CACHE_CONFIG,
    ...options
  });
}

export function useLatestEpisodes(page: number = 1, options = {}) {
  return useQuery({
    queryKey: ['episodes', 'latest', page],
    queryFn: async () => {
      const response = await fetch(`/api/episodes?page=${page}`);
      if (!response.ok) {
        throw new Error('Failed to fetch episodes');
      }
      return response.json();
    },
    ...CACHE_CONFIG,
    ...options
  });
}

export function useTopRatedMovies(page: number = 1, options = {}) {
  return useQuery({
    queryKey: ['movies', 'top_rated', page],
    queryFn: () => fetchMovies('top_rated', page),
    ...CACHE_CONFIG,
    ...options
  });
}

export function useTopRatedTVShows(page: number = 1, options = {}) {
  return useQuery({
    queryKey: ['tvshows', 'top_rated', page],
    queryFn: () => fetchTVShows('top_rated', page),
    ...CACHE_CONFIG,
    ...options
  });
}

export function useMovieDetails(id: number, options = {}) {
  return useQuery({
    queryKey: ["movieDetails", id],
    queryFn: () => getMovieDetails(id),
    ...CACHE_CONFIG,
    staleTime: 60 * 60 * 1000, // 1 hour for details pages
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    ...options,
  });
}

export function useTVShowDetails(id: number, options = {}) {
  return useQuery({
    queryKey: ["tvShowDetails", id],
    queryFn: () => getTVShowDetails(id),
    ...CACHE_CONFIG,
    staleTime: 60 * 60 * 1000, // 1 hour for details pages
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    ...options,
  });
}

export function useTVSeasonDetails(tvId: number, seasonNumber: number, options = {}) {
  return useQuery({
    queryKey: ["tvSeasonDetails", tvId, seasonNumber],
    queryFn: () => getTVSeasonDetails(tvId, seasonNumber),
    ...CACHE_CONFIG,
    staleTime: 60 * 60 * 1000, // 1 hour for details pages
    ...options,
  });
}

export function useTVEpisodeDetails(tvId: number, seasonNumber: number, episodeNumber: number, options = {}) {
  return useQuery({
    queryKey: ["tvEpisodeDetails", tvId, seasonNumber, episodeNumber],
    queryFn: () => getTVEpisodeDetails(tvId, seasonNumber, episodeNumber),
    ...CACHE_CONFIG,
    staleTime: 60 * 60 * 1000, // 1 hour for details pages
    ...options,
  });
}

export function useSearchMovies(query: string, page: number, options = {}) {
  return useQuery<SearchResponse<Movie>>({
    queryKey: ["searchMovies", query, page],
    queryFn: () => searchMovies(query, page),
    enabled: query.length > 0,
    ...CACHE_CONFIG,
    staleTime: 10 * 60 * 1000, // 10 minutes for search results
    ...options,
  });
}

export function useSearchTVShows(query: string, page: number, options = {}) {
  return useQuery<SearchResponse<TVShow>>({
    queryKey: ["searchTVShows", query, page],
    queryFn: () => searchTVShows(query, page),
    enabled: query.length > 0,
    ...CACHE_CONFIG,
    staleTime: 10 * 60 * 1000, // 10 minutes for search results
    ...options,
  });
} 