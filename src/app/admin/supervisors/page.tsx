//version 0100 — API Routes Migration
"use client"
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr' // เก็บไว้สำหรับ Realtime เท่านั้น
import {
    UserCheck, ShieldAlert, MapPin, Phone, Trash2,
    Check, Search, Users, Loader2, RefreshCw,
    MessageCircle, Calendar, User, X, Edit2,
    Save, BookOpen, Building2, Layers, Hospital, Plus,
    ChevronLeft, ChevronRight, Download, Bell, Send, Mail
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Swal from 'sweetalert2'
import AdminLayout from '@/components/AdminLayout'
import * as XLSX from 'xlsx'
// --- Component เสริม: Skeleton Loading ---
function PersonnelSkeleton({ viewType }: { viewType: 'card' | 'table' }) {
    if (viewType === 'card') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] border border-slate-100 p-7 h-[280px] animate-pulse">
                        <div className="flex items-center gap-5 mb-6">
                            <div className="w-20 h-20 rounded-[1.8rem] bg-slate-100" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-slate-100 rounded w-3/4" />
                                <div className="h-3 bg-slate-100 rounded w-1/2" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="h-8 bg-slate-50 rounded-xl w-full" />
                            <div className="h-8 bg-slate-50 rounded-xl w-full" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden animate-pulse">
            <div className="h-16 bg-slate-50 border-b border-slate-100" />
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-24 border-b border-slate-50 flex items-center px-8 gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-100 rounded w-1/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/6" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// --- Component เสริม: Evaluation Progress Bar ---
function EvaluationProgressBar({ evaluated, total }: { evaluated: number; total: number }) {
    if (total === 0) {
        return (
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-300 italic">ไม่มีงาน</span>
            </div>
        )
    }
    const percent = Math.round((evaluated / total) * 100)
    const barColor = percent === 100 ? 'bg-emerald-500' : percent >= 50 ? 'bg-blue-500' : percent > 0 ? 'bg-amber-500' : 'bg-red-400'
    const textColor = percent === 100 ? 'text-emerald-600' : percent >= 50 ? 'text-blue-600' : percent > 0 ? 'text-amber-600' : 'text-red-500'

    return (
        <div className="min-w-[100px]">
            <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-black ${textColor}`}>{evaluated}/{total}</span>
                <span className={`text-[10px] font-bold ${textColor}`}>{percent}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${percent}%` }}
                />
            </div>
            {percent === 100 && (
                <div className="flex items-center gap-1 mt-1">
                    <Check size={10} className="text-emerald-500" />
                    <span className="text-[9px] font-bold text-emerald-500">ครบแล้ว</span>
                </div>
            )}
        </div>
    )
}

