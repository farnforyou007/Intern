// src/app/api/supervisor/schedule/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/supervisor/schedule?lineUserId=xxx
 * ดึงตารางผลัดฝึก (rotations) + จำนวน student + วิชา grouped by rotation
 */
export async function GET(req: Request) {
    const supabase = createServerSupabase()

    try {
        const { searchParams } = new URL(req.url)
        const lineUserId = searchParams.get('lineUserId')
        if (!lineUserId) return apiError('Missing lineUserId', 400)

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
            .eq('line_user_id', lineUserId)
            .single()
        if (!sv) return apiError('Supervisor not found', 404)

        // 1.5 ดึง student IDs ที่อยู่ในปีการศึกษาปัจจุบัน
        let yearStudentIds: Set<string> = new Set()
        if (currentYear) {
            const { data: yearStudents } = await supabase
                .from('students')
                .select('id')
                .eq('training_year', currentYear)
            yearStudentIds = new Set((yearStudents || []).map((s: any) => String(s.id)))
        }

        // 2. ดึง student_assignments ของ site นี้
        const { data, error } = await supabase
            .from('student_assignments')
            .select(`
                student_id,
                subjects:subject_id ( name ),
                sub_subjects:sub_subject_id ( name ),
                rotations:rotation_id ( id, name, start_date, end_date, academic_year )
            `)
            .eq('site_id', sv.site_id)

        if (error) throw error

        // กรองตามปีการศึกษา
        const filteredData = currentYear
            ? (data || []).filter((item: any) => yearStudentIds.has(String(item.student_id)))
            : (data || [])

        // Group by rotation
        const groups: { [key: string]: any } = {}
        filteredData.forEach((item: any) => {
            const r = item.rotations
            if (!r) return
            if (!groups[r.id]) {
                groups[r.id] = {
                    rotation: r,
                    subjects: new Set<string>(),
                    studentIds: new Set<string>()
                }
            }
            const subName = item.sub_subjects?.name || item.subjects?.name
            if (subName) groups[r.id].subjects.add(subName)
            groups[r.id].studentIds.add(item.student_id)
        })

        // ดึง rotations ทั้งหมดของปีปัจจุบัน (รวมผลัดที่ไม่มี student)
        let rotationQuery = supabase
            .from('rotations')
            .select('id, name, start_date, end_date, academic_year')
            .order('start_date')
        if (currentYear) {
            rotationQuery = rotationQuery.eq('academic_year', currentYear)
        }
        const { data: allRotations } = await rotationQuery

            // เพิ่ม rotation ที่ไม่มี student_assignments
            ; (allRotations || []).forEach((rot: any) => {
                if (!groups[rot.id]) {
                    groups[rot.id] = {
                        rotation: rot,
                        subjects: new Set<string>(),
                        studentIds: new Set<string>()
                    }
                }
            })

        const result = Object.values(groups)
            .filter((g: any) => !currentYear || g.rotation.academic_year === currentYear)
            .map((g: any) => ({
                rotation: g.rotation,
                subjects: Array.from(g.subjects || []),
                studentCount: g.studentIds.size
            }))
            .sort((a, b) => new Date(a.rotation.end_date).getTime() - new Date(b.rotation.end_date).getTime())

        return apiSuccess({
            groupedSchedule: result,
            configYear: currentYear
        })
    } catch (error: any) {
        console.error('Supervisor Schedule GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
