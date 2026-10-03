import React, { useState, useRef, useMemo } from 'react';
import {
  Subtitles,
  Upload,
  Link,
  Check,
  X,
  Clock,
  Type,
  Palette,
  Sparkles,
  Sliders,
  AlertCircle,
  Download,
  Monitor,
  MoveVertical,
  ListOrdered,
  Search,
  Play,
} from 'lucide-react';
import { SubtitleTrack } from '../types';
import {
  readSubtitleFile,
  loadSubtitlesFromUrl,
  generateAiSubtitles,
  detectSubtitleLanguage,
  downloadSubtitleFile,
  SubtitleCue,
} from '../utils/subtitleHelper';

export interface SubtitleConfig {
  trackId: string; // 'off' or track id or lang
  offsetSeconds: number; // e.g. -0.5 or +0.5
  fontSize: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
  textColor: 'white' | 'yellow' | 'cyan' | 'green';
  backgroundStyle: 'solid' | 'translucent' | 'shadow';
  verticalPosition?: 'bottom' | 'drive_safe' | 'top';
}

interface SubtitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieTitle: string;
  availableTracks: SubtitleTrack[];
  config: SubtitleConfig;
  onConfigChange: (newConfig: SubtitleConfig) => void;
  onAddCustomTrack: (track: SubtitleTrack) => void;
  onSeekToTime?: (time: number) => void;
  currentTime?: number;
}

