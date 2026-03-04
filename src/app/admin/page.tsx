"use client"
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    Users, Hospital, BookOpen, GraduationCap,
    AlertCircle, Clock, UserPlus, CheckCircle2,
    ArrowUpRight, ListFilter, TrendingUp, FileText,
    Activity, BellRing, CalendarDays
} from 'lucide-react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { Skeleton } from "@/components/ui/skeleton"
import Swal from 'sweetalert2'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
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

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const colorMap: any = {
            'ประเมินแล้ว': '#10b981',
            'ประเมินแล้วบางส่วน': '#f59e0b',
            'ยังไม่ประเมิน': '#94a3b8' // สีเทาให้ตรงกับกราฟ
        };
        return (
            <div className="bg-white p-4 rounded-2xl shadow-xl border-none font-sans">
                <p className="text-sm font-extrabold text-slate-800 mb-2">{label}</p>
                <div className="space-y-1">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-8">
                            <span className="text-[12px] font-bold text-slate-500">
                                {entry.name}:
                            </span>
                            <span
                                className="text-[12px] font-black"
                                style={{ color: colorMap[entry.name] || '#64748b' }}
                            >
                                {entry.value} รายการ
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export default function AdminDashboard() {
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        students: 0,
        sites: 0,
        supervisors: 0,
        pendingSupervisors: 0,
        subjects: 0
    })

    const [evalStats, setEvalStats] = useState({
        total: 0,
        completed: 0,
        pending: 0,
        inProgress: 0,
        percent: 0
    })

    // เก็บข้อมูลแยกตามประเภท
    const [rawActivities, setRawActivities] = useState({
        supervisors: [],
        sites: [],
        students: []
    })
    // const [chartData, setChartData] = useState<any[]>([]);
    const [chartData, setChartData] = useState<{ main: any[], sub: any[] }>({
        main: [],
        sub: []
    })
    const [summaryData, setSummaryData] = useState<any[]>([]);
    const [allSubjects, setAllSubjects] = useState<any[]>([]);
    const [filterType, setFilterType] = useState('all') // 'all' | 'supervisor' | 'site' | 'student'
    const [viewType, setViewType] = useState<'main' | 'sub'>('main');
    const [subjectRatioData, setSubjectRatioData] = useState<any[]>([]);
    // 🔒 Year filter
    const [selectedYear, setSelectedYear] = useState<string>('')
    const [yearOptions, setYearOptions] = useState<string[]>([])
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)
    // เก็บ supabase client ไว้สำหรับ Realtime subscription เท่านั้น
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchData()

        const handleRealtime = () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            debounceTimer.current = setTimeout(() => {
                fetchData(true) // Silent update
            }, 1500)
        }

        // Real-time Listener
        const channel = supabase.channel('admin-dashboard-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, handleRealtime)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'supervisors' }, handleRealtime)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'training_sites' }, handleRealtime)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, handleRealtime)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        }
    }, [selectedYear])

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const yearParam = selectedYear ? `?year=${selectedYear}` : ''
            const res = await fetch(`/api/admin/dashboard${yearParam}`)
            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            const { stats: apiStats, evalStats: apiEvalStats, activities, chartData: apiChartData, summaryData: apiSummaryData, subjectRatioData: apiRatioData, selectedYear: apiYear, yearOptions: apiYearOptions } = result.data

            setStats(apiStats)
            setEvalStats(apiEvalStats)
            setChartData(apiChartData)
            setSummaryData(apiSummaryData)
            setSubjectRatioData(apiRatioData)

            // ถ้ายังไม่ได้ตั้งปี → ใช้ค่า default จาก server
            if (!selectedYear && apiYear) {
                setSelectedYear(apiYear)
            }
            setYearOptions(apiYearOptions)

            // Reconstruct activities (เพิ่ม icon/color ฝั่ง client เพราะ JSX serialize ไม่ได้)
            setRawActivities({
                supervisors: (activities.supervisors || []).map((item: any) => ({
                    id: item.id,
                    type: 'supervisor',
                    text: item.is_verified ? `อนุมัติ: คุณ${item.name}` : `สมัครใหม่: คุณ${item.name}`,
                    rawTime: item.created_at,
                    time: timeAgo(item.created_at),
                    icon: item.is_verified ? <CheckCircle2 size={14} /> : <Users size={14} />,
                    color: item.is_verified ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"
                })) as never[],
                sites: (activities.sites || []).map((item: any) => ({
                    id: item.id,
                    type: 'site',
                    text: `เพิ่มแหล่งฝึก: ${item.name}`,
                    rawTime: item.created_at,
                    time: timeAgo(item.created_at),
                    icon: <Hospital size={14} />,
                    color: "bg-blue-100 text-blue-600"
                })) as never[],
                students: (activities.students || []).map((item: any) => ({
                    id: item.id,
                    type: 'student',
                    text: `นศ. ใหม่: ${item.name}`,
                    rawTime: item.created_at,
                    time: timeAgo(item.created_at),
                    icon: <UserPlus size={14} />,
                    color: "bg-purple-100 text-purple-600"
                })) as never[]
            })
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
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Real-time Dashboard</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                            <Activity className="text-blue-600" size={24} /> ภาพรวมระบบ
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium text-sm">ข้อมูลสรุปและสถานะการดำเนินงานของระบบฝึกงาน</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                        {/* 🔒 Year Filter */}
                        <div className="flex items-center gap-2 bg-white px-4 h-12 rounded-xl border border-slate-200 shadow-sm grow sm:grow-0">
                            <CalendarDays size={18} className="text-emerald-500" />
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="text-sm font-black text-emerald-600 bg-transparent outline-none cursor-pointer"
                            >
                                {yearOptions.map(year => (
                                    <option key={year} value={year}>ปีการศึกษา {year}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-white px-4 h-12 rounded-xl shadow-sm border border-slate-100 whitespace-nowrap">
                            <Clock size={18} className="text-slate-400" />
                            {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </div>
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
                        <Link href="/admin/supervisors">
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

                {/* Evaluation KPI Section (เพิ่มใหม่) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-[#064e3b] rounded-[2.5rem] p-8 text-white shadow-xl shadow-emerald-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                        {/* ตกแต่งพื้นหลัง */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>

                        {/* Progress Circle (จำลองด้วย SVG) */}
                        <div className="relative w-32 h-32 shrink-0">
                            <svg className="w-full h-full" viewBox="0 0 36 36">
                                <path className="text-white/20" strokeDasharray="100, 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="text-emerald-400" strokeDasharray={`${evalStats.percent}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black">{evalStats.percent}%</span>
                                <span className="text-[8px] uppercase font-bold text-emerald-200">ประเมินแล้ว</span>
                            </div>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-xl font-black">ความคืบหน้าการประเมิน</h3>
                                <p className="text-emerald-100/70 text-sm">ภาพรวมการส่งแบบประเมินจากพี่เลี้ยงทุกคนในระบบ</p>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white/10 p-4 rounded-2xl">
                                    <p className="text-[10px] font-bold uppercase text-emerald-200">ทั้งหมด</p>
                                    <p className="text-xl font-black">{evalStats.total}</p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-2xl border-b-4 border-emerald-400">
                                    <p className="text-[10px] font-bold uppercase text-emerald-200">เสร็จแล้ว</p>
                                    <p className="text-xl font-black">{evalStats.completed}</p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-2xl border-b-4 border-orange-300">
                                    <p className="text-[10px] font-bold uppercase text-emerald-200">ประเมินบางส่วน</p>
                                    <p className="text-xl font-black">{evalStats.inProgress}</p>
                                </div>
                                <div className="bg-white/10 p-4 rounded-2xl border-b-4 border-red-400">
                                    <p className="text-[10px] font-bold uppercase text-emerald-200">ยังไม่ประเมิน</p>
                                    <p className="text-xl font-black">{evalStats.pending}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* การแจ้งเตือนด่วน */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 flex flex-col justify-center items-center text-center space-y-4 shadow-sm">
                        <div className="p-4 bg-orange-50 text-orange-500 rounded-2xl">
                            <BellRing size={32} />
                        </div>
                        <div>
                            <h4 className="font-black text-slate-900">เร่งการประเมิน</h4>
                            <p className="text-xs text-slate-400 mt-1">มีรายการค้างประเมินสะสม {evalStats.pending} รายการ</p>
                        </div>
                        <button
                            onClick={handleNotify}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all active:scale-95"
                        >
                            ส่งแจ้งเตือน LINE ทันที
                        </button>
                    </div>
                </div>



                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (Menu & Chart) */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
                            {/* <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">ความคืบหน้าแยกตามรายวิชา</h3>
                                    <p className="text-slate-400 text-xs mt-1">เปรียบเทียบจำนวนการประเมินที่เสร็จสิ้นในแต่ละวิชา</p>
                                </div>
                            </div>

                            <div className="h-[300px] w-full">
                                //  <ResponsiveContainer width="100%" height="100%">
                                //     <BarChart data={chartData} 
                                //     margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                //         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                //         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600, fill: '#64748b' }} dy={10} />
                                //         <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                //         <Tooltip
                                //             cursor={{ fill: '#f8fafc' }}
                                //             contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                //         />
                                //         <Bar dataKey="completed" name="ประเมินแล้ว" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                                //         <Bar dataKey="pending" name="ค้างประเมิน" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={30} />
                                //     </BarChart>
                                // </ResponsiveContainer> 
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        layout="vertical"
                                        margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" axisLine={false} tickLine={false} hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            width={100}
                                            tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="completed" stackId="a" name="ประเมินแล้ว" fill="#10b981" radius={[0, 0, 0, 0]} barSize={20} />
                                        <Bar dataKey="pending" stackId="a" name="ค้างประเมิน" fill="#e2e8f0" radius={[0, 4, 4, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div> */}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">
                                        {viewType === 'main' ? 'ภาพรวมวิชาหลัก' : 'รายละเอียดวิชาย่อย'}
                                    </h3>
                                    <p className="text-slate-400 text-xs mt-1">
                                        {viewType === 'main' ? 'รวมวิชาย่อยเข้าสู่หมวดหมู่หลัก' : 'แสดงแยกตามรายวิชาที่มีการฝึกงาน'}
                                    </p>
                                </div>

                                {/* View Switcher: สลับโหมด วิชาหลัก / วิชาย่อย */}
                                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                    <button
                                        onClick={() => setViewType('main')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewType === 'main' ? 'bg-[#064e3b] text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        วิชาหลัก
                                    </button>
                                    <button
                                        onClick={() => setViewType('sub')}
                                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${viewType === 'sub' ? 'bg-[#064e3b] text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        วิชาย่อย
                                    </button>
                                </div>
                            </div>

                            {/* กราฟแท่ง (ใช้ข้อมูลตามโหมดที่เลือก) */}
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={viewType === 'main' ? chartData.main : chartData.sub}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={true} horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            width={140}
                                            tick={{ fontSize: 11, fontWeight: 800, fill: '#334155' }}
                                        />

                                        <Tooltip
                                            content={<CustomTooltip />}
                                            cursor={{ fill: '#f8fafc' }}
                                        />

                                        <Bar dataKey="completed" stackId="a" name="ประเมินแล้ว" fill="#10b981" radius={[0, 0, 0, 0]} barSize={24} />
                                        <Bar dataKey="inProgress" stackId="a" name="ประเมินแล้วบางส่วน" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={24} />
                                        <Bar dataKey="pending" stackId="a" name="ยังไม่ประเมิน" fill="#e2e8f0" radius={[0, 6, 6, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Chart Area */}
                        {/* <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 min-h-[350px] flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden">
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

                        </div> */}

                        {/* 2. Sub-Grid: สองกราฟวงกลมคู่กัน */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* กราฟวงกลม 1: สัดส่วนสถานะ */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
                                <h3 className="text-lg font-black text-slate-900 mb-1">สัดส่วนสถานะ</h3>
                                <p className="text-slate-400 text-[10px] mb-6 font-bold uppercase tracking-widest">Evaluation Progress</p>
                                <div className="h-[200px] relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={summaryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {summaryData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-2">
                                    {summaryData.map(item => (
                                        <div key={item.name} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</div>
                                            <span className="font-black">{item.value} รายการ</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* กราฟวงกลม 2: สัดส่วนภาระงาน ( Ratio ) */}
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 flex flex-col">
                                <h3 className="text-lg font-black text-slate-900 mb-1">สัดส่วนภาระงาน</h3>
                                <p className="text-slate-400 text-[10px] mb-6 font-bold uppercase tracking-widest">Students by Subject</p>
                                <div className="h-[200px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={subjectRatioData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                {subjectRatioData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                                    {subjectRatioData.map(item => (
                                        <div key={item.name} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl">
                                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</div>
                                            <span className="font-black">
                                                {/* {Math.round((item.value / stats.students) * 100 || 0)}% */}
                                                {Math.round((item.value / item.totalInChart) * 100 || 0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Right Column: Recent Activity */}
                    <div className="space-y-8">
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 h-full flex flex-col min-h-[600px]">

                            {/* Header & Small Filter Tabs */}
                            <div className="flex items-center justify-between mb-6 px-2">
                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <ListFilter size={20} className="text-slate-400" /> ความเคลื่อนไหว
                                </h3>
                                {/* Small Tabs (Icon Only) */}
                                <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                                    <button
                                        onClick={() => setFilterType('all')}
                                        className={`px-3 py-1 rounded-md text-[10px] font-black transition-all ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        ALL
                                    </button>
                                    <FilterIconBtn active={filterType === 'supervisor'} onClick={() => setFilterType('supervisor')} icon={<Users size={14} />} />
                                    <FilterIconBtn active={filterType === 'site'} onClick={() => setFilterType('site')} icon={<Hospital size={14} />} />
                                    <FilterIconBtn active={filterType === 'student'} onClick={() => setFilterType('student')} icon={<GraduationCap size={14} />} />
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
        </AdminLayout >
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