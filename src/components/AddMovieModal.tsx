import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Film,
  Tv,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  ListVideo
} from 'lucide-react';
import { Movie, Episode, MediaContentType } from '../types';
import { saveVideoBlob } from '../utils/videoStorage';

interface AddMovieModalProps {
  onClose: () => void;
  onAddMovie: (movie: Movie) => void;
}

export const AddMovieModal: React.FC<AddMovieModalProps> = ({ onClose, onAddMovie }) => {
  const [contentType, setContentType] = useState<MediaContentType>('movie');
  const [sourceType, setSourceType] = useState<'url' | 'file'>('url');
  
  // Base fields
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [genres, setGenres] = useState('Acción, Aventura');
  const [director, setDirector] = useState('Director');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [duration, setDuration] = useState('110');
  const [synopsis, setSynopsis] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const episodeFilesRef = useRef<{ [idx: number]: File }>({});

  // Series specific: Episodes list
  const [episodes, setEpisodes] = useState<Episode[]>([
    {
      id: 'ep-1',
      episodeNumber: 1,
      seasonNumber: 1,
      title: 'Episodio 1: Piloto',
      duration: 45,
      videoUrl: '',
      synopsis: 'Comienzo de la historia...',
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, episodeIndex?: number) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      if (episodeIndex !== undefined) {
        episodeFilesRef.current[episodeIndex] = file;
        setEpisodes((prev) => {
          const copy = [...prev];
          copy[episodeIndex] = {
            ...copy[episodeIndex],
            videoUrl: objectUrl,
            title: copy[episodeIndex].title || file.name.replace(/\.[^/.]+$/, ''),
          };
          return copy;
        });
      } else {
        setSelectedVideoFile(file);
        setVideoUrl(objectUrl);
        setFileName(file.name);
        if (!title) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '');
          setTitle(cleanName);
        }
      }
    }
  };

  const addEpisodeRow = () => {
    const nextNum = episodes.length + 1;
    setEpisodes((prev) => [
      ...prev,
      {
        id: `ep-${Date.now()}-${nextNum}`,
        episodeNumber: nextNum,
        seasonNumber: 1,
        title: `Episodio ${nextNum}`,
        duration: 45,
        videoUrl: '',
        synopsis: '',
      },
    ]);
  };

  const removeEpisodeRow = (index: number) => {
    if (episodes.length <= 1) return;
    delete episodeFilesRef.current[index];
    setEpisodes((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateEpisode = (index: number, field: keyof Episode, value: any) => {
    setEpisodes((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedYear = parseInt(year, 10) || new Date().getFullYear();
    const parsedDuration = parseInt(duration, 10) || 90;

    let finalVideoUrl = videoUrl.trim();
    let finalEpisodes: Episode[] | undefined = undefined;

    if (contentType === 'series') {
      // Validate at least 1 episode with video
      const validEpisodes = episodes.filter((ep) => ep.videoUrl.trim().length > 0);
      if (validEpisodes.length === 0 && !finalVideoUrl) {
        alert('Por favor agrega al menos un episodio con enlace o archivo de video para la serie.');
        return;
      }
      finalEpisodes = validEpisodes.length > 0 ? validEpisodes : episodes;
      if (!finalVideoUrl && finalEpisodes[0]?.videoUrl) {
        finalVideoUrl = finalEpisodes[0].videoUrl;
      }
    } else {
      if (!finalVideoUrl) {
        alert('Por favor especifica la URL o archivo de video de la película.');
        return;
      }
    }

    const defaultPoster =
      posterUrl.trim() ||
      'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';
    const defaultBackdrop =
      backdropUrl.trim() ||
      posterUrl.trim() ||
      'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1920&q=80';

    const generatedMovieId = `${contentType}-${Date.now()}`;

    // Save video file to IndexedDB so it persists permanently across page reloads!
    if (selectedVideoFile) {
      await saveVideoBlob(generatedMovieId, selectedVideoFile);
    }

    if (contentType === 'series' && finalEpisodes) {
      for (let i = 0; i < finalEpisodes.length; i++) {
        const epFile = episodeFilesRef.current[i];
        if (epFile) {
          await saveVideoBlob(finalEpisodes[i].id, epFile);
        }
      }
    }

    const newMovie: Movie = {
      id: generatedMovieId,
      contentType,
      title: title.trim(),
      year: parsedYear,
      duration: parsedDuration,
      rating: 9.2,
      ageRating: '+13',
      genres: genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      director: director.trim() || 'Producción Original',
      cast: ['Reparto Principal'],
      synopsis:
        synopsis.trim() ||
        `${contentType === 'series' ? 'Serie' : 'Película'} cargada por el usuario para reproducir en CineStream.`,
      posterUrl: defaultPoster,
      backdropUrl: defaultBackdrop,
      videoUrl: finalVideoUrl,
      quality: 'Full HD 1080p',
      viewsCount: 1,
      addedByUser: true,
      originalTitle: '',
      hasLocalFile: !!selectedVideoFile || Object.keys(episodeFilesRef.current).length > 0,
      fileName: fileName || selectedVideoFile?.name || '',
      ...(contentType === 'series' && finalEpisodes
        ? { episodes: finalEpisodes, seasonsCount: 1 }
        : {}),
    };

    onAddMovie(newMovie);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800 hover:bg-rose-600 text-zinc-400 hover:text-white transition-colors"
          title="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/40">
            {contentType === 'series' ? <Tv className="w-6 h-6" /> : <Film className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit']">
              Subir {contentType === 'series' ? 'Nueva Serie' : 'Nueva Película'}
            </h2>
            <p className="text-xs text-zinc-400">
              Sube tus contenidos con carátula y reproducción directa en CineStream
            </p>
          </div>
        </div>

        {/* Type Selector: Película vs Serie */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-zinc-950 rounded-2xl border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => setContentType('movie')}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              contentType === 'movie'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Película</span>
          </button>
          <button
            type="button"
            onClick={() => setContentType('series')}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
              contentType === 'series'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Serie (con Episodios)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Título de {contentType === 'series' ? 'la Serie' : 'la Película'} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={contentType === 'series' ? 'Ej. Stranger Things, Breaking Bad...' : 'Ej. Interestelar, Batman...'}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* If movie: Single Video Source */}
          {contentType === 'movie' ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Origen del Video *
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSourceType('url')}
                    className={`px-2.5 py-1 rounded-lg border ${
                      sourceType === 'url'
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Enlace URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('file')}
                    className={`px-2.5 py-1 rounded-lg border ${
                      sourceType === 'file'
                        ? 'bg-zinc-800 text-white border-zinc-600'
                        : 'text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Archivo Local
                  </button>
                </div>
              </div>

              {sourceType === 'url' ? (
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="YouTube, Google Drive, Vimeo, MP4 directo o embebido..."
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Compatible con enlaces de <strong className="text-zinc-200">YouTube</strong>, <strong className="text-zinc-200">Google Drive</strong>, <strong className="text-zinc-200">Vimeo</strong>, <strong className="text-zinc-200">MP4 directo</strong> o URLs embebidas.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-rose-500 rounded-2xl p-5 cursor-pointer bg-zinc-950/60 transition-colors">
                    <Upload className="w-8 h-8 text-rose-500 mb-2" />
                    <span className="text-xs font-semibold text-zinc-200 text-center">
                      {fileName ? fileName : 'Seleccionar video de tu ordenador (MP4, MKV, WebM)'}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-1">
                      Se cargará en memoria de tu navegador para reproducción fluida
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e)}
                      className="hidden"
                    />
                  </label>
                  {videoUrl && (
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs mt-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Video listo para reproducción inmediata</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* If Series: Episodes Manager */
            <div className="space-y-3 bg-zinc-950/70 p-4 rounded-2xl border border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Capítulos / Episodios ({episodes.length})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addEpisodeRow}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors border border-zinc-700"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-400" />
                  <span>Añadir Episodio</span>
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {episodes.map((ep, idx) => (
                  <div
                    key={ep.id || idx}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-rose-400">
                        Capítulo {idx + 1}
                      </span>
                      {episodes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEpisodeRow(idx)}
                          className="text-zinc-500 hover:text-rose-400 p-1"
                          title="Eliminar episodio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Título del capítulo"
                        value={ep.title}
                        onChange={(e) => updateEpisode(idx, 'title', e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                      />
                      <input
                        type="number"
                        placeholder="Duración (min)"
                        value={ep.duration || 45}
                        onChange={(e) => updateEpisode(idx, 'duration', parseInt(e.target.value, 10))}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="URL de video (https://...)"
                        value={ep.videoUrl}
                        onChange={(e) => updateEpisode(idx, 'videoUrl', e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                      />
                      <label className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer shrink-0 flex items-center gap-1 border border-zinc-700">
                        <Upload className="w-3 h-3" />
                        <span>Archivo</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e, idx)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Poster & Backdrop URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Póster Vertical (URL de Imagen)
              </label>
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://... (o se usará una carátula de cine)"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Banner Horizontal (Opcional)
              </label>
              <input
                type="url"
                value={backdropUrl}
                onChange={(e) => setBackdropUrl(e.target.value)}
                placeholder="https://... (Fondo panorámico)"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Genres & Year */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Géneros (separados por coma)
              </label>
              <input
                type="text"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder="Acción, Suspenso..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Año</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {contentType === 'series' ? 'Min / Cap' : 'Duración (min)'}
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Sinopsis / Descripción
            </label>
            <textarea
              rows={2}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Escribe un breve resumen de la trama..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-rose-950/50 flex items-center justify-center gap-2 transition-all mt-3"
          >
            <Sparkles className="w-4 h-4" />
            <span>Guardar {contentType === 'series' ? 'Serie' : 'Película'} y Ver Ahora</span>
          </button>
        </form>
      </div>
    </div>
  );
};
