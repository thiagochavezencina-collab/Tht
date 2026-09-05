import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie, WatchProgress } from '../types';
import { MovieCard } from './MovieCard';

interface CategoryRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  watchlist: string[];
  onToggleBookmark: (movieId: string) => void;
  watchProgressMap: Record<string, WatchProgress>;
  onEdit?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({
  title,
  subtitle,
  movies,
  onPlay,
  onOpenDetails,
  watchlist,
  onToggleBookmark,
  watchProgressMap,
  onEdit,
  onDelete,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (movies.length === 0) return null;

  return (
    <div className="my-8 relative group/row">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-3 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-['Outfit']">
            {title}
          </h2>
          {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-xs text-zinc-500 font-medium">
          {movies.length} {movies.length === 1 ? 'película' : 'películas'}
        </span>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 border border-zinc-700 text-white items-center justify-center opacity-0 group-hover/row:opacity-100 hover:bg-rose-600 transition-all shadow-xl"
        aria-label="Desplazar hacia la izquierda"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/80 border border-zinc-700 text-white items-center justify-center opacity-0 group-hover/row:opacity-100 hover:bg-rose-600 transition-all shadow-xl"
        aria-label="Desplazar hacia la derecha"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Carousel list */}
      <div
        ref={rowRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none px-4 sm:px-6 lg:px-8 pb-4 pt-1 scroll-smooth overscroll-x-contain touch-pan-x horizontal-scroll-container"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overscrollBehaviorX: 'contain' }}
      >
        {movies.map((movie) => (
          <div key={movie.id} className="w-44 sm:w-52 shrink-0">
            <MovieCard
              movie={movie}
              onPlay={onPlay}
              onOpenDetails={onOpenDetails}
              isBookmarked={watchlist.includes(movie.id)}
              onToggleBookmark={onToggleBookmark}
              progress={watchProgressMap[movie.id]}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
