
// // src/app/admin/subjects/[id]/criteria/page.tsx
// // src/app/admin/subjects/[id]/criteria/page.tsx
// "use client"
// import { useState, useEffect, useCallback } from 'react'
// import { useParams, useRouter, useSearchParams } from 'next/navigation'
// import { createClient } from '@supabase/supabase-js'
// import AdminLayout from '@/components/AdminLayout'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Skeleton } from "@/components/ui/skeleton"
// import { Plus, ChevronLeft, ListTodo, Edit2, Trash2, LayoutTemplate, Copy, X, Save } from "lucide-react" // ตรวจสอบการ Import ให้ครบ
// import Swal from 'sweetalert2'

// export default function ManageCriteriaPage() {
//     const params = useParams()
//     const searchParams = useSearchParams()
//     const router = useRouter()

//     const id = params.id as string
//     const subId = searchParams.get('subId') // ดึงจาก ?subId=...

//     const [subject, setSubject] = useState<any>(null)
//     const [subSubject, setSubSubject] = useState<any>(null)
//     const [groups, setGroups] = useState<any[]>([])
//     const [templates, setTemplates] = useState<any[]>([])
//     const [loading, setLoading] = useState(true)

//     const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
//     const [isItemModalOpen, setIsItemModalOpen] = useState(false)
//     const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

//     const [selectedGroup, setSelectedGroup] = useState<any>(null)
//     const [groupForm, setGroupForm] = useState({ group_name: '', category_type: 'การฝึก', weight: 0.1 })
//     const [items, setItems] = useState<any[]>([])
//     const [itemForm, setItemForm] = useState({ question_text: '', description: '', allow_na: true })
//     const [editingItem, setEditingItem] = useState<any>(null)

//     const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

//     // แก้ไข fetchData ให้ถูกต้อง
//     const fetchData = useCallback(async () => {
//         setLoading(true)
//         try {
//             // 1. ดึงข้อมูลวิชาหลัก
//             const { data: sub } = await supabase.from('subjects').select('*').eq('id', id).single()
//             if (sub) setSubject(sub)

//             // 2. ดึงข้อมูลวิชาย่อย (ถ้ามี subId)
//             if (subId) {
//                 const { data: ss } = await supabase.from('sub_subjects').select('*').eq('id', subId).single()
//                 if (ss) setSubSubject(ss)
//             } else {
//                 setSubSubject(null)
//             }

//             // 3. ดึงกลุ่มประเมิน
//             let query = supabase.from('evaluation_groups').select('*').eq('subject_id', id)
//             if (subId) {
//                 query = query.eq('sub_subject_id', subId)
//             } else {
//                 query = query.is('sub_subject_id', null)
//             }

//             const { data: grps } = await query.order('group_name', { ascending: true })
//             if (grps) setGroups(grps)

//             const { data: temps } = await supabase.from('eval_templates').select('*')
//             if (temps) setTemplates(temps)
//         } catch (error) {
//             console.error('Fetch error:', error)
//         }
//         setLoading(false)
//     }, [id, subId, supabase])

//     useEffect(() => { fetchData() }, [fetchData])

//     // ฟังก์ชัน Save Group ที่ต้องส่ง subId ไปด้วย
//     const handleSaveGroup = async () => {
//         const payload = {
//             ...groupForm,
//             subject_id: id,
//             sub_subject_id: subId || null // สำคัญ: ต้องบันทึก subId ลงไปด้วยเพื่อให้ข้อมูลแยกกัน
//         }

//         if (selectedGroup?.id) {
//             await supabase.from('evaluation_groups').update(payload).eq('id', selectedGroup.id)
//         } else {
//             await supabase.from('evaluation_groups').insert([payload])
//         }
//         setIsGroupModalOpen(false)
//         fetchData()
//     }

//     const getWardTheme = (name: string) => {
//         const lowerName = name.toUpperCase()
//         if (lowerName.includes('ANC')) return { border: 'border-b-emerald-500', bg: 'bg-emerald-50/20' }
//         if (lowerName.includes('LR')) return { border: 'border-b-blue-500', bg: 'bg-blue-50/20' }
//         if (lowerName.includes('PP')) return { border: 'border-b-purple-500', bg: 'bg-purple-50/20' }
//         return { border: 'border-b-slate-400', bg: 'bg-slate-50/50' }
//     }

//     // ฟังก์ชันช่วยเลือกสีตามประเภทงาน
//     const getCategoryStyle = (type: string) => {
//         switch (type) {
//             case 'การฝึก': return 'bg-blue-600 text-white'
//             case 'บุคลิก': return 'bg-indigo-600 text-white'
//             case 'เล่ม': return 'bg-orange-500 text-white'
//             default: return 'bg-slate-600 text-white'
//         }
//     }

//     const handleDeleteGroup = (group: any) => {
//         Swal.fire({
//             title: 'ลบหมวดนี้?',
//             html: `หมวด <b>"${group.group_name}"</b> จะถูกลบถาวร`,
//             icon: 'warning',
//             showCancelButton: true,
//             confirmButtonText: 'ยืนยันการลบ',
//             confirmButtonColor: '#dc2626',
//             customClass: { popup: 'rounded-[2rem] p-8' }
//         }).then(async (res) => {
//             if (res.isConfirmed) {
//                 const { error } = await supabase.from('evaluation_groups').delete().eq('id', group.id)
//                 if (!error) { fetchData(); Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false }) }
//             }
//         })
//     }

