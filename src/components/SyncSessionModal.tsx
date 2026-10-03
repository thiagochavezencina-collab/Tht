import React, { useState, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Smartphone,
  Laptop,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  Shield,
  ShieldCheck,
  Clock,
  Bookmark,
  Play,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { Movie, WatchProgress, CurrentPlayingState, SyncSession } from '../types';
import {
  generateSyncCode,
  createSyncSessionInFirestore,
  getSyncSessionFromFirestore,
  markSyncSessionTransferredInFirestore,
  subscribeToSyncSession,
} from '../firestoreService';

interface SyncSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: string[];
  watchProgressMap: Record<string, WatchProgress>;
  movies: Movie[];
  currentPlaying?: CurrentPlayingState | null;
  onImportSession: (
    importedWatchlist: string[],
    importedProgress: Record<string, WatchProgress>,
    currentPlaying?: CurrentPlayingState | null
  ) => void;
}

export const SyncSessionModal: React.FC<SyncSessionModalProps> = ({
  isOpen,
  onClose,
  watchlist,
  watchProgressMap,
  movies,
  currentPlaying,
  onImportSession,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [syncCode, setSyncCode] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTransferred, setIsTransferred] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30 * 60); // 30 mins

  // Manual import states
  const [inputCode, setInputCode] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState('');

  // Encode compact payload for URL fallback
  const createCompactPayload = useCallback(() => {
    try {
      const payload = {
        wl: watchlist,
        wp: watchProgressMap,
        cp: currentPlaying || null,
        ts: Date.now(),
      };
      const json = JSON.stringify(payload);
      return typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(json))) : '';
    } catch {
      return '';
    }
  }, [watchlist, watchProgressMap, currentPlaying]);

  // Generate QR Code and Session
  const generateNewSession = useCallback(async () => {
    setIsGenerating(true);
    setIsTransferred(false);
    setTimeLeft(30 * 60);

    const code = generateSyncCode();
    setSyncCode(code);

    const base64Data = createCompactPayload();
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // Both Firestore sync code and instant offline fallback payload in query
    const targetUrl = `${origin}/?syncCode=${code}&p=${base64Data}`;

    try {
      // 1. Generate QR Code image
      const dataUrl = await QRCode.toDataURL(targetUrl, {
        width: 340,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(dataUrl);

      // 2. Save session to Firestore for cloud-relay
      await createSyncSessionInFirestore(code, {
        watchlist,
        watchProgress: JSON.stringify(watchProgressMap),
        currentPlaying: currentPlaying || null,
        deviceOrigin: 'laptop',
      });
    } catch (err) {
      console.warn('Error creating QR code or sync session:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [watchlist, watchProgressMap, currentPlaying, createCompactPayload]);

  // Initialize or re-generate when modal opens
  useEffect(() => {
    if (isOpen) {
      generateNewSession();
    }
  }, [isOpen]);

  // Subscribe to live status in Firestore: detects when mobile has scanned & transferred
  useEffect(() => {
    if (!isOpen || !syncCode) return;

    const unsubscribe = subscribeToSyncSession(syncCode, (session) => {
      if (session && session.status === 'transferred') {
        setIsTransferred(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen, syncCode]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const base64Data = createCompactPayload();
    const targetUrl = `${origin}/?syncCode=${syncCode}&p=${base64Data}`;
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(syncCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Handle manual code import
  const handleManualImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    setImportStatus('loading');
    setImportError('');

    try {
      const session = await getSyncSessionFromFirestore(inputCode.trim());
      if (!session) {
        setImportStatus('error');
        setImportError('Código inválido o sesión expirada. Verifica los 6 caracteres.');
        return;
      }

      let parsedProgress: Record<string, WatchProgress> = {};
      try {
        parsedProgress = JSON.parse(session.watchProgress || '{}');
      } catch {}

      onImportSession(session.watchlist || [], parsedProgress, session.currentPlaying);
      await markSyncSessionTransferredInFirestore(session.id);
      setImportStatus('success');
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      setImportStatus('error');
      setImportError(err.message || 'Error al conectar con la sesión.');
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentMovieObj = currentPlaying?.movieId
    ? movies.find((m) => m.id === currentPlaying.movieId)
    : null;

  if (!isOpen) return null;

  return (
    <div
      id="sync-session-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        id="sync-session-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 text-white shadow-md shadow-rose-950/40">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Sincronizar mi Sesión
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-600/20 text-rose-300 border border-rose-500/30 uppercase tracking-wide">
                  Laptop ➔ Móvil
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Pasa tu progreso y favoritos al celular en 1 segundo
              </p>
            </div>
          </div>
          <button
            id="close-sync-modal-btn"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <QrCode className="w-4 h-4 text-rose-500" />
            <span>Generar Código QR (Desde Laptop)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'import'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
            }`}
          >
            <Smartphone className="w-4 h-4 text-amber-500" />
            <span>Ingresar Código (En Móvil)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {activeTab === 'export' ? (
            <>
              {/* Transferred Notification Banner */}
              {isTransferred ? (
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 flex items-center gap-3 animate-bounce shadow-lg shadow-emerald-950/40">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-200">
                      ¡Celular conectado con éxito!
                    </h4>
                    <p className="text-xs text-emerald-300/90">
                      Tus favoritos y progreso se sincronizaron al móvil. Ya puedes continuar viendo allí.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800/90">
                <div className="relative p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Código QR de Sincronización"
                      className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-56 h-56 flex items-center justify-center text-zinc-500">
                      <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
                    </div>
                  )}

                  {/* Logo Center Badge inside QR */}
                  <div className="absolute inset-0 m-auto w-12 h-12 bg-zinc-950 text-white rounded-xl border-2 border-white shadow-lg flex items-center justify-center pointer-events-none">
                    <span className="font-extrabold text-xs text-rose-500 tracking-tighter">CINE</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mt-3 text-center flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-rose-400" />
                  Apunta con la cámara de tu celular (iOS / Android) para transferir tu sesión al instante.
                </p>

                {/* 6-Character Code & Copy */}
                <div className="mt-3 flex items-center gap-2 w-full max-w-xs justify-center">
                  <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 font-mono font-bold tracking-widest text-sm flex items-center gap-2">
                    <span className="text-xs text-zinc-500 font-sans font-normal">PIN:</span>
                    <span className="text-amber-400">{syncCode}</span>
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Copiar código PIN"
                  >
                    {copiedCode ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Copiar enlace directo"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-rose-400" />
                        <span>Enlace</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-2">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>Código válido por: <strong className="text-zinc-400">{formatCountdown(timeLeft)}</strong></span>
                  <button
                    onClick={generateNewSession}
                    disabled={isGenerating}
                    className="text-rose-400 hover:text-rose-300 font-semibold ml-2 underline cursor-pointer"
                  >
                    Regenerar
                  </button>
                </div>
              </div>

              {/* What will be transferred card */}
              <div className="p-3 sm:p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Datos que se transferirán a tu teléfono
                </h4>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">{watchlist.length} Favoritos</div>
                      <div className="text-[11px] text-zinc-400">En tu lista personal</div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">
                        {Object.keys(watchProgressMap).length} Progresos
                      </div>
                      <div className="text-[11px] text-zinc-400">Minutos guardados</div>
                    </div>
                  </div>
                </div>

                {/* Active Playing Movie Preview */}
                {currentPlaying && currentPlaying.title ? (
                  <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {currentMovieObj?.posterUrl && (
                        <img
                          src={currentMovieObj.posterUrl}
                          alt={currentPlaying.title}
                          className="w-8 h-11 object-cover rounded-md shrink-0 shadow-sm"
                        />
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wide flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 fill-rose-400" />
                          Película en reproducción
                        </span>
                        <div className="text-xs font-bold text-white truncate">
                          {currentPlaying.title}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {currentPlaying.episodeTitle ? `${currentPlaying.episodeTitle} • ` : ''}
                          Segundo exacto: {Math.floor(currentPlaying.currentTime / 60)}:
                          {Math.floor(currentPlaying.currentTime % 60) < 10 ? '0' : ''}
                          {Math.floor(currentPlaying.currentTime % 60)}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-[10px] font-bold whitespace-nowrap">
                      Listo para reanudar
                    </span>
                  </div>
                ) : null}
              </div>

              {/* LanSchool Air Bypass Tip Card */}
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-200 flex items-center gap-1">
                    Bypass LanSchool Air con tu Celular
                  </h4>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    LanSchool Air únicamente tiene control sobre la pantalla y red de este computador escolar. Al transferir tu sesión a tu teléfono personal, disfrutarás de tus películas con tu conexión sin que el profesor o el filtro puedan ver tu pantalla.
                  </p>
                </div>
              </div>
            </>
          ) : (
            /* Manual Import Tab */
            <form onSubmit={handleManualImport} className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Ingresa el código PIN de 6 caracteres
                </label>
                <p className="text-xs text-zinc-400">
                  Si estás en tu teléfono y no puedes escanear la cámara, escribe el código que se muestra en tu laptop.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="EJ: CS-7X2K9"
                    maxLength={10}
                    className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-white font-mono font-bold text-base tracking-widest uppercase focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                  <button
                    type="submit"
                    disabled={importStatus === 'loading' || !inputCode.trim()}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    {importStatus === 'loading' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>Importar</span>
                  </button>
                </div>

                {importError && (
                  <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{importError}</span>
                  </div>
                )}

                {importStatus === 'success' && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>¡Sesión importada exitosamente! Actualizando...</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                <strong>¿Cómo funciona?</strong>
                <p>
                  El código conecta tu teléfono directamente con la sesión de tu laptop mediante Cloud Firestore seguro o codificación directa. Tu lista de favoritos se combinará sin borrar los favoritos que ya tengas en tu móvil.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Transferencia cifrada de dispositivo a dispositivo</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
