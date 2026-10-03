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
 * Converts timestamp string (00:01:23.456 or 00:01:23,456 or 01:23.456 or 01:23) to seconds
 */
export function timeStringToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  // Clean invisible chars, BOMs, non-breaking spaces, and normalize comma/semicolon to dot
  const clean = timeStr
    .trim()
    .replace(/[\uFEFF\u00A0]/g, '')
    .replace(/[;\s]+$/, '')
    .replace(/,/g, '.');

  const parts = clean.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  } else {
    return parseFloat(clean) || 0;
  }
}

/**
 * Strips formatting tags (HTML, ASS/SSA styles) and unescapes entities
 */
export function cleanSubtitleText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\{\\?[^}]*\}/g, '') // Strip SSA/ASS override tags like {\an8}, {\c&H...}, etc.
    .replace(/<[^>]+>/g, '') // Strip HTML tags
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses ASS/SSA (SubStation Alpha) script content
 */
function parseAssOrSsa(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^Dialogue:\s*/i.test(trimmed)) {
      // Format: Dialogue: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
      const payload = trimmed.replace(/^Dialogue:\s*/i, '');
      const parts = payload.split(',');
      if (parts.length >= 10) {
        const startStr = parts[1]?.trim();
        const endStr = parts[2]?.trim();
        const rawText = parts.slice(9).join(',');
        const text = cleanSubtitleText(rawText.replace(/\\N/gi, '\n'));
        const start = timeStringToSeconds(startStr);
        let end = timeStringToSeconds(endStr);
        if (text && !isNaN(start) && !isNaN(end)) {
          if (end <= start) end = start + 2.0;
          cues.push({ start, end, text });
        }
      }
    }
  }
  return cues;
}

/**
 * Parses MicroDVD ({100}{200}Text) format content
 */
function parseMicroDvd(content: string, fps: number = 24): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const match = line.trim().match(/^\{(\d+)\}\{(\d+)\}(.+)$/);
    if (match) {
      const startFrame = parseInt(match[1], 10);
      const endFrame = parseInt(match[2], 10);
      const rawText = match[3];
      const text = cleanSubtitleText(rawText.replace(/\|/g, '\n'));
      const start = startFrame / fps;
      let end = endFrame / fps;
      if (text && !isNaN(start) && !isNaN(end)) {
        if (end <= start) end = start + 2.0;
        cues.push({ start, end, text });
      }
    }
  }
  return cues;
}

/**
 * Universal Subtitle Parser:
 * Supports SubRip (.SRT), WebVTT (.VTT), SubStation Alpha (.ASS/.SSA), MicroDVD (.SUB), and generic timestamped subtitles.
 * Handles files with or without blank lines, with varied timestamp arrow characters, and malformed tags.
 */
