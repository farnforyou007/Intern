"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
import {
    Search, Users, CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
    ArrowUpDown, ArrowUp, ArrowDown, CheckCircle, Clock, FileText, ListChecks
} from 'lucide-react'
import Swal from 'sweetalert2'

export default function TeacherSubjectsPage() {
    const [loading, setLoading] = useState(true)
    const [subjects, setSubjects] = useState<any[]>([])
    const [data, setData] = useState<any[]>([])
    const [totalCount, setTotalCount] = useState(0)

    // Filters & Pagination
    const [selectedSubject, setSelectedSubject] = useState<string>('')
    const [selectedTrainingYear, setSelectedTrainingYear] = useState<string>('')
    const [trainingYearOptions, setTrainingYearOptions] = useState<string[]>([])
    const [selectedBatch, setSelectedBatch] = useState('all')
    const [batchCodes, setBatchCodes] = useState<string[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    // Sort
    const [sortField, setSortField] = useState('name')
    const [sortOrder, setSortOrder] = useState('asc')

    // Search Debouncing
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const params = new URLSearchParams({
                subjectId: selectedSubject,
                trainingYear: selectedTrainingYear,
                search: debouncedSearchTerm,
                batch: selectedBatch,
                sortField,
                sortOrder,
                page: currentPage.toString(),
                limit: itemsPerPage.toString()
            })

            const res = await fetch(`/api/teacher/subjects?${params.toString()}`)
            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            const d = result.data
            setSubjects(result.subjects || [])
            setData(d.data || [])
            setTotalCount(d.totalCount || 0)
            setTrainingYearOptions(d.trainingYearOptions || [])
            setBatchCodes(d.batchCodes || [])

            if (!selectedTrainingYear && d.defaultYear) setSelectedTrainingYear(d.defaultYear)
            if (!selectedSubject && d.effectiveSubjectId) setSelectedSubject(d.effectiveSubjectId)

        } catch (error: any) {
            console.error('Fetch error:', error)
            Swal.fire('เกิดข้อผิดพลาด', error.message, 'error')
        } finally {
            setLoading(false)
        }
    }, [selectedSubject, selectedTrainingYear, debouncedSearchTerm, selectedBatch, sortField, sortOrder, currentPage, itemsPerPage])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleSort = (field: string) => {
        const order = (sortField === field && sortOrder === 'asc') ? 'desc' : 'asc'
        setSortField(field)
        setSortOrder(order)
        setCurrentPage(1)
    }

    const totalPages = Math.ceil(totalCount / itemsPerPage)

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <Users size={28} className="text-indigo-600" />
                        <span>การประเมิน <span className="text-indigo-600">วิชาชีพ</span></span>
                    </h1>
                    <p className="text-slate-400 font-bold mt-2 ml-1 text-[11px] uppercase tracking-[0.2em]">สรุปผลคะแนนและการประเมินนักศึกษา</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white/50 backdrop-blur-md p-4 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
                <div className="flex flex-col lg:flex-row items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-4 h-14 rounded-[1.5rem] border-2 border-slate-50 shadow-sm shrink-0">
                        <CalendarDays size={16} className="text-indigo-500" />
                        <select
                            value={selectedTrainingYear}
                            onChange={(e) => { setSelectedTrainingYear(e.target.value); setCurrentPage(1); }}
                            className="text-sm font-black text-indigo-600 bg-transparent outline-none cursor-pointer"
                        >
                            {trainingYearOptions.map(year => (
                                <option key={year} value={year}>ปีการศึกษา {year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative w-full lg:w-64 shrink-0">
                        <ListChecks className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            className="w-full h-14 pl-14 pr-10 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm focus:border-indigo-500 outline-none appearance-none cursor-pointer text-slate-700"
                            value={selectedSubject}
                            onChange={(e) => { setSelectedSubject(e.target.value); setCurrentPage(1); }}
                        >
                            {subjects.map(s => (
                                <option key={s.subject_id} value={s.subject_id}>{s.subjects?.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    </div>

                    <div className="relative w-full lg:w-48 shrink-0">
                        <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            className="w-full h-14 pl-14 pr-10 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm focus:border-indigo-500 outline-none appearance-none cursor-pointer text-slate-700"
                            value={selectedBatch}
                            onChange={(e) => { setSelectedBatch(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="all">ทุกรุ่นรหัส</option>
                            {batchCodes.map(code => (
                                <option key={code} value={code}>รหัส {code}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    </div>

                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            placeholder="ค้นหาชื่อ หรือ โรงพยาบาล..."
                            className="w-full h-14 pl-14 pr-6 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center w-16">#</th>
                                <th
                                    className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => handleSort('name')}
                                >
                                    <div className="flex items-center gap-2">
                                        นักศึกษา {sortField === 'name' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="text-slate-200" />}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => handleSort('hospital')}
                                >
                                    <div className="flex items-center gap-2">
                                        สถานที่ฝึก {sortField === 'hospital' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="text-slate-200" />}
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center cursor-pointer hover:text-indigo-600 transition-colors"
                                    onClick={() => handleSort('score')}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        คะแนน {sortField === 'score' ? (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : <ArrowUpDown size={14} className="text-slate-200" />}
                                    </div>
                                </th>
                                <th className="px-6 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">สถานะ</th>
                                <th className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i}><td colSpan={6} className="p-8"><div className="h-12 w-full rounded-xl bg-slate-100 animate-pulse" /></td></tr>
                                ))
                            ) : data.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-indigo-50/20 transition-colors border-b border-slate-50 group">
                                    <td className="px-8 py-5 text-center">
                                        <span className="text-xs font-bold text-slate-300">{(currentPage - 1) * itemsPerPage + idx + 1}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-2xl bg-slate-100 overflow-hidden shrink-0 shadow-inner">
                                                {item.avatarUrl ? <img src={item.avatarUrl} className="w-full h-full object-cover" /> : <Users size={24} className="m-auto text-slate-300" />}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm">{item.studentName}</p>
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter">{item.studentCode}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="text-xs font-black text-slate-600">{item.siteName}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{item.province || '-'}</p>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="h-10 w-16 bg-slate-50 rounded-xl flex items-center justify-center mx-auto border border-slate-100">
                                            <span className="text-sm font-black text-indigo-600">{item.totalScore.toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        {item.evalStatus === 'done' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100">
                                                <CheckCircle size={12} /> ประเมินแล้ว
                                            </span>
                                        ) : item.evalStatus === 'partial' ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black border border-amber-100">
                                                <Clock size={12} /> {item.doneSupervisors}/{item.totalSupervisors}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black border border-slate-100">
                                                <Clock size={12} /> รอประเมิน
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><FileText size={16} /></button>
                                            <button className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><ListChecks size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalCount > 0 && (
                    <div className="px-8 py-6 bg-slate-50/50 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest text-[10px]">แสดงแถว:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-white border-none shadow-sm rounded-xl px-3 py-1.5 text-xs font-black text-indigo-600 outline-none"
                            >
                                {[10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                            <p className="text-[11px] font-bold text-slate-400 ml-4">
                                {totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} จาก {totalCount}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-40 transition-all flex items-center justify-center"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setCurrentPage(p)}
                                        className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 hover:bg-slate-50'}`}
                                    >{p}</button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-40 transition-all flex items-center justify-center"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
