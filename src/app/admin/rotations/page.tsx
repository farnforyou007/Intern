// "use client"
// import { useState, useEffect } from 'react'
// import { createClient } from '@supabase/supabase-js'
// import AdminLayout from '@/components/AdminLayout'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Plus, CalendarDays, Edit2, Trash2, Clock, Calendar } from "lucide-react"
// import Swal from 'sweetalert2'

// export default function RotationsPage() {
//     const [rotations, setRotations] = useState<any[]>([])
//     const [loading, setLoading] = useState(true)
//     const [isModalOpen, setIsModalOpen] = useState(false)
//     const [selectedRotation, setSelectedRotation] = useState<any>(null)
//     const [formData, setFormData] = useState({
//         name: '',
//         start_date: '',
//         end_date: '',
//         academic_year: '2569'
//     })

//     const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

//     const fetchData = async () => {
//         setLoading(true)
//         const { data } = await supabase.from('rotations').select('*').order('id', { ascending: true })
//         if (data) setRotations(data)
//         setLoading(false)
//     }

//     // ฟังก์ชันสำหรับบันทึก (ทั้งเพิ่มใหม่และแก้ไข)
//     const handleSave = async () => {
//         if (!formData.name || !formData.start_date || !formData.end_date) {
//             Swal.fire({ icon: 'error', title: 'กรุณากรอกข้อมูลให้ครบ', customClass: { popup: 'rounded-[2rem] font-sans' } })
//             return
//         }

//         if (selectedRotation?.id) {
//             // แก้ไขข้อมูลเดิม
//             await supabase.from('rotations').update(formData).eq('id', selectedRotation.id)
//         } else {
//             // เพิ่มข้อมูลใหม่
//             await supabase.from('rotations').insert([formData])
//         }

//         setIsModalOpen(false)
//         setFormData({ name: '', start_date: '', end_date: '', academic_year: '2569' })
//         setSelectedRotation(null)
//         fetchData()

//         Swal.fire({
//             icon: 'success',
//             title: 'บันทึกข้อมูลสำเร็จ',
//             timer: 1500,
//             showConfirmButton: false,
//             customClass: { popup: 'rounded-[2rem] font-sans' }
//         })
//     }

//     // ฟังก์ชันลบแบบ SweetAlert (จัดกลางสไตล์ที่คุณชอบ)
//     const handleDelete = (rotation: any) => {
//         Swal.fire({
//             title: 'ยืนยันการลบผลัด?',
//             html: `คุณกำลังจะลบ <b class="text-red-600">"${rotation.name}"</b><br><small class="text-slate-500">ข้อมูลการลงทะเบียนในผลัดนี้อาจได้รับผลกระทบ</small>`,
//             icon: 'warning',
//             showCancelButton: true,
//             confirmButtonText: 'ยืนยันการลบ',
//             cancelButtonText: 'ยกเลิก',
//             confirmButtonColor: '#dc2626',
//             cancelButtonColor: '#94a3b8',
//             reverseButtons: true,
//             customClass: {
//                 popup: 'rounded-[2.5rem] font-sans p-10',
//                 confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
//                 cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
//             }
//         }).then(async (result) => {
//             if (result.isConfirmed) {
//                 const { error } = await supabase.from('rotations').delete().eq('id', rotation.id)
//                 if (!error) {
//                     Swal.fire({
//                         title: 'ลบสำเร็จ!',
//                         icon: 'success',
//                         timer: 1500,
//                         showConfirmButton: false,
//                         customClass: { popup: 'rounded-[2rem] font-sans' }
//                     })
//                     fetchData()
//                 }
//             }
//         })
//     }

//     const openEditModal = (rotation: any) => {
//         setSelectedRotation(rotation)
//         setFormData({
//             name: rotation.name,
//             start_date: rotation.start_date,
//             end_date: rotation.end_date,
//             academic_year: rotation.academic_year
//         })
//         setIsModalOpen(true)
//     }

//     useEffect(() => { fetchData() }, [])

//     return (
//         <AdminLayout>
//             <div className="max-w-6xl mx-auto">
//                 {/* Header Section */}
//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 px-2 sm:px-0">
//                     <div>
//                         <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-slate-900">
//                             <CalendarDays className="text-blue-600" size={32} /> จัดการผลัดการฝึก
//                         </h1>
//                         <p className="text-slate-500 mt-1 text-sm sm:text-base italic">กำหนดช่วงเวลาและรอบการฝึกงานของนักศึกษา</p>
//                     </div>
//                     <Button
//                         onClick={() => { setSelectedRotation(null); setFormData({ name: '', start_date: '', end_date: '', academic_year: '2569' }); setIsModalOpen(true); }}
//                         className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 rounded-xl h-12 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
//                     >
//                         <Plus size={20} className="mr-2" /> เพิ่มผลัดใหม่
//                     </Button>
//                 </div>

