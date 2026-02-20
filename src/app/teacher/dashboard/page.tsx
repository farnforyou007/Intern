// // VER4
// "use client"
// import { useState, useEffect } from 'react'
// import { createBrowserClient } from '@supabase/ssr'
// import {
//     BookOpen, BarChart3, Users,
//     Settings, LogOut, ChevronRight,
//     GraduationCap, Bell, User
// } from 'lucide-react'
// import { useRouter } from 'next/navigation'
// import { Skeleton } from "@/components/ui/skeleton"
// export default function TeacherDashboard() {
//     const router = useRouter()
//     const [loading, setLoading] = useState(true)
//     const [teacherData, setTeacherData] = useState<any>(null)
//     const [kpi, setKpi] = useState({ total: 0, evaluated: 0, pending: 0 })
//     const [subjects, setSubjects] = useState<any[]>([])
//     const [hasDoubleRole, setHasDoubleRole] = useState(false)
//     const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all');

//     const [expanded, setExpanded] = useState(false);
//     const [allAssignments, setAllAssignments] = useState<any[]>([]); // สำหรับเก็บข้อมูลดิบไว้คำนวณแยกวิชา

//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     // 2. ฟังก์ชันคำนวณ KPI ใหม่ (แยกออกมาให้เรียกซ้ำได้)
//     const calculateKPI = (assignments: any[], subjectId: string) => {
//         // กรองเฉพาะนักศึกษาที่อยู่ในวิชาที่เลือก (ถ้าเลือก 'all' ก็เอาหมด)
//         const filtered = subjectId === 'all'
//             ? assignments
//             : assignments.filter(a => a.subject_id === subjectId);

//         const total = filtered.length;
//         const evaluated = filtered.filter((a: any) =>
//             a.assignment_supervisors?.some((sv: any) => sv.is_evaluated === true)
//         ).length;

//         setKpi({
//             total,
//             evaluated,
//             pending: total - evaluated
//         });
//     };

//     useEffect(() => {
//         fetchDashboardData()
//     }, [])

//     useEffect(() => {
//         fetchDashboardData()

//         // ⚡ Real-time Subscription: อัปเดตเมื่อมีการประเมิน นศ.
//         const channel = supabase
//             .channel('evaluation_updates')
//             .on('postgres_changes', {
//                 event: '*',
//                 schema: 'public',
//                 table: 'assignment_supervisors'
//             }, () => {
//                 fetchDashboardData() // โหลด KPI ใหม่เมื่อข้อมูลเปลี่ยน
//             })
//             .subscribe()

//         return () => { supabase.removeChannel(channel) }
//     }, [])

//     const fetchDashboardData = async () => {
//         setLoading(true)
//         // const lineId = 'U678862bd992a4cda7aaf972743b585ac' 
//         const lineId = 'test-c'


//         // 1. ดึงข้อมูลอาจารย์
//         const { data: user } = await supabase
//             .from('supervisors')
//             .select('id, full_name, avatar_url, role, supervisor_subjects(id)')
//             .eq('line_user_id', lineId)
//             .single()

//         if (user) {
//             setTeacherData(user)

//             // เช็ค Double Role
//             const isTeacher = user.supervisor_subjects && user.supervisor_subjects.length > 0
//             const isSupervisor = user.role === 'supervisor'
//             setHasDoubleRole(isTeacher && isSupervisor)

//             // 2. ดึงวิชาที่รับผิดชอบ
//             const { data: subTeachers } = await supabase
//                 .from('supervisor_subjects')
//                 .select('subject_id, subjects(name, id, id)')
//                 .eq('supervisor_id', user.id)

//             setSubjects(subTeachers || [])

//             // 3. คำนวณ KPI จากนักศึกษาจริงในวิชาเหล่านั้น
//             const subjectIds = subTeachers?.map((s: any) => s.subject_id) || []

//             if (subjectIds.length > 0) {
//                 // ดึงข้อมูลการมอบหมายทั้งหมดในวิชานั้นๆ
//                 const { data: assignments } = await supabase
//                     .from('student_assignments')
//                     .select(`
//                         id,
//                         assignment_supervisors(is_evaluated)
//                     `)
//                     .in('subject_id', subjectIds)

//                 if (assignments) {
//                     const total = assignments.length
//                     // นับเฉพาะคนที่ใน assignment_supervisors มี is_evaluated เป็น true อย่างน้อย 1 อัน
//                     const evaluated = assignments.filter((a: any) =>
//                         a.assignment_supervisors?.some((sv: any) => sv.is_evaluated === true)
//                     ).length

//                     setKpi({
//                         total,
//                         evaluated,
//                         pending: total - evaluated
//                     })
//                 }
//             }
//         }
//         setLoading(false)
//     }

