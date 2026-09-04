import React from 'react';
import { Play, Info, Bookmark, Star, Sparkles, Check } from 'lucide-react';
import { Movie } from '../types';

interface HeroBannerProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  isBookmarked: boolean;
  onToggleBookmark: (movieId: string) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  onPlay,
  onOpenDetails,
  isBookmarked,
  onToggleBookmark,
}) => {
  return (
    <div className="relative w-full h-[65vh] sm:h-[75vh] max-h-[700px] min-h-[480px] overflow-hidden">
      {/* Backdrop Image */}
      <img
        src={movie.backdropUrl}
        alt={movie.title}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.75]"
      />

      {/* Cinematic Vignette & Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent max-w-4xl" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 sm:pb-16">
        <div className="max-w-2xl">
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-lg shadow-rose-950/40">
              <Sparkles className="w-3.5 h-3.5" />
              DESTACADA DE HOY
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-zinc-900/90 text-zinc-200 border border-zinc-700/80">
              {movie.quality}
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-zinc-900/90 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400" />
              {movie.rating}
            </span>
            <span className="text-xs text-zinc-300 font-medium">
              {movie.year} • {movie.duration} min
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg font-['Outfit'] mb-3">
            {movie.title}
          </h1>

          {/* Quote or Genres */}
          {movie.featuredQuote && (
            <p className="text-sm sm:text-base italic text-amber-200/90 font-medium mb-2 drop-shadow">
              "{movie.featuredQuote}"
            </p>
          )}

          {/* Synopsis */}
          <p className="text-xs sm:text-sm md:text-base text-zinc-300 line-clamp-3 mb-6 max-w-xl leading-relaxed drop-shadow">
            {movie.synopsis}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onPlay(movie)}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-rose-950/60 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-white translate-x-0.5" />
              <span>Ver Ahora en la App</span>
            </button>

            <button
              onClick={() => onOpenDetails(movie)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold text-sm sm:text-base border border-zinc-700/80 backdrop-blur-sm transition-all"
            >
              <Info className="w-4 h-4" />
              <span>Más Información</span>
            </button>

            <button
              onClick={() => onToggleBookmark(movie.id)}
              className={`p-3.5 rounded-xl border transition-all ${
                isBookmarked
                  ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                  : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
              title={isBookmarked ? 'Quitar de Mi Lista' : 'Guardar en Mi Lista'}
            >
              {isBookmarked ? (
                <Check className="w-5 h-5 text-rose-400" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
