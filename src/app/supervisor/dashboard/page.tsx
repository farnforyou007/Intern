// ver3 — API Routes Migration
"use client"
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr' // เก็บไว้สำหรับ Realtime เท่านั้น
import {
    Users, ClipboardCheck, Clock,
    Bell, ChevronRight, ChevronDown, CheckCircle,
    AlertCircle, PieChart, GraduationCap, LogOut,
    HelpCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import liff from '@line/liff'
import Swal from 'sweetalert2'
import { getLineUserId } from '@/utils/auth';
import SupervisorTour from '@/components/supervisor/SupervisorTour'
interface AssignmentItem {
    id: string;
    is_evaluated: boolean;
    student_assignments?: {
        id: string;
    };

}

export default function SupervisorDashboard() {
    // 🚩 สลับโหมดที่นี่: true = ดู Mockup / false = ดึงข้อมูลจริงจาก DB
    const isMockup = false

    const themeColor = "bg-[#064e3b]"
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [supervisor, setSupervisor] = useState<any>(null)
    const [stats, setStats] = useState({ total: 0, evaluated: 0, pending: 0, partial: 0 })
    const [daysLeft, setDaysLeft] = useState<number | null>(null)
    const [pendingStudentsCount, setPendingStudentsCount] = useState(0)
    const [alertStatus, setAlertStatus] = useState<'normal' | 'overdue'>('normal')
    const [urgentRotationName, setUrgentRotationName] = useState<string>("")
    const [configYear, setConfigYear] = useState<string>('')
    const [subjectNames, setSubjectNames] = useState<string[]>([])
    const [rotationAlerts, setRotationAlerts] = useState<any[]>([])
    const [showAlertDetails, setShowAlertDetails] = useState(false)
    const [showTour, setShowTour] = useState(false)
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)

    // เก็บ supabase client ไว้สำหรับ Realtime subscription เท่านั้น
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        if (isMockup) {
            setTimeout(() => {
                setSupervisor({
                    full_name: "อ.สมชาย สายชล (Mockup)",
                    sites: { name: "รพ.สมเด็จพระยุพราชสายบุรี" },
                    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                })
                setStats({ total: 12, evaluated: 8, pending: 2, partial: 2 })
                setLoading(false)
            }, 1500)
        } else {
            fetchRealData()
        }
    }, [isMockup])

    const fetchRealData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // ดึง lineUserId จาก LIFF / debug mode
            const urlParams = new URLSearchParams(window.location.search);
            const lineUserId = await getLineUserId(urlParams);
            if (!lineUserId) return;

            // เรียก API Route แทน Supabase โดยตรง
            const res = await fetch('/api/supervisor/dashboard', {
                headers: { 'X-Line-User-Id': lineUserId }
            })
            const result = await res.json()

            if (!result.success) {
                console.error('Dashboard API Error:', result.error)
                return
            }

            const { supervisor: svData, stats: apiStats, daysLeft: apiDaysLeft, alertStatus: apiAlertStatus, urgentRotationName: apiRotName, pendingStudentsCount: apiPendingCount, configYear: apiYear } = result.data

            setSupervisor(svData)
            setStats(apiStats)
            setDaysLeft(apiDaysLeft)
            setAlertStatus(apiAlertStatus)
            setUrgentRotationName(apiRotName)
            setPendingStudentsCount(apiPendingCount)
            setConfigYear(apiYear)
            setSubjectNames(result.data.subjectNames || [])
            setRotationAlerts(result.data.rotationAlerts || [])
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoading(false);

            // แสดง Tour อัตโนมัติเมื่อเข้ามาครั้งแรก
            if (!localStorage.getItem('supervisor_tour_seen')) {
                localStorage.setItem('supervisor_tour_seen', 'true');
                setTimeout(() => setShowTour(true), 800);
            }
        }
    };

    // 🚩 ตัวอย่างการดักจับความเปลี่ยนแปลงแบบ Realtime
    useEffect(() => {
        fetchRealData();

        const handleRealtime = () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            debounceTimer.current = setTimeout(() => {
                fetchRealData(true); // Silent update
            }, 1500)
        }

        // ฟังการเปลี่ยนแปลงในตาราง assignment_supervisors
        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'assignment_supervisors' },
                handleRealtime
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel); // ปิด Channel เมื่อออกจากหน้า
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        };
    }, []);

    useEffect(() => {
        fetchRealData(); // ดึงข้อมูลใหม่ทุกครั้งที่เข้ามาที่หน้านี้
    }, []);

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'ออกจากระบบ?',
            text: "คุณต้องการออกจากระบบและล้างข้อมูลแคชทั้งหมดใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#064e3b',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            customClass: { popup: 'rounded-[2rem] font-sans' }
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                // 1. Clear Supabase Session
                await supabase.auth.signOut();

                // 2. Clear Local/Session Storage
                localStorage.clear();
                localStorage.removeItem('debug_mode');
                sessionStorage.clear();

                // 3. ล้าง Cache Storage (ถ้ามี)
                if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                }

                // 4. ออกจากระบบ LINE LIFF
                if (liff.isLoggedIn()) {
                    liff.logout();
                }

                // 5. ส่งกลับหน้าหลักและบังคับรีโหลดเพื่อล้าง Memory
                window.location.replace('/');
            } catch (error) {
                console.error("Logout error:", error);
                window.location.replace('/');
            }
        }
    };

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

    const profileImage = supervisor?.avatar_url
        ? (supervisor.avatar_url.startsWith('http')
            ? supervisor.avatar_url
            : `https://vvxsfibqlpkpzqyjwmuw.supabase.co/storage/v1/object/public/avatars/${supervisor.avatar_url}`)
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${supervisor?.id || 'fallback'}`;

    // console.log("Current Supervisor Image:", supervisor?.avatar_url)
    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 animate-in fade-in duration-700">
            {/* --- Header Section --- */}
            <div className={`${themeColor} p-8 pt-12 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden`}>
                <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10">
                    <GraduationCap size={200} />
                </div>

                {/* ปุ่ม Logout — มุมบนขวาสุด */}
                <button
                    onClick={handleLogout}
                    className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-rose-500/80 transition-all active:scale-95 shadow-lg"
                    title="ออกจากระบบ"
                >
                    <LogOut size={14} />
                </button>

                <div className="relative z-10 flex justify-between items-center mb-6" id="welcome-section">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">
                                {isMockup ? "Mockup Mode" : "Supervisor Online"}
                            </p>
                        </div>
                        <h1 className="text-2xl font-black text-white">{supervisor?.full_name}</h1>
                        <p className="text-emerald-100/70 text-sm font-medium">{supervisor?.training_sites?.site_name}</p>
                        {/* วิชาที่รับผิดชอบ */}
                        {subjectNames.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {subjectNames.map((name, i) => (
                                    <span key={i} className="bg-white/10 backdrop-blur-sm text-emerald-100 text-[9px] font-bold px-2.5 py-1 rounded-full border border-white/10">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        )}
                        {/* 🔒 Badge ปีการศึกษา */}
                        {configYear && (
                            <span className="inline-flex items-center gap-1.5 mt-2 bg-white/15 backdrop-blur-sm text-emerald-100 text-[10px] font-black px-3 py-1 rounded-full border border-white/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                ปีการศึกษา {configYear}
                            </span>
                        )}
                    </div>

                    <div className="w-20 h-20 rounded-2xl border-4 border-white/20 shadow-inner overflow-hidden bg-white">
                        <img
                            src={profileImage}
                            alt="avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
                            }}
                        />
                    </div>
                </div>

                {/* --- KPI Cards --- */}
                {/* <div className="p-2 relative z-10 grid grid-cols-3 gap-4">
                    <KPICard label="นศ. ทั้งหมด" value={stats.total} icon={<Users size={16} />} color="bg-white/10 text-white" />
                    <KPICard label="ประเมินแล้ว" value={stats.evaluated} icon={<CheckCircle size={16} />}  />
                    <KPICard label="ยังไม่ประเมิน" value={stats.pending} icon={<AlertCircle size={16} />} color="bg-rose-500/40 text-rose-100" />
                </div> */}

                <div className="p-2 relative z-10 grid grid-cols-2 gap-3">
                    <KPICard label="นักศึกษาที่รับผิดชอบ" value={stats.total} icon={<Users size={16} />} color="bg-white/10 text-white" />
                    <KPICard label="ประเมินครบ" value={stats.evaluated} icon={<CheckCircle size={16} />} color="bg-emerald-500/40 text-emerald-100" />
                    <KPICard label="ประเมินบางส่วน" value={stats.partial} icon={<Clock size={16} />} color="bg-amber-500/40 text-amber-100" />
                    <KPICard label="ยังไม่ประเมิน" value={stats.pending} icon={<AlertCircle size={16} />} color="bg-rose-500/40 text-rose-100" />
                </div>


            </div>

            {/* --- Notification Bar --- */}
            {/* <div className="px-6 -mt-8 relative z-20">
                <div className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100">
                        <Bell size={28} className={stats.pending > 0 ? "animate-bounce" : ""} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-black text-slate-800 text-sm">
                            {daysLeft !== null
                                ? `สิ้นสุดผลัดใน ${daysLeft} วัน`
                                : 'การแจ้งเตือน'}
                        </h3>
                     
                        <p className="text-[11px] text-slate-400 font-bold italic">
                            {stats.pending > 0
                                ? `เหลือ นศ. ${pendingStudentsCount} คน (${stats.pending} รายการ) ที่ยังไม่ประเมิน`
                                : "ประเมินครบถ้วนแล้ว ยอดเยี่ยม!"}
                        </p>
                    </div>
                    {stats.pending > 0 && (
                        <button onClick={() => router.push('/supervisor/students')} className="bg-[#064e3b] text-white text-[10px] font-black px-5 py-3 rounded-2xl shadow-lg active:scale-95 transition-all">
                            ดูรายชื่อ
                        </button>
                    )}
                </div>
            </div> */}

            {/* --- Notification Bar (Facebook-style) — ซ่อนเมื่อยังไม่มี นศ. --- */}
            {stats.total > 0 && (
            <div className="px-6 -mt-8 relative z-20">
                <div className={`rounded-[2.5rem] shadow-xl shadow-slate-200/60 border transition-colors overflow-hidden ${alertStatus === 'overdue' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-50'}`}>
                    {/* Main notification row */}
                    <button
                        onClick={() => rotationAlerts.length > 0 && setShowAlertDetails(prev => !prev)}
                        className="w-full px-5 py-4 flex items-center gap-4 text-left"
                    >
                        {/* ไอคอน + Badge มุมบนขวา */}
                        <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${alertStatus === 'overdue'
                                ? 'bg-red-100 text-red-500 border-red-200'
                                : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                                {alertStatus === 'overdue' ? <AlertCircle size={24} className="animate-pulse" /> : <Bell size={24} />}
                            </div>
                            {rotationAlerts.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                                    {rotationAlerts.length}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className={`font-black text-sm leading-tight ${alertStatus === 'overdue' ? 'text-red-700' : 'text-slate-800'}`}>
                                {daysLeft !== null
                                    ? (alertStatus === 'overdue'
                                        ? `${urgentRotationName} ล่าช้า ${daysLeft} วัน`
                                        : `สิ้นสุด ${urgentRotationName} ใน ${daysLeft} วัน`)
                                    : 'การแจ้งเตือน'}
                            </h3>
                            <p className={`text-[11px] font-bold italic mt-0.5 ${alertStatus === 'overdue' ? 'text-red-400' : 'text-slate-400'}`}>
                                {stats.pending > 0 && stats.partial > 0
                                    ? `ยังไม่ประเมิน ${stats.pending} · กำลังประเมิน ${stats.partial} รายการ`
                                    : stats.pending > 0
                                        ? `เหลือ นศ. ${pendingStudentsCount} คน (${stats.pending} รายการ) ที่ต้องประเมิน`
                                        : stats.partial > 0
                                            ? `เหลืออีก ${stats.partial} รายการที่ประเมินยังไม่ครบ`
                                            : "ประเมินครบถ้วนแล้ว ยอดเยี่ยม! 🎉"}
                            </p>
                        </div>

                        {/* ลูกศร */}
                        {rotationAlerts.length > 0 && (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${alertStatus === 'overdue' ? 'bg-red-100 text-red-400' : 'bg-slate-100 text-slate-400'}`}>
                                <ChevronDown size={18} className={`transition-transform duration-300 ${showAlertDetails ? 'rotate-180' : ''}`} />
                            </div>
                        )}
                    </button>

                    {/* Expandable rotation detail list — ซ่อนจริงๆ ด้วย hidden */}
                    {showAlertDetails && (
                        <div className="px-4 pb-4 space-y-2 border-t border-dashed border-slate-200/60 pt-3 animate-in slide-in-from-top-2 duration-200">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">รายละเอียดแต่ละผลัด</p>
                            {rotationAlerts.map((ra: any, idx: number) => (
                                <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border ${ra.status === 'overdue'
                                    ? 'bg-red-50/80 border-red-100'
                                    : 'bg-amber-50/60 border-amber-100'
                                    }`}>
                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${ra.status === 'overdue' ? 'bg-red-400 animate-pulse' : 'bg-amber-400'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[11px] font-black truncate ${ra.status === 'overdue' ? 'text-red-700' : 'text-slate-700'}`}>{ra.rotationName}</p>
                                        <p className={`text-[9px] font-bold ${ra.status === 'overdue' ? 'text-red-400' : 'text-amber-600'}`}>
                                            {ra.status === 'overdue'
                                                ? `ล่าช้า ${ra.daysLeft} วัน`
                                                : `เหลืออีก ${ra.daysLeft} วัน`}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`text-base font-black leading-none ${ra.status === 'overdue' ? 'text-red-500' : 'text-amber-500'}`}>{ra.pendingCount}</p>
                                        <p className="text-[8px] text-slate-400 font-bold">/{ra.totalCount} รายการ</p>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => router.push('/supervisor/students')}
                                className={`w-full text-white text-[11px] font-black py-2.5 rounded-xl shadow active:scale-95 transition-all ${alertStatus === 'overdue' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#064e3b] hover:bg-[#043e2f]'}`}
                            >
                                {alertStatus === 'overdue' ? '⚡ เคลียร์ด่วน' : 'ดูรายชื่อทั้งหมด'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
            )}

            {/* 🔒 แจ้งเตือนเมื่อไม่มีนักศึกษาในความดูแล */}
            {
                stats.total === 0 && !loading && (
                    <div className="mx-6 -mt-6 relative z-20">
                        <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/60 text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-4">
                                <Users size={32} />
                            </div>
                            <p className="text-sm font-black text-slate-800">ไม่พบรายชื่อนักศึกษาที่รับผิดชอบ</p>
                            <p className="text-xs text-slate-400 font-medium mt-1.5 leading-relaxed">
                                สามารถเพิ่มนักศึกษาที่รับผิดชอบได้ที่เมนู<br />"รายชื่อนักศึกษา" → แถบ "นศ. ทั้งหมด"
                            </p>
                            <button
                                onClick={() => router.push('/supervisor/students')}
                                className="mt-4 bg-[#064e3b] text-white text-xs font-black px-6 py-3 rounded-2xl shadow-lg active:scale-95 transition-all hover:bg-[#043e2f] inline-flex items-center gap-2"
                            >
                                <Users size={14} />
                                ไปที่รายชื่อนักศึกษา
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )
            }

            <div className="p-8 space-y-4" id="tour-step-process">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">เมนูการจัดการ</h2>
                    <button
                        onClick={() => setShowTour(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-bold text-[10px] hover:bg-emerald-100 transition-all active:scale-95"
                    >
                        <HelpCircle size={14} />
                        แนะนำการใช้งาน
                    </button>
                </div>
                <div id="menu-students">
                    <MenuCard
                        onClick={() => router.push('/supervisor/students')}
                        icon={<Users size={24} />}
                        title="รายชื่อนักศึกษา"
                        desc="ดูรายชื่อ นศ. และเริ่มประเมิน"
                        badge={stats.total > 0 ? `${stats.total} คน` : null}
                        color="text-emerald-600 bg-emerald-50"
                    />
                </div>
                <div id="menu-history">
                    <MenuCard icon={<ClipboardCheck size={24} />}
                        onClick={() => router.push('/supervisor/history')}
                        title="ประวัติประเมิน"
                        desc="ดูคะแนนย้อนหลังหรือแก้ไขคะแนนที่ประเมินแล้ว"
                        color="text-blue-600 bg-blue-50" />
                </div>
                <div id="menu-schedule">
                    <MenuCard icon={<Clock size={24} />}
                        onClick={() => router.push('/supervisor/schedule')}
                        title="ตารางผลัดฝึก"
                        desc="เช็กช่วงเวลาฝึกงานในแต่ละรอบ"
                        color="text-purple-600 bg-purple-50" />
                </div>
            </div>

            {/* Tour Component */}
            <SupervisorTour startTour={showTour} onComplete={() => setShowTour(false)} />
        </div >
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

