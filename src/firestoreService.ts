import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Movie, UserReview } from './types';

const CUSTOM_MOVIES_COLLECTION = 'custom_movies';
const REVIEWS_COLLECTION = 'movie_reviews';

/**
 * Recursively cleans an object for Firestore by removing any keys with `undefined` values.
 * Preserves Firestore FieldValues (like serverTimestamp), Dates, arrays, and primitive values.
 */
function sanitizeForFirestore(val: any): any {
  if (val === undefined) {
    return null;
  }
  if (val === null || typeof val !== 'object') {
    return val;
  }
  // If it's a Firestore FieldValue or Date, preserve it directly
  if (val instanceof Date || val._methodName || (val.constructor && val.constructor.name === 'FieldValue')) {
    return val;
  }
  if (Array.isArray(val)) {
    return val
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item));
  }
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    if (v !== undefined) {
      result[k] = sanitizeForFirestore(v);
    }
  }
  return result;
}

/**
 * Prepare movie object for Cloud Firestore:
 * Strips device-specific blob: URLs so they don't break on other devices,
 * while preserving metadata, external streaming links, and local file indicators.
 */
function prepareMovieForFirestore(movie: Movie): Record<string, any> {
  const isBlobVideo = typeof movie.videoUrl === 'string' && movie.videoUrl.startsWith('blob:');
  const safeVideoUrl = isBlobVideo ? '' : movie.videoUrl || '';

  const safeEpisodes = Array.isArray(movie.episodes)
    ? movie.episodes.map((ep) => {
        const isBlobEp = typeof ep.videoUrl === 'string' && ep.videoUrl.startsWith('blob:');
        return {
          id: ep.id,
          title: ep.title || `Episodio ${ep.episodeNumber}`,
          episodeNumber: ep.episodeNumber || 1,
          duration: ep.duration || 45,
          videoUrl: isBlobEp ? '' : ep.videoUrl || '',
          hasLocalFile: isBlobEp || !!ep.hasLocalFile,
          fileName: ep.fileName || '',
          description: ep.description || '',
          thumbnailUrl: ep.thumbnailUrl || '',
        };
      })
    : undefined;

  return {
    ...movie,
    videoUrl: safeVideoUrl,
    hasLocalFile: isBlobVideo || !!movie.hasLocalFile,
    fileName: movie.fileName || '',
    ...(safeEpisodes ? { episodes: safeEpisodes } : {}),
  };
}

/**
 * Save a custom movie to Cloud Firestore for cross-device access (laptop, mobile, etc.).
 */
export async function saveMovieToFirestore(movie: Movie): Promise<void> {
  try {
    const movieRef = doc(db, CUSTOM_MOVIES_COLLECTION, movie.id);
    const prepared = prepareMovieForFirestore(movie);
    const sanitized = sanitizeForFirestore({
      ...prepared,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await setDoc(movieRef, sanitized, { merge: true });
    console.log(`[Firestore] Movie "${movie.title}" successfully synced to Cloud Firestore!`);
  } catch (error) {
    console.error('Error saving movie to Firestore:', error);
    throw error;
  }
}

/**
 * Update a movie's name/title or other fields in Cloud Firestore.
 */
export async function updateMovieInFirestore(movieId: string, updates: Partial<Movie>): Promise<void> {
  try {
    const movieRef = doc(db, CUSTOM_MOVIES_COLLECTION, movieId);
    const sanitized = sanitizeForFirestore({
      ...updates,
      updatedAt: serverTimestamp(),
    });
    await setDoc(movieRef, sanitized, { merge: true });
    console.log(`[Firestore] Movie ID "${movieId}" updated in Cloud Firestore!`);
  } catch (error) {
    console.error('Error updating movie in Firestore:', error);
    throw error;
  }
}

/**
 * Delete a movie or series from Cloud Firestore.
 */
export async function deleteMovieFromFirestore(movieId: string): Promise<void> {
  try {
    const movieRef = doc(db, CUSTOM_MOVIES_COLLECTION, movieId);
    await deleteDoc(movieRef);
    console.log(`[Firestore] Movie ID "${movieId}" deleted from Cloud Firestore!`);
  } catch (error) {
    console.error('Error deleting movie from Firestore:', error);
    throw error;
  }
}

/**
 * Fetch all custom movies from Cloud Firestore directly once.
 */
export async function getCustomMoviesFromFirestore(): Promise<Movie[]> {
  try {
    const moviesRef = collection(db, CUSTOM_MOVIES_COLLECTION);
    const snapshot = await getDocs(moviesRef);
    const list: Movie[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        contentType: data.contentType || 'movie',
        title: data.title || '',
        originalTitle: data.originalTitle || '',
        year: data.year || 2024,
        duration: data.duration || 90,
        rating: data.rating || 9.0,
        ageRating: data.ageRating || '+13',
        genres: data.genres || ['Película'],
        director: data.director || 'Comunidad',
        cast: data.cast || ['Reparto'],
        synopsis: data.synopsis || '',
        posterUrl: data.posterUrl || '',
        backdropUrl: data.backdropUrl || '',
        videoUrl: data.videoUrl || '',
        episodes: data.episodes || undefined,
        seasonsCount: data.seasonsCount || undefined,
        quality: data.quality || 'Full HD 1080p',
        viewsCount: data.viewsCount || 1,
        addedByUser: true,
        hasLocalFile: !!data.hasLocalFile,
        fileName: data.fileName || '',
      });
    });
    return list;
  } catch (err) {
    console.warn('[Firestore] Error direct fetching custom movies:', err);
    return [];
  }
}

