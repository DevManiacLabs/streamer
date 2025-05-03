import axios from 'axios';
import { Movie, TVShow, Season, Episode, EpisodeGroup, SearchResponse } from "@/types/tmdb";

// TMDB API Types
export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
}

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  original_language: string;
  popularity: number;
}

export interface TMDBSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// Base API configuration
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

// Get API key from environment
const getApiKey = () => {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    console.error('TMDB API key is not set in environment variables');
    throw new Error('TMDB API key is not set');
  }
  return apiKey;
};

// Helper function for making API requests
const makeRequest = async <T>(endpoint: string, params = {}) => {
  try {
    const apiKey = getApiKey();
    console.log('Making request to:', endpoint);
    console.log('Using API key:', apiKey ? 'Set' : 'Not Set');
    
    const response = await axios.get<T>(`${TMDB_BASE_URL}${endpoint}`, {
      params: {
        api_key: apiKey,
        language: 'en-US',
        ...params,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

// API Services
export async function getPopularMovies(page: number = 1): Promise<{ content: Movie[]; totalPages: number }> {
  const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${getApiKey()}&page=${page}`);
  const data = await response.json();
  return {
    content: data.results,
    totalPages: data.total_pages,
  };
}

export async function getPopularTVShows(page: number = 1): Promise<{ content: TVShow[]; totalPages: number }> {
  const response = await fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${getApiKey()}&page=${page}`);
  const data = await response.json();
  return {
    content: data.results,
    totalPages: data.total_pages,
  };
}

export async function getMovieDetails(id: number): Promise<Movie> {
  const response = await fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${getApiKey()}`);
  return response.json();
}

export async function getTVShowDetails(id: number): Promise<TVShow> {
  // Fetch the base TV show details
  const response = await fetch(`${TMDB_BASE_URL}/tv/${id}?api_key=${getApiKey()}&append_to_response=seasons`);
  const show = await response.json();
  
  try {
    // Fetch episode groups in a separate call
    const episodeGroupsResponse = await fetch(`${TMDB_BASE_URL}/tv/${id}/episode_groups?api_key=${getApiKey()}`);
    const episodeGroupsData = await episodeGroupsResponse.json();
    
    // Add episode groups to the show data
    if (episodeGroupsData && episodeGroupsData.results) {
      show.episode_groups = episodeGroupsData.results;
    }
  } catch (error) {
    console.error(`Error fetching episode groups for TV show ${id}:`, error);
    // Continue with the base data if episode groups fail
  }
  
  return show;
}

export async function getTVSeasonDetails(tvId: number, seasonNumber: number): Promise<Season> {
  const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${getApiKey()}`);
  return response.json();
}

export async function getTVEpisodeDetails(tvId: number, seasonNumber: number, episodeNumber: number): Promise<Episode> {
  const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}?api_key=${getApiKey()}`);
  return response.json();
}

export async function getTVEpisodeGroups(tvId: number): Promise<{ results: EpisodeGroup[] }> {
  const response = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/episode_groups?api_key=${getApiKey()}`);
  return response.json();
}

export async function searchMovies(query: string, page: number = 1): Promise<SearchResponse<Movie>> {
  const response = await fetch(`/api/search/movies?query=${encodeURIComponent(query)}&page=${page}`);
  if (!response.ok) {
    throw new Error('Failed to search movies');
  }
  return response.json();
}

export async function searchTVShows(query: string, page: number = 1): Promise<SearchResponse<TVShow>> {
  const response = await fetch(`/api/search/tv?query=${encodeURIComponent(query)}&page=${page}`);
  if (!response.ok) {
    throw new Error('Failed to search TV shows');
  }
  return response.json();
}

// Image URL helpers
export function getPosterUrl(path: string | null, size: string = "w500"): string {
  if (!path) return "/placeholder-poster.png";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: string = "original"): string {
  if (!path) return "/placeholder-backdrop.png";
  return `https://image.tmdb.org/t/p/${size}${path}`;
} 