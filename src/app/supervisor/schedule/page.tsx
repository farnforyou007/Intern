// // "use client"
// // import { useState, useEffect } from 'react'
// // import { createBrowserClient } from '@supabase/ssr'
// // import { 
// //     Search, ArrowLeft, Calendar, 
// //     Clock, AlertCircle, Users, BookOpen
// // } from 'lucide-react'
// // import { useRouter } from 'next/navigation'

// // export default function RotationSchedule() {
// //     const router = useRouter()
// //     const [loading, setLoading] = useState(true)
// //     const [groupedSchedule, setGroupedSchedule] = useState<any[]>([])
// //     const [searchTerm, setSearchTerm] = useState('')

// //     const supabase = createBrowserClient(
// //         process.env.NEXT_PUBLIC_SUPABASE_URL!,
// //         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// //     )

// //     useEffect(() => {
// //         fetchData()
// //     }, [])

// //     const fetchData = async () => {
// //         setLoading(true)
// //         const userId = 'U678862bd992a4cda7aaf972743b585ac' // จำลอง ID
        
// //         const { data: sv } = await supabase.from('supervisors').select('id, site_id').eq('line_user_id', userId).single()
        
// //         if (sv) {
// //             const { data, error } = await supabase
// //                 .from('student_assignments')
// //                 .select(`
// //                     id,
// //                     subjects:subject_id ( id, name ),
// //                     sub_subjects:sub_subject_id ( name ),
// //                     rotations:rotation_id ( id, name, start_date, end_date )
// //                 `)
// //                 .eq('site_id', sv.site_id)

// //             if (!error && data) {
// //                 // 🛠️ Logic การจัดกลุ่ม (Group by Rotation + Subject)
// //                 const groups: { [key: string]: any } = {}
                
// //                 data.forEach((item: any) => {
// //                     const rotationId = item.rotations?.id
// //                     const subjectId = item.subjects?.id
// //                     const subName = item.sub_subjects?.name || ''
// //                     const key = `${rotationId}-${subjectId}-${subName}`

// //                     if (!groups[key]) {
// //                         groups[key] = {
// //                             rotation: item.rotations,
// //                             subjectName: item.sub_subjects?.name || item.subjects?.name,
// //                             studentCount: 0
// //                         }
// //                     }
// //                     groups[key].studentCount += 1
// //                 })

// //                 // แปลงเป็น Array และเรียงตามวันที่สิ้นสุด (อันที่ใกล้จบขึ้นก่อน)
// //                 const sortedGroups = Object.values(groups).sort((a, b) => 
// //                     new Date(a.rotation.end_date).getTime() - new Date(b.rotation.end_date).getTime()
// //                 )
// //                 setGroupedSchedule(sortedGroups)
// //             }
// //         }
// //         setLoading(false)
// //     }

// //     const getDaysRemaining = (endDateStr: string) => {
// //         const today = new Date()
// //         const end = new Date(endDateStr)
// //         const diffTime = end.getTime() - today.getTime()
// //         return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
// //     }

// //     const filteredList = groupedSchedule.filter(group => 
// //         group.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
// //         group.rotation.name.toLowerCase().includes(searchTerm.toLowerCase())
// //     )

// //     return (
// //         <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 text-slate-900">
// //             {/* --- Header --- */}
// //             <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-[2.5rem]">
// //                 <div className="flex items-center justify-between mb-6">
// //                     <button onClick={() => router.back()} className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all">
// //                         <ArrowLeft size={20} strokeWidth={2.5} />
// //                     </button>
// //                     <div className="text-center">
// //                         <h1 className="text-xl font-black text-slate-900 tracking-tight">ภาพรวมผลัดฝึก</h1>
// //                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rotation Overview</p>
// //                     </div>
// //                     <div className="w-11 h-11 flex items-center justify-center text-slate-300 bg-slate-50 rounded-2xl border border-slate-100">
// //                         <Calendar size={20} />
// //                     </div>
// //                 </div>

