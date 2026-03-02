// src/app/api/supervisor/evaluate/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/supervisor/evaluate?id=xxx
 * ดึงข้อมูล assignment + evaluation groups + คะแนนเก่า
 */
export async function GET(req: Request) {
    const supabase = createServerSupabase()

    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')
        if (!id) return apiError('Missing id', 400)

        // 1. ดึงข้อมูล Assignment
        const { data: assign, error: assignErr } = await supabase
            .from('assignment_supervisors')
            .select(`
                *, 
                student_assignments:assignment_id(
                    id, 
                    sub_subject_id,
                    students:student_id(*), 
                    subjects:subject_id(*)
                )
            `)
            .eq('id', id)
            .single()

        if (assignErr || !assign) return apiError('ไม่พบรายการประเมิน', 404)

        // 2. ดึงกลุ่มการประเมิน
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

        const { data: evalGroups, error: groupsErr } = await query
            .order('group_name', { ascending: true })
            .order('order_index', { foreignTable: 'evaluation_items', ascending: true })

        if (groupsErr) throw groupsErr

        // 3. ดึงคะแนนเก่า
        const { data: logs } = await supabase
            .from('evaluation_logs')
            .select(`*, evaluation_answers(*)`)
            .eq('assignment_id', assign.student_assignments.id)
            .eq('supervisor_id', assign.supervisor_id)

        return apiSuccess({
            assignment: assign,
            groups: evalGroups || [],
            logs: logs || []
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
    const supabase = createServerSupabase()

    try {
        const body = await req.json()
        const { action } = body

        if (action === 'save-scores') {
            const { assignment_id, group_id, supervisor_id, comment, answers, evalId } = body

            // 1. Upsert Log
            const { data: log, error: logErr } = await supabase
                .from('evaluation_logs')
                .upsert({
                    assignment_id,
                    group_id,
                    supervisor_id,
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
