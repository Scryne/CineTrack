// ==========================================
// CineTrack - OMDB API Helper
// ==========================================

import { logger } from './logger'

const BASE_URL = "https://www.omdbapi.com";
const OMDB_KEY = process.env.NEXT_PUBLIC_OMDB_KEY;

// ==========================================
// Response Tipi
// ==========================================

export interface OMDBRatings {
    imdbRating: string | null;
    imdbVotes: string | null;
    rottenTomatoes: string | null;
    metacritic: string | null;
}

interface OMDBResponse {
    Response: "True" | "False";
    Error?: string;
    imdbRating?: string;
    imdbVotes?: string;
    Ratings?: { Source: string; Value: string }[];
    Metascore?: string;
}

// ==========================================
// API Fonksiyonları
// ==========================================

/** IMDb, Rotten Tomatoes ve Metacritic puanlarını getir */
export async function getRatings(imdbId: string): Promise<OMDBRatings | null> {
    if (!imdbId || !OMDB_KEY) return null;

    try {
        const params = new URLSearchParams({
            apikey: OMDB_KEY,
            i: imdbId,
        });

        const res = await fetch(`${BASE_URL}?${params.toString()}`);

        if (!res.ok) {
            logger.error(`OMDB API hatası: ${res.status} ${res.statusText}`);
            return null;
        }

        const data: OMDBResponse = await res.json();

        if (data.Response === "False") {
            logger.error('OMDB API yanıt hatası', data.Error);
            return null;
        }

        // Rotten Tomatoes ve Metacritic puanlarını Ratings dizisinden bul
        const rtRating = data.Ratings?.find(
            (r) => r.Source === "Rotten Tomatoes"
        );
        const mcRating = data.Ratings?.find(
            (r) => r.Source === "Metacritic"
        );

        return {
            imdbRating: data.imdbRating ?? null,
            imdbVotes: data.imdbVotes ?? null,
            rottenTomatoes: rtRating?.Value ?? null,
            metacritic: mcRating?.Value ?? null,
        };
    } catch (error) {
        logger.error('OMDB API isteği başarısız', error);
        return null;
    }
}
