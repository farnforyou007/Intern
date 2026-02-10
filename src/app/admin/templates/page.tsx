"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, LayoutTemplate, Edit2, Trash2, ListTodo, Save, X, FileText, GripVertical } from "lucide-react"
import Swal from 'sweetalert2'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            const newItems = arrayMove(items, oldIndex, newIndex);

            setItems(newItems); // อัปเดต UI ทันที

            // อัปเดต order_index ลง Supabase
            const updates = newItems.map((item, index) => ({
                id: item.id,
                order_index: index,
                template_id: selectedTemplate.id,
                question_text: item.question_text,
                description: item.description,
                allow_na: item.allow_na
            }));
            await supabase.from('eval_template_items').upsert(updates);
        }
    };

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
            <Dialog open={isItemModalOpen} onOpenChange={setIsItemModalOpen}>
                <DialogContent className="max-w-[95vw] w-[95vw] xl:max-w-7xl rounded-[2.5rem] p-0 border-none h-[85vh] flex flex-col shadow-2xl overflow-hidden bg-white focus:outline-none">
                    <div className="flex flex-col h-full">
                        {/* Header Modal */}
                        <div className="px-10 py-6 border-b flex justify-between items-center bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200"><ListTodo size={24} /></div>
                                <div>
                                    <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">จัดการข้อคำถามเทมเพลต</DialogTitle>
                                    <p className="text-blue-600 font-bold uppercase text-xs tracking-widest mt-1">Template: {selectedTemplate?.template_name}</p>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={() => setIsItemModalOpen(false)} className="rounded-full w-12 h-12 hover:bg-slate-100 text-slate-400"><X size={24} /></Button>
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* ฝั่งซ้าย: ฟอร์มเพิ่ม/แก้ไข (โค้ดเดิม) */}
                            <div className={`w-full lg:w-[38%] p-10 overflow-y-auto border-r border-slate-50 ${editingItem ? 'bg-orange-50/30' : 'bg-slate-50/30'}`}>
                                <h4 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                                    {editingItem ? <><Edit2 className="text-orange-500" /> แก้ไขข้อคำถาม</> : <><Plus className="text-blue-600" /> เพิ่มข้อคำถามใหม่</>}
                                </h4>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">หัวข้อประเมิน (ตัวเข้ม)</label>
                                        <Input
                                            value={itemForm.question_text}
                                            onChange={e => setItemForm({ ...itemForm, question_text: e.target.value })}
                                            className="h-14 bg-white rounded-2xl font-bold shadow-sm border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500"
                                            placeholder="เช่น ทักษะการนวดรักษา..."
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveItem()}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">คำอธิบายรายละเอียด (ตัวบาง)</label>
                                        <textarea
                                            value={itemForm.description}
                                            onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                            className="w-full p-5 rounded-2xl bg-white border-none ring-1 ring-slate-100 shadow-sm h-60 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-600"
                                            placeholder="ระบุคำอธิบายเพิ่มเติม..."
                                            onKeyDown={(e) => {
                                                // ถ้ากด Enter อย่างเดียว (โดยไม่กด Shift) ให้ทำการบันทึก
                                                if (e.key === 'Enter' && e.shiftKey) {
                                                    e.preventDefault(); // ป้องกันการขึ้นบรรทัดใหม่ใน textarea
                                                    handleSaveItem();
                                                }
                                                // ถ้ากด Shift + Enter จะยังคงขึ้นบรรทัดใหม่ได้ตามปกติ
                                            }}

                                        />
                                    </div>
                                    <label className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm cursor-pointer group">
                                        <input type="checkbox" checked={itemForm.allow_na} onChange={e => setItemForm({ ...itemForm, allow_na: e.target.checked })} className="w-5 h-5 accent-blue-600 rounded transition-all" />
                                        <span className="text-slate-700 font-bold group-hover:text-blue-600">เปิดใช้งานตัวเลือก N/A</span>
                                    </label>
                                    <div className="flex flex-col gap-3 pt-4">
                                        <Button onClick={handleSaveItem} className={`h-16 rounded-2xl font-black text-lg shadow-lg transition-all active:scale-95 ${editingItem ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
                                            {editingItem ? <><Save className="mr-2" /> บันทึกการแก้ไข</> : <><Plus className="mr-2" /> เพิ่มลงเทมเพลต</>}
                                        </Button>
                                        {editingItem && (
                                            <Button variant="ghost" className="h-12 font-bold text-slate-400" onClick={() => { setEditingItem(null); setItemForm({ question_text: '', description: '', allow_na: true }) }}>
                                                ยกเลิกการแก้ไข
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ฝั่งขวา: รายการข้อคำถาม (รองรับ Drag & Drop) */}
                            <div className="flex-1 p-10 overflow-y-auto bg-white space-y-4 custom-scrollbar">
                                <h4 className="font-black text-slate-300 uppercase text-[10px] tracking-widest mb-6 border-b pb-4 flex justify-between items-center">
                                    <span>รายการข้อคำถามทั้งหมด ({items.length} ข้อ)</span>
                                    <span className="text-blue-400 normal-case italic">ลากสลับตำแหน่งข้อคำถามได้ที่ไอคอนด้านซ้าย</span>
                                </h4>

                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                        <div className="space-y-4">
                                            {items.map((item, idx) => (
                                                <SortableItem
                                                    key={item.id}
                                                    item={item}
                                                    idx={idx}
                                                    setEditingItem={setEditingItem}
                                                    setItemForm={setItemForm}
                                                    handleDeleteItem={handleDeleteItem}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>

                                {items.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                        <ListTodo size={64} strokeWidth={1} className="mb-4 opacity-20" />
                                        <p className="italic font-medium">ยังไม่มีข้อคำถามในเทมเพลตนี้</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            {selectedTemplate ? <Edit2 className="text-blue-600" /> : <Plus className="text-blue-600" />}
                            {selectedTemplate ? 'แก้ไขชื่อเทมเพลต' : 'สร้างเทมเพลตใหม่'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อเทมเพลต</label>
                        <Input
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            placeholder="เช่น แบบประเมินบุคลิกภาพ..."
                            className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg focus:ring-2 ring-blue-500 mt-2"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleSaveTemplate}
                            className="w-full h-14 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-lg shadow-lg shadow-blue-100"
                        >
                            บันทึกข้อมูล
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}

// --- Component ย่อยสำหรับแต่ละข้อคำถาม (Sortable) ---
function SortableItem({ item, idx, setEditingItem, setItemForm, handleDeleteItem }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`bg-slate-50/50 border border-slate-100 p-6 rounded-3xl flex items-start justify-between group hover:border-blue-200 transition-all ${isDragging ? 'shadow-2xl ring-2 ring-blue-500 bg-white' : ''}`}
        >
            <div className="flex gap-4 items-start flex-1">
                {/* ปุ่มสำหรับลาก */}
                <div {...attributes} {...listeners} className="mt-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-blue-500">
                    <GripVertical size={20} />
                </div>

                {/* กล่องตัวเลขที่ล็อคขนาดให้เท่ากันเป๊ะ (Fixed Size) */}
                <div className="w-9 h-9 aspect-square bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                    {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-lg leading-tight break-words">{item.question_text}</p>
                    {item.description && <p className="text-slate-400 text-sm mt-1 break-words line-clamp-2">{item.description}</p>}
                    <div className="flex gap-2 mt-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded uppercase">
                            {item.allow_na ? 'Allow N/A' : 'Required'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setItemForm({ question_text: item.question_text, description: item.description || '', allow_na: item.allow_na }); }} className="h-9 w-9 text-blue-600 hover:bg-blue-50"><Edit2 size={16} /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="h-9 w-9 text-red-600 hover:bg-red-50"><Trash2 size={16} /></Button>
            </div>
        </div>
    );
}