"use client"
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { 
    ChevronLeft, Search, Users, User, ChevronRight, 
    X, Maximize2, Mail, Phone, GraduationCap 
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function StudentListPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [students, setStudents] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedYear, setSelectedYear] = useState('all')
    const [expandedImage, setExpandedImage] = useState<string | null>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true)
            const { data } = await supabase
                .from('students')
                .select('*')
                .order('student_code', { ascending: true })
            if (data) setStudents(data)
            setLoading(false)
        }
        fetchStudents()
    }, [])

    // สร้างปุ่มกรองชั้นปีจาก 2 ตัวหน้าของรหัสที่มีในระบบ
    const yearOptions = useMemo(() => {
        const codes = students.map(s => s.student_code?.substring(0, 2)).filter(Boolean)
        return Array.from(new Set(codes)).sort().reverse()
    }, [students])

    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const searchStr = (s.first_name + s.last_name + (s.nickname || '') + s.student_code).toLowerCase()
            const matchesSearch = searchStr.includes(searchTerm.toLowerCase())
            const matchesYear = selectedYear === 'all' || s.student_code?.startsWith(selectedYear)
            return matchesSearch && matchesYear
        })
    }, [students, searchTerm, selectedYear])

    if (loading) return <SkeletonLoader />

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
            {/* Header Section */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 pt-10 pb-6">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 active:scale-90 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="text-center">
                            <h1 className="text-xl font-black text-slate-800 tracking-tight">ข้อมูลนักศึกษา</h1>
                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mt-1">Student infomation</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Users size={20} />
                        </div>
                    </div>

                    <div className="space-y-4 px-2">
                        {/* Search Bar */}
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                            <input 
                                type="text" 
                                placeholder="ค้นหาชื่อ, ชื่อเล่น หรือ รหัส..." 
                                className="w-full bg-slate-50 border-2 border-transparent rounded-[1.5rem] py-4 pl-12 pr-4 text-sm font-bold focus:bg-white focus:border-indigo-100 transition-all outline-none shadow-inner"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Year Filter */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                            <button 
                                onClick={() => setSelectedYear('all')}
                                className={`px-6 py-2.5 rounded-2xl text-[11px] font-black transition-all shrink-0 ${selectedYear === 'all' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}
                            >
                                ทั้งหมด
                            </button>
                            {yearOptions.map(year => (
                                <button 
                                    key={year} 
                                    onClick={() => setSelectedYear(year)}
                                    className={`px-6 py-2.5 rounded-2xl text-[11px] font-black transition-all shrink-0 ${selectedYear === year ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-100'}`}
                                >
                                    รหัส {year}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Student Grid */}
            <div className="max-w-5xl mx-auto px-4 mt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredStudents.map((s) => (
                        <div 
                            key={s.id}
                            className="bg-white p-4 pr-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300 flex items-center group relative"
                        >
                            {/* Student Image */}
                            <div 
                                className="w-20 h-20 rounded-[1.8rem] overflow-hidden relative shrink-0 cursor-zoom-in border-4 border-slate-50 shadow-sm z-10"
                                onClick={(e) => { e.stopPropagation(); setExpandedImage(s.avatar_url || null); }}
                            >
                                {s?.avatar_url ? (
                                    <img src={s.avatar_url} alt="profile" 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                        />
                                        
                                    ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><User size={28} /></div>
                                )}
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                    <Maximize2 size={14} />
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="ml-5 flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/teacher/students/${s.id}`)}>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-black text-slate-800 text-base leading-tight truncate group-hover:text-indigo-600 transition-colors">
                                        {s.first_name} {s.last_name}
                                    </h3>
                                    {s.nickname && (
                                        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg shrink-0">
                                            ({s.nickname})
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] font-bold text-slate-400 mb-2">{s.student_code}</p>
                                
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                        <Mail size={12} className="text-slate-300 shrink-0" />
                                        <span className="truncate">{s.email || 'ไม่ระบุอีเมล'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                        <Phone size={12} className="text-slate-300 shrink-0" />
                                        <span>{s.phone || 'ไม่ระบุเบอร์โทร'}</span>
                                    </div>
                                </div>
                            </div>

                            <ChevronRight className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" size={20} strokeWidth={3} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Image Preview Modal (Plain White Background) */}
            {expandedImage && (
                <div 
                    className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200"
                    onClick={() => setExpandedImage(null)}
                >
                    <button className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center hover:bg-slate-200 transition-all border border-slate-200">
                        <X size={24} />
                    </button>
                    <div className="max-w-md w-full aspect-square rounded-[3.5rem] overflow-hidden shadow-2xl border-[16px] border-slate-50 ring-1 ring-slate-100" onClick={(e) => e.stopPropagation()}>
                        <img src={expandedImage} alt="Expanded" className="w-full h-full object-cover" />
                    </div>
                    <p className="absolute bottom-10 text-slate-400 font-bold text-xs uppercase tracking-widest">คลิกที่ว่างเพื่อปิด</p>
                </div>
            )}
        </div>
    )
}

function SkeletonLoader() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 space-y-6">
            <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
                <div className="h-24 bg-white rounded-[2rem]" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white rounded-[2.5rem]" />)}
                </div>
            </div>
        </div>
    )
}