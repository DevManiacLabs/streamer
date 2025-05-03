'use client';

import { useParams, useRouter } from 'next/navigation';
import { getPosterUrl, getBackdropUrl } from '@/api/tmdb';
import { useTVShowDetails, useTVSeasonDetails, useTVEpisodeDetails } from '@/hooks/useTMDB';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWatchHistory } from '@/hooks/useWatchHistory';

export default function EpisodePage() {
  const params = useParams();
  const router = useRouter();
  const showId = params.id as string;
  const seasonNumber = parseInt(params.season as string, 10);
  const episodeNumber = parseInt(params.episode as string, 10);
  
  const { data: show, isLoading: showLoading } = useTVShowDetails(parseInt(showId));
  const { data: season, isLoading: seasonLoading } = useTVSeasonDetails(parseInt(showId), seasonNumber);
  const { data: episodeDetails, isLoading: episodeLoading } = useTVEpisodeDetails(parseInt(showId), seasonNumber, episodeNumber);
  const { addToHistory, isAuthenticated } = useWatchHistory();
  
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
  const [episodeDropdownOpen, setEpisodeDropdownOpen] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Create multiple embed URL formats to try in case one fails
  // These are the different formats supported by VidSrc as per their documentation
  const embedSources = [
    // Format 1: Path-based URL (recommended in docs)
    `https://vidsrc.xyz/embed/tv/${showId}/${seasonNumber}-${episodeNumber}`,
    // Format 2: Query parameter-based URL
    `https://vidsrc.xyz/embed/tv?tmdb=${showId}&season=${seasonNumber}&episode=${episodeNumber}`,
    // Format 3: Alternative domain
    `https://vidsrc.to/embed/tv/${showId}/${seasonNumber}-${episodeNumber}`,
    // Format 4: Another alternative domain
    `https://vidsrc.me/embed/tv/${showId}/${seasonNumber}-${episodeNumber}`
  ];

  useEffect(() => {
    // When the episode page loads, check if the episode is available and update in DB via API
    if (show && !showLoading) {
      const updateAvailability = async () => {
        try {
          // Use the API route instead of direct MongoDB access
          const response = await fetch('/api/tv/episodes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tvId: showId,
              seasonNumber: seasonNumber,
              episodeNumber: episodeNumber
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to update episode availability');
          }
        } catch (error) {
          console.error('Failed to update episode availability:', error);
        }
      };
      
      updateAvailability();
    }
  }, [showId, seasonNumber, episodeNumber, show, showLoading]);

  useEffect(() => {
    // Add to watch history when episode is loaded
    if (show && episodeDetails && isAuthenticated && !episodeLoading && !showLoading) {
      addToHistory.mutate({
        contentType: 'tvshow',
        contentId: showId,
        contentName: show.name,
        posterPath: show.poster_path,
        seasonNumber,
        episodeNumber,
        episodeName: episodeDetails.name || `Episode ${episodeNumber}`
      });
    }
  }, [show, episodeDetails, showId, seasonNumber, episodeNumber, isAuthenticated, episodeLoading, showLoading, addToHistory]);

  // Calculate accurate number of episodes per season
  const getMaxEpisodes = () => {
    if (season && season.episode_count) {
      return season.episode_count;
    }
    
    if (show && show.seasons) {
      const currentSeason = show.seasons.find(s => s.season_number === seasonNumber);
      if (currentSeason && currentSeason.episode_count) {
        return currentSeason.episode_count;
      }
    }
    
    // Safe default using show data if available
    if (show?.number_of_episodes && show?.number_of_seasons) {
      // Average episodes per season, with a maximum to avoid UI issues
      const avgEpisodesPerSeason = Math.min(
        Math.ceil(show.number_of_episodes / show.number_of_seasons),
        30 // Cap at 30 episodes per season for UI sanity
      );
      
      return Math.max(avgEpisodesPerSeason, 8); // At least 8 episodes per season as a reasonable minimum
    }
    
    return 10; // Safe default
  };

  const getSeasonCount = () => {
    if (show?.seasons) {
      // Filter out specials (season 0)
      const regularSeasons = show.seasons.filter(s => s.season_number > 0);
      return regularSeasons.length;
    }
    
    // Apply sanity check for unrealistic season counts
    if (show?.number_of_seasons && show.number_of_seasons > 0 && show.number_of_seasons < 100) {
      return show.number_of_seasons;
    }
    
    return 1; // Safe default
  };

  const navigateToEpisode = (s: number, e: number) => {
    router.push(`/tv/${showId}/season/${s}/episode/${e}`);
  };

  const handleNextEpisode = () => {
    const maxEpisodes = getMaxEpisodes();
    if (episodeNumber < maxEpisodes) {
      navigateToEpisode(seasonNumber, episodeNumber + 1);
    } else if (seasonNumber < getSeasonCount()) {
      navigateToEpisode(seasonNumber + 1, 1);
    }
  };

  const handlePreviousEpisode = () => {
    if (episodeNumber > 1) {
      navigateToEpisode(seasonNumber, episodeNumber - 1);
    } else if (seasonNumber > 1) {
      // Need to get the episode count for the previous season
      let prevSeasonEpisodes = 10; // Default
      
      if (show?.seasons) {
        const prevSeason = show.seasons.find(s => s.season_number === seasonNumber - 1);
        if (prevSeason && prevSeason.episode_count) {
          prevSeasonEpisodes = prevSeason.episode_count;
        }
      }
      
      navigateToEpisode(seasonNumber - 1, prevSeasonEpisodes);
    }
  };

  // Function to try the next source
  const tryNextSource = () => {
    if (currentSourceIndex < embedSources.length - 1) {
      setCurrentSourceIndex(currentSourceIndex + 1);
    } else {
      // If we've tried all sources, go back to the first one
      setCurrentSourceIndex(0);
    }
  };

  // Reset source index when episode or season changes
  useEffect(() => {
    setCurrentSourceIndex(0);
  }, [showId, seasonNumber, episodeNumber]);

  // Current embed URL
  const currentEmbedUrl = embedSources[currentSourceIndex];

  // Get the episode title
  const getEpisodeTitle = () => {
    if (episodeDetails && episodeDetails.name) {
      return episodeDetails.name;
    }
    return `Season ${seasonNumber}, Episode ${episodeNumber}`;
  };

  if (showLoading || seasonLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-[56.25vw] max-h-[70vh] bg-gray-900 rounded-lg mb-6"></div>
          <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 px-4">
      {/* Video Player with source selector */}
      <div className="mb-6">
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative">
          <iframe
            ref={iframeRef}
            src={currentEmbedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            title={`${show?.name} - S${seasonNumber}E${episodeNumber}`}
          />
        </div>
        
        {/* Source selector controls */}
        <div className="mt-3 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm text-gray-400 mr-2">Source:</span>
            <div className="flex gap-2">
              {embedSources.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSourceIndex(idx)}
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    currentSourceIndex === idx
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  aria-label={`Source ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={tryNextSource}
            className="text-sm px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-md flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Another Source
          </button>
        </div>
      </div>
      
      {/* Episode title and navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold">
            {getEpisodeTitle()}
          </h1>
          
          <div className="flex items-center mt-4 sm:mt-0">
            <button 
              onClick={handlePreviousEpisode}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-l-lg"
              aria-label="Previous episode"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="px-4 py-2 bg-gray-800">
              S{seasonNumber} E{episodeNumber}
            </div>
            
            <button 
              onClick={handleNextEpisode}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-r-lg"
              aria-label="Next episode"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        {episodeDetails && episodeDetails.overview && (
          <p className="text-gray-300 mt-4">
            {episodeDetails.overview}
          </p>
        )}
        
        {episodeDetails && episodeDetails.air_date && (
          <div className="text-sm text-gray-400 mt-2">
            Air date: {new Date(episodeDetails.air_date).toLocaleDateString()}
          </div>
        )}
      </div>
      
      {/* Show details and episode navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column for show info */}
        <div className="lg:col-span-1">
          {show && (
            <div className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="aspect-[2/3] relative">
                <Image
                  src={getPosterUrl(show.poster_path)}
                  alt={show.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-bold mb-2">{show.name}</h2>
                <div className="flex items-center text-sm text-gray-400 mb-4">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    {show.vote_average.toFixed(1)}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{new Date(show.first_air_date).getFullYear()}</span>
                  <span className="mx-2">•</span>
                  <span>
                    {getSeasonCount()} Season{getSeasonCount() !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <Link 
                  href={`/tv/${showId}`}
                  className="text-sm text-primary hover:underline block mb-2"
                >
                  View all seasons
                </Link>
                
                {season && (
                  <Link 
                    href={`/tv/${showId}/season/${seasonNumber}`}
                    className="text-sm text-primary hover:underline block"
                  >
                    Back to season {seasonNumber}
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Episode selector grid */}
        <div className="lg:col-span-3">
          <div className="bg-gray-900 rounded-lg p-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                  className="w-full sm:w-auto bg-gray-800 px-4 py-2 rounded flex items-center justify-between gap-2 hover:bg-gray-700"
                >
                  <span>Season {seasonNumber}</span>
                  <svg className={`w-5 h-5 transition-transform ${seasonDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {seasonDropdownOpen && (
                  <div className="absolute top-full left-0 z-10 mt-1 bg-gray-800 rounded-lg shadow-lg overflow-y-auto max-h-60 w-full sm:w-48">
                    {show?.seasons 
                      ? show.seasons
                          .filter(s => s.season_number > 0)
                          .map(s => (
                            <button
                              key={s.season_number}
                              onClick={() => {
                                navigateToEpisode(s.season_number, 1);
                                setSeasonDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${seasonNumber === s.season_number ? 'bg-gray-700' : ''}`}
                            >
                              Season {s.season_number}
                            </button>
                          ))
                      : Array.from({ length: getSeasonCount() }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              navigateToEpisode(idx + 1, 1);
                              setSeasonDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${seasonNumber === idx + 1 ? 'bg-gray-700' : ''}`}
                          >
                            Season {idx + 1}
                          </button>
                        ))
                    }
                  </div>
                )}
              </div>
              
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setEpisodeDropdownOpen(!episodeDropdownOpen)}
                  className="w-full sm:w-auto bg-gray-800 px-4 py-2 rounded flex items-center justify-between gap-2 hover:bg-gray-700"
                >
                  <span>Episode {episodeNumber}</span>
                  <svg className={`w-5 h-5 transition-transform ${episodeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {episodeDropdownOpen && (
                  <div className="absolute top-full left-0 z-10 mt-1 bg-gray-800 rounded-lg shadow-lg overflow-y-auto max-h-60 w-full sm:w-48">
                    {Array.from({ length: getMaxEpisodes() }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          navigateToEpisode(seasonNumber, idx + 1);
                          setEpisodeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-700 ${episodeNumber === idx + 1 ? 'bg-gray-700' : ''}`}
                      >
                        Episode {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">More Episodes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: Math.min(10, getMaxEpisodes()) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => navigateToEpisode(seasonNumber, idx + 1)}
                  className={`p-3 text-center rounded ${
                    episodeNumber === idx + 1 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              {getMaxEpisodes() > 10 && (
                <button
                  onClick={() => setEpisodeDropdownOpen(true)}
                  className="p-3 text-center rounded bg-gray-800 hover:bg-gray-700"
                >
                  ...
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 