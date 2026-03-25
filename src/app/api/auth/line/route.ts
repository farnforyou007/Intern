// api/auth/line/route.ts

import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const { idToken } = await req.json()
        if (!idToken) throw new Error('ID Token is required')

        // 1. Verify LINE Token
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (!liffId) {
            console.error('Missing NEXT_PUBLIC_LIFF_ID');
            throw new Error('NEXT_PUBLIC_LIFF_ID is not configured');
        }

        const channelId = liffId.split('-')[0];
        console.log('Verifying LINE token for Channel ID:', channelId);

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
            console.error('LINE Verification Failed:', { lineData, channelId });
            throw new Error(`LINE Verifier: ${lineData.error_description || 'Invalid LINE token'}`);
        }

        const { sub: lineUserId, name, picture } = lineData
        const shadowEmail = `${lineUserId}@line.ttmed.com`
        const shadowPassword = `${lineUserId}${process.env.NEXT_PUBLIC_JWT_SECRET || 'fallback_secret'}`
        let loginEmail = shadowEmail

        const supabase = await createServerSupabase()

        // 1.5. Robust Lookup: Find existing user by line_user_id
        const { data: supervisorRecord } = await supabase
            .from('supervisors')
            .select('user_id')
            .eq('line_user_id', lineUserId)
            .maybeSingle()

        if (supervisorRecord?.user_id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            const { data: { user: authUser }, error: getError } = await supabaseAdmin.auth.admin.getUserById(supervisorRecord.user_id)

            if (!getError && authUser?.email) {
                loginEmail = authUser.email
            }
        }

        // 2. Attempt Login
        let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: shadowPassword
        })

        let session = loginData?.session

        // 3. If Login fails (account deleted or first time), Create the user
        if (loginError && loginError.message.includes('Invalid login credentials')) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: shadowEmail,
                password: shadowPassword,
                email_confirm: true,
                user_metadata: { 
                    full_name: name, 
                    name: name, // redundantly store for compatibility
                    avatar_url: picture, 
                    line_user_id: lineUserId 
                },
                app_metadata: { provider: 'line' }
            })

            if (createError) throw createError

            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: shadowEmail,
                password: shadowPassword
            })

            if (retryError) throw retryError
            session = retryData?.session
        } else if (loginError) {
            throw loginError
        }

        // 4. Robust Metadata Sync: Always ensure metadata has LINE info
        if (session?.user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            const { user } = session
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            await supabaseAdmin.auth.admin.updateUserById(user.id, {
                user_metadata: {
                    ...(user.user_metadata || {}),
                    full_name: name || user.user_metadata?.full_name || user.user_metadata?.name,
                    name: name || user.user_metadata?.name || user.user_metadata?.full_name,
                    avatar_url: picture || user.user_metadata?.avatar_url,
                    line_user_id: lineUserId
                }
            })
        }

        // 5. Link User ID to Database and Sync Roles
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
                    await supabaseAdmin.auth.admin.updateUserById(user.id, {
                        user_metadata: {
                            ...(user.user_metadata || {}),
                            role: supervisor.role,
                            is_verified: supervisor.is_verified,
                            line_user_id: lineUserId
                        }
                    })
                }

                // Update link if missing or changed (e.g. after re-creation)
                if (supervisor.user_id !== user.id) {
                    await supabase
                        .from('supervisors')
                        .update({ user_id: user.id })
                        .eq('id', supervisor.id)
                }

                return NextResponse.json({ success: true, redirectTo, user, session })
            }
        }

        // If no supervisor record found, send to register
        return NextResponse.json({ success: true, redirectTo: '/register', user: session?.user, session })

    } catch (error: any) {
        console.error('LINE Auth Bridge Detailed Error:', {
            message: error.message,
            stack: error.stack,
            env: {
                hasLiffId: !!process.env.NEXT_PUBLIC_LIFF_ID,
                hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
                hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL
            }
        })
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, { status: 401 })
    }
}
