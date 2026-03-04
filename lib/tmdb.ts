// ==========================================
// CineTrack - TMDB API Helper
// ==========================================

import { logger } from './logger'

const LANGUAGE = "tr-TR";
const FALLBACK_LANGUAGE = "en-US";

// Tiny 1x1 blur placeholder for next/image
export const BLUR_PLACEHOLDER =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PC9zdmc+";

// Placeholder SVG data URL for missing images
const PLACEHOLDER_IMAGE =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWExYTFhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiI+R8O2cnNlbCBZb2s8L3RleHQ+PC9zdmc+";

// ==========================================
// Görsel URL Helper'ları
// ==========================================

/** Poster görseli URL'si (w500) */
export function posterUrl(path: string | null): string {
    if (!path) return PLACEHOLDER_IMAGE;
    if (path.startsWith("http")) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
}

/** Arka plan görseli URL'si (original) */
export function backdropUrl(path: string | null): string {
    if (!path) return PLACEHOLDER_IMAGE;
    if (path.startsWith("http")) return path;
    return `https://image.tmdb.org/t/p/original${path}`;
}

/** Profil görseli URL'si (w185) */
export function profileUrl(path: string | null): string {
    if (!path) return PLACEHOLDER_IMAGE;
    if (path.startsWith("http")) return path;
    return `https://image.tmdb.org/t/p/w185${path}`;
}

// ==========================================
// Yardımcı: Fetch Wrapper (Proxy üzerinden)
// ==========================================

function getProxyBaseUrl(): string {
    if (typeof window !== 'undefined') {
        return '';  // Client-side: relative URL
    }
    // Server-side: need absolute URL
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T | null> {
    try {
        const searchParams = new URLSearchParams({
            endpoint,
            language: LANGUAGE,
            ...params,
        });

        const baseUrl = getProxyBaseUrl();
        const res = await fetch(`${baseUrl}/api/tmdb?${searchParams.toString()}`);

        if (!res.ok) {
            logger.error(`TMDB API hatası: ${res.status} ${res.statusText}`);
            return null;
        }

        return await res.json();
    } catch (error) {
        logger.error('TMDB API isteği başarısız', error);
        return null;
    }
}

/**
 * Türkçe içerik boşsa İngilizce fallback ile tekrar çeker.
 * overview veya biography alanları kontrol edilir.
 */
async function tmdbFetchWithFallback<T>(
    endpoint: string,
    params: Record<string, string> = {}
): Promise<T | null> {
    const data = await tmdbFetch<T>(endpoint, params);
    if (!data) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record = data as any;

    // Türkçe overview/biography boşsa İngilizce dene
    const overview = record.overview as string | undefined;
    const biography = record.biography as string | undefined;
    const credits = record.credits as { cast?: unknown[] } | undefined;
    const needsFallback =
        (overview !== undefined && !overview?.trim()) ||
        (biography !== undefined && !biography?.trim()) ||
        (credits !== undefined && !credits?.cast?.length);

    if (needsFallback) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fallbackData = await tmdbFetch<any>(endpoint, {
            ...params,
            language: FALLBACK_LANGUAGE,
        });
        if (fallbackData) {
            // Türkçe verileri koru, sadece boş alanları İngilizce ile doldur
            if (!overview?.trim() && (fallbackData.overview as string)?.trim()) {
                record.overview = fallbackData.overview;
            }
            if (!biography?.trim() && (fallbackData.biography as string)?.trim()) {
                record.biography = fallbackData.biography;
            }
            // Kadro (cast) yoksa İngilizce kadroyu kullan (bazen TR dilinde credits tamamen eksik gelebiliyor)
            if (!record.credits?.cast?.length && fallbackData.credits?.cast?.length) {
                record.credits = fallbackData.credits;
            }
            // Videolar (fragmanlar) yoksa İngilizce videoları kullan
            if (!record.videos?.results?.length && fallbackData.videos?.results?.length) {
                record.videos = fallbackData.videos;
            }
        }
    }

    return data;
}

// ==========================================
// API Response Tipleri (TMDB'ye özgü raw tipler)
// ==========================================

interface TMDBMultiSearchResponse {
    page: number;
    results: TMDBMultiSearchResult[];
    total_pages: number;
    total_results: number;
}

export interface TMDBPersonResult {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
}

export interface DiscoverFilters {
    genreIds?: number[];
    yearFrom?: number;
    yearTo?: number;
    ratingMin?: number;
    ratingMax?: number;
    runtimeMin?: number;
    runtimeMax?: number;
    language?: string;
    sortBy?: 'popularity' | 'rating' | 'release_date' | 'revenue';
    page?: number;
    withPeople?: string;
}

