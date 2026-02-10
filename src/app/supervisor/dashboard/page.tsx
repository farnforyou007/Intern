// "use client"
// import { useState, useEffect } from 'react'
// import { createBrowserClient } from '@supabase/ssr'
// import {
//     Users, ClipboardCheck, Clock,
//     Bell, ChevronRight, CheckCircle,
//     AlertCircle, PieChart, GraduationCap
// } from 'lucide-react'
// import { useRouter } from 'next/navigation'
// export default function SupervisorDashboard() {
//     // เปลี่ยนธีมสีหลักที่นี่: emerald-900 หรือ teal-900
//     const themeColor = "bg-[#064e3b]" // Deep Green (เขียวเข้ม)
//     const router = useRouter() // ประกาศใช้งาน Router
//     return (
//         <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
//             {/* --- Header Section --- */}
//             <div className={`${themeColor} p-8 pt-12 rounded-b-[3.5rem] shadow-2xl shadow-emerald-100 relative overflow-hidden`}>
//                 {/* ลายน้ำด้านหลัง */}
//                 <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10">
//                     <GraduationCap size={200} />
//                 </div>

//                 <div className="relative z-10 flex justify-between items-center mb-6">
//                     <div>
//                         <div className="flex items-center gap-2 mb-1">
//                             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
//                             <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">Supervisor Online</p>
//                         </div>
//                         <h1 className="text-2xl font-black text-white">อ.สมชาย สายชล</h1>
//                         <p className="text-emerald-100/70 text-sm font-medium">รพ.สมเด็จพระยุพราชสายบุรี</p>
//                     </div>
//                     <div className="w-16 h-16 rounded-2xl border-4 border-white/20 shadow-inner overflow-hidden">
//                         <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover" />
//                     </div>
//                 </div>

//                 {/* --- KPI Cards (Clear & Icon Focused) --- */}
//                 <div className="p-2 relative z-10 grid grid-cols-3 gap-4">
//                     <KPICard
//                         label="นศ. ทั้งหมด"
//                         value={12}
//                         icon={<Users size={16} />}
//                         color="bg-white/10 text-white"
//                     />
//                     <KPICard
//                         label="ประเมินแล้ว"
//                         value={8}
//                         icon={<CheckCircle size={16} />}
//                         color="bg-emerald-500/40 text-emerald-100"
//                     />
//                     <KPICard
//                         label="ยังไม่ประเมิน"
//                         value={4}
//                         icon={<AlertCircle size={16} />}
//                         color="bg-rose-500/40 text-rose-100"
//                     />
//                 </div>
//             </div>

//             {/* --- Notification Bar --- */}
//             <div className="px-6 -mt-8 relative z-20">
//                 <div className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 flex items-center gap-4">
//                     <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100">
//                         <Bell className="animate-swing" size={28} />
//                     </div>
//                     <div className="flex-1">
//                         <h3 className="font-black text-slate-800 text-sm">สิ้นสุดผลัดใน 3 วัน</h3>
//                         <p className="text-[11px] text-slate-400 font-bold italic">เหลือ นศ. 4 คน ที่ยังไม่ประเมิน</p>
//                     </div>
//                     {/* ปุ่มประเมินเลย -> ไปที่รายชื่อ นศ. */}
//                     <button
//                         onClick={() => router.push('/supervisor/students')}
//                         className="bg-[#064e3b] text-white text-[10px] font-black px-5 py-3 rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-all uppercase">
//                         ประเมินเลย

//                     </button>
//                 </div>
//             </div>

//             {/* --- Main Menus --- */}
//             <div className="p-8 space-y-4">
//                 <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">เมนูการจัดการ</h2>

//                 <MenuCard
//                     onClick={() => router.push('/supervisor/students')}
//                     icon={<Users size={24} />}
//                     title="รายชื่อนักศึกษา"
//                     desc="ดูรายชื่อ นศ. ในความดูแลและเริ่มประเมิน"
//                     badge="12 คน"
//                     color="text-emerald-600 bg-emerald-50"

//                 />
//                 <MenuCard
//                     icon={<ClipboardCheck size={24} />}
//                     title="ประวัติประเมิน"
//                     desc="ดูคะแนนย้อนหลังและสรุปผล"
//                     color="text-blue-600 bg-blue-50"
//                 />
//                 <MenuCard
//                     icon={<Clock size={24} />}
//                     title="ตารางผลัดฝึก"
//                     desc="เช็กช่วงเวลาฝึกงานในแต่ละรอบ"
//                     color="text-purple-600 bg-purple-50"
//                 />
//                 <MenuCard
//                     icon={<PieChart size={24} />}
//                     title="วิชาที่รับผิดชอบ"
//                     desc="ดูเกณฑ์การประเมินในแต่ละวิชา"
//                     color="text-amber-600 bg-amber-50"
//                 />
//             </div>
//         </div>
//     )
// }