//     const handleDeleteItem = (item: any) => {
//         Swal.fire({
//             target: document.getElementById('item-modal-content') || document.body,
//             title: 'ลบข้อคำถามนี้?',
//             icon: 'warning',
//             showCancelButton: true,
//             confirmButtonText: 'ยืนยัน',
//             customClass: { popup: 'rounded-[2rem]' }
//         }).then(async (res) => {
//             if (res.isConfirmed) {
//                 const { error } = await supabase.from('evaluation_items').delete().eq('id', item.id)
//                 if (!error) {
//                     const { data } = await supabase.from('evaluation_items').select('*').eq('group_id', selectedGroup.id).order('order_index', { ascending: true })
//                     setItems(data || [])
//                 }
//             }
//         })
//     }



//     const openItemsModal = async (group: any) => {
//         setSelectedGroup(group)
//         const { data } = await supabase.from('evaluation_items').select('*').eq('group_id', group.id).order('order_index', { ascending: true })
//         setItems(data || [])
//         setIsItemModalOpen(true)
//     }

//     const handleEditClick = (item: any) => {
//         setEditingItem(item);
//         setItemForm({ question_text: item.question_text, description: item.description || '', allow_na: item.allow_na });
//     };

//     const resetItemForm = () => {
//         setEditingItem(null);
//         setItemForm({ question_text: '', description: '', allow_na: true });
//     };

//     const handleSaveItem = async () => {
//         if (!itemForm.question_text) return;
//         if (editingItem) {
//             await supabase.from('evaluation_items').update(itemForm).eq('id', editingItem.id);
//         } else {
//             await supabase.from('evaluation_items').insert([{ ...itemForm, group_id: selectedGroup.id, order_index: items.length }]);
//         }
//         resetItemForm();
//         const { data } = await supabase.from('evaluation_items').select('*').eq('group_id', selectedGroup.id).order('order_index', { ascending: true });
//         setItems(data || []);
//     };

// const handleApplyTemplate = async (templateId: number) => {
//     const { data: tempItems } = await supabase.from('eval_template_items').select('*').eq('template_id', templateId)
//     if (tempItems && tempItems.length > 0) {
//         const newItems = tempItems.map(item => ({ group_id: selectedGroup.id, question_text: item.question_text, description: item.description, allow_na: item.allow_na, order_index: item.order_index }))
//         await supabase.from('evaluation_items').insert(newItems)
//         setIsTemplateModalOpen(false)
//         openItemsModal(selectedGroup)
//     }
// }

//     useEffect(() => { fetchData() }, [id])

//     const totalWeight = groups.reduce((acc, curr) => acc + (curr.weight || 0), 0)

//     return (
//         <AdminLayout>
//             <div className="max-w-7xl mx-auto pb-20 px-4 font-sans">
//                 <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-6 text-sm font-medium transition-colors">
//                     <ChevronLeft size={16} /> กลับไปหน้ารายวิชา
//                 </button>

//                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
//                     <div>
//                         <div className="flex items-center gap-3">
//                             <h1 className="text-2xl font-bold text-slate-900 leading-tight">ตั้งค่าแบบประเมิน</h1>
//                             {/* แสดง Badge วิชาย่อยถ้ามี */}
//                             {subSubject && (
//                                 <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-blue-100">
//                                     {subSubject.name}
//                                 </span>
//                             )}
//                         </div>
//                         <div className="flex items-center gap-2 mt-1">
//                             <p className="text-slate-500 font-bold text-base">{subject?.name}</p>
//                             <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${totalWeight === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
//                                 รวม: {Math.round(totalWeight * 100)}%
//                             </span>
//                         </div>
//                     </div>
//                     <Button onClick={() => { setSelectedGroup(null); setGroupForm({ group_name: '', category_type: 'การฝึก', weight: 0.1 }); setIsGroupModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 shadow-md active:scale-95 transition-all w-full sm:w-auto text-sm font-bold">
//                         <Plus className="mr-2" size={18} /> เพิ่มหมวดประเมิน
//                     </Button>
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
//                     {loading ? (
//                         Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-3xl" />)
//                     ) : (
//                         groups.map((group) => {
//                             const theme = getWardTheme(group.group_name);
//                             return (
//                                 <div key={group.id} className={`group relative bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all border-b-4 ${theme.border} ${theme.bg}`}>
//                                     <div className="flex justify-between items-start mb-4">
//                                         <div className="flex gap-1.5">
//                                             <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${getCategoryStyle(group.category_type)}`}>
//                                                 {group.category_type}
//                                             </span>
//                                             <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-500 border border-slate-200">
//                                                 น้ำหนัก: {Math.round(group.weight * 100)}%
//                                             </span>
//                                         </div>
//                                         <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
//                                             <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600" onClick={() => { setSelectedGroup(group); setGroupForm(group); setIsGroupModalOpen(true); }}><Edit2 size={13} /></Button>
//                                             <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-600" onClick={() => handleDeleteGroup(group)}><Trash2 size={13} /></Button>
//                                         </div>
//                                     </div>
//                                     <h3 className="text-lg font-bold text-slate-800 mb-5 leading-tight">{group.group_name}</h3>
//                                     <Button onClick={() => openItemsModal(group)} className="w-full bg-white text-slate-600 border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 h-10 rounded-xl font-bold text-sm transition-all shadow-sm">
//                                         <ListTodo size={16} className="mr-2" /> จัดการข้อคำถาม
//                                     </Button>
//                                 </div>
//                             )
//                         })
//                     )}
//                 </div>
//             </div>

