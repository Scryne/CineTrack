import { NextRequest, NextResponse } from 'next/server';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const PROXY_BASE = 'https://api.codetabs.com/v1/proxy/?quest=';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
        return NextResponse.json({ error: 'Missing endpoint parameter' }, { status: 400 });
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
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(tmdbUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json();
            return NextResponse.json(data, {
                headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' },
            });
        }
    } catch {
        // Direct fetch failed — fall through to proxy
    }

    // Attempt 2: Proxy-based fetch (bypass ISP block)
    try {
        const proxyUrl = `${PROXY_BASE}${encodeURIComponent(tmdbUrl)}`;
        const res = await fetch(proxyUrl);

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
    }
}
