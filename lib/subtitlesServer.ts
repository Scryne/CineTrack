import { NextResponse } from 'next/server';
import type { SubtitleResult } from '@/types/player';

/**
 * Yalnız sunucuda çalışır (app/api/subtitles/route.ts). OpenSubtitles sunucu üzerinden çağrılır (app/api/omdb ile aynı desen): tarayıcı api.opensubtitles.com'a
 * gitmez, CORS'a takılmaz ve anahtar tarayıcıya inmez.
 *
 * - Arama: `GET /api/subtitles?tmdb_id=603&type=film` (dizi için `type=dizi&season=1&episode=1`)
 *   → `{ results: SubtitleResult[] }`. Anahtar yoksa ya da OpenSubtitles yanıt vermezse `{ results: [] }`.
 * - İndirme: `GET /api/subtitles?file_id=123` → SRT metni (`text/plain`). Sunucu indirme bağlantısını alır,
 *   dosyayı kendisi çeker; tarayıcı yalnız bu rotaya istek atar.
 *
 * Geçersiz anahtar (401/403) sunucuda bir saat devre dışı kalır; her sayfa açılışında yeniden denenmez.
 */
const API_BASE = 'https://api.opensubtitles.com/api/v1';
const USER_AGENT = 'CineTrack v1.0';
const FETCH_TIMEOUT_MS = 5000;
const DISABLE_MS = 60 * 60 * 1000;
const LINK_TTL_MS = 3 * 60 * 60 * 1000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

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
};

let disabledUntil = 0;
// İndirme kotasını korumak için: file_id → indirme bağlantısı (OpenSubtitles bağlantısı ~3 saat geçerli).
const linkCache = new Map<number, { link: string; at: number }>();

function getKey(): string {
    return process.env.OPENSUBTITLES_KEY || process.env.NEXT_PUBLIC_OPENSUBTITLES_KEY || '';
}

/** Yalnız testler için: modül durumunu sıfırlar. */
export function __resetForTests() {
    disabledUntil = 0;
    linkCache.clear();
}

function headers(key: string): HeadersInit {
    return {
        'Api-Key': key,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
    };
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        return await fetch(url, { ...init, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
}

function checkAuth(res: Response): boolean {
    if (res.status === 401 || res.status === 403) {
        disabledUntil = Date.now() + DISABLE_MS;
        console.warn('[OpenSubtitles] Anahtar geçersiz; bir saat çağrılmayacak.');
        return false;
    }
    return true;
}

const empty = () => NextResponse.json({ results: [] as SubtitleResult[] });

const LANG_RE = /^[a-z]{2}(-[a-z]{2})?$/i;

async function search(params: URLSearchParams, key: string) {
    const tmdbId = params.get('tmdb_id') ?? '';
    const type = params.get('type');
    if (!/^\d{1,10}$/.test(tmdbId) || (type !== 'film' && type !== 'dizi')) {
        return NextResponse.json({ error: 'Geçersiz arama parametresi' }, { status: 400 });
    }
    if (!key || Date.now() < disabledUntil) return empty();

    const query = new URLSearchParams();
    // OpenSubtitles dizilerde bölümü üst kimlikle (parent_tmdb_id) arar.
    if (type === 'dizi') {
        query.set('parent_tmdb_id', tmdbId);
        const season = params.get('season');
        const episode = params.get('episode');
        if (season && /^\d{1,3}$/.test(season)) query.set('season_number', season);
        if (episode && /^\d{1,4}$/.test(episode)) query.set('episode_number', episode);
        query.set('type', 'episode');
    } else {
        query.set('tmdb_id', tmdbId);
        query.set('type', 'movie');
    }
    const languages = (params.get('languages') ?? 'tr,en')
        .split(',')
        .map((l) => l.trim().toLowerCase())
        .filter((l) => LANG_RE.test(l));
    query.set('languages', (languages.length ? languages : ['tr', 'en']).sort().join(','));
    query.set('order_by', 'download_count');

    try {
        const res = await fetchWithTimeout(`${API_BASE}/subtitles?${query}`, { headers: headers(key) });
        if (!checkAuth(res) || !res.ok) return empty();
        const json = await res.json();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const results: SubtitleResult[] = (json?.data ?? []).map((item: any) => {
            const attrs = item?.attributes ?? {};
            const lang: string = attrs.language ?? '';
            return {
                id: Number(item.id),
                language: lang,
                languageName: LANGUAGE_MAP[lang] ?? lang.toUpperCase(),
                rating: Number(attrs.ratings) || 0,
                downloadCount: Number(attrs.download_count) || 0,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                files: (attrs.files ?? []).map((f: any) => ({
                    fileId: Number(f.file_id),
                    fileName: f.file_name ?? '',
                })),
            };
        });
        results.sort((a, b) => b.rating - a.rating || b.downloadCount - a.downloadCount);

        return NextResponse.json(
            { results },
            { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
        );
    } catch {
        return empty();
    }
}

async function download(fileIdRaw: string, key: string) {
    if (!/^\d{1,12}$/.test(fileIdRaw)) {
        return NextResponse.json({ error: 'Geçersiz dosya kimliği' }, { status: 400 });
    }
    if (!key || Date.now() < disabledUntil) {
        return NextResponse.json({ error: 'Altyazı servisi kullanılamıyor' }, { status: 503 });
    }
    const fileId = Number(fileIdRaw);
    const unavailable = () => NextResponse.json({ error: 'Altyazı indirilemedi' }, { status: 502 });

    try {
        let link = linkCache.get(fileId);
        if (!link || Date.now() - link.at > LINK_TTL_MS) {
            const res = await fetchWithTimeout(`${API_BASE}/download`, {
                method: 'POST',
                headers: headers(key),
                body: JSON.stringify({ file_id: fileId }),
            });
            if (!checkAuth(res) || !res.ok) return unavailable();
            const json = await res.json();
            if (typeof json?.link !== 'string' || !json.link.startsWith('https://')) return unavailable();
            link = { link: json.link, at: Date.now() };
            linkCache.set(fileId, link);
        }

        const file = await fetchWithTimeout(link.link, { headers: { 'User-Agent': USER_AGENT } });
        if (!file.ok) {
            linkCache.delete(fileId);
            return unavailable();
        }
        const text = await file.text();
        if (text.length > MAX_FILE_BYTES) return unavailable();

        return new NextResponse(text, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Cache-Control': 'private, max-age=10800',
            },
        });
    } catch {
        return unavailable();
    }
}

export async function handleSubtitlesRequest(url: string): Promise<Response> {
    const params = new URL(url).searchParams;
    const key = getKey();
    const fileId = params.get('file_id');
    if (fileId !== null) return download(fileId, key);
    return search(params, key);
}
