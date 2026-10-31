import { NextRequest, NextResponse } from 'next/server';

/**
 * OMDB (IMDb, Rotten Tomatoes, Metacritic puanları) sunucu üzerinden çağrılır: anahtar tarayıcıya
 * inmez, geçersiz anahtar (401) sunucuda bir saat devre dışı kalır ve tarayıcı konsoluna her
 * sayfada bir ağ hatası düşmez. Yanıt yoksa puan kutusu yalnız TMDB puanını gösterir.
 */
const OMDB_BASE = 'https://www.omdbapi.com';
const OMDB_KEY = process.env.OMDB_API_KEY ?? process.env.NEXT_PUBLIC_OMDB_KEY;
const FETCH_TIMEOUT_MS = 4000;
const DISABLE_MS = 60 * 60 * 1000;
let disabledUntil = 0;

type OMDBResponse = {
    Response: 'True' | 'False';
    imdbRating?: string;
    imdbVotes?: string;
    Ratings?: { Source: string; Value: string }[];
};

export async function GET(request: NextRequest) {
    const imdbId = new URL(request.url).searchParams.get('i') ?? '';
    if (!/^tt\d{5,10}$/.test(imdbId)) {
        return NextResponse.json({ error: 'Geçersiz IMDb kimliği' }, { status: 400 });
    }
    if (!OMDB_KEY || Date.now() < disabledUntil) {
        return NextResponse.json({ ratings: null });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(`${OMDB_BASE}/?${new URLSearchParams({ apikey: OMDB_KEY, i: imdbId })}`, {
            signal: controller.signal,
        });
        if (res.status === 401) {
            disabledUntil = Date.now() + DISABLE_MS;
            console.warn('[OMDB] Anahtar geçersiz; bir saat çağrılmayacak.');
            return NextResponse.json({ ratings: null });
        }
        if (!res.ok) return NextResponse.json({ ratings: null });

        const data = (await res.json()) as OMDBResponse;
        if (data.Response === 'False') return NextResponse.json({ ratings: null });

        const find = (source: string) => data.Ratings?.find((r) => r.Source === source)?.Value ?? null;
        return NextResponse.json(
            {
                ratings: {
                    imdbRating: data.imdbRating ?? null,
                    imdbVotes: data.imdbVotes ?? null,
                    rottenTomatoes: find('Rotten Tomatoes'),
                    metacritic: find('Metacritic'),
                },
            },
            { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
        );
    } catch {
        return NextResponse.json({ ratings: null });
    } finally {
        clearTimeout(timeout);
    }
}
