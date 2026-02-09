// ver2 - Updated with Color-coded Index Circles
"use client"
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import AdminLayout from '@/components/AdminLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Search, Edit2, Trash2, GraduationCap, Save,
    Eye, Phone, Mail, MapPin, UserCircle, X, Hospital,
    Calendar, Loader2, Filter, CheckCircle2, ChevronLeft, ChevronRight, Plus, Camera, ChevronDown, Users, Download
} from "lucide-react"
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// --- Helper สำหรับกำหนดธีมสีตามลำดับผลัด ---
const getRotationTheme = (index: number) => {
    const themes = [
        { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-100' },   // ผลัด 1
        { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-100' }, // ผลัด 2
        { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50', border: 'border-orange-100' }  // ผลัด 3
    ];
    return themes[index % themes.length] || themes[0];
};

export default function StudentManagement() {
    const [students, setStudents] = useState<any[]>([])
    const [sites, setSites] = useState<any[]>([])
    const [mentors, setMentors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    const [selectedRotationFilter, setSelectedRotationFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all')

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: st } = await supabase.from('students').select(`
                *,
                student_assignments (
                    id, rotation_id, site_id,
                    training_sites (site_name, province),
                    rotations (id, name, start_date, end_date),
                    assignment_supervisors (
                        supervisor_id,
                        supervisors (full_name)
                    )
                )
            `).order('student_code', { ascending: true })

            const { data: si } = await supabase.from('training_sites').select('*').order('site_name')
            const { data: me } = await supabase.from('supervisors').select('*')

            setStudents(st || [])
            setSites(si || [])
            setMentors(me || [])
        } catch (err: any) { console.error(err.message) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const getDisplayAssignment = (student: any) => {
        if (!student.student_assignments || student.student_assignments.length === 0) return null;
        if (selectedRotationFilter !== 'all') {
            return student.student_assignments.find((as: any) => String(as.rotation_id) === String(selectedRotationFilter));
        }
        if (searchTerm.trim() !== "") {
            const searchLower = searchTerm.toLowerCase().trim();
            const matchedAsm = student.student_assignments.find((asm: any) =>
                asm.training_sites?.site_name?.toLowerCase().includes(searchLower) ||
                asm.training_sites?.province?.toLowerCase().includes(searchLower)
            );
            if (matchedAsm) return matchedAsm;
        }
        return student.student_assignments[0];
    }

    const filteredStudents = students.filter(s => {
        const searchLower = searchTerm.toLowerCase().trim();
        const matchesBasicInfo = s.student_code?.toLowerCase().includes(searchLower) || s.first_name?.toLowerCase().includes(searchLower) || s.last_name?.toLowerCase().includes(searchLower);
        const matchesAssignments = s.student_assignments?.some((asm: any) => {
            const siteMatch = asm.training_sites?.site_name?.toLowerCase().includes(searchLower) || asm.training_sites?.province?.toLowerCase().includes(searchLower);
            return (selectedRotationFilter !== 'all') ? (siteMatch && String(asm.rotation_id) === String(selectedRotationFilter)) : siteMatch;
        });
        const matchesYear = selectedYearFilter === 'all' || s.student_code?.startsWith(selectedYearFilter);
        const matchesRotation = selectedRotationFilter === 'all' || s.student_assignments?.some((as: any) => String(as.rotation_id) === String(selectedRotationFilter));
        return (matchesBasicInfo || matchesAssignments) && matchesYear && matchesRotation;
    });

    const studentYears = Array.from(new Set(students.map(s => s.student_code?.substring(0, 2)))).filter(year => year).sort((a, b) => b.localeCompare(a));
    const startIndex = (currentPage - 1) * rowsPerPage
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + rowsPerPage)
    const totalPages = Math.ceil(filteredStudents.length / rowsPerPage)
    const uniqueRotations = Array.from(new Map(students.flatMap(s => s.student_assignments?.map((as: any) => as.rotations) || []).filter(r => r !== null).map(r => [r.id, r])).values());

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบข้อมูล?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'ใช่, ลบเลย', customClass: { popup: 'rounded-[2rem]' }
        })
        if (result.isConfirmed) {
            await supabase.from('students').delete().eq('id', id);
            fetchData();
        }
    }

    const handleExportExcel = () => {
        const exportData = filteredStudents.map(s => {
            const row: any = { "รหัสนักศึกษา": s.student_code, "ชื่อ-นามสกุล": `${s.prefix}${s.first_name} ${s.last_name}`, "เบอร์โทร": s.phone || '-', "อีเมล": s.email || '-' };
            for (let i = 0; i < 3; i++) {
                const as = s.student_assignments?.[i];
                row[`ผลัดที่ ${i + 1} สถานที่ฝึก`] = as ? `${as.training_sites?.site_name} (${as.training_sites?.province || ''})` : '-';
            }
            return row;
        });
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students_Report");
        XLSX.writeFile(workbook, `Student_List.xlsx`);
    };

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto pb-20 px-4 font-sans text-slate-800">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6">
                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200"><GraduationCap size={32} className="text-white" /></div>
                        STUDENTS <span className="text-blue-600 tracking-tighter">DATABASES</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-white px-4 h-14 rounded-2xl shadow-xl shadow-slate-100 border border-slate-50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows</span>
                            <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-transparent border-none text-sm font-black text-blue-600 outline-none">
                                {[10, 20, 50, 100].map(val => <option key={val} value={val}>{val}</option>)}
                            </select>
                        </div>
                        <Button onClick={() => handleExportExcel()} variant="outline" className="h-14 px-6 rounded-2xl border-2 border-slate-100 bg-white text-slate-600 font-black hover:bg-emerald-50 hover:text-emerald-600 gap-2"><Download size={20} /> Export</Button>
                        <Button onClick={() => setIsAddModalOpen(true)} className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white font-black shadow-xl gap-3"><Plus size={20} /> เพิ่มนักศึกษา</Button>
                    </div>
                </div>

                <div className="bg-white/50 backdrop-blur-md p-4 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8 flex flex-col xl:flex-row items-center gap-4">
                    <div className="relative w-full xl:w-48">
                        <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select className="w-full h-14 pl-14 pr-10 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm outline-none appearance-none" value={selectedYearFilter} onChange={(e) => { setSelectedYearFilter(e.target.value); setCurrentPage(1); }}>
                            <option value="all">ทุกรุ่นรหัส</option>
                            {studentYears.map(y => <option key={y} value={y}>รหัส {y}</option>)}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    </div>
                    <div className="relative w-full xl:w-64">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select className="w-full h-14 pl-14 pr-10 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm outline-none appearance-none" value={selectedRotationFilter} onChange={(e) => { setSelectedRotationFilter(e.target.value); setCurrentPage(1); }}>
                            <option value="all">แสดงผลัดปัจจุบัน</option>
                            {uniqueRotations.map((r: any) => <option key={r.id} value={r.id}>แสดง: {r.name}</option>)}
                        </select>
                    </div>
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input placeholder="ค้นหาชื่อ รหัส หรือจังหวัดที่ฝึกงาน..." className="w-full h-14 pl-14 pr-6 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm outline-none" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-none">
                                <TableHead className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">นักศึกษา</TableHead>
                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">การติดต่อ</TableHead>
                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">สถานที่ฝึกงาน</TableHead>
                                <TableHead className="text-right px-8 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-300 animate-pulse uppercase tracking-widest">ดึงข้อมูลระบบ...</TableCell></TableRow>
                            ) : paginatedStudents.map((s) => {
                                const assignment = getDisplayAssignment(s);
                                // หา index ของผลัดที่กำลังแสดงเพื่อเอาสี
                                const rotIdx = s.student_assignments?.findIndex((a:any) => a.id === assignment?.id);
                                const theme = getRotationTheme(rotIdx !== -1 ? rotIdx : 0);
                                
                                return (
                                    <TableRow key={s.id} className="hover:bg-blue-50/20 transition-colors border-b border-slate-50">
                                        <TableCell className="px-8 py-5">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex items-center justify-center text-blue-600 shrink-0">
                                                    {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" /> : <UserCircle className="text-slate-300" size={28} />}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-base leading-tight">{s.prefix}{s.first_name} {s.last_name}</p>
                                                    <p className="text-[11px] font-black text-blue-600 uppercase tracking-tighter mt-1">{s.student_code}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold text-slate-600 flex items-center gap-2"><Phone size={12} className="text-slate-400" /> {s.phone || '-'}</p>
                                                <p className="text-[10px] font-bold text-blue-400 flex items-center gap-2 truncate max-w-[150px]"><Mail size={12} className="text-blue-300" /> {s.email || '-'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {assignment ? (
                                                <div className="flex flex-col gap-1.5 animate-in fade-in duration-300">
                                                    <div className="flex items-center gap-2">
                                                        {/* วงกลมดัชนีสีบอกผลัด */}
                                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm ${theme.bg}`}>
                                                            {rotIdx + 1}
                                                        </div>
                                                        <p className="font-black text-slate-700 text-xs truncate max-w-[160px] flex items-center gap-1.5">
                                                            <Hospital size={12} className={theme.text} /> {assignment.training_sites?.site_name}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-slate-400 ml-7">
                                                        <MapPin size={10} />
                                                        <p className="text-[10px] font-bold uppercase tracking-tight">{assignment.training_sites?.province}</p>
                                                    </div>
                                                </div>
                                            ) : <span className="text-slate-200 italic text-[10px] font-bold uppercase ml-7">ยังไม่มอบหมาย</span>}
                                        </TableCell>
                                        <TableCell className="text-right px-8">
                                            <div className="flex justify-end gap-2">
                                                <Button onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Eye size={18} /></Button>
                                                <Button onClick={() => handleDelete(s.id)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-between items-center px-6">
                    <p className="text-xs font-bold text-slate-400">Showing {startIndex + 1} - {Math.min(startIndex + rowsPerPage, filteredStudents.length)} of {filteredStudents.length}</p>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="w-10 h-10 rounded-xl bg-white shadow-md text-slate-400"><ChevronLeft size={18} /></Button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <Button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-xl font-black text-xs ${currentPage === page ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>{page}</Button>
                            ))}
                        </div>
                        <Button variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="w-10 h-10 rounded-xl bg-white shadow-md text-slate-400"><ChevronRight size={18} /></Button>
                    </div>
                </div>
            </div>

            <StudentDetailModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedStudent(null); }} data={selectedStudent} sites={sites} mentors={mentors} fetchData={fetchData} />
            <StudentAddModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} sites={sites} mentors={mentors} fetchData={fetchData} />
        </AdminLayout>
    )
}

// --- Combined Modal (Detail & Edit) ---
function StudentDetailModal({ isOpen, onClose, data, sites, mentors, fetchData }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [siteSearch, setSiteSearch] = useState("");
    const [activeEditIdx, setActiveEditIdx] = useState<number | null>(null);

    useEffect(() => {
        if (data && isOpen) {
            const fmt = data.student_assignments?.map((as: any) => ({ ...as, supervisor_ids: as.assignment_supervisors?.map((sv: any) => sv.supervisor_id) || [] })) || [];
            setForm({ ...data, student_assignments: fmt });
            setIsEditing(false); setSiteSearch(""); setActiveEditIdx(null);
        }
    }, [data, isOpen]);

    if (!isOpen || !form) return null;

    const handleSave = async () => {
        setLoading(true);
        try {
            await supabase.from('students').update({ first_name: form.first_name, last_name: form.last_name, phone: form.phone, email: form.email }).eq('id', form.id);
            for (const asm of form.student_assignments) {
                await supabase.from('student_assignments').update({ site_id: asm.site_id }).eq('id', asm.id);
                await supabase.from('assignment_supervisors').delete().eq('assignment_id', asm.id);
                if (asm.supervisor_ids.length > 0) {
                    await supabase.from('assignment_supervisors').insert(asm.supervisor_ids.map((id: number) => ({ assignment_id: asm.id, supervisor_id: id })));
                }
            }
            Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[2rem] font-sans shadow-2xl' } });
            fetchData(); setIsEditing(false);
        } catch (e: any) { Swal.fire('Error', 'ผิดพลาด', 'error'); }
        finally { setLoading(false); }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] lg:max-w-[1100px] w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white focus:outline-none [&>button]:hidden">
                <DialogHeader className="sr-only"><DialogTitle>Profile {form.first_name}</DialogTitle></DialogHeader>
                <div className="flex flex-col md:flex-row h-full min-h-[700px] max-h-[92vh]">
                    <div className="md:w-[35%] bg-slate-950 relative flex flex-col border-r border-slate-800 shrink-0 p-10">
                        <div className="relative w-full aspect-square rounded-[3rem] overflow-hidden mb-10 shadow-2xl border-4 border-slate-900">
                            {form.avatar_url ? <img src={form.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-900 flex items-center justify-center"><UserCircle size={100} className="text-slate-800" /></div>}
                        </div>
                        <span className="inline-block w-fit px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4 bg-blue-600 text-white">ID: {form.student_code}</span>
                        <h2 className="text-2xl font-black text-white leading-tight uppercase mb-8">{form.prefix}{form.first_name} <br /> {form.last_name}</h2>
                        <div className="space-y-4 text-blue-400 font-bold font-mono text-sm">
                            <div className="flex items-center gap-3"><Mail size={16} /><span className="truncate">{form.email || 'No email'}</span></div>
                            <div className="flex items-center gap-3"><Phone size={16} /><span>{form.phone || 'No phone'}</span></div>
                        </div>
                    </div>

                    <div className="flex-1 bg-white flex flex-col overflow-hidden text-slate-800">
                        <div className="px-10 py-6 border-b border-slate-50 flex justify-between items-center bg-white/80 backdrop-blur-sm sticky top-0 z-20 shrink-0">
                            <div className="space-y-1"><h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">{isEditing ? 'Editing Mode' : 'Internship History'}</h3><div className="h-1 w-10 bg-blue-500 rounded-full" /></div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setIsEditing(!isEditing)} className={`rounded-2xl px-6 h-12 transition-all font-black text-xs ${isEditing ? "text-red-500 bg-red-50" : "text-blue-600 bg-blue-50 hover:bg-blue-100"}`}>{isEditing ? <><X size={18} className="mr-2" /> ยกเลิก</> : <><Edit2 size={18} className="mr-2" /> แก้ไขข้อมูล</>}</Button>
                                <Button onClick={onClose} variant="ghost" className="rounded-full w-12 h-12 p-0 hover:bg-slate-50"><X size={20} className="text-slate-400" /></Button>
                            </div>
                        </div>

                        <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-10">
                            {isEditing && (
                                <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 animate-in fade-in slide-in-from-top-4 duration-300 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">ชื่อ</label><Input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} className="h-12 rounded-xl bg-white border-none font-bold shadow-sm" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">นามสกุล</label><Input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} className="h-12 rounded-xl bg-white border-none font-bold shadow-sm" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="h-12 rounded-xl bg-white border-none font-bold shadow-sm" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">อีเมล</label><Input value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="h-12 rounded-xl bg-white border-none font-bold shadow-sm" /></div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3"><div className="p-2 bg-blue-50 rounded-xl"><Hospital size={16} className="text-blue-500" /></div> สถานที่การฝึกงาน</label>
                                <div className="space-y-4">
                                    {form.student_assignments?.map((asm: any, idx: number) => {
                                        const theme = getRotationTheme(idx);
                                        const currentSite = sites.find(s => String(s.id) === String(asm.site_id));
                                        return (
                                            <div key={asm.id} className={`p-8 rounded-[2.5rem] border transition-all ${isEditing ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                                                <div className="flex flex-col lg:flex-row gap-8">
                                                    <div className="flex items-center gap-4 shrink-0 min-w-[180px]">
                                                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 shadow-lg ${theme.bg}`}><span className="text-[8px] font-black uppercase opacity-50">ผลัดที่</span><span className="text-lg font-black">{idx + 1}</span></div>
                                                        <div><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{asm.rotations?.name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(asm.rotations?.start_date).toLocaleDateString('th-TH')} - {new Date(asm.rotations?.end_date).toLocaleDateString('th-TH')}</p></div>
                                                    </div>

                                                    <div className="flex-1 space-y-6">
                                                        {isEditing ? (
                                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                                <div className="relative group">
                                                                    <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-1 mb-2 block">สถานที่ฝึกงาน</label>
                                                                    <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} /><input type="text" placeholder="พิมพ์ชื่อ รพ. หรือ จังหวัด..." className="w-full h-14 pl-12 pr-10 rounded-2xl bg-white border-2 border-slate-100 font-bold text-sm focus:border-blue-500 transition-all outline-none" value={activeEditIdx === idx ? siteSearch : (currentSite?.site_name || "")} onFocus={() => { setActiveEditIdx(idx); setSiteSearch(""); }} onChange={(e) => setSiteSearch(e.target.value)} />{activeEditIdx === idx && siteSearch !== "" && <button onClick={() => setSiteSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"><X size={14} /></button>}</div>
                                                                    {activeEditIdx === idx && (
                                                                        <div className="absolute left-0 right-0 z-[9999] mt-2 bg-white rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in slide-in-from-top-2" style={{ maxHeight: '250px' }}>
                                                                            <div className="overflow-y-auto max-h-[250px] p-2 custom-scrollbar">{sites.filter(s => s.site_name.toLowerCase().includes(siteSearch.toLowerCase()) || s.province.toLowerCase().includes(siteSearch.toLowerCase())).map(s => (<button key={s.id} onMouseDown={(e) => e.preventDefault()} onClick={() => { const nAsm = [...form.student_assignments]; nAsm[idx].site_id = s.id; nAsm[idx].supervisor_ids = []; setForm({ ...form, student_assignments: nAsm }); setActiveEditIdx(null); setSiteSearch(""); }} className="w-full text-left p-4 hover:bg-blue-50 rounded-xl transition-colors flex justify-between items-center group border-b border-slate-50 last:border-none"><div><p className="font-black text-slate-800 text-xs group-hover:text-blue-600">{s.site_name}</p><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{s.province}</p></div>{String(asm.site_id) === String(s.id) && <CheckCircle2 size={16} className="text-blue-500" />}</button>))}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="space-y-3 pt-2">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">พี่เลี้ยงที่ดูแล (Grid View)</span>
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar p-1">{mentors.filter(m => String(m.site_id) === String(asm.site_id)).map(m => (<button key={m.id} type="button" onClick={() => { const nAsm = [...form.student_assignments]; const ids = [...nAsm[idx].supervisor_ids]; const i = ids.indexOf(m.id); i > -1 ? ids.splice(i, 1) : ids.push(m.id); nAsm[idx].supervisor_ids = ids; setForm({ ...form, student_assignments: nAsm }); }} className={`px-3 py-2 rounded-xl text-[10px] font-black border-2 transition-all truncate text-center ${asm.supervisor_ids.includes(m.id) ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}>{m.full_name}</button>))}</div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-4 animate-in fade-in duration-500">
                                                                <div><p className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">{currentSite?.site_name || 'ยังไม่ได้มอบหมาย'}</p><p className="text-xs font-bold text-blue-500 flex items-center gap-1.5 mt-2 uppercase tracking-widest"><MapPin size={14} /> {currentSite?.province || '-'}</p></div>
                                                                <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">{asm.assignment_supervisors?.length > 0 ? asm.assignment_supervisors.map((sv: any, i: number) => (<div key={i} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold border border-slate-100 flex items-center gap-2 font-mono italic"><div className={`w-1.5 h-1.5 rounded-full ${theme.bg}`} /> {sv.supervisors?.full_name}</div>)) : <span className="text-[10px] text-slate-300 italic font-bold uppercase tracking-widest">ไม่มีข้อมูลพี่เลี้ยง</span>}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {isEditing && (
                            <div className="p-8 bg-slate-50 border-t border-slate-100 animate-in slide-in-from-bottom-6 shrink-0"><Button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-20 rounded-[2rem] font-black text-white shadow-2xl transition-all uppercase tracking-[0.2em] text-lg active:scale-95 flex items-center justify-center gap-3">{loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />} บันทึกแผนการฝึกงาน</Button></div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// --- Student Add Modal (Manual Add) ---
function StudentAddModal({ isOpen, onClose, sites, mentors, fetchData }: any) {
    const [loading, setLoading] = useState(false);
    const [siteSearch, setSiteSearch] = useState("");
    const [activeEditIdx, setActiveEditIdx] = useState<number | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [form, setForm] = useState<any>({ student_code: '', prefix: 'นางสาว', first_name: '', last_name: '', phone: '', email: '', assignments: [] });

    useEffect(() => {
        if (isOpen) {
            const init = async () => {
                const { data } = await supabase.from('rotations').select('*').order('round_number', { ascending: true }).limit(3);
                if (data) setForm({ student_code: '', prefix: 'นางสาว', first_name: '', last_name: '', phone: '', email: '', assignments: data.map(r => ({ rotation_id: r.id, rotation_name: r.name, site_id: "", site_name: "", supervisor_ids: [] })) });
            };
            init(); setSiteSearch(""); setActiveEditIdx(null); setAvatarPreview(null);
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!form.student_code || !form.first_name) return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกรหัสและชื่อนักศึกษา', 'warning');
        setLoading(true);
        try {
            let publicUrl = null;
            if (avatarFile) {
                const fileName = `${form.student_code}_${Date.now()}.${avatarFile.name.split('.').pop()}`;
                await supabase.storage.from('avatars').upload(fileName, avatarFile);
                publicUrl = supabase.storage.from('avatars').getPublicUrl(fileName).data.publicUrl;
            }
            const { data: student, error: stError } = await supabase.from('students').insert([{ student_code: form.student_code, prefix: form.prefix, first_name: form.first_name, last_name: form.last_name, phone: form.phone, email: form.email, avatar_url: publicUrl }]).select().single();
            if (stError) throw stError;
            for (const as of form.assignments) {
                if (as.site_id) {
                    const { data: assignment } = await supabase.from('student_assignments').insert([{ student_id: student.id, rotation_id: as.rotation_id, site_id: as.site_id, status: 'active' }]).select().single();
                    if (as.supervisor_ids.length > 0) await supabase.from('assignment_supervisors').insert(as.supervisor_ids.map((sId: any) => ({ assignment_id: assignment.id, supervisor_id: sId })));
                }
            }
            Swal.fire({ icon: 'success', title: 'สำเร็จ', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[2rem] font-sans' } });
            fetchData(); onClose();
        } catch (e: any) { Swal.fire('Error', e.message, 'error'); }
        finally { setLoading(false); }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] lg:max-w-[1200px] w-full p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white focus:outline-none [&>button]:hidden">
                <div className="flex flex-col h-[90vh]">
                    <div className="px-10 py-6 flex justify-between items-center bg-slate-900 text-white shrink-0">
                        <div className="flex items-center gap-4"><div className="bg-blue-600 p-3 rounded-2xl shadow-lg"><Plus size={24} /></div><div><h2 className="text-2xl font-black uppercase tracking-tight">เพิ่มนักศึกษาใหม่</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">จัดการข้อมูลนักศึกษาและแผนการฝึกปฏิบัติงาน</p></div></div>
                        <Button onClick={onClose} variant="ghost" className="text-white hover:bg-slate-800 rounded-full w-10 h-10 p-0"><X size={20} /></Button>
                    </div>
                    <div className="flex-1 flex overflow-hidden">
                        <div className="w-[45%] p-12 overflow-y-auto border-r border-slate-50 space-y-10 bg-white">
                            <div className="flex items-center gap-4"><div className="w-1.5 h-6 bg-blue-600 rounded-full" /><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">ข้อมูลส่วนตัว</h3></div>
                            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 group relative transition-all">
                                {avatarPreview ? <img src={avatarPreview} className="w-40 h-40 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white" /> : <div className="w-40 h-40 rounded-[2.5rem] bg-white flex flex-col items-center justify-center text-slate-300 shadow-sm"><Camera size={48} /><span className="text-[11px] font-black mt-3 uppercase tracking-widest">No Photo</span></div>}
                                <label className="mt-5 px-8 py-2.5 bg-slate-900 rounded-full text-[11px] font-black text-white shadow-xl cursor-pointer hover:bg-blue-600 transition-all uppercase tracking-widest">Upload Photo<input type="file" className="hidden" accept="image/*" onChange={(e: any) => { const file = e.target.files[0]; if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); } }} /></label>
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสนักศึกษา</label><Input value={form.student_code} onChange={e => setForm({ ...form, student_code: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6" placeholder="6XXXXXXX" /></div>
                                <div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อ - นามสกุล</label><div className="flex gap-3"><select className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-4 text-sm w-32 outline-none" value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })}><option>นางสาว</option><option>นาย</option></select><Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base flex-1" placeholder="ชื่อ" /><Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base flex-1" placeholder="นามสกุล" /></div></div>
                                <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label><Input value={form.phone} maxLength={10} onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6" placeholder="0XXXXXXXXX" /></div><div className="space-y-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">อีเมล</label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6" placeholder="example@psu.ac.th" /></div></div>
                            </div>
                        </div>
                        <div className="w-[55%] p-12 bg-slate-50/50 overflow-y-auto space-y-8">
                            <div className="flex items-center gap-4"><div className="w-1.5 h-6 bg-blue-600 rounded-full" /><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">สถานที่ฝึกงาน / พี่เลี้ยง</h3></div>
                            <div className="grid grid-cols-1 gap-6">
                                {form.assignments.map((as: any, idx: number) => {
                                    const theme = getRotationTheme(idx);
                                    return (
                                        <div key={idx} className="p-8 rounded-[3rem] bg-white shadow-xl shadow-slate-200/20 border border-slate-100 space-y-6 transition-all hover:ring-2 ring-blue-500/20">
                                            <div className="flex items-center gap-3"><div className={`w-10 h-10 ${theme.bg} text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md`}>0{idx + 1}</div><span className="text-sm font-black text-slate-800 uppercase tracking-widest">{as.rotation_name}</span></div>
                                            <div className="space-y-5">
                                                <div className="relative group">
                                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input type="text" placeholder="พิมพ์ชื่อ รพ. หรือ จังหวัด..." className={`w-full h-14 pl-14 pr-12 rounded-2xl bg-slate-50 border-none font-bold text-sm outline-none focus:ring-2 ring-blue-500 transition-all ${as.site_id ? theme.text : 'text-slate-600'}`} value={as.site_name || siteSearch} onFocus={() => { if (!as.site_id) setActiveEditIdx(idx); }} onChange={(e) => setSiteSearch(e.target.value)} />
                                                    {as.site_id && <button onClick={() => { const n = [...form.assignments]; n[idx].site_id = ""; n[idx].site_name = ""; n[idx].supervisor_ids = []; setForm({ ...form, assignments: n }); }} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={18} /></button>}
                                                    {activeEditIdx === idx && (
                                                        <div className="absolute z-[9999] w-full mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 max-h-56 overflow-auto animate-in fade-in zoom-in-95">
                                                            {sites.filter((s: any) => s.site_name.toLowerCase().includes(siteSearch.toLowerCase()) || s.province.toLowerCase().includes(siteSearch.toLowerCase())).map((s: any) => (
                                                                <div key={s.id} onClick={() => { const n = [...form.assignments]; n[idx].site_id = s.id; n[idx].site_name = `${s.site_name} (${s.province})`; setForm({ ...form, assignments: n }); setActiveEditIdx(null); setSiteSearch(""); }} className="p-4 hover:bg-blue-50 cursor-pointer rounded-2xl text-sm font-bold text-slate-600 flex justify-between items-center">{s.site_name} <span className={`text-[11px] ${theme.light} ${theme.text} px-3 py-1 rounded-full font-black uppercase`}>{s.province}</span></div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 block">พี่เลี้ยงที่ดูแล</label><div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[120px] pr-1 custom-scrollbar">
                                                    {mentors.filter((m: any) => String(m.site_id) === String(as.site_id)).map((m: any) => (
                                                        <button key={m.id} onClick={() => { const n = [...form.assignments]; const current = n[idx].supervisor_ids; n[idx].supervisor_ids = current.includes(m.id) ? current.filter((id: any) => id !== m.id) : [...current, m.id]; setForm({ ...form, assignments: n }); }} className={`px-4 py-2.5 rounded-2xl text-[10px] font-black border-2 transition-all truncate text-center ${as.supervisor_ids.includes(m.id) ? `${theme.bg} border-transparent text-white shadow-lg` : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'}`}>{m.full_name}</button>
                                                    ))}
                                                </div></div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 border-t bg-white flex justify-end gap-5 shrink-0"><Button onClick={handleSave} disabled={loading} className="h-16 px-14 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl gap-4 shadow-2xl transition-all active:scale-[0.98]">{loading ? <Loader2 className="animate-spin" /> : <Save size={24} />} บันทึกข้อมูลนักศึกษา</Button><Button onClick={onClose} variant="ghost" className="h-16 px-10 rounded-[1.5rem] font-black text-slate-400 uppercase hover:bg-red-50 hover:text-red-600">ยกเลิก</Button></div>
                </div>
            </DialogContent>
        </Dialog>
    );
}