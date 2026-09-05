import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showBackOnlineNotice, setShowBackOnlineNotice] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnlineNotice(true);
      const timer = setTimeout(() => {
        setShowBackOnlineNotice(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnlineNotice(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (showBackOnlineNotice) {
    return (
      <div
        id="online-status-banner"
        className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-emerald-600/95 text-white px-3.5 py-2 text-xs font-semibold shadow-2xl backdrop-blur-md border border-emerald-400/40 animate-fade-in"
      >
        <Wifi className="w-4 h-4 text-emerald-200" />
        <span>Conexión restaurada. Sincronizando catálogo...</span>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div
      id="offline-status-banner"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-zinc-900/95 text-zinc-200 px-4 py-2.5 text-xs font-medium shadow-2xl backdrop-blur-md border border-zinc-700 animate-fade-in"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
      </span>
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <div>
        <span className="font-semibold text-white">Modo sin conexión: </span>
        <span className="text-zinc-300">Navegando recursos y películas locales en caché.</span>
      </div>
    </div>
  );
};
