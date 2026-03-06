// src/app/api/supervisor/history/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/supervisor/history?lineUserId=xxx
 * ดึงประวัติการประเมิน (is_evaluated = true) + กรองตามปีการศึกษา
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

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
            .select('id')
            .eq('line_user_id', lineUserId)
            .single()
        if (!sv) return apiError('Supervisor not found', 404)

        // 2. ดึงประวัติที่ is_evaluated = true
        const { data, error } = await supabase
            .from('assignment_supervisors')
            .select(`
                id, updated_at,
                student_assignments:assignment_id (
                    id,
                    student_id,
                    students:student_id ( id, first_name, last_name, student_code, avatar_url, nickname, training_year ),
                    subjects:subject_id ( name ),
                    sub_subjects:sub_subject_id ( name ),
                    rotations:rotation_id ( name, end_date )
                )
            `)
            .eq('supervisor_id', sv.id)
            .eq('is_evaluated', true)
            .order('updated_at', { ascending: false })

        if (error) throw error

        // 🔒 กรองเฉพาะนักศึกษาในปีปัจจุบัน
        const filtered = currentYear
            ? (data || []).filter((item: any) => {
                const trainingYear = item.student_assignments?.students?.training_year
                return trainingYear === currentYear
            })
            : (data || [])

        return apiSuccess({
            historyList: filtered,
            configYear: currentYear
        })
    } catch (error: any) {
        console.error('Supervisor History GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
