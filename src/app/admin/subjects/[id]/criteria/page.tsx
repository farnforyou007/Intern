"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, ChevronLeft, ListTodo, Edit2, Trash2, LayoutTemplate, Copy, X, FolderKanban } from "lucide-react"
import Swal from 'sweetalert2'

export default function ManageCriteriaPage() {
    const { id } = useParams()
    const router = useRouter()
    const [subject, setSubject] = useState<any>(null)
    const [groups, setGroups] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

    const [selectedGroup, setSelectedGroup] = useState<any>(null)
    const [groupForm, setGroupForm] = useState({ group_name: '', category_type: 'การฝึก', weight: 0.1 })
    const [items, setItems] = useState<any[]>([])
    const [itemForm, setItemForm] = useState({ question_text: '', description: '', allow_na: true })
    const [editingItem, setEditingItem] = useState<any>(null);

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const fetchData = async () => {
        setLoading(true)
        const { data: sub } = await supabase.from('subjects').select('*').eq('id', id).single()
        const { data: grps } = await supabase.from('evaluation_groups').select('*').eq('subject_id', id).order('group_name', { ascending: true })
        const { data: temps } = await supabase.from('eval_templates').select('*')

        if (sub) setSubject(sub)
        if (grps) setGroups(grps)
        if (temps) setTemplates(temps)
        setLoading(false)
    }

    const getWardTheme = (name: string) => {
        const lowerName = name.toUpperCase()
        if (lowerName.includes('ANC')) return { border: 'border-b-emerald-500', bg: 'bg-emerald-50/20' }
        if (lowerName.includes('LR')) return { border: 'border-b-blue-500', bg: 'bg-blue-50/20' }
        if (lowerName.includes('PP')) return { border: 'border-b-purple-500', bg: 'bg-purple-50/20' }
        return { border: 'border-b-slate-400', bg: 'bg-slate-50/50' }
    }

    // ฟังก์ชันช่วยเลือกสีตามประเภทงาน
    const getCategoryStyle = (type: string) => {
        switch (type) {
            case 'การฝึก': return 'bg-blue-600 text-white'
            case 'บุคลิก': return 'bg-indigo-600 text-white'
            case 'เล่ม': return 'bg-orange-500 text-white'
            default: return 'bg-slate-600 text-white'
        }
    }

    const handleDeleteGroup = (group: any) => {
        Swal.fire({
            title: 'ลบหมวดนี้?',
            html: `หมวด <b>"${group.group_name}"</b> จะถูกลบถาวร`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการลบ',
            confirmButtonColor: '#dc2626',
            customClass: { popup: 'rounded-[2rem] p-8' }
        }).then(async (res) => {
            if (res.isConfirmed) {
                const { error } = await supabase.from('evaluation_groups').delete().eq('id', group.id)
                if (!error) { fetchData(); Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false }) }
            }
        })
    }

    const handleDeleteItem = (item: any) => {
        Swal.fire({
            target: document.getElementById('item-modal-content') || document.body,
            title: 'ลบข้อคำถามนี้?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            customClass: { popup: 'rounded-[2rem]' }
        }).then(async (res) => {
            if (res.isConfirmed) {
                const { error } = await supabase.from('evaluation_items').delete().eq('id', item.id)
                if (!error) {
                    const { data } = await supabase.from('evaluation_items').select('*').eq('group_id', selectedGroup.id).order('order_index', { ascending: true })
                    setItems(data || [])
                }
            }
        })
    }

    const handleSaveGroup = async () => {
        const payload = { ...groupForm, subject_id: id }
        if (selectedGroup?.id) {
            await supabase.from('evaluation_groups').update(payload).eq('id', selectedGroup.id)
        } else {
            await supabase.from('evaluation_groups').insert([payload])
        }
        setIsGroupModalOpen(false)
        fetchData()
    }

    const openItemsModal = async (group: any) => {
        setSelectedGroup(group)
        const { data } = await supabase.from('evaluation_items').select('*').eq('group_id', group.id).order('order_index', { ascending: true })
        setItems(data || [])
        setIsItemModalOpen(true)
    }

    const handleEditClick = (item: any) => {
        setEditingItem(item);
        setItemForm({ question_text: item.question_text, description: item.description || '', allow_na: item.allow_na });
    };

    const resetItemForm = () => {
        setEditingItem(null);
        setItemForm({ question_text: '', description: '', allow_na: true });
    };

    const handleSaveItem = async () => {
        if (!itemForm.question_text) return;
        if (editingItem) {
            await supabase.from('evaluation_items').update(itemForm).eq('id', editingItem.id);
        } else {
            await supabase.from('evaluation_items').insert([{ ...itemForm, group_id: selectedGroup.id, order_index: items.length }]);
        }
        resetItemForm();
        const { data } = await supabase.from('evaluation_items').select('*').eq('group_id', selectedGroup.id).order('order_index', { ascending: true });
        setItems(data || []);
    };

    const handleApplyTemplate = async (templateId: number) => {
        const { data: tempItems } = await supabase.from('eval_template_items').select('*').eq('template_id', templateId)
        if (tempItems && tempItems.length > 0) {
            const newItems = tempItems.map(item => ({ group_id: selectedGroup.id, question_text: item.question_text, description: item.description, allow_na: item.allow_na, order_index: item.order_index }))
            await supabase.from('evaluation_items').insert(newItems)
            setIsTemplateModalOpen(false)
            openItemsModal(selectedGroup)
        }
    }

    useEffect(() => { fetchData() }, [id])

    const totalWeight = groups.reduce((acc, curr) => acc + (curr.weight || 0), 0)

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto pb-20 px-4 font-sans">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-6 text-sm font-medium transition-colors">
                    <ChevronLeft size={16} /> กลับไปหน้ารายวิชา
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 leading-tight">ตั้งค่าแบบประเมิน</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-blue-600 font-semibold text-base">{subject?.name}</p>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${totalWeight === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                รวม: {Math.round(totalWeight * 100)}%
                            </span>
                        </div>
                    </div>
                    <Button onClick={() => { setSelectedGroup(null); setGroupForm({ group_name: '', category_type: 'การฝึก', weight: 0.1 }); setIsGroupModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 shadow-md active:scale-95 transition-all w-full sm:w-auto text-sm font-bold">
                        <Plus className="mr-2" size={18} /> เพิ่มหมวดประเมิน
                    </Button>
                </div>

                {/* ปรับ Grid เป็น 2 คอลัมน์เพื่อให้ Ward เดียวกันอยู่คู่กัน */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {loading ? (
                        Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-3xl" />)
                    ) : (
                        groups.map((group) => {
                            const theme = getWardTheme(group.group_name);
                            return (
                                <div key={group.id} className={`group relative bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all border-b-4 ${theme.border} ${theme.bg}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-1.5">
                                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${getCategoryStyle(group.category_type)}`}>
                                                {group.category_type}
                                            </span>
                                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-500 border border-slate-200">
                                                น้ำหนัก: {Math.round(group.weight * 100)}%
                                            </span>
                                        </div>
                                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => { setSelectedGroup(group); setGroupForm(group); setIsGroupModalOpen(true); }}><Edit2 size={13} /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-600" onClick={() => handleDeleteGroup(group)}><Trash2 size={13} /></Button>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-5 leading-tight">{group.group_name}</h3>
                                    <Button onClick={() => openItemsModal(group)} className="w-full bg-white text-slate-600 border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 h-10 rounded-xl font-bold text-sm transition-all shadow-sm">
                                        <ListTodo size={16} className="mr-2" /> จัดการข้อคำถาม
                                    </Button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Modal: ข้อมูลหมวดประเมิน */}
            <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
                <DialogContent className="max-w-md w-[95vw] rounded-2xl p-6 border-none shadow-2xl overflow-hidden">
                    <DialogHeader><DialogTitle className="text-lg font-bold text-slate-800">ข้อมูลหมวดประเมิน</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">ชื่อหมวด</label>
                            <Input value={groupForm.group_name} onChange={e => setGroupForm({ ...groupForm, group_name: e.target.value })} className="h-10 rounded-lg bg-slate-50 border-none text-sm px-4 font-semibold" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">น้ำหนักคะแนน (%)</label>
                            <div className="relative flex items-center">
                                <Input type="number" value={Math.round(groupForm.weight * 100)} onChange={e => setGroupForm({ ...groupForm, weight: Number(e.target.value) / 100 })} className="h-10 rounded-lg bg-slate-50 border-none text-base font-bold px-4 pr-10" />
                                <span className="absolute right-4 font-bold text-slate-300 text-sm">%</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">ประเภทงาน</label>
                            <select className="w-full h-10 rounded-lg bg-slate-50 border-none px-4 text-xs font-bold appearance-none cursor-pointer" value={groupForm.category_type} onChange={e => setGroupForm({ ...groupForm, category_type: e.target.value })}>
                                <option value="การฝึก">การฝึกประสบการณ์</option>
                                <option value="บุคลิก">บุคลิกภาพ</option>
                                <option value="เล่ม">เล่มรายงาน</option>
                            </select>
                        </div>
                    </div>
                    <Button onClick={handleSaveGroup} className="w-full h-11 bg-blue-600 rounded-lg text-sm font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all">บันทึกข้อมูล</Button>
                </DialogContent>
            </Dialog>

            {/* Modal: จัดการข้อคำถาม */}
             <Dialog open={isItemModalOpen} onOpenChange={(open) => { if (!open) resetItemForm(); setIsItemModalOpen(open); }}>
                <DialogContent className="max-w-[95vw] w-[95vw] xl:max-w-7xl rounded-[2.5rem] p-0 border-none h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                    <button onClick={() => { resetItemForm(); setIsItemModalOpen(false); }} className="absolute right-6 top-6 z-50 p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={24} /></button>
                    <div id="item-modal-content" className="flex flex-col h-full bg-white">
                        <div className="px-8 py-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white shrink-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100"><ListTodo size={28} /></div>
                                <div>
                                    <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">จัดการข้อคำถาม</DialogTitle>
                                    <p className="text-blue-600 font-bold text-sm">กลุ่ม: {selectedGroup?.group_name}</p>
                                </div>
                            </div>
                            <Button onClick={() => setIsTemplateModalOpen(true)} variant="outline" className="rounded-full border-blue-200 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-all px-6 h-11 mr-12 shadow-sm">
                                <Copy size={16} className="mr-2" /> ใช้เทมเพลตมาตรฐาน
                            </Button>
                        </div>
                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            <div className={`w-full lg:w-[40%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto p-6 md:p-10 ${editingItem ? 'bg-orange-50/40' : 'bg-slate-50/40'}`}>
                                <h4 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                                    {editingItem ? <><Edit2 className="text-orange-500" /> แก้ไขข้อคำถาม</> : <><Plus className="text-blue-600" /> เพิ่มข้อคำถามใหม่</>}
                                </h4>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase ml-1">หัวข้อคำถาม</label>
                                        <Input placeholder="เช่น ความสะอาดของสถานที่..." value={itemForm.question_text} onChange={e => setItemForm({ ...itemForm, question_text: e.target.value })} className="h-14 bg-white border-2 border-slate-100 rounded-2xl text-lg px-6 font-bold shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase ml-1">คำอธิบาย</label>
                                        <textarea placeholder="ระบุรายละเอียดเพิ่มเติม..." value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="w-full p-6 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 h-32 outline-none text-base font-medium resize-none shadow-sm" />
                                    </div>
                                    <label className="flex items-center gap-4 cursor-pointer p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
                                        <input type="checkbox" checked={itemForm.allow_na} onChange={e => setItemForm({ ...itemForm, allow_na: e.target.checked })} className="w-6 h-6 accent-blue-600 rounded-lg cursor-pointer" />
                                        <div className="flex flex-col">
                                            <span className="text-slate-700 font-black text-base">เปิดใช้งาน N/A</span>
                                            <span className="text-slate-400 text-xs font-bold">อนุญาตให้ข้ามข้อนี้ได้ หากไม่สามารถประเมินได้</span>
                                        </div>
                                    </label>
                                    <div className="flex flex-col gap-3">
                                        <Button onClick={handleSaveItem} className={`w-full h-16 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-[0.98] ${editingItem ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
                                            {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มข้อคำถาม'}
                                        </Button>
                                        {editingItem && <Button variant="ghost" onClick={resetItemForm} className="text-slate-500 font-black hover:bg-slate-100 h-12 rounded-xl transition-all">ยกเลิกการแก้ไข</Button>}
                                    </div>
                                </div>
                            </div>
                            <div className="w-full lg:w-[60%] flex flex-col bg-white overflow-hidden">
                                <div className="px-10 py-4 border-b border-slate-50 shrink-0"><h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">รายการปัจจุบัน ({items.length} ข้อ)</h4></div>
                                <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-4 bg-slate-50/20">
                                    {items.map((item, idx) => (
                                        <div key={item.id} className={`bg-white border p-6 rounded-[2rem] flex items-start justify-between gap-4 transition-all group ${editingItem?.id === item.id ? 'border-orange-500 ring-4 ring-orange-50 shadow-xl' : 'border-slate-100 shadow-sm hover:border-blue-300'}`}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start gap-4">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${editingItem?.id === item.id ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white'}`}>{idx + 1}</div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-slate-800 font-black text-lg leading-tight break-words">{item.question_text}</p>
                                                        {item.description && <p className="text-slate-500 text-sm mt-2 line-clamp-2 italic leading-relaxed font-medium">{item.description}</p>}
                                                        <div className="flex gap-2 mt-4">
                                                            {item.allow_na ? (
                                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">เปิดใช้ N/A</span>
                                                            ) : (
                                                                <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg border border-rose-100">บังคับประเมิน</span>
                                                            )}
                                                            <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-lg border border-slate-100 uppercase tracking-tighter">Max: 5 Score</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-200 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" onClick={() => handleEditClick(item)}><Edit2 size={18} /></Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-200 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" onClick={() => handleDeleteItem(item)}><Trash2 size={18} /></Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="rounded-2xl max-w-lg w-[95vw] p-6 border-none shadow-2xl">
                    <DialogHeader><DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2"><LayoutTemplate className="text-blue-600" size={20} /> เทมเพลตมาตรฐาน</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-1 gap-3 mt-4">
                        {templates.map(t => (
                            <Button key={t.id} onClick={() => handleApplyTemplate(t.id)} className="w-full h-14 bg-slate-50 text-slate-800 hover:bg-blue-600 hover:text-white rounded-xl justify-between px-6 font-bold text-base border border-slate-100 shadow-none transition-all group">
                                {t.template_name}
                                <Plus size={16} className="text-slate-300 group-hover:text-white" />
                            </Button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}