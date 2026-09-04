import React, { useState } from 'react';
import {
  X,
  Play,
  Star,
  Bookmark,
  Check,
  Clock,
  Calendar,
  Shield,
  MessageSquare,
  User,
  Send,
  Eye,
  Film,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Movie, UserReview, WatchProgress } from '../types';

interface MovieDetailModalProps {
  movie: Movie;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  isBookmarked: boolean;
  onToggleBookmark: (movieId: string) => void;
  reviews: UserReview[];
  onAddReview: (movieId: string, rating: number, comment: string) => void;
  progress?: WatchProgress;
  onEdit?: (movie: Movie) => void;
  onDelete?: (movie: Movie) => void;
}

export const MovieDetailModal: React.FC<MovieDetailModalProps> = ({
  movie,
  onClose,
  onPlay,
  isBookmarked,
  onToggleBookmark,
  reviews,
  onAddReview,
  progress,
  onEdit,
  onDelete,
}) => {
  const [userRating, setUserRating] = useState<number>(5);
  const [commentText, setCommentText] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('Espectador');

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddReview(movie.id, userRating, commentText.trim());
    setCommentText('');
  };

  const percent = progress && progress.duration ? (progress.currentTime / progress.duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl shadow-black my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Header in Modal */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-zinc-950">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter brightness-[0.7]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />

          {/* Quick Play Trigger over Hero */}
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white">
                  {movie.quality}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {movie.ageRating}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white font-['Outfit'] drop-shadow-md">
                {movie.title}
              </h1>
              {movie.originalTitle && movie.originalTitle !== movie.title && (
                <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                  Título original: {movie.originalTitle}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onPlay(movie);
                  onClose();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-xl shadow-rose-950/60 transition-transform hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{percent > 5 ? 'Continuar Viendo' : 'Reproducir Ahora'}</span>
              </button>

              <button
                onClick={() => onToggleBookmark(movie.id)}
                className={`p-3 rounded-xl border transition-all ${
                  isBookmarked
                    ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-700'
                }`}
                title={isBookmarked ? 'Quitar de Mi Lista' : 'Guardar en Mi Lista'}
              >
                {isBookmarked ? <Check className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </button>

              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(movie);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-amber-300 font-semibold text-xs sm:text-sm transition-all"
                  title="Editar nombre y detalles"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar Nombre</span>
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => {
                    if (confirm(`¿Estás seguro de que deseas eliminar "${movie.title}"?`)) {
                      onDelete(movie);
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 font-semibold text-xs sm:text-sm transition-all"
                  title="Eliminar de la plataforma"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Eliminar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-zinc-300">
              <Calendar className="w-4 h-4 text-zinc-500" />
              <div>
                <span className="block text-[11px] text-zinc-500 font-medium">Estreno</span>
                <span className="font-semibold">{movie.year}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-zinc-300">
              <Clock className="w-4 h-4 text-zinc-500" />
              <div>
                <span className="block text-[11px] text-zinc-500 font-medium">Duración</span>
                <span className="font-semibold">{movie.duration} minutos</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-zinc-300">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <div>
                <span className="block text-[11px] text-zinc-500 font-medium">Calificación</span>
                <span className="font-semibold text-amber-400">{movie.rating} / 10</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-zinc-300">
              <Eye className="w-4 h-4 text-zinc-500" />
              <div>
                <span className="block text-[11px] text-zinc-500 font-medium">Visualizaciones</span>
                <span className="font-semibold">{movie.viewsCount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <h3 className="text-base font-bold text-white mb-2 font-['Outfit']">Sinopsis</h3>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              {movie.synopsis}
            </p>
          </div>

          {/* Cast & Crew */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-1">
                Dirección
              </span>
              <p className="text-zinc-200 font-medium">{movie.director}</p>
            </div>

            <div>
              <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-1">
                Reparto Principal
              </span>
              <p className="text-zinc-200 font-medium">{movie.cast.join(', ')}</p>
            </div>
          </div>

          {/* Genres Tags */}
          <div>
            <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-2">
              Géneros
            </span>
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {/* Episodes list if series */}
          {movie.contentType === 'series' && movie.episodes && movie.episodes.length > 0 && (
            <div className="border-t border-zinc-800 pt-6">
              <h3 className="text-base font-bold text-white mb-3 font-['Outfit'] flex items-center gap-2">
                <Film className="w-4 h-4 text-rose-500" />
                <span>Episodios de la Serie ({movie.episodes.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {movie.episodes.map((ep, idx) => (
                  <div
                    key={ep.id || idx}
                    onClick={() => {
                      onPlay({
                        ...movie,
                        videoUrl: ep.videoUrl || movie.videoUrl,
                        title: `${movie.title} - E${ep.episodeNumber}: ${ep.title}`,
                      });
                      onClose();
                    }}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/60 cursor-pointer group transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 group-hover:bg-rose-600 group-hover:text-white text-zinc-400 flex items-center justify-center text-xs font-bold transition-colors">
                        {ep.episodeNumber || idx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-rose-400 transition-colors">
                          {ep.title}
                        </h4>
                        <span className="text-[11px] text-zinc-400">
                          {ep.duration ? `${ep.duration} min` : '45 min'}
                        </span>
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-zinc-500 group-hover:text-rose-500 group-hover:scale-110 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* User Reviews Section */}
          <div className="border-t border-zinc-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-rose-500" />
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                Comentarios y Reseñas ({reviews.length})
              </h3>
            </div>

            {/* New Review Input Form */}
            <form onSubmit={handleSubmitReview} className="mb-6 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800">
              <span className="text-xs font-bold text-zinc-400 block mb-2">
                ¿Viste esta película? Deja tu opinión:
              </span>

              <div className="flex flex-wrap items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                      title={`${star} estrellas`}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= userRating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs text-amber-400 font-bold">
                  {userRating} de 5 estrellas
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe tu reseña sobre la película..."
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publicar</span>
                </button>
              </div>
            </form>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">
                Aún no hay reseñas para esta película. ¡Sé el primero en compartir qué te pareció!
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 flex gap-3"
                  >
                    <img
                      src={rev.userAvatar}
                      alt={rev.userName}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-zinc-700"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-semibold text-zinc-200">
                          {rev.userName}
                        </span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(rev.rating)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-zinc-700'
                              }`}
                            />
                          ))}
                          <span className="text-[10px] text-zinc-500 ml-1">{rev.date}</span>
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
