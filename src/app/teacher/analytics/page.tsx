// "use client"
// import { useState, useEffect, useMemo } from 'react'
// import { createBrowserClient } from '@supabase/ssr'
// import { ChevronLeft, GraduationCap, Users, TrendingUp, TrendingDown, Award, MapPin } from 'lucide-react'
// import { useRouter } from 'next/navigation'
// import {
//     BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
//     PieChart, Pie, Cell, Legend
// } from 'recharts'

// const COLORS_EVAL = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899']
// const COLORS_GRADE = ['#10b981', '#22c55e', '#eab308', '#f97316', '#ef4444']

// export default function AnalyticsPage() {
//     const router = useRouter()
//     const [loading, setLoading] = useState(true)
//     const [subjects, setSubjects] = useState<any[]>([])
//     const [data, setData] = useState<any[]>([])
//     const [selectedSubject, setSelectedSubject] = useState<string>('all')

//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     useEffect(() => {
//         const fetchData = async () => {
//             setLoading(true)
//             const lineId = 'test-c'
//             const { data: user } = await supabase.from('supervisors').select('id').eq('line_user_id', lineId).single()

//             if (user) {
//                 const { data: subData } = await supabase.from('supervisor_subjects').select('subject_id, subjects(name, id)').eq('supervisor_id', user.id)
//                 setSubjects(subData || [])

//                 let query = supabase.from('student_assignments').select(`
//                     id,
//                     students (id, first_name, last_name, student_code),
//                     subjects (name),
//                     training_sites (site_name, province),
//                     evaluation_logs (
//                         id, total_score, supervisor_id,
//                         supervisors (id, full_name),
//                         evaluation_groups (id, group_name, weight),
//                         evaluation_answers (score, item_id)
//                     )
//                 `)

//                 if (subData) query = query.in('subject_id', subData.map(s => s.subject_id))

//                 const { data: res } = await query
//                 const processed = res?.map((item: any) => {
//                     const logs = item.evaluation_logs || []
//                     const supervisorMap: { [key: string]: { supervisorId: string, supervisorName: string, logs: any[] } } = {}
//                     logs.forEach((log: any) => {
//                         const svId = log.supervisor_id || 'unknown'
//                         if (!supervisorMap[svId]) {
//                             supervisorMap[svId] = { supervisorId: svId, supervisorName: log.supervisors?.full_name || 'ไม่ระบุ', logs: [] }
//                         }
//                         supervisorMap[svId].logs.push(log)
//                     })

//                     const supervisorEvaluations = Object.values(supervisorMap).map(sv => ({
//                         ...sv,
//                         evaluations: sv.logs.map((log: any) => ({
//                             groupId: log.evaluation_groups?.id,
//                             title: log.evaluation_groups?.group_name,
//                             rawScore: log.total_score || 0,
//                             weight: log.evaluation_groups?.weight || 1,
//                             answers: log.evaluation_answers || []
//                         }))
//                     }))

//                     const mentorCount = supervisorEvaluations.length
//                     let evaluations: any[] = []
//                     if (mentorCount === 1) {
//                         evaluations = supervisorEvaluations[0].evaluations
//                     } else if (mentorCount > 1) {
//                         const groupMap: { [groupId: string]: any[] } = {}
//                         supervisorEvaluations.forEach(sv => {
//                             sv.evaluations.forEach((ev: any) => {
//                                 if (!groupMap[ev.groupId]) groupMap[ev.groupId] = []
//                                 groupMap[ev.groupId].push(ev)
//                             })
//                         })
//                         evaluations = Object.values(groupMap).map(evs => {
//                             const avgRawScore = evs.reduce((sum: number, e: any) => sum + e.rawScore, 0) / evs.length
//                             return {
//                                 groupId: evs[0].groupId,
//                                 title: evs[0].title,
//                                 rawScore: Math.round(avgRawScore * 100) / 100,
//                                 weight: evs[0].weight,
//                                 answers: evs[0].answers
//                             }
//                         })
//                     }

//                     return {
//                         student: item.students,
//                         place: item.training_sites,
//                         subjectName: item.subjects?.name,
//                         evaluations,
//                         mentorCount
//                     }
//                 })
//                 setData(processed || [])
//             }
//             setLoading(false)
//         }
//         fetchData()
//     }, [supabase])

