// src/app/api/admin/criteria/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/admin/criteria
 * Query Params: subjectId, subId (optional)
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(req.url)
    const subjectIdStr = searchParams.get('subjectId')
    const subIdStr = searchParams.get('subId')

    try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'email') {
            return apiError('Unauthorized', 401)
        }

        if (!subjectIdStr) return apiError('Subject ID is required', 400)
        const subjectId = parseInt(subjectIdStr)

        // 1. ดึงข้อมูลวิชาหลัก
        const { data: subject } = await supabase.from('subjects').select('*').eq('id', subjectId).single()

        // 2. ดึงข้อมูลวิชาย่อย (ถ้ามี)
        let subSubject = null
        if (subIdStr) {
            const { data: ss } = await supabase.from('sub_subjects').select('*').eq('id', parseInt(subIdStr)).single()
            subSubject = ss
        }

        // 3. ดึงกลุ่มประเมินและข้อคำถาม
        let query = supabase.from('evaluation_groups').select('*, evaluation_items(*)').eq('subject_id', subjectId)
        if (subIdStr) {
            query = query.eq('sub_subject_id', parseInt(subIdStr))
        } else {
            query = query.is('sub_subject_id', null)
        }

        const { data: groups, error: groupError } = await query
            .order('group_name', { ascending: true })
            .order('order_index', { foreignTable: 'evaluation_items', ascending: true })

        if (groupError) throw groupError

        // 4. ตรวจสอบการใช้งาน (Safety Locks)
        const { data: usedGroupData } = await supabase
            .from('evaluation_logs')
            .select('group_id')
            .in('group_id', (groups || []).map(g => g.id))
        const usedGroupIds = new Set((usedGroupData || []).map(d => d.group_id))

        const allItemIds = (groups || []).flatMap(g => (g.evaluation_items || []).map((i: any) => i.id))
        const { data: usedItemData } = await supabase
            .from('evaluation_answers')
            .select('item_id')
            .in('item_id', allItemIds)
        const usedItemIds = new Set((usedItemData || []).map(d => d.item_id))

        const processedGroups = (groups || []).map(g => ({
            ...g,
            is_used: usedGroupIds.has(g.id),
            evaluation_items: (g.evaluation_items || []).map((i: any) => ({
                ...i,
                is_used: usedItemIds.has(i.id),
                is_active: i.is_active !== false // Ensure default is true if column added
            }))
        }))

        // 5. ดึงเทมเพลตมาตรฐาน
        const { data: templates } = await supabase.from('eval_templates').select('*').order('id', { ascending: true })

        return apiSuccess({
            subject,
            subSubject,
            groups: processedGroups,
            templates: templates || []
        })

    } catch (error: any) {
        console.error('Admin Criteria GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/admin/criteria
 */
export async function POST(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'email') {
            return apiError('Unauthorized', 401)
        }

        const body = await req.json()
        const { action, subjectId, subId } = body

        if (!subjectId) return apiError('Subject ID is required', 400)

        // --- Action Handlers ---

        if (action === 'save-group') {
            const { groupId, groupData } = body
            const payload = { ...groupData, subject_id: subjectId, sub_subject_id: subId || null }

            if (groupId) {
                const { is_used, evaluation_items, ...rest } = payload
                const { error } = await supabase.from('evaluation_groups').update(rest).eq('id', groupId)
                if (error) throw error
            } else {
                const { is_used, evaluation_items, ...rest } = payload
                const { error } = await supabase.from('evaluation_groups').insert([rest])
                if (error) throw error
            }
            return apiSuccess({ saved: true })
        }

        if (action === 'delete-group') {
            const { groupId } = body
            // Check usage
            const { data: used } = await supabase.from('evaluation_logs').select('id').eq('group_id', groupId).limit(1)
            if (used && used.length > 0) return apiError('ไม่สามารถลบหมวดนี้ได้ เนื่องจากมีข้อมูลการประเมินแล้ว', 400)

            const { error } = await supabase.from('evaluation_groups').delete().eq('id', groupId)
            if (error) throw error
            return apiSuccess({ deleted: true })
        }

        if (action === 'save-item') {
            const { itemId, groupId, itemData } = body
            if (itemId) {
                // Usage check for sensitive fields
                const { data: used } = await supabase.from('evaluation_answers').select('id').eq('item_id', itemId).limit(1)
                if (used && used.length > 0) {
                    const { data: current } = await supabase.from('evaluation_items').select('*').eq('id', itemId).single()
                    // Allow question_text and description edits, but block factor changes
                    if (current.factor !== itemData.factor) {
                        return apiError('ไม่สามารถแก้ไขน้ำหนัก (Factor) ได้ เนื่องจากถูกใช้ประเมินแล้ว', 400)
                    }
                }
                const { is_used, ...rest } = itemData
                const { error } = await supabase.from('evaluation_items').update(rest).eq('id', itemId)
                if (error) throw error
            } else {
                // หา order_index ล่าสุด
                const { is_used, ...rest } = itemData
                const { data: items } = await supabase
                    .from('evaluation_items')
                    .select('order_index')
                    .eq('group_id', groupId)
                    .order('order_index', { ascending: false })
                    .limit(1)

                const nextOrder = (items && items.length > 0) ? items[0].order_index + 1 : 0

                const { error } = await supabase.from('evaluation_items').insert([{ ...rest, group_id: groupId, order_index: nextOrder }])
                if (error) throw error
            }
            return apiSuccess({ saved: true })
        }

        if (action === 'delete-item') {
            const { itemId } = body
            const { data: used } = await supabase.from('evaluation_answers').select('id').eq('item_id', itemId).limit(1)
            if (used && used.length > 0) return apiError('ไม่สามารถลบได้ เนื่องจากถูกใช้ประเมินแล้ว กรุณาใช้การ "ซ่อน" แทน', 400)

            const { error } = await supabase.from('evaluation_items').delete().eq('id', itemId)
            if (error) throw error
            return apiSuccess({ deleted: true })
        }

        if (action === 'reorder-items') {
            const { updates } = body // [{id, order_index}]
            const { error } = await supabase.from('evaluation_items').upsert(updates)
            if (error) throw error
            return apiSuccess({ reordered: true })
        }

        if (action === 'toggle-item-status') {
            const { itemId, is_active } = body
            const { error } = await supabase.from('evaluation_items').update({ is_active }).eq('id', itemId)
            if (error) throw error
            return apiSuccess({ updated: true })
        }

        if (action === 'toggle-group-status') {
            const { groupId, is_active, deactivation_note } = body
            const { error } = await supabase.from('evaluation_groups').update({ is_active, deactivation_note }).eq('id', groupId)
            if (error) throw error
            return apiSuccess({ updated: true })
        }

        if (action === 'apply-template') {
            const { templateId, groupId } = body
            const { data: tempItems } = await supabase.from('eval_template_items').select('*').eq('template_id', templateId)
            if (tempItems && tempItems.length > 0) {
                const { data: lastItem } = await supabase.from('evaluation_items').select('order_index').eq('group_id', groupId).order('order_index', { ascending: false }).limit(1)
                const startOrder = (lastItem && lastItem.length > 0) ? lastItem[0].order_index + 1 : 0

                const newItems = tempItems.map((item, idx) => ({
                    group_id: groupId,
                    question_text: item.question_text,
                    description: item.description,
                    allow_na: item.allow_na,
                    factor: item.factor || 1.0,
                    order_index: startOrder + idx
                }))
                const { error } = await supabase.from('evaluation_items').insert(newItems)
                if (error) throw error
            }
            return apiSuccess({ applied: true })
        }

        if (action === 'clear-items') {
            const { groupId } = body
            const { data: items } = await supabase.from('evaluation_items').select('id').eq('group_id', groupId)
            if (items && items.length > 0) {
                const { data: used } = await supabase.from('evaluation_answers').select('id').in('item_id', items.map(i => i.id)).limit(1)
                if (used && used.length > 0) return apiError('ไม่สามารถล้างได้ เนื่องจากบางข้อถูกใช้ประเมินแล้ว', 400)
                const { error } = await supabase.from('evaluation_items').delete().eq('group_id', groupId)
                if (error) throw error
            }
            return apiSuccess({ cleared: true })
        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Admin Criteria POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
