import React, { useState, useEffect } from 'react';
import { PanicConfig } from './PanicModal';
import { AleksView } from './disguise/AleksView';
import { PearsonView } from './disguise/PearsonView';
import { BeeversoView } from './disguise/BeeversoView';
import { applyStealthMeta } from '../utils/stealthHelper';
import { X, Layers, LogOut, Check } from 'lucide-react';

interface DisguiseScreenProps {
  config: PanicConfig;
  onExitDisguise: () => void;
}

export const DisguiseScreen: React.FC<DisguiseScreenProps> = ({ config, onExitDisguise }) => {
  const initialPlatform =
    config.destination === 'pearson'
      ? 'pearson'
      : config.destination === 'beeverso'
      ? 'beeverso'
      : 'aleks';

  const [currentPlatform, setCurrentPlatform] = useState<'aleks' | 'pearson' | 'beeverso'>(initialPlatform);
  const [showSafariTabs, setShowSafariTabs] = useState(false);

  // Synchronize dynamic title and favicon for stealth
  useEffect(() => {
    applyStealthMeta(true, currentPlatform);

    return () => {
      applyStealthMeta(config.stealthMode, config.destination);
    };
  }, [currentPlatform, config.stealthMode, config.destination]);

  // Global key listener to restore with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExitDisguise();
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
      {/* Active Platform View */}
      {currentPlatform === 'pearson' ? (
        <PearsonView
          onExit={onExitDisguise}
          onOpenTabSwitcher={() => setShowSafariTabs(true)}
        />
      ) : currentPlatform === 'beeverso' ? (
        <BeeversoView
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
            className="bg-[#242426] text-white rounded-t-3xl max-w-lg mx-auto w-full p-5 space-y-4 shadow-2xl border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-300" />
                <span className="font-bold text-sm text-slate-200">Pestañas de Safari</span>
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
                  setShowSafariTabs(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all text-left ${
                  currentPlatform === 'aleks'
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
                {currentPlatform === 'aleks' && <Check className="w-5 h-5 text-teal-300" />}
              </button>

              {/* Tab 2: Pearson */}
              <button
                onClick={() => {
                  setCurrentPlatform('pearson');
                  setShowSafariTabs(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all text-left ${
                  currentPlatform === 'pearson'
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
                {currentPlatform === 'pearson' && <Check className="w-5 h-5 text-cyan-300" />}
              </button>

              {/* Tab 3: Beeverso */}
              <button
                onClick={() => {
                  setCurrentPlatform('beeverso');
                  setShowSafariTabs(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all text-left ${
                  currentPlatform === 'beeverso'
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
                {currentPlatform === 'beeverso' && <Check className="w-5 h-5 text-purple-300" />}
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
                O presiona la tecla Esc en tu teclado físico
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
