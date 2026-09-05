import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Film, Tv, Clock, Calendar, Link2, Trash2, ListVideo, Upload } from 'lucide-react';
import { Movie, Episode } from '../types';
import { saveVideoBlob } from '../utils/videoStorage';

interface EditMovieModalProps {
  isOpen: boolean;
  movie: Movie | null;
  onClose: () => void;
  onSave: (updatedMovie: Movie) => void;
  onDelete?: (movie: Movie) => void;
}

export const EditMovieModal: React.FC<EditMovieModalProps> = ({
  isOpen,
  movie,
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [year, setYear] = useState(2024);
  const [duration, setDuration] = useState(90);
  const [synopsis, setSynopsis] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [backdropUrl, setBackdropUrl] = useState('');
  const [genres, setGenres] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (movie) {
      setTitle(movie.title || '');
      setOriginalTitle(movie.originalTitle || '');
      setYear(movie.year || 2024);
      setDuration(movie.duration || 90);
      setSynopsis(movie.synopsis || '');
      setVideoUrl(movie.videoUrl || '');
      setPosterUrl(movie.posterUrl || '');
      setBackdropUrl(movie.backdropUrl || '');
      setGenres((movie.genres || []).join(', '));
      setEpisodes(movie.episodes ? [...movie.episodes] : []);
      setFileName(movie.fileName || '');
      setSelectedFile(null);
    }
  }, [movie]);

  // Lock background scroll on iOS
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen || !movie) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('El nombre o título no puede estar vacío.');
      return;
    }

    if (selectedFile) {
      await saveVideoBlob(movie.id, selectedFile);
    }

    const finalVideoUrl = videoUrl.trim() || (selectedFile ? URL.createObjectURL(selectedFile) : movie.videoUrl);

    const updated: Movie = {
      ...movie,
      title: title.trim(),
      originalTitle: originalTitle.trim(),
      year: Number(year) || 2024,
      duration: Number(duration) || 90,
      synopsis: synopsis.trim(),
      videoUrl: finalVideoUrl,
      posterUrl: posterUrl.trim() || movie.posterUrl,
      backdropUrl: backdropUrl.trim() || movie.backdropUrl,
      genres: genres
        .split(',')
        .map((g) => g.trim())
        .filter(Boolean),
      episodes: movie.contentType === 'series' && episodes.length > 0 ? episodes : (movie.episodes || []),
      hasLocalFile: !!selectedFile || movie.hasLocalFile,
      fileName: selectedFile ? selectedFile.name : (fileName || movie.fileName || ''),
    };

    onSave(updated);
    onClose();
  };

  const updateEpisodeTitle = (index: number, newTitle: string) => {
    setEpisodes((prev) =>
      prev.map((ep, idx) => (idx === index ? { ...ep, title: newTitle } : ep))
    );
  };

  const updateEpisodeUrl = (index: number, newUrl: string) => {
    setEpisodes((prev) =>
      prev.map((ep, idx) => (idx === index ? { ...ep, videoUrl: newUrl } : ep))
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md animate-fade-in ios-scrollable select-none"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div
        className="min-h-full w-full flex items-start sm:items-center justify-center p-2 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-2 sm:my-6 max-h-[92vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-950/80 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Editar {movie.contentType === 'series' ? 'Serie' : 'Película'}
              </h2>
              <p className="text-xs text-zinc-400">
                Modifica el nombre, detalles o enlaces de reproducción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Main Title / Name (Required) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-rose-400 mb-1.5">
              Nombre / Título de la {movie.contentType === 'series' ? 'Serie' : 'Película'} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Interstellar, Breaking Bad..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-white font-semibold placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors shadow-inner"
            />
          </div>

          {/* Original Title & Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Título Original (Opcional)
              </label>
              <input
                type="text"
                value={originalTitle}
                onChange={(e) => setOriginalTitle(e.target.value)}
                placeholder="Título en idioma original..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Año de Estreno
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1900"
                  max="2099"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-500"
                />
                <Calendar className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Duration & Genres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Duración en Minutos
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-rose-500"
                />
                <Clock className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Géneros (separados por coma)
              </label>
              <input
                type="text"
                value={genres}
                onChange={(e) => setGenres(e.target.value)}
                placeholder="Acción, Ciencia Ficción, Drama..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Video URL & Local File */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              Enlace de Video o Archivo
            </label>
            <div className="relative">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (e.target.value) setSelectedFile(null);
                }}
                placeholder="https://youtube.com/watch?v=... o enlace de Google Drive / MP4"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-8 pr-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
              <Link2 className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-3" />
            </div>

            {/* Cloud streaming guidance */}
            <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <span className="font-semibold text-rose-400 block">💡 Para que todos la vean en streaming (como YouTube):</span>
              <p>
                Sube tu archivo a <strong>Google Drive</strong>, ponlo en <em>Compartir &gt; Cualquier persona con el enlace</em> y pega el enlace aquí. ¡Funcionará en cualquier computadora o celular sin descargar nada!
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-medium cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {selectedFile
                    ? `Archivo seleccionado: ${selectedFile.name}`
                    : fileName
                    ? `Archivo actual: ${fileName} (Cambiar)`
                    : 'Cargar archivo de video local (.mp4, .mkv, .webm)'}
                </span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFile(f);
                      setFileName(f.name);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
            {fileName && !selectedFile && (
              <p className="text-[11px] text-zinc-400">
                Archivo asociado: <span className="text-zinc-200 font-mono">{fileName}</span>
              </p>
            )}
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Sinopsis / Descripción
            </label>
            <textarea
              rows={3}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Breve resumen de la trama..."
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none"
            />
          </div>

          {/* Posters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Póster URL (Vertical)
              </label>
              <input
                type="url"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Banner URL (Horizontal)
              </label>
              <input
                type="url"
                value={backdropUrl}
                onChange={(e) => setBackdropUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* If Series: Edit Episode Titles */}
          {movie.contentType === 'series' && episodes.length > 0 && (
            <div className="border border-zinc-800 bg-zinc-950/60 p-3.5 rounded-2xl space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
                <ListVideo className="w-4 h-4 text-rose-500" />
                <span>Editar Títulos de Episodios ({episodes.length})</span>
              </div>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {episodes.map((ep, idx) => (
                  <div key={ep.id || idx} className="bg-zinc-900/90 border border-zinc-800 p-2 rounded-xl flex flex-col sm:flex-row items-center gap-2">
                    <span className="text-[11px] font-bold text-rose-400 shrink-0">
                      Capítulo {ep.episodeNumber || idx + 1}:
                    </span>
                    <input
                      type="text"
                      value={ep.title}
                      onChange={(e) => updateEpisodeTitle(idx, e.target.value)}
                      placeholder="Título del episodio..."
                      className="flex-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      value={ep.videoUrl}
                      onChange={(e) => updateEpisodeUrl(idx, e.target.value)}
                      placeholder="URL del video..."
                      className="flex-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-zinc-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Estás seguro de que deseas eliminar permanentemente "${movie.title}"?`)) {
                    onDelete(movie);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar {movie.contentType === 'series' ? 'Serie' : 'Película'}</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-950/60 transition-all hover:scale-102"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
);
};
