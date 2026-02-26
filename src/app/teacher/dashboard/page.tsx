// ver7 — Desktop Dashboard with Analytics (กราฟ + KPI จาก analytics รวมอยู่ที่นี่)
"use client"
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    Users, CheckCircle, AlertCircle, TrendingUp, TrendingDown,
    GraduationCap, User, LayoutDashboard, Award, MapPin,
    CalendarDays, ChevronDown, Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts'
import liff from '@line/liff'
import { getLineUserId } from '@/utils/auth';
const COLORS_EVAL = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899']

export default function TeacherDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [teacherData, setTeacherData] = useState<any>(null)
    const [subjects, setSubjects] = useState<any[]>([])
    const [allAssignments, setAllAssignments] = useState<any[]>([])
    const [evaluationData, setEvaluationData] = useState<any[]>([])
    const [kpi, setKpi] = useState({ total: 0, evaluated: 0, pending: 0, percent: 0 })
    const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all')
    const [hasDoubleRole, setHasDoubleRole] = useState(false)
    const [analyticsData, setAnalyticsData] = useState<any[]>([])
    // 🔒 Year & Batch filter
    const [selectedYear, setSelectedYear] = useState<string>('')
    const [yearOptions, setYearOptions] = useState<string[]>([])
    const [selectedBatch, setSelectedBatch] = useState<string>('all')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchDashboardData()
        const channel = supabase
            .channel('evaluation_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assignment_supervisors' }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluation_logs' }, () => fetchDashboardData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluation_answers' }, () => fetchDashboardData())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [selectedYear])

    const calculateKPI = (assignments: any[], subjectId: string) => {
        const filtered = subjectId === 'all' ? assignments : assignments.filter(a => a.subject_id === subjectId)
        const total = filtered.length
        const evaluated = filtered.filter((a: any) => a.assignment_supervisors?.some((sv: any) => sv.is_evaluated === true)).length
        const pending = total - evaluated
        const percent = total > 0 ? Math.round((evaluated / total) * 100) : 0
        setKpi({ total, evaluated, pending, percent })
    }

    const fetchDashboardData = async () => {
        setLoading(true)
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const lineUserId = await getLineUserId(urlParams);

            if (!lineUserId) return;

            // 🔒 ดึงปีการศึกษา default + options
            if (!selectedYear) {
                const { data: configData } = await supabase
                    .from('system_configs')
                    .select('key_value')
                    .eq('key_name', 'current_training_year')
                    .single();
                if (configData?.key_value) setSelectedYear(configData.key_value);
            }
            const { data: yearsData } = await supabase
                .from('students')
                .select('training_year')
                .not('training_year', 'is', null);
            if (yearsData) {
                const unique = Array.from(new Set(yearsData.map((y: any) => y.training_year))).sort((a: string, b: string) => b.localeCompare(a));
                setYearOptions(unique as string[]);
            }

            // 🔒 ดึง student IDs ในปีที่เลือก
            let yearStudentIds: Set<string> | null = null;
            if (selectedYear) {
                const { data: yearStudents } = await supabase
                    .from('students')
                    .select('id, student_code')
                    .eq('training_year', selectedYear);
                yearStudentIds = new Set((yearStudents || []).map((s: any) => String(s.id)));
            }
            // console.log("User Profile:", profile); // เช็คค่าได้ตรงนี้
            const { data: user } = await supabase
                .from('supervisors')
                .select('id, full_name, avatar_url, role, supervisor_subjects(id)')
                .eq('line_user_id', lineUserId)
                .single()

            if (user) {
                setTeacherData(user)
                setHasDoubleRole(user.role === 'supervisor' || user.role === 'both')

                const { data: subData } = await supabase
                    .from('supervisor_subjects')
                    .select('subject_id, subjects(name, id)')
                    .eq('supervisor_id', user.id)

                const subjectList = subData || []
                setSubjects(subjectList)

                const subjectIds = subjectList.map((s: any) => s.subject_id)
                if (subjectIds.length > 0) {
                    // ตั้งค่าเริ่มต้นให้เป็นวิชาแรก เมื่อยังไม่มีวิชาที่เลือก
                    const firstSubjectId = subjectList[0].subject_id
                    if (selectedSubject === 'all') {
                        setSelectedSubject(firstSubjectId)
                    }

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

                    // 🔒 กรองเฉพาะ student ในปีที่เลือก
                    const assignments = yearStudentIds
                        ? (rawAssignments || []).filter((a: any) => yearStudentIds!.has(String(a.student_id)))
                        : rawAssignments

                    if (assignments) {
                        setAllAssignments(assignments)

                        // ใช้วิชาปัจจุบัน (หรือวิชาแรก ถ้าเพิ่งเข้าใหม่) ในการคำนวณ KPI
                        const activeSubjectId = selectedSubject === 'all' ? subjectList[0].subject_id : selectedSubject
                        calculateKPI(assignments, activeSubjectId)

                        // Fetch evaluation logs for summary
                        /* The above code is attempting to extract the `id` values from an array of `assignments` using the `map` method and store them in the `assignmentIds` array. However, the code is currently commented out after extracting the `assignmentIds`. It seems like the intention was to then check if the `assignmentIds` array has a length greater than 0, and if so, fetch evaluation logs data from a database using Supabase based on the `assignment_id` values in the `assignmentIds` array. The fetched data includes the `assignment_id`, `score`, and ` */
                        // const assignmentIds = assignments.map(a => a.id)
                        // if (assignmentIds.length > 0) {
                        //     const { data: evalLogs } = await supabase
                        //         .from('evaluation_logs')
                        //         .select('assignment_id, score, max_score')
                        //         .in('assignment_id', assignmentIds)
                        //     setEvaluationData(evalLogs || [])
                        // }

                        // โหลดข้อมูลสำหรับกราฟ/KPI แบบ analytics (evaluation_groups, evaluation_answers)
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

                        // 🔒 กรองเฉพาะปี
                        const analyticsRes = yearStudentIds
                            ? (rawAnalyticsRes || []).filter((a: any) => yearStudentIds!.has(String(a.student_id)))
                            : rawAnalyticsRes

                        const processed = (analyticsRes || []).map((item: any) => {
                            const logs = item.evaluation_logs || []
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
                                id: item.id,
                                student: item.students,
                                place: item.training_sites,
                                subjectName: item.subjects?.name,
                                subject_id: item.subject_id,
                                evaluations,
                                mentorCount
                            }
                        })
                        setAnalyticsData(processed)
                    }
                }
            }
        } catch (error) {
            console.error("Dashboard error:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubjectChange = (id: string) => {
        setSelectedSubject(id)
        calculateKPI(allAssignments, id)
    }

    const filteredAssignmentsForSubject = selectedSubject === 'all'
        ? allAssignments
        : allAssignments.filter(a => a.subject_id === selectedSubject)

    // 🔒 Batch filter (client-side)
    const batchFilteredAssignments = selectedBatch === 'all'
        ? filteredAssignmentsForSubject
        : filteredAssignmentsForSubject.filter((a: any) => a.students?.student_code?.substring(0, 2) === selectedBatch)

    const batchOptions = Array.from(new Set(
        filteredAssignmentsForSubject.map((a: any) => a.students?.student_code?.substring(0, 2)).filter(Boolean)
    )).sort((a: string, b: string) => b.localeCompare(a))

    const uniqueStudents = [...new Set(batchFilteredAssignments.map(a => a.student_id))].length

    // สรุปสถานะการประเมิน (แบบฝั่งพี่เลี้ยง แต่มองภาพรวมรายวิชา)
    // const teacherStats = useMemo(() => {
    //     const filtered = selectedSubject === 'all' ? allAssignments : allAssignments.filter(a => a.subject_id === selectedSubject)
    //     const logsSet = new Set(evaluationData.map((e: any) => e.assignment_id))

    //     let evaluated = 0
    //     let partial = 0
    //     let pending = 0

    //     filtered.forEach((a: any) => {
    //         const svs = a.assignment_supervisors || []
    //         const allDone = svs.length > 0 && svs.every((sv: any) => sv.is_evaluated)
    //         const hasLog = logsSet.has(a.id)

    //         if (allDone) evaluated++
    //         else if (hasLog) partial++
    //         else pending++
    //     })

    //     return { total: filtered.length, evaluated, partial, pending }
    // }, [allAssignments, evaluationData, selectedSubject])

    // const teacherStats = useMemo(() => {
    //     const filtered = selectedSubject === 'all' ? allAssignments : allAssignments.filter(a => a.subject_id === selectedSubject)

    //     let evaluated = 0
    //     let partial = 0
    //     let pending = 0

    //     filtered.forEach((a: any) => {
    //         const svs = a.assignment_supervisors || []
    //         const allDone = svs.length > 0 && svs.every((sv: any) => sv.is_evaluated)

    //         // เช็คว่ามี log ในฐานข้อมูลหรือยัง (แสดงว่าเริ่มทำแล้วแต่ยังไม่ is_evaluated)
    //         const hasLog = a.evaluation_logs && a.evaluation_logs.length > 0

    //         if (allDone) {
    //             evaluated++
    //         } else if (hasLog) {
    //             partial++ // ตอนนี้ "ประเมินบางส่วน" จะดึงมาถูกต้องแล้ว
    //         } else {
    //             pending++
    //         }
    //     })

    //     return { total: filtered.length, evaluated, partial, pending }
    // }, [allAssignments, selectedSubject])

    const teacherStats = useMemo(() => {
        const filtered = selectedSubject === 'all' ? allAssignments : allAssignments.filter(a => a.subject_id === selectedSubject)

        let evaluated = 0; // ประเมินเสร็จสมบูรณ์ (กดบันทึกสรุปแล้ว) Status 2
        let partial = 0;   // เริ่มทำแล้ว มี Log แล้ว แต่ยังไม่กดบันทึกสรุป Status 1
        let waiting = 0;   // ยังไม่ได้เริ่มทำเลย (ไม่มี Log เลย) Status 0

        filtered.forEach((a: any) => {
            const svs = a.assignment_supervisors || []
            // const isDone = svs.length > 0 && svs.every((sv: any) => sv.is_evaluated)
            const isDone = svs.length > 0 && svs.every((sv: any) => sv.evaluation_status === 2)
            const isPartial = svs.length > 0 && svs.some((sv: any) => sv.evaluation_status === 1) && !isDone
            // เช็คผ่าน analyticsData หรือ evaluation_logs ที่เรา Join มา
            // const hasSomeLogs = a.evaluation_logs && a.evaluation_logs.length > 0

            // if (isDone) {
            //     evaluated++
            // } else if (hasSomeLogs) {
            //     partial++
            // } else {
            //     waiting++
            // }
            if (isDone) {
                evaluated++
            } else if (isPartial) {
                partial++
            } else {
                waiting++
            }
        })

        return { total: filtered.length, evaluated, partial, pending: waiting }
    }, [allAssignments, selectedSubject])

    // --- ข้อมูลสำหรับกราฟ/KPI จาก analytics ---
    const filteredAnalyticsData = useMemo(() => {
        if (selectedSubject === 'all') return analyticsData
        return analyticsData.filter(d => d.subject_id === selectedSubject)
    }, [analyticsData, selectedSubject])

    // const analyticsStudentScores = useMemo(() => {
    //     return filteredAnalyticsData.map((item: any) => {
    //         const net = item.evaluations.reduce((acc: number, ev: any) => {
    //             const itemCount = ev.answers?.length || 0
    //             let max = itemCount * 5
    //             if (max === 0) {
    //                 if (ev.title?.includes('บุคลิก')) max = 100
    //                 else max = 40
    //             }
    //             return acc + (ev.rawScore / max * (ev.weight * 100))
    //         }, 0)
    //         return { ...item, netScore: parseFloat(net.toFixed(2)) }
    //     }).sort((a: any, b: any) => b.netScore - a.netScore)
    // }, [filteredAnalyticsData])

    const analyticsStudentScores = useMemo(() => {
        return filteredAnalyticsData.map((item: any) => {
            // หาข้อมูลสถานะจาก allAssignments โดยใช้ ID ที่เราเพิ่งเพิ่มเข้าไป
            const assignmentInfo = allAssignments.find(a => a.id === item.id);
            const supervisors = assignmentInfo?.assignment_supervisors || [];
            const isFullyDone = supervisors.length > 0 && supervisors.every((sv: any) => sv.is_evaluated === true);

            const net = item.evaluations.reduce((acc: number, ev: any) => {
                const itemCount = ev.answers?.length || 0
                let max = itemCount * 5
                if (max === 0) {
                    if (ev.title?.includes('บุคลิก')) max = 100
                    else max = 40
                }
                return acc + (ev.rawScore / max * (ev.weight * 100))
            }, 0)

            return {
                ...item,
                netScore: parseFloat(net.toFixed(2)),
                isFullyDone // สถานะว่าเสร็จสมบูรณ์หรือยัง
            }
        }).sort((a: any, b: any) => b.netScore - a.netScore)
    }, [filteredAnalyticsData, allAssignments])



    // const analyticsKpi = useMemo(() => {
    //     if (analyticsStudentScores.length === 0) return { count: 0, avg: 0, max: 0, min: 0 }
    //     const scores = analyticsStudentScores.map((s: any) => s.netScore)
    //     const nonZero = scores.filter((s: number) => s > 0)
    //     return {
    //         count: scores.length,
    //         avg: parseFloat((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(2)),
    //         max: Math.max(...scores),
    //         min: nonZero.length > 0 ? Math.min(...nonZero) : 0
    //     }
    // }, [analyticsStudentScores])

    const finishedStudents = useMemo(() => {
        return analyticsStudentScores.filter(s => s.isFullyDone);
    }, [analyticsStudentScores]);

    // const analyticsKpi = useMemo(() => {
    //     if (analyticsStudentScores.length === 0) return { count: 0, avg: 0, max: 0, min: 0 };

    //     const allScores = analyticsStudentScores.map((s: any) => s.netScore);
    //     // กรองเอาเฉพาะคะแนนของคนที่ประเมินเสร็จแล้วมาหาค่า Min
    //     const finishedScores = analyticsStudentScores
    //         .filter((s: any) => s.isFullyDone)
    //         .map((s: any) => s.netScore);

    //     return {
    //         count: analyticsStudentScores.length, // จำนวนนักศึกษาทั้งหมด (ที่มีคะแนนบ้างแล้ว)
    //         avg: parseFloat((allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length).toFixed(2)),
    //         max: Math.max(...allScores),
    //         // ถ้ายังไม่มีใครเสร็จเลยให้เป็น 0 ถ้ามีคนเสร็จแล้วให้หาค่าต่ำสุดจากคนที่เสร็จ
    //         min: finishedScores.length > 0 ? Math.min(...finishedScores) : 0
    //     };
    // }, [analyticsStudentScores]);

    // const analyticsKpi = useMemo(() => {
    //     if (analyticsStudentScores.length === 0) return { count: 0, avg: 0, max: 0, min: 0 };

    //     const allScores = analyticsStudentScores.map(s => s.netScore);
    //     const finishedScores = finishedStudents.map(s => s.netScore);

    //     return {
    //         count: analyticsStudentScores.length,
    //         avg: parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)),
    //         max: allScores.length > 0 ? Math.max(...allScores) : 0,
    //         // *** ต่ำสุด: จะแสดงเฉพาะคนที่ประเมินเสร็จแล้วเท่านั้น ***
    //         min: finishedScores.length > 0 ? Math.min(...finishedScores) : 0
    //     };
    // }, [analyticsStudentScores, finishedStudents]);


    const analyticsKpi = useMemo(() => {
        // กรองเฉพาะคนที่ประเมินเสร็จสมบูรณ์ (isFullyDone)
        const finishedStudents = analyticsStudentScores.filter((s: any) => s.isFullyDone);
        const finishedScores = finishedStudents.map((s: any) => s.netScore);

        // ถ้ายังไม่มีใครประเมินเสร็จเลย
        if (finishedScores.length === 0) {
            return { count: 0, avg: 0, max: 0, min: 0 };
        }

        const sum = finishedScores.reduce((a, b) => a + b, 0);

        return {
            count: finishedScores.length, // เปลี่ยนเป็นจำนวนคนที่ประเมิน "เสร็จแล้ว"
            avg: parseFloat((sum / finishedScores.length).toFixed(2)),
            max: Math.max(...finishedScores),
            min: Math.min(...finishedScores)
        };
    }, [analyticsStudentScores]);

    const evalBarData = useMemo(() => {
        const groupMap: { [title: string]: { totalPercent: number; count: number } } = {}
        filteredAnalyticsData.forEach((item: any) => {
            item.evaluations.forEach((ev: any) => {
                if (!ev.title) return
                const itemCount = ev.answers?.length || 0
                let maxRawScore = itemCount * 5
                if (maxRawScore === 0) {
                    if (ev.title.includes('บุคลิก')) maxRawScore = 100
                    else if (ev.title.includes('ฝึกงาน')) maxRawScore = 40
                    else if (ev.title.includes('เล่ม')) maxRawScore = 40
                    else if (ev.title.includes('เภสัช')) maxRawScore = 40
                }
                if (maxRawScore > 0) {
                    const individualPercent = (ev.rawScore / maxRawScore) * 100
                    if (!groupMap[ev.title]) groupMap[ev.title] = { totalPercent: 0, count: 0 }
                    groupMap[ev.title].totalPercent += individualPercent
                    groupMap[ev.title].count += 1
                }
            })
        })
        return Object.entries(groupMap).map(([title, v]) => {
            const avgPercent = v.count > 0 ? v.totalPercent / v.count : 0
            const short = title.replace('แบบประเมิน', '').replace('การประเมิน', '').trim()
            return {
                name: short.length > 12 ? short.substring(0, 12) + '…' : short,
                fullName: title,
                avgPercent: parseFloat(avgPercent.toFixed(1))
            }
        })
    }, [filteredAnalyticsData])

    // const top5 = useMemo(() => analyticsStudentScores.slice(0, 5), [analyticsStudentScores])
    const top5 = useMemo(() => {
        return finishedStudents.slice(0, 5);
    }, [finishedStudents]);

    const siteStats = useMemo(() => {
        const map: { [site: string]: { province: string; scores: number[] } } = {}
        analyticsStudentScores.forEach((s: any) => {
            const site = s.place?.site_name || 'ไม่ระบุ'
            if (!map[site]) map[site] = { province: s.place?.province || '-', scores: [] }
            map[site].scores.push(s.netScore)
        })
        return Object.entries(map).map(([site, v]) => ({
            site,
            province: v.province,
            count: v.scores.length,
            avg: parseFloat((v.scores.reduce((a: number, b: number) => a + b, 0) / v.scores.length).toFixed(2))
        })).sort((a, b) => b.avg - a.avg)
    }, [analyticsStudentScores])

    const ChartTooltip = ({ active, payload, label }: any) => {
        if (active && payload?.length) {
            return (
                <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100">
                    <p className="font-black text-slate-800 text-sm mb-1">{payload[0]?.payload?.fullName || label}</p>
                    <p className="text-indigo-600 font-bold text-sm">{payload[0]?.value}%</p>
                </div>
            )
        }
        return null
    }

    if (loading) return (
        <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
            <div className="h-32 bg-white rounded-[2rem]" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-[2rem]" />)}
            </div>
            <div className="h-48 bg-white rounded-[2rem]" />
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 font-sans">
            {/* Admin-style Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <LayoutDashboard size={32} className="text-white" />
                        </div>
                        <span>TEACHER <span className="text-indigo-600">Dashboard</span></span>
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 ml-1 text-xs uppercase tracking-[0.2em]">ภาพรวม KPI สถิติ และข้อมูลอาจารย์</p>
                </div>
                {/* 🔒 Year & Batch Filter */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white px-4 h-12 rounded-xl border border-slate-200 shadow-sm">
                        <CalendarDays size={16} className="text-indigo-500" />
                        <select
                            value={selectedYear}
                            onChange={(e) => { setSelectedYear(e.target.value); setSelectedBatch('all'); }}
                            className="text-sm font-black text-indigo-600 bg-transparent outline-none cursor-pointer"
                        >
                            {yearOptions.map(year => (
                                <option key={year} value={year}>ปีการศึกษา {year}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-4 h-12 rounded-xl border border-slate-200 shadow-sm">
                        <Filter size={16} className="text-slate-400" />
                        <select
                            value={selectedBatch}
                            onChange={(e) => setSelectedBatch(e.target.value)}
                            className="text-sm font-black text-slate-600 bg-transparent outline-none cursor-pointer"
                        >
                            <option value="all">ทุกรุ่นรหัส</option>
                            {batchOptions.map((b: string) => (
                                <option key={b} value={b}>รหัส {b}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Profile Section */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 lg:p-8 rounded-[2rem] shadow-xl shadow-indigo-200/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 opacity-10 -mr-8 -mt-8">
                        <GraduationCap size={160} />
                    </div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 overflow-hidden flex items-center justify-center shrink-0">
                            {teacherData?.avatar_url
                                ? <img src={teacherData.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                                : <User size={28} className="text-white/60" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">อาจารย์ผู้รับผิดชอบรายวิชา</p>
                            <h1 className="text-2xl font-black text-white truncate">{teacherData?.full_name || '...'}</h1>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {subjects.map((s, i) => (
                                    <span key={i} className="text-[10px] font-black text-white/90 bg-white/15 px-2.5 py-1 rounded-lg border border-white/10">{s.subjects.name}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Subject Filter (เฉพาะรายวิชา ไม่รวมทุกวิชา) */}
                {subjects.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {subjects.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSubjectChange(s.subject_id)}
                                className={`px-5 py-2.5 rounded-2xl text-[11px] font-black border transition-all shrink-0 ${selectedSubject === s.subject_id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}
                            >
                                {s.subjects.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard label="นักศึกษาทั้งหมด" value={uniqueStudents} unit="คน" icon={<Users size={20} />} color="bg-indigo-50 text-indigo-600" />
                    <KPICard label="ประเมินครบ" value={teacherStats.evaluated} unit="รายการ" icon={<CheckCircle size={20} />} color="bg-emerald-50 text-emerald-600" />
                    <KPICard label="ประเมินแล้วบางส่วน" value={teacherStats.partial} unit="รายการ" icon={<AlertCircle size={20} />} color="bg-amber-50 text-amber-600" />
                    <KPICard label="ยังไม่ประเมิน" value={teacherStats.pending} unit="รายการ" icon={<AlertCircle size={20} />} color="bg-rose-50 text-rose-500" />
                </div>

                {/* Progress Summary by Subject */}
                <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">สรุปความคืบหน้ารายวิชา</h2>
                    <div className="space-y-5">
                        {(selectedSubject === 'all' ? subjects : subjects.filter(s => s.subject_id === selectedSubject)).map((s, i) => {
                            const subAssignments = allAssignments.filter(a => a.subject_id === s.subject_id)
                            const total = subAssignments.length
                            const done = subAssignments.filter((a: any) => a.assignment_supervisors?.some((sv: any) => sv.is_evaluated)).length
                            const pct = total > 0 ? Math.round((done / total) * 100) : 0
                            return (
                                <div key={i}>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-sm font-black text-slate-700">{s.subjects.name}</p>
                                        <span className="text-xs font-bold">
                                            <span className="text-indigo-600">{done}/{total}</span>
                                            <span className="text-slate-400 ml-1">({pct}%)</span>
                                        </span>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                        {subjects.length === 0 && (
                            <p className="text-center text-sm text-slate-400 py-8">ยังไม่มีรายวิชาในระบบ</p>
                        )}
                    </div>
                </div>

                {/* KPI จาก Analytics (คะแนนเชิงลึก) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-indigo-200 transition-all">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3"><Users size={18} className="text-indigo-600" /></div>
                        <p className="text-3xl font-black text-slate-800 leading-none">{analyticsKpi.count}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">นักศึกษา (ประเมินครบแล้ว)</p>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-cyan-200 transition-all">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-cyan-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                        <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center mx-auto mb-3"><TrendingUp size={18} className="text-cyan-600" /></div>
                        <p className="text-3xl font-black text-slate-800 leading-none">{analyticsKpi.avg}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">คะแนนเฉลี่ย</p>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-emerald-200 transition-all">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3"><Award size={18} className="text-emerald-600" /></div>
                        <p className="text-3xl font-black text-emerald-600 leading-none">{analyticsKpi.max}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">สูงสุด</p>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-rose-200 transition-all">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-rose-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-3"><TrendingDown size={18} className="text-rose-500" /></div>
                        <p className="text-3xl font-black text-rose-500 leading-none">{analyticsKpi.min}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">ต่ำสุด</p>
                    </div>
                </div>

                {/* Bar Chart: คะแนนเฉลี่ยรายแบบประเมิน */}
                <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 text-base mb-1">คะแนนเฉลี่ยรายแบบประเมิน</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Average Score by Evaluation Category (%)</p>
                    {evalBarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={evalBarData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip content={<ChartTooltip />} />
                                <Bar dataKey="avgPercent" radius={[12, 12, 0, 0]}>
                                    {evalBarData.map((_, i) => (
                                        <Cell key={i} fill={COLORS_EVAL[i % COLORS_EVAL.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-center text-slate-400 py-16 font-bold">ไม่มีข้อมูลประเมิน</p>
                    )}
                </div>

                {/* Radar Chart + Top 5 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-800 text-sm mb-1">สมรรถนะภาพรวม</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Competency Radar</p>
                        {evalBarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={evalBarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="คะแนนเฉลี่ย" dataKey="avgPercent" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                                    <Tooltip content={<ChartTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-slate-400 py-16 font-bold">ไม่มีข้อมูล</p>
                        )}
                    </div>
                    <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-800 text-sm mb-1">Top 5 คะแนนสูงสุด</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Highest Performers</p>
                        <div className="space-y-3">
                            {top5.map((s: any, i: number) => {
                                const percentage = analyticsKpi.max > 0 ? (s.netScore / analyticsKpi.max) * 100 : 0
                                return (
                                    <div key={i} className="group">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                                    {i + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-700 text-[13px] leading-none truncate">{s.student?.first_name} {s.student?.last_name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-0.5">{s.student?.student_code}</p>
                                                </div>
                                            </div>
                                            <span className="font-black text-indigo-600 text-base shrink-0 ml-2">{s.netScore}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, background: i === 0 ? '#f59e0b' : '#6366f1' }} />
                                        </div>
                                    </div>
                                )
                            })}
                            {top5.length === 0 && <p className="text-center text-slate-400 py-8 font-bold">ไม่มีข้อมูล</p>}
                        </div>
                    </div>
                </div>

                {/* สรุปรายสถานที่ฝึกงาน */}
                <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 text-base mb-1">สรุปรายสถานที่ฝึกงาน</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Performance by Training Site</p>
                    {siteStats.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-slate-100">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th className="p-4 text-left font-black text-xs uppercase">#</th>
                                        <th className="p-4 text-left font-black text-xs uppercase">สถานที่ฝึกงาน</th>
                                        <th className="p-4 text-center font-black text-xs uppercase">จังหวัด</th>
                                        <th className="p-4 text-center font-black text-xs uppercase">จำนวน นศ.</th>
                                        <th className="p-4 text-center font-black text-xs uppercase">คะแนนเฉลี่ย</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {siteStats.map((s: any, i: number) => (
                                        <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                            <td className="p-4 font-black text-slate-300">{i + 1}</td>
                                            <td className="p-4 font-bold text-slate-700 flex items-center gap-2"><MapPin size={14} className="text-slate-300 shrink-0" /><span className="truncate">{s.site}</span></td>
                                            <td className="p-4 text-center font-bold text-slate-500">{s.province}</td>
                                            <td className="p-4 text-center whitespace-nowrap">
                                                <span className="bg-indigo-50 text-indigo-600 font-black text-xs px-2.5 py-1 rounded-lg">{s.count} คน</span>
                                            </td>
                                            <td className="p-4 text-center font-black text-lg text-indigo-600">{s.avg}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 py-12 font-bold">ไม่มีข้อมูลสถานที่ฝึกงาน</p>
                    )}
                </div>

                {/* Switch Role */}
                {hasDoubleRole && (
                    <button
                        onClick={() => router.push('/select-role')}
                        className="w-full py-4 flex items-center justify-center gap-2 text-indigo-600 bg-white rounded-2xl border border-slate-200 font-black text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
                    >
                        เปลี่ยนบทบาทการใช้งาน
                    </button>
                )}
            </div>
        </div>
    )
}

function KPICard({ label, value, unit, icon, color }: any) {
    return (
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>{icon}</div>
            <p className="text-3xl font-black text-slate-800 leading-none tracking-tight">{value}</p>
            <div className="flex items-center gap-1.5 mt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                {unit && <span className="text-[9px] font-bold text-slate-300">({unit})</span>}
            </div>
        </div>
    )
}