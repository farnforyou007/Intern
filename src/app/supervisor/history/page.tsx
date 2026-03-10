"use client"
import { useState, useEffect } from 'react'
import {
    Search, ArrowLeft, Calendar, User,
    Lock, Edit3, Clock, History,
    ChevronRight, BookOpen, AlertCircle, CalendarDays
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import liff from '@line/liff'
import { getLineUserId } from '@/utils/auth';

export default function EvaluationHistory() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [historyList, setHistoryList] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [configYear, setConfigYear] = useState<string>('') // 🔒 ปีการศึกษาปัจจุบัน

    useEffect(() => {
        const init = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const lineUserId = await getLineUserId(urlParams);
            if (!lineUserId) return;

            setLoading(true)
            try {
                const res = await fetch(`/api/supervisor/history?lineUserId=${encodeURIComponent(lineUserId)}`)
                const result = await res.json()
                if (!result.success) throw new Error(result.error)
                setConfigYear(result.data.configYear || '')
                setHistoryList(result.data.historyList || [])
            } catch (error) {
                console.error('Error fetching history:', error)
            } finally {
                setLoading(false)
            }
        }
        init()
    }, [])

    // ฟังก์ชันตรวจสอบว่า "หมดเขตหรือยัง" (ขยายเวลา 14 วันหลังจบผลัด)
    const checkIsEditable = (endDateStr: string) => {
        if (!endDateStr) return false
        const today = new Date()
        const endDate = new Date(endDateStr)
        // บวกเพิ่มไป 14 วัน
        const gracePeriodEnd = new Date(endDate)
        gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 14)
        gracePeriodEnd.setHours(23, 59, 59, 999)

        return today <= gracePeriodEnd
    }

    const handleCardClick = (item: any, isEditable: boolean) => {
        if (isEditable) {
            router.push(`/supervisor/evaluate/${item.id}?edit=true`)
        } else {
            Swal.fire({
                title: 'หมดเวลาแก้ไข',
                text: 'รายการนี้เกินระยะเวลา 14 วันหลังจากสิ้นสุดผลัดการฝึกแล้ว',
                icon: 'warning',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#0f172a',
                customClass: { popup: 'rounded-[2rem] font-sans' }
            })
        }
    }

    const filteredList = historyList.filter((item: any) => {
        const s = item.student_assignments?.students
        const subject = item.student_assignments?.sub_subjects?.name || item.student_assignments?.subjects?.name
        const text = searchTerm.toLowerCase()

        return (
            `${s?.first_name} ${s?.last_name}`.toLowerCase().includes(text) ||
            s?.student_code?.toLowerCase().includes(text) ||
            s?.nickname?.toLowerCase().includes(text) ||
            subject?.toLowerCase().includes(text) ||
            item.student_assignments?.rotations?.name?.toLowerCase().includes(text) // เพิ่มให้ค้นหาจากชื่อผลัดได้
        )
    })

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 text-slate-900">

            {/* --- Header (Design เดียวกับหน้า Student List) --- */}
            <div className="bg-white px-6 pt-6 pb-6 sticky top-0 z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] rounded-b-[2.5rem]">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">ประวัติการประเมิน</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">History Log</p>
                        {/* 🔒 Badge ปีการศึกษา */}
                        {configYear && (
                            <span className="inline-flex items-center gap-1.5 mt-1 bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100">
                                <CalendarDays size={10} />
                                ปีการศึกษา {configYear}
                            </span>
                        )}
                    </div>
                    <div className="w-11 h-11 flex items-center justify-center text-slate-300 bg-slate-50 rounded-2xl border border-slate-100">
                        <History size={20} />
                    </div>
                </div>

                {/* Search Box (Design เดียวกันเป๊ะ) */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    {/* <input 
                        type="text" 
                        placeholder="ค้นหาชื่อนักศึกษา..." 
                        className="w-full h-14 pl-14 pr-4 rounded-[1.2rem] bg-slate-50 border-2 border-slate-100 text-slate-800 font-bold focus:border-slate-900 focus:bg-white outline-none placeholder:text-slate-300 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    /> */}
                    <input type="text" placeholder="ค้นหา..."
                        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-100 outline-none font-bold"
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* --- List Content --- */}
            <div className="px-5 mt-6 space-y-4">
                {loading ? (
                    Array(4).fill(0).map((_, i) => (
                        <div key={i} className="bg-white h-28 rounded-[2rem] border border-slate-50 shadow-sm animate-pulse" />
                    ))
                ) : filteredList.length > 0 ? (
                    filteredList.map((item: any) => {
                        const assign = item.student_assignments
                        const student = assign.students
                        const subjectName = assign.sub_subjects?.name || assign.subjects?.name
                        const rotationName = assign.rotations?.name?.split('(')[0] || '-'
                        const rotationEnd = assign.rotations?.end_date
                        const isEditable = checkIsEditable(rotationEnd)

                        return (
                            <div
                                key={item.id}
                                onClick={() => handleCardClick(item, isEditable)}
                                className={`bg-white p-4 pr-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 relative group transition-all duration-300 ${isEditable
                                    ? 'cursor-pointer hover:shadow-lg hover:border-slate-200 hover:-translate-y-1'
                                    : 'cursor-not-allowed opacity-75 grayscale-[0.2]'
                                    }`}
                            >
                                {/* Avatar Section (Design เดียวกับ Student List) */}
                                <div className="w-[4.5rem] h-[4.5rem] rounded-[1.5rem] bg-slate-50 overflow-hidden shrink-0 border-4 border-slate-50 shadow-inner relative group-hover:scale-105 transition-transform">
                                    {student?.avatar_url ? (
                                        <img src={student.avatar_url} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-100">
                                            <User size={28} />
                                        </div>
                                    )}
                                </div>

                                {/* Info Section */}
                                <div className="flex-1 min-w-0 py-0.5">
                                    {/* Name & Status Icon */}
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-900 text-white text-[9px] font-black px-2 py-0.5 rounded-md tracking-wider">
                                                {student.student_code}
                                            </span>
                                            <h3 className="font-black text-slate-900 text-sm leading-tight truncate max-w-[120px]">
                                                {student.first_name} {student.last_name}
                                            </h3>
                                        </div>

                                        {/* Minimal Status Icon */}
                                        {isEditable ? (
                                            <div className="bg-emerald-100 text-emerald-600 p-1 rounded-md shrink-0">
                                                <Edit3 size={12} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <div className="bg-slate-100 text-slate-400 p-1 rounded-md shrink-0">
                                                <Lock size={12} strokeWidth={3} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Subject & Rotation (Minimal Tags) */}
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg">
                                            <BookOpen size={10} className="text-slate-400" />
                                            <span className="truncate max-w-[100px]">{subjectName}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                            <Calendar size={10} />
                                            <span>{rotationName}</span>
                                        </div>
                                    </div>

                                    {/* Date Footer */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
                                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                            <Clock size={10} />
                                            <span>แก้ไขล่าสุด {new Date(item.updated_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Arrow (Design เดียวกับ Student List) */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isEditable
                                    ? 'bg-slate-50 text-slate-300 group-hover:bg-slate-900 group-hover:text-white'
                                    : 'bg-slate-50 text-slate-200'
                                    }`}>
                                    <ChevronRight size={20} strokeWidth={3} className="ml-0.5" />
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-16">
                        {configYear ? (
                            <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] mx-auto max-w-sm">
                                <History size={36} className="mx-auto mb-3 text-amber-500" />
                                <p className="font-black text-amber-800 text-sm">ยังไม่มีประวัติการประเมิน</p>
                                <p className="text-xs text-amber-600 font-medium mt-1">ในรอบปีการศึกษา {configYear}</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <History size={40} />
                                </div>
                                <p className="font-black text-slate-400">ยังไม่มีประวัติการประเมิน</p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Gradient Fade */}
            <div className="fixed bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
        </div>
    )
}