export interface TMDBMultiSearchResult {
    id: number;
    media_type: "movie" | "tv" | "person";
    title?: string;
    name?: string;
    poster_path: string | null;
    profile_path?: string | null;
    overview?: string;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
}

interface TMDBTrendingResponse {
    page: number;
    results: TMDBMovieResult[] | TMDBSeriesResult[];
    total_pages: number;
    total_results: number;
}

export interface TMDBMovieResult {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
}

export interface TMDBSeriesResult {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    vote_count: number;
    genre_ids: number[];
}

export interface TMDBMovieDetail {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    vote_count: number;
    genres: { id: number; name: string }[];
    runtime: number | null;
    tagline: string | null;
    imdb_id: string | null;
    credits: {
        cast: TMDBCastMember[];
    };
    videos: {
        results: TMDBVideo[];
    };
    similar?: {
        results: TMDBMovieResult[];
    };
}

export interface TMDBSeriesDetail {
    id: number;
    name: string;
    original_name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    last_air_date: string | null;
    episode_run_time: number[];
    vote_average: number;
    vote_count: number;
    genres: { id: number; name: string }[];
    number_of_seasons: number;
    number_of_episodes: number;
    status: string;
    seasons: TMDBSeasonSummary[];
    networks?: { id: number; name: string; logo_path: string | null }[];
    next_episode_to_air?: TMDBEpisode | null;
    credits: {
        cast: TMDBCastMember[];
    };
    videos: {
        results: TMDBVideo[];
    };
}

export interface TMDBSeasonDetail {
    id: number;
    season_number: number;
    name: string;
    overview: string;
    poster_path: string | null;
    air_date: string | null;
    episodes: TMDBEpisode[];
}

export interface TMDBSeasonSummary {
    id: number;
    season_number: number;
    name: string;
    overview: string;
    poster_path: string | null;
    air_date: string | null;
    episode_count: number;
}

export interface TMDBCastMember {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
}

export interface TMDBVideo {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
}

export interface TMDBEpisode {
    id: number;
    episode_number: number;
    season_number: number;
    name: string;
    overview: string;
    air_date: string | null;
    still_path: string | null;
    vote_average: number;
    runtime: number | null;
    show_id?: number;
}

export interface TMDBPersonDetail {
    id: number;
    name: string;
    profile_path: string | null;
    biography: string;
    birthday: string | null;
    deathday: string | null;
    place_of_birth: string | null;
    known_for_department: string;
    combined_credits: {
        cast: TMDBPersonCredit[];
    };
}

export interface TMDBPersonCredit {
    id: number;
    media_type: "movie" | "tv";
    title?: string;
    name?: string;
    character: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
}

interface TMDBDiscoverResponse {
    page: number;
    results: TMDBMovieResult[] | TMDBSeriesResult[];
    total_pages: number;
    total_results: number;
}

// ==========================================
// API Fonksiyonları
// ==========================================

/** Film ve dizi ara (multi search) */
export async function searchMulti(query: string): Promise<TMDBMultiSearchResult[] | null> {
    const data = await tmdbFetch<TMDBMultiSearchResponse>("/search/multi", {
        query,
    });
    return data?.results ?? null;
}

/** Haftanın trend filmleri */
export async function getTrendingMovies(): Promise<TMDBMovieResult[] | null> {
    const data = await tmdbFetch<TMDBTrendingResponse>("/trending/movie/week");
    return (data?.results as TMDBMovieResult[]) ?? null;
}

/** Haftanın trend dizileri */
export async function getTrendingSeries(): Promise<TMDBSeriesResult[] | null> {
    const data = await tmdbFetch<TMDBTrendingResponse>("/trending/tv/week");
    return (data?.results as TMDBSeriesResult[]) ?? null;
}

/** Film detayı (credits ve videos dahil) */
export async function getMovieDetail(id: string): Promise<TMDBMovieDetail | null> {
    return tmdbFetchWithFallback<TMDBMovieDetail>(`/movie/${id}`, {
        append_to_response: "credits,videos",
    });
}

/** Dizi detayı (credits ve videos dahil) */
export async function getSeriesDetail(id: string): Promise<TMDBSeriesDetail | null> {
    return tmdbFetchWithFallback<TMDBSeriesDetail>(`/tv/${id}`, {
        append_to_response: "credits,videos",
    });
}

/** Dizi external ID'leri (imdb_id vb.) */
interface TMDBExternalIds {
    imdb_id: string | null;
}

