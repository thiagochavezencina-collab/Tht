export type MediaContentType = 'movie' | 'series';

export interface SubtitleTrack {
  id: string;
  lang: string;
  label: string;
  url?: string;
  fileName?: string;
  cues?: { start: number; end: number; text: string }[];
}

export interface Episode {
  id: string;
  episodeNumber: number;
  seasonNumber?: number;
  title: string;
  duration: number; // in minutes
  videoUrl: string;
  synopsis?: string;
  thumbnailUrl?: string;
  hasLocalFile?: boolean;
  fileName?: string;
  description?: string;
  subtitles?: SubtitleTrack[];
}

export interface Movie {
  id: string;
  contentType?: MediaContentType; // 'movie' | 'series'
  title: string;
  originalTitle?: string;
  year: number;
  duration: number; // in minutes (or avg per episode for series)
  rating: number; // 0 to 10
  ageRating: string; // e.g., '+13', '+16', '+18', 'ATP'
  genres: string[];
  director: string;
  cast: string[];
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  videoUrl: string; // Main playable video or first episode
  episodes?: Episode[]; // For series
  seasonsCount?: number; // For series
  subtitles?: SubtitleTrack[];
  isFeatured?: boolean;
  featuredQuote?: string;
  quality: '4K Ultra HD' | 'Full HD 1080p' | 'HD 720p';
  viewsCount: number;
  addedByUser?: boolean;
  hasLocalFile?: boolean;
  fileName?: string;
}

export interface WatchProgress {
  movieId: string;
  currentEpisodeId?: string;
  currentTime: number;
  duration: number;
  lastWatched: number; // timestamp
  completed: boolean;
}

export interface UserReview {
  id: string;
  movieId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface MovieSuggestion {
  id: string;
  title: string;
  contentType: 'movie' | 'series' | 'anime' | 'documental';
  genre?: string;
  year?: number;
  reason?: string;
  suggestedBy: string; // "Anónimo" for public display
  senderDetails?: string; // Private sender info / device details only visible to the admin (Thiago)
  isAnonymous?: boolean;
  userAvatar?: string;
  votes: number;
  status: 'pending' | 'reviewing' | 'accepted' | 'available';
  date: string;
  voters?: string[];
}

export type PlayerMode = 'modal' | 'theater' | 'mini' | 'fullscreen';