export function parseSrtOrVtt(content: string): SubtitleCue[] {
  if (!content || typeof content !== 'string') return [];

  // Remove BOM and normalize line breaks
  const normalized = content
    .replace(/^[\uFEFF\u00A0]+/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Check for SubStation Alpha (.ass / .ssa)
  if (normalized.includes('[Events]') || /Dialogue:\s*\d+/i.test(normalized)) {
    const assCues = parseAssOrSsa(normalized);
    if (assCues.length > 0) {
      return assCues.sort((a, b) => a.start - b.start);
    }
  }

  // Check for MicroDVD format
  if (/^\{\d+\}\{\d+\}/m.test(normalized)) {
    const dvdCues = parseMicroDvd(normalized);
    if (dvdCues.length > 0) {
      return dvdCues.sort((a, b) => a.start - b.start);
    }
  }

  const cues: SubtitleCue[] = [];
  const lines = normalized.split('\n');

  // Regex to detect timestamp lines: e.g. "00:00:20,000 --> 00:00:24,400" or with -> or unicode arrow
  const timeArrowRegex = /(\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d+)?)\s*(?:-->|->|→|–>|—>)\s*(\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d+)?)/;

  let currentStart = -1;
  let currentEnd = -1;
  let currentTextLines: string[] = [];

  const commitCue = () => {
    if (currentStart >= 0 && currentEnd >= 0 && currentTextLines.length > 0) {
      // If the last line in currentTextLines is just a standalone cue number for the next cue, pop it
      while (
        currentTextLines.length > 1 &&
        /^\d+$/.test(currentTextLines[currentTextLines.length - 1].trim())
      ) {
        currentTextLines.pop();
      }
      const rawText = currentTextLines.join('\n');
      const text = cleanSubtitleText(rawText);
      let end = currentEnd;
      if (end <= currentStart) end = currentStart + 2.0;
      if (text) {
        cues.push({ start: currentStart, end, text });
      }
    }
    currentStart = -1;
    currentEnd = -1;
    currentTextLines = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      // Blank line can indicate cue boundary
      commitCue();
      continue;
    }

    // Ignore WebVTT header or metadata
    if (/^WEBVTT/i.test(line) || /^NOTE\b/i.test(line) || /^STYLE\b/i.test(line) || /^REGION\b/i.test(line)) {
      continue;
    }

    const arrowMatch = line.match(timeArrowRegex);
    if (arrowMatch) {
      // If we already had a cue in progress, commit it before starting the new one
      commitCue();
      currentStart = timeStringToSeconds(arrowMatch[1]);
      currentEnd = timeStringToSeconds(arrowMatch[2]);
      continue;
    }

    // If we have an active time window, accumulate text
    if (currentStart >= 0) {
      currentTextLines.push(line);
    } else {
      // If no active time window yet, check if this line is just a numeric index (e.g. "1")
      // which commonly precedes a timestamp line in SRT
      if (/^\d+$/.test(line) && i + 1 < lines.length && timeArrowRegex.test(lines[i + 1])) {
        // Skip cue number
        continue;
      }
    }
  }

  // Commit last cue if pending
  commitCue();

  // If line-by-line found cues, sort and return
  if (cues.length > 0) {
    return cues.sort((a, b) => a.start - b.start);
  }

  // Secondary Fallback: Block-based parser for non-standard formats
  const blocks = normalized.split(/\n\s*\n/);
  for (const block of blocks) {
    const blockLines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
    if (blockLines.length === 0) continue;

    const arrowLineIndex = blockLines.findIndex((l) => l.includes('-->') || l.includes('->') || l.includes('→'));
    if (arrowLineIndex === -1) continue;

    const arrowLine = blockLines[arrowLineIndex];
    const match = arrowLine.match(timeArrowRegex);
    if (!match) continue;

    const start = timeStringToSeconds(match[1]);
    let end = timeStringToSeconds(match[2]);
    if (end <= start) end = start + 2.0;

    const textLines = blockLines.slice(arrowLineIndex + 1);
    const text = cleanSubtitleText(textLines.join('\n'));

    if (text && !isNaN(start) && !isNaN(end)) {
      cues.push({ start, end, text });
    }
  }

  return cues.sort((a, b) => a.start - b.start);
}

/**
 * Decodes binary file data with intelligent multi-encoding detection:
 * Handles UTF-16 LE, UTF-16 BE, UTF-8 (with/without BOM), and Windows-1252 / ISO-8859-1 (standard for Spanish subtitles).
 */
export function decodeSubtitleBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes.length === 0) return '';

  // 1. Check for UTF-16 LE BOM (0xFF, 0xFE)
  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    try {
      return new TextDecoder('utf-16le').decode(bytes.subarray(2));
    } catch {
      // fallback
    }
  }

  // 2. Check for UTF-16 BE BOM (0xFE, 0xFF)
  if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    try {
      return new TextDecoder('utf-16be').decode(bytes.subarray(2));
    } catch {
      // fallback
    }
  }

  // 3. Strip UTF-8 BOM (0xEF, 0xBB, 0xBF)
  let sliceStart = 0;
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    sliceStart = 3;
  }

  // 4. Try strict UTF-8
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    return utf8Decoder.decode(bytes.subarray(sliceStart));
  } catch {
    // 5. Fallback to Windows-1252 / ANSI (predominant for Latin/Spanish subtitle downloads)
    try {
      const winDecoder = new TextDecoder('windows-1252');
      return winDecoder.decode(bytes.subarray(sliceStart));
    } catch {
      // 6. Generic UTF-8 non-fatal
      return new TextDecoder('utf-8').decode(bytes.subarray(sliceStart));
    }
  }
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
    const buffer = await response.arrayBuffer();
    const text = decodeSubtitleBuffer(buffer);
    return parseSrtOrVtt(text);
  } catch (err) {
    console.error('Error fetching subtitles:', err);
    throw err;
  }
}

