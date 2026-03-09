// src/app/api/admin/sites/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/admin/sites
 * ดึงข้อมูลแหล่งฝึกทั้งหมด
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.app_metadata.provider !== 'email') {
            return apiError('Unauthorized', 401)
        }

        const { data, error } = await supabase
            .from('training_sites')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return apiSuccess({ sites: data || [] })
    } catch (error: any) {
        console.error('Admin Sites GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/admin/sites
 * Actions: save (insert/update), delete
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
            const { siteId, payload } = body

            if (siteId) {
                // Update
                const { error } = await supabase
                    .from('training_sites')
                    .update(payload)
                    .eq('id', siteId)
                if (error) throw error
            } else {
                // Insert
                const { error } = await supabase
                    .from('training_sites')
                    .insert(payload)
                if (error) throw error
            }

            return apiSuccess({ saved: true })
        }

        if (action === 'delete') {
            const { id } = body
            const { error } = await supabase
                .from('training_sites')
                .delete()
                .eq('id', id)
            if (error) throw error
            return apiSuccess({ deleted: true })
        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Admin Sites POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