//                 {/* Table Section */}
//                 <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mx-2 sm:mx-0 font-sans">
//                     <div className="overflow-x-auto">
//                         <Table>
//                             <TableHeader className="bg-slate-50/50">
//                                 <TableRow>
//                                     <TableHead className="px-6 lg:px-8 font-bold">ชื่อผลัด / ปีการศึกษา</TableHead>
//                                     <TableHead className="text-center font-bold">ช่วงเวลาการฝึก</TableHead>
//                                     <TableHead className="text-right px-6 lg:px-8 font-bold">จัดการ</TableHead>
//                                 </TableRow>
//                             </TableHeader>
//                             <TableBody>
//                                 {loading ? (
//                                     [...Array(3)].map((_, i) => (
//                                         <TableRow key={i}><TableCell colSpan={3} className="p-8"><Skeleton className="h-16 w-full rounded-2xl" /></TableCell></TableRow>
//                                     ))
//                                 ) : rotations.length > 0 ? (
//                                     rotations.map((r) => (
//                                         <TableRow key={r.id} className="hover:bg-slate-50/30 transition-colors">
//                                             <TableCell className="px-6 lg:px-8 py-6">
//                                                 <div className="font-bold text-slate-800 text-lg">{r.name}</div>
//                                                 <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1 uppercase tracking-wider">
//                                                     ปีการศึกษา {r.academic_year}
//                                                 </div>
//                                             </TableCell>
//                                             <TableCell className="text-center">
//                                                 <div className="inline-flex flex-col sm:flex-row items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shadow-sm text-slate-600 font-medium">
//                                                     <div className="flex items-center gap-2">
//                                                         <Calendar size={14} className="text-blue-500" />
//                                                         {new Date(r.start_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
//                                                     </div>
//                                                     <span className="hidden sm:inline text-slate-300 mx-1">|</span>
//                                                     <div className="flex items-center gap-2">
//                                                         <Clock size={14} className="text-emerald-500" />
//                                                         {new Date(r.end_date).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}
//                                                     </div>
//                                                 </div>
//                                             </TableCell>
//                                             <TableCell className="text-right px-6 lg:px-8">
//                                                 <div className="flex justify-end gap-2">
//                                                     <Button variant="ghost" size="icon" className="h-10 w-10 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-full" onClick={() => openEditModal(r)}>
//                                                         <Edit2 size={18} />
//                                                     </Button>
//                                                     <Button variant="ghost" size="icon" className="h-10 w-10 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-full" onClick={() => handleDelete(r)}>
//                                                         <Trash2 size={18} />
//                                                     </Button>
//                                                 </div>
//                                             </TableCell>
//                                         </TableRow>
//                                     ))
//                                 ) : (
//                                     <TableRow>
//                                         <TableCell colSpan={3} className="text-center py-20 text-slate-400 italic">ยังไม่มีข้อมูลผลัดการฝึกในระบบ</TableCell>
//                                     </TableRow>
//                                 )}
//                             </TableBody>
//                         </Table>
//                     </div>
//                 </div>
//             </div>

//             {/* Modal: เพิ่มและแก้ไขผลัด */}
//             <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
//                 <DialogContent className="w-[92%] max-w-[450px] rounded-[2rem] border-none p-8 font-sans">
//                     <DialogHeader>
//                         <DialogTitle className="text-2xl font-bold text-slate-800 mb-2">
//                             {selectedRotation ? 'แก้ไขข้อมูลผลัด' : 'เพิ่มผลัดการฝึกใหม่'}
//                         </DialogTitle>
//                     </DialogHeader>

//                     <div className="space-y-4 py-4">
//                         <div>
//                             <label className="text-sm font-bold text-slate-700 mb-1.5 block">ชื่อผลัด</label>
//                             <Input
//                                 value={formData.name}
//                                 onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                                 placeholder="เช่น ผลัดที่ 1/2569"
//                                 className="h-12 rounded-xl border-slate-200"
//                             />
//                         </div>

//                         <div className="grid grid-cols-2 gap-4">
//                             <div>
//                                 <label className="text-sm font-bold text-slate-700 mb-1.5 block">วันที่เริ่ม</label>
//                                 <Input
//                                     type="date"
//                                     value={formData.start_date}
//                                     onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
//                                     className="h-12 rounded-xl border-slate-200"
//                                 />
//                             </div>
//                             <div>
//                                 <label className="text-sm font-bold text-slate-700 mb-1.5 block">วันที่สิ้นสุด</label>
//                                 <Input
//                                     type="date"
//                                     value={formData.end_date}
//                                     onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
//                                     className="h-12 rounded-xl border-slate-200"
//                                 />
//                             </div>
//                         </div>