//     // กรองตามวิชาที่เลือก
//     const filteredData = useMemo(() => {
//         if (selectedSubject === 'all') return data
//         return data.filter(d => d.subjectName === selectedSubject)
//     }, [data, selectedSubject])

//     // คำนวณ net score ของแต่ละคน
//     const studentScores = useMemo(() => {
//         return filteredData.map(item => {
//             const net = item.evaluations.reduce((acc: number, ev: any) => {
//                 const max = (ev.answers?.length || 8) * 5
//                 return acc + (ev.rawScore / max * (ev.weight * 100))
//             }, 0)
//             return { ...item, netScore: parseFloat(net.toFixed(2)) }
//         }).sort((a, b) => b.netScore - a.netScore)
//     }, [filteredData])

//     // KPI
//     const kpi = useMemo(() => {
//         if (studentScores.length === 0) return { count: 0, avg: 0, max: 0, min: 0 }
//         const scores = studentScores.map(s => s.netScore)
//         return {
//             count: scores.length,
//             avg: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
//             max: Math.max(...scores),
//             min: Math.min(...scores)
//         }
//     }, [studentScores])

//     // Bar Chart: คะแนนเฉลี่ยรายแบบประเมิน
//     // const evalBarData = useMemo(() => {
//     //     const groupMap: { [title: string]: { total: number, count: number, maxPerItem: number, weight: number } } = {}
//     //     filteredData.forEach(item => {
//     //         item.evaluations.forEach((ev: any) => {
//     //             if (!ev.title) return
//     //             if (!groupMap[ev.title]) groupMap[ev.title] = { total: 0, count: 0, maxPerItem: 0, weight: ev.weight }
//     //             groupMap[ev.title].total += ev.rawScore
//     //             groupMap[ev.title].count += 1
//     //             groupMap[ev.title].maxPerItem = (ev.answers?.length || 8) * 5
//     //         })
//     //     })
//     //     return Object.entries(groupMap).map(([title, v]) => {
//     //         const avgRaw = v.count > 0 ? v.total / v.count : 0
//     //         const percent = v.maxPerItem > 0 ? (avgRaw / v.maxPerItem) * 100 : 0
//     //         // ชื่อย่อ
//     //         const short = title.replace('แบบประเมิน', '').replace('การประเมิน', '').trim()
//     //         return { name: short.length > 12 ? short.substring(0, 12) + '…' : short, fullName: title, avgPercent: parseFloat(percent.toFixed(1)), avgRaw: parseFloat(avgRaw.toFixed(1)), max: v.maxPerItem }
//     //     })
//     // }, [filteredData])

//     const evalBarData = useMemo(() => {
//         const groupMap: { [title: string]: { totalPercent: number, count: number } } = {}

//         filteredData.forEach(item => {
//             item.evaluations.forEach((ev: any) => {
//                 if (!ev.title) return

//                 // 1. หาคะแนนเต็มของหมวดนั้น (จำนวนข้อ * 5)
//                 // เช่น หมวดบุคลิกมี 20 ข้อ = 100 คะแนน | หมวดฝึกงานมี 8 ข้อ = 40 คะแนน
//                 const itemCount = ev.answers?.length || 0
//                 let maxRawScore = itemCount * 5

//                 // 2. ป้องกันกรณีข้อมูล answers ไม่มา ให้ใช้ค่าคงที่ตามรายงานของคุณ
//                 if (maxRawScore === 0) {
//                     if (ev.title.includes("บุคลิก")) maxRawScore = 100;
//                     else if (ev.title.includes("ฝึกงาน")) maxRawScore = 40;
//                     else if (ev.title.includes("เล่ม")) maxRawScore = 40;
//                 }

//                 if (maxRawScore > 0) {
//                     // 3. คำนวณเป็น % ของคะแนนดิบ (เช่น 86 / 100 * 100 = 86%)
//                     const individualPercent = (ev.rawScore / maxRawScore) * 100

//                     if (!groupMap[ev.title]) groupMap[ev.title] = { totalPercent: 0, count: 0 }
//                     groupMap[ev.title].totalPercent += individualPercent
//                     groupMap[ev.title].count += 1
//                 }
//             })
//         })

