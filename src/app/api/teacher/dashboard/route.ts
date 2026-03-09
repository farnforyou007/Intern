// src/app/api/teacher/dashboard/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/teacher/dashboard?lineUserId=xxx&selectedYear=yyy
 * ดึงข้อมูล dashboard อาจารย์: teacher info, subjects, assignments, analytics
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { searchParams } = new URL(req.url)
        const selectedYear = searchParams.get('selectedYear') || ''

        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

        // 0. ดึงปีการศึกษา default + options
        let defaultYear = selectedYear
        if (!defaultYear) {
            const { data: configData } = await supabase
                .from('system_configs')
                .select('key_value')
                .eq('key_name', 'current_training_year')
                .single()
            defaultYear = configData?.key_value || ''
        }

        const { data: yearsData } = await supabase
            .from('students')
            .select('training_year')
            .not('training_year', 'is', null)
        const yearOptions = yearsData
            ? Array.from(new Set(yearsData.map((y: any) => y.training_year))).sort((a: string, b: string) => b.localeCompare(a))
            : []

        // 1. ดึง student IDs ในปีที่เลือก
        let yearStudentIds: Set<string> | null = null
        if (defaultYear) {
            const { data: yearStudents } = await supabase
                .from('students')
                .select('id')
                .eq('training_year', defaultYear)
            yearStudentIds = new Set((yearStudents || []).map((s: any) => String(s.id)))
        }

        // 2. ดึง Teacher info - 🛡️ Hardened RBAC
        const { data: user } = await supabase
            .from('supervisors')
            .select('id, full_name, avatar_url, role, supervisor_subjects(id)')
            .eq('user_id', authUser.id)
            .or('role.eq.teacher,role.eq.both') // Require teacher role
            .maybeSingle()

        if (!user) return apiError('Teacher not found or Permission denied', 403)

        const hasDoubleRole = user.role === 'supervisor' || user.role === 'both'

        // 3. ดึง Subjects (พร้อม sub_subject_id เพื่อแยกวิชาย่อย)
        const { data: subData } = await supabase
            .from('supervisor_subjects')
            .select('subject_id, sub_subject_id, subjects(name, id), sub_subjects:sub_subject_id(name, id)')
            .eq('supervisor_id', user.id)

        const subjectList = subData || []
        const subjectIds = [...new Set(subjectList.map((s: any) => s.subject_id))]

        let assignments: any[] = []
        let analyticsData: any[] = []

        if (subjectIds.length > 0) {
            // 4. Assignments
            const { data: rawAssignments } = await supabase
                .from('student_assignments')
                .select(`
                    id, subject_id, student_id,
                    students (first_name, last_name, student_code),
                    subjects (name),
                    training_sites (site_name, province),
                    assignment_supervisors(is_evaluated, evaluation_status),
                    evaluation_logs(id)
                `)
                .in('subject_id', subjectIds)

            assignments = yearStudentIds
                ? (rawAssignments || []).filter((a: any) => yearStudentIds!.has(String(a.student_id)))
                : (rawAssignments || [])

            // 5. Analytics data
            const { data: rawAnalyticsRes } = await supabase
                .from('student_assignments')
                .select(`
                    id, subject_id, student_id,
                    students (id, first_name, last_name, student_code),
                    subjects (name, id),
                    training_sites (site_name, province),
                    evaluation_logs (
                        id, total_score, supervisor_id,
                        supervisors (id, full_name),
                        evaluation_groups (id, group_name, weight),
                        evaluation_answers (score, item_id)
                    )
                `)
                .in('subject_id', subjectIds)

            const analyticsRes = yearStudentIds
                ? (rawAnalyticsRes || []).filter((a: any) => yearStudentIds!.has(String(a.student_id)))
                : (rawAnalyticsRes || [])

            // Process analytics — GROUP BY student+subject (เหมือน subjects API)
            // เพื่อให้คะแนน Top 5 / site stats ตรงกับหน้าประเมิน
            const studentSubjectMap: { [key: string]: any } = {}
                ; (analyticsRes || []).forEach((item: any) => {
                    const studentId = item.student_id
                    const subjectId = item.subject_id
                    if (!studentId) return
                    const key = `${studentId}-${subjectId}`
                    if (!studentSubjectMap[key]) {
                        studentSubjectMap[key] = {
                            student: item.students,
                            place: item.training_sites,
                            subjectName: item.subjects?.name,
                            subject_id: subjectId,
                            allLogs: []
                        }
                    }
                    if (item.evaluation_logs?.length > 0) {
                        studentSubjectMap[key].allLogs.push(...item.evaluation_logs)
                    }
                })

            analyticsData = Object.values(studentSubjectMap).map((item: any) => {
                const logs = item.allLogs || []
                const supervisorMap: { [key: string]: { supervisorId: string; supervisorName: string; logs: any[] } } = {}
                logs.forEach((log: any) => {
                    const svId = log.supervisor_id || 'unknown'
                    if (!supervisorMap[svId]) supervisorMap[svId] = { supervisorId: svId, supervisorName: log.supervisors?.full_name || 'ไม่ระบุ', logs: [] }
                    supervisorMap[svId].logs.push(log)
                })
                const supervisorEvaluations = Object.values(supervisorMap).map(sv => ({
                    ...sv,
                    evaluations: sv.logs.map((log: any) => ({
                        groupId: log.evaluation_groups?.id,
                        title: log.evaluation_groups?.group_name,
                        rawScore: log.total_score || 0,
                        weight: log.evaluation_groups?.weight || 1,
                        answers: log.evaluation_answers || []
                    }))
                }))
                const mentorCount = supervisorEvaluations.length
                let evaluations: any[] = []
                if (mentorCount === 1) evaluations = supervisorEvaluations[0].evaluations
                else if (mentorCount > 1) {
                    const groupMap: { [groupId: string]: any[] } = {}
                    supervisorEvaluations.forEach(sv => {
                        sv.evaluations.forEach((ev: any) => {
                            if (!groupMap[ev.groupId]) groupMap[ev.groupId] = []
                            groupMap[ev.groupId].push(ev)
                        })
                    })
                    evaluations = Object.values(groupMap).map(evs => ({
                        groupId: evs[0].groupId,
                        title: evs[0].title,
                        rawScore: Math.round(evs.reduce((s: number, e: any) => s + e.rawScore, 0) / evs.length * 100) / 100,
                        weight: evs[0].weight,
                        answers: evs[0].answers
                    }))
                }
                return {
                    id: `${item.student?.id}-${item.subject_id}`,
                    student: item.student,
                    place: item.place,
                    subjectName: item.subjectName,
                    subject_id: item.subject_id,
                    evaluations,
                    mentorCount
                }
            })
        }

        return apiSuccess({
            teacherData: user,
            hasDoubleRole,
            subjects: subjectList,
            assignments,
            analyticsData,
            defaultYear,
            yearOptions
        })
    } catch (error: any) {
        console.error('Teacher Dashboard GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
