import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

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
                        request: { headers: request.headers },
                    })
                    // เพิ่มการตั้งค่าเพื่อความปลอดภัยบน HTTPS
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                        sameSite: 'lax',
                        httpOnly: true,
                        secure: true // บังคับใช้บน Vercel (HTTPS)
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({ name, value: '', ...options })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    response.cookies.set({ name, value: '', ...options })
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    // 1. Define Routes
    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
    const isTeacherRoute = pathname.startsWith('/teacher') || pathname.startsWith('/api/teacher')
    const isSupervisorRoute = pathname.startsWith('/supervisor') || pathname.startsWith('/api/supervisor')
    const isAuthPage = pathname === '/auth/login' || pathname.startsWith('/auth/callback')
    const isLandingPage = pathname === '/'

    // 2. Authentication & Authorization Logic
    if (!user) {
        // Redirect or Error if trying to access protected routes without a session
        if (pathname.startsWith('/api/')) {
            if (isAdminRoute || isTeacherRoute || isSupervisorRoute) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
            }
        } else {
            if (isAdminRoute) return NextResponse.redirect(new URL('/auth/login', request.url))
            if (isTeacherRoute || isSupervisorRoute) return NextResponse.redirect(new URL('/', request.url))
        }
    } else {
        const provider = user.app_metadata?.provider
        const role = user.user_metadata?.role

        // 1. Admin Protection (Email provider only)
        if (isAdminRoute) {
            if (provider !== 'email') {
                if (pathname.startsWith('/api/')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
                return NextResponse.redirect(new URL('/', request.url))
            }
        }

        // 2. Teacher vs Supervisor Protection (Line provider)
        if (isTeacherRoute || isSupervisorRoute) {
            if (provider !== 'line') {
                if (pathname.startsWith('/api/')) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
                return NextResponse.redirect(new URL('/admin', request.url))
            }

            // Cross-Role Protection
            // If role metadata exists, enforce it. If it doesn't, let the layout handle it to avoid loops.
            if (role) {
                if ((isTeacherRoute && role !== 'teacher' && role !== 'both') ||
                    (isSupervisorRoute && role !== 'supervisor' && role !== 'both')) {

                    if (pathname.startsWith('/api/')) {
                        return NextResponse.json({ success: false, error: 'Forbidden: Role mismatch' }, { status: 403 })
                    }
                    return NextResponse.redirect(new URL('/', request.url))
                }
            }
        }

        // 3. Prevent redundant login page visits
        if (isAuthPage && provider === 'email') return NextResponse.redirect(new URL('/admin', request.url))

        // IMPORTANT: NEVER redirect FROM '/' to dashboard in Middleware for LINE users.
        // Doing so causes redirect loops because metadata might be missing in the JWT.
        // Let SplitHomePage's autoCheckLogin handle the dashbord redirection via DB check.
        if (isLandingPage && provider === 'email') {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}