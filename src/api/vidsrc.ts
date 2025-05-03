import axios from 'axios';

// Types for API responses
export interface Movie {
  imdb_id: string;
  tmdb_id: string;
  title: string;
  embed_url: string;
  embed_url_tmdb: string;
  quality: string;
}

export interface TVShow {
  imdb_id: string;
  tmdb_id: string | null;
  title: string;
  embed_url: string;
  embed_url_tmdb?: string;
}

export interface Episode {
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

interface ListResponse<T> {
  result: T[];
  pages: number;
}

// Base API URL
const API_BASE_URL = 'https://vidsrc.xyz';

// Helper function for making API requests
const makeRequest = async <T>(endpoint: string): Promise<ListResponse<T>> => {
  try {
    const response = await axios.get<ListResponse<T>>(`${API_BASE_URL}${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return { result: [], pages: 0 };
  }
};

// API Services
export const getLatestMovies = (page = 1) => 
  makeRequest<Movie>(`/movies/latest/page-${page}.json`);

export const getLatestTVShows = (page = 1) => 
  makeRequest<TVShow>(`/tvshows/latest/page-${page}.json`);

export const getLatestEpisodes = (page = 1) => 
  makeRequest<Episode>(`/episodes/latest/page-${page}.json`);

// Helper function for building embed URLs
const buildEmbedUrl = (
  type: 'movie' | 'tv',
  tmdbId: string,
  options?: { season?: number; episode?: number; subUrl?: string; dsLang?: string }
) => {
  // For TV episodes, use the format recommended in the documentation: vidsrc.xyz/embed/tv/tmdbId/season-episode
  if (type === 'tv' && options?.season && options?.episode) {
    return `${API_BASE_URL}/embed/tv/${tmdbId}/${options.season}-${options.episode}`;
  }
  
  // For other cases, use the query parameter approach
  const params = new URLSearchParams();
  params.append('tmdb', tmdbId);
  
  if (options?.season) params.append('season', options.season.toString());
  if (options?.episode) params.append('episode', options.episode.toString());
  if (options?.subUrl) params.append('sub_url', options.subUrl);
  if (options?.dsLang) params.append('ds_lang', options.dsLang);
  
  return `${API_BASE_URL}/embed/${type}?${params.toString()}`;
};

// Embed URL generators
export const getMovieEmbedUrl = (tmdbId: string, options?: { subUrl?: string; dsLang?: string }) => 
  buildEmbedUrl('movie', tmdbId, options);

export const getTVShowEmbedUrl = (tmdbId: string, options?: { dsLang?: string }) => 
  buildEmbedUrl('tv', tmdbId, options);

export const getEpisodeEmbedUrl = (
  tmdbId: string,
  season: number,
  episode: number,
  options?: { subUrl?: string; dsLang?: string }
) => {
  // Using the recommended format from the documentation
  return `${API_BASE_URL}/embed/tv/${tmdbId}/${season}-${episode}`;
};

// Aliases for TMDb IDs
export const getMovieEmbedUrlByTmdb = getMovieEmbedUrl;
export const getTVShowEmbedUrlByTmdb = getTVShowEmbedUrl;
export const getEpisodeEmbedUrlByTmdb = getEpisodeEmbedUrl; 