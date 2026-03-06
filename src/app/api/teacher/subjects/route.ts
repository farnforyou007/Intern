// src/app/api/teacher/subjects/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/teacher/subjects?lineUserId=xxx&subjectId=yyy&selectedTrainingYear=zzz
 * ดึงข้อมูลผลการประเมินรายวิชา
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { searchParams } = new URL(req.url)
        const lineUserId = searchParams.get('lineUserId')
        const subjectId = searchParams.get('subjectId') || ''
        const selectedTrainingYear = searchParams.get('selectedTrainingYear') || ''
        if (!lineUserId) return apiError('Missing lineUserId', 400)

        // 0. ดึงปีการศึกษา default + options
        let defaultYear = selectedTrainingYear
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
        const trainingYearOptions = yearsData
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

        // 2. ดึง Teacher
        const { data: user } = await supabase
            .from('supervisors')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single()
        if (!user) return apiError('Teacher not found', 404)

        // 3. ดึง Subjects
        const { data: subData } = await supabase
            .from('supervisor_subjects')
            .select('subject_id, subjects(name, id)')
            .eq('supervisor_id', user.id)

        const subjects = subData || []

        // ถ้าไม่มี subjectId ให้ default เป็นวิชาแรก
        const effectiveSubjectId = subjectId || (subjects.length > 0 ? subjects[0].subject_id : '')

        // 4. ดึง Assignments + Evaluations + Supervisors
        let query = supabase.from('student_assignments').select(`
            id, 
            students (id, first_name, last_name, student_code, avatar_url, phone),
            subjects (id, name),
            sub_subjects (id, name),
            training_sites (site_name, province),
            assignment_supervisors (is_evaluated, evaluation_status, supervisors(full_name)),
            evaluation_logs (
                id, total_score, comment, supervisor_id, created_at,
                supervisors (id, full_name),
                evaluation_groups (id, group_name, weight),
                evaluation_answers (score, item_id)
            )
        `)

        if (effectiveSubjectId) query = query.eq('subject_id', effectiveSubjectId)
        else if (subjects.length > 0) query = query.in('subject_id', subjects.map((s: any) => s.subject_id))

        const { data: res } = await query

        // กรองเฉพาะ student ในปีที่เลือก
        const yearFiltered = yearStudentIds
            ? (res || []).filter((item: any) => yearStudentIds!.has(String(item.students?.id)))
            : (res || [])

        // Grouping logic (same as client-side)
        const PRIORITY_MAP: { [key: string]: number } = { "บุคลิก": 1, "ประสบการณ์": 2, "ฝึก": 2, "เล่ม": 3, "รายงาน": 3 }
        const getPriority = (title: string) => { for (const key in PRIORITY_MAP) { if (title.includes(key)) return PRIORITY_MAP[key]; } return 99; }
        const getTag = (title: string) => { const match = title.match(/\((.*?)\)/); return match ? match[1].trim() : ""; }
        const sortEvaluations = (a: any, b: any) => {
            const tagA = getTag(a.title || ""); const tagB = getTag(b.title || "");
            if (tagA !== tagB) return tagA.localeCompare(tagB, 'th');
            return getPriority(a.title || "") - getPriority(b.title || "");
        }

        const groupedStudents: { [studentId: string]: any } = {}
        yearFiltered.forEach((item: any) => {
            const studentId = item.students?.id
            if (!studentId) return
            if (!groupedStudents[studentId]) {
                groupedStudents[studentId] = {
                    student: item.students,
                    place: item.training_sites,
                    subjectName: item.subjects?.name || 'ไม่ระบุวิชา',
                    subSubjects: new Set<string>(),
                    allLogs: [],
                    allSupervisors: [] as any[]
                }
            }
            if (item.sub_subjects?.name) groupedStudents[studentId].subSubjects.add(item.sub_subjects.name)
            if (item.evaluation_logs?.length > 0) groupedStudents[studentId].allLogs.push(...item.evaluation_logs)
            if (item.assignment_supervisors?.length > 0) groupedStudents[studentId].allSupervisors.push(...item.assignment_supervisors)
        })

        const processed = Object.values(groupedStudents).map((item: any) => {
            const logs = item.allLogs || []
            const supervisorMap: { [key: string]: { supervisorId: string; supervisorName: string; logs: any[] } } = {}
            logs.forEach((log: any) => {
                const svId = log.supervisor_id || 'unknown'
                if (!supervisorMap[svId]) supervisorMap[svId] = { supervisorId: svId, supervisorName: log.supervisors?.full_name || 'ไม่ระบุชื่อ', logs: [] }
                supervisorMap[svId].logs.push(log)
            })
            const supervisorEvaluations = Object.values(supervisorMap).map(sv => ({
                ...sv,
                evaluations: sv.logs.map((log: any) => ({
                    groupId: log.evaluation_groups?.id,
                    title: log.evaluation_groups?.group_name,
                    rawScore: log.total_score || 0,
                    weight: log.evaluation_groups?.weight || 1,
                    comment: log.comment || '-',
                    answers: log.evaluation_answers || [],
                    evaluatedAt: log.created_at
                })).sort(sortEvaluations)
            }))
            const mentorCount = supervisorEvaluations.length
            let evaluations: any[] = []
            if (mentorCount === 1) evaluations = supervisorEvaluations[0].evaluations
            else if (mentorCount > 1) {
                const groupMap: { [groupId: string]: any[] } = {}
                supervisorEvaluations.forEach(sv => {
                    sv.evaluations.forEach((ev: any) => { if (!groupMap[ev.groupId]) groupMap[ev.groupId] = []; groupMap[ev.groupId].push(ev) })
                })
                evaluations = Object.values(groupMap).map(evs => ({
                    groupId: evs[0].groupId, title: evs[0].title,
                    rawScore: Math.round(evs.reduce((sum: number, e: any) => sum + e.rawScore, 0) / evs.length * 100) / 100,
                    weight: evs[0].weight,
                    comment: evs.map((e: any) => e.comment).join(' / '),
                    answers: evs[0].answers
                })).sort(sortEvaluations)
            }

            let displaySubjectName = item.subjectName
            if (item.subSubjects.size > 0) displaySubjectName += ` (${Array.from(item.subSubjects).join(', ')})`

            // คำนวณสถานะการประเมิน
            const supervisorsWithData = (item.allSupervisors || []).filter((sv: any) => sv !== null)
            let evalStatus: 'done' | 'partial' | 'pending' = 'pending'
            if (supervisorsWithData.length > 0) {
                const allDone = supervisorsWithData.every((sv: any) => Number(sv.evaluation_status) === 2)
                const someDone = supervisorsWithData.some((sv: any) => Number(sv.evaluation_status) >= 1)
                if (allDone) evalStatus = 'done'
                else if (someDone) evalStatus = 'partial'
            }

            return { student: item.student, place: item.place, subjectName: displaySubjectName, evaluations, supervisorEvaluations, mentorCount, evalStatus, totalSupervisors: supervisorsWithData.length, doneSupervisors: supervisorsWithData.filter((sv: any) => Number(sv.evaluation_status) === 2).length }
        })

        return apiSuccess({
            subjects,
            data: processed,
            defaultYear,
            trainingYearOptions,
            effectiveSubjectId
        })
    } catch (error: any) {
        console.error('Teacher Subjects GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/teacher/subjects
 * Actions: fetch-questions (for detail modal)
 */
export async function POST(req: Request) {
    const supabase = createServerSupabase()

    try {
        const body = await req.json()
        const { action } = body

        if (action === 'fetch-questions') {
            const { groupIds } = body
            if (!groupIds || groupIds.length === 0) return apiSuccess({ questions: [] })

            const { data: questions } = await supabase
                .from('evaluation_items')
                .select('id, question_text, description, allow_na, order_index, group_id')
                .in('group_id', groupIds)

            return apiSuccess({ questions: questions || [] })
        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Teacher Subjects POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
