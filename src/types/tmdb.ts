// Common interfaces
export interface BaseTMDBEntity {
  id: number;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  original_language: string;
  genre_ids?: number[];
}

// Movie-specific interfaces
export interface Movie extends BaseTMDBEntity {
  title: string;
  original_title?: string;
  release_date: string;
  adult?: boolean;
  video?: boolean;
  runtime?: number;
  genres?: Genre[];
  budget?: number;
  revenue?: number;
  status?: string;
  tagline?: string;
  imdb_id?: string;
  production_companies?: ProductionCompany[];
  production_countries?: ProductionCountry[];
  spoken_languages?: SpokenLanguage[];
  belongs_to_collection?: Collection;
}

// TV Show specific interfaces
export interface TVShow extends BaseTMDBEntity {
  name: string;
  original_name?: string;
  first_air_date: string;
  episode_run_time?: number[];
  in_production?: boolean;
  languages?: string[];
  last_air_date?: string;
  number_of_episodes?: number;
  number_of_seasons?: number;
  origin_country?: string[];
  status?: string;
  tagline?: string;
  type?: string;
  seasons?: Season[];
  episode_groups?: EpisodeGroup[];
  created_by?: Creator[];
  networks?: Network[];
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  air_date?: string;
  episode_count?: number;
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date?: string;
  episode_number: number;
  season_number: number;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
  crew?: Crew[];
  guest_stars?: Cast[];
}

export interface EpisodeGroup {
  id: string;
  name: string;
  order?: number;
  type?: number;
  description?: string;
  episode_count?: number;
  group_count?: number;
  network?: Network;
}

// Shared sub-interfaces
export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface ProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface SpokenLanguage {
  iso_639_1: string;
  name: string;
  english_name?: string;
}

export interface Collection {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

export interface Creator {
  id: number;
  credit_id: string;
  name: string;
  gender: number;
  profile_path: string | null;
}

export interface Network {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  credit_id: string;
  gender?: number;
  profile_path: string | null;
  order: number;
}

export interface Crew {
  id: number;
  name: string;
  job: string;
  department: string;
  credit_id: string;
  gender?: number;
  profile_path: string | null;
}

// Response interfaces
export interface SearchResponse<T> {
  page: number;
  content: T[];
  totalPages: number;
  totalResults: number;
  filteredFromOriginal?: number; // Number of items filtered out from original results
}

// Original TMDB Response interface (used internally by API)
export interface TMDBSearchResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
} 