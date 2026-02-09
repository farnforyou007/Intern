"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    UserCheck, ShieldAlert, MapPin, Phone, Trash2,
    Check, Search, Users, Loader2, RefreshCw,
    MessageCircle, Calendar, User, X, Edit2,
    Save, BookOpen, Building2, Layers, Hospital, Plus
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Swal from 'sweetalert2'
import AdminLayout from '@/components/AdminLayout'

// --- 1. Component: PersonnelDetailModal (ขยายขนาด 5xl และปรับเลย์เอาต์ให้สมดุล) ---
function PersonnelDetailModal({ data, isOpen, onClose, onApprove, onDelete, onUpdate, subjects, sites, subSubjects, supabase, fetchData }: any) {
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState<any>({})

    const [currentSubjects, setCurrentSubjects] = useState<any[]>([])

    const filteredSubSubs = subSubjects?.filter((ss: any) => ss.parent_subject_id === parseInt(editForm.subject_id)) || []

    useEffect(() => {
        if (data) {
            setEditForm({ ...data })
            // ดึงรายการวิชาเดิมมาใส่ใน State
            setCurrentSubjects(data.supervisor_subjects || [])
            setIsEditing(false)
        }
    }, [data, isOpen])

    if (!data) return null;
    const isTeacher = data.role === 'teacher';

    // กรองวิชาย่อยตามวิชาหลักที่เลือก (ในโหมดแก้ไข)
    const availableSubSubs = subSubjects?.filter((ss: any) => ss.parent_subject_id === parseInt(editForm.subject_id)) || [];

    // ฟังก์ชันเพิ่มวิชาลงในรายการ (Client-side)
    const addSubject = () => {
        if (!editForm.subject_id) return;

        const sub = subjects.find((s: any) => s.id === parseInt(editForm.subject_id));
        const subSub = subSubjects.find((ss: any) => ss.id === parseInt(editForm.sub_subject_id));

        // เช็คซ้ำในรายการปัจจุบัน
        const isDuplicate = currentSubjects.some(s =>
            s.subject_id === parseInt(editForm.subject_id) &&
            s.sub_subject_id === (editForm.sub_subject_id ? parseInt(editForm.sub_subject_id) : null)
        );

        if (isDuplicate) {
            return Swal.fire({ icon: 'warning', title: 'รายวิชาซ้ำ', text: 'คุณได้เพิ่มวิชานี้ไปแล้ว', timer: 1500, showConfirmButton: false });
        }

        const newEntry = {
            subject_id: parseInt(editForm.subject_id),
            sub_subject_id: editForm.sub_subject_id ? parseInt(editForm.sub_subject_id) : null,
            subjects: { name: sub?.name },
            sub_subjects: { name: subSub?.name }
        };

        setCurrentSubjects([...currentSubjects, newEntry]);
        setEditForm({ ...editForm, subject_id: '', sub_subject_id: '' }); // ล้างค่าหลังเพิ่ม
    }

    const removeSubject = (index: number) => {
        setCurrentSubjects(currentSubjects.filter((_, i) => i !== index));
    }

    // ฟังก์ชัน Save ที่อัปเดตทั้งตารางหลักและตารางกลาง
    const handleSave = async () => {
        try {
            // 1. ล้างและบันทึกวิชาใหม่ลงตารางกลาง
            await supabase.from('supervisor_subjects').delete().eq('supervisor_id', data.id);

            if (currentSubjects.length > 0) {
                const records = currentSubjects.map(s => ({
                    supervisor_id: data.id,
                    subject_id: s.subject_id,
                    sub_subject_id: s.sub_subject_id
                }));
                await supabase.from('supervisor_subjects').insert(records);
            }

            // 2. ปิดโหมดแก้ไขและ Modal ก่อนแจ้งเตือน
            setIsEditing(false);
            onClose();

            // 3. แจ้งเตือนสำเร็จ
            Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ',
                timer: 1500,
                showConfirmButton: false,
                position: 'center',
                customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
            });

            // 4. รีโหลดข้อมูลใหม่
            fetchData();

        } catch (error: any) {
            Swal.fire('Error', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
        }
    }


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* ปรับ Max-width ให้กว้างขึ้นเพื่อรองรับเลย์เอาต์ใหม่ */}
            <DialogContent className="max-w-[95vw] lg:max-w-[1200] 2xl:max-w-[900] w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white focus:outline-none">
                <DialogHeader className="sr-only">
                    <DialogTitle>Personnel Details: {data.full_name}</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col md:flex-row h-full min-h-[750px] max-h-[92vh]">

                    {/* --- ฝั่งซ้าย: Profile Sidebar (ขยายให้กว้างขึ้นเป็น 30-35%) --- */}
                    <div className="md:w-[32%] lg:w-[30%] bg-slate-950 relative flex flex-col border-r border-slate-800">
                        {/* ส่วนรูปภาพขยายใหญ่ */}
                        <div className="relative h-[450px] md:h-[55%] w-full overflow-hidden">
                            {data.avatar_url ? (
                                <img src={data.avatar_url} className="w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105" alt={data.full_name} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-700">
                                    <User size={160} strokeWidth={0.5} />
                                </div>
                            )}
                            {/* Gradient overlay ให้ชื่อดูเด่นขึ้น */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                        </div>

                        {/* ส่วนชื่อและสถานะด้านล่างรูป */}
                        <div className="p-10 flex-1 flex flex-col justify-start -mt-20 relative z-10">
                            <span className={`inline-block w-fit px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-xl border ${isTeacher ? 'bg-purple-600 text-white border-purple-400' : 'bg-blue-600 text-white border-blue-400'}`}>
                                {isTeacher ? 'Faculty Staff' : 'Instructor'}
                            </span>
                            <h2 className="text-2xl font-black text-white leading-[1.1] tracking-tight mb-4">{data.full_name}</h2>

                            <div className="flex items-center gap-3 text-blue-400 font-bold">
                                <MessageCircle size={18} fill="currentColor" className="opacity-80" />
                                <span className="text-sm tracking-wide">{data.line_display_name || 'No LINE display'}</span>
                            </div>
                        </div>
                    </div>

                    {/* --- ฝั่งขวา: Main Content Area --- */}
                    <div className="flex-1 bg-white flex flex-col overflow-hidden">

                        {/* Top Toolbar */}
                        <div className="px-12 py-8 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-sm">
                            <div className="space-y-1">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Professional Information</h3>
                                <div className="h-1 w-10 bg-blue-500 rounded-full" />
                            </div>

                            <Button
                                variant="ghost"
                                onClick={() => setIsEditing(!isEditing)}
                                className={`rounded-2xl px-6 h-12 transition-all text-xs font-black tracking-[0.1em] ${isEditing ? "text-red-500 bg-red-50" : "text-blue-600 bg-blue-50 hover:bg-blue-100"}`}
                            >
                                {isEditing ? <X size={18} className="mr-2" /> : <Edit2 size={18} className="mr-2" />}
                                {isEditing ? "ยกเลิก" : "แก้ไขข้อมูล"}
                            </Button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 p-12 overflow-y-auto custom-scrollbar space-y-12">

                            {/* แถวที่ 1: ข้อมูลหลักเรียงตามที่คุณต้องการ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* เบอร์โทรศัพท์ */}
                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Phone size={14} className="text-blue-500" /> เบอร์โทรศัพท์
                                    </label>
                                    {isEditing ? (
                                        <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none text-base font-bold shadow-inner" />
                                    ) : (
                                        <p className="text-xl font-black text-slate-800 tracking-tight">{data.phone || '-'}</p>
                                    )}
                                </div>

                                {/* จังหวัด */}
                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={14} className="text-orange-500" /> จังหวัด
                                    </label>
                                    <p className="text-xl font-black text-slate-800 tracking-tight">
                                        {isTeacher ? 'สงขลา' : (data.training_sites?.province || data.province || '-')}
                                    </p>
                                </div>

                                {/* ชื่อหน่วยงาน/รพ. */}
                                <div className="space-y-3">
                                    <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Building2 size={14} className="text-indigo-500 " /> ชื่อโรงพยาบาล/หน่วยงาน
                                    </label>
                                    <div className="min-h-[3.5rem] flex items-center px-5 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                                        <p className="text-xl lg:text-base font-bold text-slate-700 leading-tight">
                                            {isTeacher ? 'คณะการแพทย์แผนไทย มหาวิทยาลัยสงขลานครินทร์' : (data.training_sites?.site_name || '-')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 pt-10 border-t border-slate-100">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <BookOpen size={16} className="text-emerald-500" />
                                    </div>
                                    รายวิชาที่รับผิดชอบ
                                </label>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        {/* 1. แสดงรายการวิชาที่มีอยู่ (Compact Badges) */}
                                        <div className="flex flex-wrap gap-2">
                                            {currentSubjects.map((ss: any, i: number) => (
                                                <div key={i} className="flex items-center gap-3 pl-3 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-2xl group">
                                                    <span className="text-xs font-bold text-slate-700">
                                                        {ss.subjects?.name} {ss.sub_subjects?.name ? `(${ss.sub_subjects.name})` : ''}
                                                    </span>
                                                    <button
                                                        onClick={() => removeSubject(i)}
                                                        className="w-8 h-8 rounded-xl bg-white text-red-400 hover:bg-red-50 flex items-center justify-center transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* 2. ส่วนเพิ่มวิชาแบบ Single Row & Intelligent Dropdown */}
                                        <div className="flex flex-row items-center gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                                            <select
                                                className="flex-1 h-10 rounded-xl bg-white px-3 text-[11px] font-bold border-none shadow-sm outline-none ring-1 ring-slate-200"
                                                value={editForm.subject_id}
                                                onChange={(e) => setEditForm({ ...editForm, subject_id: e.target.value, sub_subject_id: '' })}
                                            >
                                                <option value="">เลือกวิชาหลัก...</option>
                                                {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>

                                            {/* แสดงวิชาย่อยเฉพาะเมื่อมีข้อมูลเท่านั้น */}
                                            {filteredSubSubs.length > 0 && (
                                                <select
                                                    className="flex-1 h-10 rounded-xl bg-blue-50 px-3 text-[11px] font-bold border-none shadow-sm text-blue-700 outline-none ring-1 ring-blue-100 animate-in slide-in-from-left-2"
                                                    value={editForm.sub_subject_id}
                                                    onChange={(e) => setEditForm({ ...editForm, sub_subject_id: e.target.value })}
                                                >
                                                    <option value="">เลือกวิชาย่อย...</option>
                                                    {filteredSubSubs.map((ss: any) => <option key={ss.id} value={ss.id}>{ss.name}</option>)}
                                                </select>
                                            )}

                                            <Button
                                                onClick={addSubject}
                                                disabled={!editForm.subject_id}
                                                className="h-10 px-4 bg-slate-900 hover:bg-blue-600 rounded-xl font-black text-[10px] uppercase shadow-md transition-all shrink-0"
                                            >
                                                <Plus size={16} className="mr-1" /> เพิ่ม
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* โหมดแสดงผล: ปรับ Badge ให้กางออกทางกว้าง */
                                    <div className="flex flex-wrap gap-4">
                                        {data.supervisor_subjects && data.supervisor_subjects.length > 0 ? (
                                            data.supervisor_subjects.map((ss: any, i: number) => (
                                                <div key={i} className="flex items-center gap-4 pl-3 pr-8 py-3 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-300 group">
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 group-hover:scale-105 transition-transform">
                                                        <Layers size={20} strokeWidth={2.5} />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-sm font-black text-slate-800 tracking-tight">{ss.subjects?.name}</span>
                                                        {ss.sub_subjects && (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{ss.sub_subjects.name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex items-center gap-3 px-8 py-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 w-full justify-center">
                                                <p className="text-sm font-bold text-slate-400 italic">ยังไม่ได้ระบุสิทธิ์ความรับผิดชอบในรายวิชา</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Buttons (แก้ไขปัญหาปุ่มเบียดด้วยการจัดลำดับความสำคัญ) */}
                        <div className="px-12 py-8 bg-slate-50 border-t border-slate-100">
                            {isEditing ? (
                                <Button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-[1.5rem] font-black text-white shadow-2xl shadow-blue-200 transition-all uppercase tracking-[0.2em] text-sm">
                                    <Save size={20} className="mr-3" /> บันทึกข้อมูล
                                </Button>
                            ) : (
                                !data.is_verified ? (
                                    <div className="flex flex-row gap-4 w-full">
                                        <Button
                                            onClick={() => { onApprove(data.id, data.full_name); onClose(); }}
                                            className="flex-[3] bg-slate-900 hover:bg-blue-600 h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] text-white shadow-xl transition-all"
                                        >
                                            ยืนยันการอนุมัติ
                                        </Button>
                                        <Button
                                            onClick={() => { onDelete(data.id, data.full_name); onClose(); }}
                                            variant="outline"
                                            className="flex-1 h-16 rounded-[1.5rem] text-red-500 border-red-200 bg-white font-black hover:bg-red-50 text-xs uppercase tracking-widest shadow-sm"
                                        >
                                            ไม่อนุมัติ
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => { onDelete(data.id, data.full_name); onClose(); }}
                                        variant="ghost"
                                        className="w-full h-16 rounded-[1.5rem] font-bold text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all text-[11px] uppercase tracking-[0.4em]"
                                    >
                                        Delete Personnel Profile
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// --- 2. Component: SupervisorCard (การ์ดหน้าแรกคงเดิมตามที่คุณต้องการ) ---
function SupervisorCard({ data, onClick }: any) {
    const isTeacher = data.role === 'teacher';
    return (
        <div onClick={onClick} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer p-7 relative flex flex-col h-full">
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
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50"><Phone size={14} className="text-blue-500" /> {data.phone || '-'}</div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50"><Hospital size={14} className="text-purple-500" /> {isTeacher ? '-' : (data.training_sites?.site_name || data.site_name || '-')}</div>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-600 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50"><MapPin size={14} className="text-amber-500" /> {isTeacher ? 'สงขลา' : (data.training_sites?.province || data.province || '-')}</div>
            </div>
            <Button className="w-full bg-slate-900 hover:bg-blue-600 rounded-xl font-black h-12 mt-auto transition-colors shadow-lg shadow-slate-200">ตรวจสอบข้อมูล</Button>
        </div>
    )
}
// --- 3. Component: PersonnelTable (ตารางอนุมัติแล้ว) ---
function PersonnelTable({ list, onView, onDelete }: any) {
    return (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">บุคลากร</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">วิชาที่รับผิดชอบ</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">จังหวัด / หน่วยงาน</th>
                            <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">การติดต่อ</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {list.map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50/40 transition-colors group">
                                {/* ข้อมูลชื่อและโปรไฟล์ */}
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[1.2rem] bg-slate-100 overflow-hidden border-2 border-white shadow-sm shrink-0">
                                            {item.avatar_url ? (
                                                <img src={item.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <User size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-black text-slate-800 text-sm leading-tight">{item.full_name}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                                {item.role === 'teacher' ? 'อาจารย์' : 'พี่เลี้ยง'}
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* วิชาที่รับผิดชอบ (แสดงเป็น Badge เหมือนหน้า Info) */}
                                <td className="px-6 py-5">
                                    <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                                        {item.supervisor_subjects && item.supervisor_subjects.length > 0 ? (
                                            item.supervisor_subjects.map((ss: any, i: number) => (
                                                <div key={i} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black border border-blue-100/50 flex items-center gap-1">
                                                    <Layers size={10} strokeWidth={3} />
                                                    {ss.subjects?.name} {ss.sub_subjects ? `(${ss.sub_subjects.name})` : ''}
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-[10px] font-bold text-slate-300 italic">ไม่ได้ระบุวิชา</span>
                                        )}
                                    </div>
                                </td>

                                {/* จังหวัดและหน่วยงาน */}
                                <td className="px-6 py-5">
                                    <div className="text-sm font-bold text-slate-700 leading-tight">

                                        {item.training_sites?.site_name || 'คณะการแพทย์แผนไทย'}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 truncate max-w-[180px] mt-0.5">
                                        {item.training_sites?.province || item.province || 'สงขลา'}
                                    </div>
                                </td>

                                {/* ข้อมูลการติดต่อ */}
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Phone size={12} className="text-blue-400" />
                                        <span className="text-xs font-bold font-mono">{item.phone || '-'}</span>
                                    </div>
                                </td>

                                {/* ปุ่มจัดการ */}
                                <td className="px-8 py-5 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onView(item)}
                                            className="h-10 w-10 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                        >
                                            <Edit2 size={16} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(item.id, item.full_name)}
                                            className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {list.length === 0 && (
                <div className="py-24 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                        <Users size={32} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">ไม่พบข้อมูลในหมวดนี้</p>
                </div>
            )}
        </div>
    )
}

// --- 4. Main Admin Page Component ---
export default function AdminManagement() {
    const [allSupervisors, setAllSupervisors] = useState<any[]>([])
    const [subjects, setSubjects] = useState<any[]>([])
    const [sites, setSites] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null)
    const [subSubjects, setSubSubjects] = useState<any[]>([])
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    useEffect(() => {
        fetchData()

        // --- เพิ่มระบบ Real-time ตรงนี้ ---
        const channel = supabase
            .channel('admin-personnel-realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT', // ดักจับเฉพาะตอนมีคนสมัครใหม่ (เพิ่มข้อมูลใหม่)
                    schema: 'public',
                    table: 'supervisors'
                },
                (payload) => {
                    // 1. เรียกดึงข้อมูลใหม่มาอัปเดตหน้าจอ
                    fetchData();

                    // 2. แสดง Toast แจ้งเตือนด้วย SweetAlert2 แบบ Toast
                    const Toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 4000,
                        timerProgressBar: true,
                        didOpen: (toast) => {
                            toast.addEventListener('mouseenter', Swal.stopTimer)
                            toast.addEventListener('mouseleave', Swal.resumeTimer)
                        }
                    })

                    Toast.fire({
                        icon: 'info',
                        title: `มีผู้สมัครใหม่: คุณ ${payload.new.full_name}`,
                        text: 'ตรวจสอบข้อมูลในแถบ "รออนุมัติ"'
                    })
                }
            )
            .subscribe()

        // ลบ Channel เมื่อออกจากหน้าจอเพื่อประหยัดทรัพยากร
        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: supervisors } = await supabase
                .from('supervisors')
                .select(`
                *, 
                training_sites:site_id(site_name, province),
                supervisor_subjects(
                    subject_id,
                    sub_subject_id,
                    subjects:subject_id(name),
                    sub_subjects:sub_subject_id(name)
                )
            `) // เพิ่มการดึง supervisor_subjects พร้อม Join subjects และ sub_subjects
                .order('created_at', { ascending: false })

            // 2. ดึงข้อมูล Master Data อื่นๆ มาเก็บไว้
            const { data: subs } = await supabase.from('subjects').select('*').order('name')
            const { data: sSubs } = await supabase.from('sub_subjects').select('*').order('name')
            const { data: sits } = await supabase.from('training_sites').select('*').order('site_name')

            setAllSupervisors(supervisors || [])
            setSubjects(subs || [])
            setSubSubjects(sSubs || []) // เก็บข้อมูลวิชาย่อยลง State
            setSites(sits || [])
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { fetchData() }, [])

    const handleUpdate = async (updatedData: any) => {
        const { error } = await supabase
            .from('supervisors')
            .update({
                full_name: updatedData.full_name,
                phone: updatedData.phone,
                province: updatedData.province,
                site_id: updatedData.site_id,
                group_type: updatedData.group_type
            })
            .eq('id', updatedData.id)

        if (error) {
            Swal.fire('Error', error.message, 'error')
        } else {
            Swal.fire({ icon: 'success', title: 'อัปเดตข้อมูลแล้ว', timer: 1500, showConfirmButton: false })
            fetchData()
            setSelectedPersonnel(null)
        }
    }

    const handleApprove = async (id: string, name: string) => {
        const { isConfirmed } = await Swal.fire({
            title: 'ยืนยันการอนุมัติสิทธิ์?',
            html: `คุณกำลังจะอนุมัติสิทธิ์การเข้าใช้งานให้คุณ <b>"${name}"</b><br/>โปรดตรวจสอบความถูกต้องของข้อมูลก่อนยืนยัน`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ยืนยันการอนุมัติ',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        })

        if (isConfirmed) {
            const { error } = await supabase.from('supervisors').update({ is_verified: true }).eq('id', id)
            if (!error) {
                fetchData();
                Swal.fire({
                    icon: 'success',
                    title: 'อนุมัติเรียบร้อย',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-[2.5rem]' }
                })
            }
        }
    }

    const handleDelete = async (id: string, name: string) => {
        const { isConfirmed } = await Swal.fire({
            title: 'ยืนยันการลบ?',
            html: `คุณกำลังจะลบ <b>"${name}"</b> ออกจากระบบ<br/>ข้อมูลนี้จะหายไปจากระบบทันที`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ยืนยันการลบ',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[2.5rem] font-sans p-10',
                confirmButton: 'rounded-full px-10 py-3 font-bold order-1',
                cancelButton: 'rounded-full px-10 py-3 font-bold order-2'
            }
        })

        if (isConfirmed) {
            const { error } = await supabase.from('supervisors').delete().eq('id', id)
            if (!error) {
                fetchData();
                Swal.fire({
                    icon: 'success',
                    title: 'ลบข้อมูลสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-[2.5rem] font-sans'
                    }
                })
            }
        }
    }

    const filteredData = allSupervisors.filter(s => {
        const searchLower = searchTerm.toLowerCase();

        // 1. ค้นหาจากข้อมูลพื้นฐาน (ชื่อ, เบอร์โทร, จังหวัด)
        const basicMatch =
            s.full_name?.toLowerCase().includes(searchLower) ||
            s.phone?.includes(searchLower) ||
            s.province?.toLowerCase().includes(searchLower) ||
            s.training_sites?.province?.toLowerCase().includes(searchLower);

        // 2. ค้นหาจากชื่อโรงพยาบาล/แหล่งฝึก (เพิ่มส่วนนี้)
        const siteMatch = s.training_sites?.site_name?.toLowerCase().includes(searchLower);

        // 3. ค้นหาจากชื่อวิชาหลักและวิชาย่อย
        const subjectMatch = s.supervisor_subjects?.some((ss: any) =>
            ss.subjects?.name?.toLowerCase().includes(searchLower) ||
            ss.sub_subjects?.name?.toLowerCase().includes(searchLower)
        );

        return basicMatch || siteMatch || subjectMatch;
    });

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto p-6 lg:p-8 space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-8">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100"><Users size={12} /> Personnel Management</div>
                        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">จัดการบุคลากร</h1>
                        <p className="text-slate-400 text-sm font-medium">จัดการสิทธิ์และแก้ไขข้อมูลอาจารย์และพี่เลี้ยง</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <Input placeholder="ค้นหาชื่อ, จังหวัด, เบอร์โทร..." className="w-full md:w-64 h-11 pl-11 pr-4 rounded-xl bg-white border-slate-200 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <Button onClick={fetchData} variant="outline" className="h-11 w-11 rounded-xl shadow-sm bg-white"><RefreshCw className={loading ? 'animate-spin' : ''} size={18} /></Button>
                    </div>
                </div>

                <Tabs defaultValue="pending">
                    <TabsList className="bg-slate-100/50 p-1 rounded-2xl h-auto mb-8 border border-slate-100 inline-flex shadow-sm">
                        <TabsTrigger value="pending" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white font-bold text-sm gap-2 transition-all">รออนุมัติ <span className="bg-orange-500 text-white px-2 py-0.5 rounded-md text-[10px]">{filteredData.filter(s => !s.is_verified).length}</span></TabsTrigger>
                        <TabsTrigger value="teachers" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white font-bold text-sm transition-all">อาจารย์คณะ</TabsTrigger>
                        <TabsTrigger value="supervisors" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-white font-bold text-sm transition-all">พี่เลี้ยงแหล่งฝึก</TabsTrigger>
                    </TabsList>

                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3"><Loader2 className="animate-spin" size={32} /><p className="text-sm font-bold">กำลังโหลดข้อมูล...</p></div>
                    ) : (
                        <>
                            <TabsContent value="pending" className="mt-0 focus-visible:ring-0">
                                {filteredData.filter(s => !s.is_verified).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredData.filter(s => !s.is_verified).map(sup => <SupervisorCard key={sup.id} data={sup} onClick={() => setSelectedPersonnel(sup)} />)}
                                    </div>
                                ) : (
                                    <div className="py-16 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-300"><Users size={48} className="mb-3 opacity-20" /><p className="text-xs font-black uppercase tracking-widest text-slate-400">ไม่พบข้อมูล</p></div>
                                )}
                            </TabsContent>
                            <TabsContent value="teachers"><PersonnelTable list={filteredData.filter(s => s.is_verified && s.role === 'teacher')} onView={setSelectedPersonnel} onDelete={handleDelete} /></TabsContent>
                            <TabsContent value="supervisors"><PersonnelTable list={filteredData.filter(s => s.is_verified && s.role === 'supervisor')} onView={setSelectedPersonnel} onDelete={handleDelete} /></TabsContent>
                        </>
                    )}
                </Tabs>

                <PersonnelDetailModal
                    data={selectedPersonnel}
                    isOpen={!!selectedPersonnel}
                    onClose={() => setSelectedPersonnel(null)}
                    onApprove={handleApprove}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                    subjects={subjects}
                    sites={sites}
                    subSubjects={subSubjects}
                    supabase={supabase}
                    fetchData={fetchData}
                />
            </div>
        </AdminLayout>
    )
}