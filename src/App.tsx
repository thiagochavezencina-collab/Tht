import React, { useState, useEffect, useMemo } from 'react';
import {
  Film,
  Search,
  Bookmark,
  Clapperboard,
  Sparkles,
  SlidersHorizontal,
  Flame,
  Clock,
  Star,
  PlusCircle,
  Play,
  CheckCircle2,
  Trash2,
  HelpCircle,
  Tv
} from 'lucide-react';
import { Movie, WatchProgress, UserReview } from './types';
import { INITIAL_MOVIES, INITIAL_REVIEWS, GENRES } from './data/movies';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryRow } from './components/CategoryRow';
import { MovieCard } from './components/MovieCard';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { MiniPlayer } from './components/MiniPlayer';
import { MovieDetailModal } from './components/MovieDetailModal';
import { AddMovieModal } from './components/AddMovieModal';
import { EditMovieModal } from './components/EditMovieModal';
import {
  saveMovieToFirestore,
  updateMovieInFirestore,
  deleteMovieFromFirestore,
  getCustomMoviesFromFirestore,
  subscribeToCustomMovies,
  saveReviewToFirestore,
  subscribeToReviews,
} from './firestoreService';
import { deleteVideoBlob } from './utils/videoStorage';

export default function App() {
  // Cloud custom movies synced via Firestore
  const [firestoreMovies, setFirestoreMovies] = useState<Movie[]>([]);

  // Persistence states
  const [movies, setMovies] = useState<Movie[]>(() => {
    try {
      const saved = localStorage.getItem('cinestream_custom_movies');
      if (saved) {
        const custom = JSON.parse(saved);
        if (Array.isArray(custom)) {
          // Exclude any old sample movies if saved
          const filtered = custom.filter(
            (m: Movie) =>
              m &&
              m.id &&
              !['sintel', 'big-buck-bunny', 'tears-of-steel', 'cosmos-laundromat', 'night-living-dead', 'elephants-dream', 'serie-cyberpunk', 'serie-leyendas-animadas'].includes(m.id)
          );
          return filtered;
        }
      }
    } catch {}
    return [];
  });

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cinestream_watchlist');
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          return list.filter((id) => !['sintel', 'night-living-dead', 'big-buck-bunny'].includes(id));
        }
      }
    } catch {}
    return [];
  });

  const [watchProgressMap, setWatchProgressMap] = useState<Record<string, WatchProgress>>(() => {
    try {
      const saved = localStorage.getItem('cinestream_progress');
      if (saved) {
        const map = JSON.parse(saved);
        delete map['sintel'];
        delete map['night-living-dead'];
        return map;
      }
    } catch {}
    return {};
  });

  const [reviewsMap, setReviewsMap] = useState<Record<string, UserReview[]>>(() => {
    try {
      const saved = localStorage.getItem('cinestream_reviews');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_REVIEWS;
  });

  // Deleted movies tracking (persists removals of both custom and catalog items)
  const [deletedMovieIds, setDeletedMovieIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cinestream_deleted_ids');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // User feedback toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4500);
  };

  // Navigation & Filter states
  const [activeTab, setActiveTab] = useState<'inicio' | 'peliculas' | 'series' | 'mi-lista' | 'historial'>('inicio');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Todos');
  const [sortBy, setSortBy] = useState<'rating' | 'year' | 'duration' | 'views'>('rating');

  // Modal / Playback states
  const [activePlayerMovie, setActivePlayerMovie] = useState<Movie | null>(null);
  const [miniPlayerMovie, setMiniPlayerMovie] = useState<Movie | null>(null);
  const [detailModalMovie, setDetailModalMovie] = useState<Movie | null>(null);
  const [isAddMovieModalOpen, setIsAddMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Manual or automatic Cloud Sync trigger
  const handleManualSync = async () => {
    try {
      const cloudMovies = await getCustomMoviesFromFirestore();
      if (cloudMovies.length > 0) {
        setFirestoreMovies(cloudMovies);
      }
      showToast(`☁️ Sincronización en la nube completa (${cloudMovies.length} títulos en la nube)`);
    } catch {
      showToast('⚠️ No se pudo conectar a la nube en este momento');
    }
  };

  // Cloud Firestore Sync: Direct Fetch + Real-Time Listener + LocalStorage Auto-Sync
  useEffect(() => {
    // 1. Immediate fetch from Cloud Firestore
    getCustomMoviesFromFirestore().then((cloudMovies) => {
      if (cloudMovies.length > 0) {
        setFirestoreMovies(cloudMovies);
      }
    });

    // 2. Real-time subscription for instant updates across devices (phone <-> laptop)
    const unsubscribeMovies = subscribeToCustomMovies((cloudMovies) => {
      setFirestoreMovies(cloudMovies);
    });

    // 3. Auto-sync previously added local movies to Cloud Firestore so they become available cross-device!
    try {
      const saved = localStorage.getItem('cinestream_custom_movies');
      if (saved) {
        const localList: Movie[] = JSON.parse(saved);
        if (Array.isArray(localList) && localList.length > 0) {
          localList.forEach((m) => {
            saveMovieToFirestore(m).catch(() => {});
          });
        }
      }
    } catch {}

    const unsubscribeReviews = subscribeToReviews((cloudReviews) => {
      setReviewsMap((prev) => {
        const merged = { ...prev };
        Object.entries(cloudReviews).forEach(([movieId, revs]) => {
          const existing = merged[movieId] || [];
          const existingIds = new Set(existing.map((r) => r.id));
          const newOnes = revs.filter((r) => !existingIds.has(r.id));
          merged[movieId] = [...newOnes, ...existing];
        });
        return merged;
      });
    });

    return () => {
      unsubscribeMovies();
      unsubscribeReviews();
    };
  }, []);

  // Merge base/local movies with Firestore cloud movies, excluding deleted items
  const allMovies = useMemo(() => {
    const deletedSet = new Set(deletedMovieIds);
    const movieMap = new Map<string, Movie>();
    // Start with catalog movies to ensure base library is always active
    INITIAL_MOVIES.forEach((m) => {
      if (!deletedSet.has(m.id)) movieMap.set(m.id, m);
    });
    // Overlay local/custom movies
    movies.forEach((m) => {
      if (!deletedSet.has(m.id)) movieMap.set(m.id, m);
    });
    // Overlay real-time cloud movies from Firestore
    firestoreMovies.forEach((m) => {
      if (!deletedSet.has(m.id)) movieMap.set(m.id, m);
    });
    return Array.from(movieMap.values());
  }, [movies, firestoreMovies, deletedMovieIds]);

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('cinestream_watchlist', JSON.stringify(watchlist));
    } catch {}
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem('cinestream_progress', JSON.stringify(watchProgressMap));
    } catch {}
  }, [watchProgressMap]);

  useEffect(() => {
    try {
      localStorage.setItem('cinestream_reviews', JSON.stringify(reviewsMap));
    } catch {}
  }, [reviewsMap]);

  // Handler: Watchlist Toggle
  const toggleBookmark = (movieId: string) => {
    setWatchlist((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };

  // Handler: Add Custom Movie
  const handleAddMovie = async (newMovie: Movie) => {
    setMovies((prev) => [newMovie, ...prev]);
    try {
      const customSaved = localStorage.getItem('cinestream_custom_movies');
      const list = customSaved ? JSON.parse(customSaved) : [];
      localStorage.setItem('cinestream_custom_movies', JSON.stringify([newMovie, ...list]));
    } catch {}

    // Save to Cloud Firestore for cross-session and real-time syncing across all devices
    try {
      await saveMovieToFirestore(newMovie);
      showToast(`☁️ ¡"${newMovie.title}" guardada y sincronizada en la nube! Visible en tu laptop y móvil.`);
    } catch (err) {
      console.warn('Could not sync movie to cloud Firestore, kept in local storage:', err);
      showToast(`💾 Guardada localmente en este dispositivo.`);
    }

    // Automatically launch the player for the added movie!
    setActivePlayerMovie(newMovie);
    setMiniPlayerMovie(null);
  };

  // Handler: Open Edit Movie
  const handleOpenEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setIsEditModalOpen(true);
  };

  // Handler: Save Edited Movie
  const handleSaveEditedMovie = async (updated: Movie) => {
    // 1. Update in local movies state
    setMovies((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));

    // 2. Update in localStorage
    try {
      const customSaved = localStorage.getItem('cinestream_custom_movies');
      const list = customSaved ? JSON.parse(customSaved) : [];
      const updatedList = list.some((m: Movie) => m.id === updated.id)
        ? list.map((m: Movie) => (m.id === updated.id ? updated : m))
        : [updated, ...list];
      localStorage.setItem('cinestream_custom_movies', JSON.stringify(updatedList));
    } catch {}

    // 3. Update in Cloud Firestore
    try {
      await updateMovieInFirestore(updated.id, updated);
      showToast(`✏️ ¡"${updated.title}" actualizada y sincronizada en la nube!`);
    } catch (err) {
      console.warn('Could not update movie in Firestore:', err);
      showToast(`✏️ Cambios guardados localmente.`);
    }

    // 4. Update modals and active player if open
    if (detailModalMovie?.id === updated.id) {
      setDetailModalMovie(updated);
    }
    if (activePlayerMovie?.id === updated.id) {
      setActivePlayerMovie(updated);
    }
    if (miniPlayerMovie?.id === updated.id) {
      setMiniPlayerMovie(updated);
    }
  };

  // Handler: Delete Movie or Series
  const handleDeleteMovie = async (movieToDelete: Movie) => {
    // 1. Track deleted id in state and localStorage
    setDeletedMovieIds((prev) => {
      const next = [...prev, movieToDelete.id];
      try {
        localStorage.setItem('cinestream_deleted_ids', JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Remove from local movies state
    setMovies((prev) => prev.filter((m) => m.id !== movieToDelete.id));

    // 3. Remove from localStorage
    try {
      const customSaved = localStorage.getItem('cinestream_custom_movies');
      if (customSaved) {
        const list = JSON.parse(customSaved);
        if (Array.isArray(list)) {
          const updatedList = list.filter((m: Movie) => m.id !== movieToDelete.id);
          localStorage.setItem('cinestream_custom_movies', JSON.stringify(updatedList));
        }
      }
    } catch {}

    // 4. Remove from watchlist and progress if exists
    setWatchlist((prev) => prev.filter((id) => id !== movieToDelete.id));
    setWatchProgressMap((prev) => {
      const next = { ...prev };
      delete next[movieToDelete.id];
      return next;
    });

    // 5. Clean up local video file in IndexedDB
    deleteVideoBlob(movieToDelete.id);
    if (movieToDelete.episodes) {
      movieToDelete.episodes.forEach((ep) => deleteVideoBlob(ep.id));
    }

    // 6. Delete from Cloud Firestore
    try {
      await deleteMovieFromFirestore(movieToDelete.id);
      showToast(`🗑️ "${movieToDelete.title}" eliminada de la nube y tu catálogo.`);
    } catch (err) {
      console.warn('Could not delete movie from Firestore:', err);
      showToast(`🗑️ "${movieToDelete.title}" eliminada.`);
    }

    // 7. Close modals or player if it was that movie
    if (detailModalMovie?.id === movieToDelete.id) {
      setDetailModalMovie(null);
    }
    if (activePlayerMovie?.id === movieToDelete.id) {
      setActivePlayerMovie(null);
    }
    if (miniPlayerMovie?.id === movieToDelete.id) {
      setMiniPlayerMovie(null);
    }
    if (editingMovie?.id === movieToDelete.id) {
      setEditingMovie(null);
      setIsEditModalOpen(false);
    }
  };

  // Handler: Add Review
  const handleAddReview = async (movieId: string, rating: number, comment: string) => {
    const newRev: UserReview = {
      id: `rev-${Date.now()}`,
      movieId,
      userName: 'Tú',
      userAvatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      rating,
      comment,
      date: 'Ahora mismo',
    };
    setReviewsMap((prev) => ({
      ...prev,
      [movieId]: [newRev, ...(prev[movieId] || [])],
    }));

    // Save review to Cloud Firestore
    try {
      await saveReviewToFirestore(newRev);
    } catch (err) {
      console.warn('Could not sync review to Firestore:', err);
    }
  };

  // Handler: Progress Update from player
  const handleProgressUpdate = (movieId: string, currentTime: number, duration: number) => {
    if (currentTime <= 1) return;
    setWatchProgressMap((prev) => ({
      ...prev,
      [movieId]: {
        movieId,
        currentTime,
        duration: duration || 0,
        lastWatched: Date.now(),
        completed: duration > 0 && currentTime / duration > 0.92,
      },
    }));
  };

  // Featured movie (e.g., Sintel or first in list)
  const featuredMovie = allMovies.find((m) => m.isFeatured) || allMovies[0];

  // Continue Watching Movies
  const continueWatchingList = useMemo(() => {
    return (Object.values(watchProgressMap) as WatchProgress[])
      .filter((p) => p.currentTime > 5 && !p.completed)
      .sort((a, b) => b.lastWatched - a.lastWatched)
      .map((p) => allMovies.find((m) => m.id === p.movieId))
      .filter((m): m is Movie => Boolean(m));
  }, [watchProgressMap, allMovies]);

  // Filtered & Sorted movies
  const filteredMovies = useMemo(() => {
    let result = [...allMovies];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          (m.originalTitle && m.originalTitle.toLowerCase().includes(q)) ||
          m.director.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q)) ||
          m.cast.some((c) => c.toLowerCase().includes(q))
      );
    } else if (selectedGenre !== 'Todos') {
      result = result.filter((m) => m.genres.includes(selectedGenre));
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'duration') return b.duration - a.duration;
      if (sortBy === 'views') return b.viewsCount - a.viewsCount;
      return 0;
    });

    return result;
  }, [allMovies, searchQuery, selectedGenre, sortBy]);

  // Watchlist movies
  const watchlistMovies = useMemo(() => {
    return allMovies.filter((m) => watchlist.includes(m.id));
  }, [allMovies, watchlist]);

  // Series list
  const seriesList = useMemo(() => {
    return allMovies.filter((m) => m.contentType === 'series');
  }, [allMovies]);

  // Only Movies list (excluding series for peliculas tab)
  const moviesOnlyList = useMemo(() => {
    return allMovies.filter((m) => m.contentType !== 'series');
  }, [allMovies]);

  // Filtered movies only for Peliculas tab
  const filteredMoviesOnly = useMemo(() => {
    let result = [...moviesOnlyList];
    if (selectedGenre !== 'Todos') {
      result = result.filter((m) => m.genres.includes(selectedGenre));
    }
    result.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'year') return b.year - a.year;
      if (sortBy === 'duration') return b.duration - a.duration;
      if (sortBy === 'views') return b.viewsCount - a.viewsCount;
      return 0;
    });
    return result;
  }, [moviesOnlyList, selectedGenre, sortBy]);

  // Category rows for 'Inicio'
  const sciFiMovies = useMemo(
    () => allMovies.filter((m) => m.genres.includes('Ciencia Ficción')),
    [allMovies]
  );
  const animationMovies = useMemo(
    () => allMovies.filter((m) => m.genres.includes('Animación')),
    [allMovies]
  );
  const classicMovies = useMemo(
    () => allMovies.filter((m) => m.genres.includes('Clásicos del Cine') || m.genres.includes('Terror')),
    [allMovies]
  );
  const actionMovies = useMemo(
    () => allMovies.filter((m) => m.genres.includes('Acción') || m.genres.includes('Aventura')),
    [allMovies]
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        watchlistCount={watchlist.length}
        onOpenAddMovie={() => setIsAddMovieModalOpen(true)}
        cloudMoviesCount={firestoreMovies.length}
        onSyncCloud={handleManualSync}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        {/* Search Results Display */}
        {searchQuery.trim() ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl sm:text-2xl font-bold font-['Outfit'] flex items-center gap-2">
                <Search className="w-5 h-5 text-rose-500" />
                <span>Resultados para: "{searchQuery}"</span>
              </h1>
              <span className="text-xs text-zinc-400">
                {filteredMovies.length} encontradas
              </span>
            </div>

            {filteredMovies.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/80 p-8 max-w-lg mx-auto">
                <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">
                  No encontramos ninguna película con ese criterio
                </h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Intenta buscar por título, director, actor o género, o carga tu propia película.
                </p>
                <button
                  onClick={() => setIsAddMovieModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Cargar Película Personalizada</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onPlay={(m) => {
                      setActivePlayerMovie(m);
                      setMiniPlayerMovie(null);
                    }}
                    onOpenDetails={(m) => setDetailModalMovie(m)}
                    isBookmarked={watchlist.includes(movie.id)}
                    onToggleBookmark={toggleBookmark}
                    progress={watchProgressMap[movie.id]}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteMovie}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'inicio' ? (
          /* TAB: INICIO */
          <>
            {/* Hero Billboard or Clean Empty Welcome */}
            {featuredMovie ? (
              <>
                <HeroBanner
                  movie={featuredMovie}
                  onPlay={(m) => {
                    setActivePlayerMovie(m);
                    setMiniPlayerMovie(null);
                  }}
                  onOpenDetails={(m) => setDetailModalMovie(m)}
                  isBookmarked={watchlist.includes(featuredMovie.id)}
                  onToggleBookmark={toggleBookmark}
                />

                {/* Quick Player Bar Info Banner */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20">
                  <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800/90 rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                        <Tv className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">
                          Reproductor Integrado de Alta Definición
                        </span>
                        <span className="text-xs text-zinc-400">
                          Disfruta de películas y series completas con subtítulos y modo cine
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setActivePlayerMovie(featuredMovie);
                          setMiniPlayerMovie(null);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Ver Destacada</span>
                      </button>
                      <button
                        onClick={() => setIsAddMovieModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all border border-zinc-700"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Subir Película o Serie</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-rose-950/60">
                  <Tv className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-black font-['Outfit'] text-white mb-3">
                  Tu Catálogo de Cine y Series Personalizado
                </h1>
                <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
                  No hay películas o series por defecto. Sube tus películas o series favoritas por enlace de video directo o archivo local para que se sincronicen y se reproduzcan en la aplicación.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={() => setIsAddMovieModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold shadow-lg shadow-rose-950/60 transition-all hover:scale-105"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Subir Película o Serie Ahora</span>
                  </button>
                </div>
              </div>
            )}

            {/* Continuar Viendo Row (If any movies were watched) */}
            {continueWatchingList.length > 0 && (
              <CategoryRow
                title="Continuar Viendo"
                subtitle="Retoma tus películas exactamente en el segundo donde te quedaste"
                movies={continueWatchingList}
                onPlay={(m) => {
                  setActivePlayerMovie(m);
                  setMiniPlayerMovie(null);
                }}
                onOpenDetails={(m) => setDetailModalMovie(m)}
                watchlist={watchlist}
                onToggleBookmark={toggleBookmark}
                watchProgressMap={watchProgressMap}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteMovie}
              />
            )}

            {/* Curated Categories Rows */}
            <CategoryRow
              title="Populares y Más Vistas"
              subtitle="Las películas preferidas por los cinéfilos en la plataforma"
              movies={[...allMovies].sort((a, b) => b.viewsCount - a.viewsCount)}
              onPlay={(m) => {
                setActivePlayerMovie(m);
                setMiniPlayerMovie(null);
              }}
              onOpenDetails={(m) => setDetailModalMovie(m)}
              watchlist={watchlist}
              onToggleBookmark={toggleBookmark}
              watchProgressMap={watchProgressMap}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteMovie}
            />

            <CategoryRow
              title="Ciencia Ficción y Futuro Distópico"
              subtitle="Ciberpunk, inteligencias artificiales y mundos futuristas"
              movies={sciFiMovies}
              onPlay={(m) => {
                setActivePlayerMovie(m);
                setMiniPlayerMovie(null);
              }}
              onOpenDetails={(m) => setDetailModalMovie(m)}
              watchlist={watchlist}
              onToggleBookmark={toggleBookmark}
              watchProgressMap={watchProgressMap}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteMovie}
            />

            <CategoryRow
              title="Animación y Aventura"
              subtitle="Historias visualmente deslumbrantes para todas las edades"
              movies={animationMovies}
              onPlay={(m) => {
                setActivePlayerMovie(m);
                setMiniPlayerMovie(null);
              }}
              onOpenDetails={(m) => setDetailModalMovie(m)}
              watchlist={watchlist}
              onToggleBookmark={toggleBookmark}
              watchProgressMap={watchProgressMap}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteMovie}
            />

            <CategoryRow
              title="Clásicos del Cine y Suspenso"
              subtitle="Obras maestras legendarias que definieron la historia del cine"
              movies={classicMovies}
              onPlay={(m) => {
                setActivePlayerMovie(m);
                setMiniPlayerMovie(null);
              }}
              onOpenDetails={(m) => setDetailModalMovie(m)}
              watchlist={watchlist}
              onToggleBookmark={toggleBookmark}
              watchProgressMap={watchProgressMap}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteMovie}
            />

            <CategoryRow
              title="Acción, Naturaleza y Velocidad"
              subtitle="Adrenalina pura, pistas desafiantes y expediciones extremas"
              movies={actionMovies}
              onPlay={(m) => {
                setActivePlayerMovie(m);
                setMiniPlayerMovie(null);
              }}
              onOpenDetails={(m) => setDetailModalMovie(m)}
              watchlist={watchlist}
              onToggleBookmark={toggleBookmark}
              watchProgressMap={watchProgressMap}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteMovie}
            />
          </>
        ) : activeTab === 'peliculas' ? (
          /* TAB: CATÁLOGO COMPLETO DE PELÍCULAS */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white">
                  Catálogo Completo de Películas
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Explora películas completas disponibles para reproducción inmediata en tu pantalla
                </p>
              </div>

              {/* Sorting Filter */}
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-semibold text-zinc-400">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
                >
                  <option value="rating">Mayor Calificación ⭐</option>
                  <option value="views">Más Vistas 👁️</option>
                  <option value="year">Más Recientes 📅</option>
                  <option value="duration">Duración ⏱️</option>
                </select>
              </div>
            </div>

            {/* Genre Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGenre === genre
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Grid */}
            {filteredMoviesOnly.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/30 rounded-3xl border border-zinc-800/80 p-8 max-w-md mx-auto">
                <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No hay películas en esta categoría</h3>
                <p className="text-xs text-zinc-400 mb-4">
                  Sé el primero en subir una película a la plataforma.
                </p>
                <button
                  onClick={() => setIsAddMovieModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Subir Película</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredMoviesOnly.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onPlay={(m) => {
                      setActivePlayerMovie(m);
                      setMiniPlayerMovie(null);
                    }}
                    onOpenDetails={(m) => setDetailModalMovie(m)}
                    isBookmarked={watchlist.includes(movie.id)}
                    onToggleBookmark={toggleBookmark}
                    progress={watchProgressMap[movie.id]}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteMovie}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'series' ? (
          /* TAB: SERIES Y EPISODIOS */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white flex items-center gap-2">
                  <Tv className="w-7 h-7 text-rose-500" />
                  <span>Series de Televisión y Temporadas</span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Series con múltiples episodios completos para ver en maratón
                </p>
              </div>

              <button
                onClick={() => setIsAddMovieModalOpen(true)}
                className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-950/40 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Subir Nueva Serie</span>
              </button>
            </div>

            {seriesList.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/80 p-8 max-w-md mx-auto">
                <Tv className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Aún no hay series subidas</h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Puedes subir tu primera serie con todos sus episodios y enlaces de video directamente aquí.
                </p>
                <button
                  onClick={() => setIsAddMovieModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Subir una Serie con Episodios</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {seriesList.map((series) => (
                  <MovieCard
                    key={series.id}
                    movie={series}
                    onPlay={(m) => {
                      setActivePlayerMovie(m);
                      setMiniPlayerMovie(null);
                    }}
                    onOpenDetails={(m) => setDetailModalMovie(m)}
                    isBookmarked={watchlist.includes(series.id)}
                    onToggleBookmark={toggleBookmark}
                    progress={watchProgressMap[series.id]}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteMovie}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'mi-lista' ? (
          /* TAB: MI LISTA */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white flex items-center gap-2">
                  <Bookmark className="w-6 h-6 text-rose-500" />
                  <span>Mi Lista de Películas</span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Películas que has guardado para ver en cualquier momento
                </p>
              </div>
              <span className="text-xs font-semibold text-zinc-400">
                {watchlistMovies.length} {watchlistMovies.length === 1 ? 'guardada' : 'guardadas'}
              </span>
            </div>

            {watchlistMovies.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/80 p-8 max-w-md mx-auto">
                <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">Tu lista está vacía</h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Guarda las películas que te interesen haciendo clic en el icono de marcador para verlas cuando quieras.
                </p>
                <button
                  onClick={() => setActiveTab('peliculas')}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <Film className="w-4 h-4" />
                  <span>Explorar Películas</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {watchlistMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onPlay={(m) => {
                      setActivePlayerMovie(m);
                      setMiniPlayerMovie(null);
                    }}
                    onOpenDetails={(m) => setDetailModalMovie(m)}
                    isBookmarked={true}
                    onToggleBookmark={toggleBookmark}
                    progress={watchProgressMap[movie.id]}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteMovie}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAB: CONTINUAR VIENDO / HISTORIAL */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white flex items-center gap-2">
                  <Clapperboard className="w-6 h-6 text-rose-500" />
                  <span>Continuar Viendo</span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Retoma la reproducción exactamente en el momento donde la dejaste
                </p>
              </div>
              {continueWatchingList.length > 0 && (
                <button
                  onClick={() => setWatchProgressMap({})}
                  className="text-xs text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar historial</span>
                </button>
              )}
            </div>

            {continueWatchingList.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/30 rounded-3xl border border-zinc-800/80 p-8 max-w-md mx-auto">
                <Clock className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">No hay películas en progreso</h3>
                <p className="text-xs text-zinc-400 mb-6">
                  Cuando empieces a reproducir una película, guardaremos tu avance automáticamente aquí.
                </p>
                <button
                  onClick={() => setActiveTab('inicio')}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Empezar a Ver una Película</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {continueWatchingList.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onPlay={(m) => {
                      setActivePlayerMovie(m);
                      setMiniPlayerMovie(null);
                    }}
                    onOpenDetails={(m) => setDetailModalMovie(m)}
                    isBookmarked={watchlist.includes(movie.id)}
                    onToggleBookmark={toggleBookmark}
                    progress={watchProgressMap[movie.id]}
                    onEdit={handleOpenEdit}
                    onDelete={handleDeleteMovie}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-10 mt-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-rose-500" />
            <span className="font-bold text-zinc-300 font-['Outfit']">CineStream</span>
            <span>— Plataforma de Cine y Películas en Pantalla</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span>Películas de Dominio Público & Creative Commons</span>
            <span>•</span>
            <button
              onClick={() => setIsAddMovieModalOpen(true)}
              className="text-rose-400 hover:underline"
            >
              Cargar película
            </button>
          </div>
        </div>
      </footer>

      {/* ACTIVE FULL VIDEO PLAYER MODAL */}
      {activePlayerMovie && (
        <VideoPlayerModal
          movie={activePlayerMovie}
          initialTime={watchProgressMap[activePlayerMovie.id]?.currentTime || 0}
          onClose={() => setActivePlayerMovie(null)}
          onMinimize={() => {
            setMiniPlayerMovie(activePlayerMovie);
            setActivePlayerMovie(null);
          }}
          onSelectMovie={(m) => setActivePlayerMovie(m)}
          allMovies={allMovies}
          onProgressUpdate={handleProgressUpdate}
        />
      )}

      {/* FLOATING MINI-PLAYER (when player minimized) */}
      {miniPlayerMovie && !activePlayerMovie && (
        <MiniPlayer
          movie={miniPlayerMovie}
          currentTime={watchProgressMap[miniPlayerMovie.id]?.currentTime || 0}
          onRestore={() => {
            setActivePlayerMovie(miniPlayerMovie);
            setMiniPlayerMovie(null);
          }}
          onClose={() => setMiniPlayerMovie(null)}
          onProgressUpdate={handleProgressUpdate}
        />
      )}

      {/* MOVIE DETAIL MODAL */}
      {detailModalMovie && (
        <MovieDetailModal
          movie={detailModalMovie}
          onClose={() => setDetailModalMovie(null)}
          onPlay={(m) => {
            setActivePlayerMovie(m);
            setMiniPlayerMovie(null);
          }}
          isBookmarked={watchlist.includes(detailModalMovie.id)}
          onToggleBookmark={toggleBookmark}
          reviews={reviewsMap[detailModalMovie.id] || []}
          onAddReview={handleAddReview}
          progress={watchProgressMap[detailModalMovie.id]}
          onEdit={handleOpenEdit}
          onDelete={handleDeleteMovie}
        />
      )}

      {/* ADD CUSTOM MOVIE MODAL */}
      {isAddMovieModalOpen && (
        <AddMovieModal
          onClose={() => setIsAddMovieModalOpen(false)}
          onAddMovie={handleAddMovie}
        />
      )}

      {/* EDIT MOVIE OR SERIES MODAL */}
      {editingMovie && (
        <EditMovieModal
          isOpen={isEditModalOpen}
          movie={editingMovie}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingMovie(null);
          }}
          onSave={handleSaveEditedMovie}
          onDelete={handleDeleteMovie}
        />
      )}

      {/* Floating Cloud Sync and User Action Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-zinc-900/95 border border-zinc-700 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-black/80 flex items-center gap-3 backdrop-blur-xl animate-fade-in pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-sm shadow-emerald-500/50 animate-pulse" />
          <span className="text-xs sm:text-sm font-medium leading-snug">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
