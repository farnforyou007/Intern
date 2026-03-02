// src/app/api/teacher/students/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/teacher/students?selectedTrainingYear=xxx
 * ดึงรายชื่อนักศึกษาทั้งหมด + ปีการศึกษา options
 */
export async function GET(req: Request) {
    const supabase = createServerSupabase()

    try {
        const { searchParams } = new URL(req.url)
        const selectedTrainingYear = searchParams.get('selectedTrainingYear') || ''

        // 0. ดึงปีการศึกษา default (ถ้าไม่ส่งมา)
        let defaultYear = selectedTrainingYear
        if (!defaultYear) {
            const { data: configData } = await supabase
                .from('system_configs')
                .select('key_value')
                .eq('key_name', 'current_training_year')
                .single()
            defaultYear = configData?.key_value || ''
        }

        // 1. ดึง Year Options
        const { data: yearsData } = await supabase
            .from('students')
            .select('training_year')
            .not('training_year', 'is', null)
        const trainingYearOptions = yearsData
            ? Array.from(new Set(yearsData.map((y: any) => y.training_year))).sort((a: string, b: string) => b.localeCompare(a))
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