// --- Component เสริม: Pagination Footer ---
function PaginationFooter({ currentPage, totalItems, itemsPerPage, onPageChange, onItemsPerPageChange }: any) {
    const totalPages = Math.ceil(totalItems / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage

    if (totalItems === 0) return null

    return (
        <div className="px-8 py-6 bg-slate-50/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-[2.5rem]">
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">แสดงแถว:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        onItemsPerPageChange(Number(e.target.value));
                        onPageChange(1);
                    }}
                    className="bg-white border-none shadow-sm rounded-xl px-3 py-1.5 text-xs font-black text-slate-600 outline-none focus:ring-2 ring-blue-500 cursor-pointer transition-all hover:shadow-md"
                >
                    {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
                </select>
                <p className="text-xs font-bold text-slate-400 ml-2">
                    {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalItems)} จาก {totalItems} รายการ
                </p>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-9 font-bold bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft size={16} className="mr-1" /> ก่อนหน้า
                </Button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        if (totalPages > 7 && (page !== 1 && page !== totalPages && Math.abs(currentPage - page) > 1)) {
                            if (page === 2 || page === totalPages - 1) return <span key={page} className="text-slate-300 text-xs px-1">...</span>;
                            return null;
                        }
                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110'
                                    : 'text-slate-400 hover:bg-slate-100'
                                    }`}
                            >
                                {page}
                            </button>
                        )
                    })}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-9 font-bold bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                >
                    ถัดไป <ChevronRight size={16} className="ml-1" />
                </Button>
            </div>
        </div>
    )
}

// --- 1. Component: PersonnelDetailModal ---
function PersonnelDetailModal({ data, isOpen, onClose, onApprove, onDelete, onUpdate, subjects, sites, subSubjects, fetchData }: any) {
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<any>({})
    const [currentSubjects, setCurrentSubjects] = useState<any[]>([])
    const filteredSubSubs = subSubjects?.filter((ss: any) => ss.parent_subject_id === parseInt(editForm.subject_id)) || []

    useEffect(() => {
        if (data) {
            setEditForm({ ...data })
            setCurrentSubjects(data.supervisor_subjects || [])
            setIsEditing(false)
        }
    }, [data, isOpen])

    if (!data) return null;
    const isTeacher = data.role === 'teacher';

    const addSubject = () => {
        if (!editForm.subject_id) return;
        const sub = subjects.find((s: any) => s.id === parseInt(editForm.subject_id));
        const subSub = subSubjects.find((ss: any) => ss.id === parseInt(editForm.sub_subject_id));
        const isDuplicate = currentSubjects.some(s => s.subject_id === parseInt(editForm.subject_id) && s.sub_subject_id === (editForm.sub_subject_id ? parseInt(editForm.sub_subject_id) : null));
        if (isDuplicate) return Swal.fire({ icon: 'warning', title: 'รายวิชาซ้ำ', text: 'คุณได้เพิ่มวิชานี้ไปแล้ว', timer: 1500, showConfirmButton: false });

        const newEntry = {
            subject_id: parseInt(editForm.subject_id),
            sub_subject_id: editForm.sub_subject_id ? parseInt(editForm.sub_subject_id) : null,
            subjects: { name: sub?.name },
            sub_subjects: { name: subSub?.name }
        };
        setCurrentSubjects([...currentSubjects, newEntry]);
        setEditForm({ ...editForm, subject_id: '', sub_subject_id: '' });
    }

    const removeSubject = (index: number) => { setCurrentSubjects(currentSubjects.filter((_, i) => i !== index)); }

    const handleSave = async () => {
        try {
            const res = await fetch('/api/admin/supervisors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'save-subjects',
                    supervisorId: data.id,
                    subjects: currentSubjects.map(s => ({
                        subject_id: s.subject_id,
                        sub_subject_id: s.sub_subject_id
                    }))
                })
            })
            const result = await res.json()
            if (!result.success) throw new Error(result.error)
            setIsEditing(false); onClose();
            Swal.fire({ icon: 'success', title: 'บันทึกและอัปเดตงานเรียบร้อย', timer: 1500, showConfirmButton: false, position: 'center', customClass: { popup: 'rounded-[2.5rem] font-sans p-10' } });
            fetchData();
        } catch (error: any) { console.error(error); Swal.fire('Error', 'ไม่สามารถบันทึกข้อมูลได้', 'error'); }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] lg:max-w-[1100px] w-full p-0 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-none shadow-2xl bg-white focus:outline-none">
                <DialogHeader className="sr-only"><DialogTitle>Details</DialogTitle></DialogHeader>
                <div className="flex flex-col md:flex-row h-full min-h-0 md:min-h-[700px] max-h-[95dvh] md:max-h-[92vh] overflow-y-auto md:overflow-hidden">
                    <div className="w-full md:w-[32%] lg:w-[30%] bg-slate-950 relative flex flex-col border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
                        <div className="relative h-[200px] md:h-[55%] w-full overflow-hidden">
                            {data.avatar_url ? <img src={data.avatar_url} className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-700"><User size={160} strokeWidth={0.5} /></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                        </div>
                        <div className="p-6 md:p-10 flex-1 flex flex-col justify-start -mt-16 md:-mt-20 relative z-10">
                            <span className={`inline-block w-fit px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-xl border ${isTeacher ? 'bg-purple-600 text-white border-purple-400' : 'bg-blue-600 text-white border-blue-400'}`}>{isTeacher ? 'Faculty Staff' : 'Instructor'}</span>
                            <h2 className="text-2xl font-black text-white leading-[1.1] tracking-tight mb-4">{data.full_name}</h2>
                            <div className="flex items-center gap-3 text-blue-400 font-bold"><MessageCircle size={18} className="opacity-80" /><span className="text-sm tracking-wide">{data.line_display_name || 'No LINE display'}</span></div>
                        </div>
                    </div>
                    <div className="flex-1 bg-white flex flex-col overflow-hidden min-h-0">
                        <div className="px-6 md:px-12 py-4 md:py-8 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-sm shrink-0">
                            <div className="space-y-1"><h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Professional Information</h3><div className="h-1 w-10 bg-blue-500 rounded-full" /></div>
                            <Button variant="ghost" onClick={() => setIsEditing(!isEditing)} className={`rounded-2xl px-6 h-12 transition-all text-xs font-black tracking-[0.1em] ${isEditing ? "text-red-500 bg-red-50" : "text-blue-600 bg-blue-50 hover:bg-blue-100"}`}>{isEditing ? <X size={18} className="mr-2" /> : <Edit2 size={18} className="mr-2" />}{isEditing ? "ยกเลิก" : "แก้ไขข้อมูล"}</Button>
                        </div>
                        <div className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar space-y-8 md:space-y-12">
                            <div className="space-y-20">
                                {/* Row 1: Contact Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                                    <div className="space-y-2 group">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2.5">
                                            <div className="p-2 bg-blue-50 text-blue-500 rounded-xl transition-transform group-hover:scale-110">
                                                <Phone size={14} strokeWidth={3} />
                                            </div>
                                            เบอร์โทรศัพท์
                                        </label>
                                        <div className="relative">
                                            {isEditing ? (
                                                <Input
                                                    value={editForm.phone || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                                    className="h-16 rounded-[1.5rem] bg-slate-50 border-none px-6 text-xl font-black text-slate-800 shadow-inner focus:bg-white transition-all ring-offset-0 focus:ring-4 focus:ring-blue-500/10"
                                                    placeholder="08X-XXX-XXXX"
                                                />
                                            ) : (
                                                <div className="px-1">
                                                    <p className="text-xl font-black text-slate-900 tracking-tight">{data.phone || '-'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 group">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2.5">
                                            <div className="p-2 bg-rose-50 text-rose-500 rounded-xl transition-transform group-hover:scale-110">
                                                <Mail size={14} strokeWidth={3} />
                                            </div>
                                            อีเมล
                                        </label>
                                        <div className="relative">
                                            {isEditing ? (
                                                <Input
                                                    value={editForm.email || ''}
                                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                                    className="h-16 rounded-[1.5rem] bg-slate-50 border-none px-6 text-xl font-black text-slate-800 shadow-inner focus:bg-white transition-all ring-offset-0 focus:ring-4 focus:ring-rose-500/10"
                                                    placeholder="example@email.com"
                                                />
                                            ) : (
                                                <div className="px-1">
                                                    <p className="text-xl font-black text-slate-900 tracking-tight">{data.email || '-'}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Location Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                                    <div className="space-y-2 group">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2.5">
                                            <div className="p-2 bg-orange-50 text-orange-500 rounded-xl transition-transform group-hover:scale-110">
                                                <MapPin size={14} strokeWidth={3} />
                                            </div>
                                            จังหวัด
                                        </label>
                                        <div className="px-1">
                                            <p className="text-xl font-black text-slate-900 tracking-tight">
                                                {isTeacher ? 'สงขลา' : (data.training_sites?.province || data.province || '-')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 group">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2.5">
                                            <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl transition-transform group-hover:scale-110">
                                                <Building2 size={14} strokeWidth={3} />
                                            </div>
                                            โรงพยาบาล / หน่วยงาน
                                        </label>
                                        <div className="px-1">
                                            <p className="text-xl font-black text-slate-900 tracking-tight">
                                                {isTeacher ? 'คณะการแพทย์แผนไทย' : (data.training_sites?.site_name || '-')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6 pt-10 border-t border-slate-100">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3"><div className="p-2 bg-emerald-50 rounded-xl"><BookOpen size={16} className="text-emerald-500" /></div> รายวิชาที่รับผิดชอบ</label>
                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div className="flex flex-wrap gap-2">{currentSubjects.map((ss: any, i: number) => (<div key={i} className="flex items-center gap-3 pl-3 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-2xl group"><span className="text-xs font-bold text-slate-700">{ss.subjects?.name} {ss.sub_subjects?.name ? `(${ss.sub_subjects.name})` : ''}</span><button onClick={() => removeSubject(i)} className="w-8 h-8 rounded-xl bg-white text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors"><Trash2 size={14} /></button></div>))}</div>
                                        <div className="flex flex-row items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                            <select className="flex-1 h-10 rounded-xl bg-white px-3 text-[11px] font-bold border-none shadow-sm outline-none ring-1 ring-slate-200" value={editForm.subject_id} onChange={(e) => setEditForm({ ...editForm, subject_id: e.target.value, sub_subject_id: '' })}><option value="">เลือกวิชาหลัก...</option>{subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                                            {filteredSubSubs.length > 0 && (<select className="flex-1 h-10 rounded-xl bg-blue-50 px-3 text-[11px] font-bold border-none shadow-sm text-blue-700 outline-none ring-1 ring-blue-100" value={editForm.sub_subject_id} onChange={(e) => setEditForm({ ...editForm, sub_subject_id: e.target.value })}><option value="">เลือกวิชาย่อย...</option>{filteredSubSubs.map((ss: any) => <option key={ss.id} value={ss.id}>{ss.name}</option>)}</select>)}
                                            <Button onClick={addSubject} disabled={!editForm.subject_id} className="h-10 px-4 bg-slate-900 hover:bg-blue-600 rounded-xl font-black text-[10px] uppercase shadow-md transition-all shrink-0"><Plus size={16} className="mr-1" /> เพิ่ม</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-4">{data.supervisor_subjects && data.supervisor_subjects.length > 0 ? (data.supervisor_subjects.map((ss: any, i: number) => (<div key={i} className="flex items-center gap-4 pl-3 pr-8 py-3 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-300 group"><div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform"><Layers size={20} strokeWidth={2.5} /></div><div className="flex flex-col gap-0.5"><span className="text-sm font-black text-slate-800 tracking-tight">{ss.subjects?.name}</span>{ss.sub_subjects && (<div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div><span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{ss.sub_subjects.name}</span></div>)}</div></div>))) : (<div className="flex items-center gap-3 px-8 py-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 w-full justify-center"><p className="text-sm font-bold text-slate-400 italic">ยังไม่ได้ระบุสิทธิ์ความรับผิดชอบในรายวิชา</p></div>)}</div>
                                )}
                            </div>
                        </div>
                        <div className="px-6 md:px-12 py-4 md:py-8 bg-slate-50 border-t border-slate-100 shrink-0">
                            {isEditing ?
                                <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-[1.5rem] font-black text-white shadow-2xl shadow-blue-200 transition-all uppercase tracking-[0.2em] text-sm">
                                    <Save size={20} className="mr-3" /> บันทึกข้อมูล
                                </Button> : !data.is_verified ? <div className="flex flex-row gap-4 w-full">
                                    <Button onClick={() => { onApprove(data.id, data.full_name, data.line_user_id); onClose(); }}
                                        className="flex-[3] bg-slate-900 hover:bg-blue-600 h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] text-white shadow-xl transition-all">
                                        ยืนยันการอนุมัติ
                                    </Button>
                                    <Button onClick={() => { onDelete(data.id, data.full_name); onClose(); }} variant="outline"
                                        className="flex-1 h-16 rounded-[1.5rem] text-red-500 border-red-200 bg-white font-black hover:bg-red-50 text-xs uppercase tracking-widest shadow-sm">
                                        ไม่อนุมัติ
                                    </Button>
                                </div>
                                    :
                                    <Button onClick={() => {
                                        onDelete(data.id, data.full_name); onClose();
                                    }} variant="ghost"
                                        className="w-full h-16 rounded-[1.5rem] font-bold text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all text-[11px] uppercase tracking-[0.4em]">
                                        Delete Personnel Profile
                                    </Button>}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// --- 2. Component: SupervisorCard (การ์ดแบบเดิม 100% Layout ขยาย) ---
function SupervisorCard({ data, onClick }: any) {
    const isTeacher = data.role === 'teacher';
    return (
        <div onClick={onClick} className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer p-5 md:p-7 relative flex flex-col h-full">
            <div className="absolute top-7 right-7">
                <span className={`text-[9px] font-black px-3 py-1 rounded-full border shadow-sm uppercase ${isTeacher ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                    {isTeacher ? 'อาจารย์' : 'พี่เลี้ยง'}
                </span>
            </div>
            <div className="flex items-center gap-5 mb-6">
                <div className="w-20 h-20 rounded-[1.8rem] bg-slate-100 overflow-hidden shrink-0 border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                    {data.avatar_url ? <img src={data.avatar_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><User size={28} /></div>}
                </div>
                <div>
                    <h3 className="font-black text-slate-900 text-xl leading-tight truncate">{data.full_name}</h3>
                    <p className="text-emerald-600 text-[11px] font-bold flex items-center gap-1 mt-1">
                        <MessageCircle size={12} fill="currentColor" /> {data.line_display_name || 'no-line'}
                    </p>
                </div>
            </div>
            <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <Phone size={14} className="text-blue-500 shrink-0" />
                            <span className="truncate">{data.phone || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Mail size={14} className="text-rose-500 shrink-0" />
                            <span className="truncate text-[10px] text-slate-400 font-medium">{data.email || '-'}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50"><Hospital size={14} className="text-purple-500" /> {isTeacher ? '-' : (data.training_sites?.site_name || data.site_name || '-')}</div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50"><MapPin size={14} className="text-amber-500" /> {isTeacher ? 'สงขลา' : (data.training_sites?.province || data.province || '-')}</div>
            </div>
            <Button className="w-full bg-slate-900 hover:bg-blue-600 rounded-xl font-black h-12 mt-auto transition-colors shadow-lg shadow-slate-200">ตรวจสอบข้อมูล</Button>
        </div>
    )
}