//     // if (loading) return (
//     //     <div className="min-h-screen bg-[#F0F7FF] p-6 space-y-8">
//     //         <div className="h-44 bg-slate-200 rounded-[3.5rem] animate-pulse relative overflow-hidden">
//     //             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
//     //         </div>
//     //         <div className="grid grid-cols-3 gap-3">
//     //             {[1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-3xl animate-pulse" />)}
//     //         </div>
//     //         <div className="space-y-4">
//     //             {[1,2].map(i => <div key={i} className="h-24 bg-white rounded-[2.5rem] animate-pulse" />)}
//     //         </div>
//     //         <div className="space-y-4">
//     //             {[1,2].map(i => <div key={i} className="h-24 bg-white rounded-[2.5rem] animate-pulse" />)}
//     //         </div>
//     //     </div>
//     // )

//     if (loading) return (
//         <div className="min-h-screen bg-[#F0F7FF] p-6 space-y-8">
//             {/* Profile Skeleton */}
//             <Skeleton className="h-44 w-full rounded-[3.5rem] bg-indigo-200 shimmer-wrapper" />

//             {/* KPI Skeleton */}
//             <div className="grid grid-cols-3 gap-3">
//                 <Skeleton className="h-24 rounded-3xl bg-white shimmer-wrapper" />
//                 <Skeleton className="h-24 rounded-3xl bg-white shimmer-wrapper" />
//                 <Skeleton className="h-24 rounded-3xl bg-white shimmer-wrapper" />
//             </div>

//             {/* Menu Skeleton */}
//             <div className="space-y-4">
//                 <Skeleton className="h-24 w-full rounded-[2.5rem] bg-white shimmer-wrapper" />
//                 <Skeleton className="h-24 w-full rounded-[2.5rem] bg-white shimmer-wrapper" />
//                 <Skeleton className="h-24 w-full rounded-[2.5rem] bg-white shimmer-wrapper" />
//                 <Skeleton className="h-24 w-full rounded-[2.5rem] bg-white shimmer-wrapper" />
//             </div>
//         </div>
//     )

//     const menuItems = [
//         {
//             title: 'วิชาที่รับผิดชอบ',
//             subtitle: 'ดูรายชื่อ นศ. และผลการประเมิน',
//             icon: <BookOpen className="text-blue-600" size={24} />,
//             path: '/teacher/subjects',
//             color: 'bg-blue-50'
//         },
//         {
//             title: 'สรุปคะแนนภาพรวม',
//             subtitle: 'รายงานสถิติแยกตามรายวิชา',
//             icon: <BarChart3 className="text-indigo-600" size={24} />,
//             path: '/teacher/analytics',
//             color: 'bg-indigo-50'
//         },
//         {
//             title: 'จัดการตารางฝึก',
//             subtitle: 'ดูช่วงเวลาการเข้าฝึกของ นศ.',
//             icon: <Users className="text-cyan-600" size={24} />,
//             path: '/teacher/schedule',
//             color: 'bg-cyan-50'
//         },
//         {
//             title: 'ตั้งค่าระบบ',
//             subtitle: 'โปรไฟล์และการแจ้งเตือน',
//             icon: <Settings className="text-slate-500" size={24} />,
//             path: '/teacher/settings',
//             color: 'bg-slate-50'
//         }
//     ]

//     return (
//         <div className="min-h-screen bg-[#F0F7FF] pb-12 font-sans text-slate-900">
//             {/* --- Header Section (Profile) --- */}
//             <div className="bg-indigo-100 px-6 pt-14 pb-12 rounded-b-[3.5rem] shadow-sm relative overflow-hidden">
//                 <div className="absolute top-0 right-0 w-48 h-48 bg-purple-900 opacity-[0.07] rounded-full -mr-20 -mt-20"></div>

//                 <div className="max-w-4xl mx-auto relative z-10">
//                     <div className="flex items-center gap-5 mb-8">
//                         {/* Avatar */}
//                         <div className="relative shrink-0">
//                             <div className="w-20 h-20 rounded-[2rem] bg-blue-50 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
//                                 {teacherData?.avatar_url ? (
//                                     <img src={teacherData.avatar_url} className="w-full h-full object-cover" />
//                                 ) : <User size={32} className="text-blue-200" />}
//                             </div>
//                             <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center text-white border-2 border-white shadow-sm">
//                                 <GraduationCap size={14} />
//                             </div>
//                         </div>

//                         {/* Teacher Info & Badge */}
//                         <div className="min-w-0 flex-1">
//                             <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-lg tracking-widest uppercase inline-block mb-1.5 shadow-sm shadow-blue-100">
//                                 อาจารย์ผู้รับผิดชอบรายวิชา
//                             </span>
//                             <h1 className="text-xl font-black text-slate-900 leading-tight truncate">
//                                 {teacherData?.full_name || '...'}
//                             </h1>
//                             <div className="flex flex-wrap gap-1.5 mt-2">
//                                 {subjects.length > 0 ? subjects.map((s, i) => (
//                                     <span key={i} className="text-[11px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-tighter">
//                                         {s.subjects.name}
//                                     </span>
//                                 )) : <span className="text-[14px] text-slate-400">ยังไม่มีรายวิชาในระบบ</span>}
//                             </div>
//                         </div>
//                     </div>


