import React, { useState, useEffect, useRef } from 'react';
import { PanicConfig } from './PanicModal';
import { AleksView } from './disguise/AleksView';
import { PearsonView } from './disguise/PearsonView';
import { BeeversoView } from './disguise/BeeversoView';
import { ClassroomView } from './disguise/ClassroomView';
import { DisguiseLoginView } from './disguise/DisguiseLoginView';
import { ScreenshotOverlayView } from './disguise/ScreenshotOverlayView';
import { applyStealthMeta } from '../utils/stealthHelper';
import { APP_PIN_STORAGE_KEY, DEFAULT_APP_PIN } from './PinLockScreen';
import { X, Layers, LogOut, Check, KeyRound, ImageIcon } from 'lucide-react';

interface DisguiseScreenProps {
  config: PanicConfig;
  onExitDisguise: (unlocked?: boolean) => void;
}

export const DisguiseScreen: React.FC<DisguiseScreenProps> = ({ config, onExitDisguise }) => {
  const initialPlatform =
    config.destination === 'pearson'
      ? 'pearson'
      : config.destination === 'beeverso'
      ? 'beeverso'
      : config.destination === 'classroom'
      ? 'classroom'
      : 'aleks';

  const [currentPlatform, setCurrentPlatform] = useState<'aleks' | 'pearson' | 'beeverso' | 'classroom'>(
    initialPlatform
  );
  const [viewMode, setViewMode] = useState<'study' | 'login' | 'overlay'>(
    config.disguiseType === 'screenshot_overlay' ? 'overlay' : 'study'
  );
  const [showSafariTabs, setShowSafariTabs] = useState(false);
  const keySequenceRef = useRef<string>('');

  // Synchronize dynamic title and favicon for stealth
  useEffect(() => {
    applyStealthMeta(true, currentPlatform);

    return () => {
      applyStealthMeta(config.stealthMode, config.destination);
    };
  }, [currentPlatform, config.stealthMode, config.destination]);

  // Global key listener to restore with Escape or typing PIN 6767
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExitDisguise(false);
        return;
      }
      if (e.key.length === 1 && /\d/.test(e.key)) {
        keySequenceRef.current = (keySequenceRef.current + e.key).slice(-4);
        let validPin = DEFAULT_APP_PIN;
        try {
          validPin = localStorage.getItem(APP_PIN_STORAGE_KEY) || DEFAULT_APP_PIN;
        } catch {}
        if (keySequenceRef.current === validPin || keySequenceRef.current === '6767') {
          onExitDisguise(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExitDisguise]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-[#edf0f5] overflow-y-auto select-none antialiased"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Active Platform View: Screenshot Overlay vs Login Cover vs Interactive Study Dashboard */}
      {viewMode === 'overlay' ? (
        <ScreenshotOverlayView
          platform={currentPlatform}
          onExit={onExitDisguise}
          onSwitchToInteractive={() => setViewMode('study')}
          onOpenTabSwitcher={() => setShowSafariTabs(true)}
        />
      ) : viewMode === 'login' ? (
        <DisguiseLoginView
          platform={currentPlatform === 'classroom' ? 'aleks' : currentPlatform}
          onExitDisguise={onExitDisguise}
          onSwitchToStudyView={() => setViewMode('study')}
          onOpenTabSwitcher={() => setShowSafariTabs(true)}
        />
      ) : currentPlatform === 'pearson' ? (
        <PearsonView
          onExit={onExitDisguise}
          onOpenTabSwitcher={() => setShowSafariTabs(true)}
        />
      ) : currentPlatform === 'beeverso' ? (
        <BeeversoView
          onExit={onExitDisguise}
          onOpenTabSwitcher={() => setShowSafariTabs(true)}
        />
      ) : currentPlatform === 'classroom' ? (
        <ClassroomView
          onExit={onExitDisguise}
          onOpenTabSwitcher={() => setShowSafariTabs(true)}
        />
      ) : (
        <AleksView
          onExit={onExitDisguise}
          onOpenTabSwitcher={() => setShowSafariTabs(true)}
        />
      )}

      {/* Authentic Safari Multi-Tab Switcher Sheet (Appears when tapping tabs icon in Safari bar) */}
      {showSafariTabs && (
        <div
          className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md flex flex-col justify-end animate-fade-in"
          onClick={() => setShowSafariTabs(false)}
        >
          <div
            className="bg-[#242426] text-white rounded-t-3xl max-w-lg mx-auto w-full p-5 space-y-4 shadow-2xl border-t border-white/10 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-300" />
                <span className="font-bold text-sm text-slate-200">Pestañas y Modos de Safari</span>
              </div>
              <button
                onClick={() => setShowSafariTabs(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Cards */}
            <div className="space-y-2.5">
              {/* Tab 1: ALEKS */}
              <button
                onClick={() => {
                  setCurrentPlatform('aleks');
                  if (viewMode === 'login') setViewMode('study');
                  setShowSafariTabs(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all text-left ${
                  currentPlatform === 'aleks' && viewMode === 'study'
                    ? 'bg-[#005a66] text-white ring-2 ring-teal-400 font-bold'
                    : 'bg-[#323236] text-slate-200 hover:bg-[#3d3d42]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black">ALEKS®</span>
                    <span className="text-xs text-teal-200">9no Grado 2026 - B</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">am-awy.aleks.com</span>
                </div>
                {currentPlatform === 'aleks' && viewMode === 'study' && <Check className="w-5 h-5 text-teal-300" />}
              </button>

              {/* Tab 2: Pearson */}
              <button
                onClick={() => {
                  setCurrentPlatform('pearson');
                  if (viewMode === 'login') setViewMode('study');
                  setShowSafariTabs(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all text-left ${
                  currentPlatform === 'pearson' && viewMode === 'study'
                    ? 'bg-[#002f5e] text-white ring-2 ring-cyan-400 font-bold'
                    : 'bg-[#323236] text-slate-200 hover:bg-[#3d3d42]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black">))Pearson</span>
                    <span className="text-xs text-cyan-200">INNOVA Schools - PERU</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">english-dashboard.pearson.com</span>
                </div>
                {currentPlatform === 'pearson' && viewMode === 'study' && <Check className="w-5 h-5 text-cyan-300" />}
              </button>

              {/* Tab 3: Google Classroom */}
              <button
                onClick={() => {
                  setCurrentPlatform('classroom');
                  if (viewMode === 'login') setViewMode('study');
                  setShowSafariTabs(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all text-left ${
                  currentPlatform === 'classroom' && viewMode === 'study'
                    ? 'bg-[#137333] text-white ring-2 ring-emerald-400 font-bold'
                    : 'bg-[#323236] text-slate-200 hover:bg-[#3d3d42]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-emerald-300">Google Classroom</span>
                    <span className="text-xs text-emerald-100">Matemáticas 9° - B</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">classroom.google.com</span>
                </div>
                {currentPlatform === 'classroom' && viewMode === 'study' && <Check className="w-5 h-5 text-emerald-300" />}
              </button>

              {/* Tab 4: Beeverso */}
              <button
                onClick={() => {
                  setCurrentPlatform('beeverso');
                  if (viewMode === 'login') setViewMode('study');
                  setShowSafariTabs(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all text-left ${
                  currentPlatform === 'beeverso' && viewMode === 'study'
                    ? 'bg-[#5b21b6] text-white ring-2 ring-purple-400 font-bold'
                    : 'bg-[#323236] text-slate-200 hover:bg-[#3d3d42]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-amber-400">bee<span className="text-white">verso</span></span>
                    <span className="text-xs text-purple-200">Lectura escolar</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">student.beeverso.org</span>
                </div>
                {currentPlatform === 'beeverso' && viewMode === 'study' && <Check className="w-5 h-5 text-purple-300" />}
              </button>

              {/* Mode Option: Imagen Sobrepuesta (Captura de pantalla hiperrealista) */}
              <button
                onClick={() => {
                  setViewMode(viewMode === 'overlay' ? 'study' : 'overlay');
                  setShowSafariTabs(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all text-left ${
                  viewMode === 'overlay'
                    ? 'bg-amber-950/70 border-2 border-amber-500 text-amber-200 font-bold'
                    : 'bg-[#323236] text-slate-200 hover:bg-[#3d3d42]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold">
                      {viewMode === 'overlay' ? '✓ Modo Imagen Sobrepuesta (Captura Activa)' : 'Activar Modo Imagen Sobrepuesta'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Muestra una captura escolar estática o foto real subida por ti con reloj sincronizado
                  </span>
                </div>
                {viewMode === 'overlay' && <Check className="w-5 h-5 text-amber-400" />}
              </button>

              {/* Mode Option: Cover Login vs Study View */}
              <button
                onClick={() => {
                  setViewMode(viewMode === 'login' ? 'study' : 'login');
                  setShowSafariTabs(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all text-left ${
                  viewMode === 'login'
                    ? 'bg-sky-950/70 border-2 border-sky-400 text-sky-200 font-bold'
                    : 'bg-[#323236] text-slate-200 hover:bg-[#3d3d42]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-sky-400" />
                    <span className="text-sm font-bold">
                      {viewMode === 'login' ? '✓ Pantalla de Login Escolar Activa' : 'Cambiar a Pantalla de Login Escolar'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Muestra una pantalla de inicio de sesión institucional donde el PIN 6767 desbloquea la app
                  </span>
                </div>
                {viewMode === 'login' && <Check className="w-5 h-5 text-sky-300" />}
              </button>
            </div>

            {/* Exit to CineStream option */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={onExitDisguise}
                className="w-full py-3 bg-rose-600/90 hover:bg-rose-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar pestaña / Volver a CineStream</span>
              </button>
              <span className="block text-center text-[10px] text-slate-400 mt-2">
                O escribe <strong className="text-white">6767</strong> o presiona <strong className="text-white">Esc</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
