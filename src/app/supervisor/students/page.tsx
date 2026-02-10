// "use client"
// import { useState, useEffect } from 'react'
// import { createBrowserClient } from '@supabase/ssr'
// import { 
//     Search, UserPlus, ChevronRight, 
//     CheckCircle2, Clock, MapPin, 
//     ArrowLeft, Filter, GraduationCap 
// } from 'lucide-react'
// import { useRouter } from 'next/navigation'

// export default function SupervisorStudentList() {
//     const router = useRouter()
//     const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine')
//     const [searchTerm, setSearchTerm] = useState('')

//     // สีเขียวหลัก (Deep Forest Green)
//     const primaryGreen = "#064e3b"

//     return (
//         <div className="min-h-screen bg-slate-50 pb-24 font-sans">
//             {/* Top Navigation */}
//             <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-30 shadow-sm border-b border-slate-100">
//                 <div className="flex items-center gap-4 mb-6">
//                     <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
//                         <ArrowLeft size={24} className="text-slate-600" />
//                     </button>
//                     <h1 className="text-xl font-black text-slate-900">รายชื่อนักศึกษา</h1>
//                 </div>

//                 {/* Search Bar */}
//                 <div className="relative mb-6">
//                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
//                     <input 
//                         type="text"
//                         placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..."
//                         className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-100 border-none outline-none focus:ring-2 focus:ring-[#064e3b]/20 font-bold text-slate-700"
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                     />
//                 </div>

//                 {/* Tabs Switcher */}
//                 <div className="flex p-1.5 bg-slate-100 rounded-2xl">
//                     <button 
//                         onClick={() => setActiveTab('mine')}
//                         className={`flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeTab === 'mine' ? 'bg-white shadow-sm text-[#064e3b]' : 'text-slate-400'}`}
//                     >
//                         ในความดูแล (8)
//                     </button>
//                     <button 
//                         onClick={() => setActiveTab('all')}
//                         className={`flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeTab === 'all' ? 'bg-white shadow-sm text-[#064e3b]' : 'text-slate-400'}`}
//                     >
//                         ทั้งหมดในหน่วยงาน (12)
//                     </button>
//                 </div>
//             </div>

//             {/* Student List */}
//             <div className="p-6 space-y-4">
//                 {/* ตัวอย่างการแสดงรายชื่อ */}
//                 {[1, 2, 3, 4].map((item) => (
//                     <div key={item} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
//                         <div className="flex items-start gap-4">
//                             {/* รูปนักศึกษา */}
//                             <div className="w-16 h-16 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
//                                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item}`} alt="student" className="w-full h-full object-cover" />
//                             </div>

//                             <div className="flex-1">
//                                 <div className="flex justify-between items-start">
//                                     <div>
//                                         <p className="text-[10px] font-black text-[#064e3b] uppercase tracking-widest mb-0.5">นศพท. ปี 3</p>
//                                         <h3 className="font-black text-slate-900 leading-tight">นายกิตติพงษ์ ใจดี</h3>
//                                         <p className="text-xs text-slate-400 font-bold">รหัส: 65123456</p>
//                                     </div>
//                                     {/* Badge สถานะ */}
//                                     <div className="flex flex-col items-end">
//                                         {activeTab === 'mine' ? (
//                                             <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-2 py-1 rounded-lg border border-amber-100 uppercase">ยังไม่ประเมิน</span>
//                                         ) : (
//                                             <button className="bg-[#064e3b] text-white p-2 rounded-xl shadow-lg shadow-[#064e3b]/20 active:scale-90">
//                                                 <UserPlus size={16} />
//                                             </button>
//                                         )}
//                                     </div>
//                                 </div>

//                                 <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-slate-500 border-t border-slate-50 pt-3">
//                                     <div className="flex items-center gap-1">
//                                         <Clock size={12} className="text-blue-500" />
//                                         <span>ผลัดที่ 1</span>
//                                     </div>
//                                     <div className="flex items-center gap-1 border-l pl-3">
//                                         <GraduationCap size={12} className="text-emerald-500" />
//                                         <span>วิชา: เวชกรรมไทย 1</span>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>

