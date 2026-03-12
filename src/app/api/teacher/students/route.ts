// src/app/api/teacher/students/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/teacher/students?selectedTrainingYear=xxx
 * ดึงรายชื่อนักศึกษาทั้งหมด + ปีการศึกษา options
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { searchParams } = new URL(req.url)
        const selectedTrainingYear = searchParams.get('selectedTrainingYear') || ''

        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

        // 🚀 Verifying person, Config Year, and Year Options พร้อมกัน
        const [svResult, configResult, yearsResult] = await Promise.all([
            supabase.from('supervisors').select('id').eq('user_id', authUser.id).single(),
            !selectedTrainingYear 
                ? supabase.from('system_configs').select('key_value').eq('key_name', 'current_training_year').single()
                : Promise.resolve({ data: { key_value: selectedTrainingYear } }),
            supabase.from('students').select('training_year').not('training_year', 'is', null)
        ])

        if (!svResult.data) return apiError('Unauthorized: Access restricted to active personnel.', 401)
        
        const defaultYear = configResult.data?.key_value || ''
        const trainingYearOptions = yearsResult.data
            ? Array.from(new Set(yearsResult.data.map((y: any) => y.training_year))).sort((a: string, b: string) => b.localeCompare(a))
            : []

        // 2. ดึง Students ตามปี
        let query = supabase.from('students').select('*').order('student_code', { ascending: true })
        if (defaultYear) query = query.eq('training_year', defaultYear)

        const { data: students } = await query

        return apiSuccess({
            students: students || [],
            defaultYear,
            trainingYearOptions
        })
    } catch (error: any) {
        console.error('Teacher Students GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
