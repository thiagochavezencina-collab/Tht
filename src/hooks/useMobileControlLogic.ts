import { useState, useEffect, useCallback, RefObject } from 'react';

export interface MobileControlLogicOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  isUsingEmbed: boolean;
  isPlaying: boolean;
  isGoogleDrive?: boolean;
}

export interface MobileControlLogicReturn {
  // Device & environment info
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobilePortrait: boolean;
  isTouchDevice: boolean;

  // Native vs Custom controls
  useNativeControls: boolean;
  setUseNativeControls: (value: boolean) => void;
  toggleNativeControls: () => void;
  isNativeControlsVisible: boolean;
  isNativeFullscreen: boolean;
  shouldHideCustomOverlay: boolean;
  notifyNativeControlInteraction: (durationMs?: number) => void;

  // Google Drive & Embed enhancements
  isEmbedExpandedFullscreen: boolean;
  toggleEmbedFullscreen: () => void;
  embedFitMode: 'contain' | 'cover';
  toggleEmbedFitMode: () => void;
  openInExternalDrive: (url: string) => void;
}

/**
 * Dedicated Mobile Control Logic hook for VideoPlayerModal.
 * 
 * - Detects mobile device capabilities (iOS Safari, Android Chrome, etc.).
 * - Prevents the custom CineStream overlay from rendering/clashing when native
 *   browser media controls are actively visible or in use (e.g. iOS WebKit controls).
 * - Tracks iOS native video fullscreen (`webkitDisplayingFullscreen`).
 * - Resolves the missing Google Drive fullscreen button on mobile browsers
 *   (Google Drive hides its iframe fullscreen button on iOS Safari due to Apple restrictions).
 */
