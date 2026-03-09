// src/app/api/supervisor/schedule/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/supervisor/schedule?lineUserId=xxx
 * ดึงตารางผลัดฝึก (rotations) + จำนวน student + วิชา grouped by rotation
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

        // 0. ดึงปีการศึกษาปัจจุบัน
        const { data: configData } = await supabase
            .from('system_configs')
            .select('key_value')
            .eq('key_name', 'current_training_year')
            .single()
        const currentYear = configData?.key_value || ''

        // 1. ดึง Supervisor
        const { data: sv } = await supabase
            .from('supervisors')
            .select('id, site_id')
            .eq('user_id', authUser.id)
            .single()

        if (!sv) return apiError('Unauthorized: Active status required.', 401)

        // 1.5 ดึง student IDs ที่อยู่ในปีการศึกษาปัจจุบัน
        let yearStudentIds: Set<string> = new Set()
        if (currentYear) {
            const { data: yearStudents } = await supabase
                .from('students')
                .select('id')
                .eq('training_year', currentYear)
            yearStudentIds = new Set((yearStudents || []).map((s: any) => String(s.id)))
        }

        // 2. ดึง student_assignments ของ site นี้ (เพื่อใช้นับจำนวนนักศึกษาในแต่ละผลัด)
        const { data: assignments, error: assignError } = await supabase
            .from('student_assignments')
            .select('rotation_id, student_id')
            .eq('site_id', sv.site_id)

        if (assignError) throw assignError

        // นับจำนวนนักศึกษาแยกตาม rotation_id
        const studentCounts: { [key: number]: Set<string> } = {}
        const filteredAssignments = currentYear
            ? (assignments || []).filter((item: any) => yearStudentIds.has(String(item.student_id)))
            : (assignments || [])

        filteredAssignments.forEach((item: any) => {
            if (!studentCounts[item.rotation_id]) studentCounts[item.rotation_id] = new Set()
            studentCounts[item.rotation_id].add(String(item.student_id))
        })

        // 3. ดึง rotations ทั้งหมดของปีปัจจุบัน พร้อมวิชาที่กำหนดในผลัดนั้นๆ
        let rotationQuery = supabase
            .from('rotations')
            .select(`
                id, name, start_date, end_date, academic_year, track,
                rotation_subjects (
                    subjects ( name )
                )
            `)
            .order('track', { ascending: true })
            .order('start_date', { ascending: true })

        if (currentYear) {
            rotationQuery = rotationQuery.eq('academic_year', currentYear)
        }
        const { data: allRotations, error: rotError } = await rotationQuery
        if (rotError) throw rotError

        // จัดกลุ่มตาม Track (สาย)
        const groupedByTrack: { [key: string]: any[] } = {}

            ; (allRotations || []).forEach((rot: any) => {
                const track = rot.track || 'A'
                if (!groupedByTrack[track]) groupedByTrack[track] = []

                // ดึงรายชื่อวิชาจาก rotation_subjects
                const subjects = rot.rotation_subjects?.map((rs: any) => rs.subjects?.name).filter(Boolean) || []

                groupedByTrack[track].push({
                    rotation: {
                        id: rot.id,
                        name: rot.name,
                        start_date: rot.start_date,
                        end_date: rot.end_date,
                        track: rot.track,
                        academic_year: rot.academic_year
                    },
                    subjects: subjects,
                    studentCount: studentCounts[rot.id]?.size || 0
                })
            })

        // แปลงเป็น Array ที่เรียงลำดับตาม Track
        const sortedTracks = Object.keys(groupedByTrack).sort()
        const result = sortedTracks.map(track => ({
            track,
            rotations: groupedByTrack[track]
        }))

        return apiSuccess({
            groupedSchedule: result,
            configYear: currentYear
        })
    } catch (error: any) {
        console.error('Supervisor Schedule GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