//         return Object.entries(groupMap).map(([title, v]) => {
//             const avgPercent = v.count > 0 ? v.totalPercent / v.count : 0
//             const short = title.replace('แบบประเมิน', '').replace('การประเมิน', '').trim()
//             return {
//                 name: short.length > 12 ? short.substring(0, 12) + '…' : short,
//                 fullName: title,
//                 avgPercent: parseFloat(avgPercent.toFixed(1))
//             }
//         })
//     }, [filteredData])
//     // Pie Chart: เกรด
//     const gradeData = useMemo(() => {
//         const grades = { 'A (≥80)': 0, 'B (70-79)': 0, 'C (60-69)': 0, 'D (50-59)': 0, 'F (<50)': 0 }
//         studentScores.forEach(s => {
//             if (s.netScore >= 80) grades['A (≥80)']++
//             else if (s.netScore >= 70) grades['B (70-79)']++
//             else if (s.netScore >= 60) grades['C (60-69)']++
//             else if (s.netScore >= 50) grades['D (50-59)']++
//             else grades['F (<50)']++
//         })
//         return Object.entries(grades).map(([name, value]) => ({ name, value })).filter(g => g.value > 0)
//     }, [studentScores])

//     // Top 5
//     const top5 = useMemo(() => studentScores.slice(0, 5), [studentScores])

//     // สรุปสถานที่ฝึกงาน
//     const siteStats = useMemo(() => {
//         const map: { [site: string]: { province: string, scores: number[] } } = {}
//         studentScores.forEach(s => {
//             const site = s.place?.site_name || 'ไม่ระบุ'
//             if (!map[site]) map[site] = { province: s.place?.province || '-', scores: [] }
//             map[site].scores.push(s.netScore)
//         })
//         return Object.entries(map).map(([site, v]) => ({
//             site,
//             province: v.province,
//             count: v.scores.length,
//             avg: parseFloat((v.scores.reduce((a, b) => a + b, 0) / v.scores.length).toFixed(2))
//         })).sort((a, b) => b.avg - a.avg)
//     }, [studentScores])

//     const CustomTooltip = ({ active, payload, label }: any) => {
//         if (active && payload?.length) {
//             return (
//                 <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-100">
//                     <p className="font-black text-slate-800 text-sm mb-1">{payload[0]?.payload?.fullName || label}</p>
//                     <p className="text-indigo-600 font-bold text-sm">{payload[0]?.value}%</p>
//                 </div>
//             )
//         }
//         return null
//     }

//     if (loading) return (
//         <div className="min-h-screen bg-[#F0F7FF] p-6 space-y-6">
//             <div className="h-12 bg-slate-200 rounded-2xl animate-pulse" />
//             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//                 {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-3xl animate-pulse" />)}
//             </div>
//             <div className="h-64 bg-white rounded-3xl animate-pulse" />
//             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                 <div className="h-64 bg-white rounded-3xl animate-pulse" />
//                 <div className="h-64 bg-white rounded-3xl animate-pulse" />
//             </div>
//         </div>
//     )

//     return (
//         <div className="min-h-screen bg-[#F0F7FF] pb-24 font-sans text-slate-900">
//             {/* Header */}
//             <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
//                 <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
//                     <div className="flex items-center justify-between mb-6 px-2">
//                         <button onClick={() => router.push('/teacher/dashboard')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 transition-all active:scale-90"><ChevronLeft size={20} /></button>
//                         <div className="text-center">
//                             <h1 className="text-lg font-black text-slate-800 leading-none">สถิติภาพรวม</h1>
//                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Analytics Dashboard</p>
//                         </div>
//                         <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center"><GraduationCap size={20} /></div>
//                     </div>

//                     {/* Subject Filter */}
//                     <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-2">
//                         <button onClick={() => setSelectedSubject('all')} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black border transition-all shrink-0 ${selectedSubject === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>ทุกวิชา</button>
//                         {subjects.map((s: any, i: number) => (
//                             <button key={i} onClick={() => setSelectedSubject(s.subjects.name)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black border transition-all shrink-0 ${selectedSubject === s.subjects.name ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{s.subjects.name}</button>
//                         ))}
//                     </div>
//                 </div>
//             </div>

