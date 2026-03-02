// src/app/api/supervisor/students/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/supervisor/students?lineUserId=xxx
 * ดึงข้อมูล supervisor + students ที่อยู่ในสิทธิ์ + ปีการศึกษา + eval progress
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

        // 1. ดึงข้อมูล Supervisor
        const { data: supervisor } = await supabase
            .from('supervisors')
            .select('*')
            .eq('line_user_id', lineUserId)
            .single()
        if (!supervisor) return apiError('Supervisor not found', 404)

        // 1.5 ดึง student IDs ที่อยู่ในปีการศึกษาปัจจุบัน
        let yearStudentIds: Set<string> = new Set()
        if (currentYear) {
            const { data: yearStudents } = await supabase
                .from('students')
                .select('id')
                .eq('training_year', currentYear)
            yearStudentIds = new Set((yearStudents || []).map((s: any) => String(s.id)))
        }

        // 2. ดึงสิทธิ์ (Permissions)
        const { data: permissions } = await supabase
            .from('supervisor_subjects')
            .select('subject_id, sub_subject_id')
            .eq('supervisor_id', supervisor.id)

        // Helper: ตรวจสอบสิทธิ์
        const checkPerm = (assign: any) => {
            if (!permissions || permissions.length === 0) return false
            if (assign.sub_subject_id) {
                return permissions.some((p: any) =>
                    p.subject_id === assign.subject_id &&
                    p.sub_subject_id === assign.sub_subject_id
                )
            }
            return permissions.some((p: any) => p.subject_id === assign.subject_id)
        }

        // 3. ดึงงานทีมฉัน (My Students)
        const { data: mine } = await supabase.from('assignment_supervisors').select(`
            id, is_evaluated,
            student_assignments:assignment_id ( 
                id, rotation_id, student_id, subject_id, sub_subject_id,
                students:student_id ( id, prefix, first_name, last_name, nickname, student_code, avatar_url, phone, email ),
                subjects:subject_id ( id, name ), 
                sub_subjects:sub_subject_id ( id, name ),
                rotations:rotation_id ( name )
            )
        `).eq('supervisor_id', supervisor.id)

        // กรอง 'ทีมฉัน' ตามสิทธิ์ + ปีการศึกษา
        const filteredMine = (mine || []).filter((item: any) => {
            const assign = item.student_assignments
            if (!assign) return false
            const studentId = String(assign.students?.id || assign.student_id || '')
            if (currentYear && !yearStudentIds.has(studentId)) return false
            return checkPerm(assign)
        })

        // 3.5 ดึง evaluation_logs + evaluation_groups เพื่อคำนวณ progress
        const assignmentIds = filteredMine.map((item: any) => item.student_assignments?.id).filter(Boolean)
        const subjectIds = [...new Set(filteredMine.map((item: any) => item.student_assignments?.subject_id).filter(Boolean))]

        let logsMap = new Map<number, number>()
        if (assignmentIds.length > 0) {
            const { data: logs } = await supabase
                .from('evaluation_logs')
                .select('assignment_id')
                .eq('supervisor_id', supervisor.id)
                .in('assignment_id', assignmentIds)
            for (const l of (logs || [])) {
                logsMap.set(l.assignment_id, (logsMap.get(l.assignment_id) || 0) + 1)
            }
        }

        let groupsCountMap = new Map<string, number>()
        if (subjectIds.length > 0) {
            const { data: groups } = await supabase
                .from('evaluation_groups')
                .select('id, subject_id')
                .in('subject_id', subjectIds)
            for (const g of (groups || [])) {
                groupsCountMap.set(g.subject_id, (groupsCountMap.get(g.subject_id) || 0) + 1)
            }
        }

        // แปะ progress ลงใน filteredMine
        const mineWithProgress = filteredMine.map((item: any) => {
            const assignId = item.student_assignments?.id
            const subjId = item.student_assignments?.subject_id
            const logsCount = logsMap.get(assignId) || 0
            const totalGroups = groupsCountMap.get(subjId) || 1
            const status = item.is_evaluated ? 2 : (logsCount > 0 ? 1 : 0)

            return {
                ...item,
                has_eval_logs: logsCount > 0,
                eval_progress: { done: logsCount, total: totalGroups },
                evaluation_status: status
            }
        })

        // 4. ดึงงานทั้งหมดในไซต์ (All Students)
        const { data: all } = await supabase.from('student_assignments').select(`
            id, rotation_id, student_id, subject_id, sub_subject_id,
            students:student_id ( id, prefix, first_name, last_name, nickname, student_code, avatar_url, phone, email ),
            subjects:subject_id ( id, name ), 
            sub_subjects:sub_subject_id ( id, name ),
            rotations:rotation_id ( name )
        `).eq('site_id', supervisor.site_id)

        // กรอง 'ทั้งหมด' ตามสิทธิ์ + ปีการศึกษา
        const filteredAll = (all || []).filter((assign: any) => {
            const studentId = String(assign.students?.id || assign.student_id || '')
            if (currentYear && !yearStudentIds.has(studentId)) return false
            return checkPerm(assign)
        })

        return apiSuccess({
            supervisor,
            myStudents: mineWithProgress,
            allSiteStudents: filteredAll,
            configYear: currentYear
        })
    } catch (error: any) {
        console.error('Supervisor Students GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/supervisor/students
 * Action: claim — รับดูแลนักศึกษา
 */
export async function POST(req: Request) {
    const supabase = createServerSupabase()

    try {
        const body = await req.json()
        const { action } = body

        if (action === 'claim') {
            const { assignment_id, supervisor_id } = body
            const { error } = await supabase
                .from('assignment_supervisors')
                .insert([{ assignment_id, supervisor_id }])
            if (error) throw error
            return apiSuccess({ claimed: true })
        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Supervisor Students POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