export function useMobileControlLogic({
  videoRef,
  containerRef,
  isUsingEmbed,
  isGoogleDrive,
}: MobileControlLogicOptions): MobileControlLogicReturn {
  // Device detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    return hasTouch && (window.innerWidth < 1024 || /Android|iPhone|iPad|iPod|Mobile/i.test(ua));
  });

  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    // iPhone, iPod, or iPad (including iPadOS desktop mode)
    return (
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  });

  const [isAndroid, setIsAndroid] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return /Android/i.test(navigator.userAgent || '');
  });

  const [isMobilePortrait, setIsMobilePortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 && window.innerHeight > window.innerWidth;
  });

  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  // State: whether the user or system chose native browser controls instead of custom overlay
  const [useNativeControls, setUseNativeControls] = useState<boolean>(false);

  // State: whether native browser controls are actively being interacted with or visible
  const [isNativeControlsVisible, setIsNativeControlsVisible] = useState<boolean>(false);

  // State: whether the video is in native OS fullscreen (e.g., iOS WebKit fullscreen)
  const [isNativeFullscreen, setIsNativeFullscreen] = useState<boolean>(false);

  // State: Google Drive & Embed fullscreen expansion
  const [isEmbedExpandedFullscreen, setIsEmbedExpandedFullscreen] = useState<boolean>(false);
  const [embedFitMode, setEmbedFitMode] = useState<'contain' | 'cover'>('contain');

  // Timer to clear native interaction state
  const [interactionTimeoutId, setInteractionTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Notify that native controls are in use
  const notifyNativeControlInteraction = useCallback(
    (durationMs: number = 3000) => {
      setIsNativeControlsVisible(true);
      if (interactionTimeoutId) clearTimeout(interactionTimeoutId);
      const tid = setTimeout(() => {
        setIsNativeControlsVisible(false);
      }, durationMs);
      setInteractionTimeoutId(tid);
    },
    [interactionTimeoutId]
  );

  // Toggle between native browser controls and custom CineStream overlay
  const toggleNativeControls = useCallback(() => {
    setUseNativeControls((prev) => !prev);
  }, []);

  // Update orientation and screen size checks
  useEffect(() => {
    const handleResize = () => {
      const portrait = window.innerWidth < 768 && window.innerHeight > window.innerWidth;
      setIsMobilePortrait(portrait);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouchDevice(hasTouch);
      setIsMobile(hasTouch && (window.innerWidth < 1024 || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)));
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Sync native video events for iOS WebKit & HTML5 video
  useEffect(() => {
    const video = videoRef.current as any;
    if (!video || isUsingEmbed) return;

    const handleWebkitBeginFullscreen = () => {
      setIsNativeFullscreen(true);
      setIsNativeControlsVisible(true);
    };

    const handleWebkitEndFullscreen = () => {
      setIsNativeFullscreen(false);
      setIsNativeControlsVisible(false);
    };

    const handleNativeSeeking = () => {
      if (useNativeControls) {
        notifyNativeControlInteraction(2000);
      }
    };

    const handleNativeTouch = () => {
      if (useNativeControls) {
        notifyNativeControlInteraction(3000);
      }
    };

    video.addEventListener('webkitbeginfullscreen', handleWebkitBeginFullscreen);
    video.addEventListener('webkitendfullscreen', handleWebkitEndFullscreen);
    video.addEventListener('seeking', handleNativeSeeking);
    video.addEventListener('touchstart', handleNativeTouch, { passive: true });

    return () => {
      video.removeEventListener('webkitbeginfullscreen', handleWebkitBeginFullscreen);
      video.removeEventListener('webkitendfullscreen', handleWebkitEndFullscreen);
      video.removeEventListener('seeking', handleNativeSeeking);
      video.removeEventListener('touchstart', handleNativeTouch);
    };
  }, [videoRef, isUsingEmbed, useNativeControls, notifyNativeControlInteraction]);

  // Fullscreen change listener across browsers
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFs = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      if (!isFs) {
        setIsEmbedExpandedFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Embed Fullscreen handler (Especially crucial for Google Drive on iOS where iframe fullscreen is blocked)
  const toggleEmbedFullscreen = useCallback(() => {
    const container = containerRef.current as any;
    const doc = document as any;

    const isCurrentFs = Boolean(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement
    );

    if (isCurrentFs) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
      setIsEmbedExpandedFullscreen(false);
    } else {
      // Try native container fullscreen if supported (Android, iPad, Desktop)
      if (container && container.requestFullscreen) {
        container.requestFullscreen().then(() => {
          setIsEmbedExpandedFullscreen(true);
        }).catch(() => {
          // If browser rejects (common on iOS iPhone), fall back to CSS viewport fullscreen
          setIsEmbedExpandedFullscreen((prev) => !prev);
        });
      } else if (container && container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
        setIsEmbedExpandedFullscreen(true);
      } else {
        // Fallback to CSS viewport fullscreen
        setIsEmbedExpandedFullscreen((prev) => !prev);
      }
    }
  }, [containerRef]);

  const toggleEmbedFitMode = useCallback(() => {
    setEmbedFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
  }, []);

  const openInExternalDrive = useCallback((url: string) => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  // Compute shouldHideCustomOverlay:
  // Custom overlay MUST be prevented from rendering when:
  // 1. User/device is using native browser controls (`useNativeControls`)
  // 2. Native browser controls are actively visible/being used (`isNativeControlsVisible`)
  // 3. The video is playing in native OS fullscreen (`isNativeFullscreen` e.g. iOS WebKit player)
  // 4. In embeds on mobile where iframe has its own native UI and custom overlays would obstruct
  const shouldHideCustomOverlay =
    useNativeControls ||
    isNativeControlsVisible ||
    isNativeFullscreen;

  return {
    isMobile,
    isIOS,
    isAndroid,
    isMobilePortrait,
    isTouchDevice,
    useNativeControls,
    setUseNativeControls,
    toggleNativeControls,
    isNativeControlsVisible,
    isNativeFullscreen,
    shouldHideCustomOverlay,
    notifyNativeControlInteraction,
    isEmbedExpandedFullscreen,
    toggleEmbedFullscreen,
    embedFitMode,
    toggleEmbedFitMode,
    openInExternalDrive,
  };
}