export async function getSeriesExternalIds(id: string): Promise<TMDBExternalIds | null> {
    return tmdbFetch<TMDBExternalIds>(`/tv/${id}/external_ids`);
}

/** Sezon detayı ve tüm bölümler */
export async function getSeasonDetail(
    seriesId: string,
    seasonNumber: number
): Promise<TMDBSeasonDetail | null> {
    return tmdbFetch<TMDBSeasonDetail>(`/tv/${seriesId}/season/${seasonNumber}`);
}

/** Oyuncu detayı (combined_credits dahil) */
export async function getPersonDetail(id: string): Promise<TMDBPersonDetail | null> {
    return tmdbFetchWithFallback<TMDBPersonDetail>(`/person/${id}`, {
        append_to_response: "combined_credits",
    });
}

/** Popüler filmler (tür filtresi olmadan) */
export async function getPopularMovies(): Promise<TMDBMovieResult[] | null> {
    const data = await tmdbFetch<TMDBDiscoverResponse>("/discover/movie", {
        sort_by: "popularity.desc",
    });
    return (data?.results as TMDBMovieResult[]) ?? null;
}

/** Türe göre filmler */
export async function getMoviesByGenre(genreId: number): Promise<TMDBMovieResult[] | null> {
    const data = await tmdbFetch<TMDBDiscoverResponse>("/discover/movie", {
        with_genres: genreId.toString(),
        sort_by: "popularity.desc",
    });
    return (data?.results as TMDBMovieResult[]) ?? null;
}

/** Türe göre diziler */
export async function getSeriesByGenre(genreId: number): Promise<TMDBSeriesResult[] | null> {
    const data = await tmdbFetch<TMDBDiscoverResponse>("/discover/tv", {
        with_genres: genreId.toString(),
        sort_by: "popularity.desc",
    });
    return (data?.results as TMDBSeriesResult[]) ?? null;
}

// ==========================================
// Öneri Sistemi Fonksiyonları
// ==========================================

/** Benzer içerikler (similar) */
export async function getSimilar(
    id: string,
    type: "film" | "dizi"
): Promise<(TMDBMovieResult | TMDBSeriesResult)[] | null> {
    const endpoint = type === "film" ? `/movie/${id}/similar` : `/tv/${id}/similar`;
    const data = await tmdbFetch<TMDBDiscoverResponse>(endpoint);
    return data?.results ?? null;
}

/** TMDB önerileri (recommendations) */
export async function getRecommendations(
    id: string,
    type: "film" | "dizi"
): Promise<(TMDBMovieResult | TMDBSeriesResult)[] | null> {
    const endpoint = type === "film" ? `/movie/${id}/recommendations` : `/tv/${id}/recommendations`;
    const data = await tmdbFetch<TMDBDiscoverResponse>(endpoint);
    return data?.results ?? null;
}

/** Türlere göre yüksek puanlı keşif (vote_average >= 7) */
export async function getByGenres(
    genreIds: number[],
    type: "film" | "dizi"
): Promise<(TMDBMovieResult | TMDBSeriesResult)[] | null> {
    const endpoint = type === "film" ? "/discover/movie" : "/discover/tv";
    const data = await tmdbFetch<TMDBDiscoverResponse>(endpoint, {
        with_genres: genreIds.join(","),
        sort_by: "vote_average.desc",
        "vote_average.gte": "7",
        "vote_count.gte": "100",
    });
    return data?.results ?? null;
}

/** Haftalık tüm trendler (film + dizi) */
export async function getTrendingAll(): Promise<(TMDBMovieResult | TMDBSeriesResult)[] | null> {
    const data = await tmdbFetch<TMDBTrendingResponse>("/trending/all/week");
    return data?.results ?? null;
}

// ==========================================
// Takvim & Yayın Fonksiyonları
// ==========================================

/** Bugün yayınlanan diziler */
export async function getAiringToday(): Promise<TMDBSeriesResult[] | null> {
    const data = await tmdbFetch<TMDBTrendingResponse>("/tv/airing_today");
    return (data?.results as TMDBSeriesResult[]) ?? null;
}

/** Şu an yayında olan diziler */
export async function getOnTheAir(): Promise<TMDBSeriesResult[] | null> {
    const data = await tmdbFetch<TMDBTrendingResponse>("/tv/on_the_air");
    return (data?.results as TMDBSeriesResult[]) ?? null;
}

/** Yakında çıkacak filmler */
export async function getUpcomingMovies(): Promise<TMDBMovieResult[] | null> {
    const data = await tmdbFetch<TMDBTrendingResponse>("/movie/upcoming");
    return (data?.results as TMDBMovieResult[]) ?? null;
}