// //                 {/* Search Bar */}
// //                 <div className="relative">
// //                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
// //                     <input 
// //                         type="text" 
// //                         placeholder="ค้นหาผลัด หรือ รายวิชา..." 
// //                         className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-100 outline-none font-bold text-sm focus:ring-2 ring-slate-200 transition-all"
// //                         value={searchTerm}
// //                         onChange={(e) => setSearchTerm(e.target.value)}
// //                     />
// //                 </div>
// //             </div>

// //             {/* --- Summary Cards --- */}
// //             <div className="px-5 mt-6 space-y-4">
// //                 {loading ? (
// //                     Array(3).fill(0).map((_, i) => <div key={i} className="bg-white h-40 rounded-[2.5rem] animate-pulse" />)
// //                 ) : filteredList.length > 0 ? (
// //                     filteredList.map((group, idx) => {
// //                         const daysLeft = getDaysRemaining(group.rotation.end_date)
// //                         const isEndingSoon = daysLeft >= 0 && daysLeft <= 5

// //                         return (
// //                             <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
// //                                 {/* แถบสีข้างการ์ดสื่อถึงความสำคัญ */}
// //                                 <div className={`absolute left-0 top-0 bottom-0 w-2 ${daysLeft < 0 ? 'bg-slate-200' : isEndingSoon ? 'bg-amber-400' : 'bg-emerald-500'}`} />

// //                                 <div className="flex justify-between items-start mb-4">
// //                                     <div>
// //                                         <div className="flex items-center gap-2 mb-1">
// //                                             <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">
// //                                                 {group.rotation.name}
// //                                             </span>
// //                                             <div className="flex items-center gap-1 text-slate-400 text-[11px] font-bold">
// //                                                 <Users size={12} />
// //                                                 <span>นศ. {group.studentCount} คน</span>
// //                                             </div>
// //                                         </div>
// //                                         <h3 className="font-black text-slate-800 text-lg leading-tight flex items-center gap-2">
// //                                             <BookOpen size={18} className="text-slate-300" />
// //                                             {group.subjectName}
// //                                         </h3>
// //                                     </div>
                                    
// //                                     {/* Countdown Circle */}
// //                                     <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 ${daysLeft < 0 ? 'border-slate-100 bg-slate-50 text-slate-300' : isEndingSoon ? 'border-amber-100 bg-amber-50 text-amber-600' : 'border-emerald-50 bg-emerald-50 text-emerald-600'}`}>
// //                                         <span className="text-lg font-black leading-none">{daysLeft < 0 ? '-' : daysLeft}</span>
// //                                         <span className="text-[8px] font-black uppercase tracking-tighter">วันเหลือ</span>
// //                                     </div>
// //                                 </div>

// //                                 {/* Date Range & Progress */}
// //                                 <div className="space-y-3 pt-4 border-t border-slate-50">
// //                                     <div className="flex justify-between items-end">
// //                                         <div className="flex items-center gap-2 text-slate-400">
// //                                             <Clock size={14} />
// //                                             <span className="text-xs font-bold">
// //                                                 {new Date(group.rotation.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {new Date(group.rotation.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
// //                                             </span>
// //                                         </div>
// //                                         {isEndingSoon && daysLeft >= 0 && (
// //                                             <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 animate-pulse">
// //                                                 <AlertCircle size={12} /> ใกล้สิ้นสุดผลัด
// //                                             </span>
// //                                         )}
// //                                     </div>
                                    
// //                                     {/* Simple Progress Bar (Optional) */}
// //                                     <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
// //                                         <div 
// //                                             className={`h-full rounded-full transition-all duration-1000 ${daysLeft < 0 ? 'bg-slate-300' : isEndingSoon ? 'bg-amber-400' : 'bg-emerald-500'}`}
// //                                             style={{ width: `${Math.max(0, Math.min(100, (1 - (daysLeft / 30)) * 100))}%` }} 
// //                                         />
// //                                     </div>
// //                                 </div>
// //                             </div>
// //                         )
// //                     })
// //                 ) : (
// //                     <div className="text-center py-24 opacity-40">
// //                         <Calendar size={48} className="mx-auto mb-2 text-slate-300" />
// //                         <p className="font-bold text-slate-400 tracking-wide">ไม่พบข้อมูลผลัดฝึก</p>
// //                     </div>
// //                 )}
// //             </div>
            
