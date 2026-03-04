import { Source } from '@/types/player'

// ============ KAYNAK TANIMLARI ============

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

// ============ EMBED URL YARDIMCILARI ============

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

// ============ KAYNAK SAĞLIK KONTROLÜ ============

export type SourceHealth = {
    sourceId: string
    isAlive: boolean
    lastChecked: string
    responseTime: number
}

async function checkSourceHealth(source: Source): Promise<SourceHealth> {
    const start = Date.now()

    try {
        const testUrl = source.getMovieUrl('550') // Fight Club TMDB ID
        const url = new URL(testUrl)

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)

        await fetch(url.origin, {
            method: 'HEAD',
            signal: controller.signal,
            mode: 'no-cors',
        })

        clearTimeout(timeout)

        return {
            sourceId: source.id,
            isAlive: true,
            lastChecked: new Date().toISOString(),
            responseTime: Date.now() - start,
        }
    } catch {
        return {
            sourceId: source.id,
            isAlive: false,
            lastChecked: new Date().toISOString(),
            responseTime: -1,
        }
    }
}

/**
 * Tüm kaynakları paralel olarak test eder ve yalnızca sağlıklı & engellenmemiş olanları döner.
 * Sonuçları sessionStorage'da 30 dakika cache'ler.
 */
export async function getHealthySources(): Promise<Source[]> {
    if (typeof window === 'undefined') return SOURCES

    const cacheKey = 'source_health_cache'
    const cached = sessionStorage.getItem(cacheKey)

    if (cached) {
        try {
            const { data, timestamp } = JSON.parse(cached)
            if (Date.now() - timestamp < 30 * 60 * 1000) {
                return SOURCES.filter(s => data[s.id] !== false && !isSourceBlocked(s.id))
            }
        } catch { /* ignore corrupt cache */ }
    }

    const results = await Promise.allSettled(
        SOURCES.map(s => checkSourceHealth(s))
    )

    const healthMap: Record<string, boolean> = {}
    results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
            healthMap[SOURCES[i].id] = result.value.isAlive
        } else {
            healthMap[SOURCES[i].id] = false
        }
    })

    sessionStorage.setItem(cacheKey, JSON.stringify({
        data: healthMap,
        timestamp: Date.now(),
    }))

    return SOURCES.filter(s => healthMap[s.id] !== false && !isSourceBlocked(s.id))
}

// ============ UYUMLULUK (PlayerControls) ============

export async function checkSourceAvailability(sourceId: string): Promise<boolean> {
    if (typeof window === 'undefined') return true

    if (isSourceBlocked(sourceId)) return false

    const cacheKey = `source_health_${sourceId}`
    const cached = sessionStorage.getItem(cacheKey)

    if (cached) {
        try {
            const data = JSON.parse(cached)
            if (data.expiry > Date.now()) {
                return data.available
            }
        } catch { /* ignore */ }
    }

    try {
        const source = SOURCES.find(s => s.id === sourceId)
        if (!source) return false

        const url = new URL(source.getMovieUrl('1'))
        await fetch(url.origin, { method: 'HEAD', mode: 'no-cors' })

        const expiry = Date.now() + 30 * 60 * 1000
        sessionStorage.setItem(cacheKey, JSON.stringify({ available: true, expiry }))
        return true
    } catch {
        const expiry = Date.now() + 30 * 60 * 1000
        sessionStorage.setItem(cacheKey, JSON.stringify({ available: false, expiry }))
        return false
    }
}

// ============ X-FRAME-OPTIONS ENGELLİ KAYNAK YÖNETİMİ ============

/**
 * Bir kaynağı 1 saat süreyle engelli olarak işaretler (X-Frame-Options hatası vb.)
 */
export function markSourceBlocked(sourceId: string): void {
    if (typeof window === 'undefined') return
    const key = `source_blocked_${sourceId}`
    const expiry = Date.now() + 60 * 60 * 1000 // 1 saat
    sessionStorage.setItem(key, expiry.toString())
}

/**
 * Kaynağın şu anda engelli olup olmadığını kontrol eder.
 */
export function isSourceBlocked(sourceId: string): boolean {
    if (typeof window === 'undefined') return false
    const key = `source_blocked_${sourceId}`
    const expiry = sessionStorage.getItem(key)
    if (!expiry) return false
    if (Date.now() > parseInt(expiry)) {
        sessionStorage.removeItem(key)
        return false
    }
    return true
}
