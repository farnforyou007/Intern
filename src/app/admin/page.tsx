"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    Users, Hospital, BookOpen, GraduationCap,
    AlertCircle, Clock, UserPlus, CheckCircle2, 
    ArrowUpRight, ListFilter, TrendingUp, FileText, 
    Activity, BellRing
} from 'lucide-react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { Skeleton } from "@/components/ui/skeleton"
import Swal from 'sweetalert2'

// --- Helper: แปลงเวลา ---
function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " ปีที่แล้ว";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " เดือนที่แล้ว";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " วันที่แล้ว";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " ชม.";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " นาที";
    return "เมื่อกี้";
}

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        students: 0,
        sites: 0,
        supervisors: 0,
        pendingSupervisors: 0,
        subjects: 0
    })
    
    // เก็บข้อมูลแยกตามประเภท
    const [rawActivities, setRawActivities] = useState({
        supervisors: [],
        sites: [],
        students: []
    })

    const [filterType, setFilterType] = useState('all') // 'all' | 'supervisor' | 'site' | 'student'

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchData()
        
        // Real-time Listener
        const channel = supabase.channel('admin-dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'supervisors' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'training_sites' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, () => fetchData())
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    const fetchData = async () => {
        // ไม่ set loading true ตรงนี้เพื่อให้ UI ไม่กระพริบตอน Realtime update
        try {
            // 1. ดึง KPI Stats
            const [
                { count: studentCount },
                { count: siteCount },
                { count: svCount },
                { count: pendingSvCount },
                { count: subjectCount }
            ] = await Promise.all([
                supabase.from('students').select('*', { count: 'exact', head: true }),
                supabase.from('training_sites').select('*', { count: 'exact', head: true }),
                supabase.from('supervisors').select('*', { count: 'exact', head: true }),
                supabase.from('supervisors').select('*', { count: 'exact', head: true }).eq('is_verified', false),
                supabase.from('subjects').select('*', { count: 'exact', head: true })
            ]);

            setStats({
                students: studentCount || 0,
                sites: siteCount || 0,
                supervisors: svCount || 0,
                pendingSupervisors: pendingSvCount || 0,
                subjects: subjectCount || 0
            })

            // 2. ดึง Recent Activities (อย่างละ 5)
            const [newSupervisors, newSites, newStudents] = await Promise.all([
                supabase.from('supervisors').select('id, full_name, created_at, is_verified').order('created_at', { ascending: false }).limit(5),
                supabase.from('training_sites').select('id, site_name, created_at').order('created_at', { ascending: false }).limit(5),
                supabase.from('students').select('id, first_name, last_name, created_at').order('created_at', { ascending: false }).limit(5)
            ]);

            setRawActivities({
                supervisors: (newSupervisors.data || []).map((item: any) => ({
                    id: `sv-${item.id}`, type: 'supervisor',
                    text: item.is_verified ? `อนุมัติ: คุณ${item.full_name}` : `สมัครใหม่: คุณ${item.full_name}`,
                    rawTime: item.created_at, time: timeAgo(item.created_at),
                    icon: item.is_verified ? <CheckCircle2 size={14}/> : <Users size={14}/>,
                    color: item.is_verified ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                })) as never[],
                sites: (newSites.data || []).map((item: any) => ({
                    id: `st-${item.id}`, type: 'site',
                    text: `เพิ่มแหล่งฝึก: ${item.site_name}`,
                    rawTime: item.created_at, time: timeAgo(item.created_at),
                    icon: <Hospital size={14}/>, color: "bg-blue-100 text-blue-600"
                })) as never[],
                students: (newStudents.data || []).map((item: any) => ({
                    id: `std-${item.id}`, type: 'student',
                    text: `นศ. ใหม่: ${item.first_name} ${item.last_name}`,
                    rawTime: item.created_at, time: timeAgo(item.created_at),
                    icon: <UserPlus size={14}/>, color: "bg-purple-100 text-purple-600"
                })) as never[]
            });

        } catch (error) {
            console.error("Error:", error)
        } finally {
            setLoading(false)
        }
    }

    // รวมและกรองข้อมูล
    const getDisplayedActivities = () => {
        let combined: any[] = [];
        if (filterType === 'all') {
            combined = [...rawActivities.supervisors, ...rawActivities.sites, ...rawActivities.students];
        } else if (filterType === 'supervisor') combined = rawActivities.supervisors;
        else if (filterType === 'site') combined = rawActivities.sites;
        else if (filterType === 'student') combined = rawActivities.students;

        return combined.sort((a, b) => new Date(b.rawTime).getTime() - new Date(a.rawTime).getTime());
    }

    const displayedActivities = getDisplayedActivities();

    // ปุ่มส่งแจ้งเตือน (จำลอง)
    const handleNotify = async () => {
        const result = await Swal.fire({
            title: 'ส่งแจ้งเตือนพี่เลี้ยง?',
            text: `ระบบจะส่งข้อความแจ้งเตือนไปยังพี่เลี้ยงที่มีรายการประเมินค้างอยู่ทั้งหมด`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันส่ง',
            confirmButtonColor: '#064e3b',
            cancelButtonText: 'ยกเลิก',
            customClass: { popup: 'rounded-[2rem] font-sans' }
        })

        if (result.isConfirmed) {
            Swal.fire({ title: 'กำลังส่ง...', didOpen: () => Swal.showLoading() })
            // ใส่ Code เรียก API จริงตรงนี้
            setTimeout(() => {
                Swal.fire('สำเร็จ', 'ส่งแจ้งเตือนเรียบร้อยแล้ว', 'success')
            }, 1500)
        }
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto space-y-8 font-sans">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Real-time Dashboard</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">ภาพรวมระบบ</h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                        <Clock size={16} />
                        {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </div>
                </div>

                {/* Alert Zone */}
                {!loading && stats.pendingSupervisors > 0 && (
                    <div className="bg-orange-50 border border-orange-100 rounded-[2rem] p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm animate-in slide-in-from-top-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl shrink-0"><AlertCircle size={24} /></div>
                        <div className="flex-1">
                            <h3 className="text-lg font-black text-orange-800">มีการร้องขอสิทธิ์เข้าใช้งาน {stats.pendingSupervisors} รายการ</h3>
                            <p className="text-orange-600/80 text-sm mt-1">พี่เลี้ยงลงทะเบียนใหม่ กำลังรอการอนุมัติ</p>
                        </div>
                        <Link href="/admin/personnel">
                            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-orange-200 transition-all active:scale-95">ตรวจสอบ</button>
                        </Link>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard label="นักศึกษา" value={stats.students} icon={<GraduationCap size={24} />} color="bg-blue-600" subLabel="ลงทะเบียนแล้ว" loading={loading} />
                    <StatCard label="แหล่งฝึกงาน" value={stats.sites} icon={<Hospital size={24} />} color="bg-emerald-500" subLabel="หน่วยงานในระบบ" loading={loading} />
                    <StatCard label="บุคลากร" value={stats.supervisors} icon={<Users size={24} />} color="bg-purple-500" subLabel="อาจารย์/พี่เลี้ยง" loading={loading} />
                    <StatCard label="รายวิชา" value={stats.subjects} icon={<BookOpen size={24} />} color="bg-amber-500" subLabel="วิชาที่เปิดฝึก" loading={loading} />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column (Menu & Chart) */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Quick Menu */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <ArrowUpRight size={24} className="text-slate-400"/> เมนูด่วน
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <QuickMenuCard href="/admin/students" icon={<UserPlus size={24}/>} label="จัดการนักศึกษา" color="text-blue-600 bg-blue-50 hover:bg-blue-100" />
                                <QuickMenuCard href="/admin/sites" icon={<Hospital size={24}/>} label="จัดการแหล่งฝึก" color="text-emerald-600 bg-emerald-50 hover:bg-emerald-100" />
                                <QuickMenuCard href="/admin/rotations" icon={<Clock size={24}/>} label="จัดการผลัด" color="text-orange-600 bg-orange-50 hover:bg-orange-100" />
                                <QuickMenuCard href="/admin/templates" icon={<FileText size={24}/>} label="แบบประเมิน" color="text-pink-600 bg-pink-50 hover:bg-pink-100" />
                                <QuickMenuCard href="/admin/supervisors" icon={<CheckCircle2 size={24}/>} label="อนุมัติผู้ใช้" color="text-purple-600 bg-purple-50 hover:bg-purple-100" />
                                {/* ปุ่มส่งแจ้งเตือน (เผื่อไว้) */}
                                <button onClick={handleNotify} className="flex flex-col items-center justify-center gap-3 p-6 rounded-[1.8rem] border border-transparent transition-all cursor-pointer group bg-slate-50 hover:bg-slate-100 text-slate-600">
                                    <div className="p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300 text-slate-600">
                                        <BellRing size={24}/>
                                    </div>
                                    <span className="font-bold text-sm text-slate-600">แจ้งเตือน</span>
                                </button>
                            </div>
                        </div>

                        {/* Chart Area */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 min-h-[350px] flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-2 animate-bounce">
                                <TrendingUp size={40} />
                            </div>
                            <div className="z-10">
                                <h3 className="text-lg font-black text-slate-900">สถิติ</h3>
                                <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">
                                    ระบบกำลังเก็บรวบรวมข้อมูลเพื่อแสดงกราฟความคืบหน้าการฝึกงานของนักศึกษา
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Recent Activity */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 h-full flex flex-col min-h-[600px]">
                            
                            {/* Header & Small Filter Tabs */}
                            <div className="flex items-center justify-between mb-6 px-2">
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <ListFilter size={20} className="text-slate-400"/> ความเคลื่อนไหว
                                </h3>
                                {/* Small Tabs (Icon Only) */}
                                <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                                    <button 
                                        onClick={() => setFilterType('all')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        ALL
                                    </button>
                                    <FilterIconBtn active={filterType === 'supervisor'} onClick={() => setFilterType('supervisor')} icon={<Users size={14}/>} />
                                    <FilterIconBtn active={filterType === 'site'} onClick={() => setFilterType('site')} icon={<Hospital size={14}/>} />
                                    <FilterIconBtn active={filterType === 'student'} onClick={() => setFilterType('student')} icon={<GraduationCap size={14}/>} />
                                </div>
                            </div>

                            {/* List Content (Fixed Height + Scroll) */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar h-[500px]">
                                <div className="space-y-3">
                                    {loading ? (
                                        // Skeleton Loading
                                        Array(6).fill(0).map((_, i) => (
                                            <div key={i} className="flex gap-4 p-2 animate-pulse">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl shrink-0" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                                                    <div className="h-2 bg-slate-100 rounded w-1/2" />
                                                </div>
                                            </div>
                                        ))
                                    ) : displayedActivities.length > 0 ? (
                                        displayedActivities.map((item, index) => (
                                            <div key={item.id} className="flex gap-4 group p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-default animate-in slide-in-from-right-4" style={{ animationDelay: `${index * 50}ms` }}>
                                                <div className="flex flex-col items-center">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} shadow-sm shrink-0`}>
                                                        {item.icon}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-800 leading-tight truncate">{item.text}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock size={10} className="text-slate-300" />
                                                        <p className="text-[10px] text-slate-400 font-bold">{item.time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 text-slate-300">
                                            <p className="text-sm font-bold">ไม่มีข้อมูลในหมวดนี้</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-50 text-center">
                                <span className="text-[10px] text-slate-300 font-bold">แสดงข้อมูลล่าสุด</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    )
}

// --- Sub-components ---

function FilterIconBtn({ active, onClick, icon }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${active ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'}`}
        >
            {icon}
        </button>
    )
}

function StatCard({ label, value, icon, color, subLabel, loading }: any) {
    return (
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-125 transition-transform duration-500 ${color}`} />
            <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
                {loading ? <Skeleton className="h-9 w-24 mt-1 rounded-lg" /> : <h2 className="text-3xl font-black text-slate-900">{value.toLocaleString()}</h2>}
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{subLabel}</p>
            </div>
        </div>
    )
}

function QuickMenuCard({ href, icon, label, color }: any) {
    return (
        <Link href={href}>
            <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[1.8rem] border border-transparent transition-all cursor-pointer group ${color.replace('text-', 'border-').replace('bg-', 'bg-opacity-30 ')}`}>
                <div className={`p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform duration-300 ${color.split(' ')[0]}`}>{icon}</div>
                <span className={`font-bold text-sm ${color.split(' ')[0]}`}>{label}</span>
            </div>
        </Link>
    )
}