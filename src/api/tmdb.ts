import { Movie, TVShow, Season, Episode, EpisodeGroup, SearchResponse } from "@/types/tmdb";
import { API_CONFIG } from "@/lib/config";

// Destructure configuration for cleaner code
const { BASE_URL, IMAGE_BASE_URL, PLACEHOLDER_POSTER, PLACEHOLDER_BACKDROP, CACHE_TTL } = API_CONFIG.TMDB;

/**
 * Get API key from environment variables
 * @throws Error if API key is not set
 */
const getApiKey = (): string => {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    console.error('TMDB API key is not set in environment variables');
    throw new Error('TMDB API key is not set');
  }
  return apiKey;
};

/**
 * Generic request function for TMDB API
 */
const fetchFromTMDB = async <T>(endpoint: string, params = {}): Promise<T> => {
  try {
    const response = await fetch(
      `${BASE_URL}${endpoint}?api_key=${getApiKey()}&${new URLSearchParams(params)}`,
      { next: { revalidate: CACHE_TTL } }
    );
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
};

// API Services
export async function getPopularMovies(page: number = 1): Promise<{ content: Movie[]; totalPages: number }> {
  const data = await fetchFromTMDB<{results: Movie[], total_pages: number}>(`/movie/popular`, { page });
  return {
    content: data.results,
    totalPages: data.total_pages,
  };
}

export async function getPopularTVShows(page: number = 1): Promise<{ content: TVShow[]; totalPages: number }> {
  const data = await fetchFromTMDB<{results: TVShow[], total_pages: number}>(`/tv/popular`, { page });
  return {
    content: data.results,
    totalPages: data.total_pages,
  };
}

export async function getMovieDetails(id: number): Promise<Movie> {
  return fetchFromTMDB<Movie>(`/movie/${id}`);
}

export async function getTVShowDetails(id: number): Promise<TVShow> {
  // Fetch the base TV show details with seasons
  const show = await fetchFromTMDB<TVShow>(`/tv/${id}`, { append_to_response: 'seasons' });
  
  try {
    // Fetch episode groups in a separate call
    const episodeGroupsData = await fetchFromTMDB<{ results: EpisodeGroup[] }>(`/tv/${id}/episode_groups`);
    
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
  return fetchFromTMDB<Season>(`/tv/${tvId}/season/${seasonNumber}`);
}

export async function getTVEpisodeDetails(tvId: number, seasonNumber: number, episodeNumber: number): Promise<Episode> {
  return fetchFromTMDB<Episode>(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
}

export async function getTVEpisodeGroups(tvId: number): Promise<{ results: EpisodeGroup[] }> {
  return fetchFromTMDB<{ results: EpisodeGroup[] }>(`/tv/${tvId}/episode_groups`);
}

export async function searchMovies(query: string, page: number = 1): Promise<SearchResponse<Movie>> {
  const response = await fetch(`${API_CONFIG.INTERNAL.SEARCH_ENDPOINT}/movies?query=${encodeURIComponent(query)}&page=${page}`);
  if (!response.ok) {
    throw new Error('Failed to search movies');
  }
  return response.json();
}

export async function searchTVShows(query: string, page: number = 1): Promise<SearchResponse<TVShow>> {
  const response = await fetch(`${API_CONFIG.INTERNAL.SEARCH_ENDPOINT}/tv?query=${encodeURIComponent(query)}&page=${page}`);
  if (!response.ok) {
    throw new Error('Failed to search TV shows');
  }
  return response.json();
}

// Image URL helpers
export function getPosterUrl(path: string | null, size: string = "w500"): string {
  if (!path) return PLACEHOLDER_POSTER;
  return `${IMAGE_BASE_URL}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: string = "original"): string {
  if (!path) return PLACEHOLDER_BACKDROP;
  return `${IMAGE_BASE_URL}/${size}${path}`;
} 