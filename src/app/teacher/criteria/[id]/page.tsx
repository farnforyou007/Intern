"use client"
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ChevronLeft, ListTodo, Edit2, Trash2, LayoutTemplate, Copy, X, Save, GripVertical, AlertCircle, Settings2, Layers, BookOpen, Lock, Eye, EyeOff , Info } from "lucide-react"
import Swal from 'sweetalert2'

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// --- Sortable Item Component ---
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
                    ? 'shadow-2xl ring-2 ring-indigo-600 bg-white border-indigo-600 scale-[1.01]'
                    : isEditing
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-100 shadow-lg'
                        : !item.is_active
                            ? 'bg-slate-50 border-slate-100 opacity-60 italic'
                            : 'bg-white border border-slate-100 shadow-sm hover:border-indigo-300'
                }
            `}
        >
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                    <div {...attributes} {...listeners} className={`mt-1 cursor-grab active:cursor-grabbing shrink-0 transition-colors ${isDragging ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-600'}`}>
                        <GripVertical size={18} />
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-sm transition-colors ${isEditing ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}>
                        {idx + 1}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <p className={`font-black text-base leading-tight break-words transition-colors ${isEditing ? 'text-indigo-700' : 'text-slate-800'}`}>
                                {item.question_text}
                            </p>
                        </div>
                        {item.description && <p className="text-slate-500 text-xs mt-1 line-clamp-2 italic leading-relaxed font-medium">{item.description}</p>}

                        <div className="flex gap-2 mt-3">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-md border transition-colors ${isEditing ? 'bg-white border-indigo-200 text-indigo-600' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {item.allow_na ? 'N/A' : 'Required'}
                            </span>
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-md border transition-colors ${isEditing ? 'bg-white border-indigo-200 text-indigo-600' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                Factor: {item.factor || 1.0}
                            </span>
                            {item.is_used && (
                                <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-slate-100 text-slate-400 border border-slate-200 flex items-center gap-1">
                                    <Lock size={8} /> มีการประเมินแล้ว
                                </span>
                            )}
                            {!item.is_active && (
                                <span className="px-2 py-0.5 text-[9px] font-black rounded-md bg-indigo-900 text-white border border-indigo-900 flex items-center gap-1 uppercase">
                                    <EyeOff size={8} /> Hidden
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`flex gap-1 shrink-0 transition-all ${isEditing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-full transition-all ${isEditing ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                    onClick={() => isEditing ? (setEditingItem(null), setItemForm({ question_text: '', description: '', allow_na: true, factor: 1.0 })) : handleEditClick(item)}>
                    {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                </Button>
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-full transition-all ${!item.is_active ? 'text-indigo-600 hover:bg-indigo-50' : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
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

export default function TeacherManageCriteria() {
    const params = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()

    const subjectId = params.id as string
    const subId = searchParams.get('subId')

    const [groups, setGroups] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [unauthorized, setUnauthorized] = useState(false)

    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
    const [isItemModalOpen, setIsItemModalOpen] = useState(false)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

    const [selectedGroup, setSelectedGroup] = useState<any>(null)
    const [groupForm, setGroupForm] = useState({ group_name: '', category_type: 'การฝึก', weight: 0.1 })
    const [subject, setSubject] = useState<any>(null)
    const [subSubject, setSubSubject] = useState<any>(null)

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
        setLoading(true)
        try {
            const res = await fetch(`/api/teacher/criteria?subjectId=${subjectId}${subId ? `&subId=${subId}` : ''}`)
            const result = await res.json()
            if (result.success) {
                setGroups(result.data.groups || [])
                setTemplates(result.data.templates || [])
                setSubject(result.data.subject)
                setSubSubject(result.data.subSubject)
            } else if (res.status === 403) {
                setUnauthorized(true)
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }, [subjectId, subId])

    useEffect(() => { fetchData() }, [fetchData])

    const handleSaveGroup = async () => {
        try {
            const res = await fetch('/api/teacher/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save-group',
                    subjectId: parseInt(subjectId),
                    groupId: selectedGroup?.id,
                    groupData: { ...groupForm, sub_subject_id: subId ? parseInt(subId) : null }
                })
            })
            const result = await res.json()
            if (result.success) {
                setIsGroupModalOpen(false)
                fetchData()
            } else {
                Swal.fire({ icon: 'error', title: 'ไม่สามารถบันทึกได้', text: result.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', customClass: { popup: 'rounded-[1.5rem]' } })
            }
        } catch (error) {
            console.error("Save group error:", error)
        }
    }

    const handleDeleteGroup = (group: any) => {
        Swal.fire({
            title: 'ลบหมวดนี้?',
            html: `หมวด <b>"${group.group_name}"</b> และข้อคำถามภายในทั้งหมดจะถูกลบถาวร`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการลบ',
            confirmButtonColor: '#dc2626',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: { popup: 'rounded-[2rem] font-sans p-10', confirmButton: 'rounded-full px-8 py-2 font-bold', cancelButton: 'rounded-full px-8 py-2 font-bold' }
        }).then(async (res) => {
            if (res.isConfirmed) {
                const response = await fetch('/api/teacher/criteria', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete-group', subjectId: parseInt(subjectId), groupId: group.id })
                })
                if (response.ok) {
                    fetchData()
                    Swal.fire({ icon: 'success', title: 'ลบสำเร็จ', timer: 1500, showConfirmButton: false })
                }
            }
        })
    }

    const handleToggleStatus = async (group: any) => {
        if (group.is_active) {
            // If active, open modal to ask for note before deactivating
            setTargetGroupForStatus(group)
            setDeactivateNote(group.deactivation_note || '')
            setIsDeactivateModalOpen(true)
        } else {
            // If inactive, just reactivate
            try {
                const res = await fetch('/api/teacher/criteria', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'toggle-group-status',
                        subjectId: parseInt(subjectId),
                        groupId: group.id,
                        is_active: true,
                        deactivation_note: group.deactivation_note
                    })
                })
                if (res.ok) {
                    fetchData()
                    Swal.fire({ icon: 'success', title: 'เปิดใช้งานเรียบร้อย', timer: 1500, showConfirmButton: false })
                }
            } catch (error) {
                console.error('Toggle status error:', error)
            }
        }
    }

    const confirmDeactivate = async () => {
        try {
            const res = await fetch('/api/teacher/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle-group-status',
                    subjectId: parseInt(subjectId),
                    groupId: targetGroupForStatus.id,
                    is_active: false,
                    deactivation_note: deactivateNote
                })
            })
            if (res.ok) {
                setIsDeactivateModalOpen(false)
                fetchData()
                Swal.fire({ icon: 'success', title: 'ซ่อนเกณฑ์เรียบร้อย', timer: 1500, showConfirmButton: false })
            }
        } catch (error) {
            console.error('Deactivate error:', error)
        }
    }

    const openItemsModal = (group: any) => {
        setSelectedGroup(group)
        setItems(group.evaluation_items || [])
        setIsItemModalOpen(true)
    }

    const handleSaveItem = async () => {
        if (!itemForm.question_text) return;
        try {
            const res = await fetch('/api/teacher/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save-item',
                    subjectId: parseInt(subjectId),
                    itemId: editingItem?.id,
                    groupId: selectedGroup.id,
                    itemData: itemForm
                })
            })
            const result = await res.json()
            if (result.success) {
                resetItemForm()
                const refreshRes = await fetch(`/api/teacher/criteria?subjectId=${subjectId}${subId ? `&subId=${subId}` : ''}`)
                const refreshResult = await refreshRes.json()
                if (refreshResult.success) {
                    const updatedGroup = refreshResult.data.groups.find((g: any) => g.id === selectedGroup.id)
                    setItems(updatedGroup?.evaluation_items || [])
                    fetchData() // Sync main state
                }
            } else {
                Swal.fire({
                    target: document.getElementById('item-modal-content') || document.body,
                    icon: 'error',
                    title: 'ไม่สามารถบันทึกได้',
                    text: result.error || 'หัวข้อหรือน้ำหนักถูกล็อคเนื่องจากมีการประเมินแล้ว',
                    customClass: { popup: 'rounded-[1.5rem]' }
                })
            }
        } catch (error) {
            console.error("Save item error:", error)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            action();
        }
    };

    const handleDeleteItem = (item: any) => {
        Swal.fire({
            target: document.getElementById('item-modal-content') || document.body,
            title: 'ลบข้อคำถามนี้?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: { popup: 'rounded-[1.5rem] font-sans' }
        }).then(async (res) => {
            if (res.isConfirmed) {
                const response = await fetch('/api/teacher/criteria', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete-item', subjectId: parseInt(subjectId), itemId: item.id, groupId: selectedGroup.id })
                })
                const result = await response.json()
                if (response.ok) {
                    setItems(items.filter(i => i.id !== item.id))
                    fetchData() // Sync main state
                } else {
                    Swal.fire({
                        target: document.getElementById('item-modal-content') || document.body,
                        icon: 'error',
                        title: 'ไม่สามารถลบได้',
                        text: result.error || 'เกิดข้อผิดพลาดในการลบ',
                        customClass: { popup: 'rounded-[1.5rem]' }
                    })
                }
            }
        })
    }

    const handleToggleItemStatus = async (item: any) => {
        try {
            const res = await fetch('/api/teacher/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'toggle-item-status',
                    subjectId: parseInt(subjectId),
                    itemId: item.id,
                    is_active: !item.is_active
                })
            });
            if (res.ok) {
                fetchData() // Sync main state
                // Update local items state for immediate UI response
                const refreshRes = await fetch(`/api/teacher/criteria?subjectId=${subjectId}${subId ? `&subId=${subId}` : ''}`)
                const refreshResult = await refreshRes.json()
                if (refreshResult.success) {
                    const updatedGroup = refreshResult.data.groups.find((g: any) => g.id === selectedGroup.id)
                    setItems(updatedGroup?.evaluation_items || [])
                }

                Swal.fire({
                    target: document.getElementById('item-modal-content') || document.body,
                    icon: 'success',
                    title: item.is_active ? 'ซ่อนคำถามเรียบร้อย' : 'เปิดใช้งานคำถามเรียบร้อย',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-[1.5rem] font-sans' }
                })
            }
        } catch (error) {
            console.error('Toggle item status error:', error)
        }
    }

    const handleClearAllItems = async () => {
        Swal.fire({
            target: document.getElementById('item-modal-content') || document.body,
            title: 'ล้างคำถามทั้งหมด?',
            text: "ข้อคำถามทั้งหมดในหมวดนี้จะถูกลบออกถาวร",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ยืนยันการล้าง',
            confirmButtonColor: '#dc2626',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: { popup: 'rounded-[1.5rem] font-sans' }
        }).then(async (res) => {
            if (res.isConfirmed) {
                const response = await fetch('/api/teacher/criteria', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'clear-items', subjectId: parseInt(subjectId), groupId: selectedGroup.id })
                })
                const result = await response.json()
                if (response.ok) {
                    setItems([])
                    fetchData() // Sync main state
                    Swal.fire({ icon: 'success', title: 'ล้างข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false })
                } else {
                    Swal.fire({
                        target: document.getElementById('item-modal-content') || document.body,
                        icon: 'error',
                        title: 'ไม่สามารถล้างได้',
                        text: result.error || 'เนื่องจากมีข้อคำถามบางข้อที่ถูกใช้ประเมินแล้ว',
                        customClass: { popup: 'rounded-[1.5rem]' }
                    })
                }
            }
        })
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            const newIndex = items.findIndex((i) => i.id === over.id);
            const newOrder = arrayMove(items, oldIndex, newIndex);
            setItems(newOrder);

            const updates = newOrder.map((item, index) => ({ id: item.id, order_index: index }));
            await fetch('/api/teacher/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reorder-items', subjectId: parseInt(subjectId), groupId: selectedGroup.id, updates })
            })
            fetchData() // Sync main state
        }
    };

    const handleApplyTemplate = async (templateId: number) => {
        const { isConfirmed } = await Swal.fire({
            title: 'กดยืนยันเพื่อใช้เทมเพลต?',
            text: "ข้อคำถามจากเทมเพลตจะถูกเพิ่มต่อท้ายรายการที่คุณมี",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ตกลง',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: { popup: 'rounded-[1.5rem] font-sans' }
        })

        if (isConfirmed) {
            const res = await fetch('/api/teacher/criteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'apply-template', subjectId: parseInt(subjectId), templateId, groupId: selectedGroup.id })
            })
            if (res.ok) {
                setIsTemplateModalOpen(false)
                const refreshRes = await fetch(`/api/teacher/criteria?subjectId=${subjectId}${subId ? `&subId=${subId}` : ''}`)
                const refreshResult = await refreshRes.json()
                if (refreshResult.success) {
                    const updatedGroup = refreshResult.data.groups.find((g: any) => g.id === selectedGroup.id)
                    setItems(updatedGroup?.evaluation_items || [])
                    fetchData() // Sync main state
                }
            }
        }
    }

    const resetItemForm = () => {
        setEditingItem(null);
        setItemForm({ question_text: '', description: '', allow_na: true, factor: 1.0 });
    };

    const handleEditClick = (item: any) => {
        setEditingItem(item);
        setItemForm({
            question_text: item.question_text || '',
            description: item.description || '',
            allow_na: item.allow_na,
            factor: item.factor || 1.0
        });
    };

    const getCategoryStyle = (type: string) => {
        switch (type) {
            case 'การฝึก': return 'bg-indigo-600 text-white'
            case 'บุคลิก': return 'bg-slate-900 text-white'
            case 'เล่ม': return 'bg-amber-500 text-white'
            default: return 'bg-slate-400 text-white'
        }
    }

    if (unauthorized) return (
        <div className="h-screen flex flex-col items-center justify-center p-8 bg-slate-50">
            <AlertCircle size={48} className="text-red-500 mb-4" />
            <h1 className="text-xl font-black">ไม่มีสิทธิ์เข้าถึง</h1>
            <p className="text-sm text-slate-500">คุณไม่ได้รับผิดชอบรายวิชานี้ หรือไม่มีสิทธิ์แก้ไขเกณฑ์ประเมิน</p>
            <Button onClick={() => router.push('/teacher/criteria')} className="mt-6 rounded-xl">กลับไปหน้ารายวิชา</Button>
        </div>
    )

    const totalWeight = groups.reduce((acc, curr) => acc + (curr.weight || 0), 0)

    return (
        <div className="max-w-6xl mx-auto pb-20 px-4 font-sans mt-8 text-slate-900">
            <button onClick={() => router.push('/teacher/criteria')} className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 mb-6 text-[13px] font-bold transition-colors">
                <ChevronLeft size={16} /> กลับไปเลือกรายวิชา
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <BookOpen size={28} className="text-indigo-600" />
                        ตั้งค่าเกณฑ์แบบประเมิน
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 ml-10">
                        {subject ? (
                            <div className="flex items-center gap-2">
                                {/* <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                                    <BookOpen className="text-indigo-600" size={18} />
                                </div> */}
                                <div className="flex items-baseline gap-2">
                                    <h2 className="text-slate-900 font-medium text-lg leading-none">{subject.name}</h2>
                                    {subSubject && (
                                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">
                                            ({subSubject.name})
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : loading ? (
                            <Skeleton className="h-10 w-48 rounded-xl" />
                        ) : (
                            <div className="flex items-center gap-2 text-slate-400">
                                <Info size={18} />
                                <span className="font-bold">ไม่พบข้อมูลรายวิชา</span>
                            </div>
                        )}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${totalWeight === 1 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            Weight รวม: {Math.round(totalWeight * 100)}%
                        </span>
                    </div>
                </div>
                <Button onClick={() => { setSelectedGroup(null); setGroupForm({ group_name: '', category_type: 'การฝึก', weight: 0.1 }); setIsGroupModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 px-6 shadow-lg shadow-indigo-100 active:scale-95 transition-all text-sm font-bold">
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
                                                <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-[9px] font-black rounded-md flex items-center gap-1 uppercase">
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
                                        <Button onClick={() => openItemsModal(group)} variant="outline" className="h-9 px-4 rounded-xl text-[11px] font-black border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                            <ListTodo size={14} className="mr-1.5" /> ตั้งค่าคำถาม ({group.evaluation_items?.length || 0})
                                        </Button>
                                    </TableCell>
                                    <TableCell className="text-right px-6">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="icon" className={`h-9 w-9 rounded-full transition-all ${group.is_active ? 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50' : 'text-indigo-600 hover:bg-indigo-100'}`} onClick={() => handleToggleStatus(group)}>
                                                {group.is_active ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all" onClick={() => { setSelectedGroup(group); setGroupForm({ group_name: group.group_name, category_type: group.category_type, weight: group.weight }); setIsGroupModalOpen(true); }}><Edit2 size={16} /></Button>
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

            {/* Modal: หมวดประเมิน */}
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
                                onKeyDown={(e) => handleKeyDown(e, handleSaveGroup)}
                                className="h-11 rounded-xl bg-slate-50 border-none text-[15px] font-bold px-4 focus:bg-white focus:ring-1 focus:ring-indigo-100 transition-all disabled:opacity-50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">น้ำหนักคะแนน (%)</label>
                            <div className="relative">
                                <Input type="number" min="0" max="100" value={Math.round(groupForm.weight * 100)} onChange={e => setGroupForm({ ...groupForm, weight: parseInt(e.target.value) / 100 })} onKeyDown={(e) => handleKeyDown(e, handleSaveGroup)} className="h-11 rounded-xl bg-slate-50 border-none text-lg font-black px-4 pr-10 focus:bg-white focus:ring-1 focus:ring-indigo-100 transition-all font-sans" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-sm">%</span>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">ประเภทการประเมิน</label>
                            <select className="w-full h-11 rounded-xl bg-slate-50 border-none px-4 text-xs font-black appearance-none cursor-pointer focus:bg-white focus:ring-1 focus:ring-indigo-100 transition-all" value={groupForm.category_type} onChange={e => setGroupForm({ ...groupForm, category_type: e.target.value })}>
                                <option value="การฝึก">การฝึกประสบการณ์</option>
                                <option value="บุคลิก">บุคลิกภาพ</option>
                                <option value="เล่ม">เล่มรายงาน</option>
                            </select>
                        </div>
                    </div>
                    <Button onClick={handleSaveGroup} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-black shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]">
                        <Save size={18} className="mr-1.5" /> บันทึกข้อมูลหมวด
                    </Button>
                </DialogContent>
            </Dialog>

            {/* Modal: จัดการข้อคำถาม */}
            <Dialog open={isItemModalOpen} onOpenChange={(open) => { if (!open) resetItemForm(); setIsItemModalOpen(open); }}>
                <DialogContent className="max-w-[95vw] w-[95vw] xl:max-w-7xl rounded-[2.5rem] p-0 border-none h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
                    <div id="item-modal-content" className="flex flex-col h-full bg-white">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white shrink-0 z-20">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100"><ListTodo size={28} /></div>
                                <DialogTitle className="text-2xl font-black text-slate-800 leading-tight">
                                    จัดการข้อคำถาม
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {/* แสดงชื่อวิชาหลัก */}
                                        <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            {subject?.name} {subSubject ? ` > ${subSubject.name}` : ''}
                                        </span>

                                        {/* แสดงชื่อกลุ่ม/หมวดประเมินที่กำลังแก้ */}
                                        <span className="text-[11px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                            หมวด: {selectedGroup?.group_name}
                                        </span>
                                    </div>
                                </DialogTitle>
                            </div>
                            <div className="flex gap-2 mr-12 shrink-0 transition-all">
                                {items.length > 0 && !selectedGroup?.is_used && (
                                    <Button onClick={handleClearAllItems} variant="ghost" className="rounded-full text-red-500 hover:bg-red-50 font-bold px-6 h-11 border border-red-100 text-[13px]">
                                        <Trash2 size={16} className="mr-2" /> ล้างทั้งหมด
                                    </Button>
                                )}
                                <Button
                                    onClick={() => setIsTemplateModalOpen(true)}
                                    variant="outline"
                                    className="rounded-full border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-600 hover:text-white px-6 h-11 shadow-sm text-[13px]"
                                >
                                    <Copy size={16} className="mr-2" /> ใช้เทมเพลตมาตรฐาน
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                            {/* Left: Item Form */}
                            <div className={`w-full lg:w-[40%] flex flex-col border-b lg:border-b-0 lg:border-r border-slate-100 overflow-y-auto p-8 md:p-10 ${editingItem ? 'bg-indigo-50/20' : 'bg-slate-50/20'}`}>
                                <h4 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
                                    {editingItem ? <><Edit2 size={18} className="text-amber-500" /> แก้ไขรายละเอียดข้อนี้</> : <><Plus size={18} className="text-indigo-600" /> เพิ่มคำถามใหม่</>}
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
                                        <Input placeholder="เช่น แต่งกายถูกระเบียบ..." value={itemForm.question_text} onChange={e => setItemForm({ ...itemForm, question_text: e.target.value })} onKeyDown={(e) => handleKeyDown(e, handleSaveItem)} className="h-11 bg-white border border-slate-200 rounded-xl text-[15px] px-4 font-bold shadow-sm focus:border-indigo-500 disabled:opacity-50" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">คำอธิบายรายละเอียด</label>
                                        <textarea placeholder="ระบุเพิ่มเติม..." value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="w-full p-4 rounded-xl bg-white border border-slate-200 text-slate-600 h-24 outline-none text-sm font-medium resize-none shadow-sm focus:border-indigo-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">น้ำหนัก (Factor)</label>
                                            <Input disabled={editingItem?.is_used} type="number" step="0.1" value={itemForm.factor} onChange={e => setItemForm({ ...itemForm, factor: parseFloat(e.target.value) || 1.0 })} onKeyDown={(e) => handleKeyDown(e, handleSaveItem)} className="h-11 bg-white border border-slate-200 rounded-xl text-[16px] px-4 font-black shadow-sm focus:border-indigo-500 disabled:opacity-50" />
                                        </div>
                                        <div className="flex flex-col justify-end pb-0.5">
                                            <label className="flex items-center gap-3 cursor-pointer h-11 bg-white rounded-xl border border-slate-200 px-4 shadow-sm hover:border-indigo-500 transition-all overflow-hidden">
                                                <input type="checkbox" checked={itemForm.allow_na} onChange={e => setItemForm({ ...itemForm, allow_na: e.target.checked })} className="w-4 h-4 accent-indigo-600 rounded cursor-pointer" />
                                                <span className="text-slate-700 font-bold text-[12px] whitespace-nowrap">Allow N/A</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-3 pt-4">
                                        <Button onClick={handleSaveItem} className={`w-full h-14 rounded-xl font-black text-lg shadow-xl transition-all active:scale-[0.98] ${editingItem ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'}`}>
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
                                                <SortableItem key={item.id} item={item} idx={idx} onEdit={handleEditClick} onDelete={handleDeleteItem} editingItemId={editingItem?.id} setEditingItem={setEditingItem} setItemForm={setItemForm} handleEditClick={handleEditClick} handleDeleteItem={handleDeleteItem} handleToggleItemStatus={handleToggleItemStatus} />
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

            <Dialog open={isTemplateModalOpen} onOpenChange={setIsTemplateModalOpen}>
                <DialogContent className="max-w-3xl w-[95vw] rounded-[2.5rem] p-8 border-none shadow-2xl bg-white font-sans overflow-hidden flex flex-col max-h-[90vh]">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Copy size={20} />
                            </div>
                            เลือกเทมเพลตประเมินมาตรฐาน
                        </DialogTitle>
                        <p className="text-slate-500 font-medium text-sm ml-10">คลิกเลือกรูปแบบเทมเพลตที่ต้องการนำไปใช้ในหมวดนี้</p>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar py-2">
                        {templates.map(temp => (
                            <button key={temp.id} onClick={() => handleApplyTemplate(temp.id)} className="group relative flex flex-col items-start p-5 rounded-[1.8rem] border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-indigo-500 hover:shadow-xl transition-all text-left">
                                <div className="flex items-start gap-3 w-full">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                                        <LayoutTemplate size={18} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="block font-black text-slate-800 text-[15px] leading-tight group-hover:text-indigo-600 transition-colors break-words">
                                            {temp.template_name}
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-md uppercase">Template</span>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">ID: #{temp.id}</span>
                                        </div>
                                    </div>
                                </div>
                                {temp.description && <p className="text-[12px] text-slate-400 mt-3 line-clamp-2 font-medium pl-1">{temp.description}</p>}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-slate-400">
                        <p className="text-[10px] font-bold uppercase tracking-widest">พบทั้งหมด {templates.length} รูปแบบ</p>
                        <Button variant="ghost" onClick={() => setIsTemplateModalOpen(false)} className="text-[11px] font-bold hover:bg-slate-100 rounded-lg px-4 h-8 transition-all">ยกเลิก</Button>
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
                        ยืนยันการซ่อนเกณฑ์นี้
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}
