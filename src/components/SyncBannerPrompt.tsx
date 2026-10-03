import React from 'react';
import {
  Smartphone,
  Play,
  CheckCircle2,
  X,
  Bookmark,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CurrentPlayingState } from '../types';

interface SyncBannerPromptProps {
  importedFavoritesCount: number;
  importedProgressCount: number;
  currentPlaying?: CurrentPlayingState | null;
  onContinueWatching?: (currentPlaying: CurrentPlayingState) => void;
  onDismiss: () => void;
}

export const SyncBannerPrompt: React.FC<SyncBannerPromptProps> = ({
  importedFavoritesCount,
  importedProgressCount,
  currentPlaying,
  onContinueWatching,
  onDismiss,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-zinc-900/95 border-2 border-emerald-500/80 rounded-2xl sm:rounded-3xl p-4 shadow-2xl backdrop-blur-md text-white space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-950/40">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Sincronización Exitosa
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                ¡Sesión transferida desde tu Laptop!
              </h3>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
            title="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>
              <strong className="text-white">{importedFavoritesCount}</strong> Favoritos sincronizados
            </span>
          </div>
          <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white">{importedProgressCount}</strong> Progresos guardados
            </span>
          </div>
        </div>

        {/* Continue playing card if a movie was active */}
        {currentPlaying && currentPlaying.title && onContinueWatching && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 space-y-2">
            <div className="text-xs text-rose-300 font-semibold flex items-center justify-between">
              <span>Película en curso:</span>
              <span className="font-mono font-bold text-white bg-rose-900/60 px-2 py-0.5 rounded text-[11px]">
                Minuto {formatTime(currentPlaying.currentTime)}
              </span>
            </div>
            <div className="text-sm font-bold text-white truncate">
              {currentPlaying.title}
              {currentPlaying.episodeTitle ? ` • ${currentPlaying.episodeTitle}` : ''}
            </div>

            <button
              onClick={() => onContinueWatching(currentPlaying)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-950/50 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Continuar Viendo en tu Celular</span>
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onDismiss}
            className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
          >
            Entendido, explorar catálogo
          </button>
        </div>
      </div>
    </div>
  );
};
