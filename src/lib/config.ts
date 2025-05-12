/**
 * Application-wide configuration and constants
 */

// API Configuration
export const API_CONFIG = {
  TMDB: {
    BASE_URL: 'https://api.themoviedb.org/3',
    IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
    DEFAULT_POSTER_SIZE: 'w500',
    DEFAULT_BACKDROP_SIZE: 'original',
    PLACEHOLDER_POSTER: '/placeholder-poster.png',
    PLACEHOLDER_BACKDROP: '/placeholder-backdrop.png',
    CACHE_TTL: 3600, // Cache for 1 hour (in seconds)
  },
  VIDSRC: {
    BASE_URL: 'https://vidsrc.xyz',
    ALTERNATIVE_DOMAINS: ['vidsrc.xyz', 'vidsrc.to', 'vidsrc.me', 'vidsrc.in', 'vidsrc.net'],
    SEARCH_CACHE_TTL: 1800, // Cache for 30 minutes (in seconds)
  },
  INTERNAL: {
    SEARCH_ENDPOINT: '/api/search',
    MOVIES_ENDPOINT: '/api/movies',
    TV_ENDPOINT: '/api/tv',
    WATCH_HISTORY_ENDPOINT: '/api/watch-history',
  }
};

// Authentication Configuration
export const AUTH_CONFIG = {
  SESSION_MAX_AGE: 30 * 24 * 60 * 60, // 30 days in seconds
  SESSION_UPDATE_AGE: 24 * 60 * 60, // 24 hours in seconds
  PAGES: {
    SIGN_IN: '/login',
    SIGN_OUT: '/',
    ERROR: '/login',
    VERIFY_REQUEST: '/login',
    NEW_USER: '/profile',
  },
};

// Cache Configuration (for React Query)
export const CACHE_CONFIG = {
  DEFAULT: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  },
  CONTENT_DETAILS: {
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  },
  SEARCH: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
};

// Route Configuration
export const ROUTE_CONFIG = {
  HOME: '/',
  MOVIES: {
    LIST: '/movies',
    DETAILS: (id: string) => `/movie/${id}`,
  },
  TV: {
    LIST: '/tv',
    DETAILS: (id: string) => `/tv/${id}`,
    SEASON: (id: string, season: number) => `/tv/${id}/season/${season}`,
    EPISODE: (id: string, season: number, episode: number) => 
      `/tv/${id}/season/${season}/episode/${episode}`,
  },
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    PROFILE: '/profile',
  },
  USER: {
    WATCH_HISTORY: '/watch-history',
    FAVORITES: '/favorites',
  },
  SEARCH: '/search',
};

// UI Configuration
export const UI_CONFIG = {
  GRID_BREAKPOINTS: {
    sm: 2, // columns for small screens
    md: 3, // columns for medium screens
    lg: 4, // columns for large screens
    xl: 5, // columns for extra large screens
  },
  CARD_SIZES: {
    SMALL: {
      width: 160,
      height: 240,
    },
    MEDIUM: {
      width: 200,
      height: 300,
    },
    LARGE: {
      width: 300,
      height: 450,
    },
  },
  ANIMATION: {
    DURATION: 300, // in ms
  },
  DEBOUNCE_TIME: 300, // Milliseconds to wait before processing input changes
}; 