"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, LayoutTemplate, Edit2, Trash2, ListTodo, Save, X, FileText } from "lucide-react"
import Swal from 'sweetalert2'

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
    const [templateName, setTemplateName] = useState('')

    // โลจิกข้อคำถามในเทมเพลต
    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [items, setItems] = useState<any[]>([])
    const [itemForm, setItemForm] = useState({ question_text: '', description: '', allow_na: true })
    const [editingItem, setEditingItem] = useState<any>(null)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const fetchData = async () => {
        setLoading(true)
        const { data } = await supabase.from('eval_templates').select('*').order('id', { ascending: true })
        if (data) setTemplates(data)
        setLoading(false)
    }

    useEffect(() => { fetchData() }, [])

    // จัดการ Template หลัก
    const handleSaveTemplate = async () => {
        if (!templateName) return
        if (selectedTemplate?.id) {
            await supabase.from('eval_templates').update({ template_name: templateName }).eq('id', selectedTemplate.id)
        } else {
            await supabase.from('eval_templates').insert([{ template_name: templateName }])
        }
        setTemplateName(''); setSelectedTemplate(null); setIsModalOpen(false); fetchData()
        Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[2rem]' } })
    }

    const handleDeleteTemplate = async (template: any) => {
        const { isConfirmed } = await Swal.fire({
            title: 'ยืนยันการลบเทมเพลต?',
            html: `เทมเพลต <b>"${template.template_name}"</b> และข้อคำถามภายในจะถูกลบถาวร`,
            icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบข้อมูล', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#dc2626', reverseButtons: true,
            customClass: { popup: 'rounded-[2.5rem] p-10', confirmButton: 'rounded-full px-8', cancelButton: 'rounded-full px-8' }
        })
        if (isConfirmed) {
            await supabase.from('eval_templates').delete().eq('id', template.id)
            fetchData()
        }
    }

    // จัดการข้อคำถามใน Template
    const openItemsModal = async (template: any) => {
        setSelectedTemplate(template)
        const { data } = await supabase.from('eval_template_items').select('*').eq('template_id', template.id).order('order_index', { ascending: true })
        setItems(data || [])
        setIsItemModalOpen(true)
    }

    const handleSaveItem = async () => {
        if (!itemForm.question_text) return
        if (editingItem) {
            await supabase.from('eval_template_items').update(itemForm).eq('id', editingItem.id)
        } else {
            await supabase.from('eval_template_items').insert([{ ...itemForm, template_id: selectedTemplate.id, order_index: items.length }])
        }
        setEditingItem(null); setItemForm({ question_text: '', description: '', allow_na: true })
        const { data } = await supabase.from('eval_template_items').select('*').eq('template_id', selectedTemplate.id).order('order_index', { ascending: true })
        setItems(data || [])
    }

    const handleDeleteItem = async (itemId: number) => {
        await supabase.from('eval_template_items').delete().eq('id', itemId)
        const { data } = await supabase.from('eval_template_items').select('*').eq('template_id', selectedTemplate.id).order('order_index', { ascending: true })
        setItems(data || [])
    }

    return (
        <AdminLayout>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-900">
                            <LayoutTemplate className="text-blue-600" size={32} /> เทมเพลตมาตรฐาน
                        </h1>
                        <p className="text-slate-500 mt-1">สร้างชุดข้อคำถามกลางเพื่อนำไปใช้ในวิชาต่างๆ</p>
                    </div>
                    <Button onClick={() => { setSelectedTemplate(null); setTemplateName(''); setIsModalOpen(true); }} className="bg-blue-600 rounded-xl h-12 px-6 shadow-lg">
                        <Plus size={20} className="mr-2" /> สร้างเทมเพลตใหม่
                    </Button>
                </div>

                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="px-8 font-bold text-slate-600">ชื่อเทมเพลต</TableHead>
                                <TableHead className="text-center font-bold text-slate-600">จัดการข้อคำถาม</TableHead>
                                <TableHead className="text-right px-8 font-bold text-slate-600">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                [...Array(3)].map((_, i) => <TableRow key={i}><TableCell colSpan={3} className="p-8"><Skeleton className="h-14 w-full rounded-xl" /></TableCell></TableRow>)
                            ) : templates.map((t) => (
                                <TableRow key={t.id} className="hover:bg-slate-50/30">
                                    <TableCell className="px-8 py-5 font-bold text-slate-800 text-lg">{t.template_name}</TableCell>
                                    <TableCell className="text-center">
                                        <Button onClick={() => openItemsModal(t)} variant="outline" className="rounded-xl gap-2 border-blue-100 text-blue-600 hover:bg-blue-50">
                                            <ListTodo size={16} /> ตั้งค่าข้อคำถาม
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => { setSelectedTemplate(t); setTemplateName(t.template_name); setIsModalOpen(true); }} className="text-blue-600 hover:bg-blue-50 rounded-full"><Edit2 size={18} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(t)} className="text-red-600 hover:bg-red-50 rounded-full"><Trash2 size={18} /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal ชื่อเทมเพลต */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-[400px] rounded-[2rem] p-8 border-none shadow-2xl">
                    <DialogHeader><DialogTitle className="text-2xl font-bold text-slate-800">{selectedTemplate ? 'แก้ไขชื่อเทมเพลต' : 'สร้างเทมเพลตใหม่'}</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <label className="text-sm font-bold text-slate-700">ชื่อชุดเทมเพลต</label>
                        <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="เช่น เกณฑ์ประเมินจรรยาบรรณ..." className="h-14 rounded-2xl border-slate-100 bg-slate-50 font-bold" />
                    </div>
                    <Button onClick={handleSaveTemplate} className="w-full bg-blue-600 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-200"><Save size={20} className="mr-2" /> บันทึก</Button>
                </DialogContent>
            </Dialog>

            {/* Modal จัดการข้อคำถามในเทมเพลต (ใช้สัดส่วน 40/60 เหมือนหน้า Criteria) */}
            <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
                <DialogContent className="max-w-[95vw] w-[95vw] xl:max-w-7xl rounded-[2.5rem] p-0 border-none h-[85vh] flex flex-col shadow-2xl overflow-hidden bg-white">
                    <div className="flex flex-col h-full">
                        <div className="px-10 py-6 border-b flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-2xl text-white"><ListTodo size={24} /></div>
                                <div>
                                    <DialogTitle className="text-2xl font-black text-slate-800">จัดการข้อคำถามเทมเพลต</DialogTitle>
                                    <p className="text-blue-600 font-bold">เทมเพลต: {selectedTemplate?.template_name}</p>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={() => setIsItemModalOpen(false)} className="rounded-full"><X size={24} /></Button>
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* ฝั่งซ้าย: ฟอร์มเพิ่ม/แก้ไข */}
                            <div className={`w-full lg:w-[40%] p-10 overflow-y-auto border-r border-slate-50 ${editingItem ? 'bg-orange-50/30' : 'bg-slate-50/30'}`}>
                                <h4 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                                    {editingItem ? <><Edit2 className="text-orange-500" /> แก้ไขข้อคำถาม</> : <><Plus className="text-blue-600" /> เพิ่มข้อคำถามใหม่</>}
                                </h4>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase">หัวข้อประเมิน</label>
                                        <Input value={itemForm.question_text} onChange={e => setItemForm({ ...itemForm, question_text: e.target.value })} className="h-14 bg-white rounded-2xl font-bold"
                                            placeholder="ระบุคำถาม..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault(); // กันไม่ให้ Submit Form ปกติ
                                                    handleSaveItem();   // เรียกฟังก์ชันบันทึกที่เขียนไว้แล้ว
                                                }
                                            }} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase">คำอธิบาย (ถ้ามี)</label>
                                        <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="w-full p-4 rounded-2xl bg-white border border-slate-200 h-32 outline-none resize-none font-medium"
                                            placeholder="ระบุเกณฑ์การให้คะแนน..."
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault(); // กันไม่ให้ Submit Form ปกติ
                                                    handleSaveItem();   // เรียกฟังก์ชันบันทึกที่เขียนไว้แล้ว
                                                }
                                            }} />
                                    </div>
                                    <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer">
                                        <input type="checkbox" checked={itemForm.allow_na} onChange={e => setItemForm({ ...itemForm, allow_na: e.target.checked })} className="w-5 h-5 accent-blue-600" />
                                        <span className="text-slate-700 font-bold">เปิดใช้งาน N/A</span>
                                    </label>
                                    <div className="flex flex-col gap-3">
                                        <Button onClick={handleSaveItem} className={`h-16 rounded-2xl font-black text-lg ${editingItem ? 'bg-orange-500' : 'bg-blue-600'}`}>
                                            {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มลงเทมเพลต'}
                                        </Button>
                                        {editingItem && <Button variant="ghost" onClick={() => { setEditingItem(null); setItemForm({ question_text: '', description: '', allow_na: true }) }}>ยกเลิก</Button>}
                                    </div>
                                </div>
                            </div>

                            {/* ฝั่งขวา: รายการข้อคำถาม */}
                            <div className="flex-1 p-10 overflow-y-auto bg-white space-y-4">
                                <h4 className="font-black text-slate-300 uppercase text-[10px] tracking-widest mb-4">รายการทั้งหมด ({items.length} ข้อ)</h4>
                                {items.map((item, idx) => (
                                    <div key={item.id} className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl flex items-start justify-between group hover:border-blue-200 transition-all">
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">{idx + 1}</div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-lg leading-tight">{item.question_text}</p>
                                                {item.description && <p className="text-slate-400 text-sm mt-1">{item.description}</p>}
                                                <div className="flex gap-2 mt-3">
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase tracking-tighter">
                                                        {item.allow_na ? 'Allow N/A' : 'Required'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setItemForm({ question_text: item.question_text, description: item.description || '', allow_na: item.allow_na }); }} className="h-9 w-9 text-blue-600"><Edit2 size={16} /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="h-9 w-9 text-red-600"><Trash2 size={16} /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}