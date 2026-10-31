import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isLocalMode } from '@/lib/dataMode'

// Next 16: middleware dosyası ve fonksiyonu "proxy" adını aldı.
export async function proxy(req: NextRequest) {
    // Yerel modda hesap yok: her rota açık, giriş sayfası anlamsız.
    if (isLocalMode) {
        if (req.nextUrl.pathname.startsWith('/auth')) return NextResponse.redirect(new URL('/', req.url))
        return NextResponse.next()
    }

    let res = NextResponse.next({
        request: {
            headers: req.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next()
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                getAll: () => req.cookies.getAll(),
                setAll: (toSet) => {
                    for (const { name, value } of toSet) req.cookies.set(name, value)
                    res = NextResponse.next({ request: { headers: req.headers } })
                    for (const { name, value, options } of toSet) res.cookies.set(name, value, options)
                },
            },
        }
    )

    // getUser() validates JWT, unlike getSession() which only reads cookies
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Korumalı rotalar — giriş yapılmamışsa /auth'a yönlendir
    const protectedRoutes = [
        '/koleksiyon', '/dizilerim', '/gecmis',
        '/profil', '/oneriler',
        '/listeler'
    ]

    // Check if the route requires authentication
    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

    // Redirect to login if unauthenticated user tries to access a protected route
    if (isProtectedRoute && !user) {
        return NextResponse.redirect(new URL('/auth', req.url))
    }

    // Redirect to home if authenticated user tries to access login page
    if (req.nextUrl.pathname.startsWith('/auth') && user) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
