import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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
  SlidersHorizontal,
  ArrowLeft,
  Crop,
  Copy,
  Info,
  MonitorPlay,
  Download,
  Lightbulb,
  LightbulbOff,
  Keyboard,
  ChevronUp,
  ChevronDown,
  Shield,
  ShieldCheck,
  ShieldAlert,
  QrCode,
} from 'lucide-react';
import { Movie, PlayerMode, Episode, SubtitleTrack } from '../types';
import { parseVideoSource } from '../utils/videoHelper';
import { saveVideoBlob, resolvePlayableVideoUrl } from '../utils/videoStorage';
import { updateMovieInFirestore } from '../firestoreService';
import { SubtitleModal, SubtitleConfig } from './SubtitleModal';
import {
  readSubtitleFile,
  generateAiSubtitles,
  detectSubtitleLanguage,
  downloadSubtitleFile,
  exportCuesToVtt,
  loadSubtitlesFromUrl,
} from '../utils/subtitleHelper';
import { useMobileControlLogic } from '../hooks/useMobileControlLogic';
import {
  isSchoolProxyEnabled,
  setSchoolProxyEnabled,
  isProxyEligible,
  getProxiedVideoUrl,
} from '../utils/streamProxyHelper';

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
  onOpenSync?: (currentPlaying: {
    movieId: string;
    title: string;
    currentTime: number;
    duration: number;
    episodeId?: string;
    episodeTitle?: string;
  }) => void;
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
  onOpenSync,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
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

  // School Anti-Filter Proxy Layer (bypasses institutional media player blocks on non-Google Drive links)
  const [isSchoolProxyActive, setIsSchoolProxyActive] = useState<boolean>(() => isSchoolProxyEnabled());
  const [unproxiedRawLiveUrl, setUnproxiedRawLiveUrl] = useState<string>('');

  const toggleSchoolProxy = useCallback(() => {
    setIsSchoolProxyActive((prev) => {
      const next = !prev;
      setSchoolProxyEnabled(next);
      setResumeToast(
        next
          ? '🛡️ Antifiltro Escolar activado: tráfico enrutado por nuestro dominio (Bypass Media Player)'
          : '⚡ Modo directo activado: conexión directa con el servidor de video'
      );
      return next;
    });
  }, []);

  // Resolve video URL from local IndexedDB if stored as a file
  useEffect(() => {
    let isCancelled = false;
    setHasEnded(false);
    setCurrentTime(0);
    setForceEmbedMode(false);

    resolvePlayableVideoUrl(activeEpisodeId, rawVideoUrl || '').then((liveUrl) => {
      if (!isCancelled) {
        const hasValidUrl = liveUrl && liveUrl.trim() !== '' && !liveUrl.startsWith('blob:null');
        if (!hasValidUrl) {
          setPlayableVideoUrl('');
          setUnproxiedRawLiveUrl('');
          setHasVideoError(true);
          setIsPlaying(false);
          setErrorMessage(
            movie.hasLocalFile
              ? `El archivo "${movie.fileName || 'video local'}" fue añadido desde tu celular y reside físicamente en la memoria de ese teléfono.`
              : 'No se encontró un archivo o enlace de video para reproducir.'
          );
        } else {
          setUnproxiedRawLiveUrl(liveUrl);
          const finalUrl =
            isSchoolProxyActive && isProxyEligible(liveUrl)
              ? getProxiedVideoUrl(liveUrl, { title: movie.title, disguise: true })
              : liveUrl;
          setPlayableVideoUrl(finalUrl);
          setHasVideoError(false);
          setErrorMessage('');
        }
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeEpisodeId, rawVideoUrl, movie.hasLocalFile, movie.fileName, isSchoolProxyActive]);

  // Source detection
  const [forceEmbedMode, setForceEmbedMode] = useState(false);
  const parsedSource = parseVideoSource(playableVideoUrl);
  // Embed platforms: YouTube, Vimeo, Google Drive, DailyMotion, Archive, OK.ru, Streamtape, or web video embeds
  const isEmbedSource = parsedSource.type !== 'direct';
  const isGoogleDrive = parsedSource.type === 'googledrive';
  const isUsingEmbed = isEmbedSource || forceEmbedMode;
  const embedIframeSrc = parsedSource.embedUrl || parsedSource.directUrl || playableVideoUrl;

  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSubtitlesMenu, setShowSubtitlesMenu] = useState(false);
  const [showMobileSettingsModal, setShowMobileSettingsModal] = useState(false);

  // Dedicated Mobile Control Logic hook
  const mobileLogic = useMobileControlLogic({
    videoRef,
    containerRef,
    isUsingEmbed,
    isPlaying,
    isGoogleDrive,
  });

  const isMobilePortrait = mobileLogic.isMobilePortrait;

  // Subtitles Management
  const initialSubtitleTrackId = () => {
    if (movie.subtitles && movie.subtitles.length > 0) {
      return movie.subtitles[0].id || movie.subtitles[0].lang;
    }
    return 'off';
  };

  const [subtitleConfig, setSubtitleConfig] = useState<SubtitleConfig>({
    trackId: initialSubtitleTrackId(),
    offsetSeconds: 0,
    fontSize: 'lg',
    textColor: 'white',
    backgroundStyle: 'solid',
    verticalPosition: 'drive_safe',
  });
  const [customTracks, setCustomTracks] = useState<SubtitleTrack[]>([]);
  const [isSubtitleModalOpen, setIsSubtitleModalOpen] = useState(false);
  const subFileInputRef = useRef<HTMLInputElement>(null);

  // Cinema Mode & Dimming States
  const [isDimmed, setIsDimmed] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Drive & Embed Subtitle Sync Engine
  const [driveSubtitleTime, setDriveSubtitleTime] = useState<number>(0);
  const [isDriveSubtitlePlaying, setIsDriveSubtitlePlaying] = useState<boolean>(true);
  const [isDriveSyncBarMinimized, setIsDriveSyncBarMinimized] = useState<boolean>(false);

  const availableTracks = useMemo<SubtitleTrack[]>(() => {
    const movieTracks = movie.subtitles || [];
    const episodeTracks = activeEpisode?.subtitles || [];
    return [...movieTracks, ...episodeTracks, ...customTracks];
  }, [movie.subtitles, activeEpisode, customTracks]);

  // Cinema Mode: auto-dim lights smoothly when entering theater or fullscreen
  const toggleDimming = useCallback(() => {
    setIsDimmed((prev) => {
      const next = !prev;
      setResumeToast(next ? '✨ Modo Cine: Luces atenuadas' : '💡 Luces encendidas');
      return next;
    });
  }, []);

  const toggleTheaterMode = useCallback(() => {
    setIsTheaterMode((prev) => {
      const next = !prev;
      if (next) setIsDimmed(true);
      setResumeToast(next ? '🎬 Modo Cine activado' : 'Modo normal');
      return next;
    });
  }, []);

  const [currentSubtitleText, setCurrentSubtitleText] = useState<string>('');

  // Active Subtitle Track
  const activeSubTrack = useMemo(() => {
    if (subtitleConfig.trackId === 'off') return null;
    return (
      availableTracks.find(
        (s) => s.id === subtitleConfig.trackId || s.lang === subtitleConfig.trackId
      ) || null
    );
  }, [availableTracks, subtitleConfig.trackId]);

  // Auto-fetch cues if track has url but no cues
  useEffect(() => {
    if (!activeSubTrack || (activeSubTrack.cues && activeSubTrack.cues.length > 0)) return;
    if (activeSubTrack.url) {
      loadSubtitlesFromUrl(activeSubTrack.url)
        .then((cues) => {
          if (cues && cues.length > 0) {
            setCustomTracks((prev) => {
              const existingIdx = prev.findIndex((t) => t.id === activeSubTrack.id);
              if (existingIdx >= 0) {
                const next = [...prev];
                next[existingIdx] = { ...next[existingIdx], cues };
                return next;
              }
              return [...prev, { ...activeSubTrack, cues }];
            });
          }
        })
        .catch((err) => console.warn('Could not auto-fetch subtitle cues from URL:', err));
    }
  }, [activeSubTrack]);

  // Auto-select first available subtitle track if none is active
  useEffect(() => {
    if (subtitleConfig.trackId === 'off') {
      const firstAvailable =
        (movie.subtitles && movie.subtitles.length > 0 ? movie.subtitles[0] : null) ||
        (activeEpisode?.subtitles && activeEpisode.subtitles.length > 0 ? activeEpisode.subtitles[0] : null);
      if (firstAvailable) {
        setSubtitleConfig((prev) => ({
          ...prev,
          trackId: firstAvailable.id || firstAvailable.lang,
        }));
      }
    }
  }, [movie.id, activeEpisode?.id, movie.subtitles, activeEpisode?.subtitles]);

  // WebVTT Blob URL for native player / mobile fullscreen support
  const vttBlobUrl = useMemo(() => {
    if (!activeSubTrack || !activeSubTrack.cues || activeSubTrack.cues.length === 0) return null;
    try {
      const vtt = exportCuesToVtt(activeSubTrack.cues);
      const blob = new Blob([vtt], { type: 'text/vtt;charset=utf-8' });
      return URL.createObjectURL(blob);
    } catch {
      return null;
    }
  }, [activeSubTrack]);

  useEffect(() => {
    return () => {
      if (vttBlobUrl) URL.revokeObjectURL(vttBlobUrl);
    };
  }, [vttBlobUrl]);

  // Mode hidden prevents browser default render from overlaying duplicate captions
  useEffect(() => {
    if (!videoRef.current || !videoRef.current.textTracks) return;
    const tracks = videoRef.current.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'hidden';
    }
  }, [vttBlobUrl]);

  // Drive & Embed subtitle synchronization interval
  useEffect(() => {
    if (!isUsingEmbed || subtitleConfig.trackId === 'off' || !isDriveSubtitlePlaying) return;
    const interval = setInterval(() => {
      setDriveSubtitleTime((t) => t + 0.5);
    }, 500);
    return () => clearInterval(interval);
  }, [isUsingEmbed, subtitleConfig.trackId, isDriveSubtitlePlaying]);

  // Unified Reactive Subtitle cue matcher (works across play, pause, seek, and embed modes)
  const effectiveCurrentTime = isUsingEmbed ? driveSubtitleTime : currentTime;

  useEffect(() => {
    if (!activeSubTrack || !activeSubTrack.cues || activeSubTrack.cues.length === 0) {
      setCurrentSubtitleText('');
      return;
    }
    const adjustedTime = effectiveCurrentTime + (subtitleConfig.offsetSeconds || 0);
    const matchingCue = activeSubTrack.cues.find(
      (cue) => adjustedTime >= cue.start && adjustedTime <= cue.end
    );
    setCurrentSubtitleText(matchingCue ? matchingCue.text : '');
  }, [effectiveCurrentTime, activeSubTrack, subtitleConfig.offsetSeconds]);

  // Handle local VTT or SRT file selection and synchronization
  const handleLocalSubtitleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { fileName, cues } = await readSubtitleFile(file);
      if (cues.length === 0) {
        setResumeToast('El archivo no contiene subtítulos o marcas de tiempo válidas (.srt, .vtt, .ass)');
        return;
      }

      const detected = detectSubtitleLanguage(cues, fileName);
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      const newTrack: SubtitleTrack = {
        id: `local-file-${Date.now()}`,
        lang: detected.lang,
        label: `${cleanName} [${detected.flag} ${detected.languageName}]`,
        fileName,
        cues,
      };

      setCustomTracks((prev) => [...prev, newTrack]);
      setSubtitleConfig((prev) => ({
        ...prev,
        trackId: newTrack.id,
      }));
      setResumeToast(
        `✨ Subtítulos activados: ${cues.length} líneas (${detected.flag} ${detected.languageName}). Primer diálogo: ${Math.floor(cues[0].start / 60)}:${String(Math.floor(cues[0].start % 60)).padStart(2, '0')}`
      );
      setShowSubtitlesMenu(false);
    } catch (err: any) {
      setResumeToast(err?.message || 'Error al procesar archivo de subtítulos');
    } finally {
      if (subFileInputRef.current) subFileInputRef.current.value = '';
    }
  };

  // Generate AI contextual subtitles
  const handleGenerateAiSubtitlesDirectly = (lang: 'es' | 'en' = 'es') => {
    const videoDuration = duration || 5400;
    const cues = generateAiSubtitles(activeDisplayTitle, movie.genre, videoDuration, lang);
    const aiTrack: SubtitleTrack = {
      id: `ai-direct-${lang}-${Date.now()}`,
      lang,
      label: lang === 'es' ? 'Español (Generado con IA)' : 'English (AI Generated)',
      cues,
    };

    setCustomTracks((prev) => [...prev, aiTrack]);
    setSubtitleConfig((prev) => ({
      ...prev,
      trackId: aiTrack.id,
    }));
    setResumeToast(`✨ Subtítulos IA activados y sincronizados (${cues.length} líneas)`);
    setShowSubtitlesMenu(false);
  };

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [hasEnded, setHasEnded] = useState(false);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<{
    side: 'left' | 'right';
    id: number;
  } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number }>({ time: 0, x: 0 });
  const singleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
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
        if (video.src !== playableVideoUrl) {
          video.src = playableVideoUrl;
        }
      }
    } else {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video.src !== playableVideoUrl) {
        video.src = playableVideoUrl;
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (video) {
        try {
          video.pause();
        } catch {}
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
      if (isEmbedSource || isPlaying) {
        setAreControlsVisible(false);
        setShowSpeedMenu(false);
        setShowSubtitlesMenu(false);
      }
    }, 3500);
  }, [isEmbedSource, isPlaying]);

  // Video time update listener
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    setCurrentTime(current);
    onProgressUpdate(movie.id, current, videoRef.current.duration || 0);
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
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            setIsPlaying(false);
          });
      }
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
    const newTime = Math.max(
      0,
      Math.min(videoRef.current.currentTime + seconds, duration)
    );
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
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
    // 1. On iOS Safari (iPhone), HTML5 video elements have webkitEnterFullscreen which gives true native fullscreen
    const video = videoRef.current as any;
    if (video && typeof video.webkitEnterFullscreen === 'function' && !isUsingEmbed) {
      try {
        video.webkitEnterFullscreen();
        return;
      } catch {
        // Fallback to container fullscreen
      }
    }

    // 2. For embeds (like Google Drive) on mobile or browsers that block iframe fullscreen
    if (isUsingEmbed) {
      mobileLogic.toggleEmbedFullscreen();
      setIsFullscreen((prev) => !prev);
      return;
    }

    if (!containerRef.current) return;
    const elem = containerRef.current as any;
    const doc = document as any;

    const isCurrentFs = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (!isCurrentFs) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else {
        setIsFullscreen(true);
      }
      setIsFullscreen(true);
      try {
        if (screen.orientation && (screen.orientation as any).lock) {
          (screen.orientation as any).lock('landscape').catch(() => {});
        }
      } catch {
        // Mobile orientation lock is optional/browser-dependent
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
      setIsFullscreen(false);
      try {
        if (screen.orientation && (screen.orientation as any).unlock) {
          (screen.orientation as any).unlock();
        }
      } catch {
        // Ignore
      }
    }
  };

  const handleToggleCinemaMode = () => {
    toggleFullscreen();
  };

  // Fullscreen change listener to keep isFullscreen state synchronized
  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

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
          if (isUsingEmbed) {
            setIsDriveSubtitlePlaying((prev) => {
              const next = !prev;
              setResumeToast(next ? '▶ Sincronizador de subtítulos reanudado' : '⏸ Sincronizador de subtítulos en pausa');
              return next;
            });
          } else {
            togglePlay();
          }
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 't':
          e.preventDefault();
          toggleTheaterMode();
          break;
        case 'd':
          e.preventDefault();
          toggleDimming();
          break;
        case 'c':
          e.preventDefault();
          setSubtitleConfig((prev) => {
            if (prev.trackId !== 'off') {
              setResumeToast('Subtítulos desactivados');
              return { ...prev, trackId: 'off' };
            } else {
              const first = availableTracks[0];
              const targetId = first ? first.id : 'off';
              setResumeToast(targetId !== 'off' ? `Subtítulos activados (${first.label})` : 'Carga un subtítulo primero');
              return { ...prev, trackId: targetId };
            }
          });
          break;
        case '[':
          e.preventDefault();
          setSubtitleConfig((prev) => {
            const nextOffset = Number((prev.offsetSeconds - 0.5).toFixed(1));
            setResumeToast(`⏱ Desfase subtítulos: ${nextOffset > 0 ? '+' : ''}${nextOffset}s`);
            return { ...prev, offsetSeconds: nextOffset };
          });
          break;
        case ']':
          e.preventDefault();
          setSubtitleConfig((prev) => {
            const nextOffset = Number((prev.offsetSeconds + 0.5).toFixed(1));
            setResumeToast(`⏱ Desfase subtítulos: ${nextOffset > 0 ? '+' : ''}${nextOffset}s`);
            return { ...prev, offsetSeconds: nextOffset };
          });
          break;
        case '?':
          e.preventDefault();
          setShowShortcutsModal((prev) => !prev);
          break;
        case 'p':
          e.preventDefault();
          toggleSchoolProxy();
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
          if (showShortcutsModal) {
            setShowShortcutsModal(false);
          } else if (isFullscreen) {
            document.exitFullscreen().catch(() => {});
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFullscreen,
    isPlaying,
    volume,
    duration,
    isEmbedSource,
    isUsingEmbed,
    availableTracks,
    showShortcutsModal,
    toggleDimming,
    toggleTheaterMode,
    toggleSchoolProxy,
    togglePlay,
    toggleFullscreen,
    toggleMute,
    handleSkip,
    onClose,
  ]);

  // Fullscreen change listener with auto-dimming transition
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFs = !!document.fullscreenElement;
      setIsFullscreen(isFs);
      if (isFs) {
        setIsDimmed(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Prevent background body scroll on iOS while player is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, []);

  // Clear resume toast after 3s
  useEffect(() => {
    if (resumeToast) {
      const timer = setTimeout(() => setResumeToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [resumeToast]);

  // Handle swipe down gesture to minimize player on mobile
  const swipeStartRef = useRef<{ y: number; time: number } | null>(null);

  const handleGlobalTouchStart = (e: React.TouchEvent) => {
    swipeStartRef.current = {
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleGlobalTouchEnd = (e: React.TouchEvent) => {
    if (!swipeStartRef.current) return;
    const endY = e.changedTouches[0].clientY;
    const diffY = endY - swipeStartRef.current.y;
    const elapsed = Date.now() - swipeStartRef.current.time;

    // Fast downward swipe (> 130px in < 400ms) minimizes to floating mini player
    if (diffY > 130 && elapsed < 400) {
      onMinimize();
    }
    swipeStartRef.current = null;
  };

  // Handle single tap (toggle controls) and double tap (skip 10s backward/forward) on mobile
  const handleVideoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const tapX = e.clientX - rect.left;
    const isLeftSide = tapX < rect.width / 2;
    const now = Date.now();

    if (now - lastTapRef.current.time < 320) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      if (isLeftSide) {
        handleSkip(-10);
        setDoubleTapFeedback({ side: 'left', id: now });
      } else {
        handleSkip(10);
        setDoubleTapFeedback({ side: 'right', id: now });
      }
      setTimeout(() => setDoubleTapFeedback(null), 750);
      lastTapRef.current = { time: 0, x: 0 };
      return;
    }

    lastTapRef.current = { time: now, x: tapX };

    singleTapTimerRef.current = setTimeout(() => {
      if (areControlsVisible) {
        setAreControlsVisible(false);
        setShowSpeedMenu(false);
        setShowSubtitlesMenu(false);
      } else {
        showControlsTemporarily();
      }
    }, 280);
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={showControlsTemporarily}
      onTouchStart={handleGlobalTouchStart}
      onTouchEnd={handleGlobalTouchEnd}
      className={`fixed inset-0 z-50 bg-black flex transition-all duration-700 ease-in-out select-none overflow-hidden h-[100dvh] max-h-[100dvh] w-full max-w-full ${
        isMobilePortrait && !isFullscreen && !mobileLogic.isEmbedExpandedFullscreen
          ? 'flex-col justify-start overflow-y-auto bg-zinc-950 text-white p-0'
          : 'items-center justify-center ' +
            (isTheaterMode || isFullscreen || mobileLogic.isEmbedExpandedFullscreen
              ? 'p-0 bg-black'
              : isDimmed
              ? 'p-0 sm:p-2 md:p-4 bg-black transition-colors duration-700'
              : 'p-0 sm:p-4 md:p-8 bg-zinc-950/95 backdrop-blur-xl transition-all duration-700')
      }`}
      style={{ height: '100dvh', maxHeight: '100dvh' }}
    >
      {/* Ambient Backdrop Glow with Smooth Dimming Transition */}
      <div
        className={`absolute inset-0 pointer-events-none filter blur-3xl scale-125 transition-all duration-1000 ease-in-out ${
          isDimmed || isTheaterMode || isFullscreen ? 'opacity-0' : 'opacity-20'
        }`}
        style={{
          backgroundImage: `url(${movie.backdropUrl || movie.posterUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Main Video Wrapper */}
      <div
        className={`relative w-full overflow-hidden bg-black shadow-2xl transition-all duration-700 ease-in-out ${
          isMobilePortrait && !isFullscreen && !mobileLogic.isEmbedExpandedFullscreen
            ? 'aspect-video sticky top-0 z-40 shrink-0 border-b border-zinc-800/80 shadow-2xl'
            : isTheaterMode || isFullscreen || mobileLogic.isEmbedExpandedFullscreen
            ? 'h-full w-full rounded-none border-0'
            : isDimmed
            ? 'h-full sm:h-[92vh] max-w-7xl aspect-video rounded-none sm:rounded-2xl border border-zinc-800/40 shadow-[0_0_80px_rgba(0,0,0,0.9)]'
            : 'h-full sm:h-auto max-w-6xl aspect-video sm:max-h-[85vh] rounded-none sm:rounded-2xl border-0 sm:border border-zinc-800/80 shadow-rose-950/20'
        }`}
      >
        {/* RENDER CASE 1: External Platform Embed (YouTube, Vimeo, Google Drive, DailyMotion, Archive, OK.ru, Streamtape, web players) */}
        {isUsingEmbed ? (
          <div className="w-full h-full bg-black relative flex items-center justify-center">
            <iframe
              ref={iframeRef}
              src={embedIframeSrc}
              title="Visor de contenido integrado"
              referrerPolicy="no-referrer"
              className={`w-full h-full border-0 bg-black ${
                mobileLogic.embedFitMode === 'cover' ? 'scale-105 object-cover' : 'object-contain'
              }`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              webkitallowfullscreen="true"
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              mozallowfullscreen="true"
            />

            {/* Subtitles Overlay on top of Embed / Google Drive */}
            {currentSubtitleText && (
              <div
                className={`absolute left-0 right-0 px-4 sm:px-6 text-center pointer-events-none z-30 select-none transition-all duration-300 ${
                  (subtitleConfig.verticalPosition || 'drive_safe') === 'top'
                    ? 'top-16 sm:top-20'
                    : (subtitleConfig.verticalPosition || 'drive_safe') === 'drive_safe'
                    ? 'bottom-20 sm:bottom-28'
                    : 'bottom-14 sm:bottom-16'
                }`}
              >
                <span
                  className={`inline-block transition-all max-w-[92%] sm:max-w-[80%] leading-relaxed ${
                    subtitleConfig.fontSize === 'sm'
                      ? 'text-xs sm:text-sm'
                      : subtitleConfig.fontSize === 'base'
                      ? 'text-sm sm:text-base'
                      : subtitleConfig.fontSize === 'lg'
                      ? 'text-base sm:text-lg md:text-xl'
                      : subtitleConfig.fontSize === 'xl'
                      ? 'text-lg sm:text-xl md:text-2xl font-bold'
                      : 'text-xl sm:text-2xl md:text-3xl font-extrabold'
                  } ${
                    subtitleConfig.textColor === 'yellow'
                      ? 'text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'
                      : subtitleConfig.textColor === 'cyan'
                      ? 'text-cyan-300 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'
                      : subtitleConfig.textColor === 'green'
                      ? 'text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'
                      : 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'
                  } ${
                    subtitleConfig.backgroundStyle === 'solid'
                      ? 'bg-black/90 px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl border border-white/20 shadow-2xl tracking-wide backdrop-blur-md'
                      : subtitleConfig.backgroundStyle === 'translucent'
                      ? 'bg-black/50 backdrop-blur-md px-4 sm:px-6 py-1.5 rounded-xl shadow-xl tracking-wide border border-white/10'
                      : 'drop-shadow-[0_3px_8px_rgba(0,0,0,1)] tracking-wide font-extrabold'
                  }`}
                >
                  {currentSubtitleText}
                </span>
              </div>
            )}

            {/* Floating Drive Subtitle Sync Controller (PC & Drive helper) */}
            {subtitleConfig.trackId !== 'off' && (
              <div
                className={`absolute z-30 transition-all duration-300 pointer-events-auto ${
                  isDriveSyncBarMinimized
                    ? 'top-16 right-3'
                    : 'top-16 left-1/2 -translate-x-1/2 w-[94%] sm:w-auto max-w-lg'
                }`}
              >
                {isDriveSyncBarMinimized ? (
                  <button
                    onClick={() => setIsDriveSyncBarMinimized(false)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/90 hover:bg-black text-white text-xs font-semibold border border-rose-500/40 shadow-2xl backdrop-blur-md cursor-pointer animate-fade-in"
                    title="Expandir sincronizador de subtítulos"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>Sub: {formatTime(driveSubtitleTime)}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                ) : (
                  <div className="bg-zinc-950/95 border border-zinc-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl backdrop-blur-xl text-zinc-100 flex flex-wrap items-center justify-between gap-2 text-xs animate-fade-in">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsDriveSubtitlePlaying(!isDriveSubtitlePlaying)}
                        className={`p-1.5 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                          isDriveSubtitlePlaying
                            ? 'bg-rose-600 text-white'
                            : 'bg-zinc-800 text-amber-300 hover:bg-zinc-700'
                        }`}
                        title={isDriveSubtitlePlaying ? 'Pausar avance de subtítulos (Espacio)' : 'Reanudar subtítulos (Espacio)'}
                      >
                        {isDriveSubtitlePlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      <span className="font-mono text-xs font-bold text-amber-300 min-w-[45px]">
                        {formatTime(driveSubtitleTime)}
                      </span>

                      <span className="text-[10px] text-zinc-400 hidden sm:inline">
                        (Tiempo Drive)
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDriveSubtitleTime((t) => Math.max(0, t - 5))}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold cursor-pointer"
                        title="Retroceder 5 segundos"
                      >
                        -5s
                      </button>
                      <button
                        onClick={() => setDriveSubtitleTime((t) => t + 5)}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold cursor-pointer"
                        title="Adelantar 5 segundos"
                      >
                        +5s
                      </button>
                      <button
                        onClick={() => {
                          const input = prompt('Ingresa el minuto o segundo actual del video en Drive (ej: 12:30 o 45):', formatTime(driveSubtitleTime));
                          if (input) {
                            if (input.includes(':')) {
                              const [m, s] = input.split(':').map(Number);
                              if (!isNaN(m) && !isNaN(s)) setDriveSubtitleTime(m * 60 + s);
                            } else {
                              const s = Number(input);
                              if (!isNaN(s)) setDriveSubtitleTime(s);
                            }
                          }
                        }}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[11px] font-semibold cursor-pointer border border-amber-500/30"
                        title="Ajustar tiempo exacto de Google Drive"
                      >
                        Sincronizar
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 ml-auto">
                      <button
                        onClick={() => setIsSubtitleModalOpen(true)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                        title="Ajustes de subtítulos y tamaño"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                      <button
                        onClick={() => setIsDriveSyncBarMinimized(true)}
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
                        title="Minimizar barra"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dedicated Clean Embed Overlay Header (Safe-area compliant, high contrast, non-overlapping) */}
            <div
              className="absolute inset-x-0 top-0 z-30 flex items-center justify-between pointer-events-none p-2 sm:p-3"
              style={{
                paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0.75rem))',
                paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0.75rem))',
                paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0.75rem))',
              }}
            >
              <button
                onClick={onClose}
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/85 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-2xl active:scale-95 text-xs font-semibold cursor-pointer min-h-[40px]"
                title="Volver"
                aria-label="Volver"
              >
                <ArrowLeft className="w-4 h-4 text-rose-400" />
                <span className="hidden xs:inline">Volver</span>
              </button>

              <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
                {forceEmbedMode && (
                  <button
                    onClick={() => setForceEmbedMode(false)}
                    className="flex items-center gap-1 px-3 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold backdrop-blur-md border border-zinc-700/60 shadow-xl active:scale-95 cursor-pointer min-h-[40px]"
                    title="Volver al reproductor nativo"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="hidden sm:inline">Modo Nativo</span>
                  </button>
                )}

                {/* Subtitles Button for Embed / Drive */}
                <button
                  onClick={() => setIsSubtitleModalOpen(true)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold backdrop-blur-md shadow-xl active:scale-95 cursor-pointer min-h-[40px] border transition-colors ${
                    subtitleConfig.trackId !== 'off'
                      ? 'bg-rose-600 text-white border-rose-400/60 shadow-rose-950/40'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border-zinc-700/60'
                  }`}
                  title="Configurar y activar subtítulos para PC y Drive (C)"
                >
                  <Subtitles className="w-3.5 h-3.5 text-rose-300" />
                  <span className="hidden sm:inline">
                    {subtitleConfig.trackId !== 'off' ? 'Subtítulos: ON' : 'Subtítulos'}
                  </span>
                </button>

                {/* Download .SRT 1-click button for Google Drive in PC */}
                {availableTracks.length > 0 && (
                  <button
                    onClick={() => {
                      const target = availableTracks.find((t) => t.id === subtitleConfig.trackId) || availableTracks[0];
                      if (target && target.cues && target.cues.length > 0) {
                        downloadSubtitleFile(target.cues, `${movie.title}_${target.lang}`, 'srt');
                        setResumeToast(`📥 Subtítulo .SRT descargado: arrástralo a Google Drive en PC`);
                      } else {
                        setIsSubtitleModalOpen(true);
                      }
                    }}
                    className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-amber-300 text-xs font-semibold backdrop-blur-md border border-amber-500/40 shadow-xl active:scale-95 cursor-pointer min-h-[40px]"
                    title="Descargar subtítulo .SRT para arrastrar a Google Drive en PC"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Descargar .SRT</span>
                  </button>
                )}

                {/* Antifiltro Escolar Proxy Toggle (non-Google Drive) */}
                {!isGoogleDrive && (
                  <button
                    onClick={toggleSchoolProxy}
                    className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold backdrop-blur-md border shadow-xl active:scale-95 cursor-pointer min-h-[40px] transition-colors ${
                      isSchoolProxyActive
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 border-zinc-700/60'
                    }`}
                    title={
                      isSchoolProxyActive
                        ? 'Antifiltro Escolar ACTIVO: el tráfico pasa por nuestro dominio (P)'
                        : 'Antifiltro desactivado: conexión directa (P)'
                    }
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${isSchoolProxyActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    <span className="hidden lg:inline">
                      {isSchoolProxyActive ? 'Antifiltro Escolar' : 'Directo'}
                    </span>
                  </button>
                )}

                {/* Cinema Mode Dimming Toggle in Embed */}
                <button
                  onClick={toggleDimming}
                  className={`hidden sm:flex items-center gap-1 px-3 py-2 rounded-full text-xs font-semibold backdrop-blur-md border shadow-xl active:scale-95 cursor-pointer min-h-[40px] transition-colors ${
                    isDimmed
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-700/60'
                  }`}
                  title={isDimmed ? 'Encender luces (D)' : 'Atenuar luces / Modo Cine (D)'}
                >
                  {isDimmed ? <Lightbulb className="w-3.5 h-3.5 text-amber-300" /> : <LightbulbOff className="w-3.5 h-3.5 text-zinc-400" />}
                  <span className="hidden lg:inline">{isDimmed ? 'Luz ON' : 'Modo Cine'}</span>
                </button>

                {isGoogleDrive && (
                  <>
                    <button
                      onClick={() => mobileLogic.toggleEmbedFitMode()}
                      className="hidden sm:flex items-center gap-1 px-3 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold backdrop-blur-md border border-zinc-700/60 shadow-xl active:scale-95 cursor-pointer min-h-[40px]"
                      title={mobileLogic.embedFitMode === 'cover' ? 'Modo normal (16:9)' : 'Llenar pantalla'}
                    >
                      <Crop className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{mobileLogic.embedFitMode === 'cover' ? 'Ajustar' : 'Llenar'}</span>
                    </button>

                    <a
                      href={parsedSource.directUrl || parsedSource.embedUrl || activeVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        if (availableTracks.length > 0) {
                          setResumeToast('💡 Tip PC: Puedes descargar el .SRT y arrastrarlo a la ventana de Drive');
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs backdrop-blur-md shadow-2xl active:scale-95 cursor-pointer min-h-[40px] border border-amber-300/50"
                      title="Abrir en Google Drive"
                    >
                      <ExternalLink className="w-4 h-4 text-black" />
                      <span>Abrir en Drive</span>
                    </a>
                  </>
                )}

                {/* Primary Fullscreen button */}
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs backdrop-blur-md shadow-2xl active:scale-95 border border-rose-400/40 cursor-pointer min-h-[40px]"
                  title={isFullscreen || mobileLogic.isEmbedExpandedFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}
                  aria-label="Pantalla completa"
                >
                  {isFullscreen || mobileLogic.isEmbedExpandedFullscreen ? (
                    <>
                      <Minimize className="w-4 h-4" />
                      <span className="hidden xs:inline">Salir</span>
                    </>
                  ) : (
                    <>
                      <Maximize className="w-4 h-4" />
                      <span>Pantalla Completa</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-black/85 hover:bg-rose-600 text-white backdrop-blur-md border border-white/20 shadow-2xl active:scale-95 flex items-center justify-center cursor-pointer min-w-[40px] min-h-[40px]"
                  title="Cerrar reproductor"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Google Drive Mobile Helper Banner */}
            {isGoogleDrive && isMobilePortrait && !isFullscreen && !mobileLogic.isEmbedExpandedFullscreen && (
              <div
                className="absolute bottom-2 inset-x-2 z-20 pointer-events-auto bg-zinc-950/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-2 px-3 flex items-center justify-between text-[11px] text-zinc-200 shadow-2xl"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                  <span className="truncate">
                    ¿No ves el botón en Drive? Usa <b>Pantalla Completa</b> arriba o <b>Abrir en Drive</b>.
                  </span>
                </div>
                <button
                  onClick={toggleFullscreen}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shrink-0 active:scale-95 cursor-pointer"
                >
                  Maximizar
                </button>
              </div>
            )}
          </div>
        ) : (
          /* RENDER CASE 2: Native HTML5 Video Element with Full Controls & Minute Bar */
          <div
            onClick={handleVideoTap}
            className="w-full h-full relative flex items-center justify-center bg-black cursor-pointer select-none"
          >
            {playableVideoUrl && !hasVideoError && (
              <>
                <video
                  ref={videoRef}
                  src={
                    playableVideoUrl.includes('.m3u8') && Hls.isSupported()
                      ? undefined
                      : playableVideoUrl
                  }
                  className={`w-full h-full object-contain ${
                    mobileLogic.useNativeControls ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                  controls={mobileLogic.useNativeControls}
                  playsInline
                  preload="auto"
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  webkit-playsinline="true"
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  x5-playsinline="true"
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  controlsList="nodownload nofullscreen noremoteplayback"
                  disablePictureInPicture
                  disableRemotePlayback
                  referrerPolicy="no-referrer"
                  onTimeUpdate={handleTimeUpdate}
                  onSeeked={() => {
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onLoadedMetadata={handleLoadedMetadata}
                  onLoadStart={() => setIsBuffering(true)}
                  onLoadedData={() => setIsBuffering(false)}
                  onWaiting={() => setIsBuffering(true)}
                  onCanPlay={() => setIsBuffering(false)}
                  onPlaying={() => {
                    setIsBuffering(false);
                    setIsPlaying(true);
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onPause={() => {
                    setIsPlaying(false);
                    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                  }}
                  onError={handleVideoError}
                  onEnded={() => {
                    setIsPlaying(false);
                    setHasEnded(true);
                    setAreControlsVisible(true);
                  }}
                >
                  {vttBlobUrl && (
                    <track
                      key={activeSubTrack?.id}
                      kind="subtitles"
                      label={activeSubTrack?.label || 'Subtítulos'}
                      srcLang={activeSubTrack?.lang || 'es'}
                      src={vttBlobUrl}
                      default
                    />
                  )}
                </video>

                {/* Double-Tap 10s Feedback Animation Ripples for Mobile */}
                {!mobileLogic.shouldHideCustomOverlay && doubleTapFeedback?.side === 'left' && (
                  <div className="absolute left-6 sm:left-12 top-1/2 -translate-y-1/2 z-25 bg-black/70 backdrop-blur-md px-4 py-3 rounded-full flex items-center gap-2 text-white font-bold text-sm border border-rose-500/30 animate-pulse pointer-events-none shadow-2xl">
                    <RotateCcw className="w-5 h-5 text-rose-400" />
                    <span>-10s</span>
                  </div>
                )}
                {!mobileLogic.shouldHideCustomOverlay && doubleTapFeedback?.side === 'right' && (
                  <div className="absolute right-6 sm:right-12 top-1/2 -translate-y-1/2 z-25 bg-black/70 backdrop-blur-md px-4 py-3 rounded-full flex items-center gap-2 text-white font-bold text-sm border border-rose-500/30 animate-pulse pointer-events-none shadow-2xl">
                    <span>+10s</span>
                    <RotateCw className="w-5 h-5 text-rose-400" />
                  </div>
                )}

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

                {/* Unified Central Playback Controls Cluster (Single Source of Truth on Mobile) */}
                {!mobileLogic.shouldHideCustomOverlay && (!isPlaying || areControlsVisible) && !isBuffering && !hasEnded && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className={`absolute inset-0 m-auto flex items-center justify-center gap-5 sm:gap-8 pointer-events-auto z-20 transition-all duration-200 ${
                      !isPlaying || areControlsVisible
                        ? 'opacity-100 scale-100'
                        : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                  >
                    {/* -10s quick button (clean mobile tap target) */}
                    <button
                      type="button"
                      onClick={() => handleSkip(-10)}
                      className="p-3 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-xl active:scale-90 transition-transform cursor-pointer"
                      title="Retroceder 10s"
                      aria-label="Retroceder 10 segundos"
                    >
                      <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-100" />
                    </button>

                    {/* Prominent Center Play / Pause Button */}
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-rose-600/95 hover:bg-rose-500 text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-90 transition-all cursor-pointer backdrop-blur-md border border-rose-400/40 ring-4 ring-rose-500/25"
                      aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                      title={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                      {isPlaying ? (
                        <Pause className="w-8 h-8 sm:w-9 sm:h-9 fill-white" />
                      ) : (
                        <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-white translate-x-0.5" />
                      )}
                    </button>

                    {/* +10s quick button (clean mobile tap target) */}
                    <button
                      type="button"
                      onClick={() => handleSkip(10)}
                      className="p-3 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-xl active:scale-90 transition-transform cursor-pointer"
                      title="Adelantar 10s"
                      aria-label="Adelantar 10 segundos"
                    >
                      <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-zinc-100" />
                    </button>
                  </div>
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
                        <button
                          type="button"
                          onClick={() => {
                            setForceEmbedMode(true);
                            setHasVideoError(false);
                            setErrorMessage('');
                          }}
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
                        >
                          <MonitorPlay className="w-4 h-4 text-black" />
                          <span>Reproducir como Visor Web Integrado (Iframe)</span>
                        </button>

                        <a
                          href={playableVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir en pestaña nueva</span>
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

            {/* Subtitles Overlay */}
            {currentSubtitleText && !hasVideoError && (
              <div
                className={`absolute left-0 right-0 px-4 sm:px-6 text-center pointer-events-none z-30 select-none transition-all duration-300 ${
                  (subtitleConfig.verticalPosition || 'bottom') === 'top'
                    ? 'top-16 sm:top-20'
                    : (subtitleConfig.verticalPosition || 'bottom') === 'drive_safe'
                    ? 'bottom-20 sm:bottom-28'
                    : 'bottom-14 sm:bottom-16'
                }`}
              >
                <span
                  className={`inline-block transition-all max-w-[92%] sm:max-w-[80%] leading-relaxed ${
                    subtitleConfig.fontSize === 'sm'
                      ? 'text-xs sm:text-sm'
                      : subtitleConfig.fontSize === 'base'
                      ? 'text-sm sm:text-base'
                      : subtitleConfig.fontSize === 'lg'
                      ? 'text-base sm:text-lg md:text-xl'
                      : subtitleConfig.fontSize === 'xl'
                      ? 'text-lg sm:text-xl md:text-2xl font-bold'
                      : 'text-xl sm:text-2xl md:text-3xl font-extrabold'
                  } ${
                    subtitleConfig.textColor === 'yellow'
                      ? 'text-yellow-300 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'
                      : subtitleConfig.textColor === 'cyan'
                      ? 'text-cyan-300 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'
                      : subtitleConfig.textColor === 'green'
                      ? 'text-emerald-300 drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'
                      : 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,1)]'
                  } ${
                    subtitleConfig.backgroundStyle === 'solid'
                      ? 'bg-black/90 px-4 sm:px-6 py-1.5 sm:py-2 rounded-xl border border-white/20 shadow-2xl tracking-wide backdrop-blur-md'
                      : subtitleConfig.backgroundStyle === 'translucent'
                      ? 'bg-black/50 backdrop-blur-md px-4 sm:px-6 py-1.5 rounded-xl shadow-xl tracking-wide border border-white/10'
                      : 'drop-shadow-[0_3px_8px_rgba(0,0,0,1)] tracking-wide font-extrabold'
                  }`}
                >
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

        {/* Top Control Bar (Native Video Player only) */}
        {!isUsingEmbed && !mobileLogic.shouldHideCustomOverlay && (
          <div
            className={`absolute top-0 inset-x-0 p-2.5 sm:p-4 bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
              areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
              paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
              paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
            }}
          >
            {/* Mobile pull-down hint */}
            <div className="sm:hidden absolute top-1 inset-x-0 flex justify-center pointer-events-none">
              <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>
            <div className="flex items-center gap-2 sm:gap-3 truncate max-w-[55%] sm:max-w-[65%]">
              {(isFullscreen || isMobilePortrait) && (
                <button
                  onClick={() => {
                    if (isFullscreen) {
                      toggleFullscreen();
                    } else {
                      onClose();
                    }
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-xs font-semibold shrink-0 cursor-pointer active:scale-95 transition-transform"
                  title={isFullscreen ? 'Salir de pantalla completa' : 'Volver'}
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden xs:inline">
                    {isFullscreen ? 'Salir' : 'Volver'}
                  </span>
                </button>
              )}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-rose-600 text-white tracking-wider">
                  {movie.contentType === 'series' ? 'SERIE' : movie.quality}
                </span>
                {isGoogleDrive ? (
                  <span className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Drive
                  </span>
                ) : (
                  <span className="hidden xs:inline px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                    {movie.ageRating}
                  </span>
                )}
              </div>
              <h2 className="text-white font-semibold text-xs sm:text-base md:text-lg truncate drop-shadow-md">
                {activeDisplayTitle}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Series Episodes Drawer Toggle */}
              {hasEpisodes && (
                <button
                  onClick={() => setShowEpisodesDrawer(!showEpisodesDrawer)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors min-h-[38px] ${
                    showEpisodesDrawer
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                  }`}
                  title="Lista de episodios"
                >
                  <ListVideo className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Episodios ({episodesList.length})</span>
                  <span className="sm:hidden text-[11px] font-bold">Eps</span>
                </button>
              )}

              {/* Quick Settings on mobile */}
              <button
                onClick={() => setShowMobileSettingsModal(true)}
                className="flex sm:hidden p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors min-w-[38px] min-h-[38px] items-center justify-center border border-zinc-700/60"
                title="Ajustes y opciones de reproducción"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              {/* Source switcher button (Desktop) */}
              <button
                onClick={() => setShowSourceModal(true)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-xs border border-zinc-700/60"
                title="Cambiar fuente de video o archivo local"
              >
                <Upload className="w-3.5 h-3.5 text-rose-400" />
                <span>Fuente de Video</span>
              </button>

              {/* Antifiltro Escolar Proxy Toggle (Dominio Propio) */}
              {!isGoogleDrive && (
                <button
                  onClick={toggleSchoolProxy}
                  className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    isSchoolProxyActive
                      ? 'bg-emerald-600/25 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-950/40'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 border-zinc-700/60'
                  }`}
                  title={
                    isSchoolProxyActive
                      ? 'Antifiltro Escolar ACTIVO: el video se transmite por nuestro dominio (P)'
                      : 'Antifiltro desactivado: conexión directa (P)'
                  }
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${isSchoolProxyActive ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <span className="hidden md:inline">
                    {isSchoolProxyActive ? 'Antifiltro Escolar' : 'Directo'}
                  </span>
                </button>
              )}

              {/* External link button (Direct Fullscreen / Google Drive) */}
              <a
                href={parsedSource.embedUrl || activeVideoUrl}
                target="_blank"
                rel="noreferrer"
                className="flex p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors min-w-[38px] min-h-[38px] items-center justify-center border border-zinc-700/40"
                title={isGoogleDrive ? 'Abrir en Google Drive directamente' : 'Abrir fuente de video en nueva pestaña'}
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
              </a>

              {/* Top Bar Fullscreen Button (Crucial for mobile and Google Drive) */}
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center border border-zinc-700/40 cursor-pointer"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                aria-label="Pantalla completa"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                ) : (
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                )}
              </button>

              {/* PiP Button (for native videos) */}
              {!isUsingEmbed && (
                <button
                  onClick={handlePiP}
                  className="hidden sm:flex p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
                  title="Ventana flotante (Picture-in-Picture)"
                >
                  <Tv className="w-4 h-4" />
                </button>
              )}

              {/* In-app Mini Player */}
              <button
                onClick={onMinimize}
                className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center border border-zinc-700/40"
                title="Minimizar reproductor y seguir navegando"
              >
                <Minimize2 className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-900/80 hover:bg-rose-600 text-zinc-300 hover:text-white transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center border border-zinc-700/40"
                title="Cerrar reproductor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Side Episodes Drawer for Series */}
        {hasEpisodes && showEpisodesDrawer && (
          <div
            className="absolute inset-x-2 sm:inset-x-auto top-14 sm:top-16 sm:right-4 bottom-14 sm:bottom-16 sm:w-80 max-w-full bg-zinc-950/98 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-40 flex flex-col backdrop-blur-xl animate-fade-in ios-scrollable"
            style={{
              top: 'max(3.5rem, calc(env(safe-area-inset-top, 0px) + 3rem))',
              bottom: 'max(4.5rem, calc(env(safe-area-inset-bottom, 0px) + 3.5rem))',
            }}
          >
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
                    setCurrentTime(0);
                    const p = videoRef.current.play();
                    if (p !== undefined) {
                      p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                    }
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
        {!isUsingEmbed && !hasVideoError && !mobileLogic.shouldHideCustomOverlay && (
          <div
            className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-3 sm:px-4 py-2.5 sm:py-4 z-30 transition-opacity duration-300 ${
              areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{
              paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))',
              paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
              paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
            }}
          >
            {/* Timeline / Progress Track */}
            <div
              ref={progressTrackRef}
              onClick={handleSeek}
              onMouseMove={handleProgressHover}
              onMouseLeave={() => setHoverTime(null)}
              className="group relative w-full h-3 sm:h-2 hover:h-3.5 bg-zinc-800/90 rounded-full cursor-pointer transition-all mb-2.5 sm:mb-3 flex items-center py-1 touch-none"
            >
              {/* Buffer progress */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-zinc-700/60 rounded-full pointer-events-none"
                style={{ width: `${Math.min(progressPercent + 25, 100)}%` }}
              />

              {/* Current Playback Progress */}
              <div
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-rose-600 to-rose-500 rounded-full flex items-center justify-end pointer-events-none"
                style={{ width: `${progressPercent}%` }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md shadow-black/80 scale-100 sm:scale-0 sm:group-hover:scale-100 transition-transform -mr-1.5" />
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
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              {/* Left Controls: Play, Next Ep, Skips, Time, Volume */}
              <div className="flex items-center gap-1 sm:gap-2.5 min-w-0">
                {/* Play / Pause - Desktop only (mobile uses the unified central controller to prevent duplicate buttons) */}
                <button
                  onClick={togglePlay}
                  className="hidden sm:flex p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 min-w-[38px] min-h-[38px] items-center justify-center cursor-pointer"
                  title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white translate-x-0.5" />
                  )}
                </button>

                {/* Siguiente Episodio si es serie */}
                {hasNextEpisode && (
                  <button
                    onClick={handleNextEpisode}
                    className="p-1.5 sm:p-2 text-rose-400 hover:text-rose-300 transition-colors shrink-0 cursor-pointer"
                    title="Siguiente Episodio"
                  >
                    <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 fill-rose-400" />
                  </button>
                )}

                {/* 10s Backward - Desktop only (mobile uses the central controller or double tap) */}
                <button
                  onClick={() => handleSkip(-10)}
                  className="hidden sm:flex p-1.5 sm:p-2 text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                  title="Retroceder 10 segundos"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* 10s Forward - Desktop only */}
                <button
                  onClick={() => handleSkip(10)}
                  className="hidden sm:flex p-1.5 sm:p-2 text-zinc-300 hover:text-white transition-colors shrink-0 cursor-pointer"
                  title="Adelantar 10 segundos"
                >
                  <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Desktop Volume & Mute Slider */}
                <div className="hidden sm:flex items-center gap-2 group/vol">
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
                <div className="text-[11px] sm:text-xs font-mono text-zinc-300 shrink-0 whitespace-nowrap ml-0.5">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-zinc-500 mx-0.5 sm:mx-1">/</span>
                  <span className="text-zinc-400">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Controls: Speed, Subtitles, Settings, Fullscreen */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0 relative">
                {/* Playback Speed Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowSpeedMenu(!showSpeedMenu);
                      setShowSubtitlesMenu(false);
                    }}
                    className={`px-2 py-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors min-h-[36px] ${
                      playbackSpeed !== 1
                        ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-900/80 sm:bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800'
                    }`}
                    title="Velocidad de reproducción"
                  >
                    <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                    <span className="text-xs font-mono">{playbackSpeed}x</span>
                  </button>

                  {showSpeedMenu && (
                    <div className="absolute bottom-12 right-0 bg-zinc-900/98 backdrop-blur-xl border border-zinc-800 rounded-xl p-1.5 shadow-2xl z-50 w-32 max-w-[calc(100vw-1rem)]">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1 block">
                        Velocidad
                      </span>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleSpeedSelect(s)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
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
                    className={`px-2 py-1.5 sm:p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors min-h-[36px] cursor-pointer ${
                      subtitleConfig.trackId !== 'off'
                        ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                        : 'bg-zinc-900/80 sm:bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800'
                    }`}
                    title="Subtítulos & Pistas"
                  >
                    <Subtitles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                    <span className="text-[10px] font-bold uppercase sm:hidden">
                      {subtitleConfig.trackId === 'off' ? 'CC' : 'SUB'}
                    </span>
                  </button>

                  {showSubtitlesMenu && (
                    <div className="absolute bottom-12 right-0 bg-zinc-900/98 backdrop-blur-xl border border-zinc-800 rounded-xl p-1.5 shadow-2xl z-50 w-52 max-w-[calc(100vw-1rem)] animate-fade-in">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 py-1 block">
                        Subtítulos
                      </span>
                      <button
                        onClick={() => {
                          setSubtitleConfig({ ...subtitleConfig, trackId: 'off' });
                          setShowSubtitlesMenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                          subtitleConfig.trackId === 'off'
                            ? 'bg-rose-600 text-white font-bold'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <span>Desactivados</span>
                        {subtitleConfig.trackId === 'off' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      {availableTracks.map((tr) => (
                        <button
                          key={tr.id}
                          onClick={() => {
                            setSubtitleConfig({ ...subtitleConfig, trackId: tr.id });
                            setShowSubtitlesMenu(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between truncate cursor-pointer ${
                            subtitleConfig.trackId === tr.id || subtitleConfig.trackId === tr.lang
                              ? 'bg-rose-600 text-white font-bold'
                              : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          <span className="truncate">{tr.label}</span>
                          <span className="text-[10px] uppercase opacity-70 ml-1">{tr.lang}</span>
                        </button>
                      ))}

                      <div className="pt-1.5 mt-1.5 border-t border-zinc-800 space-y-1">
                        <button
                          onClick={() => {
                            setShowSubtitlesMenu(false);
                            subFileInputRef.current?.click();
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Cargar archivo .SRT o .VTT</span>
                        </button>

                        <button
                          onClick={() => handleGenerateAiSubtitlesDirectly('es')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generar subtítulos con IA</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowSubtitlesMenu(false);
                            setIsSubtitleModalOpen(true);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span>Ajustes & Sincronización</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Switch to in-browser web player mode */}
                {playableVideoUrl && !playableVideoUrl.includes('blob:') && (
                  <button
                    onClick={() => {
                      setForceEmbedMode(true);
                      setIsPlaying(false);
                    }}
                    className="p-1.5 sm:p-2 rounded-xl text-zinc-300 hover:text-amber-300 hover:bg-zinc-800 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center cursor-pointer"
                    title="Reproducir en visor integrado (Iframe)"
                  >
                    <MonitorPlay className="w-4 h-4" />
                  </button>
                )}

                {/* Theater Mode Toggle (Desktop only) */}
                <button
                  onClick={toggleTheaterMode}
                  className={`hidden sm:flex p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
                    isTheaterMode
                      ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={isTheaterMode ? 'Salir de modo cine (T)' : 'Modo Cine (T)'}
                >
                  <Film className="w-4 h-4" />
                </button>

                {/* Ambient Dimming Toggle (Modo Cine Luces) */}
                <button
                  onClick={toggleDimming}
                  className={`hidden sm:flex p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
                    isDimmed
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-amber-300 hover:bg-zinc-800'
                  }`}
                  title={isDimmed ? 'Encender luces (D)' : 'Atenuar luces / Modo Cine suave (D)'}
                >
                  {isDimmed ? <Lightbulb className="w-4 h-4 text-amber-300" /> : <LightbulbOff className="w-4 h-4 text-zinc-400" />}
                </button>

                {/* School Anti-Filter Proxy Toggle (Dominio Propio) */}
                {!isGoogleDrive && (
                  <button
                    onClick={toggleSchoolProxy}
                    className={`hidden md:flex p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
                      isSchoolProxyActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    title={
                      isSchoolProxyActive
                        ? 'Antifiltro Escolar ACTIVO: video transmitido por nuestro dominio (P)'
                        : 'Antifiltro desactivado: conexión directa (P)'
                    }
                  >
                    <ShieldCheck className={`w-4 h-4 ${isSchoolProxyActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  </button>
                )}

                {/* Sincronizar y Pasar a Móvil (Código QR instantáneo) */}
                {onOpenSync && (
                  <button
                    onClick={() => {
                      const activeEp = hasEpisodes ? episodesList[currentEpisodeIndex] : undefined;
                      onOpenSync({
                        movieId: movie.id,
                        title: movie.title,
                        currentTime: videoRef.current?.currentTime || currentTime,
                        duration: videoRef.current?.duration || duration,
                        episodeId: activeEp?.id,
                        episodeTitle: activeEp?.title,
                      });
                    }}
                    className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl bg-zinc-900/80 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-300 border border-zinc-700/60 hover:border-rose-500/50 transition-colors cursor-pointer text-xs font-semibold"
                    title="Pasar a mi Móvil: Continuar viendo en tu celular con código QR"
                  >
                    <QrCode className="w-4 h-4 text-rose-400" />
                    <span className="hidden lg:inline text-[11px]">Pasar a Móvil</span>
                  </button>
                )}

                {/* PC Keyboard Shortcuts Modal Trigger */}
                <button
                  onClick={() => setShowShortcutsModal(true)}
                  className="hidden md:flex p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Atajos de teclado para PC (?)"
                >
                  <Keyboard className="w-4 h-4" />
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 sm:p-2 rounded-xl text-zinc-300 hover:text-white bg-zinc-900/80 sm:bg-transparent hover:bg-zinc-800 transition-colors min-w-[38px] min-h-[38px] flex items-center justify-center"
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

        {/* Mobile Settings Modal / Drawer */}
        {showMobileSettingsModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="w-full sm:max-w-md bg-zinc-900 border border-zinc-800 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl text-zinc-100 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-rose-500" />
                  <h3 className="font-bold text-sm sm:text-base">Opciones del Reproductor</h3>
                </div>
                <button
                  onClick={() => setShowMobileSettingsModal(false)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isUsingEmbed ? (
                <div className="space-y-4 mb-4">
                  <div className="p-3.5 rounded-xl bg-zinc-950/90 border border-zinc-800">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Film className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-zinc-200">
                        {isGoogleDrive ? 'Reproductor Google Drive' : 'Reproductor Externo'}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      {isGoogleDrive
                        ? 'Google Drive no muestra su botón de pantalla completa en celulares por restricciones del navegador. Usa las opciones de abajo para pantalla completa o abrir en la app de Drive.'
                        : 'La pausa, avance y volumen se controlan directamente en el reproductor. Usa Pantalla Completa para la mejor experiencia en celular.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        toggleFullscreen();
                        setShowMobileSettingsModal(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-950/50 cursor-pointer min-h-[44px]"
                    >
                      <Maximize className="w-4 h-4" />
                      <span>{isFullscreen || mobileLogic.isEmbedExpandedFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}</span>
                    </button>

                    {isGoogleDrive && (
                      <button
                        onClick={() => {
                          mobileLogic.toggleEmbedFitMode();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 cursor-pointer min-h-[44px]"
                      >
                        <Crop className="w-4 h-4 text-zinc-400" />
                        <span>Ajuste: {mobileLogic.embedFitMode === 'cover' ? 'Llenar pantalla (Zoom)' : 'Original (16:9)'}</span>
                      </button>
                    )}

                    <a
                      href={parsedSource.directUrl || parsedSource.embedUrl || activeVideoUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setShowMobileSettingsModal(false)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500/95 hover:bg-amber-400 text-xs font-extrabold text-black shadow-lg shadow-amber-950/40 min-h-[44px]"
                    >
                      <ExternalLink className="w-4 h-4 text-black" />
                      <span>Abrir en Google Drive (Nativo con AirPlay)</span>
                    </a>

                    <button
                      onClick={() => {
                        onMinimize();
                        setShowMobileSettingsModal(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 cursor-pointer min-h-[44px]"
                    >
                      <Minimize2 className="w-4 h-4 text-rose-400" />
                      <span>Minimizar a Reproductor Flotante</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Control Style Switch (CineStream vs Native Browser Controls) */}
                  <div className="mb-4 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-300">Estilo de Controles</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {mobileLogic.useNativeControls ? 'Nativos del Navegador' : 'CineStream'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => mobileLogic.setUseNativeControls(false)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          !mobileLogic.useNativeControls
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                        }`}
                      >
                        CineStream
                      </button>
                      <button
                        onClick={() => mobileLogic.setUseNativeControls(true)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          mobileLogic.useNativeControls
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                        }`}
                      >
                        Nativos ({mobileLogic.isIOS ? 'Safari' : 'Navegador'})
                      </button>
                    </div>
                  </div>

                  {/* Subtitles Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                        Subtítulos
                      </span>
                      <button
                        onClick={() => {
                          setShowMobileSettingsModal(false);
                          setIsSubtitleModalOpen(true);
                        }}
                        className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>Ajustes & Subir .SRT</span>
                      </button>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => {
                          setShowMobileSettingsModal(false);
                          subFileInputRef.current?.click();
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-rose-400 border border-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir .SRT/.VTT</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowMobileSettingsModal(false);
                          handleGenerateAiSubtitlesDirectly('es');
                        }}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-xs font-semibold text-amber-400 border border-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Subtítulos IA</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSubtitleConfig({ ...subtitleConfig, trackId: 'off' })}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all truncate cursor-pointer ${
                          subtitleConfig.trackId === 'off'
                            ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                        }`}
                      >
                        Desactivados
                      </button>
                      {availableTracks.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSubtitleConfig({ ...subtitleConfig, trackId: sub.id });
                          }}
                          className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all truncate cursor-pointer ${
                            subtitleConfig.trackId === sub.id || subtitleConfig.trackId === sub.lang
                              ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Playback Speed Section */}
                  <div className="mb-4">
                    <span className="text-xs font-semibold text-zinc-400 block mb-2 uppercase tracking-wide">
                      Velocidad de reproducción
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            handleSpeedSelect(s);
                          }}
                          className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                            playbackSpeed === s
                              ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                              : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                          }`}
                        >
                          {s}x {s === 1 ? '(Normal)' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Quick Actions (Fullscreen, Mute, Source) */}
              <div className="pt-2 border-t border-zinc-800 space-y-2">
                {!isGoogleDrive && (
                  <button
                    onClick={() => {
                      toggleSchoolProxy();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      isSchoolProxyActive
                        ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${isSchoolProxyActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <span>Antifiltro Escolar (Proxy)</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      isSchoolProxyActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-zinc-700 text-zinc-400'
                    }`}>
                      {isSchoolProxyActive ? 'ACTIVO' : 'DIRECTO'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    toggleFullscreen();
                    setShowMobileSettingsModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200"
                >
                  <Maximize className="w-4 h-4 text-rose-400" />
                  <span>{isFullscreen ? 'Salir de Pantalla Completa' : 'Pantalla Completa'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowSourceModal(true);
                    setShowMobileSettingsModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                >
                  <Upload className="w-4 h-4 text-rose-400" />
                  <span>Cambiar Fuente de Video o Archivo</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Subtitles & Styling Modal */}
        <SubtitleModal
          isOpen={isSubtitleModalOpen}
          onClose={() => setIsSubtitleModalOpen(false)}
          movieTitle={activeDisplayTitle}
          availableTracks={availableTracks}
          config={subtitleConfig}
          onConfigChange={setSubtitleConfig}
          onAddCustomTrack={(newTrack) => {
            setCustomTracks((prev) => [...prev, newTrack]);
          }}
          currentTime={effectiveCurrentTime}
          onSeekToTime={(time) => {
            if (isUsingEmbed) {
              setDriveSubtitleTime(time);
            } else if (videoRef.current) {
              videoRef.current.currentTime = time;
              setCurrentTime(time);
            }
          }}
        />

        {/* PC Keyboard Shortcuts Modal */}
        {showShortcutsModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl p-5 shadow-2xl text-zinc-100">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Atajos de Teclado para PC</h3>
                    <p className="text-[10px] text-zinc-400">Control total para CineStream y enlaces externos</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs divide-y divide-zinc-800/60 max-h-[60vh] overflow-y-auto pr-1">
                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-300">Reproducir / Pausar (Nativo o Subtítulos Drive)</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">Espacio</kbd>
                    <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">K</kbd>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-300">Pantalla Completa</span>
                  <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">F</kbd>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-300">Modo Cine (Expandir pantalla)</span>
                  <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">T</kbd>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-300">Atenuación de Luces (Dimming suave)</span>
                  <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">D</kbd>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-300">Activar / Desactivar Subtítulos</span>
                  <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">C</kbd>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-300">Ajustar Desfase Subtítulos (-0.5s / +0.5s)</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">[</kbd>
                    <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">]</kbd>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-300">Silenciar / Activar Audio</span>
                  <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">M</kbd>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-300">Retroceder / Avanzar 10 segundos</span>
                  <div className="flex gap-1">
                    <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">←</kbd>
                    <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">→</kbd>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-300">Antifiltro Escolar (Bypass Media Player)</span>
                  <kbd className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-700/60 rounded font-mono text-emerald-300 text-[11px]">P</kbd>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-300">Ver / Ocultar esta guía de atajos</span>
                  <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-white text-[11px]">?</kbd>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800 flex justify-end">
                <button
                  onClick={() => setShowShortcutsModal(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Local Subtitle File Picker (.srt / .vtt) */}
        <input
          ref={subFileInputRef}
          type="file"
          accept=".srt,.vtt,.txt"
          className="hidden"
          onChange={handleLocalSubtitleFilePick}
        />
      </div>

      {/* Mobile Portrait Detail & Action Hub (Directly Below 16:9 Video) */}
      {isMobilePortrait && !isFullscreen && !mobileLogic.isEmbedExpandedFullscreen && (
        <div className="w-full flex-1 p-4 space-y-5 pb-16 bg-zinc-950 text-white">
          {/* Title & Metadata Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white tracking-wider">
                {movie.contentType === 'series' ? 'SERIE' : movie.quality}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                {movie.ageRating}
              </span>
              <span className="text-zinc-400 text-xs">{movie.year}</span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-zinc-400 text-xs">
                {movie.contentType === 'series' && activeEpisode
                  ? `Ep. ${activeEpisode.episodeNumber}: ${activeEpisode.duration || movie.duration}m`
                  : `${movie.duration}m`}
              </span>
              {isGoogleDrive && (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Google Drive
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white leading-tight">
              {activeDisplayTitle}
            </h1>
          </div>

          {/* Primary Mobile Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={toggleFullscreen}
              className="flex items-center justify-center gap-2 py-3.5 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/60 active:scale-95 transition-all cursor-pointer min-h-[46px]"
            >
              <Maximize className="w-4 h-4" />
              <span>Pantalla Completa</span>
            </button>
            <button
              onClick={onMinimize}
              className="flex items-center justify-center gap-2 py-3.5 px-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold text-xs border border-zinc-700 active:scale-95 transition-all cursor-pointer min-h-[46px]"
            >
              <Minimize2 className="w-4 h-4 text-zinc-300" />
              <span>Minimizar</span>
            </button>
            <button
              onClick={() => setIsSubtitleModalOpen(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              <Subtitles className="w-4 h-4 text-rose-400" />
              <span>Subtítulos ({availableTracks.length})</span>
            </button>
            <button
              onClick={() => setShowMobileSettingsModal(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold border border-zinc-800 active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              <SlidersHorizontal className="w-4 h-4 text-rose-400" />
              <span>Ajustes / Opciones</span>
            </button>
          </div>

          {/* Dedicated Google Drive Control Hub on Mobile */}
          {isGoogleDrive && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900/95 to-zinc-900 border border-amber-500/35 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">Controles Google Drive</span>
                </div>
                <span className="text-[10px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-zinc-700">
                  {mobileLogic.isIOS ? 'Safari iOS' : 'Móvil'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                En celulares, Google Drive no muestra su botón de pantalla completa por restricciones de Safari/iOS. Usa estos botones:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md active:scale-95 cursor-pointer min-h-[44px]"
                >
                  <Maximize className="w-3.5 h-3.5" />
                  <span>Pantalla Completa</span>
                </button>
                <a
                  href={parsedSource.directUrl || parsedSource.embedUrl || activeVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md active:scale-95 cursor-pointer min-h-[44px]"
                  title="Abre en Google Drive para pantalla completa nativa con AirPlay"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-black" />
                  <span>Abrir en Drive</span>
                </a>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[11px]">
                <button
                  onClick={mobileLogic.toggleEmbedFitMode}
                  className="text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <Crop className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Ajuste: {mobileLogic.embedFitMode === 'cover' ? 'Llenar pantalla' : 'Original 16:9'}</span>
                </button>
                <button
                  onClick={() => {
                    const urlToCopy = parsedSource.embedUrl || activeVideoUrl;
                    if (navigator.clipboard && urlToCopy) {
                      navigator.clipboard.writeText(urlToCopy);
                      setResumeToast('Enlace de Google Drive copiado');
                      setTimeout(() => setResumeToast(null), 3000);
                    }
                  }}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer py-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Enlace</span>
                </button>
              </div>
            </div>
          )}

          {/* Controls Mode Switch for HTML5 Video on Mobile */}
          {!isUsingEmbed && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs">
              <div className="flex items-center gap-2">
                <MonitorPlay className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <div className="font-semibold text-zinc-200">Estilo de Controles</div>
                  <div className="text-[11px] text-zinc-400">
                    {mobileLogic.useNativeControls ? 'Controles nativos del navegador' : 'Interfaz táctil CineStream'}
                  </div>
                </div>
              </div>
              <button
                onClick={mobileLogic.toggleNativeControls}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mobileLogic.useNativeControls
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                {mobileLogic.useNativeControls ? 'Nativos' : 'CineStream'}
              </button>
            </div>
          )}

          {/* Series Episodes List (if Serie) */}
          {hasEpisodes && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-rose-500" />
                  <h3 className="text-white text-sm font-bold">
                    Episodios ({episodesList.length})
                  </h3>
                </div>
              </div>
              <div className="space-y-2">
                {episodesList.map((ep, idx) => {
                  const isCurrent = idx === currentEpisodeIndex;
                  return (
                    <button
                      key={ep.id || idx}
                      onClick={() => setCurrentEpisodeIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isCurrent
                          ? 'bg-rose-950/40 border-rose-500/80 text-white'
                          : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCurrent ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {ep.episodeNumber || idx + 1}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-semibold block truncate">
                            {ep.title}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            {ep.duration ? `${ep.duration} min` : 'Episodio'}
                          </span>
                        </div>
                      </div>
                      {isCurrent ? (
                        <Play className="w-4 h-4 fill-rose-500 text-rose-500 shrink-0" />
                      ) : (
                        <Play className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Synopsis & Genres */}
          <div className="space-y-2">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
              Sinopsis
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed">
              {movie.description || 'Sin descripción disponible.'}
            </p>
            {movie.genre && movie.genre.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {movie.genre.map((g) => (
                  <span
                    key={g}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-900 text-zinc-400 border border-zinc-800"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Movies */}
          {nextMovies.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-zinc-900">
              <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                Más Películas Recomendadas
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {nextMovies.slice(0, 4).map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => onSelectMovie(rec)}
                    className="group rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-rose-500 text-left transition-all flex flex-col"
                  >
                    <div className="aspect-video w-full relative overflow-hidden bg-zinc-950">
                      <img
                        src={rec.backdropUrl || rec.posterUrl}
                        alt={rec.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-2">
                      <span className="text-white text-xs font-semibold block truncate">
                        {rec.title}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {rec.year} • {rec.duration}m
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