//                     <div className="mt-4 space-y-3">
//                         <div className="flex items-center justify-between px-1">
//                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
//                                 รายวิชาที่ดูแล ({subjects.length})
//                             </p>
//                             {subjects.length > 1 && (
//                                 <button
//                                     onClick={() => setExpanded(!expanded)}
//                                     className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1"
//                                 >
//                                     {expanded ? 'ซ่อน' : 'ดูทั้งหมด'}
//                                     <ChevronRight size={12} className={expanded ? '-rotate-90 transition-all' : 'rotate-90 transition-all'} />
//                                 </button>
//                             )}
//                         </div>

//                         {/* รายการวิชา (จะแสดงอันเดียวถ้าไม่ Expand หรือแสดงทั้งหมดถ้า Expand) */}
//                         <div className="space-y-2">
//                             {(expanded ? subjects : subjects.slice(0, 1)).map((s, i) => {
//                                 // คำนวณ % สำหรับแต่ละวิชา
//                                 const subAssignments = allAssignments.filter((a: any) => a.subject_id === s.subject_id);
//                                 const total = subAssignments.length;
//                                 const done = subAssignments.filter((a: any) =>
//                                     a.assignment_supervisors?.some((sv: any) => sv.is_evaluated === true)
//                                 ).length;
//                                 const percent = total > 0 ? Math.round((done / total) * 100) : 0;

//                                 return (
//                                     <div key={i} className="bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-white/50 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
//                                         <div className="flex justify-between items-end mb-2 px-1">
//                                             <div className="min-w-0">
//                                                 <p className="text-[11px] font-black text-slate-800 leading-none truncate uppercase tracking-tighter">
//                                                     {s.subjects.name}
//                                                 </p>
//                                             </div>
//                                             <span className="text-[10px] font-black text-blue-600 leading-none ml-2">
//                                                 {done}/{total}
//                                             </span>
//                                         </div>
//                                         {/* Progress Bar จิ๋ว */}
//                                         <div className="h-1.5 w-full bg-slate-200/50 rounded-full overflow-hidden">
//                                             <div
//                                                 className="h-full bg-blue-600 rounded-full transition-all duration-1000"
//                                                 style={{ width: `${percent}%` }}
//                                             />
//                                         </div>
//                                     </div>
//                                 );
//                             })}
//                         </div>
//                     </div>
//                     {/* --- KPI Section (Horizontal Cards) --- */}
//                     <div className="grid grid-cols-3 gap-3">
//                         <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center">
//                             <span className="text-slate-900 font-black text-xl leading-none">{kpi.total}</span>
//                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-1">นศ. ทั้งหมด</span>
//                         </div>
//                         <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 flex flex-col items-center">
//                             <span className="text-emerald-600 font-black text-xl leading-none">{kpi.evaluated}</span>
//                             <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter mt-1">ประเมินแล้ว</span>
//                         </div>
//                         <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 flex flex-col items-center">
//                             <span className="text-amber-600 font-black text-xl leading-none">{kpi.pending}</span>
//                             <span className="text-[8px] font-black text-amber-400 uppercase tracking-tighter mt-1">ยังไม่เสร็จ</span>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             <div className="max-w-4xl mx-auto px-6 mt-8 space-y-4">
//                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">เมนูการจัดการ</p>

//                 {menuItems.map((item, idx) => (
//                     <div
//                         key={idx}
//                         onClick={() => router.push(item.path)}
//                         className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 active:scale-[0.98] transition-all cursor-pointer group"
//                     >
//                         <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
//                             {item.icon}
//                         </div>
//                         <div className="flex-1 min-w-0">
//                             <h3 className="font-black text-slate-800 text-lg leading-none mb-1">{item.title}</h3>
//                             <p className="text-[11px] font-bold text-slate-400 truncate leading-none uppercase tracking-tight">{item.subtitle}</p>
//                         </div>
//                         <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
//                             <ChevronRight size={18} strokeWidth={3} />
//                         </div>
//                     </div>
//                 ))}

//                 {/* --- Switch Role: แสดงเฉพาะคนที่มี 2 Role --- */}
//                 {hasDoubleRole && (
//                     <button
//                         onClick={() => router.push('/select-role')}
//                         className="w-full mt-8 py-5 flex items-center justify-center gap-2 text-blue-600 bg-blue-50/50 rounded-[2.5rem] border border-dashed border-blue-200 font-black text-[10px] uppercase tracking-[0.2em]"
//                     >
//                         <LogOut size={14} />
//                         เปลี่ยนบทบาทการใช้งาน
//                     </button>
//                 )}
//             </div>

