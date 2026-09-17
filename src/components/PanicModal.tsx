import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldAlert,
  GraduationCap,
  ExternalLink,
  Keyboard,
  EyeOff,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  Zap,
  Image as ImageIcon,
  Upload,
  Check,
} from 'lucide-react';
import { CUSTOM_DISGUISE_IMAGE_KEY } from './disguise/ScreenshotOverlayView';

export interface PanicConfig {
  destination: 'aleks' | 'pearson' | 'beeverso' | 'classroom' | 'custom';
  customUrl: string;
  action: 'disguise' | 'redirect';
  disguiseType?: 'interactive' | 'screenshot_overlay';
  blurTrigger: boolean; // trigger on window blur
  hotkey: 'double_esc' | 'tilde' | 'f2';
  stealthMode: boolean; // Disfraz continuo en toda la interfaz
}

export const DEFAULT_PANIC_CONFIG: PanicConfig = {
  destination: 'aleks',
  customUrl: '',
  action: 'disguise',
  disguiseType: 'interactive',
  blurTrigger: false,
  hotkey: 'double_esc',
  stealthMode: false,
};

export const PANIC_DESTINATIONS = [
  {
    id: 'aleks',
    name: 'ALEKS® (McGraw Hill)',
    url: 'https://www.aleks.com',
    desc: 'Continuar mi ruta, gráfico circular ALEKS y QuickTables de matemáticas',
    iconText: 'AK',
    color: 'from-amber-600 to-blue-900',
  },
  {
    id: 'pearson',
    name: 'Pearson English Portal',
    url: 'https://english-dashboard.pearson.com',
    desc: 'MyEnglishLab: ejercicios de listening, gramática B2 y vocabulario en inglés',
    iconText: 'PE',
    color: 'from-sky-700 to-cyan-600',
  },
  {
    id: 'beeverso',
    name: 'Beereaders (Lectura)',
    url: 'https://app.beereaders.com',
    desc: 'Comprensión lectora, nivel Lexile, textos literarios y Beecoins',
    iconText: 'BR',
    color: 'from-purple-800 to-amber-500',
  },
  {
    id: 'classroom',
    name: 'Google Classroom',
    url: 'https://classroom.google.com',
    desc: 'Clases y tareas de Google Workspace escolar',
    iconText: 'GC',
    color: 'from-green-600 to-emerald-700',
  },
];

interface PanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PanicConfig;
  onSaveConfig: (newConfig: PanicConfig) => void;
  onTriggerPanic: () => void;
}

