import React, { useState } from 'react';
import {
  Film,
  Search,
  Bookmark,
  PlusCircle,
  X,
  Clapperboard,
  Tv,
  Download,
  CheckCircle2,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { downloadProjectZip } from '../utils/exportProject';
import { PWAInstallButton } from './PWAInstallButton';
import { PanicConfig, PANIC_DESTINATIONS } from './PanicModal';

interface NavbarProps {
  activeTab: 'inicio' | 'peliculas' | 'series' | 'mi-lista' | 'historial';
  setActiveTab: (tab: 'inicio' | 'peliculas' | 'series' | 'mi-lista' | 'historial') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  watchlistCount: number;
  onOpenAddMovie: () => void;
  cloudMoviesCount?: number;
  onSyncCloud?: () => void;
  onOpenPanicModal?: () => void;
  stealthConfig?: PanicConfig;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  watchlistCount,
  onOpenAddMovie,
  cloudMoviesCount = 0,
  onSyncCloud,
  onOpenPanicModal,
  stealthConfig,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const isStealth = stealthConfig?.stealthMode;
  const currentTarget =
    PANIC_DESTINATIONS.find((d) => d.id === stealthConfig?.destination) || PANIC_DESTINATIONS[0];

  const handleDownloadZip = async () => {
    if (isDownloading) return;
    try {
      setIsDownloading(true);
      await downloadProjectZip();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error downloading zip:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-40 w-full max-w-full overflow-hidden bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 transition-colors"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          <button
            onClick={() => {
              setActiveTab('inicio');
              setSearchQuery('');
            }}
            className="flex items-center gap-2 sm:gap-2.5 text-left group focus:outline-none"
            aria-label="Ir al inicio"
          >
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr ${
                isStealth ? currentTarget.color : 'from-rose-600 to-amber-500'
              } flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform shrink-0`}
            >
              {isStealth ? (
                <span className="text-white font-black text-xs sm:text-sm">{currentTarget.iconText}</span>
              ) : (
                <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </div>
            <div>
              <span className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-1 font-['Outfit']">
                {isStealth ? (
                  <span>{currentTarget.name.split(' ')[0]}</span>
                ) : (
                  <>
                    Cine<span className="text-rose-500">Stream</span>
                  </>
                )}
              </span>
              <span className="text-[9px] sm:text-[10px] hidden xs:block text-zinc-400 font-medium tracking-wide uppercase">
                {isStealth ? 'Portal Estudiantil' : 'Películas & Series'}
              </span>
            </div>
          </button>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('inicio')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'inicio' && !searchQuery
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              {isStealth ? 'Panel' : 'Inicio'}
            </button>
            <button
              onClick={() => setActiveTab('peliculas')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'peliculas'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-rose-500" />
              <span>{isStealth ? 'Clases' : 'Películas'}</span>
            </button>
            <button
              onClick={() => setActiveTab('series')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'series'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <Tv className="w-3.5 h-3.5 text-rose-500" />
              <span>{isStealth ? 'Cursos' : 'Series'}</span>
            </button>
            <button
              onClick={() => setActiveTab('mi-lista')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'mi-lista'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isStealth ? 'Tareas' : 'Mi Lista'}</span>
              {watchlistCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[11px] bg-rose-600/90 text-white font-bold rounded-full">
                  {watchlistCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'historial'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              <Clapperboard className="w-3.5 h-3.5" />
              <span>Continuar</span>
            </button>
          </nav>
        </div>

        {/* Right Section: Search, Download ZIP for Vercel, Add Content */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 max-w-[65%] sm:max-w-none">
          {/* Search Bar */}
          <div className="relative flex items-center shrink-0">
            <div
              className={`flex items-center rounded-xl bg-zinc-900 border border-zinc-800 px-2 sm:px-3 py-1.5 transition-all duration-200 ${
                isSearchOpen || searchQuery
                  ? 'w-28 sm:w-56 border-rose-500/60 ring-1 ring-rose-500/30'
                  : 'w-8 sm:w-44 bg-zinc-900/60 justify-center sm:justify-start'
              }`}
            >
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => !searchQuery && setIsSearchOpen(false)}
                placeholder="Buscar..."
                className={`bg-transparent border-none text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none ml-1.5 ${
                  isSearchOpen || searchQuery ? 'w-full block' : 'hidden sm:block sm:w-full'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-500 hover:text-zinc-200 transition-colors p-0.5"
                  title="Borrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Cloud Sync Status Badge */}
          <button
            onClick={onSyncCloud}
            className="flex items-center gap-1 px-2 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-medium transition-colors active:scale-95 shrink-0"
            title="Sincronización en la nube (Firestore): Haz clic para sincronizar tus películas"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse" />
            <span className="hidden lg:inline text-zinc-300">Nube</span>
            {cloudMoviesCount > 0 && (
              <span className="px-1 py-0.2 rounded-md bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 font-bold text-[10px]">
                {cloudMoviesCount}
              </span>
            )}
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* DOWNLOAD FOR VERCEL BUTTON */}
          <button
            onClick={handleDownloadZip}
            disabled={isDownloading}
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all active:scale-95 shrink-0 ${
              downloadSuccess
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700 shadow-sm'
            }`}
            title="Descargar código completo en archivo .ZIP listo para desplegar en Vercel"
          >
            {isDownloading ? (
              <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-rose-400 shrink-0" />
            ) : downloadSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0" />
            ) : (
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
            )}
            <span className="hidden md:inline">
              {isDownloading
                ? 'Empaquetando...'
                : downloadSuccess
                ? '¡ZIP Listo!'
                : 'ZIP Vercel'}
            </span>
            <span className="md:hidden text-[11px] font-bold">ZIP</span>
          </button>

          {/* Discreet Panic / Camouflage Button (ALEKS, Pearson, Beeverso) */}
          {onOpenPanicModal && (
            <button
              onClick={onOpenPanicModal}
              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-amber-950/40 text-zinc-400 hover:text-amber-400 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold transition-all shrink-0"
              title="Ajustes de Escape Rápido (ALEKS, Pearson, Beeverso) • Doble Esc"
            >
              <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
              <span className="hidden lg:inline text-[11px]">Escape</span>
            </button>
          )}

          {/* Subir Contenido (Peli / Serie) */}
          <button
            onClick={onOpenAddMovie}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-950/40 transition-all active:scale-95 shrink-0"
            title="Subir nueva película o serie con episodios"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden md:inline">Subir</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation bar bottom */}
      <div className="flex md:hidden border-t border-zinc-800/80 bg-zinc-950 px-2 py-1.5 justify-around text-xs">
        <button
          onClick={() => setActiveTab('inicio')}
          className={`px-2.5 py-1 rounded-md ${
            activeTab === 'inicio' ? 'text-rose-500 font-semibold' : 'text-zinc-400'
          }`}
        >
          {isStealth ? 'Panel' : 'Inicio'}
        </button>
        <button
          onClick={() => setActiveTab('peliculas')}
          className={`px-2.5 py-1 rounded-md ${
            activeTab === 'peliculas' ? 'text-rose-500 font-semibold' : 'text-zinc-400'
          }`}
        >
          {isStealth ? 'Clases' : 'Películas'}
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`px-2.5 py-1 rounded-md ${
            activeTab === 'series' ? 'text-rose-500 font-semibold' : 'text-zinc-400'
          }`}
        >
          {isStealth ? 'Cursos' : 'Series'}
        </button>
        <button
          onClick={() => setActiveTab('mi-lista')}
          className={`px-2.5 py-1 rounded-md flex items-center gap-1 ${
            activeTab === 'mi-lista' ? 'text-rose-500 font-semibold' : 'text-zinc-400'
          }`}
        >
          <span>{isStealth ? 'Tareas' : 'Mi Lista'}</span>
          {watchlistCount > 0 && (
            <span className="px-1 text-[10px] bg-rose-600 text-white rounded-full">
              {watchlistCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('historial')}
          className={`px-2.5 py-1 rounded-md ${
            activeTab === 'historial' ? 'text-rose-500 font-semibold' : 'text-zinc-400'
          }`}
        >
          Historial
        </button>
      </div>
    </header>
  );
};
