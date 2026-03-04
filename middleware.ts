import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    let res = NextResponse.next({
        request: {
            headers: req.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return req.cookies.get(name)?.value
                },
                set(name: string, value: string, options: any) {
                    req.cookies.set({ name, value, ...options })
                    res = NextResponse.next({
                        request: { headers: req.headers },
                    })
                    res.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: any) {
                    req.cookies.set({ name, value: '', ...options })
                    res = NextResponse.next({
                        request: { headers: req.headers },
                    })
                    res.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Korumalı rotalar — giriş yapılmamışsa /auth'a yönlendir
    const protectedRoutes = [
        '/koleksiyon', '/dizilerim', '/gecmis',
        '/profil', '/oneriler',
        '/listeler', '/izle'
    ]

    // Check if the route requires authentication
    const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))

    // Redirect to login if unauthenticated user tries to access a protected route
    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL('/auth', req.url))
    }

    // Redirect to profile if authenticated user tries to access login page
    if (req.nextUrl.pathname.startsWith('/auth') && session) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
