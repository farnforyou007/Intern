// src/app/api/admin/dashboard/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/admin/dashboard?year=2568
 * ดึงข้อมูล Dashboard ทั้งหมด: KPI stats, eval stats, recent activities, chart data
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.app_metadata.provider !== 'email') {
            return apiError('Unauthorized', 401)
        }

        const { searchParams } = new URL(req.url)
        let selectedYear = searchParams.get('year') || ''

        // 0. ถ้าไม่ได้ส่งปี → ดึง default จาก system_configs
        if (!selectedYear) {
            const { data: configData } = await supabase
                .from('system_configs')
                .select('key_value')
                .eq('key_name', 'current_training_year')
                .single()
            selectedYear = configData?.key_value || ''
        }

        // ดึง year options
        const { data: yearsData } = await supabase
            .from('students')
            .select('training_year')
            .not('training_year', 'is', null)
        const yearOptions = yearsData
            ? Array.from(new Set(yearsData.map((y: any) => y.training_year))).sort((a: string, b: string) => b.localeCompare(a))
            : []

        // ดึง student IDs ในปีที่เลือก
        let yearStudentIds: string[] | null = null
        if (selectedYear) {
            const { data: yearStudents } = await supabase
                .from('students')
                .select('id')
                .eq('training_year', selectedYear)
            yearStudentIds = (yearStudents || []).map((s: any) => String(s.id))
        }

        // 1. KPI Stats
        let studentCountQuery = supabase.from('students').select('*', { count: 'exact', head: true })
        if (selectedYear) studentCountQuery = studentCountQuery.eq('training_year', selectedYear)

        const [
            { count: studentCount },
            { count: siteCount },
            { count: svCount },
            { count: pendingSvCount },
            { count: subjectCount }
        ] = await Promise.all([
            studentCountQuery,
            supabase.from('training_sites').select('*', { count: 'exact', head: true }),
            supabase.from('supervisors').select('*', { count: 'exact', head: true }),
            supabase.from('supervisors').select('*', { count: 'exact', head: true }).eq('is_verified', false),
            supabase.from('subjects').select('*', { count: 'exact', head: true })
        ])

        const stats = {
            students: studentCount || 0,
            sites: siteCount || 0,
            supervisors: svCount || 0,
            pendingSupervisors: pendingSvCount || 0,
            subjects: subjectCount || 0
        }

        // 2. Evaluation Stats (with inner join year filter)
        let evalQuery = supabase
            .from('assignment_supervisors')
            .select(`
                evaluation_status,
                assignment_id,
                student_assignments!inner (
                    students!inner (training_year)
                )
            `)
        if (selectedYear) {
            evalQuery = evalQuery.eq('student_assignments.students.training_year', selectedYear)
        }
        const { data: evalData } = await evalQuery

        const completed = evalData?.filter(item => item.evaluation_status === 2).length || 0
        const inProgress = evalData?.filter(item => item.evaluation_status === 1).length || 0
        const pending = evalData?.filter(item => item.evaluation_status === 0).length || 0
        const evalTotal = evalData?.length || 0

        const evalStats = {
            total: evalTotal,
            completed,
            pending,
            inProgress,
            percent: evalTotal ? Math.round((completed / evalTotal) * 100) : 0
        }

        // 3. Recent Activities (latest 5 each)
        let studentsActivityQuery = supabase.from('students')
            .select('id, first_name, last_name, created_at')
            .order('created_at', { ascending: false }).limit(5)
        if (selectedYear) studentsActivityQuery = studentsActivityQuery.eq('training_year', selectedYear)

        const [newSupervisors, newSites, newStudents] = await Promise.all([
            supabase.from('supervisors').select('id, full_name, created_at, is_verified').order('created_at', { ascending: false }).limit(5),
            supabase.from('training_sites').select('id, site_name, created_at').order('created_at', { ascending: false }).limit(5),
            studentsActivityQuery
        ])

        const activities = {
            supervisors: (newSupervisors.data || []).map((item: any) => ({
                id: `sv-${item.id}`,
                type: 'supervisor',
                name: item.full_name,
                is_verified: item.is_verified,
                created_at: item.created_at
            })),
            sites: (newSites.data || []).map((item: any) => ({
                id: `st-${item.id}`,
                type: 'site',
                name: item.site_name,
                created_at: item.created_at
            })),
            students: (newStudents.data || []).map((item: any) => ({
                id: `std-${item.id}`,
                type: 'student',
                name: `${item.first_name} ${item.last_name}`,
                created_at: item.created_at
            }))
        }

        // 4. Chart Data — subjects + sub_subjects + assignments
        const [subjectsRes, subSubjectsRes] = await Promise.all([
            supabase.from('subjects').select('id, name'),
            supabase.from('sub_subjects').select('id, name, parent_subject_id')
        ])

        const subjectsList = subjectsRes.data || []
        const subSubjectsList = subSubjectsRes.data || []

        let assignmentQuery = supabase
            .from('assignment_supervisors')
            .select(`
                is_evaluated,
                evaluation_status,
                assignment_id,
                student_assignments!inner (
                    subject_id,
                    sub_subject_id,
                    student_id,
                    students!inner(training_year)
                )
            `)
        if (selectedYear) {
            assignmentQuery = assignmentQuery.eq('student_assignments.students.training_year', selectedYear)
        }
        const { data: assignments } = await assignmentQuery

        let chartData = { main: [] as any[], sub: [] as any[] }
        let summaryData: any[] = []
        let subjectRatioData: any[] = []

        if (assignments) {
            const mainMap: any = {}
            subjectsList.forEach(s => {
                mainMap[s.id] = { name: s.name, completed: 0, inProgress: 0, pending: 0, total: 0 }
            })

            const subMap: any = {}
            subSubjectsList.forEach(ss => {
                subMap[ss.id] = { name: ss.name, completed: 0, inProgress: 0, pending: 0, total: 0 }
            })

            const ratioMap: any = {}

            assignments.forEach((item: any) => {
                const sa = item.student_assignments

                let effectiveMainId = sa?.subject_id
                if (!effectiveMainId && sa?.sub_subject_id) {
                    effectiveMainId = subSubjectsList.find(ss => ss.id === sa.sub_subject_id)?.parent_subject_id
                }

                const subjectName = subjectsList.find(s => s.id === effectiveMainId)?.name || 'อื่นๆ'
                ratioMap[subjectName] = (ratioMap[subjectName] || 0) + 1

                if (effectiveMainId && mainMap[effectiveMainId]) {
                    mainMap[effectiveMainId].total += 1
                    if (item.evaluation_status === 2) mainMap[effectiveMainId].completed += 1
                    else if (item.evaluation_status === 1) mainMap[effectiveMainId].inProgress += 1
                    else mainMap[effectiveMainId].pending += 1
                }

                if (sa?.sub_subject_id && subMap[sa.sub_subject_id]) {
                    subMap[sa.sub_subject_id].total += 1
                    if (item.evaluation_status === 2) subMap[sa.sub_subject_id].completed += 1
                    else if (item.evaluation_status === 1) subMap[sa.sub_subject_id].inProgress += 1
                    else subMap[sa.sub_subject_id].pending += 1
                }
            })

            chartData = {
                main: Object.values(mainMap).sort((a: any, b: any) => b.total - a.total).map((m: any) => ({ ...m, name: `${m.name} (${m.total} รายการ)` })),
                sub: Object.values(subMap).filter((s: any) => s.total > 0).sort((a: any, b: any) => b.total - a.total).map((s: any) => ({ ...s, name: `${s.name} (${s.total} รายการ)` }))
            }

            const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#ec4899']
            const totalInChart = Object.values(ratioMap).reduce((a: any, b: any) => a + b, 0) as number
            subjectRatioData = Object.entries(ratioMap).map(([name, value], index) => ({
                name, value, totalInChart,
                color: colors[index % colors.length]
            }))

            summaryData = [
                { name: 'ประเมินแล้ว', value: completed, color: '#10b981' },
                { name: 'ประเมินแล้วบางส่วน', value: inProgress, color: '#f59e0b' },
                { name: 'ยังไม่ประเมิน', value: pending, color: '#ef4444' }
            ]
        }

        return apiSuccess({
            stats,
            evalStats,
            activities,
            chartData,
            summaryData,
            subjectRatioData,
            selectedYear,
            yearOptions
        })
    } catch (error: any) {
        console.error('Admin Dashboard API Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}