//             <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
//                 {/* KPI Cards */}
//                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//                     <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-indigo-200 transition-all">
//                         <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
//                         <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3"><Users size={18} className="text-indigo-600" /></div>
//                         <p className="text-3xl font-black text-slate-800 leading-none">{kpi.count}</p>
//                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">นักศึกษา</p>
//                     </div>
//                     <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-cyan-200 transition-all">
//                         <div className="absolute -top-4 -right-4 w-16 h-16 bg-cyan-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
//                         <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center mx-auto mb-3"><TrendingUp size={18} className="text-cyan-600" /></div>
//                         <p className="text-3xl font-black text-slate-800 leading-none">{kpi.avg}</p>
//                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">คะแนนเฉลี่ย</p>
//                     </div>
//                     <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-emerald-200 transition-all">
//                         <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
//                         <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3"><Award size={18} className="text-emerald-600" /></div>
//                         <p className="text-3xl font-black text-emerald-600 leading-none">{kpi.max}</p>
//                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">สูงสุด</p>
//                     </div>
//                     <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-rose-200 transition-all">
//                         <div className="absolute -top-4 -right-4 w-16 h-16 bg-rose-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
//                         <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-3"><TrendingDown size={18} className="text-rose-500" /></div>
//                         <p className="text-3xl font-black text-rose-500 leading-none">{kpi.min}</p>
//                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">ต่ำสุด</p>
//                     </div>
//                 </div>

//                 {/* Bar Chart: คะแนนเฉลี่ยรายแบบประเมิน */}
//                 <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//                     <h3 className="font-black text-slate-800 text-base mb-1">คะแนนเฉลี่ยรายแบบประเมิน</h3>
//                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Average Score by Evaluation Category (%)</p>
//                     {evalBarData.length > 0 ? (
//                         <ResponsiveContainer width="100%" height={280}>
//                             <BarChart data={evalBarData} barSize={40}>
//                                 <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
//                                 <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
//                                 <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
//                                 <Tooltip content={<CustomTooltip />} />
//                                 <Bar dataKey="avgPercent" radius={[12, 12, 0, 0]}>
//                                     {evalBarData.map((_, i) => (
//                                         <Cell key={i} fill={COLORS_EVAL[i % COLORS_EVAL.length]} />
//                                     ))}
//                                 </Bar>
//                             </BarChart>
//                         </ResponsiveContainer>
//                     ) : (
//                         <p className="text-center text-slate-400 py-16 font-bold">ไม่มีข้อมูลประเมิน</p>
//                     )}
//                 </div>

//                 {/* Row: Pie Chart + Top 5 */}
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                     {/* Pie Chart */}
//                     <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//                         <h3 className="font-black text-slate-800 text-sm mb-1">การกระจายช่วงคะแนน</h3>
//                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Grade Distribution</p>
//                         {gradeData.length > 0 ? (
//                             <ResponsiveContainer width="100%" height={240}>
//                                 <PieChart>
//                                     <Pie data={gradeData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
//                                         {gradeData.map((_, i) => (
//                                             <Cell key={i} fill={COLORS_GRADE[i % COLORS_GRADE.length]} />
//                                         ))}
//                                     </Pie>
//                                     <Tooltip />
//                                 </PieChart>
//                             </ResponsiveContainer>
//                         ) : (
//                             <p className="text-center text-slate-400 py-16 font-bold">ไม่มีข้อมูล</p>
//                         )}
//                     </div>

