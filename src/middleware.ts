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

    // ตรวจสอบสิทธิ์การเข้าถึงโฟลเดอร์ต่างๆ
    if (pathname.startsWith('/admin') && !user) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user && pathname === '/login') {
        return NextResponse.redirect(new URL('/admin/supervisors', request.url))
    }

    return response
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}