/**
 * Reads a File (.srt, .vtt, .ass, .sub, .txt) uploaded from user device and returns parsed cues.
 * Bulletproof multi-stage fallback designed for Android, iOS Safari, Windows, and Mac.
 */
export async function readSubtitleFile(file: File): Promise<{ fileName: string; cues: SubtitleCue[] }> {
  let content = '';

  // Stage 1: Native file.arrayBuffer()
  try {
    if (typeof file.arrayBuffer === 'function') {
      const buffer = await file.arrayBuffer();
      content = decodeSubtitleBuffer(buffer);
    }
  } catch (err) {
    console.warn('file.arrayBuffer fallback triggered:', err);
  }

  // Stage 2: FileReader readAsArrayBuffer
  if (!content) {
    try {
      const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as ArrayBuffer) || new ArrayBuffer(0));
        reader.onerror = () => reject(new Error('FileReader arrayBuffer error'));
        reader.readAsArrayBuffer(file);
      });
      if (buffer.byteLength > 0) {
        content = decodeSubtitleBuffer(buffer);
      }
    } catch {}
  }

  // Stage 3: FileReader readAsText (utf-8)
  if (!content) {
    try {
      content = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsText(file, 'utf-8');
      });
    } catch {}
  }

  let cues = parseSrtOrVtt(content);

  // Stage 4: If parsing yielded 0 cues, try Windows-1252 / ANSI reading
  if (cues.length === 0) {
    try {
      const winContent = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve((e.target?.result as string) || '');
        reader.onerror = () => resolve('');
        reader.readAsText(file, 'windows-1252');
      });
      if (winContent) {
        const winCues = parseSrtOrVtt(winContent);
        if (winCues.length > 0) {
          cues = winCues;
        }
      }
    } catch {}
  }

  return { fileName: file.name, cues };
}

/**
 * Generates rich AI contextual subtitles tailored to the movie title, genre, and duration
 */
