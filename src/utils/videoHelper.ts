export type VideoSourceType =
  | 'youtube'
  | 'vimeo'
  | 'googledrive'
  | 'dailymotion'
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
 * - Generic embed iframes
 * - Direct MP4 / WebM / Blob videos
 */
export function parseVideoSource(rawUrl: string): ParsedVideoSource {
  if (!rawUrl) {
    return { type: 'direct', directUrl: '', originalUrl: '' };
  }

  const url = rawUrl.trim();

  // If user pasted an iframe tag like <iframe src="...">
  const iframeMatch = url.match(/src=["']([^"']+)["']/i);
  if (iframeMatch) {
    return {
      type: 'embed',
      embedUrl: iframeMatch[1],
      originalUrl: url,
    };
  }

  // YouTube (standard watch, youtu.be, shorts, embed)
  const ytMatch = url.match(
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
  const vimeoMatch = url.match(
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

  // Google Drive
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (gdriveMatch) {
    const fileId = gdriveMatch[1];
    return {
      type: 'googledrive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      originalUrl: url,
    };
  }

  // DailyMotion
  const dmMatch = url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/i);
  if (dmMatch) {
    const dmId = dmMatch[1];
    return {
      type: 'dailymotion',
      embedUrl: `https://www.dailymotion.com/embed/video/${dmId}?autoplay=1`,
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
