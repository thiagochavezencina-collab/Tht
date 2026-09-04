import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Maximize2, X, Volume2, VolumeX } from 'lucide-react';
import { Movie } from '../types';
import { parseVideoSource } from '../utils/videoHelper';
import { resolvePlayableVideoUrl } from '../utils/videoStorage';

interface MiniPlayerProps {
  movie: Movie;
  currentTime: number;
  onRestore: () => void;
  onClose: () => void;
  onProgressUpdate: (movieId: string, currentTime: number, duration: number) => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  movie,
  currentTime,
  onRestore,
  onClose,
  onProgressUpdate,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playableUrl, setPlayableUrl] = useState<string>(movie.videoUrl);

  useEffect(() => {
    let isCancelled = false;
    resolvePlayableVideoUrl(movie.id, movie.videoUrl).then((liveUrl) => {
      if (!isCancelled) {
        setPlayableUrl(liveUrl);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [movie.id, movie.videoUrl]);

  const parsedSource = parseVideoSource(playableUrl);
  const isEmbed =
    parsedSource.type === 'youtube' ||
    parsedSource.type === 'vimeo' ||
    parsedSource.type === 'googledrive' ||
    parsedSource.type === 'dailymotion';

  useEffect(() => {
    if (!isEmbed && videoRef.current) {
      videoRef.current.currentTime = currentTime;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [movie.id, isEmbed, playableUrl]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEmbed) {
      onRestore();
      return;
    }
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div
      onClick={onRestore}
      className="fixed bottom-6 right-6 z-40 w-72 sm:w-80 aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-black/90 border border-zinc-700 bg-zinc-950 group cursor-pointer hover:border-rose-500/80 transition-all hover:scale-105"
      title="Hacer clic para expandir reproductor"
    >
      {isEmbed ? (
        <div className="w-full h-full relative bg-black">
          <iframe
            src={parsedSource.embedUrl || playableUrl}
            title={movie.title}
            className="w-full h-full border-0 pointer-events-none"
            allow="autoplay; encrypted-media"
          />
          {/* Overlay to catch clicks and restore */}
          <div className="absolute inset-0 bg-transparent" />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={playableUrl}
          className="w-full h-full object-cover"
          onTimeUpdate={() => {
            if (videoRef.current) {
              onProgressUpdate(movie.id, videoRef.current.currentTime, videoRef.current.duration || 0);
            }
          }}
        />
      )}

      {/* Floating Overlay Controls */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between pointer-events-auto">
        <div className="flex items-center justify-between">
          <span className="text-white text-xs font-semibold truncate max-w-[180px] drop-shadow">
            {movie.title}
          </span>
          <div className="flex items-center gap-1">
            {!isEmbed && (
              <button
                onClick={toggleMute}
                className="p-1 rounded-lg bg-black/60 text-white hover:bg-black/90"
                title="Silenciar / Sonido"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRestore();
              }}
              className="p-1 rounded-lg bg-black/60 text-white hover:bg-black/90"
              title="Expandir"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600"
              title="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="p-2.5 rounded-full bg-rose-600/90 text-white hover:bg-rose-500 shadow-lg"
          >
            {!isEmbed && isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white translate-x-0.5" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400">
          <span>{movie.contentType === 'series' ? 'Serie' : movie.quality}</span>
          <span className="text-rose-400 font-semibold">Clic para pantalla completa</span>
        </div>
      </div>
    </div>
  );
};
