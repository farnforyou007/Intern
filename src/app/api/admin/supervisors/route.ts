// src/app/api/admin/supervisors/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'
import { flexAccountApproved, flexEvaluationReminder } from '@/lib/lineFlex'

/**
 * GET /api/admin/supervisors
 * ดึงรายชื่อ supervisors + subjects + sites + eval progress ทั้งหมด
 */
export async function GET() {
    const supabase = createServerSupabase()

    try {
        const [
            { data: supervisors, error: supError },
            { data: subjects, error: subError },
            { data: subSubjects, error: ssError },
            { data: sites, error: sitError },
            { data: evalData, error: evalError }
        ] = await Promise.all([
            supabase.from('supervisors')
                .select(`*, line_user_id, training_sites:site_id(site_name, province), supervisor_subjects(subject_id, sub_subject_id, subjects:subject_id(name), sub_subjects:sub_subject_id(name))`)
                .order('created_at', { ascending: false }),
            supabase.from('subjects').select('*').order('name'),
            supabase.from('sub_subjects').select('*').order('name'),
            supabase.from('training_sites').select('*').order('site_name'),
            supabase.from('assignment_supervisors')
                .select('supervisor_id, is_evaluated, evaluation_status')
        ])

        const firstError = supError || subError || ssError || sitError || evalError
        if (firstError) {
            return apiError(firstError.message, 500)
        }

        // สร้าง evalProgressMap ฝั่ง server
        const evalProgressMap: Record<string, { total: number; evaluated: number }> = {}
        if (evalData) {
            evalData.forEach((item: any) => {
                const sid = item.supervisor_id
                if (!evalProgressMap[sid]) evalProgressMap[sid] = { total: 0, evaluated: 0 }
                evalProgressMap[sid].total += 1
                if (Number(item.evaluation_status) === 2) evalProgressMap[sid].evaluated += 1
            })
        }

        return apiSuccess({
            supervisors: supervisors || [],
            subjects: subjects || [],
            subSubjects: subSubjects || [],
            sites: sites || [],
            evalProgressMap
        })
    } catch (error: any) {
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/admin/supervisors
 * Actions: approve, delete, update, save-subjects, send-reminder
 */
export async function POST(req: Request) {
    const supabase = createServerSupabase()

    try {
        const body = await req.json()
        const { action } = body

        switch (action) {
            // --- อนุมัติพี่เลี้ยง ---
            case 'approve': {
                const { id, name, lineUserId } = body
                const { error } = await supabase
                    .from('supervisors')
                    .update({ is_verified: true })
                    .eq('id', id)

                if (error) return apiError(error.message, 500)

                // ส่ง LINE แจ้งเตือนอนุมัติ
                if (lineUserId) {
                    try {
                        await fetch('https://api.line.me/v2/bot/message/push', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                            },
                            body: JSON.stringify({
                                to: lineUserId,
                                messages: [flexAccountApproved(name)]
                            }),
                        })
                    } catch (lineErr) {
                        console.error('LINE Notification Error:', lineErr)
                    }
                }

                return apiSuccess({ message: 'อนุมัติเรียบร้อย' })
            }

            // --- ลบพี่เลี้ยง ---
            case 'delete': {
                const { id } = body
                const { error } = await supabase
                    .from('supervisors')
                    .delete()
                    .eq('id', id)

                if (error) return apiError(error.message, 500)
                return apiSuccess({ message: 'ลบข้อมูลสำเร็จ' })
            }

            // --- อัปเดตข้อมูลพี่เลี้ยง ---
            case 'update': {
                const { id, full_name, phone, email, province, site_id, group_type } = body
                const { error } = await supabase
                    .from('supervisors')
                    .update({ full_name, phone, email, province, site_id, group_type })
                    .eq('id', id)

                if (error) return apiError(error.message, 500)
                return apiSuccess({ message: 'อัปเดตข้อมูลแล้ว' })
            }

            // --- บันทึกรายวิชาที่รับผิดชอบ ---
            case 'save-subjects': {
                const { supervisorId, subjects: newSubjects } = body

                // 1. ลบรายวิชาเดิมทั้งหมด
                await supabase.from('supervisor_subjects').delete().eq('supervisor_id', supervisorId)

                // 2. เพิ่มรายวิชาใหม่
                if (newSubjects && newSubjects.length > 0) {
                    const records = newSubjects.map((s: any) => ({
                        supervisor_id: supervisorId,
                        subject_id: s.subject_id,
                        sub_subject_id: s.sub_subject_id
                    }))
                    const { error: insertError } = await supabase.from('supervisor_subjects').insert(records)
                    if (insertError) return apiError(insertError.message, 500)
                }

                // 3. ลบ assignment ที่ไม่ตรงกับวิชาใหม่
                const { data: currentAssignments } = await supabase
                    .from('assignment_supervisors')
                    .select(`id, student_assignments:assignment_id(subject_id, sub_subject_id)`)
                    .eq('supervisor_id', supervisorId)

                if (currentAssignments && currentAssignments.length > 0) {
                    const idsToDelete: any[] = []
                    currentAssignments.forEach((assign: any) => {
                        const taskSubj = assign.student_assignments?.subject_id
                        const taskSubSubj = assign.student_assignments?.sub_subject_id
                        const isValid = (newSubjects || []).some((s: any) =>
                            s.subject_id === taskSubj && (s.sub_subject_id === taskSubSubj || (!s.sub_subject_id && !taskSubSubj))
                        )
                        if (!isValid) idsToDelete.push(assign.id)
                    })
                    if (idsToDelete.length > 0) {
                        await supabase.from('assignment_supervisors').delete().in('id', idsToDelete)
                    }
                }

                return apiSuccess({ message: 'บันทึกและอัปเดตงานเรียบร้อย' })
            }

            // --- ส่ง LINE แจ้งเตือนการประเมินค้าง ---
            case 'send-reminder': {
                const { lineUserId, name, evaluated, total, pending } = body

                if (!lineUserId) return apiError('ไม่พบ LINE User ID', 400)

                const flexMessage = flexEvaluationReminder({ name, evaluated, total, pending })

                const response = await fetch('https://api.line.me/v2/bot/message/push', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                    },
                    body: JSON.stringify({
                        to: lineUserId,
                        messages: [flexMessage]
                    }),
                })

                const data = await response.json()

                if (!response.ok) {
                    console.error('LINE API Error:', data)
                    return apiError('ส่ง LINE ไม่สำเร็จ', response.status)
                }

                return apiSuccess({ message: 'ส่งแจ้งเตือนสำเร็จ' })
            }

            default:
                return apiError(`Unknown action: ${action}`, 400)
        }
    } catch (error: any) {
        console.error('Admin Supervisors API Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
