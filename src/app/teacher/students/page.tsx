"use client"
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    Search, Users, User, ChevronLeft, ChevronRight, ChevronDown,
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
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

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

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage
        return filteredStudents.slice(start, start + itemsPerPage)
    }, [filteredStudents, currentPage, itemsPerPage])

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1) }, [searchTerm, selectedYear, itemsPerPage])

    if (loading) return <SkeletonLoader />

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 font-sans">
            {/* Admin-style Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                            <Users size={32} className="text-white" />
                        </div>
                        <span>STUDENTS <span className="text-indigo-600">List</span></span>
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 ml-1 text-xs uppercase tracking-[0.2em]">รายชื่อนักศึกษาในความดูแล</p>
                </div>
            </div>

            {/* Admin-style Filter Bar */}
            <div className="bg-white/50 backdrop-blur-md p-4 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
                <div className="flex flex-col xl:flex-row items-center gap-4">
                    {/* Year Dropdown Filter */}
                    <div className="relative w-full xl:w-64 shrink-0">
                        <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            className="w-full h-14 pl-14 pr-10 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm focus:border-indigo-500 focus:ring-0 outline-none appearance-none cursor-pointer text-slate-700 transition-all"
                            value={selectedYear}
                            onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="all">ทุกรุ่นรหัส</option>
                            {yearOptions.map(year => (
                                <option key={year} value={year}>รหัส {year}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    </div>

                    {/* Search */}
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            placeholder="ค้นหาชื่อ, ชื่อเล่น หรือ รหัสนักศึกษา..."
                            className="w-full h-14 pl-14 pr-6 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>
            </div>

            {/* Table — admin style */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center w-16">#</th>
                                <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest">นักศึกษา</th>
                                <th className="px-6 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest hidden md:table-cell">การติดต่อ</th>
                                <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}><td colSpan={4} className="p-8"><div className="h-12 w-full rounded-xl bg-slate-100 animate-pulse" /></td></tr>
                                ))
                            ) : paginatedStudents.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-indigo-50/20 transition-colors border-b border-slate-50">
                                    <td className="px-8 py-5 text-center">
                                        <span className="text-xs font-bold text-slate-300">{(currentPage - 1) * itemsPerPage + idx + 1}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex items-center justify-center shrink-0 cursor-zoom-in hover:ring-2 ring-indigo-200 transition-all"
                                                onClick={() => s.avatar_url && setExpandedImage(s.avatar_url)}
                                            >
                                                {s.avatar_url ? (
                                                    <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="text-slate-300" size={28} />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-base leading-tight">
                                                    {s.first_name} {s.last_name}
                                                    {s.nickname && <span className="text-indigo-500 ml-2 text-sm">({s.nickname})</span>}
                                                </p>
                                                <p className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter mt-1">{s.student_code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 hidden md:table-cell">
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                                <Phone size={12} className="text-slate-400" /> {s.phone || '-'}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 truncate max-w-[200px] italic underline decoration-indigo-100 text-indigo-400">
                                                <Mail size={12} className="text-slate-400" /> {s.email || '-'}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <button
                                            onClick={() => router.push(`/teacher/students/${s.id}`)}
                                            className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm inline-flex items-center justify-center"
                                        >
                                            <GraduationCap size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {paginatedStudents.length === 0 && !loading && (
                                <tr><td colSpan={4} className="px-8 py-20 text-center font-bold text-slate-300 uppercase tracking-widest text-sm">ไม่พบข้อมูลนักศึกษา</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer — admin style */}
                <div className="px-8 py-6 bg-slate-50/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">แสดงแถว:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-white border-none shadow-lg shadow-slate-100 rounded-xl px-3 py-2 text-xs font-black text-indigo-600 outline-none focus:ring-2 ring-indigo-500"
                        >
                            {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
                        </select>
                        <p className="text-xs font-bold text-slate-400 ml-4">
                            แสดง {filteredStudents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredStudents.length)} จากทั้งหมด {filteredStudents.length}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="w-10 h-10 rounded-xl bg-white shadow-md text-slate-400 hover:text-indigo-600 disabled:opacity-30 flex items-center justify-center transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                                >{page}</button>
                            ))}
                            {totalPages > 7 && <span className="px-2 text-slate-300">...</span>}
                        </div>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
                            className="w-10 h-10 rounded-xl bg-white shadow-md text-slate-400 hover:text-indigo-600 disabled:opacity-30 flex items-center justify-center transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {expandedImage && (
                <div
                    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setExpandedImage(null)}
                >
                    <button className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                        <X size={20} />
                    </button>
                    <div className="max-w-md w-full aspect-square rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <img src={expandedImage} alt="Expanded" className="w-full h-full object-cover" />
                    </div>
                </div>
            )}
        </div>
    )
}

function SkeletonLoader() {
    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 animate-pulse">
            <div className="h-16 bg-white rounded-2xl mb-8" />
            <div className="h-20 bg-white rounded-[2.5rem] mb-8" />
            <div className="bg-white rounded-[2.5rem] overflow-hidden">
                <div className="h-16 bg-slate-50" />
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 border-t border-slate-50" />)}
            </div>
        </div>
    )
}