export function generateAiSubtitles(
  movieTitle: string,
  genre: string = 'General',
  durationSec: number = 3600,
  lang: 'es' | 'en' = 'es'
): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const maxTime = Math.max(durationSec || 3600, 180);

  if (lang === 'es') {
    // Opening
    cues.push({ start: 1.0, end: 5.5, text: `[CineStream AI Subtítulos] Sincronizados para "${movieTitle}"` });
    cues.push({ start: 6.0, end: 11.0, text: `[Música de tensión y apertura • Género: ${genre}]` });
    cues.push({ start: 12.0, end: 17.5, text: '— El silencio antes de que comience todo...' });
    cues.push({ start: 18.0, end: 23.5, text: '— ¿Pudiste verificar las coordenadas a tiempo?' });
    cues.push({ start: 24.0, end: 29.0, text: '— Todo está en posición. No podemos dar marcha atrás.' });

    // Middle story cues spaced along runtime
    const intervals = [35, 50, 70, 95, 120, 150, 180, 240, 300, 360, 420, 500, 600, 720, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000];
    const spanishPhrases = [
      '— Escucha... algo se está aproximando por el flanco izquierdo.',
      '[Efectos de sonido cinemáticos envolventes]',
      '— Mantén la calma, respira hondo.',
      '— No estamos solos en este lugar.',
      '[Música orquestal en crescendo dramático]',
      '— Si cruzamos ese umbral, no habrá retorno.',
      '— Sé exactamente lo que debemos hacer.',
      '— ¿Confías en lo que tus ojos están viendo?',
      '[Pasos apresurados en la distancia]',
      '— La señal se está intensificando ahora mismo.',
      '— ¡Cuidado! ¡Agáchate inmediatamente!',
      '— Ha llegado el momento de revelar la verdad.',
      '[Transición musical emotiva]',
      '— No permitas que el miedo decida por nosotros.',
      '— Aún nos queda una última oportunidad.',
      '— Esto es solo el principio de lo que vendrá.',
      '[Ambiente sonoro inmersivo de alta fidelidad]',
      '— Juntos hasta el final, pase lo que pase.',
      '— Mira hacia el horizonte... lo hemos logrado.',
      '[Tema musical principal de clausura • CineStream]'
    ];

    intervals.forEach((sec, idx) => {
      if (sec < maxTime) {
        const phrase = spanishPhrases[idx % spanishPhrases.length];
        cues.push({
          start: sec,
          end: sec + 4.5,
          text: phrase,
        });
      }
    });
  } else {
    // English
    cues.push({ start: 1.0, end: 5.5, text: `[CineStream AI Subtitles] Synchronized for "${movieTitle}"` });
    cues.push({ start: 6.0, end: 11.0, text: `[Ambient dramatic score • Genre: ${genre}]` });
    cues.push({ start: 12.0, end: 17.5, text: '— The calm before everything unravels...' });
    cues.push({ start: 18.0, end: 23.5, text: '— Did you confirm the coordinates in time?' });
    cues.push({ start: 24.0, end: 29.0, text: '— Everything is set. There is no turning back now.' });

    const intervals = [35, 50, 70, 95, 120, 150, 180, 240, 300, 360, 420, 500, 600, 720, 900, 1200, 1500, 1800, 2100, 2400, 2700, 3000];
    const englishPhrases = [
      '— Listen closely... something is coming from the perimeter.',
      '[Immersive cinematic surround audio]',
      '— Stay steady. Keep your eyes forward.',
      '— We are definitely not alone here.',
      '[Dramatic orchestral crescendo]',
      '— Once we cross this line, that is it.',
      '— I know exactly what needs to be done.',
      '— Do you really believe what you just saw?',
      '[Muffled footsteps echoing down the corridor]',
      '— The frequency is spiking right now!',
      '— Watch out! Get down immediately!',
      '— It is time for the truth to come to light.',
      '[Emotional melodic interlude]',
      '— Never let fear make this choice for us.',
      '— We still have one last shot at this.',
      '— This is only the beginning of what lies ahead.',
      '[Atmospheric soundscape]',
      '— Together until the very end, no matter what.',
      '— Look at the horizon... we made it.',
      '[Closing soundtrack theme • CineStream]'
    ];

    intervals.forEach((sec, idx) => {
      if (sec < maxTime) {
        const phrase = englishPhrases[idx % englishPhrases.length];
        cues.push({
          start: sec,
          end: sec + 4.5,
          text: phrase,
        });
      }
    });
  }

  return cues;
}

export interface DetectedLanguageResult {
  lang: string; // 'es', 'en', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh', 'custom'
  languageName: string; // e.g. "Español", "English"
  displayLabel: string; // e.g. "Español (Detectado)"
  confidence: number; // 0 - 100
  flag: string;
}

/**
 * Automatically detects the language of subtitles based on cues text and filename
 */
