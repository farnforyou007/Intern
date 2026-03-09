// src/app/api/admin/rotations/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/admin/rotations?year=2569
 * ดึงผลัดตามปีที่เลือก + วิชาทั้งหมด + ปีที่มีข้อมูล
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.app_metadata.provider !== 'email') {
            return apiError('Unauthorized', 401)
        }

        const { searchParams } = new URL(req.url)
        const selectedYear = searchParams.get('year') || ''

        // 1. ดึง available years
        const { data: yearsData } = await supabase
            .from('rotations')
            .select('academic_year')
            .order('academic_year', { ascending: false })

        const currentYearBS = (new Date().getFullYear() + 543).toString()
        let availableYears: string[] = [currentYearBS]
        if (yearsData && yearsData.length > 0) {
            availableYears = Array.from(new Set(yearsData.map(item => item.academic_year)))
        }

        // 2. ดึงผลัดตามปีที่เลือก + track
        const yearToUse = selectedYear || availableYears[0] || currentYearBS
        const trackFilter = searchParams.get('track') || 'all'

        let rotQuery = supabase
            .from('rotations')
            .select('*, rotation_subjects(subject_id)')
            .eq('academic_year', yearToUse)
            .order('track', { ascending: true })
            .order('round_number', { ascending: true })

        if (trackFilter !== 'all') {
            rotQuery = rotQuery.eq('track', trackFilter)
        }

        const { data: rotData, error: rotError } = await rotQuery

        if (rotError) throw rotError

        // 3. ดึงวิชาทั้งหมด
        const { data: subData } = await supabase.from('subjects').select('*').order('name')

        return apiSuccess({
            rotations: rotData || [],
            subjects: subData || [],
            availableYears
        })
    } catch (error: any) {
        console.error('Admin Rotations GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/admin/rotations
 * Actions: save (insert/update + rotation_subjects sync), delete
 */
export async function POST(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.app_metadata.provider !== 'email') {
            return apiError('Unauthorized', 401)
        }
        const body = await req.json()
        const { action } = body

        if (action === 'save') {
            const { rotationId, payload, selected_subjects } = body
            let finalId = rotationId

            if (finalId) {
                // Update
                const { error } = await supabase.from('rotations').update(payload).eq('id', finalId)
                if (error) throw error
            } else {
                // ตรวจสอบซ้ำก่อน insert
                const { data: existing } = await supabase.from('rotations')
                    .select('id')
                    .eq('academic_year', payload.academic_year)
                    .eq('round_number', payload.round_number)
                    .eq('track', payload.track || 'A')
                    .maybeSingle()

                if (existing) {
                    return apiError(
                        `มีผลัดที่ ${payload.round_number} สาย ${payload.track || 'A'} ของปี ${payload.academic_year} อยู่ในระบบแล้ว`,
                        409
                    )
                }

                const { data, error } = await supabase.from('rotations').insert(payload).select().single()
                if (error) throw error
                finalId = data.id
            }

            // Sync rotation_subjects
            await supabase.from('rotation_subjects').delete().eq('rotation_id', finalId)
            if (selected_subjects && selected_subjects.length > 0) {
                const junctionData = selected_subjects.map((subId: number) => ({
                    rotation_id: finalId,
                    subject_id: subId
                }))
                const { error } = await supabase.from('rotation_subjects').insert(junctionData)
                if (error) throw error
            }

            return apiSuccess({ saved: true, rotationId: finalId })
        }

        if (action === 'delete') {
            const { id } = body
            const { error } = await supabase.from('rotations').delete().eq('id', id)

            if (error) {
                if (error.code === '23503') {
                    return apiError('ไม่สามารถลบผลัดนี้ได้ เนื่องจากมีนักศึกษาลงทะเบียนฝึกงานในผลัดนี้อยู่แล้ว', 409)
                }
                throw error
            }

            return apiSuccess({ deleted: true })
        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Admin Rotations POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