const formatCueTime = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const SubtitleModal: React.FC<SubtitleModalProps> = ({
  isOpen,
  onClose,
  movieTitle,
  availableTracks,
  config,
  onConfigChange,
  onAddCustomTrack,
  onSeekToTime,
  currentTime = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'tracks' | 'sync' | 'style' | 'preview'>('tracks');
  const [urlInput, setUrlInput] = useState('');
  const [urlLang, setUrlLang] = useState('es');
  const [urlLabel, setUrlLabel] = useState('Español (Enlace)');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [searchPreviewQuery, setSearchPreviewQuery] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTrack = useMemo(() => {
    if (config.trackId === 'off') return null;
    return availableTracks.find((t) => t.id === config.trackId || t.lang === config.trackId) || null;
  }, [availableTracks, config.trackId]);

  if (!isOpen) return null;

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { fileName, cues } = await readSubtitleFile(file);
      if (cues.length === 0) {
        showNotification('error', 'El archivo no contiene marcas de tiempo o subtítulos válidos (.srt, .vtt, .ass).');
        return;
      }

      const detected = detectSubtitleLanguage(cues, fileName);
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      const newTrack: SubtitleTrack = {
        id: `custom-${Date.now()}`,
        lang: detected.lang,
        label: `${cleanName} [${detected.flag} ${detected.languageName}]`,
        fileName,
        cues,
      };

      onAddCustomTrack(newTrack);
      onConfigChange({
        ...config,
        trackId: newTrack.id,
      });

      const firstTimeStr = formatCueTime(cues[0].start);
      showNotification(
        'success',
        `✨ Subtítulo cargado: ${cues.length} líneas detectadas (${detected.flag} ${detected.languageName}). Primer diálogo a los ${firstTimeStr}. Pista activada.`
      );
    } catch (err: any) {
      showNotification('error', err?.message || 'Error al procesar el archivo de subtítulos');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsLoadingUrl(true);
    try {
      const cues = await loadSubtitlesFromUrl(urlInput.trim());
      if (cues.length === 0) {
        showNotification('error', 'No se encontraron subtítulos válidos en la URL proporcionada.');
        return;
      }

      const detected = detectSubtitleLanguage(cues, urlInput.trim());
      const customLabel = urlLabel.trim() || `Web [${detected.flag} ${detected.languageName}]`;

      const newTrack: SubtitleTrack = {
        id: `url-${Date.now()}`,
        lang: urlLang !== 'es' ? urlLang : detected.lang,
        label: customLabel,
        url: urlInput.trim(),
        cues,
      };

      onAddCustomTrack(newTrack);
      onConfigChange({
        ...config,
        trackId: newTrack.id,
      });
      setUrlInput('');
      showNotification(
        'success',
        `✨ Idioma detectado: ${detected.flag} ${detected.languageName}. Subtítulos web asignados al reproductor (${cues.length} líneas).`
      );
    } catch (err: any) {
      showNotification('error', 'No se pudo descargar el archivo. Verifica que el enlace permita acceso público (CORS).');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleGenerateAiSubtitles = (lang: 'es' | 'en') => {
    const cues = generateAiSubtitles(movieTitle, 'Cine', 5400, lang);
    const aiTrack: SubtitleTrack = {
      id: `ai-${lang}-${Date.now()}`,
      lang,
      label: lang === 'es' ? 'Español (Generado con IA)' : 'English (AI Generated)',
      cues,
    };
    onAddCustomTrack(aiTrack);
    onConfigChange({
      ...config,
      trackId: aiTrack.id,
    });
    showNotification(
      'success',
      `✨ Subtítulos generados con IA en ${lang === 'es' ? 'Español' : 'Inglés'} sincronizados (${cues.length} líneas).`
    );
  };

  return (
    <div
      id="subtitle-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        id="subtitle-modal-container"
        className="relative w-full max-w-lg bg-zinc-900/95 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Subtitles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base">Subtítulos & Audio</h3>
              <p className="text-zinc-400 text-xs truncate max-w-[220px] sm:max-w-xs">{movieTitle}</p>
            </div>
          </div>
          <button
            id="close-subtitle-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal de subtítulos"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center border-b border-zinc-800 px-3 bg-zinc-900/50">
          <button
            id="tab-subtitles-tracks"
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'tracks'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Subtitles className="w-3.5 h-3.5" />
            <span>Pistas & Archivo</span>
          </button>
          <button
            id="tab-subtitles-sync"
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sync'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Sincronización {config.offsetSeconds !== 0 && `(${config.offsetSeconds > 0 ? '+' : ''}${config.offsetSeconds}s)`}</span>
          </button>
          <button
            id="tab-subtitles-style"
            onClick={() => setActiveTab('style')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'style'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Estilo & Tamaño</span>
          </button>
          <button
            id="tab-subtitles-preview"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'preview'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Líneas & Verificación {activeTrack?.cues ? `(${activeTrack.cues.length})` : ''}</span>
          </button>
        </div>

        {/* Notification Toast */}
        {feedbackMsg && (
          <div
            className={`mx-4 mt-3 p-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fade-in ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                : 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <Check className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 ios-scrollable flex-1">
          {/* TAB 1: TRACKS & FILE UPLOAD */}
          {activeTab === 'tracks' && (
            <div className="space-y-4">
              {/* Google Drive & PC Tip */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
                <Monitor className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-zinc-300 space-y-1">
                  <span className="font-bold text-amber-300 block">Subtítulos para PC y Google Drive:</span>
                  <p className="text-zinc-400 leading-snug">
                    CineStream proyecta subtítulos flotantes de alta legibilidad sobre el reproductor (incluso con enlaces de Google Drive). También puedes hacer clic en <Download className="inline w-3 h-3 text-rose-400" /> para descargar el archivo <b>.SRT</b> y arrastrarlo directo al reproductor de Drive en PC.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Pistas Disponibles
                </label>
                <div className="space-y-2">
                  {/* Desactivado option */}
                  <button
                    id="track-option-off"
                    onClick={() => onConfigChange({ ...config, trackId: 'off' })}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.trackId === 'off'
                        ? 'bg-rose-600/20 border-rose-500 text-white font-semibold'
                        : 'bg-zinc-800/50 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          config.trackId === 'off' ? 'border-rose-400 bg-rose-500' : 'border-zinc-500'
                        }`}
                      >
                        {config.trackId === 'off' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs sm:text-sm">Desactivados (Sin subtítulos)</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 font-mono">OFF</span>
                  </button>

                  {/* Available tracks list */}
                  {availableTracks.map((track) => {
                    const isSelected = config.trackId === track.id || config.trackId === track.lang;
                    const cueCount = track.cues?.length || 0;
                    return (
                      <div
                        key={track.id}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-rose-600/20 border-rose-500 text-white font-semibold shadow-md shadow-rose-950/20'
                            : 'bg-zinc-800/50 border-zinc-700/60 text-zinc-300 hover:bg-zinc-850'
                        }`}
                      >
                        <button
                          id={`track-option-${track.id}`}
                          onClick={() => onConfigChange({ ...config, trackId: track.id })}
                          className="flex items-center gap-2.5 truncate flex-1 text-left cursor-pointer mr-2"
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'border-rose-400 bg-rose-500' : 'border-zinc-500'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <div className="truncate">
                            <span className="text-xs sm:text-sm block truncate">{track.label}</span>
                            {track.fileName && (
                              <span className="text-[10px] text-zinc-400 block truncate">{track.fileName}</span>
                            )}
                          </div>
                        </button>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {cueCount > 0 && (
                            <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700">
                              {cueCount} líns
                            </span>
                          )}
                          <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded">
                            {track.lang}
                          </span>
                          {cueCount > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadSubtitleFile(track.cues || [], `${movieTitle}_${track.lang}`, 'srt');
                                setFeedbackMsg({
                                  type: 'success',
                                  text: `📥 Descargado archivo .SRT (${track.label}) para Google Drive / PC.`,
                                });
                              }}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors cursor-pointer"
                              title="Descargar archivo .SRT para Google Drive en PC"
                            >
                              <Download className="w-3.5 h-3.5 text-rose-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Upload Custom File */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Cargar Archivo Local (.SRT o .VTT)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".srt,.vtt,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  id="upload-srt-file-btn"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-dashed border-zinc-600 hover:border-rose-500 transition-all text-xs sm:text-sm font-semibold cursor-pointer group"
                >
                  <Upload className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                  <span>Seleccionar archivo de subtítulos de tu dispositivo</span>
                </button>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Compatible con formatos estándar <b>.srt</b> (SubRip) y <b>.vtt</b> (WebVTT).
                </p>
              </div>

              {/* URL Input Form */}
              <div className="pt-2 border-t border-zinc-800">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  O Cargar desde Enlace Web (URL)
                </label>
                <form onSubmit={handleAddFromUrl} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/subtitulos.vtt"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                    />
                    <button
                      type="submit"
                      disabled={isLoadingUrl || !urlInput.trim()}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>{isLoadingUrl ? 'Cargando...' : 'Añadir'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* AI-Generated Subtitles Options */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Generar Subtítulos con IA
                  </label>
                </div>
                <p className="text-[11px] text-zinc-400 mb-2">
                  La IA genera diálogos y efectos sonoros contextuales adaptados a la trama y duración de la película.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="load-ai-sub-es-btn"
                    onClick={() => handleGenerateAiSubtitles('es')}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-950/60 to-zinc-800 hover:border-rose-500 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors text-left flex items-center justify-between cursor-pointer group"
                  >
                    <span className="group-hover:text-white">Generar con IA (Español)</span>
                    <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">ES</span>
                  </button>
                  <button
                    id="load-ai-sub-en-btn"
                    onClick={() => handleGenerateAiSubtitles('en')}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-950/60 to-zinc-800 hover:border-rose-500 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors text-left flex items-center justify-between cursor-pointer group"
                  >
                    <span className="group-hover:text-white">AI Generated (English)</span>
                    <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">EN</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SYNCHRONIZATION OFFSET */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-center">
                <span className="text-xs text-zinc-400 block mb-1">Desfase actual de subtítulos:</span>
                <div className="text-2xl font-mono font-bold text-white tracking-wider">
                  {config.offsetSeconds > 0 ? `+${config.offsetSeconds.toFixed(1)}s` : `${config.offsetSeconds.toFixed(1)}s`}
                </div>
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  {config.offsetSeconds === 0
                    ? 'Subtítulos sin retraso adicional.'
                    : config.offsetSeconds > 0
                    ? 'Aparecen más tarde (+adelante).'
                    : 'Aparecen más temprano (-atrás).'}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Ajuste Rápido de Tiempo
                </label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[-1.0, -0.5, 0, 0.5, 1.0].map((step) => (
                    <button
                      key={step}
                      onClick={() =>
                        onConfigChange({
                          ...config,
                          offsetSeconds: step === 0 ? 0 : Number((config.offsetSeconds + step).toFixed(1)),
                        })
                      }
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                        step === 0
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-300 border-zinc-700'
                          : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                      }`}
                    >
                      {step === 0 ? 'Reset' : step > 0 ? `+${step}s` : `${step}s`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    onConfigChange({
                      ...config,
                      offsetSeconds: Number((config.offsetSeconds - 0.1).toFixed(1)),
                    })
                  }
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 border border-zinc-700 cursor-pointer"
                >
                  -0.1s (Fino)
                </button>
                <button
                  onClick={() =>
                    onConfigChange({
                      ...config,
                      offsetSeconds: Number((config.offsetSeconds + 0.1).toFixed(1)),
                    })
                  }
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 border border-zinc-700 cursor-pointer"
                >
                  +0.1s (Fino)
                </button>
              </div>

              {/* PC Keyboard Shortcut Tip for Sync */}
              <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  Atajos rápidos PC:
                </span>
                <span className="font-mono text-[11px] text-zinc-300">
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white">[</kbd> -0.5s &nbsp;
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white">]</kbd> +0.5s &nbsp;
                  <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-white">C</kbd> On/Off
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: VISUAL STYLE & SIZE */}
          {activeTab === 'style' && (
            <div className="space-y-4">
              {/* Preview Box */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Vista Previa en Pantalla
                </label>
                <div className="h-28 rounded-xl bg-zinc-950 flex items-center justify-center p-3 border border-zinc-800 relative overflow-hidden">
                  <div
                    className={`text-center transition-all ${
                      config.fontSize === 'sm'
                        ? 'text-xs'
                        : config.fontSize === 'base'
                        ? 'text-sm'
                        : config.fontSize === 'lg'
                        ? 'text-base sm:text-lg'
                        : config.fontSize === 'xl'
                        ? 'text-lg sm:text-xl'
                        : 'text-xl sm:text-2xl font-bold'
                    } ${
                      config.textColor === 'yellow'
                        ? 'text-yellow-300'
                        : config.textColor === 'cyan'
                        ? 'text-cyan-300'
                        : config.textColor === 'green'
                        ? 'text-emerald-300'
                        : 'text-white'
                    } ${
                      config.backgroundStyle === 'solid'
                        ? 'bg-black/90 px-4 py-1.5 rounded-lg border border-white/10 shadow-xl backdrop-blur-sm'
                        : config.backgroundStyle === 'translucent'
                        ? 'bg-black/40 backdrop-blur-sm px-4 py-1 rounded-lg shadow-md'
                        : 'drop-shadow-[0_2px_8px_rgba(0,0,0,1)] font-semibold'
                    }`}
                  >
                    Este es un ejemplo de subtítulo en CineStream
                  </div>
                </div>
              </div>

              {/* Font Size Selector */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Tamaño de Texto (Optimizado para PC)
                </label>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[
                    { id: 'sm', label: 'Pequeño' },
                    { id: 'base', label: 'Normal' },
                    { id: 'lg', label: 'Grande' },
                    { id: 'xl', label: 'X-Grande' },
                    { id: '2xl', label: '2X (PC)' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => onConfigChange({ ...config, fontSize: sz.id as any })}
                      className={`py-2 px-1 rounded-xl text-[11px] sm:text-xs font-semibold border transition-all cursor-pointer ${
                        config.fontSize === sz.id
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position Selector (Vertical) */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Posición Vertical en Pantalla
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bottom', label: 'Inferior Normal', desc: 'Abajo' },
                    { id: 'drive_safe', label: 'Elevado (Drive)', desc: 'Evita barra Drive' },
                    { id: 'top', label: 'Superior', desc: 'Arriba' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      onClick={() => onConfigChange({ ...config, verticalPosition: pos.id as any })}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex flex-col items-center justify-center ${
                        (config.verticalPosition || 'drive_safe') === pos.id
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                      }`}
                    >
                      <span>{pos.label}</span>
                      <span className="text-[10px] opacity-75 font-normal">{pos.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Style */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Fondo del Subtítulo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'solid', label: 'Fondo Negro Sólido' },
                    { id: 'translucent', label: 'Translúcido (Blur)' },
                    { id: 'shadow', label: 'Sin Fondo (Sombra PC)' },
                  ].map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => onConfigChange({ ...config, backgroundStyle: bg.id as any })}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        config.backgroundStyle === bg.id
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Color del Texto
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'white', label: 'Blanco', colorClass: 'bg-white border-zinc-400' },
                    { id: 'yellow', label: 'Amarillo Cine', colorClass: 'bg-yellow-300 border-yellow-500' },
                    { id: 'cyan', label: 'Cian Neón', colorClass: 'bg-cyan-300 border-cyan-500' },
                    { id: 'green', label: 'Verde Cine', colorClass: 'bg-emerald-300 border-emerald-500' },
                  ].map((col) => (
                    <button
                      key={col.id}
                      onClick={() => onConfigChange({ ...config, textColor: col.id as any })}
                      className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        config.textColor === col.id
                          ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                          : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full border ${col.colorClass}`} />
                      <span className="truncate">{col.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREVIEW & VERIFICATION */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {!activeTrack || !activeTrack.cues || activeTrack.cues.length === 0 ? (
                <div className="p-6 rounded-2xl bg-zinc-950/70 border border-zinc-800 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No hay subtítulos activos para visualizar</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Selecciona una pista activa o sube tu archivo <b>.srt</b> o <b>.vtt</b> en la pestaña <b>"Pistas & Archivo"</b> para verificar sus líneas y saltar directamente al diálogo.
                  </p>
                  <button
                    onClick={() => setActiveTab('tracks')}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Ir a Pistas & Archivo
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Status Banner */}
                  <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{activeTrack.label}</span>
                      <span className="text-[11px] text-zinc-400">
                        {activeTrack.cues.length} líneas de diálogo • Primer diálogo:{' '}
                        <b className="text-rose-400">{formatCueTime(activeTrack.cues[0].start)}</b>
                      </span>
                    </div>
                    {onSeekToTime && activeTrack.cues.length > 0 && (
                      <button
                        onClick={() => {
                          onSeekToTime(activeTrack.cues![0].start);
                          showNotification(
                            'success',
                            `Saltando al primer diálogo (${formatCueTime(activeTrack.cues![0].start)})...`
                          );
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-md"
                        title="Ir al inicio de los diálogos en el video"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Ir al 1er diálogo</span>
                      </button>
                    )}
                  </div>

                  {/* Search filter */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar palabra o frase en los subtítulos..."
                      value={searchPreviewQuery}
                      onChange={(e) => setSearchPreviewQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-700/80 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  {/* Cues List */}
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 ios-scrollable">
                    {(() => {
                      const filtered = searchPreviewQuery.trim()
                        ? activeTrack.cues.filter((c) =>
                            c.text.toLowerCase().includes(searchPreviewQuery.toLowerCase())
                          )
                        : activeTrack.cues;

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-6 text-zinc-500 text-xs">
                            No se encontraron diálogos que coincidan con "{searchPreviewQuery}".
                          </div>
                        );
                      }

                      return filtered.slice(0, 100).map((cue, idx) => {
                        const isCurrent =
                          currentTime >= cue.start && currentTime <= cue.end;
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition-colors ${
                              isCurrent
                                ? 'bg-rose-950/40 border-rose-500 text-white'
                                : 'bg-zinc-950/50 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">
                                  {formatCueTime(cue.start)} → {formatCueTime(cue.end)}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                                    En pantalla
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                                {cue.text}
                              </p>
                            </div>
                            {onSeekToTime && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSeekToTime(cue.start);
                                  showNotification(
                                    'success',
                                    `Reproduciendo en ${formatCueTime(cue.start)}...`
                                  );
                                }}
                                className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-rose-600 hover:text-white text-zinc-400 text-[11px] font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                                title="Saltar a este diálogo en el reproductor"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>Saltar</span>
                              </button>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            Estado: {config.trackId === 'off' ? 'Desactivados' : 'Activos'}
          </span>
          <button
            id="apply-subtitles-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 transition-all cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
