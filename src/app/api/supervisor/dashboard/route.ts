// src/app/api/supervisor/dashboard/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError, getLineUserIdFromRequest } from '@/lib/api-helpers'

/**
 * GET /api/supervisor/dashboard
 * ดึงข้อมูล Dashboard ของ Supervisor (ต้องส่ง X-Line-User-Id ผ่าน Header)
 * Return: supervisor info, stats, daysLeft, alertStatus, urgentRotationName, pendingStudentsCount
 */
export async function GET(req: Request) {
    const supabase = createServerSupabase()

    try {
        const lineUserId = getLineUserIdFromRequest(req)
        if (!lineUserId) {
            return apiError('Missing X-Line-User-Id header', 401)
        }

        // 0. ดึงปีการศึกษาปัจจุบันจาก system_configs
        const { data: configData } = await supabase
            .from('system_configs')
            .select('key_value')
            .eq('key_name', 'current_training_year')
            .single()
        const currentYear = configData?.key_value || ''

        // 1. ดึงข้อมูลพี่เลี้ยง
        const { data: svData, error: svError } = await supabase
            .from('supervisors')
            .select('*, training_sites(site_name)')
            .eq('line_user_id', lineUserId)
            .single()

        if (svError || !svData) {
            return apiError('Supervisor not found', 404)
        }

        // จัดการรูปโปรไฟล์
        const imgPath = svData.avatar_url || svData.image
        const publicUrl = imgPath?.startsWith('http')
            ? imgPath
            : `https://vvxsfibqlpkpzqyjwmuw.supabase.co/storage/v1/object/public/avatars/${imgPath}`

        const supervisorData = { ...svData, avatar_url: publicUrl }

        // 2.5 ดึงวิชาที่พี่เลี้ยงรับผิดชอบ
        const { data: subjectData } = await supabase
            .from('supervisor_subjects')
            .select('subjects(id, name)')
            .eq('supervisor_id', svData.id)
        const subjectNames = (subjectData || []).map((s: any) => s.subjects?.name).filter(Boolean)

        // 2. ดึง student IDs ที่อยู่ในปีการศึกษาปัจจุบัน
        let yearStudentIds: Set<string> = new Set()
        if (currentYear) {
            const { data: yearStudents } = await supabase
                .from('students')
                .select('id')
                .eq('training_year', currentYear)
            yearStudentIds = new Set((yearStudents || []).map((s: any) => String(s.id)))
        }

        // 3. ดึงข้อมูลงานที่ได้รับมอบหมาย
        const { data: rawAssignments, error: assignError } = await supabase
            .from('assignment_supervisors')
            .select(`
                evaluation_status,
                is_evaluated,
                student_assignments:assignment_id (
                    id,
                    student_id,
                    students:student_id ( id ),
                    sub_subjects ( name ),
                    rotations ( end_date, name )
                )
            `)
            .eq('supervisor_id', svData.id)

        if (assignError) throw assignError

        // กรองเฉพาะนักศึกษาในปีปัจจุบัน
        const assignments = (rawAssignments || []).filter((a: any) => {
            const studentId = String(a.student_assignments?.students?.id || a.student_assignments?.student_id || '')
            return yearStudentIds.has(studentId)
        })

        // 4. คำนวณ Stats
        let stats = { total: 0, evaluated: 0, pending: 0, partial: 0 }
        let daysLeft: number | null = null
        let alertStatus: 'normal' | 'overdue' = 'normal'
        let urgentRotationName = ''
        let pendingStudentsCount = 0

        if (assignments.length > 0) {
            // กรองเฉพาะงานที่ยังไม่ตรวจ และมีข้อมูลวันสิ้นสุด
            const pendingTasksData = assignments.filter((a: any) =>
                !a.is_evaluated && a.student_assignments?.rotations?.end_date
            )

            if (pendingTasksData.length > 0) {
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const overdueTasks: any[] = []
                const upcomingTasks: any[] = []

                for (const task of pendingTasksData) {
                    const rotationData = (task.student_assignments as any)?.rotations
                    if (rotationData?.end_date) {
                        const endDate = new Date(rotationData.end_date)
                        endDate.setHours(0, 0, 0, 0)

                        if (endDate < today) {
                            overdueTasks.push({ ...task, endDate, rotationName: rotationData.name })
                        } else {
                            upcomingTasks.push({ ...task, endDate, rotationName: rotationData.name })
                        }
                    }
                }

                if (overdueTasks.length > 0) {
                    overdueTasks.sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
                    const urgentTask = overdueTasks[0]
                    const diffTime = today.getTime() - urgentTask.endDate.getTime()
                    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    urgentRotationName = `งานค้าง ${urgentTask.rotationName || ''}`
                    alertStatus = 'overdue'
                } else if (upcomingTasks.length > 0) {
                    upcomingTasks.sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
                    const nextTask = upcomingTasks[0]
                    const diffTime = nextTask.endDate.getTime() - today.getTime()
                    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    urgentRotationName = nextTask.rotationName || ''
                    alertStatus = 'normal'
                }

                pendingStudentsCount = new Set(
                    pendingTasksData
                        .map((a: any) => a.student_assignments?.student_id)
                        .filter(Boolean)
                ).size
            }

            const uniqueStudentIds = assignments
                .map((a: any) => a.student_assignments?.students?.id)
                .filter(Boolean)
            const totalMyStudentsCount = new Set(uniqueStudentIds).size
            const evaluatedCount = assignments.filter((a: any) => a.evaluation_status === 2).length
            const partialCount = assignments.filter((a: any) => a.evaluation_status === 1).length
            const pendingTasksCount = assignments.filter((a: any) => a.evaluation_status === 0).length

            stats = {
                total: totalMyStudentsCount,
                evaluated: evaluatedCount,
                pending: pendingTasksCount,
                partial: partialCount
            }
        }

        return apiSuccess({
            supervisor: supervisorData,
            stats,
            daysLeft,
            alertStatus,
            urgentRotationName,
            pendingStudentsCount,
            configYear: currentYear,
            subjectNames
        })
    } catch (error: any) {
        console.error('Supervisor Dashboard API Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
