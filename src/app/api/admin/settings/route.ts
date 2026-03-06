// src/app/api/admin/settings/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/admin/settings
 * ดึงค่า system_configs (current_training_year)
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data, error } = await supabase
            .from('system_configs')
            .select('key_name, key_value')
            .eq('key_name', 'current_training_year')
            .single()

        if (error) throw error
        return apiSuccess({ config: data })
    } catch (error: any) {
        console.error('Admin Settings GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/admin/settings
 * Action: update-config
 */
export async function POST(req: Request) {
    const supabase = createServerSupabase()

    try {
        const body = await req.json()
        const { action, key_name, key_value } = body

        if (action === 'update-config') {
            const { error } = await supabase
                .from('system_configs')
                .update({ key_value })
                .eq('key_name', key_name)

            if (error) throw error
            return apiSuccess({ updated: true })
        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Admin Settings POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
