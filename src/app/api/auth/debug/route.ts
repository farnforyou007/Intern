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

        const shadowEmail = `${lineUserId}@line.ttmed.com`
        const shadowPassword = `${lineUserId}${process.env.NEXT_PUBLIC_JWT_SECRET || 'fallback_secret'}`
        let loginEmail = shadowEmail

        const supabase = await createServerSupabase()

        // 1.5. Robust Lookup: Find existing user by line_user_id
        const { data: supervisor } = await supabase
            .from('supervisors')
            .select('user_id')
            .eq('line_user_id', lineUserId)
            .maybeSingle()

        if (supervisor?.user_id) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            const { data: { user: authUser }, error: getError } = await supabaseAdmin.auth.admin.getUserById(supervisor.user_id)

            if (!getError && authUser?.email) {
                loginEmail = authUser.email
                console.log('Found existing user email (Debug Mode):', { lineUserId, currentEmail: loginEmail })
            }
        }

        // 2. Attempt Login
        let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: shadowPassword
        })

        let session = loginData?.session

        if (loginError) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            // Check if user exists
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
            const existingAuthUser = users.find(u => u.email === shadowEmail || u.email === loginEmail)

            if (existingAuthUser) {
                // Repair password
                await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
                    password: shadowPassword,
                    email_confirm: true
                })
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                    email: existingAuthUser.email!,
                    password: shadowPassword
                })
                if (retryError) throw retryError
                session = retryData?.session
            } else if (loginError.message.includes('Invalid login credentials')) {
                const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: shadowEmail,
                    password: shadowPassword,
                    email_confirm: true,
                    user_metadata: { full_name: name, line_user_id: lineUserId },
                })
                if (createError) throw createError
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                    email: shadowEmail,
                    password: shadowPassword
                })
                if (retryError) throw retryError
                session = retryData?.session
            } else {
                throw loginError
            }
        }

        // 3. Robust Metadata Sync: Always update metadata with latest info
        if (session?.user) {
            const { user } = session
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: {
                    ...(user.user_metadata || {}),
                    full_name: name || user.user_metadata?.full_name || user.user_metadata?.name || 'Debug User',
                    name: name || user.user_metadata?.name || user.user_metadata?.full_name || 'Debug User',
                    line_user_id: lineUserId
                }
            })

            const { data: supervisor } = await supabase
                .from('supervisors')
                .select('id, user_id, role, is_verified')
                .eq('line_user_id', lineUserId)
                .maybeSingle()

            if (supervisor) {
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
                        full_name: name || user.user_metadata?.full_name || user.user_metadata?.name || 'Debug User'
                    }
                })

                // Update link if missing or changed
                if (supervisor.user_id !== user.id) {
                    await supabase
                        .from('supervisors')
                        .update({ user_id: user.id })
                        .eq('id', supervisor.id)
                }

                return NextResponse.json({ success: true, redirectTo, user, session })
            }
        }

        return NextResponse.json({ success: true, redirectTo: '/register', user: session?.user, session })

    } catch (error: any) {
        console.error('Debug Auth Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
