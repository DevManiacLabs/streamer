import Link from 'next/link';
import Image from 'next/image';

export interface CardProps {
  id: string;
  title: string;
  type: 'movie' | 'tvshow';
  posterUrl: string;
  rating?: number;
  releaseDate?: string;
}

export function Card({ id, title, type, posterUrl, rating, releaseDate }: CardProps) {
  // For TV shows, redirect directly to season 1, episode 1
  const href = type === 'movie' 
    ? `/movie/${id}` 
    : `/tv/${id}/season/1/episode/1`;
    
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  
  return (
    <Link href={href} className="block group">
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
          
          {(rating || year) && (
            <div className="flex items-center gap-2 mb-2">
              {rating && (
                <div className="flex items-center text-xs">
                  <span className="text-yellow-400">★</span>
                  <span className="text-white ml-1">{rating.toFixed(1)}</span>
                </div>
              )}
              {year && (
                <span className="text-white/70 text-xs">{year}</span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button className="rounded-full bg-white p-1.5 text-black hover:bg-white/90 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
            <button className="rounded-full border border-white/30 p-1.5 text-white hover:border-white transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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