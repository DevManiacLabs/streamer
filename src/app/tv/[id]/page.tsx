'use client';

import { useTVShowDetails } from "@/hooks/useTMDB";
import { getEpisodeEmbedUrl } from "@/api/vidsrc";
import { getPosterUrl, getBackdropUrl } from "@/api/tmdb";
import { useEffect, useState } from "react";
import Link from "next/link";
import { classNames } from "@/lib/utils";
import { ROUTE_CONFIG } from "@/lib/config";

/**
 * Loading skeleton component for TV show details
 */
function TVShowSkeleton() {
  return (
    <div className="container py-8" aria-label="Loading TV show details">
      <div className="animate-pulse">
        <div className="h-96 bg-gray-800 rounded-lg mb-8"></div>
        <div className="h-8 bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2"></div>
          <div className="h-4 bg-gray-800 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Error component for TV show not found
 */
function TVShowNotFound({ error }: { error?: Error }) {
  return (
    <div className="container py-16 px-4 text-center">
      <h1 className="text-2xl font-bold mb-4">TV Show not found</h1>
      <p className="text-gray-400 mb-8">
        {error ? error.message : "Unable to load TV show details"}
      </p>
      <Link 
        href={ROUTE_CONFIG.HOME} 
        className="inline-flex items-center px-6 py-3 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}

/**
 * TV show poster and info sidebar component
 */
function ShowSidebar({ show }: { show: any }) {
  // Filter out special seasons (season 0)
  const regularSeasons = show.seasons ? show.seasons.filter((season: any) => season.season_number > 0) : [];
  
  return (
    <div className="md:col-span-1">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden">
        <img
          src={getPosterUrl(show.poster_path)}
          alt={`${show.name} poster`}
          className="object-cover w-full h-full"
          loading="lazy"
        />
      </div>
      
      <div className="mt-6 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Show Info</h3>
        <div className="space-y-2">
          <InfoItem 
            label="First aired" 
            value={new Date(show.first_air_date).toLocaleDateString()} 
          />
          <InfoItem 
            label="Seasons" 
            value={String(regularSeasons.length || show.number_of_seasons || 0)} 
          />
          <InfoItem 
            label="Episodes" 
            value={String(show.number_of_episodes || "Unknown")} 
          />
          {show.status && (
            <InfoItem label="Status" value={show.status} />
          )}
          {show.networks && show.networks.length > 0 && (
            <InfoItem label="Network" value={show.networks[0].name} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Info item component for show details
 */
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="text-gray-400 w-32">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

/**
 * Show details header component
 */
function ShowHeader({ show }: { show: any }) {
  return (
    <>
      <h1 className="text-4xl font-bold mb-4">{show.name}</h1>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center">
          <span className="text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.4 7.4-6-4.6-6 4.6 2.4-7.4-6-4.6h7.6z" />
            </svg>
          </span>
          <span className="text-xl ml-1">{show.vote_average.toFixed(1)}</span>
        </div>
        <span className="text-gray-400">|</span>
        <span>{new Date(show.first_air_date).getFullYear()}</span>
        <span className="text-gray-400">|</span>
        <span>{show.original_language.toUpperCase()}</span>
        {show.genres && show.genres.length > 0 && (
          <>
            <span className="text-gray-400">|</span>
            <span>{show.genres.slice(0, 2).map((g: { id: number; name: string }) => g.name).join(', ')}</span>
          </>
        )}
      </div>

      <p className="text-lg mb-8">{show.overview}</p>
    </>
  );
}

/**
 * Season selector dropdown component
 */
function SeasonSelector({ 
  seasons, 
  selectedSeason, 
  onChange,
  totalSeasons
}: { 
  seasons: Array<any>; 
  selectedSeason: number; 
  onChange: (season: number) => void;
  totalSeasons: number;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  return (
    <div className="relative mb-6">
      <label htmlFor="season-selector" className="block text-sm font-medium text-gray-400 mb-2">
        Season
      </label>
      <div className="relative">
        <button 
          id="season-selector"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full bg-gray-800 px-4 py-3 rounded-lg flex justify-between items-center hover:bg-gray-700 transition-colors"
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
          aria-label={`Season ${selectedSeason}`}
        >
          <span>Season {selectedSeason}</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={classNames(
              "h-5 w-5 transition-transform",
              isDropdownOpen ? 'rotate-180' : ''
            )} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isDropdownOpen && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto"
            role="listbox"
            aria-label="Select a season"
          >
            {seasons.length > 0 ? 
              seasons.map((season) => (
                <button
                  key={season.season_number}
                  onClick={() => {
                    onChange(season.season_number);
                    setIsDropdownOpen(false);
                  }}
                  className={classNames(
                    "w-full text-left px-4 py-2 hover:bg-gray-700",
                    selectedSeason === season.season_number ? 'bg-primary text-white' : ''
                  )}
                  role="option"
                  aria-selected={selectedSeason === season.season_number}
                >
                  Season {season.season_number} {season.name !== `Season ${season.season_number}` ? `- ${season.name}` : ''}
                </button>
              )) : 
              Array.from({ length: totalSeasons || 1 }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onChange(idx + 1);
                    setIsDropdownOpen(false);
                  }}
                  className={classNames(
                    "w-full text-left px-4 py-2 hover:bg-gray-700",
                    selectedSeason === idx + 1 ? 'bg-primary text-white' : ''
                  )}
                  role="option"
                  aria-selected={selectedSeason === idx + 1}
                >
                  Season {idx + 1}
                </button>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Episode grid component
 */
function EpisodeGrid({ 
  showId, 
  seasonNumber, 
  episodeCount 
}: { 
  showId: string; 
  seasonNumber: number; 
  episodeCount: number;
}) {
  return (
    <div>
      <h3 className="block text-sm font-medium text-gray-400 mb-4">Episodes</h3>
      <div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
        role="list"
        aria-label={`Season ${seasonNumber} episodes`}
      >
        {Array.from({ length: episodeCount }).map((_, idx) => (
          <Link
            key={idx}
            href={`/tv/${showId}/season/${seasonNumber}/episode/${idx + 1}`}
            className="group"
            role="listitem"
          >
            <div className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-all group-hover:ring-2 group-hover:ring-primary">
              <div className="aspect-video bg-gray-700 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-10 w-10 text-gray-500 group-hover:text-primary transition-colors" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="p-3">
                <div className="font-medium">Episode {idx + 1}</div>
                <div className="text-xs text-gray-400 mt-1">Season {seasonNumber}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Main TV show page component
 */
export default function TVShowPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: show, isLoading, error } = useTVShowDetails(parseInt(id));
  const [selectedSeason, setSelectedSeason] = useState(1);

  // For better UX, accurately determine episodes per season
  const getEpisodesForSeason = (seasonNumber: number) => {
    if (!show || !show.seasons) {
      return 10; // Default if no data available
    }
    
    const season = show.seasons.find(s => s.season_number === seasonNumber);
    if (season && season.episode_count) {
      return season.episode_count;
    }
    
    // If we don't have exact data for this season, use a reasonable default
    if (show.number_of_episodes && show.number_of_seasons) {
      // Approximate based on average episodes per season
      return Math.ceil(show.number_of_episodes / show.number_of_seasons);
    }
    
    return 10; // Safe default
  };

  if (isLoading) {
    return <TVShowSkeleton />;
  }

  if (error || !show) {
    return <TVShowNotFound error={error instanceof Error ? error : undefined} />;
  }

  // Filter out special seasons (season 0)
  const regularSeasons = show.seasons ? show.seasons.filter(season => season.season_number > 0) : [];

  return (
    <div className="container py-8">
      {/* Backdrop image with gradient overlay */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/20 z-10"></div>
        <div 
          className="h-96 rounded-lg bg-cover bg-center"
          style={{
            backgroundImage: `url(${getBackdropUrl(show.backdrop_path)})`
          }}
          aria-hidden="true"
        ></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar with poster and info */}
        <ShowSidebar show={show} />

        {/* Main content */}
        <div className="md:col-span-2">
          <ShowHeader show={show} />

          {/* Episode selection interface */}
          <div className="bg-gray-900 rounded-xl overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold">Watch Episodes</h2>
              <p className="text-gray-400 mt-1">Select a season and episode to start watching</p>
            </div>
            
            <div className="p-6">
              {/* Season selector */}
              <SeasonSelector 
                seasons={regularSeasons}
                selectedSeason={selectedSeason}
                onChange={setSelectedSeason}
                totalSeasons={show.number_of_seasons || 1}
              />
              
              {/* Episode grid */}
              <EpisodeGrid 
                showId={id}
                seasonNumber={selectedSeason}
                episodeCount={getEpisodesForSeason(selectedSeason)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 