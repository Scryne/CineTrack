// ==========================================
// CineTrack - OMDB API Helper
// ==========================================

import { logger } from './logger'


// ==========================================
// Response Tipi
// ==========================================

export interface OMDBRatings {
    imdbRating: string | null;
    imdbVotes: string | null;
    rottenTomatoes: string | null;
    metacritic: string | null;
}

// ==========================================
// API Fonksiyonları
// ==========================================

/** IMDb, Rotten Tomatoes ve Metacritic puanları. Çağrı sunucu rotasından geçer (app/api/omdb). */
export async function getRatings(imdbId: string): Promise<OMDBRatings | null> {
    if (!imdbId) return null;
    try {
        const res = await fetch(`/api/omdb?i=${encodeURIComponent(imdbId)}`);
        if (!res.ok) return null;
        const data = (await res.json()) as { ratings: OMDBRatings | null };
        return data.ratings;
    } catch (error) {
        logger.error('OMDB puanları alınamadı', error);
        return null;
    }
}
