import { useQuery } from '@tanstack/react-query';
import { getLatestMovies, getLatestTVShows, getLatestEpisodes, Movie, TVShow, Episode } from '../api/vidsrc';

export const useLatestMovies = (page = 1, options = {}) => {
  return useQuery<{result: Movie[], pages: number}, Error>({
    queryKey: ['latestMovies', page],
    queryFn: () => getLatestMovies(page),
    ...options,
  });
};

export const useLatestTVShows = (page = 1, options = {}) => {
  return useQuery<{result: TVShow[], pages: number}, Error>({
    queryKey: ['latestTVShows', page],
    queryFn: () => getLatestTVShows(page),
    ...options,
  });
};

export const useLatestEpisodes = (page = 1, options = {}) => {
  return useQuery<{result: Episode[], pages: number}, Error>({
    queryKey: ['latestEpisodes', page],
    queryFn: () => getLatestEpisodes(page),
    ...options,
  });
}; 