//                         {/* ปุ่มดำเนินการ (เฉพาะในแท็บ 'ในความดูแล') */}
//                         {activeTab === 'mine' && (
//                             <div className="mt-4 grid grid-cols-1">
//                                 <button 
//                                     onClick={() => router.push(`/supervisor/evaluate/${item}`)}
//                                     className="w-full py-3 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-[#064e3b] transition-colors"
//                                 >
//                                     เริ่มทำการประเมิน <ChevronRight size={14} />
//                                 </button>
//                             </div>
//                         )}
//                     </div>
//                 ))}
//             </div>

//             {/* Bottom Note */}
//             <div className="px-10 py-6 text-center">
//                 <p className="text-[11px] text-slate-400 font-medium italic">
//                     * หากไม่พบรายชื่อนักศึกษา กรุณาตรวจสอบในแท็บ "ทั้งหมดในหน่วยงาน" เพื่อกดรับนักศึกษาเข้าความดูแล
//                 </p>
//             </div>
//         </div>
//     )
// }


"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    Search, UserPlus, ChevronRight,
    CheckCircle2, Clock, MapPin,
    ArrowLeft, Filter, GraduationCap, Loader2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

export default function SupervisorStudentList() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine')
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)

    // Data States
    const [myStudents, setMyStudents] = useState<any[]>([])
    const [allSiteStudents, setAllSiteStudents] = useState<any[]>([])
    const [supervisorInfo, setSupervisorInfo] = useState<any>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // สมมติ LINE ID (ในระบบจริงจะดึงจาก LIFF/Context)
    const mockLineUserId = 'LINE_USER_001'

    useEffect(() => {
        fetchInitialData()
    }, [activeTab])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            // 1. หาข้อมูลพี่เลี้ยงก่อน
            const { data: supervisor } = await supabase
                .from('supervisors')
                .select('*')
                .eq('line_user_id', mockLineUserId)
                .single()

            if (!supervisor) return
            setSupervisorInfo(supervisor)

            if (activeTab === 'mine') {
                // 2. ดึง นศ. ในความดูแล (Join 3 ตาราง: assignment_supervisors -> student_assignments -> students)
                const { data: mine } = await supabase
                    .from('assignment_supervisors')
                    .select(`
                        id,
                        student_assignments (
                            id,
                            students (id, full_name, student_code, avatar_url),
                            subjects (name),
                            rotations (name)
                        )
                    `)
                    .eq('supervisor_id', supervisor.id)

                setMyStudents(mine || [])
            } else {
                // 3. ดึง นศ. ทั้งหมดในหน่วยงาน (ที่ยังไม่ได้รับดูแล)
                const { data: all } = await supabase
                    .from('student_assignments')
                    .select(`
                        id,
                        students (id, full_name, student_code, avatar_url),
                        subjects (name),
                        rotations (name)
                    `)
                    .eq('site_id', supervisor.site_id)

                // กรองเฉพาะคนที่ไม่อยู่ใน MyStudents (แบบง่าย)
                setAllSiteStudents(all || [])
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // ฟังก์ชันกดรับนักศึกษา
    const handleClaimStudent = async (assignmentId: number) => {
        const { isConfirmed } = await Swal.fire({
            title: 'ยืนยันการรับดูแล?',
            text: "คุณต้องการเพิ่มนักศึกษาคนนี้เข้าสู่รายการความดูแลใช่หรือไม่",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#064e3b',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก'
        })

        if (isConfirmed) {
            const { error } = await supabase
                .from('assignment_supervisors')
                .insert([{
                    assignment_id: assignmentId,
                    supervisor_id: supervisorInfo.id
                }])

            if (!error) {
                Swal.fire({ icon: 'success', title: 'เพิ่มสำเร็จ', timer: 1500, showConfirmButton: false })
                fetchInitialData() // รีเฟรชข้อมูล
            } else {
                Swal.fire('Error', 'ไม่สามารถเพิ่มได้ หรือคุณดูแลคนนี้อยู่แล้ว', 'error')
            }
        }
    }

    const currentList = activeTab === 'mine' ? myStudents : allSiteStudents
    const filteredList = currentList.filter(item => {
        const student = activeTab === 'mine' ? item.student_assignments?.students : item.students
        return student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student?.student_code.includes(searchTerm)
    })

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            {/* Top Navigation */}
            <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-30 shadow-sm border-b border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <h1 className="text-xl font-black text-slate-900">รายชื่อนักศึกษา</h1>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..."
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-100 border-none outline-none focus:ring-2 focus:ring-[#064e3b]/20 font-bold text-slate-700"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Tabs Switcher */}
                <div className="flex p-1.5 bg-slate-100 rounded-2xl">
                    <button onClick={() => setActiveTab('mine')}
                        className={`flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeTab === 'mine' ? 'bg-white shadow-sm text-[#064e3b]' : 'text-slate-400'}`}>
                        ในความดูแล ({myStudents.length})
                    </button>
                    <button onClick={() => setActiveTab('all')}
                        className={`flex-1 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${activeTab === 'all' ? 'bg-white shadow-sm text-[#064e3b]' : 'text-slate-400'}`}>
                        ทั้งหมดในหน่วยงาน ({allSiteStudents.length})
                    </button>
                </div>
            </div>

            {/* Student List */}
            <div className="p-6 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={32} /></div>
                ) : filteredList.length > 0 ? (
                    filteredList.map((item) => {
                        const data = activeTab === 'mine' ? item.student_assignments : item
                        const student = data?.students

                        return (
                            <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-200 overflow-hidden shrink-0 border-2 border-white shadow-sm">
                                        <img src={student?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student?.id}`} alt="student" className="w-full h-full object-cover" />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] font-black text-[#064e3b] uppercase tracking-widest mb-0.5">นศพท. ชั้นปีที่ 3</p>
                                                <h3 className="font-black text-slate-900 leading-tight">{student?.full_name}</h3>
                                                <p className="text-xs text-slate-400 font-bold">รหัส: {student?.student_code}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {activeTab === 'mine' ? (
                                                    <span className="bg-amber-50 text-amber-600 text-[9px] font-black px-2 py-1 rounded-lg border border-amber-100 uppercase italic">รอประเมิน</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleClaimStudent(item.id)}
                                                        className="bg-[#064e3b] text-white p-2.5 rounded-xl shadow-lg shadow-[#064e3b]/20 active:scale-90 transition-all">
                                                        <UserPlus size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-slate-500 border-t border-slate-50 pt-3">
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} className="text-blue-500" />
                                                <span>{data?.rotations?.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 border-l pl-3">
                                                <GraduationCap size={12} className="text-emerald-500" />
                                                <span>{data?.subjects?.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {activeTab === 'mine' && (
                                    <div className="mt-4 grid grid-cols-1">
                                        <button
                                            onClick={() => router.push(`/supervisor/evaluate/${data?.id}`)}
                                            className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-[#064e3b] transition-colors shadow-lg shadow-slate-200"
                                        >
                                            เริ่มทำการประเมิน <ChevronRight size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-20 text-slate-400 font-bold italic">ไม่พบรายชื่อนักศึกษา</div>
                )}
            </div>

            {/* Bottom Note */}
            <div className="px-10 py-6 text-center">
                <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed">
                    * หากไม่พบรายชื่อนักศึกษาในความดูแล <br /> กรุณาตรวจสอบในแท็บ "ทั้งหมดในหน่วยงาน" เพื่อกดรับนักศึกษา
                </p>
            </div>
        </div>
    )
}