// // Sub-components
// // ส่วนของฟังก์ชัน KPICard ที่ปรับปรุงใหม่
// function KPICard({ label, value, icon, color, textColor = "text-white" }: any) {
//     return (
        
//         <div className={`${color} p-2 rounded-[2.2rem] border border-white/10 backdrop-blur-md flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95`}>
//             <div className="mb-2 p-2 bg-white/10 rounded-xl text-white">
//                 {icon}
//             </div>
//             <p className={`text-[10px] font-bold uppercase tracking-wider opacity-80 mb-1 ${textColor}`}>
//                 {label}
//             </p>
//             {/* เน้นตัวเลขให้ใหญ่และหนาพิเศษ */}
//             <p className={`text-3xl font-black tracking-tighter ${textColor}`}>
//                 {value}
//             </p>
//         </div>
//     )
// }
// function MenuCard({ icon, title, desc, badge, color , onClick }: any) {
//     return (
//         <button 
//         onClick={onClick}
//         className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all active:scale-95">
//             <div className={`w-14 h-14 ${color} rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110`}>
//                 {icon}
//             </div>
//             <div className="flex-1 text-left">
//                 <div className="flex items-center gap-2">
//                     <p className="font-black text-slate-800 tracking-tight">{title}</p>
//                     {badge && <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full">{badge}</span>}
//                 </div>
//                 <p className="text-xs text-slate-400 font-medium">{desc}</p>
//             </div>
//             <ChevronRight className="text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" size={20} />
//         </button>
//     )
// }



// ver2
// ver2
"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    Users, ClipboardCheck, Clock,
    Bell, ChevronRight, CheckCircle,
    AlertCircle, PieChart, GraduationCap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import liff from '@line/liff'

