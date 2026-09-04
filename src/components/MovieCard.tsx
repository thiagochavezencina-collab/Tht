import React from 'react';
import { Play, Star, Bookmark, Check, Info, Clock, Pencil, Trash2 } from 'lucide-react';
import { Movie, WatchProgress } from '../types';

interface MovieCardProps {
  movie: Movie;
  onPlay: (movie: Movie) => void;
  onOpenDetails: (movie: Movie) => void;
  isBookmarked: boolean;
  onToggleBookmark: (movieId: string) => void;
  progress?: WatchProgress;
  onEdit?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onPlay,
  onOpenDetails,
  isBookmarked,
  onToggleBookmark,
  progress,
  onEdit,
  onDelete,
}) => {
  const percent = progress && progress.duration ? (progress.currentTime / progress.duration) * 100 : 0;

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl hover:shadow-black/80 flex flex-col">
      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <div className="flex items-center gap-1">
            {movie.contentType === 'series' ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white shadow-md">
                SERIE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/80 text-rose-400 border border-rose-500/30 backdrop-blur-sm">
                {movie.quality.split(' ')[0]}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/80 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{movie.rating}</span>
          </div>
        </div>

        {/* Hover Overlay with Action Buttons */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4 z-20">
          <div className="flex items-center gap-1.5 mb-2">
            <button
              onClick={() => onPlay(movie)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50 transition-all hover:scale-102"
              title="Ver película ahora"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{percent > 5 ? 'Continuar' : 'Ver Ahora'}</span>
            </button>
            <button
              onClick={() => onToggleBookmark(movie.id)}
              className={`p-2 rounded-xl border transition-colors ${
                isBookmarked
                  ? 'bg-rose-950/60 border-rose-500 text-rose-400'
                  : 'bg-zinc-900/90 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
              title={isBookmarked ? 'Quitar de Mi Lista' : 'Guardar en Mi Lista'}
            >
              {isBookmarked ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onOpenDetails(movie)}
              className="p-2 rounded-xl bg-zinc-900/90 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Detalles y Ficha Técnica"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Edit & Delete Controls inside Overlay */}
          <div className="flex items-center gap-1.5 mb-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(movie);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-[11px] font-semibold transition-colors"
                title="Editar nombre y detalles"
              >
                <Pencil className="w-3 h-3 text-amber-400" />
                <span>Editar</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(movie);
                }}
                className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-rose-950/80 border border-zinc-700 hover:border-rose-700 text-zinc-400 hover:text-rose-400 text-[11px] font-semibold transition-colors"
                title="Eliminar película o serie"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          <p className="text-[11px] text-zinc-300 line-clamp-2 leading-tight">
            {movie.synopsis}
          </p>
        </div>

        {/* Watch Progress Bar if partially watched */}
        {percent > 2 && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-zinc-800 z-10">
            <div
              className="h-full bg-rose-600 rounded-r-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Info Bottom */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5">
            <h3
              onClick={() => onOpenDetails(movie)}
              className="text-sm font-semibold text-zinc-100 hover:text-rose-400 transition-colors cursor-pointer truncate flex-1"
              title={movie.title}
            >
              {movie.title}
            </h3>

            {/* Quick edit button always visible on mobile/small screens */}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(movie);
                }}
                className="text-zinc-500 hover:text-amber-400 p-0.5 rounded transition-colors shrink-0"
                title="Editar nombre"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
            <span>{movie.year}</span>
            <span>•</span>
            <span className="flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {movie.duration}m
            </span>
            <span>•</span>
            <span className="px-1 rounded bg-zinc-800 text-[10px] text-zinc-300">
              {movie.ageRating}
            </span>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {movie.genres.slice(0, 2).map((g) => (
            <span
              key={g}
              className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800/80 text-zinc-400"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
