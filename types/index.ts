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
    posterPath: string;
    addedAt: string; // ISO date string
}

// --- İzlenenler ---
export interface WatchedItem {
    id: string;
    type: MediaType;
    title: string;
    posterPath: string;
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
    posterPath: string;
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

// --- Etiketler ---
export interface TagItem {
    id: string;
    type: MediaType;
    tags: string[];
}



// --- Kullanıcı Profili ---
export interface UserProfile {
    username: string;
    avatar: string; // Emoji
}

// ==========================================
// API Response Tipleri
// ==========================================

// --- TMDB ---
export interface TMDBSearchResponse {
    page: number;
    results: TMDBSearchResult[];
    totalPages: number;
    totalResults: number;
}

export interface TMDBSearchResult {
    id: number;
    mediaType: "movie" | "tv" | "person";
    title?: string; // Film için
    name?: string; // Dizi/Kişi için
    posterPath: string | null;
    profilePath?: string | null;
    overview?: string;
    releaseDate?: string;
    firstAirDate?: string;
    voteAverage?: number;
}

// --- TVMaze ---
export interface TVMazeShow {
    id: number;
    name: string;
    summary: string | null;
    image: { medium: string | null; original: string | null } | null;
    premiered: string | null;
    ended: string | null;
    rating: { average: number | null };
    genres: string[];
    status: string;
}

export interface TVMazeEpisode {
    id: number;
    name: string;
    season: number;
    number: number;
    airdate: string;
    runtime: number | null;
    summary: string | null;
    image: { medium: string | null; original: string | null } | null;
}

// --- OMDB ---
export interface OMDBMovie {
    Title: string;
    Year: string;
    Rated: string;
    Released: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Writer: string;
    Actors: string;
    Plot: string;
    Language: string;
    Country: string;
    Awards: string;
    Poster: string;
    Ratings: { Source: string; Value: string }[];
    Metascore: string;
    imdbRating: string;
    imdbVotes: string;
    imdbID: string;
    Type: string;
    BoxOffice?: string;
}
