"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, ChevronRight, GraduationCap, Search, ListTodo } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

export default function TeacherCriteriaSelector() {
    const router = useRouter()
    const [subjects, setSubjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await fetch('/api/teacher/criteria')
                const result = await res.json()
                if (result.success) {
                    setSubjects(result.data.subjects || [])
                }
            } catch (error) {
                console.error("Fetch subjects error:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchSubjects()
    }, [])

    const filteredSubjects = subjects.filter(s =>
        s.subjects.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.sub_subjects?.name && s.sub_subjects.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900 p-8">
            <Skeleton className="h-12 w-64 mb-8 rounded-2xl" />
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full border-b border-slate-100" />)}
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                            <ListTodo size={32} className="text-indigo-600" />
                            <span>จัดการ <span className="text-indigo-600">เกณฑ์ประเมิน</span></span>
                        </h1>
                        <p className="text-slate-400 font-bold mt-2 ml-1 text-[11px] uppercase tracking-[0.2em]">เลือกรายวิชาที่ต้องการตั้งค่า Factor และข้อคำถาม</p>
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="ค้นหารายวิชา..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-14 pl-14 pr-6 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-100 outline-none font-bold text-slate-600 transition-all"
                        />
                    </div>
                </div>

                {filteredSubjects.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-slate-100 shadow-sm">
                        <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                            <BookOpen size={40} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">ไม่พบรายวิชา</h3>
                        <p className="text-slate-400 font-bold text-sm">คุณไม่มีรายวิชาที่รับผิดชอบ หรือผลการค้นหาไม่ตรงกับวิชาใดๆ</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="px-8 h-14 font-black text-slate-500 uppercase tracking-widest text-[11px]">รายวิชา / วิชาย่อย</TableHead>
                                    <TableHead className="text-right px-8 h-14 font-black text-slate-500 uppercase tracking-widest text-[11px]">จัดการเกณฑ์</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredSubjects.map((s: any, i: number) => (
                                    <TableRow
                                        key={i}
                                        className="hover:bg-indigo-50/30 transition-colors border-slate-100 group cursor-pointer"
                                        onClick={() => router.push(`/teacher/criteria/${s.subject_id}${s.sub_subjects ? `?subId=${s.sub_subjects.id}` : ''}`)}
                                    >
                                        <TableCell className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shrink-0">
                                                    <GraduationCap size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 text-lg group-hover:text-indigo-600 transition-colors">{s.subjects.name}</div>
                                                    {s.sub_subjects && (
                                                        <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[9px] font-black uppercase tracking-wider border border-amber-100">
                                                            Sub-Subject: {s.sub_subjects.name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <Button
                                                variant="ghost"
                                                className="group-hover:bg-indigo-600 group-hover:text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all gap-2"
                                            >
                                                ตั้งค่าแบบประเมิน
                                                <ChevronRight size={16} />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    )
}