/**
 * Subscribe to custom movies added by users/community in real-time.
 */
export function subscribeToCustomMovies(onUpdate: (movies: Movie[]) => void): () => void {
  try {
    const moviesRef = collection(db, CUSTOM_MOVIES_COLLECTION);
    return onSnapshot(
      moviesRef,
      (snapshot) => {
        const movies: Movie[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          movies.push({
            id: docSnap.id,
            contentType: data.contentType || 'movie',
            title: data.title || '',
            originalTitle: data.originalTitle || '',
            year: data.year || 2024,
            duration: data.duration || 90,
            rating: data.rating || 9.0,
            ageRating: data.ageRating || '+13',
            genres: data.genres || ['Película'],
            director: data.director || 'Comunidad',
            cast: data.cast || ['Reparto'],
            synopsis: data.synopsis || '',
            posterUrl: data.posterUrl || '',
            backdropUrl: data.backdropUrl || '',
            videoUrl: data.videoUrl || '',
            episodes: data.episodes || undefined,
            seasonsCount: data.seasonsCount || undefined,
            quality: data.quality || 'Full HD 1080p',
            viewsCount: data.viewsCount || 1,
            addedByUser: true,
            hasLocalFile: !!data.hasLocalFile,
            fileName: data.fileName || '',
          });
        });
        onUpdate(movies);
      },
      (error) => {
        console.warn('Firestore subscription notice (custom_movies):', error.message);
      }
    );
  } catch (err) {
    console.warn('Failed to attach firestore listener for custom_movies:', err);
    return () => {};
  }
}

/**
 * Save a review to Cloud Firestore.
 */
export async function saveReviewToFirestore(review: UserReview): Promise<void> {
  try {
    const reviewRef = doc(db, REVIEWS_COLLECTION, review.id);
    const sanitized = sanitizeForFirestore({
      ...review,
      timestamp: serverTimestamp(),
    });
    await setDoc(reviewRef, sanitized, { merge: true });
  } catch (error) {
    console.error('Error saving review to Firestore:', error);
    throw error;
  }
}

/**
 * Subscribe to reviews in Firestore in real-time.
 */
export function subscribeToReviews(onUpdate: (reviewsByMovie: Record<string, UserReview[]>) => void): () => void {
  try {
    const reviewsRef = collection(db, REVIEWS_COLLECTION);
    return onSnapshot(
      reviewsRef,
      (snapshot) => {
        const mapped: Record<string, UserReview[]> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const rev: UserReview = {
            id: docSnap.id,
            movieId: data.movieId,
            userName: data.userName || 'Cinéfilo',
            userAvatar: data.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
            rating: data.rating || 5,
            comment: data.comment || '',
            date: data.date || 'Reciente',
          };
          if (!mapped[rev.movieId]) {
            mapped[rev.movieId] = [];
          }
          mapped[rev.movieId].push(rev);
        });
        onUpdate(mapped);
      },
      (error) => {
        console.warn('Firestore subscription notice (movie_reviews):', error.message);
      }
    );
  } catch (err) {
    console.warn('Failed to attach firestore listener for reviews:', err);
    return () => {};
  }
}