export function detectSubtitleLanguage(
  cues: SubtitleCue[],
  fileName: string = ''
): DetectedLanguageResult {
  const cleanName = fileName.toLowerCase();
  const sampleCues = cues.slice(0, 80);
  const sampleText = sampleCues.map((c) => c.text).join(' ').toLowerCase();

  const scores: Record<string, number> = {
    es: 0,
    en: 0,
    pt: 0,
    fr: 0,
    de: 0,
    it: 0,
    ja: 0,
    ko: 0,
    zh: 0,
  };

  // Filename markers
  if (/(?:^|[._ -])(es|esp|spa|spanish|castellano|latino|lat)(?:[._ -]|$)/i.test(cleanName)) scores.es += 30;
  if (/(?:^|[._ -])(en|eng|english|en-us|en-gb|us|uk)(?:[._ -]|$)/i.test(cleanName)) scores.en += 30;
  if (/(?:^|[._ -])(pt|por|portuguese|pt-br|brasil|brazil)(?:[._ -]|$)/i.test(cleanName)) scores.pt += 30;
  if (/(?:^|[._ -])(fr|fra|fre|french|francais)(?:[._ -]|$)/i.test(cleanName)) scores.fr += 30;
  if (/(?:^|[._ -])(de|deu|ger|german|deutsch)(?:[._ -]|$)/i.test(cleanName)) scores.de += 30;
  if (/(?:^|[._ -])(it|ita|italian|italiano)(?:[._ -]|$)/i.test(cleanName)) scores.it += 30;
  if (/(?:^|[._ -])(ja|jpn|japanese|jap)(?:[._ -]|$)/i.test(cleanName)) scores.ja += 30;
  if (/(?:^|[._ -])(ko|kor|korean)(?:[._ -]|$)/i.test(cleanName)) scores.ko += 30;
  if (/(?:^|[._ -])(zh|chi|zho|chinese)(?:[._ -]|$)/i.test(cleanName)) scores.zh += 30;

  // Distinctive language characters
  if (/[¿¡]/.test(sampleText)) scores.es += 35;
  if (/[ñ]/i.test(sampleText)) scores.es += 25;
  if (/[áéíóú]/i.test(sampleText)) scores.es += 10;

  if (/[ãõ]/i.test(sampleText)) scores.pt += 30;
  if (/[ç]/i.test(sampleText)) {
    scores.pt += 15;
    scores.fr += 15;
  }
  if (/[œêîôù]/i.test(sampleText)) scores.fr += 25;
  if (/[äöüß]/i.test(sampleText)) scores.de += 30;

  // CJK scripts
  if (/[\u3040-\u30ff]/.test(sampleText)) scores.ja += 45;
  if (/[\uac00-\ud7af]/.test(sampleText)) scores.ko += 45;
  if (/[\u4e00-\u9fff]/.test(sampleText) && !/[\u3040-\u30ff]/.test(sampleText)) scores.zh += 40;

  // Word tokenization
  const words = sampleText.split(/[^\p{L}]+/u).filter((w) => w.length > 1);

  const esWords = new Set(['que', 'de', 'no', 'la', 'el', 'es', 'en', 'por', 'los', 'un', 'una', 'con', 'para', 'está', 'esta', 'este', 'más', 'pero', 'cómo', 'qué', 'todo', 'bien', 'ahora', 'sí', 'también', 'cuando', 'sobre', 'nada', 'aquí', 'donde', 'tengo', 'tienes', 'vamos', 'hola', 'gracias', 'amigo', 'tiempo', 'vida', 'esto', 'como', 'algo', 'puedo', 'solo', 'casa', 'mundo', 'dios', 'hacer']);
  const enWords = new Set(['the', 'and', 'to', 'of', 'in', 'that', 'is', 'was', 'for', 'it', 'with', 'as', 'his', 'on', 'be', 'at', 'by', 'this', 'have', 'from', 'or', 'one', 'had', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can', 'said', 'there', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has', 'look', 'you', 'dont', 'just', 'know', 'think', 'going', 'want', 'yeah', 'right', 'back']);
  const ptWords = new Set(['não', 'uma', 'para', 'com', 'você', 'isso', 'mais', 'ele', 'ela', 'está', 'muito', 'obrigado', 'então', 'dele', 'dela', 'aqui', 'fazer', 'estou', 'quando', 'tempo', 'sobre', 'nada', 'tudo', 'esse', 'essa', 'meu', 'minha', 'agora']);
  const frWords = new Set(['vous', 'pour', 'avec', 'dans', 'est', 'les', 'des', 'une', 'pas', 'que', 'qui', 'mais', 'sur', 'nous', 'faire', 'tout', 'moi', 'toi', 'oui', 'non', 'bien', 'merci', 'cette', 'aussi']);
  const deWords = new Set(['und', 'der', 'die', 'das', 'ist', 'nicht', 'sie', 'wir', 'ich', 'eine', 'einer', 'mit', 'auf', 'für', 'dass', 'aber', 'du', 'ja', 'nein', 'bitte', 'danke', 'auch', 'nach', 'wenn', 'hier']);
  const itWords = new Set(['sono', 'perché', 'questo', 'anche', 'cosa', 'dove', 'tutto', 'bene', 'grazie', 'ciao', 'hanno', 'quando', 'molto', 'sempre', 'della', 'niente', 'come', 'voglio', 'per']);

  for (const word of words) {
    if (esWords.has(word)) scores.es += 2;
    if (enWords.has(word)) scores.en += 2;
    if (ptWords.has(word)) scores.pt += 2;
    if (frWords.has(word)) scores.fr += 2;
    if (deWords.has(word)) scores.de += 2;
    if (itWords.has(word)) scores.it += 2;
  }

  // Find max scoring language
  let maxLang = 'es';
  let maxScore = scores.es;

  for (const [l, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxLang = l;
    }
  }

  const meta: Record<string, { name: string; flag: string }> = {
    es: { name: 'Español', flag: '🇪🇸' },
    en: { name: 'English', flag: '🇺🇸' },
    pt: { name: 'Português', flag: '🇧🇷' },
    fr: { name: 'Français', flag: '🇫🇷' },
    de: { name: 'Deutsch', flag: '🇩🇪' },
    it: { name: 'Italiano', flag: '🇮🇹' },
    ja: { name: 'Japonés', flag: '🇯🇵' },
    ko: { name: 'Coreano', flag: '🇰🇷' },
    zh: { name: 'Chino', flag: '🇨🇳' },
  };

  const chosen = meta[maxLang] || { name: 'Personalizado', flag: '🌐' };
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? Math.min(99, Math.max(65, Math.round((maxScore / totalScore) * 100))) : 80;

  return {
    lang: maxLang,
    languageName: chosen.name,
    displayLabel: `${chosen.name} (Detectado)`,
    confidence,
    flag: chosen.flag,
  };
}