//             <div className="text-center py-10 opacity-20">
//                 <p className="text-[9px] font-black uppercase tracking-[0.5em]">TTMED Internships Management</p>
//             </div>
//         </div>
//     )
// }

// ver3
// // src/app/teacher/dashboard/page.tsx
// "use client"
// import { useState, useEffect } from 'react'
// import { createBrowserClient } from '@supabase/ssr'
// import {
//     BookOpen, BarChart3, Users,
//     Settings, LogOut, ChevronRight,
//     GraduationCap, User
// } from 'lucide-react'
// import { useRouter } from 'next/navigation'
// import { Skeleton } from "@/components/ui/skeleton"

// export default function TeacherDashboard() {
//     const router = useRouter()
//     const [loading, setLoading] = useState(true)
//     const [teacherData, setTeacherData] = useState<any>(null)
//     const [subjects, setSubjects] = useState<any[]>([])
//     const [allAssignments, setAllAssignments] = useState<any[]>([])
//     const [kpi, setKpi] = useState({ total: 0, evaluated: 0, percent: 0 })
//     const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all')
//     const [hasDoubleRole, setHasDoubleRole] = useState(false)

//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     useEffect(() => {
//         fetchDashboardData()

//         // Real-time Update เมื่อมีการประเมิน
//         const channel = supabase
//             .channel('evaluation_updates')
//             .on('postgres_changes', {
//                 event: '*',
//                 schema: 'public',
//                 table: 'assignment_supervisors'
//             }, () => fetchDashboardData())
//             .subscribe()

//         return () => { supabase.removeChannel(channel) }
//     }, [])

//     // ฟังก์ชันคำนวณ KPI แยกตามวิชา
//     // const calculateKPI = (assignments: any[], subjectId: string) => {
//     //     const filtered = subjectId === 'all'
//     //         ? assignments
//     //         : assignments.filter(a => a.subject_id === subjectId);

//     //     const total = filtered.length;
//     //     const evaluated = filtered.filter((a: any) =>
//     //         a.assignment_supervisors?.some((sv: any) => sv.is_evaluated === true)
//     //     ).length;

//     //     const percent = total > 0 ? Math.round((evaluated / total) * 100) : 0;

//     //     setKpi({ total, evaluated, percent });
//     // };
//     const calculateKPI = (assignments: any[], subjectId: string) => {
//         const filtered = subjectId === 'all'
//             ? assignments
//             : assignments.filter(a => a.subject_id === subjectId);

//         const total = filtered.length;
//         const evaluated = filtered.filter((a: any) =>
//             a.assignment_supervisors?.some((sv: any) => sv.is_evaluated === true)
//         ).length;

//         const pending = total - evaluated; // 👈 เพิ่มตัวแปรนับจำนวนที่ค้าง
//         const percent = total > 0 ? Math.round((evaluated / total) * 100) : 0;

//         setKpi({ total, evaluated, pending, percent }); // 👈 เก็บค่า pending ลง state
//     };

//     const fetchDashboardData = async () => {
//         setLoading(true)
//         const lineId = 'test-c' // 🛠️ Hard-code สำหรับ Test

//         try {
//             // 1. ดึงข้อมูลอาจารย์
//             const { data: user } = await supabase
//                 .from('supervisors')
//                 .select('id, full_name, avatar_url, role, supervisor_subjects(id)')
//                 .eq('line_user_id', lineId)
//                 .single()

//             if (user) {
//                 setTeacherData(user)
//                 setHasDoubleRole(user.role === 'supervisor' || user.role === 'both')

//                 // 2. ดึงวิชาที่รับผิดชอบจากตาราง supervisor_subjects (มี s)
//                 const { data: subData } = await supabase
//                     .from('supervisor_subjects')
//                     .select('subject_id, subjects(name, id, id)')
//                     .eq('supervisor_id', user.id)

//                 const subjectList = subData || []
//                 setSubjects(subjectList)

//                 // 3. ดึงนักศึกษาทั้งหมดในวิชาที่รับผิดชอบ
//                 const subjectIds = subjectList.map((s: any) => s.subject_id)
//                 if (subjectIds.length > 0) {
//                     const { data: assignments } = await supabase
//                         .from('student_assignments')
//                         .select(`
//                             id,
//                             subject_id,
//                             student_id,
//                             assignment_supervisors(is_evaluated)
//                         `)
//                         .in('subject_id', subjectIds)

//                     if (assignments) {
//                         setAllAssignments(assignments)
//                         calculateKPI(assignments, selectedSubject) // คำนวณตามวิชาที่เลือกอยู่
//                     }
//                 }
//             }
//         } catch (error) {
//             console.error("Dashboard error:", error)
//         } finally {
//             setLoading(false)
//         }
//     }

