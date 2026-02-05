"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, CalendarDays, Edit2, Trash2, Clock, Calendar } from "lucide-react"
import Swal from 'sweetalert2'

export default function RotationsPage() {
    const [rotations, setRotations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRotation, setSelectedRotation] = useState<any>(null)
    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        academic_year: '2569'
    })

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const fetchData = async () => {
        setLoading(true)
        const { data } = await supabase.from('rotations').select('*').order('id', { ascending: true })
        if (data) setRotations(data)
        setLoading(false)
    }

    // ฟังก์ชันสำหรับบันทึก (ทั้งเพิ่มใหม่และแก้ไข)
    const handleSave = async () => {
        if (!formData.name || !formData.start_date || !formData.end_date) {
            Swal.fire({ icon: 'error', title: 'กรุณากรอกข้อมูลให้ครบ', customClass: { popup: 'rounded-[2rem] font-sans' } })
            return
        }

        if (selectedRotation?.id) {
            // แก้ไขข้อมูลเดิม
            await supabase.from('rotations').update(formData).eq('id', selectedRotation.id)
        } else {
            // เพิ่มข้อมูลใหม่
            await supabase.from('rotations').insert([formData])
        }

        setIsModalOpen(false)
        setFormData({ name: '', start_date: '', end_date: '', academic_year: '2569' })
        setSelectedRotation(null)
        fetchData()

        Swal.fire({
            icon: 'success',
            title: 'บันทึกข้อมูลสำเร็จ',
            timer: 1500,
            showConfirmButton: false,
            customClass: { popup: 'rounded-[2rem] font-sans' }
        })
    }

    // ฟังก์ชันลบแบบ SweetAlert (จัดกลางสไตล์ที่คุณชอบ)
    const handleDelete = (rotation: any) => {
        Swal.fire({
            title: 'ยืนยันการลบผลัด?',
            html: `คุณกำลังจะลบ <b class="text-red-600">"${rotation.name}"</b><br><small class="text-slate-500">ข้อมูลการลงทะเบียนในผลัดนี้อาจได้รับผลกระทบ</small>`,
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
                const { error } = await supabase.from('rotations').delete().eq('id', rotation.id)
                if (!error) {
                    Swal.fire({
                        title: 'ลบสำเร็จ!',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-[2rem] font-sans' }
                    })
                    fetchData()
                }
            }
        })
    }

    const openEditModal = (rotation: any) => {
        setSelectedRotation(rotation)
        setFormData({
            name: rotation.name,
            start_date: rotation.start_date,
            end_date: rotation.end_date,
            academic_year: rotation.academic_year
        })
        setIsModalOpen(true)
    }

    useEffect(() => { fetchData() }, [])

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 px-2 sm:px-0">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-slate-900">
                            <CalendarDays className="text-blue-600" size={32} /> จัดการผลัดการฝึก
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm sm:text-base italic">กำหนดช่วงเวลาและรอบการฝึกงานของนักศึกษา</p>
                    </div>
                    <Button
                        onClick={() => { setSelectedRotation(null); setFormData({ name: '', start_date: '', end_date: '', academic_year: '2569' }); setIsModalOpen(true); }}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 rounded-xl h-12 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={20} className="mr-2" /> เพิ่มผลัดใหม่
                    </Button>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mx-2 sm:mx-0 font-sans">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="px-6 lg:px-8 font-bold">ชื่อผลัด / ปีการศึกษา</TableHead>
                                    <TableHead className="text-center font-bold">ช่วงเวลาการฝึก</TableHead>
                                    <TableHead className="text-right px-6 lg:px-8 font-bold">จัดการ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <TableRow key={i}><TableCell colSpan={3} className="p-8"><Skeleton className="h-16 w-full rounded-2xl" /></TableCell></TableRow>
                                    ))
                                ) : rotations.length > 0 ? (
                                    rotations.map((r) => (
                                        <TableRow key={r.id} className="hover:bg-slate-50/30 transition-colors">
                                            <TableCell className="px-6 lg:px-8 py-6">
                                                <div className="font-bold text-slate-800 text-lg">{r.name}</div>
                                                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider">
                                                    ปีการศึกษา {r.academic_year}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="inline-flex flex-col sm:flex-row items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-slate-600 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-blue-500" />
                                                        {new Date(r.start_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                    </div>
                                                    <span className="hidden sm:inline text-slate-300 mx-1">|</span>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-emerald-500" />
                                                        {new Date(r.end_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-6 lg:px-8">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-full" onClick={() => openEditModal(r)}>
                                                        <Edit2 size={18} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-full" onClick={() => handleDelete(r)}>
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-20 text-slate-400 italic">ยังไม่มีข้อมูลผลัดการฝึกในระบบ</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Modal: เพิ่มและแก้ไขผลัด */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[92%] max-w-[450px] rounded-[2rem] border-none p-8 font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-800 mb-2">
                            {selectedRotation ? 'แก้ไขข้อมูลผลัด' : 'เพิ่มผลัดการฝึกใหม่'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">ชื่อผลัด</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="เช่น ผลัดที่ 1/2569"
                                className="h-12 rounded-xl border-slate-200"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-1.5 block">วันที่เริ่ม</label>
                                <Input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="h-12 rounded-xl border-slate-200"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-700 mb-1.5 block">วันที่สิ้นสุด</label>
                                <Input
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    className="h-12 rounded-xl border-slate-200"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">ปีการศึกษา</label>
                            <Input
                                value={formData.academic_year}
                                onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                placeholder="เช่น 2569"
                                className="h-12 rounded-xl border-slate-200"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4 sm:mt-6">
                        <Button
                            onClick={handleSave}
                            className="w-full bg-blue-600 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                        >
                            บันทึกข้อมูลผลัด
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}