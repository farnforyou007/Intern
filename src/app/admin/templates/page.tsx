"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LayoutTemplate, Plus, Trash2, ChevronRight, Edit3 } from "lucide-react"
import Link from 'next/link'
import Swal from 'sweetalert2'

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [tempName, setTempName] = useState('')
    const [editingId, setEditingId] = useState<number | null>(null) // สำหรับเก็บ id ที่กำลังแก้ไข

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const fetchData = async () => {
        const { data } = await supabase.from('eval_templates').select('*').order('id', { ascending: false })
        setTemplates(data || [])
    }

    const handleSave = async () => {
        if (!tempName) return

        if (editingId) {
            // กรณีแก้ไข (Update)
            await supabase.from('eval_templates').update({ template_name: tempName }).eq('id', editingId)
        } else {
            // กรณีสร้างใหม่ (Create)
            await supabase.from('eval_templates').insert([{ template_name: tempName }])
        }

        setTempName('')
        setEditingId(null)
        setIsModalOpen(false)
        fetchData()
        Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false })
    }

    const openEditModal = (template: any) => {
        setEditingId(template.id)
        setTempName(template.template_name)
        setIsModalOpen(true)
    }

    const handleDelete = (id: number, name: string) => {
        Swal.fire({
            title: 'ลบเทมเพลตนี้?',
            html: `คำถามทั้งหมดใน <b>"${name}"</b> จะถูกลบออกถาวร`,
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
        }).then(async (res) => {
            if (res.isConfirmed) {
                await supabase.from('eval_templates').delete().eq('id', id)
                fetchData()
            }
        })
    }

    useEffect(() => { fetchData() }, [])

    return (
        <AdminLayout>
            {/* <div className="max-w-4xl mx-auto px-4 font-sans pb-20"> */}
            <div className="max-w-6xl mx-auto">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                            <LayoutTemplate className="text-blue-600" size={28} /> คลังเทมเพลต
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">จัดการชุดคำถามมาตรฐานเพื่อนำไปใช้ในวิชาต่างๆ</p>
                    </div>
                    <Button
                        onClick={() => { setEditingId(null); setTempName(''); setIsModalOpen(true); }}
                        className="w-full sm:w-auto bg-blue-600 rounded-xl h-11 px-6 shadow-md hover:bg-blue-700 active:scale-95 transition-all text-sm font-bold"
                    >
                        <Plus className="mr-2" size={18} /> สร้างเทมเพลตใหม่
                    </Button>
                </div>

                {/* รายการแบบ Column เดียว เพื่อรองรับชื่อยาวๆ */}
                <div className="space-y-4">
                    {templates.map(t => (
                        <div key={t.id} className="bg-white p-4 sm:p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-center justify-between group gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold shrink-0">
                                    <LayoutTemplate size={20} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-bold text-lg text-slate-800 break-words leading-tight">{t.template_name}</h3>
                                    <p className="text-[10px] text-blue-500 font-black tracking-widest uppercase mt-0.5">Master Template</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                                <Button
                                    variant="ghost"
                                    className="h-10 w-10 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={() => openEditModal(t)}
                                >
                                    <Edit3 size={18} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-10 w-10 rounded-full text-red-200 hover:text-red-500 hover:bg-red-50"
                                    onClick={() => handleDelete(t.id, t.template_name)}
                                >
                                    <Trash2 size={18} />
                                </Button>
                                <div className="w-[1px] h-6 bg-slate-100 mx-1 hidden sm:block"></div>
                                <Link href={`/admin/templates/${t.id}`}>
                                    <Button variant="ghost" className="h-10 px-4 rounded-full text-blue-600 hover:bg-blue-50 font-bold text-sm flex items-center gap-1">
                                        จัดการข้อคำถาม <ChevronRight size={18} />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium">ยังไม่มีเทมเพลตในคลัง</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal สำหรับทั้ง สร้าง และ แก้ไข */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="rounded-[2rem] p-8 md:p-10 border-none shadow-2xl max-w-lg w-[95vw]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-slate-800">
                            {editingId ? 'แก้ไขชื่อเทมเพลต' : 'สร้างเทมเพลตใหม่'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <label className="text-sm font-bold text-slate-600 mb-2 block ml-1">ชื่อชุดเทมเพลต</label>
                        <Input
                            placeholder="เช่น เล่มรายงานมาตรฐานสำหรับการฝึกงาน ANC"
                            value={tempName}
                            onChange={e => setTempName(e.target.value)}
                            className="h-14 rounded-xl bg-slate-50 border-none text-base px-5 focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <div className="flex gap-3">

                        <Button
                            onClick={handleSave}
                            className="flex-[2] h-12 bg-blue-600 hover:bg-blue-700 rounded-xl text-base font-bold shadow-md active:scale-95 transition-all"
                        >
                            {editingId ? 'บันทึกการแก้ไข' : 'สร้างเทมเพลต'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 h-12 rounded-xl font-bold text-slate-500"
                        >
                            ยกเลิก
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}