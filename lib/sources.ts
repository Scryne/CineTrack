import { Source } from '@/types/player'

const SOURCES: Source[] = [
    {
        id: 'vidsrc-to',
        name: 'Kaynak 1',
        getMovieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
        getEpisodeUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
        isAvailable: true,
    },
    {
        id: 'vidsrc-me',
        name: 'Kaynak 2',
        getMovieUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
        getEpisodeUrl: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
        isAvailable: true,
    },
    {
        id: 'superembed',
        name: 'Kaynak 3',
        getMovieUrl: (id) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
        getEpisodeUrl: (id, s, e) => `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
        isAvailable: true,
    },
    {
        id: '2embed',
        name: 'Kaynak 4',
        getMovieUrl: (id) => `https://www.2embed.cc/embed/${id}`,
        getEpisodeUrl: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
        isAvailable: true,
    },
]

export default SOURCES

export function getMovieEmbedUrl(tmdbId: string, sourceIndex: number): string {
    if (sourceIndex < 0 || sourceIndex >= SOURCES.length) {
        return SOURCES[0].getMovieUrl(tmdbId);
    }
    return SOURCES[sourceIndex].getMovieUrl(tmdbId)
}

export function getEpisodeEmbedUrl(tmdbId: string, season: number, episode: number, sourceIndex: number): string {
    if (sourceIndex < 0 || sourceIndex >= SOURCES.length) {
        return SOURCES[0].getEpisodeUrl(tmdbId, season, episode);
    }
    return SOURCES[sourceIndex].getEpisodeUrl(tmdbId, season, episode)
}

export async function checkSourceAvailability(sourceId: string): Promise<boolean> {
    if (typeof window === 'undefined') return true; // Sunucu tarafındaysa (SSR) true dön

    const cacheKey = `source_health_${sourceId}`;
    const cached = sessionStorage.getItem(cacheKey);

    if (cached) {
        try {
            const data = JSON.parse(cached);
            if (data.expiry > Date.now()) {
                return data.available;
            }
        } catch {
            // Hatalı cache verisi yoksayılır
        }
    }

    try {
        const source = SOURCES.find(s => s.id === sourceId);
        if (!source) return false;

        // Bağlantıyı test etmek için Base origin'e istek atılır
        const url = new URL(source.getMovieUrl('1'));

        await fetch(url.origin, { method: 'HEAD', mode: 'no-cors' });

        const expiry = Date.now() + 30 * 60 * 1000; // 30 dakika
        sessionStorage.setItem(cacheKey, JSON.stringify({ available: true, expiry }));
        return true;
    } catch {
        const expiry = Date.now() + 30 * 60 * 1000;
        sessionStorage.setItem(cacheKey, JSON.stringify({ available: false, expiry }));
        return false;
    }
}
