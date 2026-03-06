// src/app/api/teacher/students/[id]/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/teacher/students/[id]
 * ดึงข้อมูลนักศึกษาพร้อม assignments, rotations, subjects, sites, mentors
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createServerSupabase()

    try {
        const { id } = await params
        const studentId = id?.replace(':', '')
        if (!studentId) return apiError('Missing student ID', 400)

        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                student_assignments (
                    id,
                    rotation_id,
                    rotations (id, name),
                    subjects (id, name),
                    sub_subjects (id, name),
                    training_sites (site_name, province),
                    assignment_supervisors (
                        supervisor_id,
                        supervisors (full_name, phone)
                    )
                )
            `)
            .eq('id', studentId)
            .single()

        if (error) throw error

        // จัดกลุ่มตาม rotation
        const grouped = (data?.student_assignments || []).reduce((acc: any, curr: any) => {
            const rId = curr.rotation_id || 'unassigned'
            if (!acc[rId]) {
                acc[rId] = {
                    rotationName: curr.rotations?.name || 'ไม่ได้ระบุผลัด',
                    site: curr.training_sites,
                    subjects: []
                }
            }
            acc[rId].subjects.push({
                id: curr.id,
                displayName: curr.sub_subjects?.name || curr.subjects?.name || 'ไม่ระบุวิชา',
                mentors: curr.assignment_supervisors?.map((sv: any) => ({
                    name: sv.supervisors?.full_name,
                    phone: sv.supervisors?.phone
                })) || []
            })
            return acc
        }, {})

        return apiSuccess({
            ...data,
            rotationsGrouped: Object.values(grouped)
        })
    } catch (error: any) {
        console.error('Student Detail GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
