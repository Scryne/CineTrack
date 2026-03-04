// ==========================================
// CineTrack - Tip Tanımları
// ==========================================

// --- Film ---
export interface Movie {
    id: number;
    title: string;
    originalTitle: string;
    overview: string;
    posterPath: string | null;
    backdropPath: string | null;
    releaseDate: string;
    voteAverage: number;
    voteCount: number;
    genres: Genre[];
    runtime: number | null;
    tagline: string | null;
    imdbId: string | null;
}

// --- Dizi ---
export interface Series {
    id: number;
    name: string;
    originalName: string;
    overview: string;
    posterPath: string | null;
    backdropPath: string | null;
    firstAirDate: string;
    lastAirDate: string | null;
    voteAverage: number;
    voteCount: number;
    genres: Genre[];
    numberOfSeasons: number;
    numberOfEpisodes: number;
    status: string;
    seasons: Season[];
}

// --- Sezon ---
export interface Season {
    id: number;
    seasonNumber: number;
    name: string;
    overview: string;
    posterPath: string | null;
    airDate: string | null;
    episodeCount: number;
    episodes: Episode[];
}

// --- Bölüm ---
export interface Episode {
    id: number;
    episodeNumber: number;
    seasonNumber: number;
    name: string;
    overview: string;
    airDate: string | null;
    stillPath: string | null;
    voteAverage: number;
    runtime: number | null;
}

// --- Oyuncu / Kişi ---
export interface Person {
    id: number;
    name: string;
    profilePath: string | null;
    biography: string;
    birthday: string | null;
    deathday: string | null;
    placeOfBirth: string | null;
    knownForDepartment: string;
    knownFor: (Movie | Series)[];
}

// --- Tür ---
export interface Genre {
    id: number;
    name: string;
}

// --- Oyuncu Kadrosu ---
export interface CastMember {
    id: number;
    name: string;
    character: string;
    profilePath: string | null;
    order: number;
}

// ==========================================
// localStorage Tipleri
// ==========================================

export type MediaType = "film" | "dizi";

// --- İzleme Listesi (Watchlist) ---
export interface WatchlistItem {
    id: string;
    type: MediaType;
    title: string;
    posterPath: string | null;
    addedAt: string; // ISO date string
}

// --- İzlenenler ---
export interface WatchedItem {
    id: string;
    type: MediaType;
    title: string;
    posterPath: string | null;
    watchedAt: string; // ISO date string
}

// --- İzlenen Bölüm ---
export interface WatchedEpisode {
    seriesId: string;
    seasonNumber: number;
    episodeNumber: number;
    watchedAt: string; // ISO date string
}

// --- Kişisel Puanlama ---
export interface RatingItem {
    id: string;
    type: MediaType;
    title: string;
    posterPath: string | null;
    rating: number; // 1-10
    ratedAt: string; // ISO date string
}

// --- Özel Listeler ---
export interface CustomList {
    id: string;
    name: string;
    description: string;
    items: WatchlistItem[];
    createdAt: string; // ISO date string
    color: string; // hex renk
}
// --- Kullanıcı Profili ---
export interface UserProfile {
    id?: string;
    username?: string;
    avatar?: string;
    avatarEmoji?: string;
    cinemaIdentity?: string;
}

