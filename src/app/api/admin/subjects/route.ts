// src/app/api/admin/subjects/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/admin/subjects
 * ดึงวิชาหลักพร้อมวิชาย่อย
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.app_metadata.provider !== 'email') {
            return apiError('Unauthorized', 401)
        }

        const { data, error } = await supabase
            .from('subjects')
            .select('*, sub_subjects(*)')
            .order('id', { ascending: true })

        if (error) throw error
        return apiSuccess({ subjects: data || [] })
    } catch (error: any) {
        console.error('Admin Subjects GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/admin/subjects
 * Actions: save (insert/update + sub_subjects sync), delete
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
            const { subjectId, name, subSubjects } = body
            let finalId = subjectId

            // 1. บันทึกวิชาหลัก
            if (finalId) {
                const { error } = await supabase.from('subjects').update({ name }).eq('id', finalId)
                if (error) throw error
            } else {
                const { data, error } = await supabase.from('subjects').insert([{ name }]).select().single()
                if (error) throw error
                finalId = data.id
            }

            // 2. ลบวิชาย่อยเดิมแล้วบันทึกใหม่
            await supabase.from('sub_subjects').delete().eq('parent_subject_id', finalId)
            if (subSubjects && subSubjects.length > 0) {
                const inserts = subSubjects.map((ss: any) => ({
                    name: ss.name,
                    parent_subject_id: finalId
                }))
                const { error } = await supabase.from('sub_subjects').insert(inserts)
                if (error) throw error
            }

            return apiSuccess({ saved: true, subjectId: finalId })
        }

        if (action === 'delete') {
            const { id } = body
            const { error } = await supabase.from('subjects').delete().eq('id', id)
            if (error) throw error
            return apiSuccess({ deleted: true })
        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Admin Subjects POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
