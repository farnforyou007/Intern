import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            lineUserId,
            lineDisplayName,
            fullName,
            phone,
            email,
            avatarUrl,
            siteId,
            province,
            role,
            selectedSubjects,
            selectedSubSubjects
        } = body

        if (!lineUserId || !fullName || !phone || !email || !role) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = await createServerSupabase()

        // 1. บันทึกข้อมูลลงตาราง supervisors
        const { data: supervisor, error: insError } = await supabase
            .from('supervisors')
            .insert([{
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

        return NextResponse.json({ success: true, data: supervisor })
    } catch (error: any) {
        console.error('Supervisor registration error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
