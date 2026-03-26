// api/auth/line/route.ts

import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    // ✅ Lazy Admin Client — สร้างตอน runtime เท่านั้น (ไม่สร้างตอน build ป้องกัน Docker พัง)
    const getAdmin = () => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )

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
        // ✅ ใช้ supabaseAdmin เพราะขั้นตอนนี้ยังไม่มี Session (ก่อน signInWithPassword)
        const { data: supervisorRecord } = await getAdmin()
            .from('supervisors')
            .select('user_id')
            .eq('line_user_id', lineUserId)
            .maybeSingle()

        if (supervisorRecord?.user_id) {
            const { data: { user: authUser }, error: getError } = await getAdmin().auth.admin.getUserById(supervisorRecord.user_id)

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

        // 3. If Login fails (account deleted, first time, or password mismatch), Create or Repair the user
        if (loginError) {
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            // Check if user actually exists in Auth
            const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
            const existingAuthUser = users.find(u => u.email === shadowEmail || u.email === loginEmail)

            if (existingAuthUser) {
                console.log('User exists but login failed (likely password mismatch). Repairing password...');
                // Repair Password: Update to current shadow password logic
                const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
                    password: shadowPassword,
                    email_confirm: true
                })
                if (updateError) throw updateError

                // Retry login
                const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                    email: existingAuthUser.email!,
                    password: shadowPassword
                })
                if (retryError) throw retryError
                session = retryData?.session
            } else if (loginError.message.includes('Invalid login credentials')) {
                // Truly a new user
                const { data: { user: newUser }, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: shadowEmail,
                    password: shadowPassword,
                    email_confirm: true,
                    user_metadata: {
                        full_name: name,
                        name: name,
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
            } else {
                throw loginError
            }
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

            console.log('🔍 [Bridge] Looking up supervisor:', {
                lineUserId,
                authUserId: user.id,
                loginEmail
            })

            // ✅ ใช้ supabaseAdmin เพื่อข้าม RLS (แก้ปัญหา user_id ไม่ตรงหลังซ่อมรหัสผ่าน)
            const { data: supervisor, error: supervisorError } = await getAdmin()
                .from('supervisors')
                .select('id, user_id, role, is_verified')
                .eq('line_user_id', lineUserId)
                .maybeSingle()

            if (supervisorError) {
                console.error('❌ [Bridge] Supervisor lookup error:', supervisorError.message);
            }

            // 🔄 Fallback: ถ้าค้นด้วย line_user_id ไม่เจอ → ลองค้นด้วย user_id
            let finalSupervisor = supervisor
            if (!finalSupervisor && !supervisorError) {
                console.log('⚠️ [Bridge] Supervisor not found by line_user_id, trying user_id fallback...', { lineUserId, authUserId: user.id })

                const { data: fallbackSv, error: fallbackError } = await getAdmin()
                    .from('supervisors')
                    .select('id, user_id, role, is_verified, line_user_id')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (fallbackError) {
                    console.error('❌ [Bridge] Fallback lookup error:', fallbackError.message);
                }

                if (fallbackSv) {
                    console.log('✅ [Bridge] Found via user_id fallback! Repairing line_user_id...', {
                        supervisorId: fallbackSv.id,
                        oldLineUserId: fallbackSv.line_user_id,
                        newLineUserId: lineUserId
                    })
                    // Auto-repair: อัพเดท line_user_id ให้ตรงกับที่ LINE ส่งมาจริง
                    await getAdmin()
                        .from('supervisors')
                        .update({ line_user_id: lineUserId })
                        .eq('id', fallbackSv.id)
                    finalSupervisor = fallbackSv
                }
            }

            console.log('📋 [Bridge] Supervisor lookup result:', {
                found: !!finalSupervisor,
                supervisorId: finalSupervisor?.id,
                supervisorRole: finalSupervisor?.role,
                isVerified: finalSupervisor?.is_verified
            })

            if (finalSupervisor) {
                // Determine target redirect path
                let redirectTo = '/register'
                if (!finalSupervisor.is_verified) {
                    redirectTo = finalSupervisor.role === 'teacher' ? '/teacher/pending' : '/supervisor/pending'
                } else {
                    redirectTo = finalSupervisor.role === 'teacher' ? '/teacher/dashboard' : '/supervisor/dashboard'
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
                            role: finalSupervisor.role,
                            is_verified: finalSupervisor.is_verified,
                            line_user_id: lineUserId
                        }
                    })
                }

                // Update link if missing or changed (e.g. after re-creation)
                if (finalSupervisor.user_id !== user.id) {
                    console.log('🔧 [Bridge] Updating supervisor user_id link:', { old: finalSupervisor.user_id, new: user.id });
                    await getAdmin()
                        .from('supervisors')
                        .update({ user_id: user.id })
                        .eq('id', finalSupervisor.id)
                }

                return NextResponse.json({ success: true, redirectTo, user, session })
            }
        }

        // If no supervisor record found, send to register
        console.log('📭 [Bridge] No supervisor record found for this user. Redirecting to /register', {
            hasSession: !!session?.user,
            authUserId: session?.user?.id,
            lineUserId: lineData?.sub
        })
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
