// src/app/api/admin/dashboard/notify/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'
import { flexEvaluationReminder } from '@/lib/lineFlex'

/**
 * POST /api/admin/dashboard/notify
 * ส่งแจ้งเตือน LINE Flex Message ไปยังพี่เลี้ยงที่มีรายการค้างประเมิน
 */
export async function POST(req: Request) {
    const supabase = createServerSupabase()

    try {
        // 1. ดึงรายการ assignment ทั้งหมด (เพื่อมาคำนวณสัดส่วน)
        const { data: allAssignments, error } = await supabase
            .from('assignment_supervisors')
            .select(`
                assignment_id,
                evaluation_status,
                supervisors!inner (
                    id,
                    full_name,
                    line_user_id
                )
            `)

        if (error) throw error

        if (!allAssignments || allAssignments.length === 0) {
            return apiSuccess({ message: 'ไม่มีรายการประเมินในระบบ', sentCount: 0 })
        }

        // 2. จัดกลุ่มตาม supervisor_id เพื่อคำนวณรายคน
        const supervisorMap = new Map<string, any>()

        allAssignments.forEach((item: any) => {
            const sv = item.supervisors
            if (!sv.line_user_id) return // ข้ามถ้าไม่มี LINE ID

            if (!supervisorMap.has(sv.id)) {
                supervisorMap.set(sv.id, {
                    name: sv.full_name,
                    lineUserId: sv.line_user_id,
                    total: 0,
                    evaluated: 0,
                    pending: 0
                })
            }

            const stats = supervisorMap.get(sv.id)
            stats.total += 1
            if (item.evaluation_status === 2) {
                stats.evaluated += 1
            } else {
                stats.pending += 1
            }
        })

        const targets = Array.from(supervisorMap.values()).filter(s => s.pending > 0)
        let sentCount = 0

        // 3. ส่งแจ้งเตือนผ่าน LINE Flex Message
        for (const info of targets) {
            try {
                // สร้าง Flex Message จาก Template
                const flexMsg = flexEvaluationReminder({
                    name: info.name,
                    evaluated: info.evaluated,
                    total: info.total,
                    pending: info.pending
                })

                const response = await fetch(`${new URL(req.url).origin}/api/line/push`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lineUserId: info.lineUserId,
                        flexMessage: flexMsg
                    })
                })

                if (response.ok) {
                    sentCount++
                } else {
                    console.error(`Failed to send Flex Message to ${info.lineUserId}:`, await response.text())
                }
            } catch (err) {
                console.error(`Error sending Flex Message to ${info.lineUserId}:`, err)
            }
        }

        return apiSuccess({
            message: `ส่งแจ้งเตือน Flex Message สำเร็จ ${sentCount} ท่าน`,
            sentCount,
            totalTargets: targets.length
        })

    } catch (error: any) {
        console.error('Admin Notify API Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
