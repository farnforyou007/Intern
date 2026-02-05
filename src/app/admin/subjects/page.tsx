"use client"
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, BookOpen, Edit2, Trash2, Settings2, FileText } from "lucide-react"
import Swal from 'sweetalert2'

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<any>(null)
    const [subjectName, setSubjectName] = useState('')
    const [teachers, setTeachers] = useState([]) // สำหรับเก็บรายชื่ออาจารย์
    const [selectedTeacherId, setSelectedTeacherId] = useState('')
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const fetchData = async () => {
        setLoading(true)
        const { data } = await supabase.from('subjects').select('*').order('id', { ascending: true })
        if (data) setSubjects(data)
        setLoading(false)
    }

    const handleSave = async () => {
        if (!subjectName) return
        if (selectedSubject?.id) {
            await supabase.from('subjects').update({ name: subjectName }).eq('id', selectedSubject.id)
        } else {
            await supabase.from('subjects').insert([{ name: subjectName }])
        }
        setSubjectName(''); setSelectedSubject(null); setIsModalOpen(false); fetchData()

        Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ',
            timer: 1500,
            showConfirmButton: false,
            customClass: { popup: 'rounded-[2rem] font-sans' }
        })
    }

    const handleDelete = (subject: any) => {
        Swal.fire({
            title: 'ยืนยันการลบรายวิชา?',
            html: `คุณกำลังจะลบวิชา <b class="text-red-600">"${subject.name}"</b><br><small class="text-slate-500">ข้อมูลเกณฑ์การประเมินของวิชานี้จะถูกลบออกด้วย</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการลบ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#94a3b8',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await supabase.from('subjects').delete().eq('id', subject.id)
                fetchData()
            }
        })
    }

    useEffect(() => { fetchData() }, [])

    // 1. ดึงรายชื่อเฉพาะคนที่เป็น Role 'teacher' มาแสดงใน Dropdown
    useEffect(() => {
        const fetchTeachers = async () => {
            const { data } = await supabase
                .from('supervisors')
                .select('id, full_name')
                .eq('role', 'teacher')
                .eq('is_verified', true) // เอาเฉพาะคนที่อนุมัติแล้ว
            setTeachers(data || [])
        }
        fetchTeachers()
    }, [])

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                            <BookOpen className="text-blue-600" size={32} /> จัดการรายวิชา
                        </h1>
                        <p className="text-slate-500 mt-1">เพิ่มรายชื่อวิชาและกำหนดเกณฑ์การประเมินผล</p>
                    </div>
                    <Button onClick={() => { setSelectedSubject(null); setSubjectName(''); setIsModalOpen(true); }} className="w-full sm:w-auto bg-blue-600 rounded-xl h-12 px-6 shadow-lg active:scale-95 transition-all">
                        <Plus size={20} className="mr-2" /> เพิ่มวิชาใหม่
                    </Button>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="px-8 font-bold text-slate-600">ชื่อรายวิชา</TableHead>
                                    <TableHead className="text-center font-bold text-slate-600">เกณฑ์การประเมิน</TableHead>
                                    <TableHead className="text-right px-8 font-bold text-slate-600">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={3} className="p-8"><Skeleton className="h-16 w-full rounded-2xl" /></TableCell></TableRow>
                                    ))
                                ) : subjects.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-slate-50/30">
                                        <TableCell className="px-8 py-6 font-bold text-slate-800 text-lg">
                                            {s.name}
                                        </TableCell>
                                        <TableCell className="text-center">

                                            <Link href={`/admin/subjects/${s.id}/criteria`}>
                                                <Button variant="outline" className="rounded-xl gap-2 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                                                    <Settings2 size={16} />
                                                    ตั้งค่าเกณฑ์ประเมิน
                                                </Button>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => { setSelectedSubject(s); setSubjectName(s.name); setIsModalOpen(true); }}>
                                                    <Edit2 size={18} />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(s)}>
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[92%] max-w-[400px] rounded-[2rem] border-none p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-800">{selectedSubject ? 'แก้ไขวิชา' : 'เพิ่มรายวิชา'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <label className="text-sm font-bold text-slate-700 mb-2 block font-sans">ชื่อรายวิชา</label>
                        <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="เช่น การนวดไทย 1" className="h-14 rounded-2xl text-lg" />
                    </div>

                    <div className="mb-4 space-y-2">
                        <label className="text-sm font-bold text-slate-700">อาจารย์ผู้ดูแลวิชา</label>
                        <select
                            className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={selectedTeacherId}
                            onChange={(e) => setSelectedTeacherId(e.target.value)}
                            required
                        >
                            <option value="">-- เลือกอาจารย์ --</option>
                            {teachers.map((t) => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSave} className="w-full bg-blue-600 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-500/20">บันทึกข้อมูล</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}