// //             {/* Bottom Gradient Fade */}
// //             <div className="fixed bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#F8FAFC] to-transparent pointer-events-none" />
// //         </div>
// //     )
// // }


// // ver2
// "use client"
// import { useState, useEffect } from 'react'
// import { createBrowserClient } from '@supabase/ssr'
// import { 
//     Search, ArrowLeft, Calendar, 
//     Clock, AlertCircle, Users, BookOpen, ChevronRight
// } from 'lucide-react'
// import { useRouter } from 'next/navigation'

// export default function RotationSchedule() {
//     const router = useRouter()
//     const [loading, setLoading] = useState(true)
//     const [groupedSchedule, setGroupedSchedule] = useState<any[]>([])
//     const [searchTerm, setSearchTerm] = useState('')

//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     useEffect(() => {
//         fetchData()
//     }, [])

//     const fetchData = async () => {
//         setLoading(true)
//         const userId = 'U678862bd992a4cda7aaf972743b585ac' // LIFF ID
        
//         const { data: sv } = await supabase.from('supervisors').select('id, site_id').eq('line_user_id', userId).single()
        
//         if (sv) {
//             const { data, error } = await supabase
//                 .from('student_assignments')
//                 .select(`
//                     student_id,
//                     subjects:subject_id ( name ),
//                     sub_subjects:sub_subject_id ( name ),
//                     rotations:rotation_id ( id, name, start_date, end_date )
//                 `)
//                 .eq('site_id', sv.site_id)

//             if (!error && data) {
//                 // 🛠️ Logic: รวมกลุ่มตาม Rotation ID
//                 const groups: { [key: string]: any } = {}
                
//                 data.forEach((item: any) => {
//                     const r = item.rotations
//                     if (!r) return
                    
//                     if (!groups[r.id]) {
//                         groups[r.id] = {
//                             rotation: r,
//                             subjects: new Set<string>(),
//                             studentIds: new Set<string>()
//                         }
//                     }
                    
//                     const subName = item.sub_subjects?.name || item.subjects?.name
//                     if (subName) groups[r.id].subjects.add(subName)
//                     groups[r.id].studentIds.add(item.student_id)
//                 })

//                 const result = Object.values(groups).map((g: any) => ({
//                     rotation: g.rotation,
//                     subjects: Array.from(g.subjects),
//                     studentCount: g.studentIds.size
//                 })).sort((a, b) => new Date(a.rotation.end_date).getTime() - new Date(b.rotation.end_date).getTime())

//                 setGroupedSchedule(result)
//             }
//         }
//         setLoading(false)
//     }

//     const getDaysRemaining = (endDateStr: string) => {
//         const today = new Date()
//         const end = new Date(endDateStr)
//         const diffTime = end.getTime() - today.getTime()
//         return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
//     }

//     const filteredList = groupedSchedule.filter(g => 
//         g.rotation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         g.subjects.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))
//     )

//     return (
//         <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 text-slate-900">
//             {/* --- Header --- */}
//             <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-[2.5rem]">
//                 <div className="flex items-center justify-between mb-6">
//                     <button onClick={() => router.back()} className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all">
//                         <ArrowLeft size={20} strokeWidth={2.5} />
//                     </button>
//                     <div className="text-center">
//                         <h1 className="text-xl font-black text-slate-900 tracking-tight">ตารางผลัดฝึก</h1>
//                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rotation Summary</p>
//                     </div>
//                     <div className="w-11 h-11 flex items-center justify-center text-slate-300 bg-slate-50 rounded-2xl border border-slate-100">
//                         <Calendar size={20} />
//                     </div>
//                 </div>

