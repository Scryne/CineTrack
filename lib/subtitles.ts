import type { SubtitleSearchParams, SubtitleResult } from '@/types/player'
import { logger } from './logger'

const API_BASE = 'https://api.opensubtitles.com/api/v1'
const API_KEY = process.env.NEXT_PUBLIC_OPENSUBTITLES_KEY || ''

const LANGUAGE_MAP: Record<string, string> = {
    tr: 'Türkçe',
    en: 'English',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
    it: 'Italiano',
    ko: '한국어',
    ja: '日本語',
    ar: 'العربية',
}

function getHeaders() {
    return {
        'Api-Key': API_KEY,
        'Content-Type': 'application/json',
        'X-User-Agent': 'CineTrack v1.0',
    }
}

/**
 * OpenSubtitles API'den altyazı arar.
 * Sonuçları rating ve downloadCount'a göre sıralar.
 */
export async function searchSubtitles(params: SubtitleSearchParams): Promise<SubtitleResult[]> {
    try {
        if (!API_KEY) return []

        const queryParams = new URLSearchParams()
        queryParams.set('tmdb_id', params.tmdbId)
        queryParams.set('type', params.type === 'film' ? 'movie' : 'episode')

        if (params.type === 'dizi' && params.season !== undefined) {
            queryParams.set('season_number', String(params.season))
        }
        if (params.type === 'dizi' && params.episode !== undefined) {
            queryParams.set('episode_number', String(params.episode))
        }

        queryParams.set('languages', params.languages?.join(',') || 'tr,en')
        queryParams.set('order_by', 'download_count')

        const response = await fetch(`${API_BASE}/subtitles?${queryParams.toString()}`, {
            headers: getHeaders(),
        })

        if (!response.ok) return []

        const json = await response.json()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: SubtitleResult[] = (json.data || []).map((item: any) => {
            const attrs = item.attributes || {}
            const lang = attrs.language || ''
            return {
                id: Number(item.id),
                language: lang,
                languageName: LANGUAGE_MAP[lang] || lang.toUpperCase(),
                rating: attrs.ratings || 0,
                downloadCount: attrs.download_count || 0,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                files: (attrs.files || []).map((f: any) => ({
                    fileId: f.file_id,
                    fileName: f.file_name || '',
                    url: f.url || undefined,
                })),
            }
        })

        // Sort: highest rating first, then highest download count
        results.sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating
            return b.downloadCount - a.downloadCount
        })

        return results
    } catch (error) {
        logger.error('searchSubtitles error', error)
        return []
    }
}

/**
 * Bir altyazı dosyası için download URL'i alır.
 * sessionStorage'da cache'ler (download kotası koruması).
 */
export async function getSubtitleDownloadUrl(fileId: number): Promise<string | null> {
    try {
        if (!API_KEY) return null

        // Check sessionStorage cache
        const cacheKey = `subtitle_${fileId}`
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) return cached

        const response = await fetch(`${API_BASE}/download`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ file_id: fileId }),
        })

        if (!response.ok) return null

        const json = await response.json()
        const link = json.link || null

        if (link) {
            sessionStorage.setItem(cacheKey, link)
        }

        return link
    } catch (error) {
        logger.error('getSubtitleDownloadUrl error', error)
        return null
    }
}

/**
 * SRT formatını WebVTT formatına çevirir.
 */
export function convertSrtToVtt(srtContent: string): string {
    // Normalize line breaks
    let content = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Replace SRT time format (00:00:00,000) with VTT format (00:00:00.000)
    content = content.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')

    return 'WEBVTT\n\n' + content
}

/**
 * URL'den SRT dosyasını indirir, VTT'ye çevirir ve Blob URL oluşturur.
 */
export async function loadSubtitleAsBlob(url: string): Promise<string | null> {
    try {
        const response = await fetch(url)
        if (!response.ok) return null

        const srtContent = await response.text()
        const vttContent = convertSrtToVtt(srtContent)

        const blob = new Blob([vttContent], { type: 'text/vtt' })
        return URL.createObjectURL(blob)
    } catch (error) {
        logger.error('loadSubtitleAsBlob error', error)
        return null
    }
}
