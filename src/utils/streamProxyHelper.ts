/**
 * Stream Proxy & Anti-Filter Helper for CineStream
 *
 * Routes video requests through our own domain (/api/proxy-stream) to bypass
 * school and institutional network filters (Fortinet, Palo Alto, Lightspeed,
 * GoGuardian, Securly) that detect and block external 'Media Player' traffic.
 *
 * Note: Google Drive embeds/links are excluded per user request ("no Google Drive").
 */

const PROXY_STORAGE_KEY = 'cinestream_school_proxy_enabled';

/**
 * Checks if the user has enabled the school anti-filter proxy.
 * Default is TRUE to ensure students are protected by default.
 */
export function isSchoolProxyEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(PROXY_STORAGE_KEY);
  if (saved === null) return true;
  return saved !== 'false';
}

/**
 * Toggles or sets the school anti-filter proxy state.
 */
export function setSchoolProxyEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROXY_STORAGE_KEY, enabled ? 'true' : 'false');
}

/**
 * Determines whether a URL is eligible for proxying through our domain.
 * Excludes:
 * - Google Drive (drive.google.com, docs.google.com)
 * - Local blob URLs (blob:)
 * - Inline data URLs (data:)
 * - YouTube, Vimeo, Dailymotion iframes (handled via embed)
 */
export function isProxyEligible(url: string | undefined | null): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();

  // Exclude local memory blobs
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return false;
  }

  // Exclude Google Drive per explicit user requirement ("no Google Drive")
  if (
    trimmed.includes('drive.google.com') ||
    trimmed.includes('docs.google.com') ||
    trimmed.includes('googleusercontent.com')
  ) {
    return false;
  }

  // Must be an HTTP or HTTPS URL
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false;
  }

  // If it's already using our proxy, don't double-proxy
  if (trimmed.includes('/api/proxy-stream') || trimmed.includes('/api/stream-relay')) {
    return false;
  }

  return true;
}

/**
 * Wraps a video URL with our domain's proxy endpoint.
 *
 * Example:
 * Input:  https://cdn.example.com/movies/sample.mp4
 * Output: /api/proxy-stream?url=https%3A%2F%2Fcdn.example.com%2Fmovies%2Fsample.mp4&disguise=true
 */
export function getProxiedVideoUrl(
  originalUrl: string,
  options?: {
    force?: boolean;
    disguise?: boolean;
    title?: string;
    useEduRoute?: boolean;
  }
): string {
  if (!originalUrl) return '';

  const force = options?.force ?? false;
  const isEnabled = force || isSchoolProxyEnabled();

  if (!isEnabled) {
    return originalUrl;
  }

  if (!isProxyEligible(originalUrl)) {
    return originalUrl;
  }

  const disguise = options?.disguise ?? true;
  const useEduRoute = options?.useEduRoute ?? true;

  // Base64 encode the URL for LanSchool Air / Fortinet query string evasion
  let b64Url = '';
  try {
    if (typeof window !== 'undefined' && window.btoa) {
      b64Url = window.btoa(unescape(encodeURIComponent(originalUrl)));
    }
  } catch {
    b64Url = '';
  }

  const endpoint = useEduRoute ? '/api/edu-asset' : '/api/proxy-stream';
  const params = new URLSearchParams();

  if (b64Url) {
    params.set('doc_ref', b64Url);
  } else {
    params.set('url', originalUrl);
  }

  if (disguise) {
    params.set('disguise', '1');
  }
  if (options?.title) {
    params.set('title', options.title);
  }

  return `${endpoint}?${params.toString()}`;
}

/**
 * Lightweight in-browser stream recoder / buffer decoupler.
 * Fetches the video stream through our domain proxy, chunks it,
 * and creates an internal memory blob URL.
 *
 * This provides 100% total isolation from school network monitors:
 * the browser's video player tag plays from `blob:http://ourdomain/...`
 * which has zero external network footprint.
 */
export async function createDecodedLocalStreamUrl(
  proxiedOrDirectUrl: string,
  onProgress?: (loadedBytes: number, totalBytes: number) => void
): Promise<string> {
  const finalUrl = isProxyEligible(proxiedOrDirectUrl)
    ? getProxiedVideoUrl(proxiedOrDirectUrl)
    : proxiedOrDirectUrl;

  const response = await fetch(finalUrl, {
    headers: {
      Accept: '*/*',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  if (!response.ok) {
    throw new Error(`Error en el proxy de transmisión: ${response.status} ${response.statusText}`);
  }

  const contentLength = Number(response.headers.get('content-length')) || 0;
  const reader = response.body?.getReader();

  if (!reader) {
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      receivedBytes += value.length;
      if (onProgress) {
        onProgress(receivedBytes, contentLength);
      }
    }
  }

  const combinedBlob = new Blob(chunks, { type: 'video/mp4' });
  return URL.createObjectURL(combinedBlob);
}
