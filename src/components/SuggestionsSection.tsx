import React, { useState, useMemo } from 'react';
import {
  ThumbsUp,
  PlusCircle,
  CheckCircle2,
  Dices,
  Play,
  TrendingUp,
  MessageSquarePlus,
  ShieldCheck,
  Lock,
  Unlock,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { Movie, MovieSuggestion } from '../types';

interface SuggestionsSectionProps {
  movies: Movie[];
  suggestions: MovieSuggestion[];
  onAddSuggestion: (suggestion: Omit<MovieSuggestion, 'id' | 'votes' | 'date' | 'voters'>) => void;
  onVoteSuggestion: (id: string) => void;
  onDeleteSuggestion?: (id: string) => void;
  onUpdateStatus?: (id: string, status: MovieSuggestion['status']) => void;
  onPlayMovie: (movie: Movie) => void;
  onOpenDetail: (movie: Movie) => void;
  userVotedIds: string[];
}

export const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({
  movies,
  suggestions,
  onAddSuggestion,
  onVoteSuggestion,
  onDeleteSuggestion,
  onUpdateStatus,
  onPlayMovie,
  onOpenDetail,
  userVotedIds,
}) => {
  const [subTab, setSubTab] = useState<'buzon' | 'ruleta'>('buzon');

  // Admin Mode state (only for Thiago to view who sent what or moderate)
  const [isAdminMode, setIsAdminMode] = useState(() => {
    return localStorage.getItem('cinestream_admin_mode') === 'true';
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);

  // Form state for new anonymous suggestion
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'movie' | 'series' | 'anime' | 'documental'>('movie');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState<string>('');
  const [reason, setReason] = useState('');
  const [privateSenderNote, setPrivateSenderNote] = useState('');

  // Filter & Search state for suggestions list
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'series' | 'available'>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'recent'>('votes');
  const [searchFilter, setSearchFilter] = useState('');

  // Roulette state
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [rouletteResult, setRouletteResult] = useState<Movie | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);

  // Admin Unlock logic
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = adminPinInput.trim().toLowerCase();
    // Clave de administrador configurada para Thiago: 2839
    if (pin === '2839') {
      setIsAdminMode(true);
      localStorage.setItem('cinestream_admin_mode', 'true');
      setIsAdminModalOpen(false);
      setAdminPinInput('');
      setAdminPinError(null);
    } else {
      setAdminPinError('Clave incorrecta. Solo el administrador (Thiago) puede acceder.');
    }
  };

  const handleToggleAdminMode = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
      localStorage.removeItem('cinestream_admin_mode');
    } else {
      setIsAdminModalOpen(true);
    }
  };

  // Submit anonymous suggestion
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const now = new Date();
    const timestampStr = now.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const privateDetail = privateSenderNote.trim()
      ? `Nota/Contacto: "${privateSenderNote.trim()}" (Enviado: ${timestampStr})`
      : `Envío anónimo estándar (${timestampStr})`;

    onAddSuggestion({
      title: title.trim(),
      contentType,
      genre: genre.trim() || 'General',
      year: year ? parseInt(year, 10) : undefined,
      reason: reason.trim(),
      suggestedBy: 'Anónimo',
      senderDetails: privateDetail,
      isAnonymous: true,
      userAvatar: '🔒',
      status: 'pending',
    });

    // Reset form
    setTitle('');
    setGenre('');
    setYear('');
    setReason('');
    setPrivateSenderNote('');
    setIsFormOpen(false);
  };

  // Filtered and sorted suggestions (ignoring any mock suggestions with ids sug-1..4)
  const displayedSuggestions = useMemo(() => {
    const mockIds = new Set(['sug-1', 'sug-2', 'sug-3', 'sug-4']);
    return suggestions
      .filter((s) => {
        if (mockIds.has(s.id)) return false;
        if (filterType === 'available') return s.status === 'available';
        if (filterType !== 'all' && s.contentType !== filterType) return false;
        if (searchFilter.trim()) {
          const q = searchFilter.toLowerCase();
          return (
            s.title.toLowerCase().includes(q) ||
            (s.genre && s.genre.toLowerCase().includes(q)) ||
            (s.reason && s.reason.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'votes') return b.votes - a.votes;
        return 0;
      });
  }, [suggestions, filterType, searchFilter, sortBy]);

  // Spin Roulette
  const spinRoulette = () => {
    if (movies.length === 0 || isSpinning) return;
    setIsSpinning(true);

    let candidates = movies;
    if (selectedMood === 'action') {
      candidates = movies.filter(
        (m) => m.genres.includes('Acción') || m.genres.includes('Aventura')
      );
    } else if (selectedMood === 'scifi') {
      candidates = movies.filter((m) => m.genres.includes('Ciencia Ficción'));
    } else if (selectedMood === 'drama') {
      candidates = movies.filter(
        (m) => m.genres.includes('Drama') || m.genres.includes('Suspenso')
      );
    } else if (selectedMood === 'animation') {
      candidates = movies.filter((m) => m.genres.includes('Animación'));
    } else if (selectedMood === 'top') {
      candidates = [...movies].sort((a, b) => b.rating - a.rating).slice(0, 10);
    }

    if (candidates.length === 0) candidates = movies;

    let counter = 0;
    const interval = setInterval(() => {
      const randomIdx = Math.floor(Math.random() * candidates.length);
      setRouletteResult(candidates[randomIdx]);
      counter++;
      if (counter > 14) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 110);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-8 animate-fade-in">
      {/* Top Header & Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white flex items-center gap-2">
              <span>Sugerencias & Peticiones</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>100% Anónimas</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Pide películas o series que te gustaría ver en CineStream de forma completamente anónima.
          </p>
        </div>

        {/* Subtabs + Admin Mode Access */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subtab Buttons */}
          <div className="bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setSubTab('buzon')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                subTab === 'buzon'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Buzón de Peticiones ({displayedSuggestions.length})
            </button>
            <button
              onClick={() => setSubTab('ruleta')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                subTab === 'ruleta'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Ruleta "¿Qué ver hoy?"</span>
            </button>
          </div>

          {/* Admin Toggle Button */}
          <button
            onClick={handleToggleAdminMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              isAdminMode
                ? 'bg-amber-950/50 border-amber-500/50 text-amber-300 hover:bg-amber-900/60 shadow-md'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title={
              isAdminMode
                ? 'Modo Administrador activado (Haz clic para salir)'
                : 'Acceso exclusivo para Thiago (Ver remitentes y moderar)'
            }
          >
            {isAdminMode ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin (Thiago)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Acceso Creador</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Admin Mode Active Alert Banner */}
      {isAdminMode && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold block text-sm text-amber-300">
                👑 Modo Administrador Activo (Thiago)
              </span>
              <span className="text-amber-200/80">
                Solo tú puedes ver los detalles y notas privadas de quién envió cada sugerencia, cambiar estados y eliminarlas. Para los usuarios normales todo es 100% anónimo.
              </span>
            </div>
          </div>
          <button
            onClick={handleToggleAdminMode}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 shrink-0 transition-colors"
          >
            Cerrar Modo Admin
          </button>
        </div>
      )}

      {/* SUB-TAB 1: BUZÓN ANÓNIMO DE PETICIONES */}
      {subTab === 'buzon' && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Filters, New Suggestion Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar sugerencias por título, género o tema..."
                className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
              />
              <span className="absolute left-3 top-2.5 text-zinc-500 text-xs">🔍</span>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <div className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl flex items-center text-xs">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filterType === 'all' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterType('movie')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filterType === 'movie' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Películas
                </button>
                <button
                  onClick={() => setFilterType('series')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filterType === 'series' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Series
                </button>
                <button
                  onClick={() => setFilterType('available')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filterType === 'available'
                      ? 'bg-emerald-900/60 text-emerald-300 font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Disponibles
                </button>
              </div>

              <button
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-950/40 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Pedir Película / Serie</span>
              </button>
            </div>
          </div>

          {/* Form to submit a new anonymous suggestion (Collapsible) */}
          {isFormOpen && (
            <form
              onSubmit={handleSubmit}
              className="bg-zinc-900 border border-rose-500/30 rounded-3xl p-6 sm:p-7 space-y-4 animate-fade-in shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <MessageSquarePlus className="w-4 h-4" />
                  <span>Proponer nuevo título a CineStream</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Envío Anónimo</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>

              {/* Privacy Notice Banner */}
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-zinc-300">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  🔒
                </div>
                <div>
                  <span className="font-semibold text-white block">
                    Tu petición se publicará de manera 100% anónima.
                  </span>
                  <span className="text-zinc-400 text-[11px]">
                    No se mostrará tu nombre, cuenta ni avatar a los demás usuarios. Si deseas dejar una firma o contacto que solo pueda ver el administrador, puedes usar el campo privado opcional.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Title */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Título de la película o serie <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ej. Oppenheimer, The Last of Us, Naruto..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Content Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Tipo de contenido</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="movie">🎬 Película</option>
                    <option value="series">📺 Serie de TV</option>
                    <option value="anime">⚡ Anime</option>
                    <option value="documental">🌍 Documental</option>
                  </select>
                </div>

                {/* Estimated Year */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Año de estreno (Opcional)</label>
                  <input
                    type="number"
                    min="1900"
                    max="2035"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="Ej. 2023"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Genre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Género principal (Opcional)</label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Ej. Ciencia Ficción, Terror, Comedia, Aventura..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* Optional private sender note (only visible to Thiago in admin mode) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>Firma / Nota privada (Opcional)</span>
                    <span className="text-[10px] text-amber-400 font-medium">Solo visible para Thiago</span>
                  </label>
                  <input
                    type="text"
                    value={privateSenderNote}
                    onChange={(e) => setPrivateSenderNote(e.target.value)}
                    placeholder="Ej. De Juan / @tu_usuario (si quieres que solo el admin sepa quién eres)"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Reason / Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  ¿Por qué recomiendas agregarla? (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Escribe por qué vale la pena verla o por qué te gustaría que esté en CineStream..."
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-zinc-500">
                  🔒 Tu propuesta se publicará automáticamente en el buzón.
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-950/50 transition-all active:scale-95 cursor-pointer"
                  >
                    Enviar Sugerencia Anónima
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Suggestions List */}
          {displayedSuggestions.length === 0 ? (
            <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center mx-auto text-2xl">
                💡
              </div>
              <h3 className="text-lg font-bold text-white">No hay sugerencias todavía</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Sé el primero en proponer una película o serie de forma 100% anónima para la comunidad de CineStream.
              </p>
              <button
                onClick={() => setIsFormOpen(true)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all"
              >
                + Proponer Título Anónimamente
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedSuggestions.map((sug) => {
                const hasVoted = userVotedIds.includes(sug.id);

                // Check if this suggested title already exists in CineStream
                const matchedMovie = movies.find(
                  (m) => m.title.toLowerCase() === sug.title.toLowerCase()
                );

                return (
                  <div
                    key={sug.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all ${
                      sug.status === 'available' || matchedMovie
                        ? 'bg-zinc-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : 'bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top status & tags */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] font-bold uppercase tracking-wider">
                            {sug.contentType === 'series'
                              ? '📺 Serie'
                              : sug.contentType === 'anime'
                              ? '⚡ Anime'
                              : sug.contentType === 'documental'
                              ? '🌍 Doc'
                              : '🎬 Película'}
                          </span>
                          {sug.year && (
                            <span className="text-[11px] text-zinc-400 font-medium">({sug.year})</span>
                          )}
                        </div>

                        {/* Status Badge */}
                        {sug.status === 'available' || matchedMovie ? (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Disponible</span>
                          </span>
                        ) : sug.status === 'accepted' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/50 text-purple-300 text-[10px] font-bold">
                            ✨ Aceptada
                          </span>
                        ) : sug.status === 'reviewing' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-sky-950/80 border border-sky-500/50 text-sky-300 text-[10px] font-bold">
                            👀 En revisión
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                            💡 Propuesta
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition-colors">
                          {sug.title}
                        </h3>
                        {sug.genre && (
                          <span className="text-[11px] text-rose-400/80 font-medium block mt-0.5">
                            {sug.genre}
                          </span>
                        )}
                      </div>

                      {/* Reason / Quote */}
                      {sug.reason && (
                        <p className="text-xs text-zinc-300 italic bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 leading-relaxed">
                          «{sug.reason}»
                        </p>
                      )}

                      {/* Admin-Exclusive Info Panel (Visible only when Thiago is in Admin Mode) */}
                      {isAdminMode && (
                        <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-2.5 space-y-2 text-[11px] text-amber-200 animate-fade-in">
                          <div className="flex items-center justify-between gap-1 text-amber-400 font-bold">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detalle Privado (Admin)</span>
                            </span>
                            {onDeleteSuggestion && (
                              <button
                                onClick={() => onDeleteSuggestion(sug.id)}
                                className="text-rose-400 hover:text-rose-300 p-1 hover:bg-rose-950/50 rounded transition-colors"
                                title="Eliminar sugerencia"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-zinc-300 font-mono text-[10px] break-all bg-black/40 p-1.5 rounded border border-zinc-800">
                            {sug.senderDetails || 'Envío 100% anónimo (sin notas privadas)'}
                          </p>
                          {onUpdateStatus && (
                            <div className="flex items-center gap-1 pt-1">
                              <span className="text-zinc-400 text-[10px]">Estado:</span>
                              {(['pending', 'reviewing', 'accepted', 'available'] as const).map(
                                (st) => (
                                  <button
                                    key={st}
                                    onClick={() => onUpdateStatus(sug.id, st)}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      sug.status === st
                                        ? 'bg-amber-500 text-zinc-950'
                                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                                    }`}
                                  >
                                    {st === 'pending'
                                      ? 'Pendiente'
                                      : st === 'reviewing'
                                      ? 'Revisión'
                                      : st === 'accepted'
                                      ? 'Aceptada'
                                      : 'Disponible'}
                                  </button>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom: Anonymous Proposer info & Vote / Watch button */}
                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-xs">
                          🔒
                        </span>
                        <div>
                          <span className="block text-xs font-semibold text-zinc-300">
                            Anónimo
                          </span>
                          <span className="block text-[10px] text-zinc-500">{sug.date}</span>
                        </div>
                      </div>

                      {/* If available, button to play */}
                      {matchedMovie ? (
                        <button
                          onClick={() => onPlayMovie(matchedMovie)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Ver</span>
                        </button>
                      ) : (
                        /* Vote button */
                        <button
                          onClick={() => onVoteSuggestion(sug.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                            hasVoted
                              ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-950/50'
                              : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                          }`}
                          title={hasVoted ? 'Ya votaste por esta sugerencia' : 'Votar por esta sugerencia'}
                        >
                          <ThumbsUp className={`w-3.5 h-3.5 ${hasVoted ? 'fill-white' : ''}`} />
                          <span>{sug.votes}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: RULETA Y RECOMENDACIONES ("¿QUÉ VER HOY?") */}
      {subTab === 'ruleta' && (
        <div className="space-y-8">
          {/* Interactive Roulette Card */}
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-rose-950/30 border border-zinc-800 rounded-3xl p-6 sm:p-10 space-y-6 shadow-2xl">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-lg">
                🎲
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Ruleta de Sugerencias
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Selecciona tu estado de ánimo o género preferido y gira la ruleta para recibir una
                recomendación instantánea del catálogo.
              </p>
            </div>

            {/* Mood selector pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
              {[
                { id: 'all', label: '🎲 Sorpréndeme' },
                { id: 'action', label: '💥 Pura Acción' },
                { id: 'scifi', label: '🚀 Ciencia Ficción' },
                { id: 'drama', label: '🎭 Drama & Intriga' },
                { id: 'animation', label: '🎨 Animación' },
                { id: 'top', label: '⭐ Mejor Calificadas' },
              ].map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedMood === mood.id
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/60 scale-105'
                      : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                  }`}
                >
                  {mood.label}
                </button>
              ))}
            </div>

            {/* Spin Button */}
            <div className="flex justify-center pt-2">
              <button
                onClick={spinRoulette}
                disabled={isSpinning || movies.length === 0}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-rose-700 hover:from-amber-400 hover:to-rose-600 text-white font-black text-sm sm:text-base flex items-center gap-3 shadow-xl shadow-rose-950/60 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Dices className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
                <span>{isSpinning ? 'Girando ruleta...' : '¡Girar Ruleta!'}</span>
              </button>
            </div>

            {/* Result Display */}
            {rouletteResult && (
              <div className="max-w-xl mx-auto mt-6 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 items-center animate-fade-in shadow-2xl">
                <img
                  src={rouletteResult.posterUrl}
                  alt={rouletteResult.title}
                  className="w-28 sm:w-32 aspect-2/3 object-cover rounded-xl shadow-md shrink-0 border border-zinc-800"
                />

                <div className="space-y-2 flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-600/30 text-rose-300 text-[10px] font-bold">
                      {rouletteResult.contentType === 'series' ? 'Serie' : 'Película'}
                    </span>
                    <span className="text-xs font-semibold text-zinc-400">
                      {rouletteResult.year} • {rouletteResult.duration} min
                    </span>
                    <span className="text-xs font-bold text-amber-400">
                      ★ {rouletteResult.rating.toFixed(1)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white">{rouletteResult.title}</h3>

                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {rouletteResult.synopsis}
                  </p>

                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                    <button
                      onClick={() => onPlayMovie(rouletteResult)}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/50 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Reproducir</span>
                    </button>
                    <button
                      onClick={() => onOpenDetail(rouletteResult)}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs cursor-pointer"
                    >
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Top 4 Recommended from catalog */}
          {movies.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                <h3 className="text-lg font-bold text-white">
                  Sugerencias Más Populares del Catálogo
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {movies.slice(0, 4).map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => onOpenDetail(movie)}
                    className="group bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="aspect-2/3 relative overflow-hidden bg-zinc-950">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-amber-400 font-bold text-[11px] flex items-center gap-1">
                        ★ {movie.rating.toFixed(1)}
                      </div>
                    </div>

                    <div className="p-3 space-y-1">
                      <h4 className="font-bold text-xs text-white line-clamp-1 group-hover:text-rose-400 transition-colors">
                        {movie.title}
                      </h4>
                      <span className="text-[10px] text-zinc-400 block">
                        {movie.genres.slice(0, 2).join(' • ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Mode PIN Unlock Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Acceso Administrador (Thiago)</span>
              </div>
              <button
                onClick={() => {
                  setIsAdminModalOpen(false);
                  setAdminPinError(null);
                }}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Introduce tu clave de creador para ver quién mandó cada sugerencia (detalles privados), moderar o cambiar estados:
            </p>

            <form onSubmit={handleUnlockAdmin} className="space-y-3">
              <input
                type="password"
                autoFocus
                value={adminPinInput}
                onChange={(e) => {
                  setAdminPinInput(e.target.value);
                  setAdminPinError(null);
                }}
                placeholder="Clave de administrador..."
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />

              {adminPinError && (
                <p className="text-xs text-rose-400 font-medium">{adminPinError}</p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminModalOpen(false);
                    setAdminPinError(null);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition-all shadow-md active:scale-95"
                >
                  Entrar como Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
