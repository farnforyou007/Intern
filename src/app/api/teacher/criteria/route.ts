// src/app/api/teacher/criteria/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/teacher/criteria
 * Query Params: subjectId, subId (optional)
 * If no subjectId: ดึงรายชื่อวิชาที่รับผิดชอบ
 * If subjectId: ดึงหมวดประเมิน (groups) และข้อคำถาม (items)
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(req.url)
    const subjectIdStr = searchParams.get('subjectId')
    const subIdStr = searchParams.get('subId')

    try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

        // 1. ดึงข้อมูลอาจารย์
        const { data: teacher } = await supabase
            .from('supervisors')
            .select('id')
            .eq('user_id', authUser.id)
            .single()

        if (!teacher) return apiError('Teacher profile not found', 404)

        // 2. ถ้าไม่มี subjectId => ดึงวิชาที่รับผิดชอบ
        if (!subjectIdStr) {
            const { data: subjects, error } = await supabase
                .from('supervisor_subjects')
                .select('subject_id, subjects(id, name), sub_subjects(id, name)')
                .eq('supervisor_id', teacher.id)

            if (error) throw error
            return apiSuccess({ subjects: subjects || [] })
        }

        // 3. ถ้ามี subjectId => ตรวจสอบสิทธิ์ก่อน
        const subjectId = parseInt(subjectIdStr)
        const { data: hasAccess } = await supabase
            .from('supervisor_subjects')
            .select('id')
            .eq('supervisor_id', teacher.id)
            .eq('subject_id', subjectId)
            .limit(1)

        if (!hasAccess || hasAccess.length === 0) {
            return apiError('Forbidden: You do not have access to this subject', 403)
        }

        // 4. ดึงข้อมูล Criteria
        let groupQuery = supabase.from('evaluation_groups')
            .select('*, evaluation_items(*)')
            .eq('subject_id', subjectId)

        if (subIdStr) {
            groupQuery = groupQuery.eq('sub_subject_id', parseInt(subIdStr))
        } else {
            groupQuery = groupQuery.is('sub_subject_id', null)
        }

        const { data: groups, error: groupError } = await groupQuery
            .order('group_name', { ascending: true })
            .order('order_index', { foreignTable: 'evaluation_items', ascending: true })
        if (groupError) throw groupError

        // 5. ตรวจสอบการใช้งาน (เพื่อล็อคไม่ให้ลบ/แก้ไข)
        // ดึง IDs ของกลุ่มที่เคยถูกประเมินแล้ว
        const { data: usedGroupData } = await supabase
            .from('evaluation_logs')
            .select('group_id')
            .in('group_id', (groups || []).map(g => g.id))
        const usedGroupIds = new Set((usedGroupData || []).map(d => d.group_id))

        // ดึง IDs ของข้อคำถามที่เคยถูกประเมินแล้ว
        const allItemIds = (groups || []).flatMap(g => (g.evaluation_items || []).map((i: any) => i.id))
        const { data: usedItemData } = await supabase
            .from('evaluation_answers')
            .select('item_id')
            .in('item_id', allItemIds)
        const usedItemIds = new Set((usedItemData || []).map(d => d.item_id))

        // มาร์คข้อมูล
        const processedGroups = (groups || []).map(g => ({
            ...g,
            is_used: usedGroupIds.has(g.id),
            evaluation_items: (g.evaluation_items || []).map((i: any) => ({
                ...i,
                is_used: usedItemIds.has(i.id)
            }))
        }))

        // 6. ดึงข้อมูลวิชาหลัก & วิชาย่อย
        const { data: subject } = await supabase.from('subjects').select('*').eq('id', subjectId).single()
        let subSubject = null
        if (subIdStr) {
            const { data: ss } = await supabase.from('sub_subjects').select('*').eq('id', parseInt(subIdStr)).single()
            subSubject = ss
        }

        // 7. ดึงเทมเพลตมาตรฐาน (สำหรับให้ครูกดใช้)
        const { data: templates } = await supabase.from('eval_templates').select('*').order('id', { ascending: true })

        return apiSuccess({
            subject,
            subSubject,
            groups: processedGroups,
            templates: templates || []
        })

    } catch (error: any) {
        console.error('Teacher Criteria GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/teacher/criteria
 * Actions: save-group, delete-group, save-item, delete-item, reorder-items, apply-template
 */
export async function POST(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

        const { data: teacher } = await supabase
            .from('supervisors')
            .select('id')
            .eq('user_id', authUser.id)
            .single()
        if (!teacher) return apiError('Teacher profile not found', 404)

        const body = await req.json()
        const { action, subjectId } = body

        if (!subjectId) return apiError('Subject ID is required', 400)

        // 🔐 Security: ตรวจสอบความเป็นเจ้าของวิชา
        const { data: hasAccess } = await supabase
            .from('supervisor_subjects')
            .select('id')
            .eq('supervisor_id', teacher.id)
            .eq('subject_id', subjectId)
            .limit(1)

        if (!hasAccess || hasAccess.length === 0) {
            return apiError('Forbidden', 403)
        }

        // --- Action Handlers ---

        if (action === 'save-group') {
            const { groupId, groupData } = body
            const payload = { ...groupData, subject_id: subjectId }

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
            if (used && used.length > 0) return apiError('ไม่สามารถลบหมวดนี้ได้ เนื่องจากมีข้อมูลการประเมินในระบบแล้ว', 400)

            const { error } = await supabase.from('evaluation_groups').delete().eq('id', groupId)
            if (error) throw error
            return apiSuccess({ deleted: true })
        }

        if (action === 'save-item') {
            const { itemId, groupId, itemData } = body
            // ต้องตรวจสอบว่า groupId นั้นอยู่ใน subjectId นี้จริง
            const { data: groupCheck } = await supabase.from('evaluation_groups').select('id').eq('id', groupId).eq('subject_id', subjectId).single()
            if (!groupCheck) return apiError('Invalid group for this subject', 400)

            if (itemId) {
                // Check usage before updating sensitive fields
                const { data: used } = await supabase.from('evaluation_answers').select('id').eq('item_id', itemId).limit(1)
                if (used && used.length > 0) {
                    // ถ้าใช้งานแล้ว ห้ามเปลี่ยนคำถามหรือ Factor
                    const { data: current } = await supabase.from('evaluation_items').select('*').eq('id', itemId).single()
                    if (current.question_text !== itemData.question_text || current.factor !== itemData.factor) {
                        return apiError('ไม่สามารถแก้ไขหัวข้อหรือน้ำหนักได้ เนื่องจากข้อนี้ถูกใช้ประเมินแล้ว', 400)
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
            const { itemId, groupId } = body
            // Check ownership of group
            const { data: groupCheck } = await supabase.from('evaluation_groups').select('id').eq('id', groupId).eq('subject_id', subjectId).single()
            if (!groupCheck) return apiError('Invalid group', 400)

            // Check usage
            const { data: used } = await supabase.from('evaluation_answers').select('id').eq('item_id', itemId).limit(1)
            if (used && used.length > 0) return apiError('ไม่สามารถลบข้อคำถามนี้ได้ เนื่องจากถูกใช้ประเมินแล้ว', 400)

            const { error } = await supabase.from('evaluation_items').delete().eq('id', itemId).eq('group_id', groupId)
            if (error) throw error
            return apiSuccess({ deleted: true })
        }

        if (action === 'clear-items') {
            const { groupId } = body
            // Check ownership of group
            const { data: groupCheck } = await supabase.from('evaluation_groups').select('id').eq('id', groupId).eq('subject_id', subjectId).single()
            if (!groupCheck) return apiError('Invalid group', 400)

            // Check usage of any item in this group
            const { data: items } = await supabase.from('evaluation_items').select('id').eq('group_id', groupId)
            if (items && items.length > 0) {
                const itemIds = items.map(i => i.id)
                const { data: used } = await supabase.from('evaluation_answers').select('id').in('item_id', itemIds).limit(1)
                if (used && used.length > 0) return apiError('ไม่สามารถล้างคำถามได้ เนื่องจากบางข้อถูกใช้ประเมินแล้ว', 400)
            }

            const { error } = await supabase.from('evaluation_items').delete().eq('group_id', groupId)
            if (error) throw error
            return apiSuccess({ cleared: true })
        }

        if (action === 'toggle-group-status') {
            const { groupId, is_active, deactivation_note } = body
            const { error } = await supabase
                .from('evaluation_groups')
                .update({ is_active, deactivation_note })
                .eq('id', groupId)
            if (error) throw error
            return apiSuccess({ updated: true })
        }

        if (action === 'reorder-items') {
            const { groupId, updates } = body
            // updates = [{ id, order_index }, ...]
            // Check ownership of group
            const { data: groupCheck } = await supabase.from('evaluation_groups').select('id').eq('id', groupId).eq('subject_id', subjectId).single()
            if (!groupCheck) return apiError('Invalid group', 400)

            const { error } = await supabase.from('evaluation_items').upsert(updates.map((u: any) => ({ ...u, group_id: groupId })))
            if (error) throw error
            return apiSuccess({ reordered: true })
        }

        if (action === 'apply-template') {
            const { templateId, groupId } = body
            // Check ownership of group
            const { data: groupCheck } = await supabase.from('evaluation_groups').select('id').eq('id', groupId).eq('subject_id', subjectId).single()
            if (!groupCheck) return apiError('Invalid group', 400)

            // ดึง items จากเทมเพลต
            const { data: tempItems } = await supabase.from('eval_template_items').select('*').eq('template_id', templateId)
            if (tempItems && tempItems.length > 0) {
                // หา order ล่าสุด
                const { data: items } = await supabase
                    .from('evaluation_items')
                    .select('order_index')
                    .eq('group_id', groupId)
                    .order('order_index', { ascending: false })
                    .limit(1)

                const startOrder = (items && items.length > 0) ? items[0].order_index + 1 : 0

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

        return apiError('Unknown action', 400)

    } catch (error: any) {
        console.error('Teacher Criteria POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
