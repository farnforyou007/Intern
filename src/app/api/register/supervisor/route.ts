import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const supabase = await createServerSupabase()
    try {
        const { data: sites } = await supabase.from('training_sites').select('id, site_name, province')
        const { data: subjects } = await supabase.from('subjects').select('*').order('id')
        const { data: subSubjects } = await supabase.from('sub_subjects').select('*').order('id')

        return NextResponse.json({
            success: true,
            data: { sites, subjects, subSubjects }
        })
    } catch (error: any) {
        console.error('Supervisor register init error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            fullName,
            phone,
            email,
            avatarUrl,
            siteId,
            province,
            role,
            selectedSubjects,
            selectedSubSubjects,
            lineUserId: clientLineUserId // ✅ รับ lineUserId จาก Client เพื่อใช้เป็น Fallback
        } = body

        const supabase = await createServerSupabase()
        let { data: { user } } = await supabase.auth.getUser()

        // ----------------------------------------------------------------
        // ✅ FALLBACK: ถ้า Cookie Session หาย (เช่น HTTP หรือมือถือบางรุ่น)
        // ให้ใช้ Admin Client ค้นหา user จาก lineUserId ที่ Client ส่งมาแทน
        // ----------------------------------------------------------------
        if (!user && clientLineUserId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.log('Cookie session lost. Attempting fallback lookup for LINE ID:', clientLineUserId);

            const { createClient } = await import('@supabase/supabase-js')
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )

            // ค้นหา user จาก metadata (line_user_id)
            const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
            const foundUser = users?.find(u =>
                u.user_metadata?.line_user_id === clientLineUserId ||
                u.app_metadata?.line_user_id === clientLineUserId
            )

            if (foundUser) {
                user = foundUser as any
                console.log('Fallback: Found user via Admin lookup:', foundUser.id);
            }
        }

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized. Please login via LINE first.' }, { status: 401 })
        }

        const lineUserId = user.user_metadata?.line_user_id || user.app_metadata?.line_user_id || user.user_metadata?.sub || clientLineUserId;
        const lineDisplayName = user.user_metadata?.full_name || user.user_metadata?.display_name || user.user_metadata?.name || 'Unknown User';

        console.log('Registering Supervisor:', {
            lineUserId,
            lineDisplayName,
            userId: user.id,
            formEmail: email
        });

        if (!lineUserId) {
            return NextResponse.json({
                success: false,
                error: 'Identity Error: line_user_id is missing from session metadata. Please logout and login again.'
            }, { status: 400 })
        }

        // **เช็คก่อนว่ามีไลน์นี้ลงทะเบียนไปแล้วหรือยัง**
        const { data: existingSupervisor } = await supabase
            .from('supervisors')
            .select('id')
            .eq('line_user_id', lineUserId)
            .maybeSingle()

        if (existingSupervisor) {
            return NextResponse.json({
                success: false,
                error: 'บัญชี LINE นี้ถูกใช้งานลงทะเบียนไปแล้ว'
            }, { status: 400 })
        }

        // 1. บันทึกข้อมูลลงตาราง supervisors
        const { data: supervisor, error: insError } = await supabase
            .from('supervisors')
            .insert([{
                user_id: user.id, // Linking to Supabase Auth
                line_user_id: lineUserId,
                line_display_name: lineDisplayName,
                full_name: fullName,
                phone: phone,
                email: email,
                avatar_url: avatarUrl,
                site_id: siteId,
                province: province,
                role: role,
                is_verified: false
            }]).select().single()

        if (insError) throw insError

        // 2. บันทึกวิชาที่รับผิดชอบลง supervisor_subjects
        // เราต้องดึง sub_subjects มาเช็ค parent_subject_id เหมือนที่เดิมทำ
        const { data: subSubjects } = await supabase.from('sub_subjects').select('id, parent_subject_id')

        const subjectInserts: any[] = []
        selectedSubjects.forEach((subId: number) => {
            const relatedSubSubs = subSubjects?.filter((ss: any) => ss.parent_subject_id === subId) || []
            if (relatedSubSubs.length > 0) {
                const pickedSubSubs = selectedSubSubjects.filter((ssId: number) => relatedSubSubs.some((rss: any) => rss.id === ssId))
                pickedSubSubs.forEach((ssId: number) => {
                    subjectInserts.push({ supervisor_id: supervisor.id, subject_id: subId, sub_subject_id: ssId })
                })
            } else {
                subjectInserts.push({ supervisor_id: supervisor.id, subject_id: subId, sub_subject_id: null })
            }
        })

        if (subjectInserts.length > 0) {
            const { error: subError } = await supabase.from('supervisor_subjects').insert(subjectInserts)
            if (subError) throw subError
        }

        // 3. Sync Real Email + Role to Supabase Auth
        // เราเปลี่ยนจาก shadow email ให้เป็น email จริง + ใส่ role เข้าไปด้วยเลย
        try {
            const { supabaseAdmin } = await import('@/lib/supabase-admin')
            const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
                ...(email && email.includes('@') ? { email: email, email_confirm: true } : {}),
                user_metadata: {
                    ...(user.user_metadata || {}),
                    role: role,                   // ✅ ใส่ role ทันทีตอนลงทะเบียน
                    is_verified: false,           // ✅ ยังไม่ได้อนุมัติ
                    line_user_id: lineUserId,
                    full_name: fullName || user.user_metadata?.full_name
                },
                app_metadata: {
                    provider: 'line'              // ✅ บังคับ provider = 'line'
                }
            })
            if (authUpdateError) {
                console.error('Failed to sync metadata to Auth:', authUpdateError.message)
            } else {
                console.log('Successfully synced email + role to Auth:', { email, role })
            }
        } catch (err) {
            console.error('Error importing supabaseAdmin:', err)
        }


        return NextResponse.json({ success: true, data: supervisor })
    } catch (error: any) {
        console.error('Supervisor registration error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
