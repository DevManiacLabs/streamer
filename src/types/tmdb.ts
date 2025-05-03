export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  runtime: number;
  original_language: string;
  genres: {
    id: number;
    name: string;
  }[];
}

export interface Season {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  season_number: number;
  episode_count: number;
  air_date: string;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  still_path: string | null;
  episode_number: number;
  season_number: number;
  air_date: string;
  runtime: number;
  vote_average: number;
}

export interface EpisodeGroup {
  id: string;
  name: string;
  description: string;
  episode_count: number;
  group_count: number;
  type: number;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  episode_run_time: number[];
  original_language: string;
  genres: {
    id: number;
    name: string;
  }[];
  number_of_seasons: number;
  number_of_episodes: number;
  seasons?: Season[];
  episode_groups?: EpisodeGroup[];
}

export interface SearchResponse<T> {
  content: T[];
  totalPages: number;
  totalResults: number;
  filteredFromOriginal: number;
} 