export const PanicModal: React.FC<PanicModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTriggerPanic,
}) => {
  const [localConfig, setLocalConfig] = useState<PanicConfig>(config);
  const [copiedNotification, setCopiedNotification] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  // Lock background scroll on iOS
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in ios-scrollable"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="min-h-full w-full flex items-start sm:items-center justify-center p-2 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black my-2 sm:my-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 hover:bg-rose-600 text-zinc-400 hover:text-white transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-amber-950/40">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white font-['Outfit'] flex items-center gap-2">
                Modo Discreto / Escape Rápido
              </h2>
              <p className="text-xs text-zinc-400">
                Cierra la app y cambia al instante a tus plataformas de estudio
              </p>
            </div>
          </div>

          {/* Technical LanSchool Notice */}
          <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5 text-xs text-amber-200/90 leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-300 block mb-0.5">
                Aviso sobre LanSchool Air:
              </span>
              Por seguridad del navegador, ninguna página web tiene permisos para escanear programas externos o saber cuándo un profesor inicia sesión en LanSchool Air. Con esta función puedes activar el cambio instantáneo con un solo toque o tecla rápida.
            </div>
          </div>

          {/* Destination Selector */}
          <div className="space-y-3 mb-5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              1. Elige la plataforma a la que cambiar:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PANIC_DESTINATIONS.map((dest) => {
                const isSelected = localConfig.destination === dest.id;
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => setLocalConfig({ ...localConfig, destination: dest.id as any })}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-zinc-800/90 border-amber-500 shadow-md shadow-amber-950/30 text-white'
                        : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${dest.color} flex items-center justify-center font-bold text-white text-xs shrink-0 mt-0.5`}
                    >
                      {dest.iconText}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">{dest.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5 block">
                        {dest.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom URL Option */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="radio"
                  name="panic_dest"
                  checked={localConfig.destination === 'custom'}
                  onChange={() => setLocalConfig({ ...localConfig, destination: 'custom' })}
                  className="accent-amber-500"
                />
                <span className="text-xs text-zinc-300 font-medium">
                  Usar otro enlace personalizado (ej. el portal exacto de tu escuela)
                </span>
              </label>
              {localConfig.destination === 'custom' && (
                <input
                  type="url"
                  value={localConfig.customUrl}
                  onChange={(e) => setLocalConfig({ ...localConfig, customUrl: e.target.value })}
                  placeholder="https://micolegio.edu..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              )}
            </div>
          </div>

          {/* Action Mode */}
          <div className="space-y-2 mb-5">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              2. Tipo de Escape:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, action: 'disguise' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  localConfig.action === 'disguise'
                    ? 'bg-zinc-800 border-amber-500 text-white'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 font-bold text-xs text-white">
                    <EyeOff className="w-4 h-4 text-amber-400" />
                    <span>Camuflaje 1:1 (Recomendado)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    Móvil y PC
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Activa la pantalla idéntica de ALEKS, Pearson o Google Classroom con ejercicios reales o imagen sobrepuesta.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setLocalConfig({ ...localConfig, action: 'redirect' })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  localConfig.action === 'redirect'
                    ? 'bg-zinc-800 border-amber-500 text-white'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-white mb-1">
                  <ExternalLink className="w-4 h-4 text-amber-400" />
                  <span>Redirección a Web Oficial</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Navega fuera al sitio web real. (Nota: en celulares o iframes puede salir en blanco por seguridad de la escuela).
                </p>
              </button>
            </div>

            {/* Sub-selector for Disguise Type: Interactive Simulation vs Screenshot Overlay */}
            {localConfig.action === 'disguise' && (
              <div className="mt-3 p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
                <label className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                  Estilo de Camuflaje Escolar:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLocalConfig({ ...localConfig, disguiseType: 'interactive' })}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      (localConfig.disguiseType || 'interactive') === 'interactive'
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200 font-semibold'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Simulación Interactiva</span>
                      {(localConfig.disguiseType || 'interactive') === 'interactive' && (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                      Botones, ejercicios matemáticos y formularios 100% navegables
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLocalConfig({ ...localConfig, disguiseType: 'screenshot_overlay' })}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      localConfig.disguiseType === 'screenshot_overlay'
                        ? 'bg-amber-950/40 border-amber-500 text-amber-200 font-semibold'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Imagen Sobrepuesta (Captura)</span>
                      {localConfig.disguiseType === 'screenshot_overlay' && (
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">
                      Captura fija ultra realista con reloj en vivo o foto subida por ti
                    </span>
                  </button>
                </div>

                {/* Optional Custom Screenshot Uploader */}
                <div className="pt-2 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-zinc-300">
                    ¿Quieres usar una foto de tu propia pantalla o tarea escolar?
                  </span>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold border border-zinc-700 transition-colors shrink-0">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Subir captura (.png, .jpg)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const base64 = event.target?.result as string;
                          if (base64) {
                            try {
                              localStorage.setItem(CUSTOM_DISGUISE_IMAGE_KEY, base64);
                              setLocalConfig({ ...localConfig, disguiseType: 'screenshot_overlay' });
                            } catch {}
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Permanent Stealth Skin Mode */}
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/40">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Modo Camuflaje Continuo (Skin Escolar)
                  </span>
                  <span className="text-[10px] text-zinc-400 block">
                    Cambia el título de la pestaña, el icono (favicon) y el logo de la app por ALEKS, Pearson o Beeverso.
                  </span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={localConfig.stealthMode}
                  onChange={(e) => setLocalConfig({ ...localConfig, stealthMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Triggers Configuration */}
          <div className="space-y-3 mb-6 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              3. ¿Cómo activar el Escape Rápido?
            </label>

            {/* Hotkey selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-zinc-400" />
                Tecla rápida de pánico:
              </span>
              <select
                value={localConfig.hotkey}
                onChange={(e) => setLocalConfig({ ...localConfig, hotkey: e.target.value as any })}
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                <option value="double_esc">Presionar Esc dos veces seguidas</option>
                <option value="tilde">Presionar tecla tilde (~)</option>
                <option value="f2">Presionar tecla F2</option>
              </select>
            </div>

            {/* Window blur auto-trigger */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-zinc-200 block">
                  Activar al cambiar de ventana o pestaña
                </span>
                <span className="text-[10px] text-zinc-400">
                  Si cambias de programa o minimizas, se activa el escape automáticamente.
                </span>
              </div>
              <input
                type="checkbox"
                checked={localConfig.blurTrigger}
                onChange={(e) => setLocalConfig({ ...localConfig, blurTrigger: e.target.checked })}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onTriggerPanic}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2"
              title="Probar activación ahora"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Probar Escape Ahora</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs sm:text-sm shadow-lg shadow-amber-950/40 transition-all active:scale-95"
              >
                Guardar Ajustes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
