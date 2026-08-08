import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const PROXY_BASE = 'https://api.codetabs.com/v1/proxy/?quest=';
const FETCH_TIMEOUT_MS = 4000;

// Yalnızca lib/tmdb.ts'in gerçekten çağırdığı uçlara izin verilir.
// Bu liste lib/tmdb.ts'ten birebir türetilmiştir; oraya yeni bir uç
// eklenirse buraya da eklenmelidir, aksi halde istek 400 döner.
const ALLOWED_ENDPOINTS: RegExp[] = [
    /^\/search\/(multi|person)$/,                    // searchMulti, searchPerson
    /^\/trending\/(movie|tv|all)\/week$/,            // getTrendingMovies/Series/All
    /^\/discover\/(movie|tv)$/,                      // getPopularMovies, getMoviesByGenre, getSeriesByGenre, getByGenres, discoverMovies, discoverSeries
    /^\/movie\/upcoming$/,                           // getUpcomingMovies
    /^\/tv\/(airing_today|on_the_air)$/,             // getAiringToday, getOnTheAir
    /^\/movie\/\d+$/,                                // getMovieDetail
    /^\/tv\/\d+$/,                                   // getSeriesDetail, getSeriesNextEpisode
    /^\/person\/\d+$/,                               // getPersonDetail
    /^\/tv\/\d+\/external_ids$/,                     // getSeriesExternalIds
    /^\/tv\/\d+\/season\/\d+$/,                      // getSeasonDetail
    /^\/(movie|tv)\/\d+\/similar$/,                  // getSimilar
    /^\/(movie|tv)\/\d+\/recommendations$/,          // getRecommendations
    /^\/(movie|tv)\/\d+\/watch\/providers$/,         // getWatchProviders
];

function isAllowedEndpoint(endpoint: string): boolean {
    return ALLOWED_ENDPOINTS.some((pattern) => pattern.test(endpoint));
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
        return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
    }

    if (!isAllowedEndpoint(endpoint)) {
        return NextResponse.json({ error: 'Endpoint not allowed' }, { status: 400 });
    }

    if (!TMDB_KEY) {
        return NextResponse.json({ error: 'TMDB API key not configured' }, { status: 500 });
    }

    // Build TMDB params (exclude our 'endpoint' param)
    const tmdbParams = new URLSearchParams();
    tmdbParams.set('api_key', TMDB_KEY);
    searchParams.forEach((value, key) => {
        if (key !== 'endpoint') {
            tmdbParams.set(key, value);
        }
    });

    const tmdbUrl = `${TMDB_BASE}${endpoint}?${tmdbParams.toString()}`;

    // Attempt 1: Direct fetch (may fail due to ISP DNS/IP block)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(tmdbUrl, { signal: controller.signal });

        if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data, {
                headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
            });
        }
    } catch {
        // Direct fetch failed — fall through to proxy
    } finally {
        // fetch reddedilirse de zamanlayıcı temizlensin
        clearTimeout(timeout);
    }

    // Attempt 2: Proxy-based fetch (bypass ISP block)
    const proxyController = new AbortController();
    const proxyTimeout = setTimeout(() => proxyController.abort(), FETCH_TIMEOUT_MS);
    try {
        const proxyUrl = `${PROXY_BASE}${encodeURIComponent(tmdbUrl)}`;
        const res = await fetch(proxyUrl, { signal: proxyController.signal });

        if (!res.ok) {
            return NextResponse.json({ error: `TMDB proxy error: ${res.status}` }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
        });
    } catch (error) {
        console.error('TMDB proxy fallback error:', error);
        return NextResponse.json({ error: 'Failed to fetch from TMDB' }, { status: 502 });
    } finally {
        clearTimeout(proxyTimeout);
    }
}