//                 <div className="relative">
//                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                     <input 
//                         type="text" 
//                         placeholder="ค้นหาผลัด หรือ วิชา..." 
//                         className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-100 outline-none font-bold text-sm"
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                 </div>
//             </div>

//             {/* --- Cards --- */}
//             <div className="px-5 mt-6 space-y-4">
//                 {loading ? (
//                     Array(3).fill(0).map((_, i) => <div key={i} className="bg-white h-40 rounded-[2.5rem] animate-pulse" />)
//                 ) : filteredList.length > 0 ? (
//                     filteredList.map((group, idx) => {
//                         const daysLeft = getDaysRemaining(group.rotation.end_date)
//                         const isEndingSoon = daysLeft >= 0 && daysLeft <= 5

//                         return (
//                             <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
//                                 <div className={`absolute left-0 top-0 bottom-0 w-2 ${daysLeft < 0 ? 'bg-slate-200' : isEndingSoon ? 'bg-amber-400' : 'bg-emerald-500'}`} />

//                                 <div className="flex justify-between items-start mb-4">
//                                     <div className="flex-1 pr-4">
//                                         <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">
//                                             {group.rotation.name}
//                                         </h2>
//                                         <div className="flex flex-wrap gap-1.5">
//                                             {group.subjects?.map((s: string) => (
//                                                 <span key={s} className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-100">
//                                                     {s}
//                                                 </span>
//                                             ))}
//                                         </div>
//                                     </div>
//                                     <div className="text-right shrink-0">
//                                         <div className="flex items-center justify-end gap-1 text-slate-400 text-[11px] font-black mb-1.5 uppercase tracking-widest">
//                                             <Users size={12} />
//                                             <span>{group.studentCount} คน</span>
//                                         </div>
//                                         <div className={`px-3 py-1.5 rounded-xl text-xs font-black shadow-sm ${
//                                             daysLeft < 0 ? 'bg-slate-100 text-slate-400' : 
//                                             isEndingSoon ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
//                                         }`}>
//                                             {daysLeft < 0 ? 'จบผลัดแล้ว' : `${daysLeft} วันเหลือ`}
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[11px] font-bold text-slate-400">
//                                     <div className="flex items-center gap-1.5">
//                                         <Clock size={12} />
//                                         <span>
//                                             {new Date(group.rotation.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {new Date(group.rotation.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
//                                         </span>
//                                     </div>
//                                     {isEndingSoon && daysLeft >= 0 && (
//                                         <span className="text-amber-500 flex items-center gap-1 animate-pulse uppercase tracking-tighter">
//                                             <AlertCircle size={12} /> ใกล้ปิดผลัด
//                                         </span>
//                                     )}
//                                 </div>
//                             </div>
//                         )
//                     })
//                 ) : (
//                     <div className="text-center py-20 opacity-30">
//                         <Calendar size={48} className="mx-auto mb-2" />
//                         <p className="font-bold uppercase tracking-widest text-xs">No Data Found</p>
//                     </div>
//                 )}
//             </div>
//         </div>
//     )
// }