//     // ฟังก์ชันสลับวิชา
//     const handleSubjectChange = (id: string) => {
//         setSelectedSubject(id);
//         calculateKPI(allAssignments, id);
//     };

//     if (loading) return (
//         <div className="min-h-screen bg-[#F0F7FF] p-6 space-y-8">
//             <Skeleton className="h-64 w-full rounded-[3.5rem] bg-indigo-200" />
//             <div className="space-y-4">
//                 {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-[2.5rem] bg-white" />)}
//             </div>
//         </div>
//     )

//     const menuItems = [
//         { title: 'วิชาที่รับผิดชอบ', sub: 'ดูรายชื่อ นศ. และประเมิน', icon: <BookOpen className="text-blue-600" />, path: '/teacher/subjects', color: 'bg-blue-50' },
//         { title: 'สรุปคะแนนภาพรวม', sub: 'รายงานสถิติแยกวิชา', icon: <BarChart3 className="text-indigo-600" />, path: '/teacher/analytics', color: 'bg-indigo-50' },
//         { title: 'ตั้งค่าระบบ', sub: 'โปรไฟล์และการแจ้งเตือน', icon: <Settings className="text-slate-500" />, path: '/teacher/settings', color: 'bg-slate-50' }
//     ]

//     return (
//         <div className="min-h-screen bg-[#F0F7FF] pb-12 font-sans text-slate-900">
//             {/* --- Header & Interactive KPI Section --- */}
//             <div className="bg-indigo-100 px-6 pt-14 pb-10 rounded-b-[3.5rem] shadow-sm relative overflow-hidden">
//                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 opacity-[0.03] rounded-full -mr-32 -mt-32"></div>

//                 <div className="max-w-4xl mx-auto relative z-10">
//                     <div className="flex items-center gap-5 mb-8">
//                         <div className="relative shrink-0">
//                             <div className="w-20 h-20 rounded-[2rem] bg-white border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
//                                 {teacherData?.avatar_url ? (
//                                     <img src={teacherData.avatar_url} className="w-full h-full object-cover" />
//                                 ) : <User size={32} className="text-indigo-200" />}
//                             </div>
//                             <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center text-white border-2 border-white">
//                                 <GraduationCap size={14} />
//                             </div>
//                         </div>

//                         <div className="min-w-0 flex-1">
//                             <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-lg tracking-widest uppercase inline-block mb-1.5 shadow-sm">
//                                 อาจารย์ผู้รับผิดชอบ
//                             </span>
//                             <h1 className="text-xl font-black text-slate-900 truncate">
//                                 {teacherData?.full_name || '...'}
//                             </h1>

//                             {/* Subject Filter Pills */}
//                             <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
//                                 <button
//                                     onClick={() => handleSubjectChange('all')}
//                                     className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border shrink-0 ${selectedSubject === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}
//                                 >
//                                     ทั้งหมด
//                                 </button>
//                                 {subjects.map((s, i) => (
//                                     <button
//                                         key={i}
//                                         onClick={() => handleSubjectChange(s.subject_id)}
//                                         className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all border shrink-0 whitespace-nowrap ${selectedSubject === s.subject_id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200'}`}
//                                     >
//                                         {s.subjects.name}
//                                     </button>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>

//                     {/* Dashboard KPI Cards */}
//                     {/* <div className="grid grid-cols-12 gap-3">
//                         <div className="col-span-8 bg-white/90 backdrop-blur-md p-5 rounded-[2.5rem] shadow-sm flex items-center gap-4">
//                             <div className="relative w-14 h-14 shrink-0">
//                                 <svg className="w-full h-full transform -rotate-90">
//                                     <circle cx="28" cy="28" r="24" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
//                                     <circle cx="28" cy="28" r="24" stroke="#4f46e5" strokeWidth="6" fill="transparent"
//                                         strokeDasharray={150.8} strokeDashoffset={150.8 - (150.8 * kpi.percent) / 100}
//                                         strokeLinecap="round" className="transition-all duration-1000" />
//                                 </svg>
//                                 <div className="absolute inset-0 flex items-center justify-center">
//                                     <span className="text-[10px] font-black text-slate-800">{kpi.percent}%</span>
//                                 </div>
//                             </div>
//                             <div>
//                                 <h2 className="text-sm font-black text-slate-800 leading-none">ความคืบหน้า</h2>
//                                 <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
//                                     {selectedSubject === 'all' ? 'ภาพรวมทุกวิชา' : 'ผลการประเมินวิชานี้'}
//                                 </p>
//                             </div>
//                         </div>
//                         <div className="col-span-4 bg-indigo-600 p-5 rounded-[2.5rem] text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-200">
//                             <span className="text-2xl font-black leading-none">{kpi.total}</span>
//                             <span className="text-[9px] font-bold uppercase tracking-tighter mt-1 opacity-80">นักศึกษา</span>
//                         </div>
//                     </div> */}