// --- 3. Component: PersonnelTable (Tooltip + Pagination + Eval Progress) ---
function PersonnelTable({ list, totalItems, itemsPerPage, currentPage, onPageChange, onItemsPerPageChange, onView, onDelete, evalProgressMap, onSendReminder, sendingReminder }: any) {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">บุคลากร</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">วิชาที่รับผิดชอบ</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">จังหวัด / หน่วยงาน</th>
                            {list[0]?.role !== 'teacher' && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ความคืบหน้า</th>}
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">การติดต่อ</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {list.map((item: any) => {
                            const progress = evalProgressMap?.[item.id] || { total: 0, evaluated: 0 }
                            const hasPending = progress.total > 0 && progress.evaluated < progress.total
                            return (
                                <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                                    <td className="px-8 py-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 overflow-hidden border-2 border-white shadow-sm shrink-0">{item.avatar_url ? <img src={item.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><User size={20} /></div>}</div><div><div className="font-black text-slate-800 text-sm leading-tight">{item.full_name}</div><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.role === 'teacher' ? 'อาจารย์' : 'พี่เลี้ยง'}</div></div></div></td>
                                    <td className="px-6 py-5"><div className="flex flex-wrap gap-1.5 max-w-[250px]">{item.supervisor_subjects && item.supervisor_subjects.length > 0 ? item.supervisor_subjects.map((ss: any, i: number) => (<div key={i} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black border border-blue-100/50 flex items-center gap-1"><Layers size={10} strokeWidth={3} />{ss.subjects?.name} {ss.sub_subjects ? `(${ss.sub_subjects.name})` : ''}</div>)) : <span className="text-[10px] font-bold text-slate-300 italic">ไม่ได้ระบุวิชา</span>}</div></td>
                                    <td className="px-6 py-5"><div className="text-sm font-bold text-slate-700 leading-tight">{item.training_sites?.site_name || 'คณะการแพทย์แผนไทย'}</div><div className="text-[10px] font-bold text-slate-400 truncate max-w-[180px] mt-0.5">{item.training_sites?.province || item.province || 'สงขลา'}</div></td>
                                    {item.role !== 'teacher' && (
                                        <td className="px-6 py-5">
                                            <EvaluationProgressBar evaluated={progress.evaluated} total={progress.total} />
                                        </td>
                                    )}
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <Phone size={12} className="text-blue-400 shrink-0" />
                                                <span className="text-xs font-bold font-mono">{item.phone || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Mail size={12} className="text-rose-400 shrink-0" />
                                                <span className="text-[10px] font-bold truncate max-w-[150px]">{item.email || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <TooltipProvider delayDuration={200}>
                                                {hasPending && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={(e) => { e.stopPropagation(); onSendReminder(item); }}
                                                                disabled={sendingReminder === item.id}
                                                                className="h-10 w-10 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all"
                                                            >
                                                                {sendingReminder === item.id ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="bg-amber-500 text-white border-none text-xs font-bold rounded-lg px-3 py-1.5"><p>ส่ง LINE แจ้งเตือน</p></TooltipContent>
                                                    </Tooltip>
                                                )}

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => onView(item)} className="h-10 w-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                                                            <Edit2 size={16} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-slate-900 text-white border-none text-xs font-bold rounded-lg px-3 py-1.5"><p>แก้ไขข้อมูล</p></TooltipContent>
                                                </Tooltip>

                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id, item.full_name)} className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-red-500 text-white border-none text-xs font-bold rounded-lg px-3 py-1.5"><p>ลบบัญชีผู้ใช้</p></TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {list.length === 0 && (
                <div className="py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200"><Users size={32} /></div>
                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">ไม่พบข้อมูลในหมวดนี้</p>
                </div>
            )}

            {/* Pagination Footer */}
            <div className="mt-auto">
                <PaginationFooter
                    currentPage={currentPage}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={onPageChange}
                    onItemsPerPageChange={onItemsPerPageChange}
                />
            </div>
        </div>
    )
}

