// src/app/api/supervisor/students/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/supervisor/students?lineUserId=xxx
 * ดึงข้อมูล supervisor + students ที่อยู่ในสิทธิ์ + ปีการศึกษา + eval progress
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

        // 🚀 Group 1: system_configs + supervisor พร้อมกัน
        const [configResult, supervisorResult] = await Promise.all([
            supabase.from('system_configs').select('key_value').eq('key_name', 'current_training_year').single(),
            supabase.from('supervisors').select('*').eq('user_id', authUser.id).single()
        ])

        const currentYear = configResult.data?.key_value || ''
        const supervisor = supervisorResult.data
        if (!supervisor) return apiError('Supervisor not found', 404)

        // 🚀 Group 2: yearStudentIds + permissions + mine + allSiteStudents พร้อมกัน
        const [yearStudentsResult, permissionsResult, mineResult, allResult] = await Promise.all([
            currentYear
                ? supabase.from('students').select('id').eq('training_year', currentYear)
                : Promise.resolve({ data: [] as any[] }),
            supabase.from('supervisor_subjects').select('subject_id, sub_subject_id').eq('supervisor_id', supervisor.id),
            supabase.from('assignment_supervisors').select(`
                id, is_evaluated,
                student_assignments:assignment_id ( 
                    id, rotation_id, student_id, subject_id, sub_subject_id,
                    students:student_id ( id, prefix, first_name, last_name, nickname, student_code, avatar_url, phone, email ),
                    subjects:subject_id ( id, name ), 
                    sub_subjects:sub_subject_id ( id, name ),
                    rotations:rotation_id ( name )
                )
            `).eq('supervisor_id', supervisor.id),
            supabase.from('student_assignments').select(`
                id, rotation_id, student_id, subject_id, sub_subject_id,
                students:student_id ( id, prefix, first_name, last_name, nickname, student_code, avatar_url, phone, email ),
                subjects:subject_id ( id, name ), 
                sub_subjects:sub_subject_id ( id, name ),
                rotations:rotation_id ( name )
            `).eq('site_id', supervisor.site_id)
        ])

        const yearStudentIds: Set<string> = new Set((yearStudentsResult.data || []).map((s: any) => String(s.id)))
        const permissions = permissionsResult.data
        const mine = mineResult.data
        const allSiteData = allResult.data

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

        // กรอง 'ทีมฉัน' ตามสิทธิ์ + ปีการศึกษา
        const filteredMine = (mine || []).filter((item: any) => {
            const assign = item.student_assignments
            if (!assign) return false
            const studentId = String(assign.students?.id || assign.student_id || '')
            if (currentYear && !yearStudentIds.has(studentId)) return false
            return checkPerm(assign)
        })

        // 3.5 ดึง evaluation_logs + evaluation_groups เพื่อคำนวณ progress แบบละเอียด
        const assignmentIds = filteredMine.map((item: any) => item.student_assignments?.id).filter(Boolean)
        const subjectIds = [...new Set(filteredMine.map((item: any) => item.student_assignments?.subject_id).filter(Boolean))]

        // 🚀 Group 3: evaluation_logs + evaluation_groups พร้อมกัน
        const [logsResult, groupsResult] = await Promise.all([
            assignmentIds.length > 0
                ? supabase.from('evaluation_logs').select('assignment_id, group_id, evaluation_answers(id)').eq('supervisor_id', supervisor.id).in('assignment_id', assignmentIds)
                : Promise.resolve({ data: [] as any[] }),
            subjectIds.length > 0
                ? supabase.from('evaluation_groups').select('id, subject_id, sub_subject_id, evaluation_items(id)').in('subject_id', subjectIds)
                : Promise.resolve({ data: [] as any[] })
        ])

        // ดึง logs พร้อมจำนวน answers ต่อ log
        let logsDetailMap = new Map<number, Map<string, number>>()
        for (const l of (logsResult.data || [])) {
            if (!logsDetailMap.has(l.assignment_id)) logsDetailMap.set(l.assignment_id, new Map())
            const groupMap = logsDetailMap.get(l.assignment_id)!
            groupMap.set(l.group_id, (l.evaluation_answers as any[])?.length || 0)
        }

        // ดึง evaluation_groups พร้อมจำนวน items ต่อ group
        let groupsDetailMap = new Map<string, { groupId: string; itemCount: number }[]>()
        for (const g of (groupsResult.data || [])) {
            const key = `${g.subject_id}-${g.sub_subject_id || 'null'}`
            if (!groupsDetailMap.has(key)) groupsDetailMap.set(key, [])
            groupsDetailMap.get(key)!.push({
                groupId: g.id,
                itemCount: (g.evaluation_items as any[])?.length || 0
            })
        }

        // แปะ progress ลงใน filteredMine
        const mineWithProgress = filteredMine.map((item: any) => {
            const assignId = item.student_assignments?.id
            const subjId = item.student_assignments?.subject_id
            const subSubjId = item.student_assignments?.sub_subject_id
            const groupKey = `${subjId}-${subSubjId || 'null'}`

            const groupsForAssignment = groupsDetailMap.get(groupKey) || []
            const totalGroups = groupsForAssignment.length || 1
            const logsForAssignment = logsDetailMap.get(assignId) || new Map()

            // นับ group ที่ตอบครบทุกข้อเป็น "done"
            let completedGroups = 0
            let hasAnyAnswers = false
            for (const group of groupsForAssignment) {
                const answerCount = logsForAssignment.get(group.groupId) || 0
                if (answerCount > 0) hasAnyAnswers = true
                if (answerCount >= group.itemCount && group.itemCount > 0) completedGroups++
            }

            const status = item.is_evaluated ? 2 : (hasAnyAnswers ? 1 : 0)

            return {
                ...item,
                has_eval_logs: hasAnyAnswers,
                eval_progress: { done: completedGroups, total: totalGroups },
                evaluation_status: status
            }
        })

        // กรอง 'ทั้งหมด' ตามสิทธิ์ + ปีการศึกษา (ใช้ all จาก Group 2)
        const filteredAll = (allSiteData || []).filter((assign: any) => {
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
    const supabase = await createServerSupabase() // Added await

    try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

        // Fetch the secure supervisor record
        const { data: supervisor } = await supabase
            .from('supervisors')
            .select('id')
            .eq('user_id', authUser.id)
            .single()

        if (!supervisor) return apiError('Unauthorized: Active status required.', 401)

        const body = await req.json()
        const { action } = body

        if (action === 'claim') {
            const { assignment_id } = body // supervisor_id comes from session
            const { error } = await supabase
                .from('assignment_supervisors')
                .insert([{ assignment_id, supervisor_id: supervisor.id }])
            if (error) throw error
            return apiSuccess({ claimed: true })
        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Supervisor Students POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
