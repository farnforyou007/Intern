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
                    response.cookies.set({ name, value, ...options })
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

    // ใช้ getUser() เพื่อความปลอดภัยและเสถียรที่สุดในการเช็ก Server-side
    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    if (user) {
    // ดึงข้อมูล role จากตารางที่เราสร้างไว้
    const { data: profile } = await supabase
        .from('supervisors')
        .select('role') // สมมติว่ามีคอลัมน์ role
        .eq('id', user.id)
        .single()

    // ถ้าจะเข้าหน้า /admin แต่ role ไม่ใช่ admin ให้เตะออก
    if (pathname.startsWith('/admin') && profile?.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
}

    // --- 1. ป้องกันหน้า Admin ---
    if (pathname.startsWith('/admin') && !user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // --- 2. ป้องกันหน้า Teacher (อาจารย์) ---
    if (pathname.startsWith('/teacher') && !user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // --- 3. ป้องกันหน้า Supervisor (พี่เลี้ยง) ---
    // ยกเว้นหน้า /supervisor/register ที่ให้คนทั่วไปเข้าถึงได้เพื่อลงทะเบียน
    if (pathname.startsWith('/supervisor') && !pathname.includes('/register') && !user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // --- 4. ถ้าล็อกอินแล้ว ห้ามกลับไปหน้า Login ---
    if (user && pathname === '/auth/login') {
        // เช็กสิทธิ์เบื้องต้นเพื่อส่งไปหน้าเริ่มต้นที่ถูกต้อง (ในอนาคตปรับตาม metadata ของ user ได้)
        return NextResponse.redirect(new URL('/admin/supervisors', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * ครอบคลุมทุกหน้ายกเว้นไฟล์ static, รูปภาพ และ Webhook API
         */
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
}