//             {/* Modal หมวดประเมิน (ปรับปรุงปุ่ม) */}
//             <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
//                 <DialogContent className="max-w-md w-[95vw] rounded-2xl p-6 border-none shadow-2xl overflow-hidden">
//                     <DialogHeader><DialogTitle className="text-lg font-bold text-slate-800">ข้อมูลหมวดประเมิน</DialogTitle></DialogHeader>
//                     <div className="space-y-4 py-4">
//                         <div className="space-y-1.5">
//                             <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">ชื่อหมวด</label>
//                             <Input value={groupForm.group_name} onChange={e => setGroupForm({ ...groupForm, group_name: e.target.value })} className="h-10 rounded-lg bg-slate-50 border-none text-sm px-4 font-semibold" />
//                         </div>
//                         <div className="space-y-1.5">
//                             <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">น้ำหนักคะแนน (%)</label>
//                             <div className="relative flex items-center">
//                                 <Input type="number" value={Math.round(groupForm.weight * 100)} onChange={e => setGroupForm({ ...groupForm, weight: Number(e.target.value) / 100 })} className="h-10 rounded-lg bg-slate-50 border-none text-base font-bold px-4 pr-10" />
//                                 <span className="absolute right-4 font-bold text-slate-300 text-sm">%</span>
//                             </div>
//                         </div>
//                         <div className="space-y-1.5">
//                             <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">ประเภทงาน</label>
//                             <select className="w-full h-10 rounded-lg bg-slate-50 border-none px-4 text-xs font-bold appearance-none cursor-pointer" value={groupForm.category_type} onChange={e => setGroupForm({ ...groupForm, category_type: e.target.value })}>
//                                 <option value="การฝึก">การฝึกประสบการณ์</option>
//                                 <option value="บุคลิก">บุคลิกภาพ</option>
//                                 <option value="เล่ม">เล่มรายงาน</option>
//                             </select>
//                         </div>
//                     </div>
//                     <Button onClick={handleSaveGroup} className="w-full h-11 bg-blue-600 rounded-lg text-sm font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all">
//                         <Save size={18} className="mr-2" /> บันทึกข้อมูล
//                     </Button>
//                 </DialogContent>
//             </Dialog>

//             {/* Modal: จัดการข้อคำถาม */}
//             <Dialog open={isItemModalOpen} onOpenChange={(open) => { if (!open) resetItemForm(); setIsItemModalOpen(open); }}>
//                 <DialogContent className="max-w-[95vw] w-[95vw] xl:max-w-7xl rounded-[2.5rem] p-0 border-none h-[85vh] flex flex-col shadow-2xl overflow-hidden">
//                     <button onClick={() => { resetItemForm(); setIsItemModalOpen(false); }} className="absolute right-6 top-6 z-50 p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={24} /></button>
//                     <div id="item-modal-content" className="flex flex-col h-full bg-white">
//                         <div className="px-8 py-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white shrink-0 z-20">
//                             <div className="flex items-center gap-4">
//                                 <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100"><ListTodo size={28} /></div>
//                                 <div>
//                                     <DialogTitle className="text-2xl font-black text-slate-800 tracking-tight">จัดการข้อคำถาม</DialogTitle>
//                                     <p className="text-blue-600 font-bold text-sm">กลุ่ม: {selectedGroup?.group_name}</p>
//                                 </div>
//                             </div>
//                             <Button onClick={() => setIsTemplateModalOpen(true)} variant="outline" className="rounded-full border-blue-200 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-all px-6 h-11 mr-12 shadow-sm">
//                                 <Copy size={16} className="mr-2" /> ใช้เทมเพลตมาตรฐาน
//                             </Button>
//                         </div>
//                         <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
//                             <div className={`w-full lg:w-[40%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto p-6 md:p-10 ${editingItem ? 'bg-orange-50/40' : 'bg-slate-50/40'}`}>
//                                 <h4 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
//                                     {editingItem ? <><Edit2 className="text-orange-500" /> แก้ไขข้อคำถาม</> : <><Plus className="text-blue-600" /> เพิ่มข้อคำถามใหม่</>}
//                                 </h4>
//                                 <div className="space-y-6">
//                                     <div className="space-y-2">
//                                         <label className="text-xs font-black text-slate-400 uppercase ml-1">หัวข้อคำถาม</label>
//                                         <Input placeholder="เช่น ความสะอาดของสถานที่..." value={itemForm.question_text} onChange={e => setItemForm({ ...itemForm, question_text: e.target.value })} className="h-14 bg-white border-2 border-slate-100 rounded-2xl text-lg px-6 font-bold shadow-sm" />
//                                     </div>
//                                     <div className="space-y-2">
//                                         <label className="text-xs font-black text-slate-400 uppercase ml-1">คำอธิบาย</label>
//                                         <textarea placeholder="ระบุรายละเอียดเพิ่มเติม..." value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="w-full p-6 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 h-32 outline-none text-base font-medium resize-none shadow-sm" />
//                                     </div>
//                                     <label className="flex items-center gap-4 cursor-pointer p-5 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all">
//                                         <input type="checkbox" checked={itemForm.allow_na} onChange={e => setItemForm({ ...itemForm, allow_na: e.target.checked })} className="w-6 h-6 accent-blue-600 rounded-lg cursor-pointer" />
//                                         <div className="flex flex-col">
//                                             <span className="text-slate-700 font-black text-base">เปิดใช้งาน N/A</span>
//                                             <span className="text-slate-400 text-xs font-bold">อนุญาตให้ข้ามข้อนี้ได้ หากไม่สามารถประเมินได้</span>
//                                         </div>
//                                     </label>
//                                     <div className="flex flex-col gap-3">
//                                         <Button onClick={handleSaveItem} className={`w-full h-16 rounded-2xl font-black text-xl shadow-xl transition-all active:scale-[0.98] ${editingItem ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
//                                             {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มข้อคำถาม'}
//                                         </Button>
//                                         {editingItem && <Button variant="ghost" onClick={resetItemForm} className="text-slate-500 font-black hover:bg-slate-100 h-12 rounded-xl transition-all">ยกเลิกการแก้ไข</Button>}
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="w-full lg:w-[60%] flex flex-col bg-white overflow-hidden">
//                                 <div className="px-10 py-4 border-b border-slate-50 shrink-0"><h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">รายการปัจจุบัน ({items.length} ข้อ)</h4></div>
//                                 <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar space-y-4 bg-slate-50/20">
//                                     {items.map((item, idx) => (
//                                         <div key={item.id} className={`bg-white border p-6 rounded-[2rem] flex items-start justify-between gap-4 transition-all group ${editingItem?.id === item.id ? 'border-orange-500 ring-4 ring-orange-50 shadow-xl' : 'border-slate-100 shadow-sm hover:border-blue-300'}`}>
//                                             <div className="flex-1 min-w-0">
//                                                 <div className="flex items-start gap-4">
//                                                     <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${editingItem?.id === item.id ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white'}`}>{idx + 1}</div>
//                                                     <div className="min-w-0 flex-1">
//                                                         <p className="text-slate-800 font-black text-lg leading-tight break-words">{item.question_text}</p>
//                                                         {item.description && <p className="text-slate-500 text-sm mt-2 line-clamp-2 italic leading-relaxed font-medium">{item.description}</p>}
//                                                         <div className="flex gap-2 mt-4">
//                                                             {item.allow_na ? (
//                                                                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">เปิดใช้ N/A</span>
//                                                             ) : (
//                                                                 <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg border border-rose-100">บังคับประเมิน</span>
//                                                             )}
//                                                             <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-lg border border-slate-100 uppercase tracking-tighter">Max: 5 Score</span>
//                                                         </div>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                             <div className="flex gap-1 shrink-0">
//                                                 <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-200 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" onClick={() => handleEditClick(item)}><Edit2 size={18} /></Button>
//                                                 <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-200 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" onClick={() => handleDeleteItem(item)}><Trash2 size={18} /></Button>
//                                             </div>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </DialogContent>
//             </Dialog>

