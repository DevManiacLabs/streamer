'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ROUTE_CONFIG } from '@/lib/config';
import { useWatchHistory } from "@/hooks/useWatchHistory";

export interface CardProps {
  id: string;
  title: string;
  type: 'movie' | 'tvshow';
  posterUrl: string;
  rating?: number;
  releaseDate?: string;
  className?: string;
}

/**
 * Card component for displaying movie or TV show content
 * 
 * Renders a clickable card with image, title, rating, and year
 * that links to the appropriate content details page.
 */
export function Card({ 
  id, 
  title, 
  type, 
  posterUrl, 
  rating, 
  releaseDate,
  className = ''
}: CardProps) {
  // Use watch history to get the last watched episode
  const { findInWatchHistory } = useWatchHistory();
  
  // Determine the link URL based on content type
  let href: string;
  
  if (type === 'movie') {
    href = ROUTE_CONFIG.MOVIES.DETAILS(id);
  } else {
    // For TV shows, check if there's a watch history
    const historyItem = findInWatchHistory(id, 'tvshow');
    
    if (historyItem && historyItem.seasonNumber && historyItem.episodeNumber) {
      // Link to the last watched episode
      href = ROUTE_CONFIG.TV.EPISODE(id, historyItem.seasonNumber, historyItem.episodeNumber);
    } else {
      // Default to show details page
      href = ROUTE_CONFIG.TV.DETAILS(id);
    }
  }
    
  // Extract year from release date if available
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  
  return (
    <Link 
      href={href} 
      className={`block group ${className}`}
      aria-label={`${title} (${year || 'No date'})`}
    >
      <div className="relative netflix-card-transition overflow-hidden rounded-md">
        <div className="relative aspect-[2/3] overflow-hidden">
          <Image
            src={posterUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
            priority={false}
          />
        </div>
        
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 bg-gradient-to-t from-black via-black/90 to-transparent pb-6">
          <h3 className="text-white font-medium text-sm md:text-base line-clamp-1 mb-1">{title}</h3>
          
          {(rating !== undefined || year) && (
            <div className="flex items-center gap-2 mb-2">
              {rating !== undefined && (
                <div className="flex items-center text-xs">
                  <span className="text-yellow-400" aria-hidden="true">★</span>
                  <span className="text-white ml-1">{rating.toFixed(1)}</span>
                </div>
              )}
              {year && (
                <span className="text-white/70 text-xs">{year}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button 
              className="rounded-full bg-white p-1.5 text-black hover:bg-white/90 transition"
              aria-label={`Play ${title}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <button 
              className="rounded-full border border-white/30 p-1.5 text-white hover:border-white transition"
              aria-label={`More info about ${title}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
} 