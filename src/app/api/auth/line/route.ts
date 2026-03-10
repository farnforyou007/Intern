import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { idToken } = await req.json()
        if (!idToken) throw new Error('ID Token is required')

        // 1. Verify LINE Token
        // The LIFF ID starts with the Channel ID
        const channelId = process.env.NEXT_PUBLIC_LIFF_ID
        // .split('-')[0]
        if (!channelId) throw new Error('NEXT_PUBLIC_LIFF_ID is not configured')

        const lineRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                id_token: idToken,
                client_id: channelId
            })
        })

        const lineData = await lineRes.json()
        if (!lineRes.ok) {
            console.error('LINE Verification Failed:', lineData)
            throw new Error(lineData.error_description || 'Invalid LINE token')
        }

        const { sub: lineUserId, name, picture } = lineData
        // We use a "Shadow Email" and "Shadow Password" based on the unique LINE User ID
        // and a server-side secret to securely bridge LINE to Supabase Auth.
        const shadowEmail = `${lineUserId}@line.ttmed.com`
        const shadowPassword = `${lineUserId}${process.env.NEXT_PUBLIC_JWT_SECRET || 'fallback_secret'}`

        const supabase = await createServerSupabase()

        // 2. Attempt Login
        let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: shadowEmail,
            password: shadowPassword
        })

        let session = loginData?.session

        // 3. If Login fails (first time), Create the user using Service Role
        if (loginError && loginError.message.includes('Invalid login credentials')) {
            if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                return NextResponse.json({
                    success: false,
                    error: 'Authentication failed. Please notify admin to configure SERVICE_ROLE_KEY.'
                }, { status: 500 })
            }

            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: shadowEmail,
                password: shadowPassword,
                email_confirm: true,
                user_metadata: { full_name: name, avatar_url: picture, line_user_id: lineUserId },
                app_metadata: { provider: 'line' }
            })

            if (createError) throw createError

            // Login again after creation
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: shadowEmail,
                password: shadowPassword
            })

            if (retryError) throw retryError
            session = retryData?.session
        } else if (loginError) {
            throw loginError
        }

        // 4. Link User ID to Database and Sync Roles
        if (session?.user) {
            const { user } = session

            // Check supervisors table
            const { data: supervisor } = await supabase
                .from('supervisors')
                .select('id, user_id, role, is_verified')
                .eq('line_user_id', lineUserId)
                .maybeSingle()

            if (supervisor) {
                // Determine target redirect path
                let redirectTo = '/register'
                if (!supervisor.is_verified) {
                    redirectTo = supervisor.role === 'teacher' ? '/teacher/pending' : '/supervisor/pending'
                } else {
                    redirectTo = supervisor.role === 'teacher' ? '/teacher/dashboard' : '/supervisor/dashboard'
                }

                // Sync critical role data to Supabase Metadata for Middleware protection
                if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                    const supabaseAdmin = createClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.SUPABASE_SERVICE_ROLE_KEY!,
                        { auth: { autoRefreshToken: false, persistSession: false } }
                    )
                    // We AWAIT this update to ensure Middleware has it on the next request
                    await supabaseAdmin.auth.admin.updateUserById(user.id, {
                        user_metadata: {
                            role: supervisor.role,
                            is_verified: supervisor.is_verified,
                            line_user_id: lineUserId
                        }
                    })
                }

                // Update link if missing
                if (!supervisor.user_id) {
                    await supabase
                        .from('supervisors')
                        .update({ user_id: user.id })
                        .eq('id', supervisor.id)
                }

                return NextResponse.json({ success: true, redirectTo })
            }
        }

        // If no supervisor record found, send to register
        return NextResponse.json({ success: true, redirectTo: '/register' })

    } catch (error: any) {
        console.error('LINE Auth Bridge Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 401 })
    }
}
