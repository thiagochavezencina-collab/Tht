import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'floating' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed and running in standalone mode, do not render
  if (isInstalled) {
    return null;
  }

  // Desktop / Android / Chromium flow with native beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-md shadow-rose-950/40 border border-rose-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${className}`}
        title="Instalar CineStream en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-bounce shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">Instalar App</span>
        <span className="sm:hidden text-xs">App</span>
      </button>
    );
  }

  // iOS Safari flow (Apple requires user to tap Share -> Add to Home Screen)
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 transition-colors shadow-sm cursor-pointer shrink-0 ${className}`}
          title="Instalar en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">Instalar en iOS</span>
          <span className="sm:hidden text-xs">iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100 relative">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Instalar CineStream en iPhone / iPad</h3>
                  <p className="text-xs text-zinc-400">Funciona como una app nativa en tu pantalla</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-zinc-300 bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center">
                    1
                  </span>
                  <span>Toca el botón <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba) en la barra inferior de Safari.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center">
                    2
                  </span>
                  <span>Desliza hacia abajo y selecciona <strong>"Agregar a pantalla de inicio"</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center">
                    3
                  </span>
                  <span>Toca <strong>"Agregar"</strong> arriba a la derecha. ¡Listo!</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback if not standalone: show subtle manual install hint if desired or return null
  return null;
};
