// src/app/api/admin/evaluations/route.ts
// Admin version: ดึงผลประเมินทุกวิชา (ไม่ต้อง filter ตาม lineUserId)
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/admin/evaluations?subjectId=yyy&selectedTrainingYear=zzz
 * ดึงข้อมูลผลการประเมินทุกรายวิชา (สำหรับ Admin)
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.app_metadata.provider !== 'email') {
            return apiError('Unauthorized', 401)
        }

        const { searchParams } = new URL(req.url)
        const subjectId = searchParams.get('subjectId') || ''
        const selectedTrainingYear = searchParams.get('selectedTrainingYear') || ''
        const search = (searchParams.get('search') || '').trim()
        const batch = searchParams.get('batch') || 'all'
        const sortField = searchParams.get('sortField') || 'site_name' // 'student', 'site_name', 'score'
        const sortOrder = searchParams.get('sortOrder') || 'asc'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')

        const from = (page - 1) * limit
        const to = from + limit - 1

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

        // 2. ดึงทุกรายวิชา (Admin เห็นทั้งหมด)
        const { data: allSubjects } = await supabase
            .from('subjects')
            .select('id, name')
            .order('name')

        const subjects = (allSubjects || []).map((s: any) => ({
            subject_id: s.id,
            subjects: { id: s.id, name: s.name }
        }))

        // ถ้าไม่มี subjectId ให้ default เป็นวิชาแรก
        const effectiveSubjectId = subjectId || (subjects.length > 0 ? subjects[0].subject_id : '')

        // --- STEP 1: หารายชื่อนักศึกษาที่ผ่าน Filter ---
        // ใช้การกรองแบบ Explicit เพื่อความแม่นยำสูงสุด
        let uniqueStudentIds: string[] = []

        if (search) {
            // 1. ค้นหาจากชื่อ/รหัสนักศึกษา และปีการศึกษา
            const { data: matchedStudents, error: studentSearchError } = await supabase
                .from('students')
                .select('id')
                .eq('training_year', defaultYear)
                .or(`student_code.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
            if (studentSearchError) {
                console.error('Student Search Error:', studentSearchError);
                return apiError(studentSearchError.message, 500);
            }
            const studentIdsFromSearch = matchedStudents?.map(s => s.id) || []
            console.log(`[Eval API] Search: "${search}" - Matched Students: ${studentIdsFromSearch.length}`);


            // 2. ค้นหาจากสถานที่ฝึก หรือ จังหวัด
            const { data: matchedSites, error: siteSearchError } = await supabase
                .from('training_sites')
                .select('id')
                .or(`site_name.ilike.%${search}%,province.ilike.%${search}%`)
            if (siteSearchError) {
                console.error('Site Search Error:', siteSearchError);
                return apiError(siteSearchError.message, 500);
            }
            const siteIdsFromSearch = matchedSites?.map(s => s.id) || []
            console.log(`[Eval API] Search: "${search}" - Matched Sites: ${siteIdsFromSearch.length}`);


            // 3. กรองรวมใน student_assignments สำหรับรายวิชาที่เลือก
            let memberQuery = supabase
                .from('student_assignments')
                .select('student_id, students!inner(training_year)')
                .eq('subject_id', effectiveSubjectId)
                .eq('students.training_year', defaultYear)

            if (batch !== 'all') {
                memberQuery = memberQuery.ilike('students.student_code', `${batch}%`)
            }

            // ใช้ OR สำหรับ (รหัสนักศึกษาตรง OR สถานที่ฝึกตรง)
            const orConditions = []
            if (studentIdsFromSearch.length > 0) orConditions.push(`student_id.in.(${studentIdsFromSearch.join(',')})`)
            if (siteIdsFromSearch.length > 0) orConditions.push(`site_id.in.(${siteIdsFromSearch.join(',')})`)

            if (orConditions.length > 0) {
                memberQuery = memberQuery.or(orConditions.join(','))
            } else {
                // ถ้าไม่เจอทั้งนักศึกษาและสถานที่ฝึกเลย ก็ให้ว่างไปเลย
                // ใช้ UUID ที่ไม่น่าจะมีอยู่จริง เพื่อให้ได้ผลลัพธ์เป็น 0
                memberQuery = memberQuery.eq('student_id', '00000000-0000-0000-0000-000000000000')
            }

            const { data: members, error: memberQueryError } = await memberQuery
            if (memberQueryError) {
                console.error('Member Query Error (with search):', memberQueryError);
                return apiError(memberQueryError.message, 500);
            }
            uniqueStudentIds = [...new Set((members || []).map(m => m.student_id))]
        } else {
            // กรณีไม่มีคำค้นหา ให้ใช้ Subject + Year + Batch พื้นฐาน
            let memberQuery = supabase
                .from('student_assignments')
                .select('student_id, students!inner(training_year)')
                .eq('subject_id', effectiveSubjectId)
                .eq('students.training_year', defaultYear)

            if (batch !== 'all') {
                memberQuery = memberQuery.ilike('students.student_code', `${batch}%`)
            }

            const { data: members, error: memberQueryError } = await memberQuery
            if (memberQueryError) {
                console.error('Member Query Error (no search):', memberQueryError);
                return apiError(memberQueryError.message, 500);
            }
            uniqueStudentIds = [...new Set((members || []).map(m => m.student_id))]
        }

        const totalCount = uniqueStudentIds.length
        if (search) {
            console.log(`[Eval API] Search: "${search}", Found: ${totalCount} unique students`);
        }


        if (totalCount === 0) {

            return apiSuccess({
                subjects,
                data: [],
                totalCount: 0,
                defaultYear,
                trainingYearOptions,
                effectiveSubjectId
            })
        }

        // 3. ดึง Assignments + Evaluations + Supervisors เฉพาะชุดที่ผ่านการกรอง
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

        const { data: res, error: dataError } = await dataQuery
        if (dataError) {
            console.error('Data Query Error:', dataError)
            return apiError(dataError.message, 500)
        }

        // 4. Grouping & การเลือก Assignment ที่เหมาะสมมาแสดง
        // ถ้ามีการค้นหา เราควรเลือก Assignment ที่ตรงกับคำค้นหามาเป็นตัวหลัก
        const groupedStudents: { [studentId: string]: any } = {}
        res.forEach((item: any) => {
            const studentId = item.students?.id
            if (!studentId) return

            // ตรวจสอบว่า Assignment นี้ตรงกับเงื่อนไขการค้นหาหรือไม่
            let matchesSearch = false
            if (search) {
                const s = search.toLowerCase()
                const matchesStudent =
                    item.students?.first_name?.toLowerCase().includes(s) ||
                    item.students?.last_name?.toLowerCase().includes(s) ||
                    item.students?.student_code?.toLowerCase().includes(s)
                const matchesSite =
                    item.training_sites?.site_name?.toLowerCase().includes(s) ||
                    item.training_sites?.province?.toLowerCase().includes(s)
                matchesSearch = matchesStudent || matchesSite
            }

            if (!groupedStudents[studentId]) {
                groupedStudents[studentId] = {
                    student: item.students,
                    place: item.training_sites, // default
                    subjectName: item.subjects?.name || 'ไม่ระบุวิชา',
                    subSubjects: new Set<string>(),
                    allLogs: [],
                    allSupervisors: [] as any[]
                }
            }

            // ถ้า Assignment นี้ "ตรง" กับที่ค้นหามากกว่า ให้ใช้ Site นี้เป็น Site หลักที่แสดงในตาราง
            // หรือถ้ายังไม่มี place ที่ตรงกับ search เลย ก็ใช้อันนี้
            if (matchesSearch || !groupedStudents[studentId].placeMatchesSearch) {
                groupedStudents[studentId].place = item.training_sites
                groupedStudents[studentId].placeMatchesSearch = matchesSearch // Mark if this student's place now matches search
            }

            if (item.sub_subjects?.name) groupedStudents[studentId].subSubjects.add(item.sub_subjects.name)
            if (item.evaluation_logs?.length > 0) groupedStudents[studentId].allLogs.push(...item.evaluation_logs)
            if (item.assignment_supervisors?.length > 0) groupedStudents[studentId].allSupervisors.push(...item.assignment_supervisors)
        })

        // Grouping logic
        const PRIORITY_MAP: { [key: string]: number } = { "บุคลิก": 1, "ประสบการณ์": 2, "ฝึก": 2, "เล่ม": 3, "รายงาน": 3 }
        const getPriority = (title: string) => { for (const key in PRIORITY_MAP) { if (title.includes(key)) return PRIORITY_MAP[key]; } return 99; }
        const getTag = (title: string) => { const match = title.match(/\((.*?)\)/); return match ? match[1].trim() : ""; }
        const sortEvaluations = (a: any, b: any) => {
            const tagA = getTag(a.title || ""); const tagB = getTag(b.title || "");
            if (tagA !== tagB) return tagA.localeCompare(tagB, 'th');
            return getPriority(a.title || "") - getPriority(b.title || "");
        }

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
                // site_name
                valA = a.place?.site_name || '';
                valB = b.place?.site_name || '';
            }

            if (sortOrder === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });

        // 6. Pagination Slicing
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
        console.error('Admin Evaluations GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

/**
 * POST /api/admin/evaluations
 * Actions: fetch-questions (for detail modal)
 */
export async function POST(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.app_metadata.provider !== 'email') {
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
        console.error('Admin Evaluations POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
