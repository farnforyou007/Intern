import { createServerSupabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const supabase = await createServerSupabase()

    try {
        if (action === 'init') {
            const { data: config } = await supabase
                .from('system_configs')
                .select('key_value')
                .eq('key_name', 'current_training_year')
                .single()

            const trainingYear = config?.key_value

            const track = searchParams.get('track') || 'A'

            const { data: rotations } = await supabase
                .from('rotations')
                .select(`
                    id, 
                    name, 
                    start_date,
                    end_date,
                    rotation_subjects (
                        subject_id,
                        subjects (
                            id, 
                            name,
                            sub_subjects (id, name)
                        )
                    )
                `)
                .eq('academic_year', trainingYear)
                .eq('track', track)
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

            const { data: trackData } = await supabase
                .from('rotations')
                .select('track')
                .eq('academic_year', trainingYear)

            const availableTracks = Array.from(new Set(trackData?.map(t => t.track) || [])).sort()

            return NextResponse.json({
                success: true,
                data: {
                    trainingYear,
                    rotations,
                    sites,
                    mentors,
                    availableTracks: availableTracks.length > 0 ? availableTracks : ['A']
                }
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
            track,
            assignments, // array of { rotation_id, site_id, supervisor_ids }
            hasMotorcycle,
            parentalConsentUrl
        } = body

        if (!studentCode || !firstName || !lastName || !phone || !trainingYear) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
        }

        const supabase = await createServerSupabase()

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
            training_year: trainingYear,
            track: track || 'A',
            has_motorcycle: hasMotorcycle || false,
            parental_consent_url: parentalConsentUrl || null
        }]).select().single()

        if (stError) throw stError

        // 3. Create Assignments & Assign Superviosrs
        for (const as of assignments) {
            if (!as.site_id) continue

            // ในเวอร์ชันใหม่ นศ. ไม่ต้องเลือกพี่เลี้ยงเอง ระบบจะสร้าง Assignment รอให้พี่เลี้ยงมารับดูแล
            for (const sub of as.subjects) {
                // if (sub.supervisor_ids.length === 0 && !sub.isPortfolio) continue;

                const { data: assignment, error: assignErr } = await supabase
                    .from('student_assignments')
                    .insert([{
                        student_id: student.id,
                        rotation_id: parseInt(as.rotation_id),
                        subject_id: sub.subject_id,
                        sub_subject_id: sub.sub_subject_id,
                        site_id: parseInt(as.site_id),
                        status: 'active'
                    }]).select().single()

                if (assignErr) throw assignErr

                // 4. บันทึกรายชื่อพี่เลี้ยง
                if (sub.supervisor_ids && sub.supervisor_ids.length > 0) {
                    const mentorRecords = sub.supervisor_ids.map((sId: any) => ({
                        assignment_id: assignment.id,
                        supervisor_id: sId
                    }))

                    const { error: mentorErr } = await supabase
                        .from('assignment_supervisors')
                        .insert(mentorRecords)

                    if (mentorErr) throw mentorErr
                }
            }
        }

        return NextResponse.json({ success: true, data: student })
    } catch (error: any) {
        console.error('Student registration error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