//             <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
//                 <DialogContent className="rounded-2xl max-w-lg w-[95vw] p-6 border-none shadow-2xl">
//                     <DialogHeader><DialogTitle className="text-lg font-bold text-slate-800 flex items-center gap-2"><LayoutTemplate className="text-blue-600" size={20} /> เทมเพลตมาตรฐาน</DialogTitle></DialogHeader>
//                     <div className="grid grid-cols-1 gap-3 mt-4">
//                         {templates.map(t => (
//                             <Button key={t.id} onClick={() => handleApplyTemplate(t.id)} className="w-full h-14 bg-slate-50 text-slate-800 hover:bg-blue-600 hover:text-white rounded-xl justify-between px-6 font-bold text-base border border-slate-100 shadow-none transition-all group">
//                                 {t.template_name}
//                                 <Plus size={16} className="text-slate-300 group-hover:text-white" />
//                             </Button>
//                         ))}
//                     </div>
//                 </DialogContent>
//             </Dialog>
//         </AdminLayout>
//     )
// }



// version2
"use client"
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, ChevronLeft, ListTodo, Edit2, Trash2, LayoutTemplate, Copy, X, Save, GripVertical } from "lucide-react"
import Swal from 'sweetalert2'

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function ManageCriteriaPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    const id = params.id as string
    const subId = searchParams.get('subId')

    const [subject, setSubject] = useState<any>(null)
    const [subSubject, setSubSubject] = useState<any>(null)
    const [groups, setGroups] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

    const [selectedGroup, setSelectedGroup] = useState<any>(null)
    const [groupForm, setGroupForm] = useState({ group_name: '', category_type: 'การฝึก', weight: 0.1 })

    const [items, setItems] = useState<any[]>([])
    const [itemForm, setItemForm] = useState({ question_text: '', description: '', allow_na: true, factor: 1.0 })
    const [editingItem, setEditingItem] = useState<any>(null)

    // 🚩 1. ใช้ useMemo เพื่อไม่ให้ supabase client ถูกสร้างใหม่บ่อยจนเกิด loop
    const supabase = useMemo(() => createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // 🚩 2. ปรับ fetchData ให้เสถียรขึ้น
    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true)
        try {
            const { data: sub } = await supabase.from('subjects').select('*').eq('id', id).single()
            if (sub) setSubject(sub)

            if (subId) {
                const { data: ss } = await supabase.from('sub_subjects').select('*').eq('id', subId).single()
                setSubSubject(ss || null)
            } else {
                setSubSubject(null)
            }

            let query = supabase.from('evaluation_groups').select('*').eq('subject_id', id)
            if (subId) query = query.eq('sub_subject_id', subId)
            else query = query.is('sub_subject_id', null)

            const { data: grps } = await query.order('group_name', { ascending: true })
            setGroups(grps || [])

            const { data: temps } = await supabase.from('eval_templates').select('*')
            setTemplates(temps || [])
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }, [id, subId, supabase]);

    // 🚩 3. เรียกใช้ useEffect โดยใช้ fetchData เป็น dependency ตัวเดียวที่คุมด้วย useCallback แล้ว
    useEffect(() => {
        fetchData()
    }, [fetchData])

    // --- Logic อื่นๆ (handleSaveGroup, handleDragEnd, etc.) คงเดิมตาม UI พี่ ---
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            const newOrder = arrayMove(items, oldIndex, newIndex);
            setItems(newOrder);

            const updates = newOrder.map((item, index) => ({
                id: item.id,
                order_index: index,
                group_id: selectedGroup.id,
                question_text: item.question_text,
                factor: item.factor || 1.0
            }));
            await supabase.from('evaluation_items').upsert(updates);
        }
    };

    const handleSaveGroup = async () => {
        const payload = { ...groupForm, subject_id: id, sub_subject_id: subId || null }
        if (selectedGroup?.id) await supabase.from('evaluation_groups').update(payload).eq('id', selectedGroup.id)
        else await supabase.from('evaluation_groups').insert([payload])
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
        setItemForm({
            question_text: item.question_text || '',
            description: item.description || '',
            allow_na: item.allow_na,
            factor: item.factor || 1.0
        });
    };

    const resetItemForm = () => {
        setEditingItem(null);
        setItemForm({ question_text: '', description: '', allow_na: true, factor: 1.0 });
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

    const totalWeight = groups.reduce((acc, curr) => acc + (curr.weight || 0), 0)

    const getWardTheme = (name: string) => {
        const lowerName = name.toUpperCase()
        if (lowerName.includes('ANC')) return { border: 'border-b-emerald-500', bg: 'bg-emerald-50/20' }
        if (lowerName.includes('LR')) return { border: 'border-b-blue-500', bg: 'bg-blue-50/20' }
        if (lowerName.includes('PP')) return { border: 'border-b-purple-500', bg: 'bg-purple-50/20' }
        return { border: 'border-b-slate-400', bg: 'bg-slate-50/50' }
    }

    const getCategoryStyle = (type: string) => {
        switch (type) {
            case 'การฝึก': return 'bg-blue-600 text-white'
            case 'บุคลิก': return 'bg-indigo-600 text-white'
            case 'เล่ม': return 'bg-orange-500 text-white'
            default: return 'bg-slate-600 text-white'
        }
    }

    const handleDeleteItem = (item: any) => {
        Swal.fire({
            target: document.getElementById('item-modal-content') || document.body,
            title: 'ยืนยันการลบข้อคำถาม?',
            text: "เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลข้อนี้ได้",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626', // สีแดง
            cancelButtonColor: '#e2e8f0', // สีเทา
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
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

    const handleApplyTemplate = async (templateId: number) => {
        const { data: tempItems } = await supabase.from('eval_template_items').select('*').eq('template_id', templateId)
        if (tempItems && tempItems.length > 0) {
            const newItems = tempItems.map(item => ({ group_id: selectedGroup.id, question_text: item.question_text, description: item.description, allow_na: item.allow_na, order_index: item.order_index }))
            await supabase.from('evaluation_items').insert(newItems)
            setIsTemplateModalOpen(false)
            openItemsModal(selectedGroup)
        }
    }

    // const handleApplyTemplate = async (templateId: number) => {
    //     // 1. ดึงข้อมูลข้อคำถามของเทมเพลตนั้นมาเพื่อทำ Preview
    //     const { data: tempItems } = await supabase
    //         .from('eval_template_items')
    //         .select('*')
    //         .eq('template_id', templateId)
    //         .order('order_index', { ascending: true });

    //     if (!tempItems || tempItems.length === 0) {
    //         Swal.fire({ icon: 'info', title: 'เทมเพลตนี้ไม่มีข้อคำถาม' });
    //         return;
    //     }

    //     // 2. สร้างรายการ HTML สำหรับ Preview
    //     const itemsHtml = `
    //     <div class="mt-4 max-h-[300px] overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left font-sans">
    //         <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">รายการที่จะถูกเพิ่ม (${tempItems.length} ข้อ):</p>
    //         ${tempItems.map((item, idx) => `
    //             <div class="mb-3 last:mb-0 pb-2 border-b border-slate-200 last:border-0">
    //                 <div class="flex gap-2">
    //                     <span class="text-blue-600 font-black text-xs">${idx + 1}.</span>
    //                     <div>
    //                         <p class="text-sm font-bold text-slate-800 leading-tight">${item.question_text}</p>
    //                         ${item.description ? `<p class="text-[11px] text-slate-400 mt-0.5 italic">${item.description}</p>` : ''}
    //                     </div>
    //                 </div>
    //             </div>
    //         `).join('')}
    //     </div>
    //     <p class="mt-4 text-[11px] text-amber-600 font-bold italic">* ข้อมูลจะถูกเพิ่มต่อจากรายการเดิมที่มีอยู่</p>
    // `;

    //     // 3. แสดง Preview และยืนยันการใช้งาน
    //     const { isConfirmed } = await Swal.fire({
    //         title: 'ยืนยันการใช้เทมเพลต?',
    //         html: itemsHtml,
    //         icon: 'question',
    //         showCancelButton: true,
    //         confirmButtonText: 'ตกลง, เพิ่มเลย!',
    //         cancelButtonText: 'ยกเลิก',
    //         reverseButtons: true,
    //         // 🚩 แก้บั๊กกดไม่ได้ด้วย zIndex
    //         didOpen: () => {
    //             const container = Swal.getContainer();
    //             if (container) container.style.zIndex = '9999';
    //         },
    //         customClass: {
    //             popup: 'rounded-[2.5rem] p-10 font-sans',
    //             confirmButton: 'rounded-2xl px-8 py-3 font-bold',
    //             cancelButton: 'rounded-2xl px-8 py-3 font-bold text-slate-500'
    //         }
    //     });

    //     if (isConfirmed) {
    //         // นำข้อมูลเข้าสู่ evaluation_items
    //         const newItems = tempItems.map((item, index) => ({
    //             group_id: selectedGroup.id,
    //             question_text: item.question_text,
    //             description: item.description,
    //             allow_na: item.allow_na,
    //             factor: item.factor || 1.0,
    //             order_index: items.length + index // ต่อท้ายรายการเดิม
    //         }));

    //         const { error } = await supabase.from('evaluation_items').insert(newItems);

    //         if (!error) {
    //             // อัปเดต UI ทันที
    //             const { data } = await supabase
    //                 .from('evaluation_items')
    //                 .select('*')
    //                 .eq('group_id', selectedGroup.id)
    //                 .order('order_index', { ascending: true });

    //             setItems(data || []);
    //             setIsTemplateModalOpen(false); // ปิด Modal เทมเพลต

    //             Swal.fire({
    //                 icon: 'success',
    //                 title: 'เพิ่มเทมเพลตสำเร็จ',
    //                 timer: 1500,
    //                 showConfirmButton: false,
    //                 didOpen: () => {
    //                     if (Swal.getContainer()) Swal.getContainer()!.style.zIndex = '9999';
    //                 }
    //             });
    //         }
    //     }
    // };

    const handleClearAllItems = async () => {
        const { isConfirmed } = await Swal.fire({
            target: document.getElementById('item-modal-content') || document.body,

            title: 'ยืนยันล้างข้อคำถามทั้งหมด?',
            text: "ข้อคำถามทั้งหมดในหมวดนี้จะถูกลบถาวร!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'ใช่, ลบทั้งหมด',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        });

        if (isConfirmed) {
            const { error } = await supabase
                .from('evaluation_items')
                .delete()
                .eq('group_id', selectedGroup.id);

            if (!error) {
                setItems([]);
                Swal.fire({ icon: 'success', title: 'ล้างข้อมูลสำเร็จ', timer: 1000, showConfirmButton: false });
            }
        }
    };

    const handleDeleteGroup = (group: any) => {
        Swal.fire({
            title: 'ลบหมวดนี้?',
            html: `หมวด <b>"${group.group_name}"</b> จะถูกลบถาวร`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการลบ',
            confirmButtonColor: '#dc2626',
            cancelButtonText: 'ยกเลิก',
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        }).then(async (res) => {
            if (res.isConfirmed) {
                const { error } = await supabase.from('evaluation_groups').delete().eq('id', group.id)
                if (!error) { fetchData(); Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false }) }
            }
        })
    }

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto pb-20 px-4 font-sans">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 mb-6 text-sm font-medium transition-colors">
                    <ChevronLeft size={16} /> กลับไปหน้ารายวิชา
                </button>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 leading-tight">ตั้งค่าแบบประเมิน</h1>
                            {subSubject && <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-blue-100">{subSubject.name}</span>}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-slate-500 font-bold text-base">รายวิชา : {subject?.name}</p>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${totalWeight === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                                รวม: {Math.round(totalWeight * 100)}%
                            </span>
                        </div>
                    </div>
                    <Button onClick={() => { setSelectedGroup(null); setGroupForm({ group_name: '', category_type: 'การฝึก', weight: 0.1 }); setIsGroupModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 px-5 shadow-md active:scale-95 transition-all w-full sm:w-auto text-sm font-bold">
                        <Plus className="mr-2" size={18} /> เพิ่มหมวดประเมิน
                    </Button>
                </div>

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
                                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm ${getCategoryStyle(group.category_type)}`}>{group.category_type}</span>
                                            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-500 border border-slate-200">น้ำหนัก: {Math.round(group.weight * 100)}%</span>
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
            {/* โมดอลเพิ่้มหมวด */}
            <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
                <DialogContent className="max-w-md w-[95vw] rounded-2xl p-6 border-none shadow-2xl overflow-hidden">
                    <DialogHeader><DialogTitle className="text-lg font-bold text-slate-800">ข้อมูลหมวดประเมิน</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">ชื่อหมวด</label>
                            <Input value={groupForm.group_name}
                                onChange={e => setGroupForm({ ...groupForm, group_name: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveGroup()}
                                className="h-10 rounded-lg bg-slate-50 border-none text-sm px-4 font-semibold" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">น้ำหนักคะแนน (%)</label>
                            <div className="relative flex items-center">
                                <Input type="number" value={Math.round(groupForm.weight * 100)}
                                    onChange={e => setGroupForm({ ...groupForm, weight: Number(e.target.value) / 100 })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveGroup()}
                                    className="h-10 rounded-lg bg-slate-50 border-none text-base font-bold px-4 pr-10" />
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
                    <Button onClick={handleSaveGroup} className="w-full h-11 bg-blue-600 rounded-lg text-sm font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all">
                        <Save size={18} className="mr-2" /> บันทึกข้อมูล
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Modal: จัดการข้อคำถาม (รวม DND & Factor) */}
            <Dialog open={isItemModalOpen} onOpenChange={(open) => { if (!open) resetItemForm(); setIsItemModalOpen(open); }}>
                <DialogContent className="max-w-[95vw] w-[95vw] xl:max-w-7xl rounded-[2.5rem] p-0 border-none h-[85vh] flex flex-col shadow-2xl overflow-hidden bg-white">
                    <button onClick={() => { resetItemForm(); setIsItemModalOpen(false); }} className="absolute right-6 top-6 z-50 p-2 bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-all"><X size={24} /></button>
                    <div id="item-modal-content" className="flex flex-col h-full bg-white">
                        <div className="px-8 py-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white shrink-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100"><ListTodo size={28} /></div>
                                <DialogTitle className="text-2xl font-black text-slate-800 leading-tight">
                                    จัดการข้อคำถาม
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {/* แสดงชื่อวิชาหลัก */}
                                        <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            {subject?.name || 'รหัสนักศึกษา'}
                                        </span>

                                        {/* แสดงชื่อวิชาย่อย */}
                                        {subSubject && (
                                            <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                {subSubject.name}
                                            </span>
                                        )}

                                        {/* แสดงชื่อกลุ่ม/หมวดประเมินที่กำลังแก้ */}
                                        <span className="text-[11px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            หมวด: {selectedGroup?.group_name}
                                        </span>
                                    </div>
                                </DialogTitle>
                            </div>

                            {/* <Button onClick={() => setIsTemplateModalOpen(true)} variant="outline" className="rounded-full border-blue-200 text-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-all px-6 h-11 mr-12 shadow-sm">
                                <Copy size={16} className="mr-2" /> ใช้เทมเพลตมาตรฐาน
                            </Button> */}
                            <div id="item-modal-content" className="flex gap-2 mr-12 shrink-0 transition-all">
                                {items.length > 0 && (
                                    <Button
                                        onClick={handleClearAllItems}
                                        variant="ghost"
                                        className="rounded-full text-red-500 hover:bg-red-50 font-bold px-6 h-11 border border-red-100"
                                    >
                                        <Trash2 size={16} className="mr-2" /> ล้างทั้งหมด
                                    </Button>
                                )}
                                <Button
                                    onClick={() => setIsTemplateModalOpen(true)}
                                    variant="outline"
                                    className="rounded-full border-blue-200 text-blue-600 font-bold hover:bg-blue-600 hover:text-white px-6 h-11 shadow-sm"
                                >
                                    <Copy size={16} className="mr-2" /> ใช้เทมเพลตมาตรฐาน
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* ฝั่งซ้าย: ฟอร์มเพิ่ม/แก้ไข */}
                            <div className={`w-full lg:w-[40%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto p-6 md:p-10 ${editingItem ? 'bg-orange-50/30' : 'bg-slate-50/30'}`}>
                                <h4 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
                                    {editingItem ? <><Edit2 className="text-orange-500" /> แก้ไขข้อคำถาม</> : <><Plus className="text-blue-600" /> เพิ่มข้อคำถามใหม่</>}
                                </h4>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase ml-1">หัวข้อคำถาม</label>
                                        <Input placeholder="เช่น มีทัศนะคติที่ดี..."
                                            value={itemForm.question_text}
                                            onChange={e => setItemForm({ ...itemForm, question_text: e.target.value })}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveItem()}

                                            className="h-14 bg-white border-2 border-slate-100 rounded-2xl text-lg px-6 font-bold shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-slate-400 uppercase ml-1">คำอธิบาย</label>
                                        <textarea placeholder="ระบุรายละเอียดเพิ่มเติม..."
                                            value={itemForm.description}
                                            onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                                            onKeyDown={(e) => {
                                                // ถ้ากด Enter อย่างเดียว (โดยไม่กด Shift) ให้ทำการบันทึก
                                                if (e.key === 'Enter' && e.shiftKey) {
                                                    e.preventDefault(); // ป้องกันการขึ้นบรรทัดใหม่ใน textarea
                                                    handleSaveItem();
                                                }
                                                // ถ้ากด Shift + Enter จะยังคงขึ้นบรรทัดใหม่ได้ตามปกติ
                                            }}
                                            className="w-full p-6 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 h-32 outline-none text-base font-medium resize-none shadow-sm" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">น้ำหนักคะแนน (Factor)</label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={itemForm.factor || ''}
                                            // onChange={e => setItemForm({ ...itemForm, factor: parseFloat(e.target.value) || 1.0 })}
                                            onChange={e => {
                                                const val = e.target.value;
                                                // ถ้าเป็นค่าว่าง ให้เก็บค่าว่างไว้ก่อนเพื่อให้พิมพ์ต่อได้
                                                // ถ้ามีตัวเลข ค่อยแปลงเป็น Float
                                                setItemForm({
                                                    ...itemForm,
                                                    factor: val === '' ? '' : parseFloat(val)
                                                })
                                            }}
                                            className="h-14 bg-white rounded-2xl font-bold shadow-sm border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-500"
                                            placeholder="เช่น 1.0, 1.5, 2.0"
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveItem()}

                                        />

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

                            {/* ฝั่งขวา: รายการปัจจุบันพร้อม Drag & Drop */}
                            <div className="w-full lg:w-[60%] flex flex-col bg-white overflow-hidden">
                                <div className="px-10 py-4 border-b border-slate-50 shrink-0 flex justify-between items-center bg-slate-50/50">
                                    <h4 className="font-black text-slate-400 uppercase tracking-widest text-[10px]">รายการปัจจุบัน ({items.length} ข้อ)</h4>
                                    <span className="text-[10px] text-slate-400 font-medium italic">*ลากสลับตำแหน่งข้อคำถามได้ที่ไอคอนด้านซ้าย</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-4 bg-slate-50/20 custom-scrollbar">
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                            {items.map((item, idx) => (
                                                <SortableItem key={item.id}
                                                    item={item} idx={idx}
                                                    editingItemId={editingItem?.id}
                                                    handleEditClick={handleEditClick}
                                                    handleDeleteItem={handleDeleteItem}
                                                    setEditingItem={setEditingItem}
                                                    setItemForm={setItemForm}

                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* เลือกเทมเพลค */}
            {/* 🚩 ปรับความกว้าง Modal ตรงนี้เป็น max-w-5xl หรือ 6xl */}
            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="max-w-2xl  lg:max-w-[1200] 2xl:max-w-[900] rounded-[2.5rem] p-8 border-none shadow-2xl bg-white font-sans overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                <Copy size={24} />
                            </div>
                            เลือกเทมเพลตมาตรฐาน
                        </DialogTitle>
                        <p className="text-slate-500 font-medium ml-12">คลิกเพื่อเลือกเทมเพลตที่ต้องการนำไปใช้ในหมวดนี้</p>
                    </DialogHeader>

                    {/* 🚩 Grid 2 Columns ที่ขยายกว้างขึ้น */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar py-2">
                        {templates.map((temp: any) => (
                            <button
                                key={temp.id}
                                onClick={() => handleApplyTemplate(temp.id)}
                                className="group relative flex flex-col items-start p-6 rounded-[2rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-500 hover:shadow-xl transition-all text-left"
                            >
                                <div className="flex items-start gap-4 w-full">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                        <LayoutTemplate size={22} />
                                    </div>

                                    {/* 🚩 ส่วนจัดการชื่อที่ยาว: ใช้ leading-tight และไม่จำกัดบรรทัดถ้าชื่อยาวมาก */}
                                    <div className="min-w-0 flex-1">
                                        <span className="block font-black text-slate-800 text-lg leading-[1.2] group-hover:text-blue-600 transition-colors break-words">
                                            {temp.template_name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md uppercase">
                                                Template
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                ID: #{temp.id}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* รายละเอียดด้านล่าง */}
                                {temp.description && (
                                    <p className="text-sm text-slate-400 mt-4 line-clamp-2 font-medium pl-1">
                                        {temp.description}
                                    </p>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Footer สำหรับบอกจำนวน */}
                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-slate-400">
                        <p className="text-xs font-bold uppercase tracking-widest">ทั้งหมด {templates.length} รูปแบบ</p>
                        <Button variant="ghost" onClick={() => setIsTemplateModalOpen(false)} className="text-xs font-bold hover:bg-slate-100 rounded-xl px-6">
                            ปิดหน้าต่าง
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}

// 🚩 Sortable Item Component (รักษา UI เดิมของพี่ไว้ 100%)
// function SortableItem({ item, idx, editingItemId, handleEditClick, handleDeleteItem }: any) {
//     const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
//     const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 100 : 0, opacity: isDragging ? 0.6 : 1 };

//     return (
//         <div ref={setNodeRef} style={style} className={`bg-white border p-6 rounded-[2rem] flex items-start justify-between gap-4 transition-all group ${editingItemId === item.id ? 'border-orange-500 ring-4 ring-orange-50 shadow-xl' : 'border-slate-100 shadow-sm hover:border-blue-300'}
//         `}>
//             <div className="flex-1 min-w-0">
//                 <div className="flex items-start gap-4">
//                     {/* ปุ่มจับลาก */}
//                     <div {...attributes} {...listeners} className="mt-1 text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing shrink-0">
//                         <GripVertical size={20} />
//                     </div>
//                     <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${editingItemId === item.id ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white'}`}>{idx + 1}</div>
//                     <div className="min-w-0 flex-1">
//                         <div className="flex items-center gap-2 mb-1">
//                             <p className="text-slate-800 font-black text-lg leading-tight break-words">{item.question_text}</p>
//                             {/* 🚩 แสดง Factor รายข้อ */}
//                         </div>
//                         {item.description && <p className="text-slate-500 text-sm mt-2 line-clamp-2 italic leading-relaxed font-medium">{item.description}</p>}
//                         <div className="flex gap-2 mt-4">
//                             {item.allow_na ? (
//                                 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">เปิดใช้ N/A</span>
//                             ) : (
//                                 <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black rounded-lg border border-rose-100">บังคับประเมิน</span>
//                             )}
//                             {/* <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-lg border border-slate-100 uppercase tracking-tighter">Max: 5 Score</span> */}
//                             <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg  border border-emerald-100">factor : {item.factor || 1.0}</span>

//                         </div>
//                     </div>
//                 </div>
//             </div>
//             <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
//                 <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-200 hover:text-blue-600 rounded-full transition-all" onClick={() => handleEditClick(item)}><Edit2 size={18} /></Button>
//                 <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-200 hover:text-red-600 rounded-full transition-all" onClick={() => handleDeleteItem(item)}><Trash2 size={18} /></Button>
//             </div>
//         </div>
//     );
// }

function SortableItem({ item, idx, editingItemId, handleEditClick, handleDeleteItem, setEditingItem, setItemForm }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.6 : 1
    };

    // เช็คสถานะการแก้ไข
    const isEditing = editingItemId === item.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-6 rounded-[2rem] flex items-start justify-between gap-4 transition-all duration-200 group
                ${isDragging
                    ? 'shadow-2xl ring-4 ring-blue-600 bg-white border-blue-600 scale-[1.02]' // ฟ้าเข้มตอนลาก
                    : isEditing
                        ? 'bg-orange-50 border-orange-500 ring-4 ring-orange-100 shadow-xl' // ส้มตอนแก้ไข
                        : 'bg-white border border-slate-100 shadow-sm hover:border-blue-300'
                }
            `}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-4">
                    {/* ปุ่มจับลาก */}
                    <div {...attributes} {...listeners} className={`mt-1 cursor-grab active:cursor-grabbing shrink-0 transition-colors ${isDragging ? 'text-blue-600' : 'text-slate-300 hover:text-blue-600'}`}>
                        <GripVertical size={20} />
                    </div>

                    {/* เลขลำดับข้อ */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md transition-colors ${isEditing ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white'}`}>
                        {idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className={`font-black text-lg leading-tight break-words transition-colors ${isEditing ? 'text-orange-700' : 'text-slate-800'}`}>
                                {item.question_text}
                            </p>
                        </div>
                        {item.description && <p className="text-slate-500 text-sm mt-2 line-clamp-2 italic leading-relaxed font-medium">{item.description}</p>}

                        <div className="flex gap-2 mt-4">
                            <span className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-colors ${isEditing ? 'bg-white border-orange-200 text-orange-600' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {item.allow_na ? 'เปิดใช้ N/A' : 'บังคับประเมิน'}
                            </span>
                            <span className={`px-3 py-1 text-[10px] font-black rounded-lg border transition-colors ${isEditing ? 'bg-white border-orange-200 text-orange-600' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                factor : {item.factor || 1.0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`flex gap-1 shrink-0 transition-all ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <Button
                    variant="ghost"
                    size="icon"
                    className={`h-10 w-10 rounded-full transition-all ${isEditing ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
                    onClick={() => {
                        if (isEditing) {
                            // 🚩 Toggle OFF: ยกเลิกการแก้ไข
                            setEditingItem(null);
                            setItemForm({ question_text: '', description: '', allow_na: true, factor: 1.0 });
                        } else {
                            // 🚩 Toggle ON: เริ่มการแก้ไข
                            handleEditClick(item);
                        }
                    }}
                >
                    {isEditing ? <X size={18} /> : <Edit2 size={18} />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                    onClick={() => handleDeleteItem(item)}
                >
                    <Trash2 size={18} />
                </Button>
            </div>
        </div>
    );
}