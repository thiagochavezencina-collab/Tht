import React, { useState, useRef, useEffect, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Subtitles,
  X,
  Minimize2,
  Tv,
  Film,
  Sparkles,
  ListVideo,
  ExternalLink,
  AlertCircle,
  SkipForward,
  Gauge,
  RefreshCw,
  Upload,
  Link2,
  Smartphone,
  Laptop,
  Cloud,
  Check,
  Search,
} from 'lucide-react';
import { Movie, PlayerMode, Episode } from '../types';
import { parseVideoSource } from '../utils/videoHelper';
import { saveVideoBlob, resolvePlayableVideoUrl } from '../utils/videoStorage';
import { updateMovieInFirestore } from '../firestoreService';

// Helper: Format seconds to MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

interface VideoPlayerModalProps {
  movie: Movie;
  onClose: () => void;
  onMinimize: () => void;
  onSelectMovie: (movie: Movie) => void;
  allMovies: Movie[];
  initialTime?: number;
  onProgressUpdate: (movieId: string, currentTime: number, duration: number) => void;
  onUpdateMovie?: (movie: Movie) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  movie,
  onClose,
  onMinimize,
  onSelectMovie,
  allMovies,
  initialTime = 0,
  onProgressUpdate,
  onUpdateMovie,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);

  // Determine episodes and current active episode
  const episodesList: Episode[] = movie.episodes || [];
  const hasEpisodes = episodesList.length > 0;

  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState<number>(() => {
    if (!hasEpisodes) return 0;
    // Try to match by videoUrl
    const idx = episodesList.findIndex((ep) => ep.videoUrl === movie.videoUrl);
    return idx >= 0 ? idx : 0;
  });

  const [showEpisodesDrawer, setShowEpisodesDrawer] = useState(false);

  // Active video URL & title
  const activeEpisode = hasEpisodes ? episodesList[currentEpisodeIndex] : null;
  const activeEpisodeId = activeEpisode?.id || movie.id;
  const rawVideoUrl = activeEpisode?.videoUrl || movie.videoUrl;
  const activeVideoUrl = rawVideoUrl;
  const [playableVideoUrl, setPlayableVideoUrl] = useState<string>(rawVideoUrl || '');

  const activeDisplayTitle = activeEpisode
    ? `${movie.title} - E${activeEpisode.episodeNumber}: ${activeEpisode.title}`
    : movie.title;

  // Source selection modal & custom URL states
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [inputWebUrl, setInputWebUrl] = useState('');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const [hasVideoError, setHasVideoError] = useState(() => !rawVideoUrl || rawVideoUrl.trim() === '');
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(() => !!rawVideoUrl && rawVideoUrl.trim() !== '');
  const [isBuffering, setIsBuffering] = useState(false);

  // Resolve video URL from local IndexedDB if stored as a file
  useEffect(() => {
    let isCancelled = false;
    setHasEnded(false);
    setCurrentTime(0);

    resolvePlayableVideoUrl(activeEpisodeId, rawVideoUrl || '').then((liveUrl) => {
      if (!isCancelled) {
        const hasValidUrl = liveUrl && liveUrl.trim() !== '' && !liveUrl.startsWith('blob:null');
        if (!hasValidUrl) {
          setPlayableVideoUrl('');
          setHasVideoError(true);
          setIsPlaying(false);
          setErrorMessage(
            movie.hasLocalFile
              ? `El archivo "${movie.fileName || 'video local'}" fue añadido desde tu celular y reside físicamente en la memoria de ese teléfono.`
              : 'No se encontró un archivo o enlace de video para reproducir.'
          );
        } else {
          setPlayableVideoUrl(liveUrl);
          setHasVideoError(false);
          setErrorMessage('');
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeEpisodeId, rawVideoUrl, movie.hasLocalFile, movie.fileName]);

  // Source detection
  const parsedSource = parseVideoSource(playableVideoUrl);
  // Only embed if explicitly YouTube, Vimeo, Google Drive, or DailyMotion
  const isEmbedSource =
    parsedSource.type === 'youtube' ||
    parsedSource.type === 'vimeo' ||
    parsedSource.type === 'googledrive' ||
    parsedSource.type === 'dailymotion';

  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('es');
  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [resumeToast, setResumeToast] = useState<string | null>(
    initialTime > 5 ? `Continuando desde ${formatTime(initialTime)}` : null
  );

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Initialize HLS for .m3u8 streaming or bind direct URL
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playableVideoUrl || isEmbedSource) return;

    const isHlsUrl =
      playableVideoUrl.includes('.m3u8') ||
      playableVideoUrl.includes('application/x-mpegURL');

    if (isHlsUrl) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(playableVideoUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.warn('[Hls.js] Fatal streaming error:', data);
            handleVideoError();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = playableVideoUrl;
      }
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      video.src = playableVideoUrl;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [playableVideoUrl, isEmbedSource]);

  // Next suggested movies
  const nextMovies = allMovies.filter((m) => m.id !== movie.id).slice(0, 3);

  // Next episode availability
  const hasNextEpisode = hasEpisodes && currentEpisodeIndex < episodesList.length - 1;

  const isSpiderMan =
    movie.title.toLowerCase().includes('spider') ||
    movie.title.toLowerCase().includes('araña') ||
    (movie.fileName ? movie.fileName.toLowerCase().includes('spider') : false);
  const spiderManTrailer = 'https://www.youtube.com/watch?v=g4Hbz2jLxvQ';

  // Save web URL to Firestore & play immediately
  const handleSaveWebUrl = async (urlToSave?: string) => {
    const targetUrl = (urlToSave || inputWebUrl).trim();
    if (!targetUrl) return;

    setIsSavingUrl(true);
    setSaveSuccessMsg('');
    try {
      setPlayableVideoUrl(targetUrl);
      setHasVideoError(false);
      setErrorMessage('');
      setShowSourceModal(false);
      setIsPlaying(true);

      const updatedMovie: Movie = {
        ...movie,
        videoUrl: targetUrl,
        hasLocalFile: false,
      };

      if (hasEpisodes && activeEpisode) {
        const updatedEpisodes = episodesList.map((ep, idx) =>
          idx === currentEpisodeIndex ? { ...ep, videoUrl: targetUrl, hasLocalFile: false } : ep
        );
        updatedMovie.episodes = updatedEpisodes;
      }

      await updateMovieInFirestore(movie.id, {
        videoUrl: targetUrl,
        hasLocalFile: false,
        ...(updatedMovie.episodes ? { episodes: updatedMovie.episodes } : {}),
      });

      if (onUpdateMovie) {
        onUpdateMovie(updatedMovie);
      }
      setSaveSuccessMsg('¡Enlace guardado en la nube!');
      setTimeout(() => setSaveSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Error updating video URL in Firestore:', err);
    } finally {
      setIsSavingUrl(false);
    }
  };

  // Handler for re-attaching local video file if browser lost blob or on secondary device
  const handleReattachVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await saveVideoBlob(activeEpisodeId, file);
      const newLiveUrl = URL.createObjectURL(file);
      setPlayableVideoUrl(newLiveUrl);
      setHasVideoError(false);
      setErrorMessage('');
      setShowSourceModal(false);
      setIsPlaying(true);

      const updatedMovie: Movie = {
        ...movie,
        hasLocalFile: true,
        fileName: file.name,
      };

      if (onUpdateMovie) {
        onUpdateMovie(updatedMovie);
      }
    } catch (err) {
      console.error('Error saving local video file:', err);
    }
  };

  // Handle auto-hide controls on inactivity
  const showControlsTemporarily = useCallback(() => {
    setAreControlsVisible(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setAreControlsVisible(false);
        setShowSpeedMenu(false);
        setShowSubtitlesMenu(false);
      }
    }, 3500);
  }, [isPlaying]);

  // Video time update listener
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);
    onProgressUpdate(movie.id, current, videoRef.current.duration || 0);

    // Update Subtitles based on current time
    if (selectedSubtitle !== 'off' && movie.subtitles) {
      const activeSubTrack = movie.subtitles.find((s) => s.lang === selectedSubtitle);
      if (activeSubTrack && activeSubTrack.cues) {
        const matchingCue = activeSubTrack.cues.find(
          (cue) => current >= cue.start && current <= cue.end
        );
        setCurrentSubtitleText(matchingCue ? matchingCue.text : '');
      } else {
        setCurrentSubtitleText('');
      }
    } else {
      setCurrentSubtitleText('');
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setDuration(dur);
    if (initialTime > 0 && initialTime < dur) {
      videoRef.current.currentTime = initialTime;
    }
    setHasVideoError(false);
    videoRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        // Autoplay policy: mobile browsers require a user gesture before starting playback unmuted.
        // This is normal and expected on iOS/Android; the user can simply tap the play button.
        setIsPlaying(false);
      });
  };

  const handleVideoError = () => {
    const err = videoRef.current?.error;
    let detail =
      'El reproductor nativo no pudo decodificar este enlace de video directamente.';

    if (err) {
      if (err.code === 2) {
        detail =
          'Error de red al conectar con el servidor del video. Es posible que el servidor limite la tasa de descarga o rechace peticiones externas.';
      } else if (err.code === 3) {
        detail =
          'Error al decodificar el video. El códec o perfil no es compatible directamente con el reproductor de este navegador móvil.';
      } else if (err.code === 4) {
        detail =
          'Acceso denegado o formato no soportado. Común en servidores con enlaces protegidos por token temporal (?s=...) vinculados a una sola dirección IP.';
      }
    }

    setHasVideoError(true);
    setIsPlaying(false);
    setErrorMessage(detail);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    showControlsTemporarily();
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !progressTrackRef.current) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(pos * duration, duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressTrackRef.current || duration === 0) return;
    const rect = progressTrackRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const clampedPos = Math.max(0, Math.min(pos, 1));
    setHoverPosition(e.clientX - rect.left);
    setHoverTime(clampedPos * duration);
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.currentTime + seconds, duration)
    );
    showControlsTemporarily();
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    const v = Math.max(0, Math.min(newVolume, 1));
    videoRef.current.volume = v;
    setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleSpeedSelect = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      } else {
        onMinimize();
      }
    } catch {
      onMinimize();
    }
  };

  const handleNextEpisode = () => {
    if (hasNextEpisode) {
      setCurrentEpisodeIndex((prev) => prev + 1);
      setHasEnded(false);
    }
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (!isEmbedSource) togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          if (!isEmbedSource) toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          if (!isEmbedSource) handleSkip(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          if (!isEmbedSource) handleSkip(10);
          break;
        case 'escape':
          if (isFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isPlaying, volume, duration, isEmbedSource]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Clear resume toast after 3s
  useEffect(() => {
    if (resumeToast) {
      const timer = setTimeout(() => setResumeToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [resumeToast]);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const isUsingEmbed = isEmbedSource;

  return (
    <div
      ref={containerRef}
      onMouseMove={showControlsTemporarily}
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-all duration-300 select-none overflow-hidden ${
        isTheaterMode ? 'p-0' : 'p-0 sm:p-4 md:p-8 bg-zinc-950/95 backdrop-blur-xl'
      }`}
    >
      {/* Ambient Backdrop Glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none filter blur-3xl scale-125 transition-all duration-1000"
        style={{
          backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Main Video Wrapper */}
      <div
        className={`relative w-full overflow-hidden bg-black shadow-2xl transition-all duration-300 ${
          isTheaterMode || isFullscreen
            ? 'h-full w-full rounded-none'
            : 'max-w-6xl aspect-video max-h-[85vh] rounded-2xl border border-zinc-800/80 shadow-rose-950/20'
        }`}
      >
        {/* RENDER CASE 1: External Platform Embed (YouTube, Vimeo, Google Drive, Dailymotion) */}
        {isUsingEmbed ? (
          <div className="w-full h-full bg-black relative flex items-center justify-center">
            <iframe
              src={parsedSource.embedUrl || playableVideoUrl}
              title={activeDisplayTitle}
              className="w-full h-full border-0 bg-black"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        ) : (
          /* RENDER CASE 2: Native HTML5 Video Element with Full Controls & Minute Bar */
          <div className="w-full h-full relative flex items-center justify-center bg-black">
            {playableVideoUrl && !hasVideoError && (
              <>
                <video
                  ref={videoRef}
                  src={
                    playableVideoUrl.includes('.m3u8') && Hls.isSupported()
                      ? undefined
                      : playableVideoUrl
                  }
                  className="w-full h-full object-contain cursor-pointer"
                  playsInline
                  preload="auto"
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  webkit-playsinline="true"
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  referrerPolicy="no-referrer"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onLoadStart={() => setIsBuffering(true)}
                  onLoadedData={() => setIsBuffering(false)}
                  onWaiting={() => setIsBuffering(true)}
                  onCanPlay={() => setIsBuffering(false)}
                  onPlaying={() => {
                    setIsBuffering(false);
                    setIsPlaying(true);
                  }}
                  onPause={() => setIsPlaying(false)}
                  onError={handleVideoError}
                  onEnded={() => {
                    setIsPlaying(false);
                    setHasEnded(true);
                    setAreControlsVisible(true);
                  }}
                  onClick={togglePlay}
                />

                {/* Central Buffering Spinner (Crucial for 2GB videos loading metadata on mobile) */}
                {isBuffering && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none z-20 animate-fade-in p-4 text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 border-rose-500 border-t-transparent animate-spin mb-3 shadow-2xl" />
                    <span className="text-white text-xs sm:text-sm font-semibold bg-zinc-900/90 px-4 py-1.5 rounded-full border border-zinc-700 shadow-lg">
                      Cargando película...
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-2 max-w-xs leading-tight">
                      El video pesa 2.18 GB. En celulares puede tardar unos segundos en iniciar la descarga.
                    </span>
                  </div>
                )}

                {/* Central Play Button (Essential for mobile browsers that require user gesture) */}
                {!isPlaying && !isBuffering && !hasEnded && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlay();
                    }}
                    className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer backdrop-blur-sm border border-rose-400/30 ring-4 ring-rose-500/20"
                    aria-label="Reproducir video"
                  >
                    <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-white translate-x-0.5" />
                  </button>
                )}
              </>
            )}

            {/* Resolution / Source Selection Overlay (If error, missing URL, or requested by user) */}
            {(hasVideoError || showSourceModal || !playableVideoUrl) && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in text-center">
                <div className="max-w-xl w-full bg-zinc-900/95 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative text-left">
                  {/* Close button if user manually opened source modal and video is playable */}
                  {showSourceModal && playableVideoUrl && !hasVideoError && (
                    <button
                      onClick={() => setShowSourceModal(false)}
                      className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                      title="Volver a la reproducción"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Header with device context badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {movie.hasLocalFile ? (
                      <>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          <Smartphone className="w-3.5 h-3.5" /> Subida desde celular
                        </span>
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                          <Cloud className="w-3.5 h-3.5" /> Sincronizada en la nube
                        </span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <Upload className="w-3.5 h-3.5" /> Configurar Fuente de Video
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                    <span>{movie.title}</span>
                  </h3>

                  {movie.hasLocalFile ? (
                    <p className="text-zinc-400 text-xs sm:text-sm mb-4 leading-relaxed">
                      Esta película se sincronizó en tu catálogo vía la nube. Sin embargo, el archivo de video local (<span className="text-amber-300 font-mono">{movie.fileName || 'video.mp4'}</span>) reside físicamente en la memoria de tu celular. Elige cómo deseas verla en esta laptop:
                    </p>
                  ) : (
                    <p className="text-zinc-400 text-xs sm:text-sm mb-4 leading-relaxed">
                      {errorMessage || 'Agrega un enlace web de streaming o carga un archivo local para reproducir en este dispositivo.'}
                    </p>
                  )}

                  {/* Diagnostic Banner if link failed or user is on mobile */}
                  {playableVideoUrl && !playableVideoUrl.includes('blob:') && (
                    <div className="mb-4 p-3.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold text-amber-300">
                        <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>¿Por qué abrió en otras laptops pero en tu celular no?</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        Este archivo pesa <strong>2.18 GB</strong> y su cabecera de datos (moov) es de <strong>6.9 MB</strong>. Las laptops en Chrome descargan la cabecera en segundo plano sin restricciones, pero los celulares (Chrome Android / Safari iOS) aplican políticas estrictas:
                      </p>
                      <ul className="text-[11px] text-zinc-400 list-disc list-inside space-y-1 pl-1">
                        <li><strong>Requieren toque manual:</strong> En celulares el navegador bloquea la reproducción automática con sonido. Toca el botón Play central.</li>
                        <li><strong>Tiempo de espera:</strong> El servidor transfiere a velocidad lenta (~130 KB/s), por lo que el celular puede tardar hasta 40-50 segundos en mostrar el primer segundo.</li>
                        <li><strong>Reproductor del sistema:</strong> Puedes abrirlo directamente con el botón de abajo en el reproductor de tu teléfono (VLC, Chrome, QuickTime).</li>
                      </ul>
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <a
                          href={playableVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir enlace directo en el celular</span>
                        </a>
                      </div>
                    </div>
                  )}

                  {saveSuccessMsg && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* OPTION 1: Web / Streaming URL (Recommended for cross-device) */}
                    <div className="p-4 rounded-xl bg-zinc-950/80 border border-rose-500/30 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 border border-rose-500/40">
                            <Link2 className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-white text-xs sm:text-sm font-bold">
                              Opción 1: Enlace Online (Recomendado)
                            </h4>
                            <p className="text-zinc-400 text-[11px]">
                              Guarda un link en la nube: funciona en laptop, celular y para todos.
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600/20 text-rose-300 border border-rose-500/30">
                          Nube
                        </span>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveWebUrl();
                        }}
                        className="space-y-2.5 mt-3"
                      >
                        <div className="relative">
                          <input
                            type="text"
                            value={inputWebUrl}
                            onChange={(e) => setInputWebUrl(e.target.value)}
                            placeholder="Pega URL (.mp4 directo, Google Drive, YouTube o stream)..."
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                          />
                          <Link2 className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isSavingUrl || !inputWebUrl.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                          >
                            <Cloud className="w-3.5 h-3.5" />
                            <span>{isSavingUrl ? 'Guardando en la nube...' : 'Guardar y Reproducir'}</span>
                          </button>

                          {/* Quick Trailer Button */}
                          {isSpiderMan ? (
                            <button
                              type="button"
                              onClick={() => handleSaveWebUrl(spiderManTrailer)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-600/40 text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
                              title="Probar trailer oficial de Spider-Man"
                            >
                              <Film className="w-3.5 h-3.5 text-rose-400" />
                              <span>Ver Trailer HD Oficial</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                const q = encodeURIComponent(`${movie.title} trailer`);
                                window.open(`https://www.youtube.com/results?search_query=${q}`, '_blank');
                              }}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                            >
                              <Search className="w-3 h-3" />
                              <span>Buscar Trailer</span>
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* OPTION 2: Attach Local File on this laptop */}
                    <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-white text-xs sm:text-sm font-bold">
                            Opción 2: Cargar el archivo en esta Laptop
                          </h4>
                          <p className="text-zinc-400 text-[11px]">
                            Si tienes el archivo en esta computadora, selecciónalo para guardarlo en la memoria del navegador.
                          </p>
                        </div>
                      </div>

                      <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs border border-zinc-700 hover:border-zinc-600 transition-all cursor-pointer">
                        <Upload className="w-4 h-4 text-rose-400" />
                        <span>Seleccionar archivo en tu laptop (.mp4, .mkv, .webm)</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleReattachVideoFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-zinc-800/80">
                    {hasNextEpisode && (
                      <button
                        onClick={handleNextEpisode}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold text-xs border border-zinc-700 transition-all"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                        <span>Probar Siguiente Episodio</span>
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs border border-zinc-700 transition-all cursor-pointer"
                    >
                      Cerrar Reproductor
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Big Center Play / Pause Indicator */}
            {!isPlaying && !hasEnded && !hasVideoError && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer backdrop-blur-[2px] transition-opacity"
              >
                <div className="w-20 h-20 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-2xl shadow-rose-900/60 hover:scale-110 transition-transform ring-4 ring-white/20">
                  <Play className="w-9 h-9 fill-white translate-x-0.5" />
                </div>
              </div>
            )}

            {/* Subtitles Overlay */}
            {currentSubtitleText && !hasVideoError && (
              <div className="absolute bottom-20 left-0 right-0 px-6 text-center pointer-events-none z-20">
                <span className="inline-block bg-black/80 text-white font-medium text-base sm:text-lg md:text-xl px-4 py-1.5 rounded-lg border border-white/10 shadow-lg tracking-wide backdrop-blur-sm">
                  {currentSubtitleText}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Resume Toast */}
        {resumeToast && (
          <div className="absolute top-20 left-6 z-30 bg-zinc-900/90 border border-zinc-700 text-zinc-100 text-xs sm:text-sm px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 backdrop-blur-md animate-fade-in">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{resumeToast}</span>
          </div>
        )}

        {/* Top Control Bar */}
        <div
          className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
            areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-3 truncate max-w-[70%]">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white tracking-wider">
                {movie.contentType === 'series' ? 'SERIE' : movie.quality}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {movie.ageRating}
              </span>
            </div>
            <h2 className="text-white font-semibold text-xs sm:text-base md:text-lg truncate drop-shadow-md">
              {activeDisplayTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Series Episodes Drawer Toggle */}
            {hasEpisodes && (
              <button
                onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  showEpisodesDrawer
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                }`}
                title="Lista de episodios"
              >
                <ListVideo className="w-4 h-4" />
                <span className="hidden sm:inline">Episodios ({episodesList.length})</span>
              </button>
            )}

            {/* Source switcher button */}
            <button
              onClick={() => setShowSourceModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-xs border border-zinc-700/60"
              title="Cambiar fuente de video o archivo local"
            >
              <Upload className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Fuente de Video</span>
            </button>

            {/* External link button */}
            <a
              href={activeVideoUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Abrir fuente de video en nueva pestaña"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* PiP Button (for native videos) */}
            {!isUsingEmbed && (
              <button
                onClick={handlePiP}
                className="p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                title="Ventana flotante (Picture-in-Picture)"
              >
                <Tv className="w-4 h-4" />
              </button>
            )}

            {/* In-app Mini Player */}
            <button
              onClick={onMinimize}
              className="p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              title="Minimizar reproductor y seguir navegando"
            >
              <Minimize2 className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-900/60 hover:bg-rose-600 text-zinc-300 hover:text-white transition-colors"
              title="Cerrar reproductor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Side Episodes Drawer for Series */}
        {hasEpisodes && showEpisodesDrawer && (
          <div className="absolute top-16 right-4 bottom-16 w-80 bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-40 flex flex-col backdrop-blur-xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <ListVideo className="w-4 h-4 text-rose-500" />
                <span className="text-white text-sm font-bold">Episodios de la Serie</span>
              </div>
              <button
                onClick={() => setShowEpisodesDrawer(false)}
                className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {episodesList.map((ep, idx) => {
                const isCurrent = idx === currentEpisodeIndex;
                return (
                  <button
                    key={ep.id || idx}
                    onClick={() => {
                      setCurrentEpisodeIndex(idx);
                      setShowEpisodesDrawer(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isCurrent
                        ? 'bg-rose-950/50 border-rose-500 text-white'
                        : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCurrent ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {ep.episodeNumber || idx + 1}
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold block truncate">
                          {ep.title}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {ep.duration ? `${ep.duration} min` : 'Capítulo'}
                        </span>
                      </div>
                    </div>
                    {isCurrent ? (
                      <Play className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* End of Movie Recommendation Overlay */}
        {hasEnded && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-35 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
              <Film className="w-7 h-7 text-rose-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
              ¡Has terminado de ver {activeDisplayTitle}!
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-md mb-6">
              {hasNextEpisode
                ? '¿Quieres pasar directamente al siguiente episodio?'
                : '¿Quieres volver a verla o explorar otra fantástica película?'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {hasNextEpisode ? (
                <button
                  onClick={handleNextEpisode}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-950/60 transition-all hover:scale-105"
                >
                  <SkipForward className="w-4 h-4 fill-white" />
                  <span>Siguiente Episodio</span>
                </button>
              ) : null}

              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                    setIsPlaying(true);
                    setHasEnded(false);
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm transition-all border border-zinc-700"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Volver a Reproducir</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm transition-all border border-zinc-800"
              >
                Cerrar Reproductor
              </button>
            </div>

            {/* Recommendations Row */}
            {nextMovies.length > 0 && (
              <div className="w-full max-w-2xl">
                <span className="text-xs uppercase tracking-wider text-zinc-500 font-bold block mb-3">
                  Películas Recomendadas para Seguir Viendo
                </span>
                <div className="grid grid-cols-3 gap-3">
                  {nextMovies.map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => {
                        setHasEnded(false);
                        onSelectMovie(rec);
                      }}
                      className="group relative rounded-xl overflow-hidden aspect-video border border-zinc-800 hover:border-rose-500 text-left transition-all"
                    >
                      <img
                        src={rec.backdropUrl || rec.posterUrl}
                        alt={rec.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 flex flex-col justify-end">
                        <span className="text-white text-xs font-semibold truncate group-hover:text-rose-400">
                          {rec.title}
                        </span>
                        <span className="text-[10px] text-zinc-400">{rec.duration} min</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bottom Video Controls for Native Video Player */}
        {!isUsingEmbed && !hasVideoError && (
          <div
            className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 py-4 z-30 transition-opacity duration-300 ${
              areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Timeline / Progress Track */}
            <div
              ref={progressTrackRef}
              onClick={handleSeek}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setHoverTime(null)}
              className="group relative w-full h-2 hover:h-3.5 bg-zinc-800/90 rounded-full cursor-pointer transition-all mb-3 flex items-center"
            >
              {/* Buffer progress */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-zinc-700/60 rounded-full"
                style={{ width: `${Math.min(progressPercent + 25, 100)}%` }}
              />

              {/* Current Playback Progress */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-rose-600 to-rose-500 rounded-full flex items-center justify-end"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md shadow-black/80 scale-0 group-hover:scale-100 transition-transform -mr-1.5" />
              </div>

              {/* Hover timestamp indicator */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-8 px-2 py-1 bg-zinc-900/95 border border-zinc-700 text-[11px] font-mono font-semibold text-white rounded pointer-events-none -translate-x-1/2 shadow-xl"
                  style={{ left: `${hoverPosition}px` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}
            </div>

            {/* Controls Bottom Row */}
            <div className="flex items-center justify-between gap-2">
              {/* Left Controls: Play, Next Ep, Skips, Time, Volume */}
              <div className="flex items-center gap-1.5 sm:gap-3">
                {/* Play / Pause */}
                <button
                  onClick={togglePlay}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white translate-x-0.5" />
                  )}
                </button>

                {/* Siguiente Episodio si es serie */}
                {hasNextEpisode && (
                  <button
                    onClick={handleNextEpisode}
                    className="p-1.5 sm:p-2 text-rose-400 hover:text-rose-300 transition-colors"
                    title="Siguiente Episodio"
                  >
                    <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-rose-400" />
                  </button>
                )}

                {/* 10s Backward */}
                <button
                  onClick={() => handleSkip(-10)}
                  className="p-1.5 sm:p-2 text-zinc-300 hover:text-white transition-colors"
                  title="Retroceder 10 segundos (←)"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* 10s Forward */}
                <button
                  onClick={() => handleSkip(10)}
                  className="p-1.5 sm:p-2 text-zinc-300 hover:text-white transition-colors"
                  title="Adelantar 10 segundos (→)"
                >
                  <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Volume & Mute Slider */}
                <div className="group/vol flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="p-1.5 text-zinc-300 hover:text-white transition-colors"
                    title="Silenciar / Activar sonido (M)"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-rose-400" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-14 sm:w-20 h-1.5 accent-rose-500 bg-zinc-700 rounded-lg cursor-pointer"
                    title="Volumen"
                  />
                </div>

                {/* Current Time / Total Time */}
                <div className="text-xs sm:text-sm font-mono text-zinc-300 ml-1">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-zinc-500 mx-1">/</span>
                  <span className="text-zinc-400">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Controls: Speed, Subtitles, Theater, Fullscreen */}
              <div className="flex items-center gap-1.5 sm:gap-2 relative">
                {/* Playback Speed Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowSubtitlesMenu(false);
                    }}
                    className={`p-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                      playbackSpeed !== 1
                        ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                    }`}
                    title="Velocidad de reproducción"
                  >
                    <Gauge className="w-4 h-4" />
                    <span className="text-xs">{playbackSpeed}x</span>
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-12 right-0 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 shadow-2xl z-40 w-28">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1 block">
                        Velocidad
                      </span>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedSelect(s)}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            playbackSpeed === s
                              ? 'bg-rose-600 text-white font-bold'
                              : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {s}x {s === 1 && '(Normal)'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subtitles Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSubtitlesMenu(!showSubtitlesMenu);
                      setShowSpeedMenu(false);
                    }}
                    className={`p-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                      selectedSubtitle !== 'off'
                        ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                    }`}
                    title="Subtítulos"
                  >
                    <Subtitles className="w-4 h-4" />
                  </button>

                  {showSubtitlesMenu && (
                    <div className="absolute bottom-12 right-0 bg-zinc-900 border border-zinc-800 rounded-xl p-1.5 shadow-2xl z-40 w-36">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1 block">
                        Subtítulos
                      </span>
                      <button
                        onClick={() => {
                          setSelectedSubtitle('off');
                          setShowSubtitlesMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedSubtitle === 'off'
                            ? 'bg-rose-600 text-white font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        Desactivados
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubtitle('es');
                          setShowSubtitlesMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedSubtitle === 'es'
                            ? 'bg-rose-600 text-white font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        Español
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubtitle('en');
                          setShowSubtitlesMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedSubtitle === 'en'
                            ? 'bg-rose-600 text-white font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  )}
                </div>

                {/* Theater Mode Toggle */}
                <button
                  onClick={() => setIsTheaterMode(!isTheaterMode)}
                  className={`p-1.5 sm:p-2 rounded-xl transition-colors ${
                    isTheaterMode
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={isTheaterMode ? 'Salir de modo cine' : 'Modo Cine'}
                >
                  <Film className="w-4 h-4" />
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 sm:p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Pantalla completa (F)"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