// --- 4. Main Admin Page Component (No Pagination for Pending Tab) ---
export default function AdminManagement() {
    const [allSupervisors, setAllSupervisors] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([])
    const [sites, setSites] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null)
    const [subSubjects, setSubSubjects] = useState<any[]>([])
    const [evalProgressMap, setEvalProgressMap] = useState<Record<string, { total: number; evaluated: number }>>({})
    const [sendingReminder, setSendingReminder] = useState<string | null>(null)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [activeTab, setActiveTab] = useState('pending')
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)

    // เก็บ supabase client ไว้สำหรับ Realtime subscription เท่านั้น
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    useEffect(() => {
        fetchData()

        const handleRealtime = () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            debounceTimer.current = setTimeout(() => {
                fetchData(true); // Silent update
            }, 1500)
        }

        const personnelChannel = supabase.channel('personnel-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'supervisors'
            }, (payload) => {
                handleRealtime(); // รีโหลดข้อมูลใหม่แบบเงียบๆ
                if (payload.eventType === 'INSERT') {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'info',
                        title: `มีผู้สมัครใหม่: คุณ ${payload.new.full_name}`,
                        showConfirmButton: false,
                        timer: 3000
                    })
                }
            })
            .subscribe()

        // ช่องสัญญาณที่ 2: ดักจับการประเมิน (เพื่ออัปเดตความคืบหน้า Realtime)
        const progressChannel = supabase.channel('progress-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'assignment_supervisors' // ตารางที่คุณใช้คำนวณ Progress
            }, () => {
                handleRealtime();
            })
            .subscribe()

        return () => {
            supabase.removeChannel(personnelChannel)
            supabase.removeChannel(progressChannel)
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        }
    }, [])

    const fetchData = async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const res = await fetch('/api/admin/supervisors')
            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            const { supervisors, subjects: subs, subSubjects: sSubs, sites: sits, evalProgressMap: progressMap } = result.data

            setAllSupervisors(supervisors || [])
            setSubjects(subs || [])
            setSubSubjects(sSubs || [])
            setSites(sits || [])
            setEvalProgressMap(progressMap || {})
        } catch (error: any) {
            Swal.fire('Error', error.message || 'ไม่สามารถดึงข้อมูลได้', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (updatedData: any) => {
        try {
            const res = await fetch('/api/admin/supervisors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update', id: updatedData.id, full_name: updatedData.full_name, phone: updatedData.phone, email: updatedData.email, province: updatedData.province, site_id: updatedData.site_id, group_type: updatedData.group_type })
            })
            const result = await res.json()
            if (!result.success) throw new Error(result.error)
            Swal.fire({ icon: 'success', title: 'อัปเดตข้อมูลแล้ว', timer: 1500, showConfirmButton: false }); fetchData(); setSelectedPersonnel(null);
        } catch (error: any) { Swal.fire('Error', error.message || 'ไม่สามารถอัปเดตได้', 'error') }
    }

    const handleApprove = async (id: string, name: string) => {
        const lineUserId = selectedPersonnel?.line_user_id;
        const { isConfirmed } = await Swal.fire({
            title: 'ยืนยันการอนุมัติสิทธิ์?',
            html: `คุณกำลังจะอนุมัติสิทธิ์การเข้าใช้งานให้คุณ <b>"${name}"</b>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ยืนยันการอนุมัติ',
            cancelButtonText: 'ยกเลิก',
            // heightAuto: false, // ป้องกันการคำนวณความสูงหน้าจอผิดพลาดเมื่อมี Modal ซ้อน
            // returnFocus: false, // ป้องกันการแย่ง Focus กับตัว Dialog เดิม
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        })

        if (isConfirmed) {
            try {
                Swal.showLoading();
                const res = await fetch('/api/admin/supervisors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'approve', id, name, lineUserId })
                })
                const result = await res.json()
                if (!result.success) throw new Error(result.error)

                fetchData();
                Swal.fire({ icon: 'success', title: 'อนุมัติเรียบร้อย', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[2.5rem]' } })
            } catch (error: any) {
                Swal.fire('Error', error.message || 'ไม่สามารถอนุมัติได้', 'error')
            }
        }
    }

    const handleDelete = async (id: string, name: string) => {
        const { isConfirmed } = await Swal.fire({ title: 'ยืนยันการลบ?', html: `คุณกำลังจะลบ <b>"${name}"</b> ออกจากระบบ`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#94a3b8', confirmButtonText: 'ยืนยันการลบ', cancelButtonText: 'ยกเลิก', customClass: { popup: 'rounded-[2.5rem] font-sans p-10', confirmButton: 'rounded-full px-10 py-3 font-bold order-1', cancelButton: 'rounded-full px-10 py-3 font-bold order-2' } })
        if (isConfirmed) {
            try {
                const res = await fetch('/api/admin/supervisors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id })
                })
                const result = await res.json()
                if (!result.success) throw new Error(result.error)
                fetchData(); Swal.fire({ icon: 'success', title: 'ลบข้อมูลสำเร็จ', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[2.5rem] font-sans' } })
            } catch (error: any) { Swal.fire('Error', error.message || 'ไม่สามารถลบได้', 'error') }
        }
    }

    // --- ส่ง LINE แจ้งเตือนการประเมินค้าง (ผ่าน API Route) ---
    const handleSendReminder = async (supervisor: any) => {
        const progress = evalProgressMap[supervisor.id]
        if (!progress || progress.evaluated >= progress.total) return

        if (!supervisor.line_user_id) {
            Swal.fire({
                icon: 'warning',
                title: 'ไม่พบ LINE User ID',
                text: `${supervisor.full_name} ยังไม่ได้เชื่อมต่อ LINE`,
                timer: 2500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[2.5rem] font-sans p-8' }
            })
            return
        }

        const pending = progress.total - progress.evaluated
        const { isConfirmed } = await Swal.fire({
            title: 'ส่งแจ้งเตือนผ่าน LINE?',
            html: `ส่งการแจ้งเตือนไปยัง <b>"${supervisor.full_name}"</b><br/>ค้างประเมินอีก <b>${pending}</b> รายการ`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d97706',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ส่งแจ้งเตือน',
            cancelButtonText: 'ยกเลิก',
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold',
                cancelButton: 'rounded-full px-10 py-3 font-bold'
            }
        })

        if (isConfirmed) {
            setSendingReminder(supervisor.id)
            try {
                const res = await fetch('/api/admin/supervisors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'send-reminder',
                        lineUserId: supervisor.line_user_id,
                        name: supervisor.full_name,
                        evaluated: progress.evaluated,
                        total: progress.total,
                        pending
                    })
                })
                const result = await res.json()

                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'ส่งแจ้งเตือนสำเร็จ',
                        html: `ส่งแจ้งเตือนไปยัง <b>${supervisor.full_name}</b> ผ่าน LINE เรียบร้อย`,
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-[2.5rem] font-sans p-8' }
                    })
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'ส่งไม่สำเร็จ',
                        text: 'ไม่สามารถส่งข้อความผ่าน LINE ได้ กรุณาลองใหม่อีกครั้ง',
                        customClass: { popup: 'rounded-[2.5rem] font-sans p-8' }
                    })
                }
            } catch (error) {
                console.error('Send Reminder Error:', error)
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด',
                    text: 'เกิดข้อผิดพลาดขณะส่งแจ้งเตือน',
                    customClass: { popup: 'rounded-[2.5rem] font-sans p-8' }
                })
            } finally {
                setSendingReminder(null)
            }
        }
    }

    const filteredData = allSupervisors.filter(s => {
        const searchLower = searchTerm.toLowerCase();
        const basicMatch = s.full_name?.toLowerCase().includes(searchLower) || s.phone?.includes(searchLower) || s.province?.toLowerCase().includes(searchLower) || s.training_sites?.province?.toLowerCase().includes(searchLower);
        const siteMatch = s.training_sites?.site_name?.toLowerCase().includes(searchLower);
        const subjectMatch = s.supervisor_subjects?.some((ss: any) => ss.subjects?.name?.toLowerCase().includes(searchLower) || ss.sub_subjects?.name?.toLowerCase().includes(searchLower));
        return basicMatch || siteMatch || subjectMatch;
    });

    useEffect(() => { setCurrentPage(1) }, [searchTerm, activeTab])

    const getPaginatedList = (list: any[]) => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return list.slice(startIndex, startIndex + itemsPerPage)
    }

    const pendingList = filteredData.filter(s => !s.is_verified)
    const teacherList = filteredData.filter(s => s.is_verified && s.role === 'teacher')
    const supervisorList = filteredData.filter(s => s.is_verified && s.role === 'supervisor')


    // ฟังก์ชัน Export Excel (รองรับทั้งอาจารย์และพี่เลี้ยง)
    const handleExport = () => {
        // เลือกข้อมูลที่จะ Export ตามแท็บที่เปิดอยู่
        let dataToExportRaw = [];
        let fileNamePrefix = "รายชื่อบุคลากร";

        if (activeTab === 'pending') {
            dataToExportRaw = filteredData.filter(s => !s.is_verified);
            fileNamePrefix = "รายชื่อรออนุมัติ";
        } else if (activeTab === 'teachers') {
            dataToExportRaw = filteredData.filter(s => s.is_verified && s.role === 'teacher');
            fileNamePrefix = "รายชื่ออาจารย์";
        } else if (activeTab === 'supervisors') {
            dataToExportRaw = filteredData.filter(s => s.is_verified && s.role === 'supervisor');
            fileNamePrefix = "รายชื่อพี่เลี้ยง";
        } else {
            dataToExportRaw = filteredData; // Fallback
        }

        const dataToExport = dataToExportRaw.map((item: any) => ({
            "ชื่อ-นามสกุล": item.full_name,
            "ตำแหน่ง": item.role === 'teacher' ? 'อาจารย์' : 'พี่เลี้ยง',
            "เบอร์โทรศัพท์": item.phone || '-',
            "จังหวัด": item.training_sites?.province || item.province || '-',
            "หน่วยงาน/โรงพยาบาล": item.training_sites?.site_name || '-',
            "ไลน์ (Display Name)": item.line_display_name || '-',
            "สถานะ": item.is_verified ? 'อนุมัติแล้ว' : 'รออนุมัติ',
            "วิชาที่รับผิดชอบ": item.supervisor_subjects?.map((s: any) =>
                `${s.subjects?.name} ${s.sub_subjects ? `(${s.sub_subjects.name})` : ''}`
            ).join(', ') || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Personnel_List");
        XLSX.writeFile(workbook, `${fileNamePrefix}_${new Date().toLocaleDateString('th-TH')}.xlsx`);
    }
    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 overflow-x-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3 text-slate-900">
                            <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Users size={24} /></div>
                            จัดการบุคลากร
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium text-sm">จัดการสิทธิ์และแก้ไขข้อมูลอาจารย์และพี่เลี้ยง</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                        <div className="relative group flex-1 sm:flex-none">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <Input placeholder="ค้นหาชื่อ, จังหวัด, เบอร์โทร..." className="w-full sm:w-64 h-12 pl-11 pr-4 rounded-xl bg-white border-slate-200 shadow-sm font-medium text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <Button
                            onClick={handleExport}
                            variant="outline"
                            className="h-12 px-5 rounded-xl shadow-sm bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 font-black gap-2 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Download size={20} />
                            <span>Export</span>
                        </Button>

                        <Button onClick={() => fetchData()} variant="outline" className="h-12 w-12 p-0 rounded-xl shadow-sm bg-white border-slate-200 text-slate-500 hover:text-blue-600 transition-all active:scale-95 flex items-center justify-center shrink-0">
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-auto mb-6 md:mb-8 border border-slate-100 flex w-fit ml-auto shadow-sm overflow-x-auto">
                        <TabsTrigger value="pending" className="rounded-xl px-3 md:px-6 py-2 md:py-2.5 data-[state=active]:bg-white font-bold text-xs md:text-sm gap-1 md:gap-2 transition-all whitespace-nowrap flex-1 md:flex-none">รออนุมัติ <span className="bg-orange-500 text-white px-2 py-0.5 rounded-md text-[10px]">{pendingList.length}</span></TabsTrigger>
                        <TabsTrigger value="teachers" className="rounded-xl px-3 md:px-6 py-2 md:py-2.5 data-[state=active]:bg-white font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-1 md:flex-none">อาจารย์คณะ</TabsTrigger>
                        <TabsTrigger value="supervisors" className="rounded-xl px-3 md:px-6 py-2 md:py-2.5 data-[state=active]:bg-white font-bold text-xs md:text-sm transition-all whitespace-nowrap flex-1 md:flex-none">พี่เลี้ยงแหล่งฝึก</TabsTrigger>
                    </TabsList>

                    {/* Tab: รออนุมัติ (Card View - No Pagination) */}
                    <TabsContent value="pending" className="mt-0 focus-visible:ring-0">
                        {loading ? <PersonnelSkeleton viewType="card" /> : (
                            <>
                                {pendingList.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* โชว์ทั้งหมดโดยไม่ผ่าน getPaginatedList */}
                                        {pendingList.map(sup => <SupervisorCard key={sup.id} data={sup} onClick={() => setSelectedPersonnel(sup)} />)}
                                    </div>
                                ) : (
                                    <div className="py-16 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300"><Users size={48} className="mb-3 opacity-20" /><p className="text-xs font-black uppercase tracking-widest text-slate-400">ไม่พบข้อมูล</p></div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="teachers">
                        {loading ? <PersonnelSkeleton viewType="table" /> : (
                            <PersonnelTable
                                list={getPaginatedList(teacherList)}
                                totalItems={teacherList.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                                onView={setSelectedPersonnel}
                                onDelete={handleDelete}
                                evalProgressMap={evalProgressMap}
                                onSendReminder={handleSendReminder}
                                sendingReminder={sendingReminder}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="supervisors">
                        {loading ? <PersonnelSkeleton viewType="table" /> : (
                            <PersonnelTable
                                list={getPaginatedList(supervisorList)}
                                totalItems={supervisorList.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                                onView={setSelectedPersonnel}
                                onDelete={handleDelete}
                                evalProgressMap={evalProgressMap}
                                onSendReminder={handleSendReminder}
                                sendingReminder={sendingReminder}
                            />
                        )}
                    </TabsContent>
                </Tabs>

                <PersonnelDetailModal
                    data={selectedPersonnel}
                    isOpen={!!selectedPersonnel}
                    onClose={() => setSelectedPersonnel(null)}
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    subjects={subjects}
                    fetchData={fetchData}
                    sites={sites}
                    subSubjects={subSubjects}
                />
            </div>
        </AdminLayout>
    )
}
