import type { SubtitleSearchParams, SubtitleResult } from '@/types/player'
import { logger } from './logger'

/**
 * Altyazı istemcisi. Arama ve indirme sunucu rotasından geçer (app/api/subtitles): tarayıcı
 * api.opensubtitles.com'a doğrudan gitmez (CORS), anahtar tarayıcıya inmez. Anahtar yoksa ya da
 * servis yanıt vermezse arama boş liste döner; oynatıcı "altyazı yok" durumunu gösterir.
 */
const ROUTE = '/api/subtitles'

/** Altyazıları arar. Sonuçlar sunucuda puan ve indirme sayısına göre sıralanır. */
export async function searchSubtitles(params: SubtitleSearchParams): Promise<SubtitleResult[]> {
    try {
        const query = new URLSearchParams()
        query.set('tmdb_id', params.tmdbId)
        query.set('type', params.type)
        if (params.type === 'dizi' && params.season !== undefined) query.set('season', String(params.season))
        if (params.type === 'dizi' && params.episode !== undefined) query.set('episode', String(params.episode))
        if (params.languages?.length) query.set('languages', params.languages.join(','))

        const response = await fetch(`${ROUTE}?${query}`)
        if (!response.ok) return []
        const json = (await response.json()) as { results?: SubtitleResult[] }
        return Array.isArray(json.results) ? json.results : []
    } catch (error) {
        logger.error('searchSubtitles error', error)
        return []
    }
}

/**
 * Bir altyazı dosyasının indirme adresi. Adres aynı kökendeki sunucu rotasıdır; dosyayı sunucu
 * OpenSubtitles'tan çeker (indirme bağlantısını sunucu önbellekler, kota korunur).
 */
export async function getSubtitleDownloadUrl(fileId: number): Promise<string | null> {
    if (!Number.isInteger(fileId) || fileId <= 0) return null
    return `${ROUTE}?file_id=${fileId}`
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