//                     {/* Top 5 */}
//                     <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//                         <h3 className="font-black text-slate-800 text-sm mb-1">Top 5 คะแนนสูงสุด</h3>
//                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Highest Performers</p>
//                         <div className="space-y-3">
//                             {top5.map((s, i) => {
//                                 const percentage = kpi.max > 0 ? (s.netScore / kpi.max) * 100 : 0
//                                 return (
//                                     <div key={i} className="group">
//                                         <div className="flex items-center justify-between mb-1.5">
//                                             <div className="flex items-center gap-2.5 min-w-0">
//                                                 <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-600' : i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
//                                                     {i + 1}
//                                                 </span>
//                                                 <div className="min-w-0">
//                                                     <p className="font-black text-slate-700 text-[13px] leading-none truncate">{s.student?.first_name} {s.student?.last_name}</p>
//                                                     <p className="text-[9px] font-bold text-slate-400 mt-0.5">{s.student?.student_code}</p>
//                                                 </div>
//                                             </div>
//                                             <span className="font-black text-indigo-600 text-base shrink-0 ml-2">{s.netScore}</span>
//                                         </div>
//                                         <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
//                                             <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percentage}%`, background: i === 0 ? '#f59e0b' : '#6366f1' }} />
//                                         </div>
//                                     </div>
//                                 )
//                             })}
//                             {top5.length === 0 && <p className="text-center text-slate-400 py-8 font-bold">ไม่มีข้อมูล</p>}
//                         </div>
//                     </div>
//                 </div>

//                 {/* ตารางสรุปสถานที่ฝึกงาน */}
//                 <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
//                     <h3 className="font-black text-slate-800 text-base mb-1">สรุปรายสถานที่ฝึกงาน</h3>
//                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Performance by Training Site</p>
//                     {siteStats.length > 0 ? (
//                         <div className="overflow-hidden rounded-2xl border border-slate-100">
//                             <table className="w-full text-sm">
//                                 <thead className="bg-slate-800 text-white">
//                                     <tr>
//                                         <th className="p-4 text-left font-black text-xs uppercase">#</th>
//                                         <th className="p-4 text-left font-black text-xs uppercase">สถานที่ฝึกงาน</th>
//                                         <th className="p-4 text-center font-black text-xs uppercase">จังหวัด</th>
//                                         <th className="p-4 text-center font-black text-xs uppercase">จำนวน นศ.</th>
//                                         <th className="p-4 text-center font-black text-xs uppercase">คะแนนเฉลี่ย</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="divide-y divide-slate-50">
//                                     {siteStats.map((s, i) => (
//                                         <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
//                                             <td className="p-4 font-black text-slate-300">{i + 1}</td>
//                                             <td className="p-4 font-bold text-slate-700 flex items-center gap-2"><MapPin size={14} className="text-slate-300 shrink-0" /><span className="truncate">{s.site}</span></td>
//                                             <td className="p-4 text-center font-bold text-slate-500">{s.province}</td>
//                                             <td className="p-4 text-center">
//                                                 <span className="bg-indigo-50 text-indigo-600 font-black text-xs px-2.5 py-1 rounded-lg">{s.count} คน</span>
//                                             </td>
//                                             <td className="p-4 text-center font-black text-lg text-indigo-600">{s.avg}</td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     ) : (
//                         <p className="text-center text-slate-400 py-12 font-bold">ไม่มีข้อมูลสถานที่ฝึกงาน</p>
//                     )}
//                 </div>
//             </div>
//         </div>
//     )
// }



// ver3
"use client"
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ChevronLeft, GraduationCap, Users, TrendingUp, TrendingDown, Award, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts'

const COLORS_EVAL = ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899']

