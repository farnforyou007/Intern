import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const supabase = createServerSupabase()

    try {
        if (action === 'init') {
            const { data: config } = await supabase
                .from('system_configs')
                .select('key_value')
                .eq('key_name', 'current_training_year')
                .single()

            const trainingYear = config?.key_value

            const { data: rotations } = await supabase
                .from('rotations')
                .select(`
                    id, 
                    name, 
                    start_date,
                    end_date,
                    rotation_subjects (
                        subject_id,
                        subjects (id, name)
                    )
                `)
                .eq('academic_year', trainingYear)
                .order('round_number', { ascending: true })

            const { data: sites } = await supabase.from('training_sites').select('*')

            const { data: mentors } = await supabase
                .from('supervisors')
                .select(`
                    id, 
                    full_name, 
                    site_id,
                    supervisor_subjects (
                        subject_id,
                        sub_subject_id
                    )
                `)
                .eq('is_verified', true)

            return NextResponse.json({
                success: true,
                data: { trainingYear, rotations, sites, mentors }
            })
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    } catch (error: any) {
        console.error('Student register init error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            studentCode,
            prefix,
            firstName,
            lastName,
            nickname,
            phone,
            email,
            avatarUrl,
            trainingYear,
            assignments // array of { rotation_id, site_id, supervisor_ids }
        } = body

        if (!studentCode || !firstName || !lastName || !phone || !trainingYear) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = createServerSupabase()

        // 1. บันทึกข้อมูลนักศึกษาลงตารางหลัก
        const { data: student, error: stError } = await supabase.from('students').insert([{
            student_code: studentCode,
            prefix: prefix,
            first_name: firstName,
            last_name: lastName,
            nickname: nickname,
            phone: phone,
            email: email,
            avatar_url: avatarUrl,
            training_year: trainingYear
        }]).select().single()

        if (stError) throw stError

        // 2. จัดการ Assignments และ Mentors
        // ดึงข้อมูลพื้นฐานที่จำเป็นมาไว้ก่อน เพื่อลดการ query ใน loop
        const { data: allRotationSubjects } = await supabase.from('rotation_subjects').select('rotation_id, subject_id')
        const { data: allSubSubjects } = await supabase.from('sub_subjects').select('id, parent_subject_id')
        const { data: allMentors } = await supabase
            .from('supervisors')
            .select(`
                id, site_id,
                supervisor_subjects (subject_id, sub_subject_id)
            `)

        for (const as of assignments) {
            if (!as.site_id) continue

            const rotSubs = allRotationSubjects?.filter(rs => rs.rotation_id === parseInt(as.rotation_id)) || []

            for (const rs of rotSubs) {
                const mainSubjectId = rs.subject_id
                const subSubs = allSubSubjects?.filter(ss => ss.parent_subject_id === mainSubjectId) || []

                // Helper function to filter valid mentors
                const getValidMentorRecords = (assignmentId: number, targetMainSub: number, targetSubSub: number | null) => {
                    return allMentors?.filter(m => {
                        const isSelected = as.supervisor_ids.includes(String(m.id))
                        const isSameSite = String(m.site_id) === String(as.site_id)
                        if (!isSelected || !isSameSite) return false

                        return m.supervisor_subjects?.some((ss: any) => {
                            const matchMain = Number(ss.subject_id) === Number(targetMainSub)
                            if (targetSubSub !== null) {
                                return matchMain && Number(ss.sub_subject_id) === Number(targetSubSub)
                            }
                            return matchMain
                        })
                    }).map((m: any) => ({
                        assignment_id: assignmentId,
                        supervisor_id: m.id
                    })) || []
                }

                if (subSubs.length > 0) {
                    // Case 1: มีวิชาย่อย
                    for (const sub of subSubs) {
                        const { data: subAssign, error: asError } = await supabase
                            .from('student_assignments')
                            .insert([{
                                student_id: student.id,
                                rotation_id: parseInt(as.rotation_id),
                                subject_id: mainSubjectId,
                                sub_subject_id: sub.id,
                                site_id: parseInt(as.site_id),
                                status: 'active'
                            }]).select().single()

                        if (asError) throw asError
                        const mentorRecords = getValidMentorRecords(subAssign.id, mainSubjectId, sub.id)
                        if (mentorRecords.length > 0) {
                            await supabase.from('assignment_supervisors').insert(mentorRecords)
                        }
                    }

                    // สร้างเล่มรายงาน (Portfolio)
                    const { data: mainAssign, error: mainErr } = await supabase
                        .from('student_assignments')
                        .insert([{
                            student_id: student.id,
                            rotation_id: parseInt(as.rotation_id),
                            subject_id: mainSubjectId,
                            sub_subject_id: null,
                            site_id: parseInt(as.site_id),
                            status: 'active'
                        }]).select().single()

                    if (mainErr) throw mainErr
                    const mainMentorRecords = getValidMentorRecords(mainAssign.id, mainSubjectId, null)
                    if (mainMentorRecords.length > 0) {
                        await supabase.from('assignment_supervisors').insert(mainMentorRecords)
                    }
                } else {
                    // Case 2: วิชาทั่วไป
                    const { data: singleAssign, error: asError } = await supabase
                        .from('student_assignments')
                        .insert([{
                            student_id: student.id,
                            rotation_id: parseInt(as.rotation_id),
                            subject_id: mainSubjectId,
                            sub_subject_id: null,
                            site_id: parseInt(as.site_id),
                            status: 'active'
                        }]).select().single()

                    if (asError) throw asError
                    const mentorRecords = getValidMentorRecords(singleAssign.id, mainSubjectId, null)
                    if (mentorRecords.length > 0) {
                        await supabase.from('assignment_supervisors').insert(mentorRecords)
                    }
                }
            }
        }

        return NextResponse.json({ success: true, data: student })
    } catch (error: any) {
        console.error('Student registration error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
