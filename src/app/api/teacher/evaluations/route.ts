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
        const subjectId = searchParams.get('subjectId') || ''
        const selectedTrainingYear = searchParams.get('selectedTrainingYear') || ''
        const search = (searchParams.get('search') || '').trim()
        const batch = searchParams.get('batch') || 'all'
        const sortField = searchParams.get('sortField') || 'site_name'
        const sortOrder = searchParams.get('sortOrder') || 'asc'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')

        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

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

        // 2. ดึง Teacher
        const { data: user } = await supabase
            .from('supervisors')
            .select('id')
            .eq('user_id', authUser.id)
            .single()
        if (!user) return apiError('Teacher not found', 404)

        // 3. ดึง Subjects ที่รับผิดชอบ
        const { data: subData } = await supabase
            .from('supervisor_subjects')
            .select('subject_id, subjects(name, id)')
            .eq('supervisor_id', user.id)

        const subjects = subData || []
        const effectiveSubjectId = subjectId || (subjects.length > 0 ? subjects[0].subject_id : '')
        const mySubjectIds = subjects.map((s: any) => s.subject_id)

        // --- STEP 1: หารายชื่อนักศึกษาที่ผ่าน Filter ---
        let uniqueStudentIds: string[] = []

        if (search) {
            // 1. ค้นหาจากชื่อ/รหัสนักศึกษา
            const { data: matchedStudents } = await supabase
                .from('students')
                .select('id')
                .eq('training_year', defaultYear)
                .or(`student_code.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
            const studentIdsFromSearch = matchedStudents?.map(s => s.id) || []

            // 2. ค้นหาจากสถานที่ฝึก หรือ จังหวัด
            const { data: matchedSites } = await supabase
                .from('training_sites')
                .select('id')
                .or(`site_name.ilike.%${search}%,province.ilike.%${search}%`)
            const siteIdsFromSearch = matchedSites?.map(s => s.id) || []

            // 3. กรองใน student_assignments สำหรับวิชาที่ครูรับผิดชอบ
            let memberQuery = supabase
                .from('student_assignments')
                .select('student_id, students!inner(training_year)')
                .in('subject_id', effectiveSubjectId ? [effectiveSubjectId] : mySubjectIds)
                .eq('students.training_year', defaultYear)

            if (batch !== 'all') {
                memberQuery = memberQuery.ilike('students.student_code', `${batch}%`)
            }

            const orConditions = []
            if (studentIdsFromSearch.length > 0) orConditions.push(`student_id.in.(${studentIdsFromSearch.join(',')})`)
            if (siteIdsFromSearch.length > 0) orConditions.push(`site_id.in.(${siteIdsFromSearch.join(',')})`)

            if (orConditions.length > 0) {
                memberQuery = memberQuery.or(orConditions.join(','))
            } else {
                memberQuery = memberQuery.eq('student_id', '00000000-0000-0000-0000-000000000000')
            }

            const { data: members } = await memberQuery
            uniqueStudentIds = [...new Set((members || []).map(m => m.student_id))]
        } else {
            let memberQuery = supabase
                .from('student_assignments')
                .select('student_id, students!inner(training_year)')
                .in('subject_id', effectiveSubjectId ? [effectiveSubjectId] : mySubjectIds)
                .eq('students.training_year', defaultYear)

            if (batch !== 'all') {
                memberQuery = memberQuery.ilike('students.student_code', `${batch}%`)
            }

            const { data: members } = await memberQuery
            uniqueStudentIds = [...new Set((members || []).map(m => m.student_id))]
        }

        const totalCount = uniqueStudentIds.length

        // Fetch all student codes for this subject+year to derive batch options (pre-pagination)
        const { data: allMemberCodes } = await supabase
            .from('student_assignments')
            .select('students!inner(student_code)')
            .eq('subject_id', effectiveSubjectId)
            .eq('students.training_year', defaultYear)

        const batchCodes = Array.from(new Set(
            (allMemberCodes || []).map((m: any) => (m.students?.student_code || '').substring(0, 2)).filter(Boolean)
        )).sort()


        if (totalCount === 0) {
            return apiSuccess({
                subjects,
                data: [],
                totalCount,
                batchCodes,
                defaultYear,
                trainingYearOptions,
                effectiveSubjectId
            })
        }

        // 4. ดึง Assignments + Evaluations + Supervisors เฉพาะชุดที่ผ่านการกรอง
        let dataQuery = supabase.from('student_assignments').select(`
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
        `).in('student_id', uniqueStudentIds)

        if (effectiveSubjectId) dataQuery = dataQuery.eq('subject_id', effectiveSubjectId)
        else dataQuery = dataQuery.in('subject_id', mySubjectIds)


        const { data: res } = await dataQuery

        // Grouping logic
        const PRIORITY_MAP: { [key: string]: number } = { "บุคลิก": 1, "ประสบการณ์": 2, "ฝึก": 2, "เล่ม": 3, "รายงาน": 3 }
        const getPriority = (title: string) => { for (const key in PRIORITY_MAP) { if (title.includes(key)) return PRIORITY_MAP[key]; } return 99; }
        const getTag = (title: string) => { const match = title.match(/\((.*?)\)/); return match ? match[1].trim() : ""; }
        const sortEvaluations = (a: any, b: any) => {
            const tagA = getTag(a.title || ""); const tagB = getTag(b.title || "");
            if (tagA !== tagB) return tagA.localeCompare(tagB, 'th');
            return getPriority(a.title || "") - getPriority(b.title || "");
        }

        const groupedStudents: { [studentId: string]: any } = {}
        const yearFiltered = res || []

        yearFiltered.forEach((item: any) => {
            const studentId = item.students?.id
            if (!studentId) return

            let matchesSearch = false
            if (search) {
                const s = search.toLowerCase()
                const matchesStudent = item.students?.first_name?.toLowerCase().includes(s) ||
                    item.students?.last_name?.toLowerCase().includes(s) ||
                    item.students?.student_code?.toLowerCase().includes(s)
                const matchesSite = item.training_sites?.site_name?.toLowerCase().includes(s) ||
                    item.training_sites?.province?.toLowerCase().includes(s)
                matchesSearch = matchesStudent || matchesSite
            }

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

            if (matchesSearch || !groupedStudents[studentId].placeMatchesSearch) {
                groupedStudents[studentId].place = item.training_sites
                groupedStudents[studentId].placeMatchesSearch = matchesSearch
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

            const supervisorsWithData = (item.allSupervisors || []).filter((sv: any) => sv !== null)
            let evalStatus: 'done' | 'partial' | 'pending' = 'pending'
            if (supervisorsWithData.length > 0) {
                const allDone = supervisorsWithData.every((sv: any) => Number(sv.evaluation_status) === 2)
                const someDone = supervisorsWithData.some((sv: any) => Number(sv.evaluation_status) >= 1)
                if (allDone) evalStatus = 'done'
                else if (someDone) evalStatus = 'partial'
            }

            const totalNetScore = evaluations.reduce((acc: number, ev: any) => {
                const max = (ev.answers?.length || 8) * 5
                return acc + (ev.rawScore / max * (ev.weight * 100))
            }, 0).toFixed(2)

            return { student: item.student, place: item.place, subjectName: displaySubjectName, evaluations, supervisorEvaluations, mentorCount, evalStatus, totalNetScore, totalSupervisors: supervisorsWithData.length, doneSupervisors: supervisorsWithData.filter((sv: any) => Number(sv.evaluation_status) === 2).length }
        })

        // 5. Global Sorting
        processed.sort((a, b) => {
            let valA: any, valB: any;
            if (sortField === 'student') {
                valA = `${a.student.first_name} ${a.student.last_name}`;
                valB = `${b.student.first_name} ${b.student.last_name}`;
            } else if (sortField === 'score') {
                valA = parseFloat(a.totalNetScore);
                valB = parseFloat(b.totalNetScore);
            } else {
                valA = a.place?.site_name || '';
                valB = b.place?.site_name || '';
            }
            if (sortOrder === 'asc') return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });

        const paginatedData = processed.slice(from, to + 1)

        return apiSuccess({
            subjects,
            data: paginatedData,
            totalCount: totalCount || 0,
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
    const supabase = await createServerSupabase() // Added await

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.app_metadata?.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

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
