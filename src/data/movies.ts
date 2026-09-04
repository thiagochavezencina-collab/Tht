import { Movie, UserReview } from '../types';

// El usuario solicitó borrar todas las películas predeterminadas.
// Solo aparecerán las películas y series que el usuario o la comunidad suban.
export const INITIAL_MOVIES: Movie[] = [];

export const INITIAL_REVIEWS: Record<string, UserReview[]> = {};

export const GENRES = [
  'Todos',
  'Películas',
  'Series',
  'Acción',
  'Aventura',
  'Ciencia Ficción',
  'Animación',
  'Terror',
  'Suspenso',
  'Comedia',
  'Drama',
  'Romance',
  'Fantasía',
  'Crimen',
  'Documental',
];
