export type VideoSourceType =
  | 'youtube'
  | 'vimeo'
  | 'googledrive'
  | 'dailymotion'
  | 'archive'
  | 'okru'
  | 'streamtape'
  | 'doodstream'
  | 'voe'
  | 'meganz'
  | 'embed'
  | 'direct';

export interface ParsedVideoSource {
  type: VideoSourceType;
  embedUrl?: string;
  directUrl?: string;
  originalUrl: string;
}

/**
 * Intelligent parser for all video source formats:
 * - YouTube (standard, shorts, embed, youtu.be)
 * - Vimeo
 * - Google Drive (view -> preview)
 * - DailyMotion
 * - Internet Archive (archive.org)
 * - OK.ru
 * - Streamtape
 * - DoodStream
 * - Voe.sx
 * - Mega.nz
 * - Dropbox
 * - Generic embed iframes / web video players
 * - Direct MP4 / WebM / HLS / Blob videos
 */
export function parseVideoSource(rawUrl: string): ParsedVideoSource {
  if (!rawUrl) {
    return { type: 'direct', directUrl: '', originalUrl: '' };
  }

  const url = rawUrl.trim();

  // If user pasted an iframe tag like <iframe src="...">
  const iframeMatch = url.match(/src=["']([^"']+)["']/i);
  const targetUrl = iframeMatch ? iframeMatch[1] : url;

  // Google Drive (supports:
  // - drive.google.com/file/d/{id}/...
  // - drive.google.com/file/u/{n}/d/{id}/...
  // - drive.google.com/open?id={id}
  // - drive.google.com/uc?id={id}
  // - docs.google.com/file/d/{id}/...
  const gdriveMatch = targetUrl.match(
    /(?:drive|docs)\.google\.com\/(?:file\/(?:u\/\d+\/)?d\/|open\?(?:.*&)?id=|uc\?(?:.*&)?id=)([a-zA-Z0-9_-]{15,})/i
  );
  if (gdriveMatch) {
    const fileId = gdriveMatch[1];
    return {
      type: 'googledrive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      directUrl: `https://drive.google.com/file/d/${fileId}/view`,
      originalUrl: url,
    };
  }

  // YouTube (standard watch, youtu.be, shorts, embed)
  const ytMatch = targetUrl.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i
  );
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`,
      originalUrl: url,
    };
  }

  // Vimeo
  const vimeoMatch = targetUrl.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/[^\/]*\/videos\/|album\/(?:\d+\/)?video\/|video\/|)(\d+)/i
  );
  if (vimeoMatch) {
    const vimeoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0`,
      originalUrl: url,
    };
  }

  // DailyMotion
  const dmMatch = targetUrl.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/i);
  if (dmMatch) {
    const dmId = dmMatch[1];
    return {
      type: 'dailymotion',
      embedUrl: `https://www.dailymotion.com/embed/video/${dmId}?autoplay=1`,
      originalUrl: url,
    };
  }

  // Internet Archive (archive.org/details/{id} or archive.org/embed/{id})
  const archiveMatch = targetUrl.match(/archive\.org\/(?:details|embed)\/([a-zA-Z0-9_\-\.]+)/i);
  if (archiveMatch) {
    const archiveId = archiveMatch[1];
    return {
      type: 'archive',
      embedUrl: `https://archive.org/embed/${archiveId}`,
      directUrl: targetUrl,
      originalUrl: url,
    };
  }

  // OK.ru (ok.ru/video/{id} or ok.ru/videoembed/{id})
  const okruMatch = targetUrl.match(/ok\.ru\/(?:video|videoembed)\/(\d+)/i);
  if (okruMatch) {
    const okId = okruMatch[1];
    return {
      type: 'okru',
      embedUrl: `https://ok.ru/videoembed/${okId}`,
      originalUrl: url,
    };
  }

  // Streamtape (streamtape.com/v/{id} or /e/{id})
  const streamtapeMatch = targetUrl.match(/streamtape\.com\/(?:v|e)\/([a-zA-Z0-9]+)/i);
  if (streamtapeMatch) {
    const stId = streamtapeMatch[1];
    return {
      type: 'streamtape',
      embedUrl: `https://streamtape.com/e/${stId}`,
      originalUrl: url,
    };
  }

  // DoodStream / Dood
  const doodMatch = targetUrl.match(/(?:dood\.(?:to|so|la|ws|pm|wf|re|cx|sh|watch)|doodstream\.com)\/(?:d|e)\/([a-zA-Z0-9]+)/i);
  if (doodMatch) {
    const doodId = doodMatch[1];
    return {
      type: 'doodstream',
      embedUrl: `https://doodstream.com/e/${doodId}`,
      originalUrl: url,
    };
  }

  // Voe.sx
  const voeMatch = targetUrl.match(/voe\.sx\/(?:e\/)?([a-zA-Z0-9]+)/i);
  if (voeMatch) {
    const voeId = voeMatch[1];
    return {
      type: 'voe',
      embedUrl: `https://voe.sx/e/${voeId}`,
      originalUrl: url,
    };
  }

  // Mega.nz embed
  const megaMatch = targetUrl.match(/mega\.nz\/(?:embed|file)\/([a-zA-Z0-9_-]+(?:#[a-zA-Z0-9_-]+)?)/i);
  if (megaMatch) {
    const megaId = megaMatch[1];
    return {
      type: 'meganz',
      embedUrl: `https://mega.nz/embed/${megaId}`,
      originalUrl: url,
    };
  }

  // Dropbox (convert to raw=1 for in-browser direct streaming without external media player)
  if (targetUrl.includes('dropbox.com')) {
    const directDropbox = targetUrl.replace('dl=0', 'raw=1').replace('?dl=1', '?raw=1');
    const finalDropbox = directDropbox.includes('raw=1')
      ? directDropbox
      : `${directDropbox}${directDropbox.includes('?') ? '&' : '?'}raw=1`;
    return {
      type: 'direct',
      directUrl: finalDropbox,
      originalUrl: url,
    };
  }

  // If was an iframe tag but not recognized above, still treat as embed
  if (iframeMatch) {
    return {
      type: 'embed',
      embedUrl: iframeMatch[1],
      originalUrl: url,
    };
  }

  // Known embed URL signatures (contains /embed/, /e/, /videoembed/, /player/, etc.)
  const isEmbedPath = /\/(?:embed|videoembed|player|e)\//i.test(targetUrl);
  if (isEmbedPath) {
    return {
      type: 'embed',
      embedUrl: targetUrl,
      originalUrl: url,
    };
  }

  // Direct media extensions
  const hasDirectMediaExt = /\.(mp4|webm|mkv|mov|ogg|m3u8|mpd)(\?.*)?$/i.test(targetUrl);
  const isBlobOrData = targetUrl.startsWith('blob:') || targetUrl.startsWith('data:');

  // If it's a generic web URL that is NOT a direct file and doesn't have media extensions,
  // treat it as an embeddable in-browser web player so it renders in iframe instead of failing in <video>
  if (!hasDirectMediaExt && !isBlobOrData && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
    return {
      type: 'embed',
      embedUrl: targetUrl,
      directUrl: targetUrl,
      originalUrl: url,
    };
  }

  // Direct video file or stream by default (mp4, webm, mkv, blob:, m3u8, etc.)
  return {
    type: 'direct',
    directUrl: url,
    originalUrl: url,
  };
}
