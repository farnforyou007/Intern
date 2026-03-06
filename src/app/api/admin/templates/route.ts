// src/app/api/admin/templates/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/admin/templates
 * ดึงเทมเพลตทั้งหมด
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data, error } = await supabase
            .from('eval_templates')
            .select('*')
            .order('id', { ascending: true })

        if (error) throw error
        return apiSuccess({ templates: data || [] })
    } catch (error: any) {
        console.error('Admin Templates GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/admin/templates
 * Actions: save-template, delete-template, fetch-items, save-item, delete-item, reorder-items
 */
export async function POST(req: Request) {
    const supabase = createServerSupabase()

    try {
        const body = await req.json()
        const { action } = body

        // --- Template CRUD ---
        if (action === 'save-template') {
            const { templateId, template_name } = body
            if (templateId) {
                const { error } = await supabase.from('eval_templates').update({ template_name }).eq('id', templateId)
                if (error) throw error
            } else {
                const { error } = await supabase.from('eval_templates').insert([{ template_name }])
                if (error) throw error
            }
            return apiSuccess({ saved: true })
        }

        if (action === 'delete-template') {
            const { id } = body
            const { error } = await supabase.from('eval_templates').delete().eq('id', id)
            if (error) throw error
            return apiSuccess({ deleted: true })
        }

        // --- Template Items CRUD ---
        if (action === 'fetch-items') {
            const { template_id } = body
            const { data, error } = await supabase
                .from('eval_template_items')
                .select('*')
                .eq('template_id', template_id)
                .order('order_index', { ascending: true })
            if (error) throw error
            return apiSuccess({ items: data || [] })
        }

        if (action === 'save-item') {
            const { itemId, template_id, itemData, itemCount } = body
            if (itemId) {
                const { error } = await supabase.from('eval_template_items').update(itemData).eq('id', itemId)
                if (error) throw error
            } else {
                const { error } = await supabase.from('eval_template_items').insert([{
                    ...itemData,
                    template_id,
                    order_index: itemCount
                }])
                if (error) throw error
            }
            // Return refreshed items
            const { data } = await supabase
                .from('eval_template_items')
                .select('*')
                .eq('template_id', template_id)
                .order('order_index', { ascending: true })
            return apiSuccess({ items: data || [] })
        }

        if (action === 'delete-item') {
            const { itemId, template_id } = body
            const { error } = await supabase.from('eval_template_items').delete().eq('id', itemId)
            if (error) throw error

            const { data } = await supabase
                .from('eval_template_items')
                .select('*')
                .eq('template_id', template_id)
                .order('order_index', { ascending: true })
            return apiSuccess({ items: data || [] })
        }

        if (action === 'reorder-items') {
            const { updates } = body
            const { error } = await supabase.from('eval_template_items').upsert(updates)
            if (error) throw error
            return apiSuccess({ reordered: true })
        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Admin Templates POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