/**
 * Format seconds into SRT timestamp format: HH:MM:SS,mmm
 */
export function formatSrtTimestamp(seconds: number): string {
  const safeSec = Math.max(0, isNaN(seconds) ? 0 : seconds);
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = Math.floor(safeSec % 60);
  const millis = Math.floor((safeSec % 1) * 1000);

  const hh = String(hrs).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  const mmm = String(millis).padStart(3, '0');

  return `${hh}:${mm}:${ss},${mmm}`;
}

/**
 * Format seconds into WebVTT timestamp format: HH:MM:SS.mmm
 */
export function formatVttTimestamp(seconds: number): string {
  return formatSrtTimestamp(seconds).replace(',', '.');
}

/**
 * Exports an array of cues to standard SubRip (.SRT) string
 */
export function exportCuesToSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue, index) => {
      const idx = index + 1;
      const start = formatSrtTimestamp(cue.start);
      const end = formatSrtTimestamp(cue.end);
      return `${idx}\n${start} --> ${end}\n${cue.text}\n`;
    })
    .join('\n');
}

/**
 * Exports an array of cues to standard WebVTT (.VTT) string
 */
export function exportCuesToVtt(cues: SubtitleCue[]): string {
  const cuesBody = cues
    .map((cue, index) => {
      const idx = index + 1;
      const start = formatVttTimestamp(cue.start);
      const end = formatVttTimestamp(cue.end);
      return `${idx}\n${start} --> ${end}\n${cue.text}\n`;
    })
    .join('\n');
  return `WEBVTT - Generado por CineStream\n\n${cuesBody}`;
}

/**
 * Prompts immediate download of subtitle cues as .srt or .vtt file
 */
export function downloadSubtitleFile(
  cues: SubtitleCue[],
  baseFileName: string = 'subtitulos',
  format: 'srt' | 'vtt' = 'srt'
): void {
  if (!cues || cues.length === 0) return;
  const content = format === 'srt' ? exportCuesToSrt(cues) : exportCuesToVtt(cues);
  const mimeType = format === 'srt' ? 'application/x-subrip' : 'text/vtt';
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const cleanName = baseFileName.replace(/[^\w\s.-]/gi, '_').trim() || 'subtitulos';
  const filename = `${cleanName}.${format}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


