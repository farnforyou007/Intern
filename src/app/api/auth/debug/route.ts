import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/debug
 * ONLY ENABLED IN DEVELOPMENT
 * Simulates a LINE login by bypassing token verification
 */
export async function POST(req: Request) {
    // SECURITY: Strictly forbidden in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Forbidden in production' }, { status: 403 })
    }

    try {
        const { lineUserId, name } = await req.json()
        if (!lineUserId) throw new Error('lineUserId is required for debug login')

        // Use the same shadow logic as real LINE bridge
        const shadowEmail = `${lineUserId}@line.ttmed.com`
        const shadowPassword = `${lineUserId}${process.env.NEXT_PUBLIC_JWT_SECRET || 'fallback_secret'}`

        const supabase = await createServerSupabase()

        // 1. Attempt Login
        let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: shadowEmail,
            password: shadowPassword
        })

        let session = loginData?.session

        // 2. If Login fails, create user using Service Role
        if (loginError && loginError.message.includes('Invalid login credentials')) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: shadowEmail,
                password: shadowPassword,
                email_confirm: true,
                user_metadata: {
                    full_name: name || 'Debug User',
                    avatar_url: 'https://cdn-icons-png.flaticon.com/512/0/93.png',
                    line_user_id: lineUserId
                },
                app_metadata: { provider: 'line' }
            })

            if (createError) throw createError

            // Login after creation
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: shadowEmail,
                password: shadowPassword
            })
            if (retryError) throw retryError
            session = retryData?.session
        } else if (loginError) {
            throw loginError
        }

        // 3. Link User ID to Database and Sync Roles
        if (session?.user) {
            const { user } = session
            const { data: supervisor } = await supabase
                .from('supervisors')
                .select('id, user_id, role, is_verified')
                .eq('line_user_id', lineUserId)
                .maybeSingle()

            // ✅ บังคับอัปเดต Metadata ทุกครั้งที่ Login (เพื่อให้แน่ใจว่า registration API จะเห็น)
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: {
                    ...(user.user_metadata || {}),
                    full_name: name || user.user_metadata?.full_name || 'Debug User',
                    line_user_id: lineUserId
                }
            })

            if (supervisor) {
                // ... (Existing role sync logic)
                let redirectTo = '/register'
                if (!supervisor.is_verified) {
                    redirectTo = supervisor.role === 'teacher' ? '/teacher/pending' : '/supervisor/pending'
                } else {
                    redirectTo = supervisor.role === 'teacher' ? '/teacher/dashboard' : '/supervisor/dashboard'
                }

                // Sync critical role data to Supabase Metadata
                await supabaseAdmin.auth.admin.updateUserById(user.id, {
                    user_metadata: {
                        ...(user.user_metadata || {}),
                        role: supervisor.role,
                        is_verified: supervisor.is_verified,
                        line_user_id: lineUserId,
                        full_name: name || user.user_metadata?.full_name || 'Debug User'
                    }
                })

                if (!supervisor.user_id) {
                    await supabase
                        .from('supervisors')
                        .update({ user_id: user.id })
                        .eq('id', supervisor.id)
                }

                return NextResponse.json({ success: true, redirectTo })
            }
        }

        return NextResponse.json({ success: true, redirectTo: '/register' })

    } catch (error: any) {
        console.error('Debug Auth Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
