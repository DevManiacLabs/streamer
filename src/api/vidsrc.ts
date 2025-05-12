import { API_CONFIG } from "@/lib/config";

// VidSrc API Types
export interface VidSrcMovie {
  imdb_id: string;
  tmdb_id: string;
  title: string;
  embed_url: string;
  embed_url_tmdb: string;
  quality: string;
}

export interface VidSrcTVShow {
  imdb_id: string;
  tmdb_id: string | null;
  title: string;
  embed_url: string;
  embed_url_tmdb?: string;
}

export interface VidSrcEpisode {
  imdb_id: string;
  tmdb_id: string | null;
  show_title: string;
  season: string;
  episode: string;
  embed_url: string;
  embed_url_tmdb?: string;
  quality: string;
  released_date?: string;
}

export interface VidSrcListResponse<T> {
  result: T[];
  pages: number;
}

// Destructure configuration for cleaner code
const { BASE_URL, ALTERNATIVE_DOMAINS } = API_CONFIG.VIDSRC;

/**
 * Generic request function for VidSrc API
 */
const fetchFromVidSrc = async <T>(endpoint: string): Promise<VidSrcListResponse<T>> => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    
    if (!response.ok) {
      throw new Error(`VidSrc API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return { result: [], pages: 0 };
  }
};

// API Services
export const getLatestMovies = (page = 1): Promise<VidSrcListResponse<VidSrcMovie>> => 
  fetchFromVidSrc<VidSrcMovie>(`/movies/latest/page-${page}.json`);

export const getLatestTVShows = (page = 1): Promise<VidSrcListResponse<VidSrcTVShow>> => 
  fetchFromVidSrc<VidSrcTVShow>(`/tvshows/latest/page-${page}.json`);

export const getLatestEpisodes = (page = 1): Promise<VidSrcListResponse<VidSrcEpisode>> => 
  fetchFromVidSrc<VidSrcEpisode>(`/episodes/latest/page-${page}.json`);

/**
 * Build embed URL for movies or TV shows
 */
const buildEmbedUrl = (
  type: 'movie' | 'tv',
  tmdbId: string,
  options?: { 
    season?: number; 
    episode?: number; 
    subUrl?: string; 
    dsLang?: string;
  }
): string => {
  // For TV episodes, use the format recommended in the documentation
  if (type === 'tv' && options?.season && options?.episode) {
    return `${BASE_URL}/embed/tv/${tmdbId}/${options.season}-${options.episode}`;
  }
  
  // For other cases, use the query parameter approach
  const params = new URLSearchParams();
  params.append('tmdb', tmdbId);
  
  if (options?.season) params.append('season', options.season.toString());
  if (options?.episode) params.append('episode', options.episode.toString());
  if (options?.subUrl) params.append('sub_url', options.subUrl);
  if (options?.dsLang) params.append('ds_lang', options.dsLang);
  
  return `${BASE_URL}/embed/${type}?${params.toString()}`;
};

/**
 * Get all possible embed URLs for a video (using all available domains)
 */
export const getAllPossibleEmbedUrls = (
  type: 'movie' | 'tv',
  tmdbId: string,
  options?: { 
    season?: number; 
    episode?: number; 
    subUrl?: string; 
    dsLang?: string;
  }
): string[] => {
  return ALTERNATIVE_DOMAINS.map(domain => {
    // Base URL with specific domain
    const baseUrl = `https://${domain}`;
    
    // For TV episodes with season and episode
    if (type === 'tv' && options?.season && options?.episode) {
      return `${baseUrl}/embed/tv/${tmdbId}/${options.season}-${options.episode}`;
    }
    
    // Build params
    const params = new URLSearchParams();
    params.append('tmdb', tmdbId);
    
    if (options?.season) params.append('season', options.season.toString());
    if (options?.episode) params.append('episode', options.episode.toString());
    if (options?.subUrl) params.append('sub_url', options.subUrl);
    if (options?.dsLang) params.append('ds_lang', options.dsLang);
    
    return `${baseUrl}/embed/${type}?${params.toString()}`;
  });
};

// Embed URL generators
export const getMovieEmbedUrl = (
  tmdbId: string, 
  options?: { subUrl?: string; dsLang?: string }
): string => buildEmbedUrl('movie', tmdbId, options);

export const getTVShowEmbedUrl = (
  tmdbId: string, 
  options?: { dsLang?: string }
): string => buildEmbedUrl('tv', tmdbId, options);

export const getEpisodeEmbedUrl = (
  tmdbId: string,
  season: number,
  episode: number,
  options?: { subUrl?: string; dsLang?: string }
): string => `${BASE_URL}/embed/tv/${tmdbId}/${season}-${episode}`;

// Aliases for backwards compatibility
export const getMovieEmbedUrlByTmdb = getMovieEmbedUrl;
export const getTVShowEmbedUrlByTmdb = getTVShowEmbedUrl;
export const getEpisodeEmbedUrlByTmdb = getEpisodeEmbedUrl; 