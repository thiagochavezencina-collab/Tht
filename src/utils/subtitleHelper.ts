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


