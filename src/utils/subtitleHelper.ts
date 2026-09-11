export interface SubtitleCue {
  start: number; // in seconds
  end: number; // in seconds
  text: string;
}

export interface SubtitleTrackData {
  id: string;
  lang: string; // e.g. 'es', 'en', 'pt', 'fr'
  label: string; // e.g. 'Español', 'English'
  url?: string;
  fileName?: string;
  cues?: SubtitleCue[];
}

/**
 * Converts timestamp string (00:01:23.456 or 00:01:23,456 or 01:23.456) to seconds
 */
export function timeStringToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const clean = timeStr.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return (hours || 0) * 3600 + (minutes || 0) * 60 + (seconds || 0);
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return (minutes || 0) * 60 + (seconds || 0);
  } else {
    return parseFloat(clean) || 0;
  }
}

/**
 * Parses SRT or WebVTT subtitle files into an array of cues
 */
export function parseSrtOrVtt(content: string): SubtitleCue[] {
  if (!content || typeof content !== 'string') return [];
  const cues: SubtitleCue[] = [];

  // Normalize line endings
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    // Look for the line containing "-->"
    const arrowLineIndex = lines.findIndex((l) => l.includes('-->'));
    if (arrowLineIndex === -1) continue;

    const arrowLine = lines[arrowLineIndex];
    const [startRaw, endRaw] = arrowLine.split('-->').map((s) => s.trim());
    if (!startRaw || !endRaw) continue;

    // Strip out WebVTT cue settings like line:90% position:50% align:center
    const cleanEndStr = endRaw.split(/\s+/)[0];

    const start = timeStringToSeconds(startRaw);
    const end = timeStringToSeconds(cleanEndStr);

    // Everything after the arrow line is subtitle text
    const textLines = lines.slice(arrowLineIndex + 1);
    const text = textLines
      .join('\n')
      .replace(/<[^>]+>/g, '') // remove formatting tags
      .trim();

    if (text && !isNaN(start) && !isNaN(end) && end >= start) {
      cues.push({ start, end, text });
    }
  }

  return cues;
}

/**
 * Helper to fetch and parse a subtitle file from a URL
 */
export async function loadSubtitlesFromUrl(url: string): Promise<SubtitleCue[]> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al descargar subtítulos: ${response.statusText}`);
    }
    const text = await response.text();
    return parseSrtOrVtt(text);
  } catch (err) {
    console.error('Error fetching subtitles:', err);
    throw err;
  }
}

/**
 * Reads a File (.srt or .vtt) uploaded from user device and returns parsed cues
 */
export function readSubtitleFile(file: File): Promise<{ fileName: string; cues: SubtitleCue[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = (e.target?.result as string) || '';
        const cues = parseSrtOrVtt(content);
        resolve({ fileName: file.name, cues });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de subtítulos'));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Creates sample introductory and dialogue cues for demonstration
 */
export function createDemoSubtitles(movieTitle: string, lang: 'es' | 'en'): SubtitleCue[] {
  if (lang === 'es') {
    return [
      { start: 0.5, end: 4.5, text: `[Música inicial] ${movieTitle}` },
      { start: 5.0, end: 9.5, text: 'Bienvenido a CineStream. Subtítulos en español sincronizados.' },
      { start: 10.0, end: 15.5, text: 'Disfruta de la mejor calidad y sonido envolvente.' },
      { start: 16.0, end: 22.0, text: 'Puedes cargar tus propios subtítulos .srt o .vtt en cualquier momento.' },
      { start: 23.0, end: 29.0, text: 'Ajusta el desfase de tiempo para una sincronización milimétrica.' },
      { start: 30.0, end: 38.0, text: '[Diálogo principal]' },
      { start: 40.0, end: 48.0, text: 'La aventura comienza ahora...' },
      { start: 50.0, end: 60.0, text: 'CineStream: cine y series en tu pantalla.' },
    ];
  } else {
    return [
      { start: 0.5, end: 4.5, text: `[Opening Theme] ${movieTitle}` },
      { start: 5.0, end: 9.5, text: 'Welcome to CineStream. English subtitles synchronized.' },
      { start: 10.0, end: 15.5, text: 'Enjoy superior streaming quality and immersive audio.' },
      { start: 16.0, end: 22.0, text: 'You can load your custom .srt or .vtt subtitle files anytime.' },
      { start: 23.0, end: 29.0, text: 'Fine-tune timing offset for perfect lip-sync.' },
      { start: 30.0, end: 38.0, text: '[Main Dialogue]' },
      { start: 40.0, end: 48.0, text: 'The adventure begins now...' },
      { start: 50.0, end: 60.0, text: 'CineStream: movies and series streaming.' },
    ];
  }
}