export default function SupervisorDashboard() {
    // 🚩 สลับโหมดที่นี่: true = ดู Mockup / false = ดึงข้อมูลจริงจาก DB
    const isMockup = false 

    const themeColor = "bg-[#064e3b]"
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [supervisor, setSupervisor] = useState<any>(null)
    const [stats, setStats] = useState({ total: 0, evaluated: 0, pending: 0 })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        if (isMockup) {
            // จำลองการโหลดข้อมูล Mockup
            setTimeout(() => {
                setSupervisor({
                    full_name: "อ.สมชาย สายชล (Mockup)",
                    sites: { name: "รพ.สมเด็จพระยุพราชสายบุรี" },
                    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                })
                setStats({ total: 12, evaluated: 8, pending: 4 })
                setLoading(false)
            }, 1500)
        } else {
            fetchRealData()
        }
    }, [isMockup])

    const fetchRealData = async () => {
        try {
            await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
            if (!liff.isLoggedIn()) return liff.login()
            const profile = await liff.getProfile()

            const { data: svData } = await supabase
                .from('supervisors')
                .select('*, sites(name)')
                .eq('line_user_id', profile.userId)
                .single()
            
            if (svData) {
                setSupervisor(svData)
                const { data: assignments } = await supabase
                    .from('assignment_supervisors')
                    .select('id, is_evaluated')
                    .eq('supervisor_id', svData.id)

                if (assignments) {
                    const evaluated = assignments.filter(a => a.is_evaluated).length
                    setStats({
                        total: assignments.length,
                        evaluated: evaluated,
                        pending: assignments.length - evaluated
                    })
                }
            }
        } catch (error) {
            console.error("Dashboard Error:", error)
        } finally {
            setLoading(false)
        }
    }

    // --- Skeleton Loading Component ---
    if (loading) return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className={`${themeColor} p-8 pt-12 rounded-b-[3.5rem] h-64 animate-pulse`}>
                <div className="flex justify-between items-center mb-10">
                    <div className="space-y-3">
                        <div className="h-4 w-24 bg-white/20 rounded"></div>
                        <div className="h-8 w-48 bg-white/30 rounded-xl"></div>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/10 rounded-[2.2rem]"></div>)}
                </div>
            </div>
            <div className="px-6 -mt-8"><div className="h-24 bg-white rounded-[2.5rem] animate-pulse"></div></div>
            <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-[2.5rem] animate-pulse"></div>)}
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 animate-in fade-in duration-700">
            {/* --- Header Section --- */}
            <div className={`${themeColor} p-8 pt-12 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden`}>
                <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10">
                    <GraduationCap size={200} />
                </div>

                <div className="relative z-10 flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">
                                {isMockup ? "Mockup Mode" : "Supervisor Online"}
                            </p>
                        </div>
                        <h1 className="text-2xl font-black text-white">{supervisor?.full_name}</h1>
                        <p className="text-emerald-100/70 text-sm font-medium">{supervisor?.sites?.name}</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl border-4 border-white/20 shadow-inner overflow-hidden bg-white">
                        <img src={supervisor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback`} alt="avatar" className="w-full h-full object-cover" />
                    </div>
                </div>

                {/* --- KPI Cards --- */}
                <div className="p-2 relative z-10 grid grid-cols-3 gap-4">
                    <KPICard label="นศ. ทั้งหมด" value={stats.total} icon={<Users size={16} />} color="bg-white/10 text-white" />
                    <KPICard label="ประเมินแล้ว" value={stats.evaluated} icon={<CheckCircle size={16} />} color="bg-emerald-500/40 text-emerald-100" />
                    <KPICard label="ยังไม่ประเมิน" value={stats.pending} icon={<AlertCircle size={16} />} color="bg-rose-500/40 text-rose-100" />
                </div>
            </div>

            {/* --- Notification Bar --- */}
            <div className="px-6 -mt-8 relative z-20">
                <div className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100">
                        <Bell size={28} className={stats.pending > 0 ? "animate-bounce" : ""} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-black text-slate-800 text-sm">แจ้งเตือนการประเมิน</h3>
                        <p className="text-[11px] text-slate-400 font-bold italic">
                            {stats.pending > 0 ? `เหลือ นศ. ${stats.pending} คน ที่ยังไม่ประเมิน` : "ประเมินครบถ้วนแล้ว ยอดเยี่ยม!"}
                        </p>
                    </div>
                    {stats.pending > 0 && (
                        <button onClick={() => router.push('/supervisor/students')} className="bg-[#064e3b] text-white text-[10px] font-black px-5 py-3 rounded-2xl shadow-lg active:scale-95 transition-all">
                            ดูรายชื่อ
                        </button>
                    )}
                </div>
            </div>

            {/* --- Main Menus --- */}
            <div className="p-8 space-y-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">เมนูการจัดการ</h2>
                <MenuCard
                    onClick={() => router.push('/supervisor/students')}
                    icon={<Users size={24} />}
                    title="รายชื่อนักศึกษา"
                    desc="ดูรายชื่อ นศ. และเริ่มประเมิน"
                    badge={stats.total > 0 ? `${stats.total} คน` : null}
                    color="text-emerald-600 bg-emerald-50"
                />
                <MenuCard icon={<ClipboardCheck size={24} />} title="ประวัติประเมิน" desc="ดูคะแนนย้อนหลังและสรุปผล" color="text-blue-600 bg-blue-50" />
                <MenuCard icon={<Clock size={24} />} title="ตารางผลัดฝึก" desc="เช็กช่วงเวลาฝึกงานในแต่ละรอบ" color="text-purple-600 bg-purple-50" />
            </div>
        </div>
    )
}

function KPICard({ label, value, icon, color, textColor = "text-white" }: any) {
    return (
        <div className={`${color} p-2 rounded-[2.2rem] border border-white/10 backdrop-blur-md flex flex-col items-center justify-center shadow-lg transition-all active:scale-95`}>
            <div className="mb-2 p-2 bg-white/10 rounded-xl text-white">{icon}</div>
            <p className={`text-[9px] font-bold uppercase tracking-wider opacity-80 mb-1 text-center ${textColor}`}>{label}</p>
            <p className={`text-3xl font-black tracking-tighter ${textColor}`}>{value}</p>
        </div>
    )
}

function MenuCard({ icon, title, desc, badge, color, onClick }: any) {
    return (
        <button onClick={onClick} className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all active:scale-95">
            <div className={`w-14 h-14 ${color} rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110`}>{icon}</div>
            <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                    <p className="font-black text-slate-800 tracking-tight">{title}</p>
                    {badge && <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full">{badge}</span>}
                </div>
                <p className="text-xs text-slate-400 font-medium">{desc}</p>
            </div>
            <ChevronRight className="text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" size={20} />
        </button>
    )
}

