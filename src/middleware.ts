import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

     const supabaseC = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { session } } = await supabaseC.auth.getSession()

    // ถ้าไม่มี session และไม่ใช่หน้า login ให้เด้งไป login
    if (!session && request.nextUrl.pathname.startsWith('/admin')) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        return NextResponse.redirect(redirectUrl)
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({ name, value, ...options })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )


    // ตรวจสอบ Session
    const { data: { user } } = await supabase.auth.getUser()

    // --- Logic การป้องกันหน้า Admin ---
    // หากพยายามเข้าหน้า /admin แต่ไม่ได้ล็อกอิน ให้ส่งไปหน้า /login
    if (!user && request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // หากล็อกอินแล้วแต่พยายามเข้าหน้า /login ให้ส่งไปหน้า /admin แทน
    if (user && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/admin/supervisors', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes - เว้นไว้ให้ Webhook ของ LINE เข้าได้)
         */
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
}

