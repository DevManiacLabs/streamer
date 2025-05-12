import { useQuery } from '@tanstack/react-query';
import { 
  getLatestMovies, 
  getLatestTVShows, 
  getLatestEpisodes,
  getAllPossibleEmbedUrls,
  VidSrcMovie,
  VidSrcTVShow,
  VidSrcEpisode,
  VidSrcListResponse
} from '@/api/vidsrc';
import { CACHE_CONFIG } from '@/lib/config';

// Query key factories
const queryKeys = {
  vidsrc: {
    all: ['vidsrc'] as const,
    movies: (page: number) => [...queryKeys.vidsrc.all, 'movies', page] as const,
    tvShows: (page: number) => [...queryKeys.vidsrc.all, 'tvShows', page] as const,
    episodes: (page: number) => [...queryKeys.vidsrc.all, 'episodes', page] as const,
  },
};

/**
 * Hook to fetch latest movies from VidSrc
 */
export function useLatestVidSrcMovies(page: number = 1, options = {}) {
  return useQuery<VidSrcListResponse<VidSrcMovie>>({
    queryKey: queryKeys.vidsrc.movies(page),
    queryFn: () => getLatestMovies(page),
    ...CACHE_CONFIG.DEFAULT,
    ...options,
  });
}

/**
 * Hook to fetch latest TV shows from VidSrc
 */
export function useLatestVidSrcTVShows(page: number = 1, options = {}) {
  return useQuery<VidSrcListResponse<VidSrcTVShow>>({
    queryKey: queryKeys.vidsrc.tvShows(page),
    queryFn: () => getLatestTVShows(page),
    ...CACHE_CONFIG.DEFAULT,
    ...options,
  });
}

/**
 * Hook to fetch latest episodes from VidSrc
 */
export function useLatestVidSrcEpisodes(page: number = 1, options = {}) {
  return useQuery<VidSrcListResponse<VidSrcEpisode>>({
    queryKey: queryKeys.vidsrc.episodes(page),
    queryFn: () => getLatestEpisodes(page),
    ...CACHE_CONFIG.DEFAULT,
    ...options,
  });
}

/**
 * Hook to get all possible embed URLs for a video
 */
export function useVideoEmbedUrls(
  type: 'movie' | 'tv',
  tmdbId: string,
  options?: { 
    season?: number; 
    episode?: number; 
    subUrl?: string; 
    dsLang?: string;
  }
) {
  return getAllPossibleEmbedUrls(type, tmdbId, options);
}

// Export aliases for backward compatibility
export const useLatestMovies = useLatestVidSrcMovies;
export const useLatestTVShows = useLatestVidSrcTVShows;
export const useLatestEpisodes = useLatestVidSrcEpisodes; 