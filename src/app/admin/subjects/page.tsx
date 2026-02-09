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
import { Plus, BookOpen, Edit2, Trash2, Settings2, Layers, X, ChevronRight, Save } from "lucide-react"
import Swal from 'sweetalert2'

export default function SubjectsPage() {
    const [subjects, setSubjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState<any>(null)
    const [subjectName, setSubjectName] = useState('')

    // โโลจิกวิชาย่อย
    const [subSubjectInput, setSubSubjectInput] = useState('')
    const [subSubjects, setSubSubjects] = useState<any[]>([])

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    // ดึงข้อมูลวิชาหลักพร้อมวิชาย่อย
    const fetchData = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('subjects')
            .select('*, sub_subjects(*)')
            .order('id', { ascending: true })
        if (data) setSubjects(data)
        setLoading(false)
    }

    const openModal = (subject: any = null) => {
        if (subject) {
            setSelectedSubject(subject)
            setSubjectName(subject.name)
            setSubSubjects(subject.sub_subjects || [])
        } else {
            setSelectedSubject(null)
            setSubjectName('')
            setSubSubjects([])
        }
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!subjectName) return

        try {
            let subjectId = selectedSubject?.id;

            // 1. บันทึกวิชาหลัก
            if (subjectId) {
                await supabase.from('subjects').update({ name: subjectName }).eq('id', subjectId)
            } else {
                const { data } = await supabase.from('subjects').insert([{ name: subjectName }]).select().single()
                subjectId = data.id
            }

            // 2. ลบวิชาย่อยเดิมแล้วบันทึกใหม่ตาม List ปัจจุบัน
            await supabase.from('sub_subjects').delete().eq('parent_subject_id', subjectId)
            if (subSubjects.length > 0) {
                const inserts = subSubjects.map(ss => ({
                    name: ss.name,
                    parent_subject_id: subjectId
                }))
                await supabase.from('sub_subjects').insert(inserts)
            }

            Swal.fire({
                icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false,
                customClass: { popup: 'rounded-[2rem] font-sans' }
            })
            setIsModalOpen(false); fetchData()
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        }
    }

    const handleDelete = (subject: any) => {
        Swal.fire({
            title: 'ยืนยันการลบรายวิชา?',
            html: `คุณกำลังจะลบวิชา <b class="text-red-600">"${subject.name}"</b><br><small class="text-slate-500">วิชาย่อยและเกณฑ์ประเมินทั้งหมดจะถูกลบออก</small>`,
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

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                            <BookOpen className="text-blue-600" size={32} /> จัดการรายวิชา
                        </h1>
                        <p className="text-slate-500 mt-1">กำหนดวิชาหลัก วิชาย่อย และแบบประเมิน</p>
                    </div>
                    <Button onClick={() => openModal()} className="w-full sm:w-auto bg-blue-600 rounded-xl h-12 px-6 shadow-lg">
                        <Plus size={20} className="mr-2" /> เพิ่มวิชาใหม่
                    </Button>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="px-8 font-bold text-slate-600">ชื่อรายวิชาหลัก / วิชาย่อย</TableHead>
                                    <th className="text-center font-bold text-slate-600 text-sm">ตั้งค่าแบบประเมิน</th>
                                    <TableHead className="text-right px-8 font-bold text-slate-600">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={3} className="p-8"><Skeleton className="h-16 w-full rounded-2xl" /></TableCell></TableRow>
                                    ))
                                ) : subjects.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-slate-50/30 transition-colors">
                                        <TableCell className="px-8 py-6">
                                            <div className="font-bold text-slate-800 text-lg mb-1">{s.name}</div>
                                            <div className="flex flex-wrap gap-2">
                                                {s.sub_subjects?.map((ss: any) => (
                                                    <span key={ss.id} className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold border border-slate-200 uppercase">
                                                        {ss.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </TableCell>
                                        {/* <TableCell className="text-center">
                                            <div className="flex flex-wrap justify-center gap-2 max-w-[300px] mx-auto">
                                                {s.sub_subjects?.length > 0 ? (
                                                    // กรณีมีวิชาย่อย: ส่ง subId ผ่าน Query String (?subId=...)
                                                    s.sub_subjects.map((ss: any) => (
                                                        <Link key={ss.id} href={`/admin/subjects/${s.id}/criteria?subId=${ss.id}`}>
                                                            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[11px] font-black h-9">
                                                                <Settings2 size={14} /> {ss.name}
                                                            </Button>
                                                        </Link>
                                                    ))
                                                ) : (
                                                    // กรณีไม่มีวิชาย่อย: ส่งแค่ ID วิชาหลัก
                                                    <Link href={`/admin/subjects/${s.id}/criteria`}>
                                                        <Button variant="outline" size="sm" className="rounded-xl gap-2 border-slate-200 text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-[11px] font-black h-9">
                                                            <Settings2 size={14} /> ตั้งค่าแบบประเมินหลัก
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </TableCell> */}

                                        <TableCell className="text-center py-6">
                                            <div className="flex flex-col gap-3 items-center">
                                                {/* 1. แสดงปุ่มวิชาย่อย (ANC, LR, PP) ถ้ามีข้อมูล */}
                                                {s.sub_subjects && s.sub_subjects.length > 0 && (
                                                    <div className="flex flex-wrap justify-center gap-2 max-w-[320px]">
                                                        {s.sub_subjects.map((ss: any) => (
                                                            <Link key={ss.id} href={`/admin/subjects/${s.id}/criteria?subId=${ss.id}`}>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="rounded-xl gap-1.5 border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black h-8 shadow-sm"
                                                                >
                                                                    <Layers size={12} /> {ss.name}
                                                                </Button>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* 2. ปุ่มวิชาหลัก (เล่มรายงาน) - วางไว้นอกเงื่อนไขเพื่อให้แสดงในทุกวิชา */}
                                                <Link href={`/admin/subjects/${s.id}/criteria`}>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`rounded-xl gap-2 transition-all text-[10px] font-black h-8 border border-dashed shadow-sm
                                                        ${s.sub_subjects?.length > 0
                                                                ? 'text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                                                                : 'text-blue-600 border-blue-100 bg-blue-50 hover:bg-blue-600 hover:text-white'
                                                            }`}
                                                    >
                                                        <Settings2 size={14} />
                                                        {s.sub_subjects?.length > 0 ? 'ตั้งค่าประเมินภาพรวม (เล่มรายงาน)' : 'ตั้งค่าแบบประเมินหลัก'}
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-right px-8">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => openModal(s)}>
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

            {/* Modal จัดการวิชาและวิชาย่อย */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95%] max-w-[500px] rounded-[2.5rem] border-none p-10 shadow-2xl overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">
                            {selectedSubject ? 'แก้ไขข้อมูลรายวิชา' : 'เพิ่มรายวิชาใหม่'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        {/* ชื่อวิชาหลัก */}
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อรายวิชาหลัก</label>
                            <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="เช่น การนวดไทย, ผดุงครรภ์" className="h-14 rounded-2xl text-lg font-bold border-slate-100 bg-slate-50 focus:bg-white transition-all" />
                        </div>

                        {/* จัดการวิชาย่อย */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">วิชาย่อย / แผนก (ถ้ามี)</label>

                            <div className="flex gap-2">
                                <Input
                                    value={subSubjectInput}
                                    onChange={(e) => setSubSubjectInput(e.target.value)}
                                    placeholder="เพิ่มวิชาย่อย เช่น ANC..."
                                    className="h-12 rounded-xl border-dashed border-2 border-slate-200"
                                    onKeyDown={(e) => e.key === 'Enter' && (setSubSubjects([...subSubjects, { name: subSubjectInput }]), setSubSubjectInput(''))}
                                />
                                <Button onClick={() => (setSubSubjects([...subSubjects, { name: subSubjectInput }]), setSubSubjectInput(''))} className="h-12 w-12 rounded-xl bg-slate-900"><Plus size={20} /></Button>
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-[40px]">
                                {subSubjects.map((ss, idx) => (
                                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 animate-in zoom-in-95">
                                        <span className="text-xs font-black">{ss.name}</span>
                                        <button onClick={() => setSubSubjects(subSubjects.filter((_, i) => i !== idx))}><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button onClick={handleSave} className="w-full bg-blue-600 h-16 rounded-2xl text-lg font-black shadow-xl shadow-blue-100 transition-all hover:scale-[1.02]">
                            <Save size={20} className="mr-2" /> บันทึกข้อมูลทั้งหมด
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}