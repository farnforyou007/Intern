// src/app/api/supervisor/evaluate/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/supervisor/evaluate?id=xxx
 * ดึงข้อมูล assignment + evaluation groups + คะแนนเก่า
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return apiError('Missing id', 400)

        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

        // Fetch the supervisor record to verify they own this evaluation
        const { data: supervisor } = await supabase
            .from('supervisors')
            .select('id')
            .eq('user_id', authUser.id)
            .single()

        if (!supervisor) return apiError('Unauthorized: Active status required.', 401)

        // 1. ดึงข้อมูล Assignment
        const { data: assign, error: assignErr } = await supabase
            .from('assignment_supervisors')
            .select(`
                *, 
                student_assignments:assignment_id(
                    id, 
                    sub_subject_id,
                    rotation_id,
                    students:student_id(*), 
                    subjects:subject_id(*),
                    rotations:rotation_id(id, name, start_date, end_date)
                )
            `)
            .eq('id', id)
            .single()

        if (assignErr || !assign) return apiError('ไม่พบรายการประเมิน', 404)

        // 2. ดึงกลุ่มการประเมิน + คะแนนเก่า พร้อมกัน 🚀
        const subjectId = assign.student_assignments.subjects.id
        const subSubjectId = assign.student_assignments.sub_subject_id

        let query = supabase
            .from('evaluation_groups')
            .select(`*, evaluation_items (*)`)
            .eq('subject_id', subjectId)

        if (subSubjectId) {
            query = query.eq('sub_subject_id', subSubjectId)
        } else {
            query = query.is('sub_subject_id', null)
        }

        const [groupsResult, logsResult] = await Promise.all([
            query.order('group_name', { ascending: true }).order('order_index', { foreignTable: 'evaluation_items', ascending: true }),
            supabase.from('evaluation_logs').select(`*, evaluation_answers(*)`).eq('assignment_id', assign.student_assignments.id).eq('supervisor_id', supervisor.id)
        ])

        if (groupsResult.error) throw groupsResult.error
        const allGroups = groupsResult.data
        const logs = logsResult.data

        // 4. กรองกลุ่มและข้อคำถามที่จะแสดง
        const usedInThisAssignmentGroupIds = new Set((logs || []).map(l => l.group_id))
        
        // เก็บ item_ids ที่เคยตอบไปแล้วเพื่อเตรียมกรองรายข้อ
        const answeredItemIds = new Set((logs || []).flatMap(l => (l.evaluation_answers || []).map((a: any) => a.item_id)))

        const evalGroups = (allGroups || []).filter(g => g.is_active !== false || usedInThisAssignmentGroupIds.has(g.id)).map(g => ({
            ...g,
            evaluation_items: (g.evaluation_items || []).filter((i: any) => (i.is_active !== false) || answeredItemIds.has(i.id))
        })).filter(g => g.evaluation_items.length > 0) // Hide empty groups

        // 5. คำนวณสิทธิ์การแก้ไข (Grace Period 14 วัน หลังจบผลัด)
        const endDateStr = assign.student_assignments.rotations?.end_date
        let canEdit = true
        let gracePeriodEnd = null
        if (endDateStr) {
            const end = new Date(endDateStr)
            gracePeriodEnd = new Date(end)
            gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14)
            const today = new Date()
            canEdit = today <= gracePeriodEnd
        }

        return apiSuccess({
            assignment: assign,
            groups: evalGroups,
            logs: logs || [],
            canEdit: canEdit,
            gracePeriodEnd: gracePeriodEnd?.toISOString()
        })
    } catch (error: any) {
        console.error('Supervisor Evaluate GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/supervisor/evaluate
 * Actions: save-scores, finish
 */
export async function POST(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

        // Fetch the supervisor record to ensure they appear in the logs correctly
        const { data: supervisor } = await supabase
            .from('supervisors')
            .select('id')
            .eq('user_id', authUser.id)
            .single()

        if (!supervisor) return apiError('Unauthorized: Active status required.', 401)

        const body = await req.json()
        const { action } = body

        // --- เพิ่มการตรวจสอบ Grace Period สำหรับการบันทึก ---
        if (action === 'save-scores' || action === 'finish') {
            const evalId = action === 'finish' ? body.evalId : body.evalId

            const { data: assign } = await supabase
                .from('assignment_supervisors')
                .select('student_assignments(rotations(end_date))')
                .eq('id', evalId)
                .single()

            const endDateStr = (assign as any)?.student_assignments?.rotations?.end_date
            if (endDateStr) {
                const end = new Date(endDateStr)
                const gracePeriodEnd = new Date(end)
                gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14)
                const today = new Date()
                if (today > gracePeriodEnd) {
                    return apiError('หมดเวลาแก้ไขคะแนน (เกินระยะเวลา 14 วันหลังจบผลัด)', 403)
                }
            }
        }

        if (action === 'save-scores') {
            const { assignment_id, group_id, supervisor_id, comment, answers, evalId } = body

            // 1. Upsert Log
            const { data: log, error: logErr } = await supabase
                .from('evaluation_logs')
                .upsert({
                    assignment_id,
                    group_id,
                    supervisor_id: supervisor.id, // Explicitly use authenticated ID
                    comment: comment || '',
                }, { onConflict: 'assignment_id, group_id, supervisor_id' })
                .select().single()

            if (logErr) throw logErr

            // อัปเดตสถานะเป็น 1 (กำลังประเมิน)
            if (evalId) {
                await supabase
                    .from('assignment_supervisors')
                    .update({ evaluation_status: 1 })
                    .eq('id', evalId)
                    .neq('evaluation_status', 2) // ไม่อัปเดตถ้าเสร็จแล้ว
            }

            // 2. Upsert Answers
            if (answers && answers.length > 0) {
                const answerData = answers.map((ans: any) => ({
                    log_id: log.id,
                    item_id: ans.item_id,
                    score: ans.is_na ? null : ans.score,
                    is_na: ans.is_na
                }))
                await supabase.from('evaluation_answers').upsert(answerData, { onConflict: 'log_id, item_id' })
            }

            return apiSuccess({ saved: true })
        }

        if (action === 'finish') {
            const { evalId } = body
            await supabase.from('assignment_supervisors')
                .update({ is_evaluated: true, evaluation_status: 2 })
                .eq('id', evalId)
            return apiSuccess({ finished: true })
        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Supervisor Evaluate POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