/** Bir dizinin sonraki bölüm bilgisini getirir */
export async function getSeriesNextEpisode(id: string): Promise<TMDBEpisode | null> {
    const data = await tmdbFetch<TMDBSeriesDetail>(`/tv/${id}`);
    return data?.next_episode_to_air ?? null;
}

// ==========================================
// Gelişmiş Keşif (Discovery) Fonksiyonları
// ==========================================

function buildDiscoverParams(filters: DiscoverFilters, isMovie: boolean): Record<string, string> {
    const params: Record<string, string> = {};

    if (filters.page) params.page = filters.page.toString();
    if (filters.genreIds && filters.genreIds.length > 0) {
        params.with_genres = filters.genreIds.join(",");
    }

    // Sort logic
    if (filters.sortBy) {
        switch (filters.sortBy) {
            case 'popularity': params.sort_by = "popularity.desc"; break;
            case 'rating': params.sort_by = "vote_average.desc"; break;
            case 'release_date':
                params.sort_by = isMovie ? "primary_release_date.desc" : "first_air_date.desc";
                break;
            case 'revenue':
                if (isMovie) params.sort_by = "revenue.desc";
                break;
        }
    } else {
        params.sort_by = "popularity.desc";
    }

    if (filters.ratingMin !== undefined) params["vote_average.gte"] = filters.ratingMin.toString();
    if (filters.ratingMax !== undefined && filters.ratingMax < 10) params["vote_average.lte"] = filters.ratingMax.toString();

    // Runtime based on minutes
    if (filters.runtimeMin !== undefined) params["with_runtime.gte"] = filters.runtimeMin.toString();
    if (filters.runtimeMax !== undefined) params["with_runtime.lte"] = filters.runtimeMax.toString();

    // Year logic
    if (filters.yearFrom !== undefined) {
        if (isMovie) params["primary_release_date.gte"] = `${filters.yearFrom}-01-01`;
        else params["first_air_date.gte"] = `${filters.yearFrom}-01-01`;
    }
    if (filters.yearTo !== undefined) {
        if (isMovie) params["primary_release_date.lte"] = `${filters.yearTo}-12-31`;
        else params["first_air_date.lte"] = `${filters.yearTo}-12-31`;
    }

    if (filters.language && filters.language !== 'all') {
        params.with_original_language = filters.language;
    }

    if (filters.withPeople && isMovie) {
        // TMDB discover tv does not support with_people, so we only apply this to movies
        params.with_people = filters.withPeople;
    }

    // Default filters to ensure some basic quality and avoid 1-vote weird items when filtering by rating
    if (filters.ratingMin || filters.ratingMax) {
        params["vote_count.gte"] = "50";
    }

    return params;
}

export async function discoverMovies(filters: DiscoverFilters): Promise<{ results: TMDBMovieResult[], total_pages: number }> {
    const params = buildDiscoverParams(filters, true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await tmdbFetch<any>("/discover/movie", params);
    return {
        results: data?.results || [],
        total_pages: data?.total_pages || 1
    };
}

export async function discoverSeries(filters: DiscoverFilters): Promise<{ results: TMDBSeriesResult[], total_pages: number }> {
    const params = buildDiscoverParams(filters, false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await tmdbFetch<any>("/discover/tv", params);
    return {
        results: data?.results || [],
        total_pages: data?.total_pages || 1
    };
}

export async function searchPerson(query: string): Promise<TMDBPersonResult[]> {
    if (!query) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await tmdbFetch<any>("/search/person", { query });
    return data?.results || [];
}

// ==========================================
// Watch Providers (Nerede İzlenir?)
// ==========================================

export interface TMDBWatchProvider {
    provider_id: number;
    provider_name: string;
    logo_path: string | null;
    display_priority: number;
}

export interface TMDBWatchProviders {
    flatrate?: TMDBWatchProvider[];
    rent?: TMDBWatchProvider[];
    buy?: TMDBWatchProvider[];
    link?: string;
}

/** Film veya dizi için izleme platformlarını getirir (TR bölgesi) */
export async function getWatchProviders(
    id: string,
    type: "film" | "dizi"
): Promise<TMDBWatchProviders | null> {
    const endpoint = type === "film" ? `/movie/${id}/watch/providers` : `/tv/${id}/watch/providers`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await tmdbFetch<any>(endpoint);
    if (!data?.results) return null;
    // TR bölgesini al
    const tr = data.results.TR;
    if (!tr) return null;
    return {
        flatrate: tr.flatrate || undefined,
        rent: tr.rent || undefined,
        buy: tr.buy || undefined,
        link: tr.link || undefined,
    };
}
