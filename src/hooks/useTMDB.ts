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
import { API_CONFIG, CACHE_CONFIG } from "@/lib/config";

// Query key factories for better cache management
const queryKeys = {
  movies: {
    all: ['movies'] as const,
    lists: () => [...queryKeys.movies.all, 'list'] as const,
    list: (category: string, page: number) => 
      [...queryKeys.movies.lists(), category, page] as const,
    details: () => [...queryKeys.movies.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.movies.details(), id] as const,
  },
  tvShows: {
    all: ['tvShows'] as const,
    lists: () => [...queryKeys.tvShows.all, 'list'] as const,
    list: (category: string, page: number) => 
      [...queryKeys.tvShows.lists(), category, page] as const,
    details: () => [...queryKeys.tvShows.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.tvShows.details(), id] as const,
    seasons: (tvId: number) => [...queryKeys.tvShows.detail(tvId), 'seasons'] as const,
    season: (tvId: number, seasonNumber: number) => 
      [...queryKeys.tvShows.seasons(tvId), seasonNumber] as const,
    episodes: (tvId: number, seasonNumber: number) => 
      [...queryKeys.tvShows.season(tvId, seasonNumber), 'episodes'] as const,
    episode: (tvId: number, seasonNumber: number, episodeNumber: number) => 
      [...queryKeys.tvShows.episodes(tvId, seasonNumber), episodeNumber] as const,
  },
  search: {
    all: ['search'] as const,
    movies: (query: string, page: number) => 
      [...queryKeys.search.all, 'movies', query, page] as const,
    tvShows: (query: string, page: number) => 
      [...queryKeys.search.all, 'tvShows', query, page] as const,
  },
};

// Helper function to fetch from internal API routes
async function fetchFromInternalAPI<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    queryParams.append(key, value.toString());
  });
  
  const queryString = queryParams.toString();
  const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

// Movies Hooks
export function usePopularMovies(page: number, options = {}) {
  return useQuery({
    queryKey: queryKeys.movies.list('popular', page),
    queryFn: () => fetchFromInternalAPI(
      API_CONFIG.INTERNAL.MOVIES_ENDPOINT, 
      { category: 'popular', page }
    ),
    ...CACHE_CONFIG.DEFAULT,
    ...options,
  });
}

export function useTopRatedMovies(page: number = 1, options = {}) {
  return useQuery({
    queryKey: queryKeys.movies.list('top_rated', page),
    queryFn: () => fetchFromInternalAPI(
      API_CONFIG.INTERNAL.MOVIES_ENDPOINT, 
      { category: 'top_rated', page }
    ),
    ...CACHE_CONFIG.DEFAULT,
    ...options,
  });
}

export function useMovieDetails(id: number, options = {}) {
  return useQuery({
    queryKey: queryKeys.movies.detail(id),
    queryFn: () => getMovieDetails(id),
    ...CACHE_CONFIG.CONTENT_DETAILS,
    ...options,
  });
}

// TV Show Hooks
export function usePopularTVShows(page: number, options = {}) {
  return useQuery({
    queryKey: queryKeys.tvShows.list('popular', page),
    queryFn: () => fetchFromInternalAPI(
      API_CONFIG.INTERNAL.TV_ENDPOINT, 
      { category: 'popular', page }
    ),
    ...CACHE_CONFIG.DEFAULT,
    ...options,
  });
}

export function useTopRatedTVShows(page: number = 1, options = {}) {
  return useQuery({
    queryKey: queryKeys.tvShows.list('top_rated', page),
    queryFn: () => fetchFromInternalAPI(
      API_CONFIG.INTERNAL.TV_ENDPOINT, 
      { category: 'top_rated', page }
    ),
    ...CACHE_CONFIG.DEFAULT,
    ...options,
  });
}

export function useTVShowDetails(id: number, options = {}) {
  return useQuery({
    queryKey: queryKeys.tvShows.detail(id),
    queryFn: () => getTVShowDetails(id),
    ...CACHE_CONFIG.CONTENT_DETAILS,
    ...options,
  });
}

export function useTVSeasonDetails(tvId: number, seasonNumber: number, options = {}) {
  return useQuery({
    queryKey: queryKeys.tvShows.season(tvId, seasonNumber),
    queryFn: () => getTVSeasonDetails(tvId, seasonNumber),
    ...CACHE_CONFIG.CONTENT_DETAILS,
    ...options,
  });
}

export function useTVEpisodeDetails(tvId: number, seasonNumber: number, episodeNumber: number, options = {}) {
  return useQuery({
    queryKey: queryKeys.tvShows.episode(tvId, seasonNumber, episodeNumber),
    queryFn: () => getTVEpisodeDetails(tvId, seasonNumber, episodeNumber),
    ...CACHE_CONFIG.CONTENT_DETAILS,
    ...options,
  });
}

// Search Hooks
export function useSearchMovies(query: string, page: number, options = {}) {
  return useQuery<SearchResponse<Movie>>({
    queryKey: queryKeys.search.movies(query, page),
    queryFn: () => searchMovies(query, page),
    enabled: query.length > 0,
    ...CACHE_CONFIG.SEARCH,
    ...options,
  });
}

export function useSearchTVShows(query: string, page: number, options = {}) {
  return useQuery<SearchResponse<TVShow>>({
    queryKey: queryKeys.search.tvShows(query, page),
    queryFn: () => searchTVShows(query, page),
    enabled: query.length > 0,
    ...CACHE_CONFIG.SEARCH,
    ...options,
  });
}

// Latest Content Hooks
export function useLatestMovies(page: number = 1, options = {}) {
  return useQuery({
    queryKey: queryKeys.movies.list('latest', page),
    queryFn: () => fetchFromInternalAPI(
      API_CONFIG.INTERNAL.MOVIES_ENDPOINT, 
      { category: 'latest', page }
    ),
    ...CACHE_CONFIG.DEFAULT,
    ...options
  });
}

export function useLatestTVShows(page: number = 1, options = {}) {
  return useQuery({
    queryKey: queryKeys.tvShows.list('latest', page),
    queryFn: () => fetchFromInternalAPI(
      API_CONFIG.INTERNAL.TV_ENDPOINT, 
      { category: 'latest', page }
    ),
    ...CACHE_CONFIG.DEFAULT,
    ...options
  });
}

export function useLatestEpisodes(page: number = 1, options = {}) {
  return useQuery({
    queryKey: [...queryKeys.tvShows.all, 'episodes', 'latest', page],
    queryFn: () => fetchFromInternalAPI(
      `${API_CONFIG.INTERNAL.TV_ENDPOINT}/episodes`, 
      { page }
    ),
    ...CACHE_CONFIG.DEFAULT,
    ...options
  });
} 