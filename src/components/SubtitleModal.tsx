import React, { useState, useRef } from 'react';
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
} from 'lucide-react';
import { SubtitleTrack } from '../types';
import {
  readSubtitleFile,
  loadSubtitlesFromUrl,
  createDemoSubtitles,
  SubtitleCue,
} from '../utils/subtitleHelper';

export interface SubtitleConfig {
  trackId: string; // 'off' or track id or lang
  offsetSeconds: number; // e.g. -0.5 or +0.5
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  textColor: 'white' | 'yellow';
  backgroundStyle: 'solid' | 'translucent' | 'shadow';
}

interface SubtitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  movieTitle: string;
  availableTracks: SubtitleTrack[];
  config: SubtitleConfig;
  onConfigChange: (newConfig: SubtitleConfig) => void;
  onAddCustomTrack: (track: SubtitleTrack) => void;
}

export const SubtitleModal: React.FC<SubtitleModalProps> = ({
  isOpen,
  onClose,
  movieTitle,
  availableTracks,
  config,
  onConfigChange,
  onAddCustomTrack,
}) => {
  const [activeTab, setActiveTab] = useState<'tracks' | 'sync' | 'style'>('tracks');
  const [urlInput, setUrlInput] = useState('');
  const [urlLang, setUrlLang] = useState('es');
  const [urlLabel, setUrlLabel] = useState('Español (Enlace)');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { fileName, cues } = await readSubtitleFile(file);
      if (cues.length === 0) {
        showNotification('error', 'El archivo no contiene marcas de tiempo o subtítulos válidos.');
        return;
      }

      const isSpanishName = /es|esp|spa|lat/i.test(fileName);
      const newTrack: SubtitleTrack = {
        id: `custom-${Date.now()}`,
        lang: isSpanishName ? 'es' : 'custom',
        label: fileName.replace(/\.[^/.]+$/, ''), // remove extension
        fileName,
        cues,
      };

      onAddCustomTrack(newTrack);
      onConfigChange({
        ...config,
        trackId: newTrack.id,
      });
      showNotification('success', `Subtítulos cargados con éxito (${cues.length} líneas)`);
    } catch (err: any) {
      showNotification('error', err?.message || 'Error al procesar el archivo .srt / .vtt');
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

      const newTrack: SubtitleTrack = {
        id: `url-${Date.now()}`,
        lang: urlLang,
        label: urlLabel.trim() || 'Subtítulos Web',
        url: urlInput.trim(),
        cues,
      };

      onAddCustomTrack(newTrack);
      onConfigChange({
        ...config,
        trackId: newTrack.id,
      });
      setUrlInput('');
      showNotification('success', `Subtítulos descargados con éxito (${cues.length} líneas)`);
    } catch (err: any) {
      showNotification('error', 'No se pudo descargar el archivo. Verifica que el enlace permita acceso público (CORS).');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleLoadDemo = (lang: 'es' | 'en') => {
    const cues = createDemoSubtitles(movieTitle, lang);
    const demoTrack: SubtitleTrack = {
      id: `demo-${lang}-${Date.now()}`,
      lang,
      label: lang === 'es' ? 'Español (Demostración)' : 'English (Demo)',
      cues,
    };
    onAddCustomTrack(demoTrack);
    onConfigChange({
      ...config,
      trackId: demoTrack.id,
    });
    showNotification('success', `Subtítulos de demostración en ${lang === 'es' ? 'Español' : 'Inglés'} activados.`);
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
                      <button
                        key={track.id}
                        id={`track-option-${track.id}`}
                        onClick={() => onConfigChange({ ...config, trackId: track.id })}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-rose-600/20 border-rose-500 text-white font-semibold shadow-md shadow-rose-950/20'
                            : 'bg-zinc-800/50 border-zinc-700/60 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
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
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {cueCount > 0 && (
                            <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700">
                              {cueCount} líns
                            </span>
                          )}
                          <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950/60 border border-rose-800/60 px-1.5 py-0.5 rounded">
                            {track.lang}
                          </span>
                        </div>
                      </button>
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

              {/* Demo Subtitles Options */}
              <div className="pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    ¿No tienes archivo? Prueba subtítulos de muestra
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="load-demo-es-btn"
                    onClick={() => handleLoadDemo('es')}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Muestra Español</span>
                    <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded">ES</span>
                  </button>
                  <button
                    id="load-demo-en-btn"
                    onClick={() => handleLoadDemo('en')}
                    className="py-2.5 px-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors text-left flex items-center justify-between cursor-pointer"
                  >
                    <span>Sample English</span>
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
                        : 'text-lg sm:text-xl'
                    } ${
                      config.textColor === 'yellow' ? 'text-yellow-300' : 'text-white'
                    } ${
                      config.backgroundStyle === 'solid'
                        ? 'bg-black/90 px-4 py-1.5 rounded-lg border border-white/10 shadow-lg'
                        : config.backgroundStyle === 'translucent'
                        ? 'bg-black/40 backdrop-blur-sm px-4 py-1 rounded-lg shadow-md'
                        : 'drop-shadow-[0_2px_4px_rgba(0,0,0,1)] font-semibold'
                    }`}
                  >
                    Este es un ejemplo de subtítulo en CineStream
                  </div>
                </div>
              </div>

              {/* Font Size Selector */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Tamaño de Texto
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'sm', label: 'Pequeño' },
                    { id: 'base', label: 'Normal' },
                    { id: 'lg', label: 'Grande' },
                    { id: 'xl', label: 'X-Grande' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => onConfigChange({ ...config, fontSize: sz.id as any })}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
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

              {/* Background Style */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                  Fondo del Subtítulo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'solid', label: 'Fondo Negro' },
                    { id: 'translucent', label: 'Translúcido' },
                    { id: 'shadow', label: 'Sin Fondo (Sombra)' },
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
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onConfigChange({ ...config, textColor: 'white' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      config.textColor === 'white'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white border border-zinc-400" />
                    <span>Blanco Clásico</span>
                  </button>
                  <button
                    onClick={() => onConfigChange({ ...config, textColor: 'yellow' })}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      config.textColor === 'yellow'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                        : 'bg-zinc-800/80 text-zinc-300 border-zinc-700 hover:bg-zinc-750'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-300 border border-yellow-500" />
                    <span>Amarillo Cine</span>
                  </button>
                </div>
              </div>
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