export default function AnalyticsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [subjects, setSubjects] = useState<any[]>([])
    const [data, setData] = useState<any[]>([])
    const [selectedSubject, setSelectedSubject] = useState<string>('')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const lineId = 'test-c'
            const { data: user } = await supabase.from('supervisors').select('id').eq('line_user_id', lineId).single()

            if (user) {
                const { data: subData } = await supabase.from('supervisor_subjects').select('subject_id, subjects(name, id)').eq('supervisor_id', user.id)
                setSubjects(subData || [])

                // เลือกวิชาแรกเป็นค่าเริ่มต้นอัตโนมัติ (เอา 'all' ออก)
                if (subData && subData.length > 0) {
                    setSelectedSubject(subData[0].subjects.name)
                }

                let query = supabase.from('student_assignments').select(`
                    id,
                    students (id, first_name, last_name, student_code),
                    subjects (name),
                    training_sites (site_name, province),
                    evaluation_logs (
                        id, total_score, supervisor_id,
                        supervisors (id, full_name),
                        evaluation_groups (id, group_name, weight),
                        evaluation_answers (score, item_id)
                    )
                `)

                if (subData) query = query.in('subject_id', subData.map(s => s.subject_id))

                const { data: res } = await query
                const processed = res?.map((item: any) => {
                    const logs = item.evaluation_logs || []
                    const supervisorMap: { [key: string]: { supervisorId: string, supervisorName: string, logs: any[] } } = {}
                    logs.forEach((log: any) => {
                        const svId = log.supervisor_id || 'unknown'
                        if (!supervisorMap[svId]) {
                            supervisorMap[svId] = { supervisorId: svId, supervisorName: log.supervisors?.full_name || 'ไม่ระบุ', logs: [] }
                        }
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
                    if (mentorCount === 1) {
                        evaluations = supervisorEvaluations[0].evaluations
                    } else if (mentorCount > 1) {
                        const groupMap: { [groupId: string]: any[] } = {}
                        supervisorEvaluations.forEach(sv => {
                            sv.evaluations.forEach((ev: any) => {
                                if (!groupMap[ev.groupId]) groupMap[ev.groupId] = []
                                groupMap[ev.groupId].push(ev)
                            })
                        })
                        evaluations = Object.values(groupMap).map(evs => {
                            const avgRawScore = evs.reduce((sum: number, e: any) => sum + e.rawScore, 0) / evs.length
                            return {
                                groupId: evs[0].groupId,
                                title: evs[0].title,
                                rawScore: Math.round(avgRawScore * 100) / 100,
                                weight: evs[0].weight,
                                answers: evs[0].answers
                            }
                        })
                    }

                    return {
                        student: item.students,
                        place: item.training_sites,
                        subjectName: item.subjects?.name,
                        evaluations,
                        mentorCount
                    }
                })
                setData(processed || [])
            }
            setLoading(false)
        }
        fetchData()
    }, [supabase])

    const filteredData = useMemo(() => {
        return data.filter(d => d.subjectName === selectedSubject)
    }, [data, selectedSubject])

    const studentScores = useMemo(() => {
        return filteredData.map(item => {
            const net = item.evaluations.reduce((acc: number, ev: any) => {
                const itemCount = ev.answers?.length || 0
                let max = itemCount * 5
                if (max === 0) {
                    if (ev.title.includes("บุคลิก")) max = 100;
                    else max = 40;
                }
                return acc + (ev.rawScore / max * (ev.weight * 100))
            }, 0)
            return { ...item, netScore: parseFloat(net.toFixed(2)) }
        }).sort((a, b) => b.netScore - a.netScore)
    }, [filteredData])

    const kpi = useMemo(() => {
        if (studentScores.length === 0) return { count: 0, avg: 0, max: 0, min: 0 }
        const scores = studentScores.map(s => s.netScore)
        return {
            count: scores.length,
            avg: parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)),
            max: Math.max(...scores),
            min: Math.min(...scores)
        }
    }, [studentScores])

    const evalBarData = useMemo(() => {
        const groupMap: { [title: string]: { totalPercent: number, count: number } } = {}

        filteredData.forEach(item => {
            item.evaluations.forEach((ev: any) => {
                if (!ev.title) return

                const itemCount = ev.answers?.length || 0
                let maxRawScore = itemCount * 5

                if (maxRawScore === 0) {
                    if (ev.title.includes("บุคลิก")) maxRawScore = 100;
                    else if (ev.title.includes("ฝึกงาน")) maxRawScore = 40;
                    else if (ev.title.includes("เล่ม")) maxRawScore = 40;
                    else if (ev.title.includes("เภสัช")) maxRawScore = 40;
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
    }, [filteredData])

    const siteStats = useMemo(() => {
        const map: { [site: string]: { province: string, scores: number[] } } = {}
        studentScores.forEach(s => {
            const site = s.place?.site_name || 'ไม่ระบุ'
            if (!map[site]) map[site] = { province: s.place?.province || '-', scores: [] }
            map[site].scores.push(s.netScore)
        })
        return Object.entries(map).map(([site, v]) => ({
            site,
            province: v.province,
            count: v.scores.length,
            avg: parseFloat((v.scores.reduce((a, b) => a + b, 0) / v.scores.length).toFixed(2))
        })).sort((a, b) => b.avg - a.avg)
    }, [studentScores])

    const CustomTooltip = ({ active, payload, label }: any) => {
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

    const top5 = useMemo(() => studentScores.slice(0, 5), [studentScores])

    if (loading) return (
        <div className="min-h-screen bg-[#F0F7FF] p-6 space-y-6">
            <div className="h-12 bg-slate-200 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-3xl animate-pulse" />)}
            </div>
            <div className="h-64 bg-white rounded-3xl animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-64 bg-white rounded-3xl animate-pulse" />
                <div className="h-64 bg-white rounded-3xl animate-pulse" />
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#F0F7FF] pb-24 font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
                    <div className="flex items-center justify-between mb-6 px-2">
                        <button onClick={() => router.push('/teacher/dashboard')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 transition-all active:scale-90"><ChevronLeft size={20} /></button>
                        <div className="text-center">
                            <h1 className="text-lg font-black text-slate-800 leading-none">สถิติภาพรวม</h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Analytics Dashboard</p>
                        </div>
                        <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center"><GraduationCap size={20} /></div>
                    </div>

                    {/* Subject Filter */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-2">
                        {subjects.map((s: any, i: number) => (
                            <button key={i} onClick={() => setSelectedSubject(s.subjects.name)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black border transition-all shrink-0 ${selectedSubject === s.subjects.name ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{s.subjects.name}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 mt-8 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-indigo-200 transition-all">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-indigo-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-3"><Users size={18} className="text-indigo-600" /></div>
                        <p className="text-3xl font-black text-slate-800 leading-none">{kpi.count}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">นักศึกษา</p>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-cyan-200 transition-all">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-cyan-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                        <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center mx-auto mb-3"><TrendingUp size={18} className="text-cyan-600" /></div>
                        <p className="text-3xl font-black text-slate-800 leading-none">{kpi.avg}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">คะแนนเฉลี่ย</p>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-emerald-200 transition-all">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3"><Award size={18} className="text-emerald-600" /></div>
                        <p className="text-3xl font-black text-emerald-600 leading-none">{kpi.max}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">สูงสุด</p>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group hover:border-rose-200 transition-all">
                        <div className="absolute -top-4 -right-4 w-16 h-16 bg-rose-50 rounded-full opacity-50 group-hover:scale-150 transition-transform" />
                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center mx-auto mb-3"><TrendingDown size={18} className="text-rose-500" /></div>
                        <p className="text-3xl font-black text-rose-500 leading-none">{kpi.min}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">ต่ำสุด</p>
                    </div>
                </div>

                {/* Bar Chart: คะแนนเฉลี่ยรายแบบประเมิน */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 text-base mb-1">คะแนนเฉลี่ยรายแบบประเมิน</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Average Score by Evaluation Category (%)</p>
                    {evalBarData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={evalBarData} barSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} />
                                <Tooltip content={<CustomTooltip />} />
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

                {/* Row: Radar Chart + Top 5 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Radar Chart (แทนที่ Pie Chart เดิม) */}
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-800 text-sm mb-1">สมรรถนะภาพรวม</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Competency Radar</p>
                        {evalBarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={evalBarData}>
                                    <PolarGrid stroke="#e2e8f0" />
                                    <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name="คะแนนเฉลี่ย" dataKey="avgPercent" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                                    <Tooltip content={<CustomTooltip />} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-center text-slate-400 py-16 font-bold">ไม่มีข้อมูล</p>
                        )}
                    </div>

                    {/* Top 5 */}
                    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <h3 className="font-black text-slate-800 text-sm mb-1">Top 5 คะแนนสูงสุด</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Highest Performers</p>
                        <div className="space-y-3">
                            {top5.map((s, i) => {
                                const percentage = kpi.max > 0 ? (s.netScore / kpi.max) * 100 : 0
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

                {/* ตารางสรุปสถานที่ฝึกงาน */}
                <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="font-black text-slate-800 text-base mb-1">สรุปรายสถานที่ฝึกงาน</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Performance by Training Site</p>
                    {siteStats.length > 0 ? (
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 ">
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
                                    {siteStats.map((s, i) => (
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
            </div>
        </div>
    )
}