//                     <div className="grid grid-cols-12 gap-3">
//                         {/* 1. ความคืบหน้าภาพรวม */}
//                         <div className="col-span-7 bg-white/90 backdrop-blur-md p-4 rounded-[2.5rem] shadow-sm flex items-center gap-3">
//                             <div className="relative w-12 h-12 shrink-0">
//                                 <svg className="w-full h-full transform -rotate-90">
//                                     <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="5" fill="transparent" />
//                                     <circle cx="24" cy="24" r="20" stroke="#4f46e5" strokeWidth="5" fill="transparent"
//                                         strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * kpi.percent) / 100}
//                                         strokeLinecap="round" className="transition-all duration-1000" />
//                                 </svg>
//                                 <div className="absolute inset-0 flex items-center justify-center">
//                                     <span className="text-[9px] font-black text-slate-800">{kpi.percent}%</span>
//                                 </div>
//                             </div>
//                             <div className="min-w-0">
//                                 <h2 className="text-[12px] font-black text-slate-800 leading-none">ประเมินแล้ว</h2>
//                                 <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-tight">
//                                     {kpi.evaluated} / {kpi.total} รายการ
//                                 </p>
//                             </div>
//                         </div>

//                         {/* 2. จำนวนที่ค้าง (โชว์ตัวเลขเน้นๆ) */}
//                         <div className="col-span-5 bg-rose-500 p-4 rounded-[2.5rem] text-white flex flex-col items-center justify-center shadow-lg shadow-rose-100 relative overflow-hidden">
//                             <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-full -mr-2 -mt-2"></div>
//                             <span className="text-xl font-black leading-none">{kpi.pending}</span>
//                             <span className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-90">ค้างประเมิน</span>
//                         </div>

//                         {/* 3. แถบแจ้งเตือนจำนวนนักศึกษาจริง (กรณีเลือก 'ทั้งหมด') */}
//                         {selectedSubject === 'all' && (
//                             <div className="col-span-12 px-6 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center animate-in fade-in slide-in-from-top-1">
//                                 <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
//                                     จำนวนนักศึกษาจริงในระบบ
//                                 </p>
//                                 <span className="text-xs font-black text-indigo-600">
//                                     {/* ใช้ Set เพื่อนับ Unique ID ของนักศึกษา */}
//                                     {[...new Set(allAssignments.map(a => a.student_id))].length} คน
//                                 </span>
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>

//             {/* --- Menu Section --- */}
//             <div className="max-w-4xl mx-auto px-6 mt-8 space-y-4">
//                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">การจัดการข้อมูล</p>
//                 {menuItems.map((item, idx) => (
//                     <div key={idx} onClick={() => router.push(item.path)} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 active:scale-[0.98] transition-all cursor-pointer group">
//                         <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
//                             {item.icon}
//                         </div>
//                         <div className="flex-1 min-w-0">
//                             <h3 className="font-black text-slate-800 text-lg leading-none mb-1">{item.title}</h3>
//                             <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{item.sub}</p>
//                         </div>
//                         <ChevronRight size={18} className="text-slate-300" strokeWidth={3} />
//                     </div>
//                 ))}

//                 {hasDoubleRole && (
//                     <button onClick={() => router.push('/select-role')} className="w-full mt-6 py-5 flex items-center justify-center gap-2 text-indigo-600 bg-indigo-50/50 rounded-[2.5rem] border border-dashed border-indigo-200 font-black text-[10px] uppercase tracking-widest">
//                         <LogOut size={14} /> เปลี่ยนบทบาทการใช้งาน
//                     </button>
//                 )}
//             </div>
//         </div>
//     )
// }



// ver5
// src/app/teacher/dashboard/page.tsx
// src/app/teacher/dashboard/page.tsx
"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    BookOpen, BarChart3, Settings,
    LogOut, ChevronRight, GraduationCap,
    User, Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Skeleton } from "@/components/ui/skeleton"
import liff from '@line/liff'

