import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Prevent uncaught DOMException AbortError from bubbling up (e.g. video.play interrupted by pause, aborted media requests, or iframe service worker aborts)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason);
    const name = event.reason?.name || '';
    if (
      name === 'AbortError' ||
      msg.includes('aborted') ||
      msg.includes('interrupted by a call to pause') ||
      msg.includes('The operation was aborted')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('aborted') || msg.includes('interrupted by a call to pause')) {
      event.preventDefault();
      event.stopImmediatePropagation?.();
    }
  });

  // Safely register PWA Service Worker with error suppression for iframe previews
  if ('serviceWorker' in navigator) {
    try {
      registerSW({
        immediate: true,
        onRegisterError(error) {
          console.warn('[PWA] Service worker registration notice:', error);
        },
      });
    } catch (e) {
      console.warn('[PWA] Registration not supported in current frame:', e);
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