// ver3
"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { 
    Search, ArrowLeft, Calendar, 
    Clock, AlertCircle, Users, BookOpen
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function RotationSchedule() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [groupedSchedule, setGroupedSchedule] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const userId = 'U678862bd992a4cda7aaf972743b585ac' 
        
        const { data: sv } = await supabase.from('supervisors').select('id, site_id').eq('line_user_id', userId).single()
        
        if (sv) {
            const { data, error } = await supabase
                .from('student_assignments')
                .select(`
                    student_id,
                    subjects:subject_id ( name ),
                    sub_subjects:sub_subject_id ( name ),
                    rotations:rotation_id ( id, name, start_date, end_date )
                `)
                .eq('site_id', sv.site_id)

            if (!error && data) {
                const groups: { [key: string]: any } = {}
                
                data.forEach((item: any) => {
                    const r = item.rotations
                    if (!r) return
                    
                    if (!groups[r.id]) {
                        groups[r.id] = {
                            rotation: r,
                            subjects: new Set<string>(),
                            studentIds: new Set<string>()
                        }
                    }
                    
                    const subName = item.sub_subjects?.name || item.subjects?.name
                    if (subName) groups[r.id].subjects.add(subName)
                    groups[r.id].studentIds.add(item.student_id)
                })

                const result = Object.values(groups).map((g: any) => ({
                    rotation: g.rotation,
                    subjects: Array.from(g.subjects || []),
                    studentCount: g.studentIds.size
                })).sort((a, b) => new Date(a.rotation.end_date).getTime() - new Date(b.rotation.end_date).getTime())

                setGroupedSchedule(result)
            }
        }
        setLoading(false)
    }

    const getDaysRemaining = (endDateStr: string) => {
        const today = new Date()
        const end = new Date(endDateStr)
        const diffTime = end.getTime() - today.getTime()
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    const filteredList = groupedSchedule.filter(g => 
        g.rotation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.subjects.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 text-slate-900">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-[2.5rem]">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => router.back()} className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all">
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">ตารางผลัดฝึก</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rotation Summary</p>
                    </div>
                    <div className="w-11 h-11 flex items-center justify-center text-slate-300 bg-slate-50 rounded-2xl border border-slate-100">
                        <Calendar size={20} />
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="ค้นหาผลัด หรือ วิชา..." 
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-100 outline-none font-bold text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List Content */}
            <div className="px-5 mt-6 space-y-4">
                {loading ? (
                    Array(3).fill(0).map((_, i) => <div key={i} className="bg-white h-40 rounded-[2.5rem] animate-pulse" />)
                ) : filteredList.length > 0 ? (
                    filteredList.map((group, idx) => {
                        const daysLeft = getDaysRemaining(group.rotation.end_date)
                        const isEndingSoon = daysLeft >= 0 && daysLeft <= 5

                        return (
                            <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className={`absolute left-0 top-0 bottom-0 w-2 ${daysLeft < 0 ? 'bg-slate-200' : isEndingSoon ? 'bg-amber-400' : 'bg-emerald-500'}`} />

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                                {group.rotation.name}
                                            </h2>
                                            <div className="flex items-center gap-1 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                                                <Users size={12} />
                                                <span>{group.studentCount} คน</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-1.5">
                                            {/* ✅ แก้ไข Error .map() โดยการใส่ ?. */}
                                            {group.subjects?.map((s: string) => (
                                                <span key={s} className="bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-100">
                                                    {s}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 🎯 สไตล์ Countdown แบบกล่องตัวเลขใหญ่ (ไสตล์ก่อนหน้า) */}
                                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 shrink-0 shadow-sm ${
                                        daysLeft < 0 
                                        ? 'border-slate-100 bg-slate-50 text-slate-300' 
                                        : isEndingSoon 
                                        ? 'border-amber-100 bg-amber-50 text-amber-600' 
                                        : 'border-emerald-50 bg-emerald-50 text-emerald-600'
                                    }`}>
                                        <span className="text-lg font-black leading-none">
                                            {daysLeft < 0 ? '-' : daysLeft}
                                        </span>
                                        <span className="text-[8px] font-black uppercase tracking-tighter mt-1">
                                            {daysLeft < 0 ? 'จบผลัด' : 'วันเหลือ'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[11px] font-bold text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={12} />
                                        <span>
                                            {new Date(group.rotation.start_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} - {new Date(group.rotation.end_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                                        </span>
                                    </div>
                                    {isEndingSoon && daysLeft >= 0 && (
                                        <span className="text-amber-500 flex items-center gap-1 animate-pulse uppercase tracking-tighter">
                                            <AlertCircle size={12} /> ใกล้ปิดผลัด
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-20 opacity-30">
                        <Calendar size={48} className="mx-auto mb-2" />
                        <p className="font-bold uppercase tracking-widest text-xs">No Data Found</p>
                    </div>
                )}
            </div>
        </div>
    )
}