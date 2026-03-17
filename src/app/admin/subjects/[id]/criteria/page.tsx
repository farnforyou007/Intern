


// version2
"use client"
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ChevronLeft, ListTodo, Edit2, Trash2, LayoutTemplate, Copy, X, Save, GripVertical, Eye, EyeOff, Lock, AlertCircle, BookOpen } from "lucide-react"
import Swal from 'sweetalert2'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
interface ItemForm {
    factor: number | string; // หรือ number | null
}
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

    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false)
    const [deactivateNote, setDeactivateNote] = useState('')
    const [targetGroupForStatus, setTargetGroupForStatus] = useState<any>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/criteria?subjectId=${id}${subId ? `&subId=${subId}` : ''}`)
            const result = await res.json()
            if (result.success) {
                setSubject(result.data.subject)
                setSubSubject(result.data.subSubject)
                setGroups(result.data.groups || [])
                setTemplates(result.data.templates || [])
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }, [id, subId]);

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            const newOrder = arrayMove(items, oldIndex, newIndex);
            setItems(newOrder);

            const updates = newOrder.map((item, index) => ({
                id: item.id,
                order_index: index
            }));

            await fetch('/api/admin/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reorder-items', subjectId: id, updates })
            });
        }
    };

    const handleSaveGroup = async () => {
        const res = await fetch('/api/admin/criteria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save-group',
                subjectId: id,
                subId: subId,
                groupId: selectedGroup?.id,
                groupData: groupForm
            })
        });
        const result = await res.json()
        if (result.success) {
            setIsGroupModalOpen(false)
            fetchData()
        } else {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: result.message })
        }
    }

    const openItemsModal = (group: any) => {
        setSelectedGroup(group)
        setItems(group.evaluation_items || [])
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
        const res = await fetch('/api/admin/criteria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'save-item',
                subjectId: id,
                groupId: selectedGroup.id,
                itemId: editingItem?.id,
                itemData: itemForm
            })
        });
        const result = await res.json()
        if (result.success) {
            resetItemForm();
            // Refresh groups to get updated items (or manually update local state if preferred, but simpler to refresh)
            fetchData();
            // Also need to update 'items' for the modal list
            const updatedGroup = groups.find(g => g.id === selectedGroup.id)
            // Wait, fetchData will update groups, but it's async. 
            // Better: update local items as well.
        } else {
            Swal.fire({ icon: 'error', title: 'ไม่สามารถบันทึกได้', text: result.message })
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            action();
        }
    };

    // Helper function to update items after save/delete
    useEffect(() => {
        if (selectedGroup) {
            const currentGroup = groups.find(g => g.id === selectedGroup.id)
            if (currentGroup) {
                setItems(currentGroup.evaluation_items || [])
            }
        }
    }, [groups, selectedGroup])

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
                const apiRes = await fetch('/api/admin/criteria', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'delete-item',
                        subjectId: id,
                        itemId: item.id
                    })
                });
                const result = await apiRes.json()
                if (result.success) {
                    fetchData()
                } else {
                    Swal.fire({ 
                        target: document.getElementById('item-modal-content') || document.body,
                        icon: 'error', 
                        title: 'ลบไม่สำเร็จ', 
                        text: result.message,
                        confirmButtonText: 'ตกลง',
                        confirmButtonColor: '#3b82f6',
                        customClass: {
                            popup: 'rounded-[2rem] font-sans'
                        }
                    })
                }
            }
        })
    }

    const handleToggleItemStatus = async (item: any) => {
        const res = await fetch('/api/admin/criteria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'toggle-item-status',
                subjectId: id,
                itemId: item.id,
                is_active: !item.is_active
            })
        });
        if ((await res.json()).success) {
            fetchData()
            Swal.fire({ 
                target: document.getElementById('item-modal-content') || document.body,
                icon: 'success', 
                title: item.is_active ? 'ซ่อนคำถามเรียบร้อย' : 'เปิดใช้งานคำถามเรียบร้อย', 
                timer: 1500, 
                showConfirmButton: false,
                customClass: {
                    popup: 'rounded-[2rem] font-sans'
                }
            })
        }
    }

    const handleApplyTemplate = async (templateId: number) => {
        const apiRes = await fetch('/api/admin/criteria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'apply-template',
                subjectId: id,
                templateId,
                groupId: selectedGroup.id
            })
        });
        const result = await apiRes.json()
        if (result.success) {
            setIsTemplateModalOpen(false)
            fetchData()
        } else {
            Swal.fire({ icon: 'error', title: 'ใช้เทมเพลตไม่สำเร็จ', text: result.message })
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

    const handleToggleStatus = async (group: any) => {
        if (group.is_active) {
            setTargetGroupForStatus(group)
            setDeactivateNote(group.deactivation_note || '')
            setIsDeactivateModalOpen(true)
        } else {
            const res = await fetch('/api/admin/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle-group-status',
                    subjectId: id,
                    groupId: group.id,
                    is_active: true
                })
            });
            if ((await res.json()).success) {
                fetchData()
                Swal.fire({ icon: 'success', title: 'เปิดใช้งานเรียบร้อย', timer: 1500, showConfirmButton: false })
            }
        }
    }

    const confirmDeactivate = async () => {
        const res = await fetch('/api/admin/criteria', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'toggle-group-status',
                subjectId: id,
                groupId: targetGroupForStatus.id,
                is_active: false,
                deactivation_note: deactivateNote
            })
        });
        if ((await res.json()).success) {
            setIsDeactivateModalOpen(false)
            fetchData()
            Swal.fire({ icon: 'success', title: 'ซ่อนเกณฑ์เรียบร้อย', timer: 1500, showConfirmButton: false })
        }
    }

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
            const res = await fetch('/api/admin/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'clear-items',
                    subjectId: id,
                    groupId: selectedGroup.id
                })
            });
            if ((await res.json()).success) {
                fetchData()
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
                const apiRes = await fetch('/api/admin/criteria', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'delete-group',
                        subjectId: id,
                        groupId: group.id
                    })
                });
                const result = await apiRes.json()
                if (result.success) {
                    fetchData()
                    Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false })
                } else {
                    Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: result.message })
                }
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
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <BookOpen size={28} className="text-blue-600" />
                            ตั้งค่าเกณฑ์แบบประเมิน
                        </h1>
                        <div className="flex items-center gap-2 mt-1.5 font-bold">
                            <p className="text-slate-500 text-sm">รายวิชา : {subject?.name}</p>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${totalWeight === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                Weight รวม: {Math.round(totalWeight * 100)}% {totalWeight !== 1}
                            </span>
                        </div>
                    </div>
                    <Button onClick={() => { setSelectedGroup(null); setGroupForm({ group_name: '', category_type: 'การฝึก', weight: 0.1 }); setIsGroupModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-6 shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm font-bold">
                        <Plus className="mr-1.5" size={18} /> เพิ่มหมวดประเมิน
                    </Button>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="w-[45%] font-bold text-slate-600 text-[13px] px-6 h-12">ชื่อหมวดประเมิน / ประเภท</TableHead>
                                <TableHead className="w-[15%] font-bold text-slate-600 text-[13px] text-center h-12">น้ำหนัก (%)</TableHead>
                                <TableHead className="w-[20%] font-bold text-slate-600 text-[13px] text-center h-12">ข้อคำถาม</TableHead>
                                <TableHead className="w-[20%] font-bold text-slate-600 text-[13px] text-right px-6 h-12">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={4} className="p-6"><Skeleton className="h-12 w-full rounded-xl" /></TableCell></TableRow>
                                ))
                            ) : groups.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="p-12 text-center text-slate-400 font-bold text-sm">ยังไม่มีหมวดประเมิน คลิกปุ่ม "เพิ่มหมวดประเมิน" เพื่อเริ่มต้น</TableCell>
                                </TableRow>
                            ) : (
                                groups.map((group) => (
                                    <TableRow key={group.id} className={`transition-colors ${group.is_active ? 'hover:bg-slate-50/30' : 'bg-slate-50/50 opacity-70 italic font-medium'}`}>
                                        <TableCell className="px-6 py-4">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className={`font-black text-[15px] ${group.is_active ? 'text-slate-800' : 'text-slate-400'}`}>{group.group_name}</div>
                                                {group.is_used && <Lock size={12} className="text-slate-300" />}
                                                {!group.is_active && (
                                                    <span className="px-2 py-0.5 bg-slate-900 text-white text-[9px] font-black rounded-lg flex items-center gap-1 uppercase">
                                                        <EyeOff size={8} /> Hidden
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${getCategoryStyle(group.category_type)}`}>
                                                    {group.category_type}
                                                </span>
                                                {group.deactivation_note && !group.is_active && (
                                                    <span className="text-[10px] text-slate-400">หมายเหตุ: {group.deactivation_note}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-black text-slate-700 text-base">
                                            {Math.round(group.weight * 100)}%
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button onClick={() => openItemsModal(group)} variant="outline" className="h-9 px-4 rounded-xl text-[11px] font-black border-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                <ListTodo size={14} className="mr-1.5" /> ตั้งค่าคำถาม ({group.evaluation_items?.length || 0})
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-full transition-all ${group.is_active ? 'text-slate-300 hover:text-blue-600 hover:bg-blue-50' : 'text-blue-600 hover:bg-blue-100'}`} onClick={() => handleToggleStatus(group)}>
                                                    {group.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all" onClick={() => { setSelectedGroup(group); setGroupForm({ group_name: group.group_name, category_type: group.category_type, weight: group.weight }); setIsGroupModalOpen(true); }}><Edit2 size={16} /></Button>
                                                {!group.is_used && (
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" onClick={() => handleDeleteGroup(group)}><Trash2 size={16} /></Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {/* โมดอลเพิ่้มหมวด */}
            <Dialog open={isGroupModalOpen} onOpenChange={setIsGroupModalOpen}>
                <DialogContent className="max-w-md w-[95vw] rounded-3xl p-8 border-none shadow-2xl overflow-hidden font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                            ข้อมูลหมวดประเมิน
                            {selectedGroup?.is_used && <Lock size={16} className="text-slate-300" />}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedGroup?.is_used && (
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] font-bold text-amber-700 flex items-center gap-2">
                            <AlertCircle size={14} />
                            หมวดนี้มีการประเมินแล้ว ไม่สามารถเปลี่ยนชื่อได้ แต่ปรับน้ำหนักคะแนนได้
                        </div>
                    )}
                    <div className="space-y-5 py-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">ชื่อหมวดคำถาม</label>
                            <Input
                                disabled={selectedGroup?.is_used}
                                value={groupForm.group_name}
                                onChange={e => setGroupForm({ ...groupForm, group_name: e.target.value })}
                                className="h-11 rounded-xl bg-slate-50 border-none text-[15px] font-bold px-4 focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">น้ำหนักคะแนน (%)</label>
                            <div className="relative">
                                <Input type="number" min="0" max="100" value={Math.round(groupForm.weight * 100)} onChange={e => setGroupForm({ ...groupForm, weight: parseInt(e.target.value) / 100 })} onKeyDown={(e) => handleKeyDown(e, handleSaveGroup)} className="h-11 rounded-xl bg-slate-50 border-none text-lg font-black px-4 pr-10 focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all font-sans" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">%</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">ประเภทการประเมิน</label>
                            <select className="w-full h-11 rounded-xl bg-slate-50 border-none px-4 text-xs font-black appearance-none cursor-pointer focus:bg-white focus:ring-1 focus:ring-blue-100 transition-all" value={groupForm.category_type} onChange={e => setGroupForm({ ...groupForm, category_type: e.target.value })}>
                                <option value="การฝึก">การฝึกประสบการณ์</option>
                                <option value="บุคลิก">บุคลิกภาพ</option>
                                <option value="เล่ม">เล่มรายงาน</option>
                            </select>
                        </div>
                    </div>
                    <Button onClick={handleSaveGroup} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-base font-black shadow-lg shadow-blue-100 transition-all active:scale-[0.98]">
                        <Save size={18} className="mr-1.5" /> บันทึกข้อมูลหมวด
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Modal: จัดการข้อคำถาม (รวม DND & Factor) */}
            <Dialog open={isItemModalOpen} onOpenChange={(open) => { if (!open) resetItemForm(); setIsItemModalOpen(open); }}>
                <DialogContent className="max-w-[95vw] w-[95vw] xl:max-w-7xl rounded-[2.5rem] p-0 border-none h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
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
                                {items.length > 0 && !selectedGroup?.is_used && (
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
                            {/* Left: Item Form */}
                            <div className={`w-full lg:w-[40%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto p-8 md:p-10 ${editingItem ? 'bg-orange-50/20' : 'bg-slate-50/20'}`}>
                                <h4 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                                    {editingItem ? <><Edit2 size={18} className="text-amber-500" /> แก้ไขรายละเอียดข้อนี้</> : <><Plus size={18} className="text-blue-600" /> เพิ่มคำถามใหม่</>}
                                    {editingItem?.is_used && <Lock size={16} className="text-slate-300 ml-1" />}
                                </h4>
                                {editingItem?.is_used && (
                                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-[11px] font-bold text-amber-700 flex items-center gap-2 mb-6">
                                        <AlertCircle size={14} />
                                        ข้อนี้มีการประเมินแล้ว แก้ไขหัวข้อได้แต่ไม่สามารถเปลี่ยนน้ำหนัก (Factor) ได้
                                    </div>
                                )}
                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">หัวข้อการประเมิน</label>
                                        <Input placeholder="เช่น ความสะอาด..." value={itemForm.question_text} onChange={e => setItemForm({ ...itemForm, question_text: e.target.value })} onKeyDown={(e) => handleKeyDown(e, handleSaveItem)} className="h-11 bg-white border border-slate-200 rounded-xl text-[15px] px-4 font-bold shadow-sm focus:border-blue-500 disabled:opacity-50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">คำอธิบายรายละเอียด</label>
                                        <textarea placeholder="ระบุเพิ่มเติม..." value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="w-full p-4 rounded-xl bg-white border border-slate-200 text-slate-600 h-24 outline-none text-sm font-medium resize-none shadow-sm focus:border-blue-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">น้ำหนัก (Factor)</label>
                                            <Input disabled={editingItem?.is_used} type="number" step="0.1" value={itemForm.factor} onChange={e => setItemForm({ ...itemForm, factor: parseFloat(e.target.value) || 1.0 })} onKeyDown={(e) => handleKeyDown(e, handleSaveItem)} className="h-11 bg-white border border-slate-200 rounded-xl text-[16px] px-4 font-black shadow-sm focus:border-blue-500 disabled:opacity-50" />
                                        </div>
                                        <div className="flex flex-col justify-end pb-0.5">
                                            <label className="flex items-center gap-3 cursor-pointer h-11 bg-white rounded-xl border border-slate-200 px-4 shadow-sm hover:border-blue-500 transition-all overflow-hidden">
                                                <input type="checkbox" checked={itemForm.allow_na} onChange={e => setItemForm({ ...itemForm, allow_na: e.target.checked })} className="w-4 h-4 accent-blue-600 rounded cursor-pointer" />
                                                <span className="text-slate-700 font-bold text-[12px] whitespace-nowrap">Allow N/A</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 pt-4">
                                        <Button onClick={handleSaveItem} className={`w-full h-14 rounded-xl font-black text-lg shadow-xl transition-all active:scale-[0.98] ${editingItem ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}>
                                            {editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มข้อคำถาม'}
                                        </Button>
                                        {editingItem && <Button variant="ghost" onClick={resetItemForm} className="text-slate-400 font-bold hover:bg-slate-100 h-10 rounded-xl transition-all text-xs">ยกเลิก</Button>}
                                    </div>
                                </div>
                            </div>

                            {/* Right: Item List */}
                            <div className="w-full lg:w-[60%] flex flex-col bg-white overflow-hidden">
                                <div className="px-8 py-3 bg-slate-50 border-b border-slate-100 shrink-0 flex justify-between items-center">
                                    <h4 className="font-black text-slate-400 uppercase tracking-widest text-[9px]">รายการทั้งหมด ({items.length} ข้อ)</h4>
                                    <p className="text-[9px] font-bold text-slate-300 italic">* ลากไอคอนซ้ายเพื่อสลับลำดับ</p>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-3 bg-slate-50/30">
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={items} strategy={verticalListSortingStrategy}>
                                            {items.map((item, idx) => (
                                                <SortableItem key={item.id} item={item} idx={idx} editingItemId={editingItem?.id} setEditingItem={setEditingItem} setItemForm={setItemForm} handleEditClick={handleEditClick} handleDeleteItem={handleDeleteItem} handleToggleItemStatus={handleToggleItemStatus} />
                                            ))}
                                        </SortableContext>
                                    </DndContext>

                                    {items.length === 0 && (
                                        <div className="py-20 text-center">
                                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm border border-slate-100">
                                                <Plus size={32} />
                                            </div>
                                            <p className="text-slate-400 font-bold text-xs">ยังไม่มีข้อคำถาม</p>
                                        </div>
                                    )}
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

            {/* Modal: ปิดการใช้งาน (Hidden) */}
            <Dialog open={isDeactivateModalOpen} onOpenChange={setIsDeactivateModalOpen}>
                <DialogContent className="max-w-md w-[95vw] rounded-3xl p-8 border-none shadow-2xl overflow-hidden font-sans">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
                            <EyeOff size={20} className="text-amber-500" /> ยืนยันการซ่อนเกณฑ์
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <p className="text-sm text-slate-500 font-medium">เกณฑ์ที่ถูกซ่อนจะไม่แสดงให้พี่เลี้ยงเห็นในการประเมินใหม่ แต่ข้อมูลการประเมินเก่าจะยังคงอยู่ครบถ้วน</p>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">หมายเหตุ (เช่น ปีการศึกษา 2568)</label>
                            <Input placeholder="ระบุเหตุผลหรือปีที่ปิดใช้งาน..." value={deactivateNote} onChange={e => setDeactivateNote(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none text-[15px] font-bold px-4 focus:bg-white focus:ring-1 focus:ring-amber-100 transition-all font-sans" />
                        </div>
                    </div>
                    <Button onClick={confirmDeactivate} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-base font-black shadow-lg shadow-amber-100 transition-all active:scale-[0.98]">
                        ยืนยันการซ่อนเกณฑ์นี้ (แอดมิน)
                    </Button>
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

function SortableItem({ item, idx, editingItemId, handleEditClick, handleDeleteItem, setEditingItem, setItemForm, handleToggleItemStatus }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0.6 : 1
    };

    const isEditing = editingItemId === item.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`p-4 rounded-2xl flex items-start justify-between gap-3 transition-all duration-200 group
                ${isDragging
                    ? 'shadow-2xl ring-2 ring-blue-600 bg-white border-blue-600 scale-[1.01]'
                    : isEditing
                        ? 'bg-indigo-50 border-blue-500 ring-2 ring-blue-100 shadow-lg'
                        : !item.is_active
                            ? 'bg-slate-50 border-slate-100 opacity-60 italic'
                            : 'bg-white border border-slate-100 shadow-sm hover:border-blue-300'
                }
            `}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                    <div {...attributes} {...listeners} className={`mt-1 cursor-grab active:cursor-grabbing shrink-0 transition-colors ${isDragging ? 'text-blue-600' : 'text-slate-300 hover:text-blue-600'}`}>
                        <GripVertical size={18} />
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-sm transition-colors ${isEditing ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                        {idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className={`font-black text-base leading-tight break-words transition-colors ${isEditing ? 'text-blue-700' : 'text-slate-800'}`}>
                                {item.question_text}
                            </p>
                        </div>
                        {item.description && <p className="text-slate-500 text-xs mt-1 line-clamp-2 italic leading-relaxed font-medium">{item.description}</p>}

                        <div className="flex gap-2 mt-3">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-md border transition-colors ${isEditing ? 'bg-white border-blue-200 text-blue-600' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {item.allow_na ? 'N/A' : 'Required'}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-md border transition-colors ${isEditing ? 'bg-white border-blue-200 text-blue-600' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                Factor: {item.factor || 1.0}
                            </span>
                            {item.is_used && (
                                <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-slate-100 text-slate-400 border border-slate-200 flex items-center gap-1">
                                    <Lock size={8} /> มีการประเมินแล้ว
                                </span>
                            )}
                            {!item.is_active && (
                                <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-slate-900 text-white border border-slate-900 flex items-center gap-1 uppercase">
                                    <EyeOff size={8} /> Hidden
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`flex gap-1 shrink-0 transition-all ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-full transition-all ${isEditing ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
                    onClick={() => isEditing ? (setEditingItem(null), setItemForm({ question_text: '', description: '', allow_na: true, factor: 1.0 })) : handleEditClick(item)}>
                    {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                </Button>
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-full transition-all ${!item.is_active ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300 hover:text-blue-600 hover:bg-blue-50'}`}
                    onClick={() => handleToggleItemStatus(item)}>
                    {item.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </Button>
                {!item.is_used && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" onClick={() => handleDeleteItem(item)}>
                        <Trash2 size={14} />
                    </Button>
                )}
            </div>
        </div>
    );
}