export default function TeacherDashboard() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [teacherData, setTeacherData] = useState<any>(null)
    const [subjects, setSubjects] = useState<any[]>([])
    const [allAssignments, setAllAssignments] = useState<any[]>([])
    const [kpi, setKpi] = useState({ total: 0, evaluated: 0, percent: 0 })
    const [selectedSubject, setSelectedSubject] = useState<string | 'all'>('all')
    const [hasDoubleRole, setHasDoubleRole] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchDashboardData()
        const channel = supabase
            .channel('evaluation_updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'assignment_supervisors'
            }, () => fetchDashboardData())
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [])

    const calculateKPI = (assignments: any[], subjectId: string) => {
        const filtered = subjectId === 'all'
            ? assignments
            : assignments.filter(a => a.subject_id === subjectId);

        const total = filtered.length; // จำนวนรายการทั้งหมด
        const evaluated = filtered.filter((a: any) =>
            a.assignment_supervisors?.some((sv: any) => sv.is_evaluated === true)
        ).length;

        const percent = total > 0 ? Math.round((evaluated / total) * 100) : 0;

        setKpi({ total, evaluated, percent });
    };

    const fetchDashboardData = async () => {
        setLoading(true)
        const lineId = 'test-c'

        try {
            const { data: user } = await supabase
                .from('supervisors')
                .select('id, full_name, avatar_url, role, supervisor_subjects(id)')
                .eq('line_user_id', lineId)
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
                    const { data: assignments } = await supabase
                        .from('student_assignments')
                        .select(`
                            id,
                            subject_id,
                            student_id,
                            assignment_supervisors(is_evaluated)
                        `)
                        .in('subject_id', subjectIds)

                    if (assignments) {
                        setAllAssignments(assignments)
                        calculateKPI(assignments, selectedSubject)
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
        setSelectedSubject(id);
        calculateKPI(allAssignments, id);
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F0F7FF] p-6 space-y-8">
            <Skeleton className="h-64 w-full rounded-[3.5rem] bg-indigo-200" />
            <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-[2.5rem] bg-white" />)}
            </div>
        </div>
    )

    const handleLogout = () => {
        // 1. สั่ง Logout จาก LINE (LIFF)
        // การ logout จะทำให้ Access Token ของ LINE ในเครื่องนี้หมดอายุทันที
        if (liff.isLoggedIn()) {
            liff.logout();
        }
        // 2. ล้างข้อมูลทุกอย่างที่ Browser จำไว้
        // ป้องกันกรณีที่โค้ดเรามีการเก็บ Line ID หรือ Profile ไว้ใน LocalStorage
        localStorage.clear();
        sessionStorage.clear();

        // 3. ดีดผู้ใช้กลับไปที่หน้า Check Auth
        // ใช้ window.location.replace เพื่อไม่ให้ผู้ใช้กดปุ่ม 'Back' กลับมาดูข้อมูลเดิมได้
        window.location.replace('/auth/check');
    };

    // const menuItems = [
    //     { title: 'วิชาที่รับผิดชอบ', sub: 'ดูรายชื่อ นศ. และประเมิน', icon: <BookOpen className="text-indigo-600" />, path: '/teacher/subjects', color: 'bg-indigo-50' },
    //     { title: 'สรุปคะแนนภาพรวม', sub: 'รายงานสถิติแยกวิชา', icon: <BarChart3 className="text-blue-600" />, path: '/teacher/analytics', color: 'bg-blue-50' },
    //     { title: 'ตั้งค่าระบบ', sub: 'โปรไฟล์และการแจ้งเตือน', icon: <Settings className="text-slate-500" />, path: '/teacher/settings', color: 'bg-slate-50' }
    // ]

    const menuItems = [
        {
            title: 'รายชื่อนักศึกษา',
            sub: 'ข้อมูลติดต่อและกลุ่มฝึกงาน',
            icon: <Users className="text-blue-600" />,
            path: `/teacher/students?id=${selectedSubject}`, // 👈 หน้าใหม่สำหรับติดต่อ นศ.
            color: 'bg-blue-50'
        },
        {
            title: 'ผลการประเมิน',
            sub: 'ตรวจสอบคะแนนและส่งออก Excel',
            icon: <BookOpen className="text-indigo-600" />,
            path: `/teacher/subjects?id=${selectedSubject}`,
            color: 'bg-indigo-50'
        },
        {
            title: 'สถิติภาพรวม',
            sub: 'กราฟสรุปผลแยกรายวิชา',
            icon: <BarChart3 className="text-cyan-600" />,
            path: '/teacher/analytics',
            color: 'bg-cyan-50'
        },
        {
            title: 'ตั้งค่าระบบ',
            sub: 'โปรไฟล์และการแจ้งเตือน',
            icon: <Settings className="text-slate-500" />,
            path: '/teacher/settings',
            color: 'bg-slate-50'
        }
    ]
    return (
        <div className="min-h-screen bg-[#F0F7FF] pb-12 font-sans text-slate-900">
            {/* --- Header Section --- */}
            <div className="bg-indigo-100 px-6 pt-14 pb-10 rounded-b-[3.5rem] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 opacity-[0.03] rounded-full -mr-32 -mt-32"></div>
                <button
                    onClick={() => {
                        // ใส่ Logic Logout ของพี่ตรงนี้ (เช่น liff.logout() หรือ supabase.auth.signOut())
                        router.replace('/auth/check')
                    }}
                    className="absolute top-8 right-8 w-10 h-10 bg-white/50 backdrop-blur-sm rounded-2xl flex items-center justify-center text-slate-400 active:scale-90 active:bg-rose-50 active:text-rose-500 transition-all z-20 shadow-sm border border-white/50"
                >
                    <LogOut size={18} strokeWidth={2.5} />
                </button>
                {/* --- Header Section (Profile & Subject Selection) --- */}
                <div className="max-w-4xl mx-auto relative z-10">
                    <div className="flex items-center gap-5 mb-8">
                        {/* Avatar (คงเดิม) */}
                        <div className="relative shrink-0">
                            <div className="w-20 h-20 rounded-[2.2rem] bg-white border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                                {teacherData?.avatar_url ? (
                                    <img src={teacherData.avatar_url} className="w-full h-full object-cover" />
                                ) : <User size={32} className="text-indigo-200" />}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-xl flex items-center justify-center text-white border-2 border-white shadow-md">
                                <GraduationCap size={14} />
                            </div>
                        </div>

                        {/* Info & Pills */}
                        <div className="min-w-0 flex-1">
                            <span className="bg-indigo-600 text-white text-[9px] font-black px-2.5 py-1 rounded-lg tracking-widest uppercase inline-block mb-1.5 shadow-sm">
                                อาจารย์ผู้รับผิดชอบ
                            </span>
                            <h1 className="text-xl font-black text-slate-900 truncate mb-3">
                                {teacherData?.full_name || '...'}
                            </h1>

                            {/* 🚩 แก้ไขจุดที่ 1: ซ่อนปุ่ม "ทั้งหมด" และ Filter ถ้ามีวิชาเดียว */}
                            {subjects.length > 1 && (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleSubjectChange('all')}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${selectedSubject === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}
                                    >
                                        ทั้งหมด
                                    </button>
                                    {subjects.map((s, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSubjectChange(s.subject_id)}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black border transition-all ${selectedSubject === s.subject_id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-200'}`}
                                        >
                                            {s.subjects.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* แสดงชื่อวิชาเดียวกรณีไม่มีปุ่มกด */}
                            {subjects.length === 1 && (
                                <span className="text-[11px] font-black text-blue-500 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 uppercase tracking-tighter inline-block">
                                    {subjects[0].subjects.name}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* --- KPI Cards Section --- */}
                    <div className="grid grid-cols-12 gap-3 mb-4">
                        {/* 🚩 แก้ไขจุดที่ 2: ปรับความกว้างกล่องสีขาว (col-span-8) */}
                        <div className="col-span-8 bg-white/90 backdrop-blur-md p-4 rounded-[2.5rem] shadow-sm flex items-center gap-3">
                            <div className="relative w-12 h-12 shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="5" fill="transparent" />
                                    <circle cx="24" cy="24" r="20" stroke="#4f46e5" strokeWidth="5" fill="transparent"
                                        strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * kpi.percent) / 100}
                                        strokeLinecap="round" className="transition-all duration-1000" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-[9px] font-black text-slate-800">{kpi.percent}%</span>
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-[11px] font-black text-slate-400 uppercase leading-none mb-1">ประเมินแล้ว</h2>
                                <p className="text-[13px] font-black text-indigo-600 truncate">
                                    {kpi.evaluated} / {kpi.total} <span className="text-[10px] text-slate-400 font-bold ml-0.5">รายการ</span>
                                </p>
                            </div>
                        </div>

                        {/* 🚩 แก้ไขจุดที่ 3: ปรับความกว้างกล่อง Indigo (col-span-4) */}
                        <div className="col-span-4 bg-indigo-600 p-4 rounded-[2.5rem] text-white flex flex-col items-center justify-center shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                            <span className="text-2xl font-black leading-none">
                                {[...new Set((selectedSubject === 'all' ? allAssignments : allAssignments.filter(a => a.subject_id === selectedSubject)).map(a => a.student_id))].length}
                            </span>
                            <span className="text-[8px] font-bold uppercase tracking-widest mt-1 opacity-90">นศ. (คน)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Menu Section --- */}
            <div className="max-w-4xl mx-auto px-6 mt-8 space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">เมนูการจัดการ</p>
                {menuItems.map((item, idx) => (
                    <div key={idx} onClick={() => router.push(item.path)} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 active:scale-[0.98] transition-all cursor-pointer group">
                        <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-slate-800 text-lg leading-none mb-1">{item.title}</h3>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{item.sub}</p>
                        </div>
                        <ChevronRight size={18} className="text-slate-300" strokeWidth={3} />
                    </div>
                ))}

                {hasDoubleRole && (
                    <button onClick={() => router.push('/select-role')} className="w-full mt-6 py-5 flex items-center justify-center gap-2 text-indigo-600 bg-white rounded-[2.5rem] border border-slate-200 font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all">
                        <LogOut size={14} /> เปลี่ยนบทบาทการใช้งาน
                    </button>
                )}
            </div>
            <div className="text-center py-10 opacity-20">
                <p className="text-[9px] font-black uppercase tracking-[0.5em]">TTMED Internships Management</p>
            </div>
        </div>
    )
}