//                         <div>
//                             <label className="text-sm font-bold text-slate-700 mb-1.5 block">ปีการศึกษา</label>
//                             <Input
//                                 value={formData.academic_year}
//                                 onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
//                                 placeholder="เช่น 2569"
//                                 className="h-12 rounded-xl border-slate-200"
//                             />
//                         </div>
//                     </div>

//                     <DialogFooter className="mt-4 sm:mt-6">
//                         <Button
//                             onClick={handleSave}
//                             className="w-full bg-blue-600 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
//                         >
//                             บันทึกข้อมูลผลัด
//                         </Button>
//                     </DialogFooter>
//                 </DialogContent>
//             </Dialog>
//         </AdminLayout>
//     )
// }


// ver2
"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr' // ปรับให้ใช้ ssr client ตามมาตรฐานของคุณ
import AdminLayout from '@/components/AdminLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox" // สมมติว่ามี Shadcn Checkbox
import { Plus, Edit2, Trash2, Calendar, BookOpen, Hash } from "lucide-react"
import Swal from 'sweetalert2'
import { Skeleton } from "@/components/ui/skeleton"

export default function RotationsPage() {
    const [rotations, setRotations] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([]) // เก็บวิชาทั้งหมดในระบบ
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedRotation, setSelectedRotation] = useState<any>(null)

    const [formData, setFormData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        academic_year: '2569',
        round_number: 1,
        selected_subjects: [] as number[] // เก็บ ID ของวิชาที่เลือก
    })

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. ดึงข้อมูลผลัดพร้อมวิชาที่ผูกอยู่
            const { data: rotData } = await supabase
                .from('rotations')
                .select(`*, rotation_subjects(subject_id)`)
                .order('round_number', { ascending: true })

            // 2. ดึงวิชาทั้งหมดมาเตรียมไว้ให้เลือก
            const { data: subData } = await supabase.from('subjects').select('*').order('name')

            if (rotData) setRotations(rotData)
            if (subData) setSubjects(subData)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const handleOpenModal = (rotation: any = null) => {
        if (rotation) {
            setSelectedRotation(rotation)
            setFormData({
                name: rotation.name,
                start_date: rotation.start_date,
                end_date: rotation.end_date,
                academic_year: rotation.academic_year,
                round_number: rotation.round_number,
                selected_subjects: rotation.rotation_subjects.map((s: any) => s.subject_id)
            })
        } else {
            setSelectedRotation(null)
            setFormData({ name: '', start_date: '', end_date: '', academic_year: '2569', round_number: 1, selected_subjects: [] })
        }
        setIsModalOpen(true)
    }

    const handleSave = async () => {
        if (!formData.name || !formData.start_date || !formData.end_date) {
            return Swal.fire('กรุณากรอกข้อมูลให้ครบ', '', 'warning')
        }

        try {
            let rotationId = selectedRotation?.id

            // 1. บันทึกข้อมูลลงตาราง rotations
            const rotationPayload = {
                name: formData.name,
                start_date: formData.start_date,
                end_date: formData.end_date,
                academic_year: formData.academic_year,
                round_number: formData.round_number
            }

            if (selectedRotation) {
                await supabase.from('rotations').update(rotationPayload).eq('id', rotationId)
            } else {
                const { data } = await supabase.from('rotations').insert(rotationPayload).select().single()
                rotationId = data.id
            }

            // 2. จัดการตารางเชื่อม rotation_subjects (ลบเก่า - ใส่ใหม่)
            await supabase.from('rotation_subjects').delete().eq('rotation_id', rotationId)

            if (formData.selected_subjects.length > 0) {
                const junctionData = formData.selected_subjects.map(subId => ({
                    rotation_id: rotationId,
                    subject_id: subId
                }))
                await supabase.from('rotation_subjects').insert(junctionData)
            }

            Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false })
            setIsModalOpen(false)
            fetchData()
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        }
    }

    const handleDelete = async (id: number) => {
        const { isConfirmed } = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "ข้อมูลการเชื่อมโยงวิชาในผลัดนี้จะถูกลบออกทั้งหมด!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#f1f5f9',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        })

        if (isConfirmed) {
            try {
                // ลบจากตาราง rotations (ถ้าตั้ง ON DELETE CASCADE ไว้ใน DB ตาราง rotation_subjects จะหายเอง)
                // แต่เพื่อความชัวร์ ลบ manual ก่อนก็ได้ครับ
                await supabase.from('rotation_subjects').delete().eq('rotation_id', id)
                const { error } = await supabase.from('rotations').delete().eq('id', id)

                if (error) throw error

                Swal.fire({ icon: 'success', title: 'ลบข้อมูลเรียบร้อย', timer: 1500, showConfirmButton: false })
                fetchData()
            } catch (error: any) {
                Swal.fire('เกิดข้อผิดพลาด', error.message, 'error')
            }
        }
    }

    const toggleSubject = (subjectId: number) => {
        setFormData(prev => ({
            ...prev,
            selected_subjects: prev.selected_subjects.includes(subjectId)
                ? prev.selected_subjects.filter(id => id !== subjectId)
                : [...prev.selected_subjects, subjectId]
        }))
    }

    return (
        <AdminLayout>
            <div className="p-8 max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">จัดการผลัดการฝึก</h1>
                        <p className="text-slate-500">กำหนดช่วงเวลาและรายวิชาที่ฝึกในแต่ละผลัด</p>
                    </div>
                    <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 rounded-xl h-12 px-6 font-bold shadow-lg shadow-blue-100">
                        <Plus className="mr-2" size={20} /> เพิ่มผลัดใหม่
                    </Button>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest px-6">ผลัดที่</TableHead>
                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest px-6">ชื่อผลัด / วิชา</TableHead>
                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest px-6">ช่วงเวลา</TableHead>
                                <TableHead className="text-right px-6 font-black text-slate-400 uppercase text-[10px] tracking-widest">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={4} className="p-8"><Skeleton className="h-12 w-full rounded-xl" /></TableCell></TableRow>
                                ))
                            ) : rotations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-20 text-slate-400 italic">ยังไม่มีข้อมูลผลัดการฝึกในระบบ</TableCell>
                                </TableRow>
                            ) : (
                                <>
                                </>
                            )}
                            {rotations.map((rot) => (
                                <TableRow key={rot.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="px-6 py-5 font-black text-slate-400">#{rot.round_number}</TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="font-bold text-slate-900">{rot.name}</div>
                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                            {rot.rotation_subjects.length > 0 ? (
                                                rot.rotation_subjects.map((rs: any) => {
                                                    const sub = subjects.find(s => s.id === rs.subject_id);
                                                    return <span key={rs.subject_id} className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100">{sub?.name}</span>
                                                })
                                            ) : <span className="text-slate-300 text-[10px] italic">ยังไม่กำหนดวิชา</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                            <Calendar size={14} className="text-slate-400" />
                                            {rot.start_date} ถึง {rot.end_date}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">ปีการศึกษา {rot.academic_year}</div>
                                    </TableCell>
                                    <TableCell className="px-6 py-5 text-right">
                                        <Button variant="ghost" onClick={() => handleOpenModal(rot)} className="h-9 w-9 p-0 text-slate-400 hover:text-blue-600">
                                            <Edit2 size={16} />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            onClick={() => handleDelete(rot.id)}
                                            className="h-9 w-9 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl rounded-[2.5rem] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">{selectedRotation ? 'แก้ไขข้อมูลผลัด' : 'เพิ่มผลัดการฝึกใหม่'}</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-6 py-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                                <Hash size={16} className="text-blue-500" /> ลำดับผลัด (Round)
                            </label>
                            <Input type="number" value={formData.round_number} onChange={(e) => setFormData({ ...formData, round_number: parseInt(e.target.value) })} className="h-12 rounded-xl border-slate-200" />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block">ชื่อผลัด</label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น ผลัดที่ 1 (นวด-ผดุง)" className="h-12 rounded-xl border-slate-200" />
                        </div>

                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block text-emerald-600">วันที่เริ่ม</label>
                            <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="h-12 rounded-xl border-slate-200" />
                        </div>
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1.5 block text-red-500">วันที่สิ้นสุด</label>
                            <Input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="h-12 rounded-xl border-slate-200" />
                        </div>

                        {/* --- ส่วนเลือกวิชา (Subjects Selection) --- */}
                        <div className="col-span-2 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                            <label className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <BookOpen size={18} className="text-blue-500" /> กำหนดรายวิชาในผลัดนี้
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {subjects.map((sub) => (
                                    <div
                                        key={sub.id}
                                        onClick={() => toggleSubject(sub.id)}
                                        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${formData.selected_subjects.includes(sub.id)
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${formData.selected_subjects.includes(sub.id) ? 'bg-white text-blue-600 border-white' : 'border-slate-300'}`}>
                                            {formData.selected_subjects.includes(sub.id) && <Plus size={14} className="stroke-[4px]" />}
                                        </div>
                                        <span className="text-sm font-bold">{sub.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-100 transition-all">
                            บันทึกข้อมูลผลัด
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}