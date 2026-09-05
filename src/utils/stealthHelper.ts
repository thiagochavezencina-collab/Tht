/**
 * Utility for managing stealth educational camouflage (title, favicon, and meta tags)
 */

const PLATFORM_TITLES: Record<string, string> = {
  aleks: 'ALEKS - Módulo de Evaluación Continua | McGraw Hill',
  pearson: 'Pearson MyLab - Student Learning Portal',
  beeverso: 'Beereaders - Biblioteca Digital y Comprensión',
  classroom: 'Google Classroom - Tareas y Recursos',
  custom: 'Portal de Aprendizaje Digital Institucional',
};

// Generates data URL SVG favicons for realistic disguise
const getFaviconSvgDataUri = (platform: string): string => {
  let svg = '';
  if (platform === 'aleks') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#d97706"/><path d="M32 14 L46 48 L38 48 L34 38 L30 38 L26 48 L18 48 Z M32 23 L28 32 L36 32 Z" fill="#ffffff"/></svg>`;
  } else if (platform === 'pearson') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0284c7"/><path d="M22 16 L36 16 C43 16 47 20 47 26 C47 32 43 36 36 36 L30 36 L30 48 L22 48 Z M30 23 L30 29 L35 29 C38 29 40 28 40 26 C40 24 38 23 35 23 Z" fill="#ffffff"/></svg>`;
  } else if (platform === 'beeverso') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#059669"/><path d="M20 18 L30 18 C36 18 40 21 40 25 C40 28 38 30 34 31 C39 32 42 35 42 39 C42 44 37 47 30 47 L20 47 Z M28 24 L28 29 L30 29 C33 29 34 28 34 26 C34 25 33 24 30 24 Z M28 35 L28 41 L31 41 C34 41 35 40 35 38 C35 36 34 35 31 35 Z" fill="#ffffff"/></svg>`;
  } else {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#16a34a"/><rect x="18" y="22" width="28" height="20" rx="4" fill="#ffffff"/><circle cx="32" cy="32" r="4" fill="#16a34a"/></svg>`;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const applyStealthMeta = (enabled: boolean, platform: string = 'aleks') => {
  const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;

  if (enabled) {
    document.title = PLATFORM_TITLES[platform] || 'Plataforma de Aprendizaje en Línea';
    if (faviconLink) {
      faviconLink.href = getFaviconSvgDataUri(platform);
    }
  } else {
    document.title = 'CineStream - Ver Películas Online';
    if (faviconLink) {
      faviconLink.href = '/icon.svg';
    }
  }
};
