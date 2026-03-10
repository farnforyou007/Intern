import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { searchParams } = new URL(req.url)
        const subjectId = searchParams.get('subjectId')
        const trainingYear = searchParams.get('trainingYear')
        const search = searchParams.get('search') || ''
        const batch = searchParams.get('batch') || ''
        const sortField = searchParams.get('sortField') || 'name'
        const sortOrder = searchParams.get('sortOrder') || 'asc'
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')

        const from = (page - 1) * limit
        const to = from + limit - 1

        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser || authUser.app_metadata.provider !== 'line') {
            return apiError('Unauthorized', 401)
        }

        // Verify supervisor and get their site/subjects
        const { data: sv } = await supabase
            .from('supervisors')
            .select('id, site_id')
            .eq('user_id', authUser.id)
            .single()

        if (!sv) return apiError('Unauthorized', 401)

        // Get active training year if not provided
        let defaultYear = trainingYear
        if (!defaultYear) {
            const { data: config } = await supabase
                .from('system_configs')
                .select('key_value')
                .eq('key_name', 'current_training_year')
                .single()
            defaultYear = config?.key_value || ''
        }

        // Get training year options
        const { data: yearsData } = await supabase
            .from('students')
            .select('training_year')
            .not('training_year', 'is', null)
        const trainingYearOptions = Array.from(new Set(yearsData?.map(y => y.training_year))).sort((a: any, b: any) => b.localeCompare(a))

        // Get subjects for this teacher
        const { data: subjects } = await supabase
            .from('supervisor_subjects')
            .select('subject_id, subjects(name)')
            .eq('supervisor_id', sv.id)

        const effectiveSubjectId = subjectId || subjects?.[0]?.subject_id

        if (!effectiveSubjectId) {
            return apiSuccess({
                subjects: subjects || [],
                data: [],
                totalCount: 0,
                trainingYearOptions,
                defaultYear
            })
        }

        // 1. Search Logic
        let uniqueStudentIds: number[] = []
        let memberQuery = supabase
            .from('student_assignments')
            .select('student_id, students!inner(student_code, first_name, last_name, training_year)')
            .eq('subject_id', effectiveSubjectId)
            .eq('students.training_year', defaultYear)

        if (batch && batch !== 'all') {
            memberQuery = memberQuery.like('students.student_code', `${batch}%`)
        }

        if (search) {
            // Precise search logic matching Admin version
            const { data: matchedSites } = await supabase.from('training_sites').select('id').ilike('site_name', `%${search}%`)
            const siteIds = matchedSites?.map(s => s.id) || []

            const searchConditions = [
                `students.student_code.ilike.%${search}%`,
                `students.first_name.ilike.%${search}%`,
                `students.last_name.ilike.%${search}%`
            ]
            if (siteIds.length > 0) searchConditions.push(`site_id.in.(${siteIds.join(',')})`)
            memberQuery = memberQuery.or(searchConditions.join(','))
        }

        const { data: members } = await memberQuery
        uniqueStudentIds = [...new Set((members || []).map(m => m.student_id))]

        const totalCount = uniqueStudentIds.length

        // Derive batch codes from all matches
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
                subjects: subjects || [],
                data: [],
                totalCount: 0,
                batchCodes,
                trainingYearOptions,
                defaultYear,
                effectiveSubjectId
            })
        }

        // 2. Fetch Assignments + Evaluations
        const { data: assignments, error } = await supabase
            .from('student_assignments')
            .select(`
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
            .in('student_id', uniqueStudentIds)
            .eq('subject_id', effectiveSubjectId)

        if (error) throw error

        // 3. Process & Group for "Net Score" consistency
        let processedData = (assignments as any[] || []).map(as => {
            const evals = as.evaluation_logs || []
            const avgScore = evals.length > 0
                ? evals.reduce((sum: number, e: any) => sum + (e.total_score || 0), 0) / evals.length
                : 0

            const totalSvs = as.assignment_supervisors?.length || 0
            const doneSvs = as.assignment_supervisors?.filter((s: any) => s.is_evaluated).length || 0

            const student = as.students || {}
            return {
                id: as.id,
                studentId: student.id,
                studentName: `${student.first_name} ${student.last_name}`,
                studentCode: student.student_code,
                avatarUrl: student.avatar_url,
                subjectId: as.subjects?.id,
                subjectName: as.subjects?.name,
                subSubjectName: as.sub_subjects?.name,
                siteName: as.training_sites?.site_name,
                province: as.training_sites?.province,
                evalStatus: doneSvs === 0 ? 'pending' : (doneSvs < totalSvs ? 'partial' : 'done'),
                totalScore: avgScore,
                doneSupervisors: doneSvs,
                totalSupervisors: totalSvs,
                assignmentSupervisors: as.assignment_supervisors,
                evaluationLogs: evals
            }
        })

        // 4. Global Sorting
        processedData.sort((a, b) => {
            let valA: any = a[sortField as keyof typeof a]
            let valB: any = b[sortField as keyof typeof b]

            if (sortField === 'name') {
                valA = a.studentName
                valB = b.studentName
            } else if (sortField === 'hospital') {
                valA = a.siteName
                valB = b.siteName
            } else if (sortField === 'score') {
                valA = a.totalScore
                valB = b.totalScore
            }

            if (typeof valA === 'string') {
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
            }
            return sortOrder === 'asc' ? valA - valB : valB - valA
        })

        // 5. Pagination
        const pagedData = processedData.slice(from, to + 1)

        return apiSuccess({
            subjects: subjects || [],
            data: pagedData,
            totalCount,
            batchCodes,
            trainingYearOptions,
            defaultYear,
            effectiveSubjectId
        })

    } catch (error: any) {
        console.error('Teacher Subjects GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
