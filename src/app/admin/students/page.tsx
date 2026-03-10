// ver3 — API Routes Migration
"use client"
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr' // เก็บไว้สำหรับ Realtime เท่านั้น
import AdminLayout from '@/components/AdminLayout'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    Search, Edit2, Trash2, GraduationCap, Save,
    Eye, Phone, Mail, MapPin, UserCircle, X, Hospital,
    Calendar, Loader2, Filter, CheckCircle2, ChevronLeft, ChevronRight, Plus, Camera, ChevronDown, Users, Download, Building2
    , BookOpen, Bike, FileText, Upload
} from "lucide-react"
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx'
import { Skeleton } from "@/components/ui/skeleton"
interface Assignment {
    rotation_id: string;
    training_sites?: {
        site_name: string;
        province: string;
    };
    assignment_supervisors?: {
        supervisors?: {
            full_name: string;
        };
    }[];
}

const currentYearBS = (new Date().getFullYear() + 543).toString();

const getRotationTheme = (index: number) => {
    const themes = [
        { bg: 'bg-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-100' },   // ผลัด 1
        { bg: 'bg-purple-600', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-100' }, // ผลัด 2
        { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50', border: 'border-orange-100' }  // ผลัด 3
    ];
    return themes[index % themes.length] || themes[0];
};


export default function StudentManagement() {
    const supabase = useMemo(() => createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ), []);

    const [students, setStudents] = useState<any[]>([])
    const [sites, setSites] = useState<any[]>([])
    const [mentors, setMentors] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')


    // --- Pagination & Filter States ---
    const [selectedRotationFilter, setSelectedRotationFilter] = useState<string>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [totalCount, setTotalCount] = useState(0)
    const [availableRotations, setAvailableRotations] = useState<any[]>([])
    const [availableTracks, setAvailableTracks] = useState<string[]>([])


    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [selectedYearFilter, setSelectedYearFilter] = useState<string>(currentYearBS);
    const [selectedBatchFilter, setSelectedBatchFilter] = useState<string>('all');
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)

    // เพิ่มฟังก์ชันดึงรายการปีที่มีในระบบ (วางไว้ก่อน useEffect)
    const fetchAvailableYears = useCallback(async () => {
        // ย้ายมาดึงพร้อม fetchData แล้ว (API route return availableYears มาให้)
    }, []);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        try {
            const params = new URLSearchParams({
                year: selectedYearFilter,
                batch: selectedBatchFilter === 'all' ? '' : selectedBatchFilter,
                rotationId: selectedRotationFilter === 'all' ? '' : selectedRotationFilter,
                search: searchTerm,
                page: currentPage.toString(),
                limit: rowsPerPage.toString()
            })


            const res = await fetch(`/api/admin/students?${params.toString()}`)
            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            setStudents(result.data.students || [])
            setTotalCount(result.data.totalCount || 0)
            setSites(result.data.sites || [])
            setMentors(result.data.mentors || [])
            setAvailableYears(result.data.availableYears || [])
            setAvailableRotations(result.data.availableRotations || [])
            if (result.data.tracks) setAvailableTracks(result.data.tracks) // Only if returned in GET

        } catch (err: any) {
            console.error("Fetch Data Error:", err.message);
        } finally {
            setLoading(false);
        }
    }, [selectedYearFilter, selectedBatchFilter, selectedRotationFilter, searchTerm, currentPage, rowsPerPage]);




    useEffect(() => {
        fetchAvailableYears();
        fetchData();
    }, [fetchData, fetchAvailableYears]);


    useEffect(() => {
        fetchData()

        const handleRealtime = () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            debounceTimer.current = setTimeout(() => {
                fetchData(true) // Silent update
            }, 1500)
        }

        const channel = supabase
            .channel('student-management-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, handleRealtime)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'student_assignments' }, handleRealtime)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assignment_supervisors' }, handleRealtime)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'training_sites' }, handleRealtime)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'supervisors' }, handleRealtime)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        }
    }, [fetchData])

    // --- แก้ไขฟังก์ชัน getDisplayAssignment ให้แสดงผลัดที่ตรงกับคำค้นหาโดยอัตโนมัติ ---
    // const getDisplayAssignment = (student: any) => {
    //     if (!student.student_assignments || student.student_assignments.length === 0) return null;

    //     // 1. ถ้ามีการเลือกฟิลเตอร์ผลัดเฉพาะเจาะจง (ไม่ใช่ 'all') ให้แสดงตามนั้น
    //     if (selectedRotationFilter !== 'all') {
    //         return student.student_assignments.find((as: any) => String(as.rotation_id) === String(selectedRotationFilter));
    //     }

    //     // 2. ถ้าไม่ได้เลือกผลัด (เป็น 'all') แต่ "มีการพิมพ์ค้นหา"
    //     if (searchTerm.trim() !== "") {
    //         const searchLower = searchTerm?.toLowerCase().trim();
    //         // หาผลัดที่ชื่อ รพ. หรือ จังหวัด ตรงกับที่พิมพ์ค้นหา
    //         const matchedAsm = student.student_assignments.find((asm: any) =>
    //             asm.training_sites?.site_name?.toLowerCase().includes(searchLower) ||
    //             asm.training_sites?.province?.toLowerCase().includes(searchLower)
    //         );
    //         // ถ้าเจอผลัดที่ตรง ให้โชว์ผลัดนั้นเลย (ตารางจะได้เปลี่ยนตามที่ค้นหา)
    //         if (matchedAsm) return matchedAsm;
    //     }

    //     // 3. ถ้าไม่มีการค้นหา หรือค้นหาไม่เจอในผลัด ให้กลับไปโชว์ผลัดแรกเป็นค่าเริ่มต้น
    //     return student.student_assignments[0];
    // }

    const getDisplayAssignment = (student: any) => {
        if (!student.student_assignments || student.student_assignments.length === 0) return null;

        let targetAssignments = student.student_assignments;

        // 1. ถ้าเลือก Filter ผลัด
        if (selectedRotationFilter !== 'all') {
            // คืนค่า "วิชาแรกที่เจอ" ในผลัดที่เลือก
            return targetAssignments.find((as: any) => String(as.rotation_id) === String(selectedRotationFilter));
        }

        // 2. ถ้ามีการค้นหา
        if (searchTerm.trim() !== "") {
            const searchLower = searchTerm.toLowerCase().trim();
            return targetAssignments.find((asm: any) =>
                asm.training_sites?.site_name?.toLowerCase().includes(searchLower) ||
                asm.training_sites?.province?.toLowerCase().includes(searchLower)
            );
        }

        // 3. ค่าเริ่มต้น: คืนค่าวิชาแรกของผลัดแรก
        return targetAssignments[0];
    }

    // --- ส่วน filteredStudents (คงเดิม แต่แนะนำให้ตรวจสอบให้แน่ใจว่าใช้ logic นี้) ---
    // const filteredStudents = students.filter(s => {
    //     const searchLower = searchTerm?.toLowerCase().trim();

    //     // กรองจากข้อมูลพื้นฐาน
    //     const matchesBasicInfo =
    //         s.student_code?.toLowerCase().includes(searchLower) ||
    //         s.first_name?.toLowerCase().includes(searchLower) ||
    //         s.last_name?.toLowerCase().includes(searchLower);

    //     // กรองจากแผนการฝึก (ทุกผลัด)
    //     const matchesAssignments = s.student_assignments?.some((asm: any) => {
    //         const siteMatch = asm.training_sites?.site_name?.toLowerCase().includes(searchLower) ||
    //             asm.training_sites?.province?.toLowerCase().includes(searchLower);

    //         if (selectedRotationFilter !== 'all') {
    //             return siteMatch && String(asm.rotation_id) === String(selectedRotationFilter);
    //         }
    //         return siteMatch;
    //     });

    //     const matchesYear = selectedYearFilter === 'all' || s.student_code?.startsWith(selectedYearFilter);
    //     const matchesRotation = selectedRotationFilter === 'all' ||
    //         s.student_assignments?.some((as: any) => String(as.rotation_id) === String(selectedRotationFilter));

    //     return (matchesBasicInfo || matchesAssignments) && matchesYear && matchesRotation;
    // });

    const filteredStudents = students.filter(s => {
        const searchLower = searchTerm?.toLowerCase().trim();

        const matchesBasicInfo =
            s.student_code?.toLowerCase().includes(searchLower) ||
            s.first_name?.toLowerCase().includes(searchLower) ||
            s.last_name?.toLowerCase().includes(searchLower);

        // ✅ กรองรุ่นรหัส (Batch) จากข้อมูลที่มีอยู่แล้วในเครื่อง
        const matchesBatch = selectedBatchFilter === 'all' || s.student_code?.substring(0, 2) === selectedBatchFilter;

        const matchesRotation = selectedRotationFilter === 'all' ||
            s.student_assignments?.some((as: any) => String(as.rotation_id) === String(selectedRotationFilter));

        return matchesBasicInfo && matchesBatch && matchesRotation;

    });

    // ดึงรุ่นนักศึกษาทั้งหมด (2 ตัวแรกของรหัส) มาสร้างตัวเลือก
    const studentYears = Array.from(
        new Set(students.map(s => s.student_code?.substring(0, 2)))
    ).filter(year => year).sort((a, b) => b.localeCompare(a)); // เรียงจากปีล่าสุดลงไป

    // Pagination logic (Server-side now, so we just calculate total pages)
    const totalPages = Math.ceil(totalCount / rowsPerPage)
    const paginatedStudents = students // Backend already paginated

    const uniqueRotations = Array.from(
        new Map(
            students.flatMap(s => s.student_assignments?.map((as: any) => as.rotations) || [])
                .filter(r => r !== null)
                .map(r => [r.id, r])
        ).values()
    );

    const handleDelete = async (id: number) => {
        // 1. ถามเพื่อยืนยันการลบ (UX/UI Safe Action)
        const result = await Swal.fire({
            title: 'ยืนยันการลบข้อมูล?',
            text: "รายชื่อนักศึกษาและประวัติการฝึกงานทั้งหมดจะถูกลบออกจากระบบและไม่สามารถกู้คืนได้",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444', // สีแดง
            cancelButtonColor: '#64748b', // สี Slate
            confirmButtonText: 'ใช่, ลบข้อมูลเลย',
            cancelButtonText: 'ยกเลิก',
            customClass: {
                popup: 'rounded-[2.5rem]',
                confirmButton: 'rounded-xl px-6 py-3 font-black uppercase text-xs tracking-widest',
                cancelButton: 'rounded-xl px-6 py-3 font-black uppercase text-xs tracking-widest'
            }
        })

        if (result.isConfirmed) {
            try {
                // 2. ดำเนินการลบผ่าน API Route
                const res = await fetch('/api/admin/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id })
                })
                const delResult = await res.json()
                if (!delResult.success) throw new Error(delResult.error)

                // 3. แจ้งเตือนสำเร็จ
                Swal.fire({
                    icon: 'success',
                    title: 'ลบข้อมูลสำเร็จ',
                    text: 'ข้อมูลนักศึกษาถูกนำออกจากระบบแล้ว',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-[2.5rem]' }
                })

                // 4. อัปเดต UI (ดึงข้อมูลใหม่มาโชว์)
                fetchData()

            } catch (error: any) {
                console.error("Delete error:", error.message)
                Swal.fire({
                    icon: 'error',
                    title: 'เกิดข้อผิดพลาด!',
                    text: 'ไม่สามารถลบข้อมูลได้เนื่องจาก: ' + error.message,
                    customClass: { popup: 'rounded-[2.5rem]' }
                })
            }
        }
    }

    // const handleExportExcel = () => {
    //     if (filteredStudents.length === 0) {
    //         return Swal.fire('ไม่พบข้อมูล', 'ไม่มีข้อมูลที่ตรงตามเงื่อนไขเพื่อส่งออก', 'info');
    //     }

    //     const exportData = filteredStudents.map(s => {
    //         const row: any = {
    //             "รหัสนักศึกษา": s.student_code,
    //             "ชื่อ-นามสกุล": `${s.prefix}${s.first_name} ${s.last_name}`,
    //             "เบอร์โทร": s.phone || '-',
    //             "อีเมล": s.email || '-',
    //         };
    //         // จัดกลุ่มตาม rotation_id (หนึ่งผลัดอาจมีหลายวิชา)
    //         const byRot = (s.student_assignments || []).reduce((acc: any, as: any) => {
    //             const rid = as.rotation_id;
    //             if (!acc[rid]) acc[rid] = [];
    //             acc[rid].push(as);
    //             return acc;
    //         }, {});
    //         const rotIds = [...new Set((s.student_assignments || []).map((a: any) => a.rotation_id as string).filter(Boolean))];
    //         for (let i = 0; i < 3; i++) {
    //             const rotId = rotIds[i] as string
    //             const list = byRot[rotId[i]] || [];
    //             const first = list[0];
    //             row[`ผลัดที่ ${i + 1} สถานที่ฝึก`] = first ? `${first.training_sites?.site_name} (${first.training_sites?.province || ''})` : '-';
    //             const names = [...new Set(list.flatMap((a: any) => a.assignment_supervisors?.map((sv: any) => sv.supervisors?.full_name) || []))].filter(Boolean);
    //             row[`ผลัดที่ ${i + 1} พี่เลี้ยง`] = names.join(', ') || '-';
    //         }
    //         return row;
    //     });

    //     const worksheet = XLSX.utils.json_to_sheet(exportData);

    //     // --- กำหนดความกว้างคอลัมน์ (ขนาดเซลล์ใหญ่ขึ้น) ---
    //     const wscols = [
    //         { wch: 15 }, // รหัส
    //         { wch: 25 }, // ชื่อ
    //         { wch: 15 }, // เบอร์
    //         { wch: 30 }, // อีเมล
    //         { wch: 40 }, // ผลัด 1 ที่ฝึก (กว้างพิเศษ)
    //         { wch: 30 }, // ผลัด 1 พี่เลี้ยง
    //         { wch: 40 }, // ผลัด 2 ที่ฝึก
    //         { wch: 30 }, // ผลัด 2 พี่เลี้ยง
    //         { wch: 40 }, // ผลัด 3 ที่ฝึก
    //         { wch: 30 }, // ผลัด 3 พี่เลี้ยง
    //     ];
    //     worksheet['!cols'] = wscols;

    //     const workbook = XLSX.utils.book_new();
    //     XLSX.utils.book_append_sheet(workbook, worksheet, "Students_Report");

    //     const fileName = `Student_List_${selectedYearFilter === 'all' ? 'All' : 'Batch_' + selectedYearFilter}_${new Date().toISOString().split('T')[0]}.xlsx`;
    //     XLSX.writeFile(workbook, fileName);
    // };

    const handleExportExcel = () => {
        if (filteredStudents.length === 0) {
            return Swal.fire('ไม่พบข้อมูล', 'ไม่มีข้อมูลที่ตรงตามเงื่อนไขเพื่อส่งออก', 'info');
        }

        const exportData = filteredStudents.map(s => {
            // 1. ข้อมูลพื้นฐานนักศึกษา
            const row: any = {
                "รหัสนักศึกษา": s.student_code || '-',
                "ชื่อ-นามสกุล": `${s.prefix || ''}${s.first_name || ''} ${s.last_name || ''}`,
                "เบอร์โทร": s.phone || '-',
                "อีเมล": s.email || '-',
            };

            // 2. จัดกลุ่ม Assignments ตาม Rotation (เนื่องจากดึงแบบ Optimized มาแล้ว)
            // เรียงลำดับตามความจริงของผลัดที่นักศึกษาได้รับมอบหมาย
            const sortedAssignments = [...(s.student_assignments || [])].sort((a, b) =>
                (a.rotations?.name || '').localeCompare(b.rotations?.name || '')
            );

            // วนลูปสร้างคอลัมน์ผลัด 1, 2, 3
            for (let i = 0; i < 3; i++) {
                const asm = sortedAssignments[i];
                const colPrefix = `ผลัดที่ ${i + 1}`;

                row[`${colPrefix} สถานที่ฝึก`] = asm?.training_sites?.site_name
                    ? `${asm.training_sites.site_name} (${asm.training_sites.province || ''})`
                    : '-';

                row[`${colPrefix} ช่วงเวลา`] = asm?.rotations
                    ? `${new Date(asm.rotations.start_date).toLocaleDateString('th-TH')} - ${new Date(asm.rotations.end_date).toLocaleDateString('th-TH')}`
                    : '-';

                // ดึงรายชื่อพี่เลี้ยงทุกคนในผลัดนั้นมาต่อกันเป็นข้อความ
                const mentorNames = asm?.assignment_supervisors
                    ?.map((sv: any) => sv.supervisors?.full_name)
                    .filter(Boolean)
                    .join(', ') || '-';

                row[`${colPrefix} พี่เลี้ยง`] = mentorNames;
            }

            return row;
        });

        // --- ส่วนการสร้างไฟล์ Excel (เหมือนเดิม) ---
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const wscols = [
            { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, // ข้อมูลส่วนตัว
            { wch: 35 }, { wch: 25 }, { wch: 25 }, // ผลัด 1
            { wch: 35 }, { wch: 25 }, { wch: 25 }, // ผลัด 2
            { wch: 35 }, { wch: 25 }, { wch: 25 }, // ผลัด 3
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "รายชื่อนักศึกษา");
        XLSX.writeFile(workbook, `Student_Export_${new Date().getTime()}.xlsx`);
    };

    const groupedAssignments = students.flatMap(s =>
        s.student_assignments?.reduce((acc: any, current: any) => {
            const key = current.rotation_id;
            if (!acc[key]) {
                acc[key] = {
                    ...current,
                    student_name: `${s.prefix}${s.first_name} ${s.last_name}`,
                    sub_tasks: [current]
                };
            } else {
                acc[key].sub_tasks.push(current);
            }
            return acc;
        }, {}) || []
    ).map((obj: any) => Object.values(obj)).flat();

    return (
        <AdminLayout>
            <div className="max-w-7xl mx-auto pb-20 px-4 font-sans">

                {/* 1. Header Section - แสดงหัวข้อและปุ่มเพิ่ม */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                            <GraduationCap className="text-blue-600" size={32} /> จัดการข้อมูลนักศึกษา
                        </h1>
                        <p className="text-slate-500 mt-1 font-medium text-sm">จัดการข้อมูลนักศึกษาและแผนการฝึกปฏิบัติงาน</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
                        <Button
                            onClick={() => handleExportExcel()}
                            variant="outline"
                            className="h-12 px-5 rounded-xl border border-slate-200 bg-white text-emerald-600 font-black hover:bg-emerald-50 hover:border-emerald-200 transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shadow-sm"
                        >
                            <Download size={20} />
                            <span>Export Excel</span>
                        </Button>

                        <Button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-black shadow-lg shadow-slate-200 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                        >
                            <Plus size={20} />
                            เพิ่มนักศึกษาใหม่
                        </Button>
                    </div>
                </div>

                {/* 2. Filter Bar Section - แถบเครื่องมือกรองข้อมูล */}
                <div className="bg-white/50 backdrop-blur-md p-4 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
                    <div className="flex flex-col xl:flex-row items-center gap-4">

                        {/* กรองรุ่นรหัส (จากรหัส 2 ตัวหน้า) */}
                        <div className="relative w-full xl:w-64 shrink-0">
                            <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                className="w-full h-14 pl-14 pr-10 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm focus:border-blue-500 focus:ring-0 outline-none appearance-none cursor-pointer text-slate-700 transition-all"
                                value={selectedBatchFilter}
                                onChange={(e) => {
                                    setSelectedBatchFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">ทุกรุ่นรหัส</option>
                                {studentYears.map(year => (
                                    <option key={year} value={year}> รหัส {year}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                        </div>

                        <div className="flex items-center gap-2 bg-white px-4 h-12 rounded-xl border border-slate-200 shadow-sm">
                            <Filter size={16} className="text-slate-400" />
                            <select
                                value={selectedYearFilter}
                                onChange={(e) => setSelectedYearFilter(e.target.value)}
                                className="text-sm font-black text-blue-600 bg-transparent outline-none cursor-pointer"
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>ปีการศึกษา {year}</option>
                                ))}
                            </select>
                        </div>

                        {/* กรองผลัดการฝึก */}
                        <div className="relative w-full xl:w-72 shrink-0">
                            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                className="w-full h-14 pl-14 pr-10 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm focus:border-blue-500 focus:ring-0 outline-none appearance-none cursor-pointer text-slate-700 transition-all"
                                value={selectedRotationFilter}
                                onChange={(e) => {
                                    setSelectedRotationFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">แสดงผลัดปัจจุบัน</option>
                                {availableRotations.map((r: any) => (
                                    <option key={r.id} value={r.id}>แสดง: {r.name} (สาย {r.track || '-'})</option>
                                ))}

                            </select>

                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                        </div>

                        {/* ช่องค้นหาอิสระ */}
                        <div className="relative flex-1 w-full min-w-[300px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                placeholder="ค้นหา ชื่อ-นามสกุล, รหัสนักศึกษา หรือ โรงพยาบาล..."
                                className="w-full h-14 pl-14 pr-6 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm focus:border-blue-500 focus:ring-0 outline-none transition-all placeholder:text-slate-300"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>



                        {/* ปุ่มรีเซ็ต */}
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedYearFilter(currentYearBS);
                                setSelectedRotationFilter('all');
                                setSelectedBatchFilter('all');
                                setCurrentPage(1);
                            }}
                            className="h-14 px-6 rounded-[1.5rem] text-slate-400 hover:text-blue-600 font-bold text-xs uppercase tracking-widest"
                        >
                            Reset
                        </Button>


                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden mb-8">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-none">
                                <TableHead className="px-8 py-7 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">นักศึกษา</TableHead>
                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">การติดต่อ</TableHead>
                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">สถานที่ฝึกงาน</TableHead>
                                <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest">ปีการศึกษา</TableHead>
                                <TableHead className="text-right px-8 font-black text-slate-400 uppercase text-[10px] tracking-widest text-center">จัดการ</TableHead>
                            </TableRow>
                        </TableHeader>


                        <TableBody>
                            {loading ? (
                                // 1. สถานะกำลังโหลด (Skeleton)
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5} className="p-8">
                                            <Skeleton className="h-12 w-full rounded-xl" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : paginatedStudents.length > 0 ? (
                                // 2. สถานะมีข้อมูล: แสดงรายการนักศึกษา
                                paginatedStudents.map((s) => {
                                    const assignment = getDisplayAssignment(s);

                                    // หาผลัดปัจจุบันของนักศึกษานี้ว่าอยู่ลำดับที่เท่าไหร่ในสาย (Track) ของตัวเอง
                                    const currentRot = availableRotations.find((r: any) => r.id === assignment?.rotation_id);
                                    const trackRots = availableRotations.filter((r: any) => r.track === currentRot?.track);
                                    const rotIdx = trackRots.findIndex((r: any) => r.id === assignment?.rotation_id);

                                    const theme = getRotationTheme(rotIdx !== -1 ? rotIdx : 0);

                                    return (
                                        <TableRow key={s.id} className="hover:bg-blue-50/20 transition-colors border-b border-slate-50">
                                            <TableCell className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 overflow-hidden shadow-inner flex items-center justify-center text-blue-600 shrink-0">
                                                        {s.avatar_url ? <img src={s.avatar_url} className="w-full h-full object-cover" alt="" /> : <UserCircle className="text-slate-300" size={28} />}
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
                                                    <p className="text-[10px] font-bold text-slate-400 flex items-center gap-2 truncate max-w-[150px] italic underline decoration-blue-100 text-blue-400"><Mail size={12} className="text-slate-400" /> {s.email || '-'}</p>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {assignment ? (
                                                    <div className="flex flex-col gap-1.5 animate-in fade-in duration-300">
                                                        <div className="flex items-center gap-2">
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
                                            <TableCell>
                                                <div className="space-y-1">

                                                    <div className="flex items-center gap-2">
                                                        {/* Badge แสดงปีการศึกษาที่ฝึกงาน */}
                                                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                                                            {s.training_year || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right px-8">
                                                <div className="flex justify-end gap-2 text-blue-600">
                                                    <Button onClick={() => { setSelectedStudent(s); setIsModalOpen(true); }} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Eye size={18} /></Button>
                                                    <Button onClick={() => { handleDelete(s.id) }} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={18} /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                // ✅ 3. สถานะไม่พบข้อมูล
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center border-none">
                                        <div className="flex flex-col items-center gap-3 text-slate-300 animate-in fade-in duration-500">
                                            <div className="p-5 bg-slate-50 rounded-full">
                                                <Search size={48} strokeWidth={1.5} />
                                            </div>
                                            <p className="font-black uppercase tracking-widest text-[10px]">ไม่พบข้อมูลนักศึกษาที่ตรงตามเงื่อนไข</p>
                                        </div>
                                    </TableCell>
                                </TableRow>

                            )}
                        </TableBody>
                    </Table>
                    <div className="px-8 py-6 bg-slate-50/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">แสดงแถว:</span>
                                <select
                                    value={rowsPerPage}
                                    onChange={(e) => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-white border border-slate-200 rounded-lg text-xs font-black px-2 py-1 outline-none text-slate-600 focus:ring-2 ring-blue-500/20"
                                >
                                    {[10, 20, 50, 100].map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                ทั้งหมด <span className="text-blue-600">{totalCount}</span> รายการ
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="w-10 h-10 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                            >
                                <ChevronLeft size={18} />
                            </Button>

                            <div className="flex items-center gap-1 px-4 py-2 bg-white rounded-xl border border-slate-200">
                                <span className="text-xs font-black text-blue-600">{currentPage}</span>
                                <span className="text-xs font-black text-slate-300">/</span>
                                <span className="text-xs font-black text-slate-400">{totalPages || 1}</span>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="w-10 h-10 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                            >
                                <ChevronRight size={18} />
                            </Button>
                        </div>
                    </div>

                </div>

                {/* Pagination Controls */}

            </div>

            <StudentDetailModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedStudent(null); }}
                data={selectedStudent}
                sites={sites}
                mentors={mentors}
                fetchData={fetchData}
            />

            <StudentAddModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                sites={sites}
                mentors={mentors}
                fetchData={fetchData}
                availableTracks={availableTracks}
            />

        </AdminLayout>
    )
}


function StudentDetailModal({ isOpen, onClose, data, sites, mentors, fetchData }: any) {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [siteSearch, setSiteSearch] = useState("");
    const [activeEditIdx, setActiveEditIdx] = useState<number | null>(null);
    // ไม่ต้องใช้ supabase โดยตรงอีกต่อไป — ใช้ API route แทน

    // useEffect(() => {
    //     if (data && isOpen) {
    //         const grouped = (data.student_assignments || []).reduce((acc: any, curr: any) => {
    //             const rId = curr.rotation_id || 'unassigned';
    //             if (!acc[rId]) {
    //                 acc[rId] = {
    //                     rotation_id: rId,
    //                     rotation_name: curr.rotations?.name || 'ไม่ได้ระบุผลัด',
    //                     start_date: curr.rotations?.start_date,
    //                     end_date: curr.rotations?.end_date,
    //                     site_id: curr.site_id,
    //                     training_sites: curr.training_sites,
    //                     subjects_in_rotation: []
    //                 };
    //             }

    //             acc[rId].subjects_in_rotation.push({
    //                 assignment_id: curr.id,
    //                 subject_id: curr.subject_id,
    //                 // ✅ แก้ไข: ลำดับการแสดงชื่อ คือ วิชาย่อย > วิชาหลัก
    //                 displayName: curr.sub_subjects?.name || curr.subjects?.name || 'ไม่ระบุวิชา',
    //                 supervisor_ids: curr.assignment_supervisors?.map((sv: any) => sv.supervisor_id) || [],
    //                 supervisors_data: curr.assignment_supervisors?.map((sv: any) => sv.supervisors) || []
    //             });
    //             return acc;
    //         }, {});

    //         setForm({ ...data, grouped_assignments: Object.values(grouped) });
    //         setIsEditing(false);
    //         setSiteSearch("");
    //         setActiveEditIdx(null);
    //     }
    // }, [data, isOpen]);

    // version optimizxze
    useEffect(() => {
        // 🚩 เช็คว่ามี data ส่งมาจริงหรือไม่
        if (data && isOpen) {
            try {
                const assignments = data.student_assignments || [];

                const grouped = assignments.reduce((acc: any, curr: any) => {
                    const rId = curr.rotation_id || 'unassigned';
                    if (!acc[rId]) {
                        acc[rId] = {
                            rotation_id: rId,
                            // ✅ ปรับการเข้าถึงชื่อผลัดให้ปลอดภัยขึ้น
                            rotation_name: curr.rotations?.name || 'ไม่ได้ระบุผลัด',
                            start_date: curr.rotations?.start_date,
                            end_date: curr.rotations?.end_date,
                            site_id: curr.site_id,
                            training_sites: curr.training_sites,
                            subjects_in_rotation: []
                        };
                    }

                    // ✅ ถ้า sub_subject_id == null แต่มี sub_subjects อยู่ → เป็นวิชาหลักสำหรับประเมินเล่ม
                    const hasSubSubjects = !curr.sub_subject_id && assignments.some(
                        (a: any) => a.subject_id === curr.subject_id && a.sub_subject_id != null
                    );
                    const displayName = curr.sub_subjects?.name
                        || (hasSubSubjects ? `${curr.subjects?.name || 'ไม่ระบุวิชา'} (ประเมินเล่ม)` : curr.subjects?.name || 'ไม่ระบุวิชา');

                    acc[rId].subjects_in_rotation.push({
                        assignment_id: curr.id,
                        subject_id: curr.subject_id,
                        sub_subject_id: curr.sub_subject_id,
                        displayName,
                        supervisor_ids: curr.assignment_supervisors?.map((sv: any) => sv.supervisor_id) || [],
                        supervisors_data: curr.assignment_supervisors?.map((sv: any) => sv.supervisors) || []
                    });
                    return acc;
                }, {});

                // ✅ เช็คแต่ละผลัด: ถ้ามีวิชาย่อย (sub_subject_id != null) แต่ไม่มี entry วิชาหลัก (sub_subject_id == null)
                // ให้เพิ่ม entry วิชาหลักสำหรับประเมินเล่มเข้าไปด้วย
                const groupedValues: any[] = Object.values(grouped);
                for (const rot of groupedValues) {
                    const subjects = rot.subjects_in_rotation;
                    // หา subject_id ที่มี sub_subject entries
                    const subjectIdsWithSubs = [...new Set(
                        subjects.filter((s: any) => s.sub_subject_id != null).map((s: any) => s.subject_id)
                    )];
                    for (const sjId of subjectIdsWithSubs) {
                        // เช็คว่ามี entry วิชาหลัก (sub_subject_id == null) หรือยัง
                        const hasParent = subjects.some((s: any) => s.subject_id === sjId && s.sub_subject_id == null);
                        if (!hasParent) {
                            // ดึงชื่อวิชาจาก entry ที่มีอยู่แล้ว
                            const existingSub = subjects.find((s: any) => s.subject_id === sjId);
                            const parentName = existingSub?.subjects?.name || assignments.find((a: any) => a.subject_id === sjId)?.subjects?.name || 'ไม่ระบุวิชา';
                            // เพิ่ม entry ใหม่ที่ด้านบนสุดของกลุ่มวิชานี้
                            const insertIdx = subjects.findIndex((s: any) => s.subject_id === sjId);
                            subjects.splice(insertIdx, 0, {
                                assignment_id: null, // ยังไม่มีใน DB — จะสร้างตอน save
                                subject_id: sjId,
                                sub_subject_id: null,
                                displayName: `${parentName} (ประเมินเล่ม)`,
                                supervisor_ids: [],
                                supervisors_data: []
                            });
                        }
                    }
                }

                setForm({ ...data, grouped_assignments: groupedValues });
                setIsEditing(false);
                setSiteSearch("");
                setActiveEditIdx(null);
            } catch (error) {
                console.error("Error processing modal data:", error);
                // ถ้าพัง ให้เซตฟอร์มว่างไว้ก่อนเพื่อไม่ให้หน้าจอขาว
                setForm(data);
            }
        }
    }, [data, isOpen]);

    if (!isOpen || !form) return null;

    // const handleSave = async () => {

    //     setLoading(true);
    //     try {
    //         // 1. อัปเดตข้อมูลพื้นฐานนักศึกษา
    //         await supabase.from('students').update({
    //             first_name: form.first_name, last_name: form.last_name,
    //             phone: form.phone, email: form.email
    //         }).eq('id', form.id);

    //         // 2. อัปเดตรายวิชาและพี่เลี้ยง (วนลูปตามกลุ่มที่จัดไว้)
    //         for (const rot of form.grouped_assignments) {
    //             for (const sub of rot.subjects_in_rotation) {
    //                 // อัปเดตสถานที่ฝึก
    //                 await supabase.from('student_assignments')
    //                     .update({ site_id: rot.site_id })
    //                     .eq('id', sub.assignment_id);

    //                 // อัปเดตพี่เลี้ยง (ลบเก่า-ใส่ใหม่)
    //                 await supabase.from('assignment_supervisors').delete().eq('assignment_id', sub.assignment_id);
    //                 if (sub.supervisor_ids.length > 0) {
    //                     const records = sub.supervisor_ids.map((id: number) => ({
    //                         assignment_id: sub.assignment_id,
    //                         supervisor_id: id
    //                     }));
    //                     await supabase.from('assignment_supervisors').insert(records);
    //                 }
    //             }
    //             const { data: updated } = await supabase.from('students').select(`
    //                     *,
    //                     student_assignments (
    //                         id, rotation_id, site_id, subject_id, sub_subject_id,
    //                         training_sites (site_name, province),
    //                         rotations (id, name, start_date, end_date),
    //                         subjects (id, name),
    //                         sub_subjects (id, name), 
    //                         assignment_supervisors (supervisor_id, supervisors (full_name))
    //                     )
    //                 `).eq('id', form.id).single();
    //         }



    //         Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[2rem]' } });
    //         fetchData();
    //         onClose();
    //     } catch (e) {
    //         Swal.fire('Error', 'ไม่สามารถบันทึกได้', 'error');
    //     } finally { setLoading(false); }
    // }

    // version optimizxze

    // version optimize


    // const handleSave = async () => {
    //     setLoading(true);
    //     try {
    //         // 1. อัปเดตข้อมูลนักศึกษา
    //         await supabase.from('students').update({
    //             first_name: form.first_name,
    //             last_name: form.last_name,
    //             phone: form.phone,
    //             email: form.email
    //         }).eq('id', form.id);

    //         // 2. วนลูปอัปเดต Assignment
    //         for (const rot of form.grouped_assignments) {
    //             for (const sub of rot.subjects_in_rotation) {
    //                 await supabase.from('student_assignments')
    //                     .update({ site_id: rot.site_id })
    //                     .eq('id', sub.assignment_id);

    //                 await supabase.from('assignment_supervisors')
    //                     .delete()
    //                     .eq('assignment_id', sub.assignment_id);

    //                 if (sub.supervisor_ids.length > 0) {
    //                     const records = sub.supervisor_ids.map((id: number) => ({
    //                         assignment_id: sub.assignment_id,
    //                         supervisor_id: id
    //                     }));
    //                     await supabase.from('assignment_supervisors').insert(records);
    //                 }
    //             }
    //         }

    //         // 🚩 3. ดึงข้อมูลใหม่มาอัปเดตหน้าจอ (ทำครั้งเดียวหลังจบลูป)
    //         await fetchData(); // เรียกใช้ฟังก์ชันจากหน้าหลัก

    //         Swal.fire({
    //             icon: 'success',
    //             title: 'บันทึกสำเร็จ',
    //             timer: 1500,
    //             showConfirmButton: false,
    //             customClass: { popup: 'rounded-[2rem]' }
    //         });

    //         onClose(); // ปิดโมดอลหลังบันทึก
    //     } catch (e) {
    //         console.error(e);
    //         Swal.fire('Error', 'ไม่สามารถบันทึกได้', 'error');
    //     } finally {
    //         setLoading(false);
    //     }
    // }

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                prefix: form.prefix,
                first_name: form.first_name,
                last_name: form.last_name,
                nickname: form.nickname,
                student_code: form.student_code,
                phone: form.phone,
                email: form.email,
                training_year: form.training_year,
                avatar_url: form.avatar_url,
                has_motorcycle: form.has_motorcycle,
                parental_consent_url: form.parental_consent_url
            };

            const res = await fetch('/api/admin/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    studentId: form.id,
                    payload,
                    grouped_assignments: form.grouped_assignments
                })
            })
            const result = await res.json()
            if (!result.success) throw new Error(result.error)
            Swal.fire({
                icon: 'success',
                title: 'บันทึกข้อมูลสำเร็จ',
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[2rem]' }
            });

            if (fetchData) await fetchData(); // ดึงข้อมูลใหม่มาโชว์ที่ตารางหลัก
            onClose(); // ปิด Modal

        } catch (error: any) {
            console.error('Save error:', error);
            Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] lg:max-w-[1100px] w-full p-0 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-none shadow-2xl bg-white focus:outline-none [&>button]:hidden">
                <DialogHeader className="sr-only"><DialogTitle>Student Profile</DialogTitle></DialogHeader>

                <div className="flex flex-col md:flex-row h-full min-h-0 md:min-h-[700px] max-h-[95dvh] md:max-h-[92vh] overflow-y-auto md:overflow-hidden">
                    {/* Sidebar Profile - คงขนาดเดิม */}
                    <div className="w-full md:w-[35%] bg-slate-950 relative flex flex-col border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
                        <div className="relative h-[180px] md:h-[55%] w-full overflow-hidden">
                            {form.avatar_url ? <img src={form.avatar_url} className="w-full h-full object-cover opacity-90" alt="" /> :
                                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-700"><UserCircle size={140} strokeWidth={0.5} /></div>}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                        </div>
                        <div className="p-6 md:p-10 flex-1 flex flex-col justify-start -mt-14 md:-mt-20 relative z-10">
                            <span className="inline-block w-fit px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] mb-4 bg-blue-600 text-white border border-blue-400">ID: {form.student_code}</span>
                            <h2 className="text-2xl font-black text-white leading-[1.1] mb-2 uppercase">{form.prefix}{form.first_name} <br /> {form.last_name}</h2>
                            {form.nickname && <p className="text-blue-400 font-bold text-sm mb-4">({form.nickname})</p>}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-blue-400 font-bold"><Mail size={16} /><span className="text-[14px] truncate">{form.email || '-'}</span></div>
                                <div className="flex items-center gap-3 text-blue-400 font-bold"><Phone size={16} /><span className="text-[14px]">{form.phone || '-'}</span></div>

                                <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-slate-400 font-bold">
                                            <Bike size={18} />
                                            <span className="text-xs uppercase tracking-wider">รถจักรยานยนต์</span>
                                        </div>
                                        {form.has_motorcycle ? (
                                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/20 uppercase">มีรถ</span>
                                        ) : (
                                            <span className="px-2.5 py-1 bg-slate-800 text-slate-500 text-[10px] font-black rounded-lg border border-slate-700 uppercase">ไม่มี</span>
                                        )}
                                    </div>

                                    {form.has_motorcycle && form.parental_consent_url && (
                                        <a
                                            href={form.parental_consent_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 p-3 rounded-xl bg-blue-600/10 border border-blue-600/20 text-blue-400 hover:bg-blue-600/20 transition-all group"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                                                <FileText size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black uppercase tracking-tight text-white leading-none mb-1">ใบอนุญาตผู้ปกครอง</p>
                                                <p className="text-[9px] font-bold text-blue-400/60 truncate italic">คลิกเพื่อดู PDF</p>
                                            </div>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content area */}
                    <div className="flex-1 bg-white flex flex-col overflow-hidden">
                        <div className="px-6 md:px-10 py-4 md:py-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20 shrink-0">
                            <div className="space-y-1">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Internship Details</h3>
                                <div className="h-1 w-10 bg-blue-500 rounded-full" />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setIsEditing(!isEditing)} className={`rounded-2xl px-6 h-12 transition-all font-black text-xs ${isEditing ? "text-red-500 bg-red-50" : "text-blue-600 bg-blue-50"}`}>
                                    {isEditing ? 'ยกเลิก' : 'แก้ไข'}
                                </Button>
                                <Button onClick={onClose} variant="ghost" className="rounded-full w-12 h-12 p-0"><X size={20} /></Button>
                            </div>
                        </div>

                        <div className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar space-y-6">
                            {/* แก้ไขข้อมูลส่วนตัวเมื่อกด Edit */}
                            {isEditing && (
                                <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 space-y-4 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสนักศึกษา</label>
                                            <Input value={form.student_code || ''} onChange={e => setForm({ ...form, student_code: e.target.value })} placeholder="รหัสนักศึกษา" className="h-12 rounded-xl bg-white border-none font-bold" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อเล่น</label>
                                            <Input value={form.nickname || ''} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="ชื่อเล่น" className="h-12 rounded-xl bg-white border-none font-bold" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">คำนำหน้า - ชื่อ - นามสกุล</label>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <select className="h-12 rounded-xl bg-white border-none font-bold px-4 text-sm focus:ring-2 ring-blue-500 outline-none" value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })}>
                                                <option>นางสาว</option><option>นาย</option>
                                            </select>
                                            <Input value={form.first_name || ''} onChange={e => setForm({ ...form, first_name: e.target.value })} placeholder="ชื่อ" className="h-12 rounded-xl bg-white border-none font-bold md:col-span-1.5" />
                                            <Input value={form.last_name || ''} onChange={e => setForm({ ...form, last_name: e.target.value })} placeholder="นามสกุล" className="h-12 rounded-xl bg-white border-none font-bold md:col-span-1.5" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="เบอร์โทร" className="h-12 rounded-xl bg-white border-none font-bold" />
                                        <Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="อีเมล" className="h-12 rounded-xl bg-white border-none font-bold" />
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-blue-100">
                                        <input
                                            type="checkbox"
                                            id="edit_has_motorcycle"
                                            checked={form.has_motorcycle || false}
                                            onChange={e => setForm({ ...form, has_motorcycle: e.target.checked })}
                                            className="w-5 h-5 rounded border-blue-200 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="edit_has_motorcycle" className="text-sm font-black text-slate-700 cursor-pointer">
                                            นำรถจักรยานยนต์ไปฝึกงาน
                                        </label>
                                    </div>
                                    {/* วางไว้ในส่วนกรอกข้อมูล เช่น ใต้ช่อง Email */}
                                    <div className="col-span-2">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">ปีการศึกษาที่ฝึกงาน (Training Year)</label>
                                        <Input
                                            value={form.training_year || ''}
                                            onChange={(e) => setForm({ ...form, training_year: e.target.value })}
                                            placeholder="เช่น 2569"
                                            className="h-14 rounded-2xl border-slate-200 font-bold text-lg"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 italic">* ระบุปีที่จะให้นักศึกษาคนนี้ไปปรากฏในระบบ (ใช้ย้ายรุ่นพี่มาฝึกปีปัจจุบัน)</p>
                                    </div>
                                </div>
                            )}

                            {/* รายการผลัดการฝึกงาน (Grouped) */}
                            {form.grouped_assignments?.map((rot: any, idx: number) => {
                                const theme = getRotationTheme(idx);
                                return (
                                    <div key={rot.rotation_id || idx} className="p-8 rounded-[2.5rem] border border-slate-100 bg-white shadow-sm space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shrink-0 ${theme.bg}`}>
                                                <span className="text-[9px] font-black uppercase">ผลัดที่</span>
                                                <span className="text-xl font-black">{idx + 1}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-slate-800 uppercase text-base">{rot.rotation_name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {new Date(rot.start_date).toLocaleDateString('th-TH')} - {new Date(rot.end_date).toLocaleDateString('th-TH')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* ส่วนเลือกสถานที่ (1 ผลัด = 1 สถานที่) */}
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-2 mb-3 text-slate-400">
                                                <Building2 size={14} className="text-blue-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">สถานที่ฝึกปฏิบัติงาน</span>
                                            </div>
                                            {isEditing ? (
                                                <div className="relative">
                                                    <Input
                                                        className="h-11 rounded-xl bg-white font-bold text-sm"
                                                        value={activeEditIdx === idx ? siteSearch : (rot.training_sites?.site_name || "")}
                                                        onChange={(e) => setSiteSearch(e.target.value)}
                                                        onFocus={() => { setActiveEditIdx(idx); setSiteSearch(""); }}
                                                        placeholder="ค้นหาโรงพยาบาล..."
                                                    />
                                                    {activeEditIdx === idx && (
                                                        <div className="absolute z-[100] w-full mt-1 bg-white border rounded-xl shadow-xl p-2 max-h-40 overflow-y-auto">
                                                            {sites.filter((s: any) => s.site_name.includes(siteSearch)).map((s: any) => (
                                                                <div key={s.id} onClick={() => {
                                                                    const newG = [...form.grouped_assignments];
                                                                    newG[idx].site_id = s.id;
                                                                    newG[idx].training_sites = s;
                                                                    setForm({ ...form, grouped_assignments: newG });
                                                                    setActiveEditIdx(null);
                                                                }} className="p-2 hover:bg-blue-50 rounded-lg cursor-pointer text-sm font-bold">
                                                                    {s.site_name}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="font-black text-slate-700 ml-1">{rot.training_sites?.site_name || 'ยังไม่ระบุ'}</p>
                                            )}
                                        </div>

                                        {/* ส่วนวิชาย่อยและพี่เลี้ยง (แยกตามวิชา) */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                <BookOpen size={14} className="text-blue-500" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">วิชาย่อยและพี่เลี้ยง</span>
                                            </div>
                                            {rot.subjects_in_rotation.map((sub: any, sIdx: number) => (
                                                <div key={sub.assignment_id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm ml-4">
                                                    {/* ✅ แสดงชื่อวิชาย่อยที่นี่ */}
                                                    <div className="text-xs font-black text-blue-600 mb-3 flex items-center gap-2">
                                                        <div className="w-1 h-3 rounded-full bg-blue-600" />
                                                        {/* ✅ แสดงชื่อที่ผ่านการประมวลผลมาแล้ว */}
                                                        {sub.displayName}
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        {/* {isEditing ? (
                                                            mentors.filter((m: any) => String(m.site_id) === String(rot.site_id) && (m.supervisor_subjects || []).some((ss: any) => String(ss.subject_id) === String(sub.subject_id))).map((m: any) => (
                                                                <button
                                                                    key={`${sub.assignment_id}-${m.id}`}
                                                                    onClick={() => {
                                                                        const newG = [...form.grouped_assignments];
                                                                        const cur = newG[idx].subjects_in_rotation[sIdx].supervisor_ids;
                                                                        newG[idx].subjects_in_rotation[sIdx].supervisor_ids = cur.includes(m.id) ? cur.filter((i: any) => i !== m.id) : [...cur, m.id];
                                                                        setForm({ ...form, grouped_assignments: newG });
                                                                    }}
                                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${sub.supervisor_ids.includes(m.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}
                                                                >
                                                                    {m.full_name}
                                                                </button>
                                                            ))
                                                        ) : ( */}
                                                        {isEditing ? (
                                                            mentors
                                                                .filter((m: any) => {
                                                                    // 1. กรองตามโรงพยาบาล (Site ID)
                                                                    const isSameSite = String(m.site_id) === String(rot.site_id);

                                                                    // 2. กรองตามวิชาที่พี่เลี้ยงรับผิดชอบ (Subject ID & Sub-subject ID)
                                                                    const isResponsibleForSubject = (m.supervisor_subjects || []).some(
                                                                        (ss: any) => {
                                                                            const matchMain = String(ss.subject_id) === String(sub.subject_id);
                                                                            if (sub.sub_subject_id) {
                                                                                return matchMain && String(ss.sub_subject_id) === String(sub.sub_subject_id);
                                                                            }
                                                                            return matchMain;
                                                                        }
                                                                    );

                                                                    return isSameSite && isResponsibleForSubject;
                                                                })
                                                                .map((m: any) => (
                                                                    <button
                                                                        key={`${sub.assignment_id}-${m.id}`}
                                                                        onClick={() => {
                                                                            const newG = [...form.grouped_assignments];
                                                                            const cur = newG[idx].subjects_in_rotation[sIdx].supervisor_ids;
                                                                            newG[idx].subjects_in_rotation[sIdx].supervisor_ids = cur.includes(m.id)
                                                                                ? cur.filter((i: any) => i !== m.id)
                                                                                : [...cur, m.id];
                                                                            setForm({ ...form, grouped_assignments: newG });
                                                                        }}
                                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all ${sub.supervisor_ids.includes(m.id)
                                                                            ? 'bg-blue-600 border-blue-600 text-white'
                                                                            : 'bg-slate-50 text-slate-400'
                                                                            }`}
                                                                    >
                                                                        {m.full_name}
                                                                    </button>
                                                                ))
                                                        ) : (
                                                            sub.supervisors_data.length > 0 ? sub.supervisors_data.map((sv: any, i: number) => (
                                                                <span key={`${sub.assignment_id}-sv-${i}`} className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-[9px] font-bold border border-blue-100 flex items-center gap-1">
                                                                    <CheckCircle2 size={10} /> {sv.full_name}
                                                                </span>
                                                            )) : <span className="text-[9px] text-slate-300 italic font-bold">ไม่มีพี่เลี้ยง</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {isEditing && (
                            <div className="p-8 border-t bg-slate-50 shrink-0">
                                <Button onClick={handleSave} disabled={loading} className="w-full h-16 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-white text-lg transition-all active:scale-95 flex items-center justify-center gap-3">
                                    {loading ? <Loader2 className="animate-spin" /> : <Save />} บันทึกการเปลี่ยนแปลง
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}



function StudentAddModal({ isOpen, onClose, sites, mentors, fetchData, availableTracks }: any) {
    const [loading, setLoading] = useState(false);
    const [siteSearch, setSiteSearch] = useState("");
    const [activeEditIdx, setActiveEditIdx] = useState<number | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfPreview, setPdfPreview] = useState<string | null>(null);
    const [tracks, setTracks] = useState<string[]>(availableTracks?.length > 0 ? availableTracks : ['A', 'B', 'C']);



    const [form, setForm] = useState<any>({
        student_code: '', prefix: 'นางสาว', first_name: '', last_name: '', nickname: '',
        phone: '', email: '', training_year: '', track: 'A',
        has_motorcycle: false,
        assignments: []
    });


    useEffect(() => {
        if (isOpen) {
            const initData = async () => {
                // ดึงข้อมูลผ่าน API route
                const res = await fetch('/api/admin/students', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'init-form', track: form.track })
                })
                const result = await res.json()
                if (!result.success) return

                const { currentYear, rotations: rotationsData, tracks: tracksData } = result.data
                if (tracksData && tracksData.length > 0) setTracks(tracksData)


                setForm((prev: any) => ({
                    ...prev,
                    student_code: prev.student_code, prefix: prev.prefix,
                    first_name: prev.first_name, last_name: prev.last_name,
                    nickname: prev.nickname, phone: prev.phone,
                    email: prev.email,
                    training_year: currentYear,
                    assignments: (rotationsData || []).map((r: any) => {
                        const subjects: any[] = [];
                        (r.rotation_subjects || []).forEach((rs: any) => {
                            if (rs.subjects?.sub_subjects && rs.subjects.sub_subjects.length > 0) {
                                // เพิ่มวิชาหลัก (parent) สำหรับประเมินเล่ม
                                subjects.push({
                                    subject_id: rs.subject_id,
                                    sub_subject_id: null,
                                    displayName: `${rs.subjects.name} (ประเมินเล่ม)`,
                                    supervisor_ids: []
                                });
                                // เพิ่มวิชาย่อยแต่ละตัว
                                rs.subjects.sub_subjects.forEach((ss: any) => {
                                    subjects.push({
                                        subject_id: rs.subject_id,
                                        sub_subject_id: ss.id,
                                        displayName: `${ss.name}`,
                                        supervisor_ids: []
                                    });
                                });
                            } else {
                                subjects.push({
                                    subject_id: rs.subject_id,
                                    sub_subject_id: null,
                                    displayName: rs.subjects?.name || 'ไม่ระบุวิชา',
                                    supervisor_ids: []
                                });
                            }
                        });

                        return {
                            rotation_id: r.id,
                            rotation_name: r.name,
                            site_id: "",
                            site_name: "",
                            subjects: subjects
                        };
                    })
                }));
            };
            initData();
            setAvatarPreview(null);
            setAvatarFile(null);
            setPdfFile(null);
            setPdfPreview(null);

        }
    }, [isOpen, form.track]);

    // ฟังก์ชันเปลี่ยนสาย — reload ผลัดใหม่ตามสายที่เลือก
    const handleTrackChange = (newTrack: string) => {
        setForm((prev: any) => ({ ...prev, track: newTrack }))
    }

    // ฟังก์ชันจัดการการเลือกโรงพยาบาล
    const handleSelectSite = (idx: number, site: any) => {
        const nAs = [...form.assignments];
        nAs[idx].site_id = site.id;
        nAs[idx].site_name = `${site.site_name} (${site.province})`; // รวมชื่อและจังหวัด
        setForm({ ...form, assignments: nAs });
        setActiveEditIdx(null);
        setSiteSearch(""); // ล้างค่าค้นหา
    };

    // ฟังก์ชันล้างสถานที่ฝึก
    const handleClearSite = (idx: number) => {
        const nAs = [...form.assignments];
        nAs[idx].site_id = "";
        nAs[idx].site_name = "";
        nAs[idx].supervisor_ids = [];
        setForm({ ...form, assignments: nAs });
    };




    const handleSave = async () => {
        // 1. ตรวจสอบฟิลด์พื้นฐาน
        if (!form.student_code || !form.first_name) {
            // return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกรหัสและชื่อนักศึกษา', 'warning');
            return Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณากรอกรหัสและชื่อนักศึกษา',
                timer: 1500,
                showConfirmButton: false
            });
        }

        const fileToUpload = avatarFile;
        if (!fileToUpload) {
            // return Swal.fire('กรุณาเลือกรูปภาพ', 'ต้องมีรูปโปรไฟล์นักศึกษา', 'warning');
            return Swal.fire({
                icon: 'warning',
                title: 'กรุณาเลือกรูปภาพ',
                text: 'ต้องมีรูปโปรไฟล์นักศึกษา',
                timer: 1500,
                showConfirmButton: false
            });
        }

        setLoading(true);
        try {
            // ส่งข้อมูลทั้งหมดผ่าน FormData (รวมไฟล์รูปด้วย)
            const formData = new FormData()
            formData.append('action', 'add')
            formData.append('avatar', fileToUpload)
            formData.append('studentData', JSON.stringify({
                student_code: form.student_code,
                prefix: form.prefix,
                first_name: form.first_name,
                last_name: form.last_name,
                nickname: form.nickname,
                phone: form.phone,
                email: form.email,
                training_year: form.training_year,
                track: form.track,
                has_motorcycle: form.has_motorcycle
            }))
            formData.append('has_motorcycle', form.has_motorcycle.toString())

            // 2. Handle PDF File (Append to formData for server-side upload)
            if (pdfFile) {
                formData.append('consent_pdf', pdfFile)
            }

            formData.append('assignments', JSON.stringify(form.assignments))
            formData.append('mentorsData', JSON.stringify(mentors))


            const res = await fetch('/api/admin/students', {
                method: 'POST',
                body: formData // ไม่ต้องใส่ Content-Type เพราะ FormData จะ set เอง
            })
            const result = await res.json()

            if (!result.success) {
                if (res.status === 409) {
                    setLoading(false);
                    return Swal.fire({
                        icon: 'error',
                        title: 'ข้อมูลซ้ำ',
                        text: result.error || 'รหัสนี้ลงทะเบียนแล้ว',
                        timer: 3000,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-[2rem]' }
                    });
                }

                throw new Error(result.error)
            }

            Swal.fire({
                icon: 'success',
                title: 'สำเร็จ',
                text: 'เพิ่มข้อมูลนักศึกษาเรียบร้อยแล้ว',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[2rem]' }
            });


            fetchData();
            onClose();
        } catch (e: any) {
            console.error('Error saving student:', e);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: e.message || 'ไม่สามารถบันทึกข้อมูลได้',
                timer: 3000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-[2rem]' }
            });

        } finally {
            setLoading(false);
        }
    };


    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] lg:max-w-[1200px] w-full p-0 overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border-none shadow-2xl bg-white focus:outline-none">
                <DialogHeader className="hidden"><DialogTitle>เพิ่มนักศึกษาใหม่</DialogTitle></DialogHeader>
                <div className="flex flex-col h-[95dvh] md:h-[90vh]">
                    {/* Header */}
                    <div className="px-6 md:px-10 py-4 md:py-6 flex justify-between items-center bg-slate-900 text-white shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg"><Plus size={24} /></div>
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight leading-none">เพิ่มนักศึกษาใหม่</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">จัดการข้อมูลนักศึกษาและแผนการฝึกปฏิบัติงาน</p>
                            </div>
                        </div>
                        <Button onClick={onClose} variant="ghost" className="text-white hover:bg-slate-800 rounded-full w-10 h-10 p-0"><X size={20} /></Button>
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        {/* LEFT SIDE: ข้อมูลส่วนตัว */}
                        <div className="w-full md:w-[45%] p-6 md:p-12 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-50 space-y-8 md:space-y-10 bg-white">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">ข้อมูลส่วนตัว</h3>
                            </div>

                            {/* Image Upload Box (เหมือนเดิม) */}
                            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 group hover:border-blue-400 transition-all relative">
                                {avatarPreview ? (
                                    <img src={avatarPreview} className="w-40 h-40 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white" />
                                ) : (
                                    <div className="w-40 h-40 rounded-[2.5rem] bg-white flex flex-col items-center justify-center text-slate-300 shadow-sm border border-slate-100">
                                        <Camera size={48} />
                                        <span className="text-[11px] font-black mt-3 uppercase tracking-widest">No Photo</span>
                                    </div>
                                )}
                                <label className="mt-5 px-8 py-2.5 bg-slate-900 rounded-full text-[11px] font-black text-white shadow-xl cursor-pointer hover:bg-blue-600 transition-all uppercase tracking-widest">
                                    Upload Photo
                                    <input type="file" className="hidden" accept="image/*" onChange={(e: any) => {
                                        const file = e.target.files[0];
                                        if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
                                    }} />
                                </label>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสนักศึกษา</label>
                                        <Input value={form.student_code || ''} onChange={e => setForm({ ...form, student_code: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6 focus:ring-2 ring-blue-500" placeholder="6XXXXXXX" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อเล่น</label>
                                        <Input value={form.nickname || ''} onChange={e => setForm({ ...form, nickname: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base px-6 focus:ring-2 ring-blue-500" placeholder="ชื่อเล่น" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-emerald-500 uppercase tracking-widest ml-1">สาย</label>
                                        <select
                                            value={form.track}
                                            onChange={e => handleTrackChange(e.target.value)}
                                            className="w-full h-14 rounded-2xl bg-emerald-50 border-none font-black text-base px-6 focus:ring-2 ring-emerald-500 outline-none text-emerald-700"
                                        >
                                            {tracks.map(t => (
                                                <option key={t} value={t}>สาย {t}</option>
                                            ))}
                                        </select>

                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">คำนำหน้า - ชื่อ - นามสกุล</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <select className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-4 text-sm w-32 focus:ring-2 ring-blue-500 outline-none" value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })}>
                                            <option>นางสาว</option><option>นาย</option>
                                        </select>
                                        <Input value={form.first_name || ''} onChange={e => setForm({ ...form, first_name: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base flex-1 px-6 focus:ring-2 ring-blue-500" placeholder="ชื่อ" />
                                        <Input value={form.last_name || ''} onChange={e => setForm({ ...form, last_name: e.target.value })} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-base flex-1 px-6 focus:ring-2 ring-blue-500" placeholder="นามสกุล" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์</label>
                                        <div className="relative">
                                            <Phone className="absolute left-5 top-[50%] -translate-y-[50%] text-slate-400 pointer-events-none" size={18} />
                                            <Input value={form.phone || ''} maxLength={10} onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') })} className="h-14 pl-14 rounded-2xl bg-slate-50 border-none font-bold text-base focus:ring-2 ring-blue-500" placeholder="0XXXXXXXXX" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">อีเมล</label>
                                        <div className="relative">
                                            <Mail className="absolute left-5 top-[50%] -translate-y-[50%] text-slate-400 pointer-events-none" size={18} />
                                            <Input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="h-14 pl-14 rounded-2xl bg-slate-50 border-none font-bold text-base focus:ring-2 ring-blue-500" placeholder="email@example.com" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">ปีการศึกษาที่ฝึก (Training Year)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-[50%] -translate-y-[50%] text-slate-400 pointer-events-none" size={18} />
                                        <Input
                                            value={form.training_year || ''}
                                            onChange={e => setForm({ ...form, training_year: e.target.value.replace(/[^0-9]/g, '') })}
                                            className="h-14 pl-14 rounded-2xl bg-slate-50 border-none font-bold text-base focus:ring-2 ring-blue-500"
                                            placeholder="เช่น 2569"
                                        />
                                    </div>
                                </div>

                                {/* Motorcycle & PDF Section (NEW) */}
                                <div className="bg-slate-50 p-6 rounded-[2rem] space-y-6 border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${form.has_motorcycle ? 'bg-orange-500 text-white shadow-lg' : 'bg-white text-slate-300'}`}>
                                            <Bike size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-black text-slate-700 uppercase tracking-tight">นำรถจักรยานยนต์ไปด้วยตนเอง</span>
                                                <button
                                                    onClick={() => setForm({ ...form, has_motorcycle: !form.has_motorcycle })}
                                                    className={`w-12 h-6 rounded-full transition-all relative ${form.has_motorcycle ? 'bg-orange-500' : 'bg-slate-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.has_motorcycle ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 italic">หากนำรถไปเองต้องแนบเอกสารยินยอม</p>
                                        </div>
                                    </div>

                                    {form.has_motorcycle && (
                                        <div className="animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">เอกสารยินยอมจากผู้ปกครอง (PDF)</label>
                                            <div className={`relative group transition-all`}>
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setPdfFile(file);
                                                            setPdfPreview(file.name);
                                                        }
                                                    }}
                                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                                />
                                                <div className={`h-14 w-full rounded-2xl border-2 border-dashed flex items-center justify-between px-6 transition-all ${pdfFile ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-200'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={20} className={pdfFile ? 'text-emerald-500' : 'text-slate-300'} />
                                                        <span className={`text-xs font-black truncate max-w-[180px] ${pdfFile ? 'text-emerald-600' : 'text-slate-300 uppercase tracking-widest'}`}>
                                                            {pdfFile ? pdfFile.name : 'เลือกไฟล์ PDF'}
                                                        </span>
                                                    </div>
                                                    <Upload size={18} className={pdfFile ? 'text-emerald-500' : 'text-slate-300'} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* RIGHT SIDE: การเลือกสถานที่ฝึก */}
                        <div className="w-full md:w-[55%] p-6 md:p-12 bg-slate-50/50 overflow-y-auto space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">สถานที่ฝึกงาน / พี่เลี้ยง</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                {form.assignments.map((as: any, idx: number) => (
                                    <div key={idx} className="p-8 rounded-[3rem] bg-white shadow-xl shadow-slate-200/20 border border-slate-100 space-y-6 relative group transition-all hover:ring-2 ring-blue-500/20">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm">0{idx + 1}</div>
                                                <span className="text-sm font-black text-slate-800 uppercase tracking-widest">{as.rotation_name}</span>
                                            </div>
                                        </div>

                                        <div className="space-y-5">
                                            {/* Search Hospital Input - ปรับไอคอนและระบบแสดงผล */}
                                            <div className="relative group/input">
                                                {/* ไอคอน Search จัดกลางช่อง */}
                                                <Search className="absolute left-5 top-[50%] -translate-y-[50%] text-slate-400 pointer-events-none" size={18} />

                                                <Input
                                                    placeholder="ค้นหาชื่อโรงพยาบาล หรือ จังหวัด..."
                                                    // หากเลือกแล้วจะแสดงชื่อ site_name ถ้ายังไม่เลือกจะแสดงค่า siteSearch
                                                    value={as.site_name || siteSearch}
                                                    readOnly={!!as.site_id} // ล็อคหากเลือกแล้ว เพื่อให้ใช้ปุ่ม X ล้างแทน
                                                    className={`h-14 pl-14 pr-12 rounded-2xl bg-slate-50 border-none font-bold text-sm focus:ring-2 ring-blue-500 transition-all ${as.site_id ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                                                    onFocus={() => { if (!as.site_id) setActiveEditIdx(idx); }}
                                                    onChange={(e) => setSiteSearch(e.target.value)}
                                                />

                                                {/* ปุ่ม X สำหรับล้างสิ่งที่เลือก */}
                                                {as.site_id && (
                                                    <button
                                                        onClick={() => handleClearSite(idx)}
                                                        className="absolute right-5 top-[50%] -translate-y-[50%] text-slate-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={18} strokeWidth={3} />
                                                    </button>
                                                )}

                                                {activeEditIdx === idx && (
                                                    <div className="absolute z-50 w-full mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 max-h-56 overflow-auto animate-in fade-in zoom-in-95">
                                                        {sites.filter((s: any) => s.site_name?.toLowerCase().includes(siteSearch?.toLowerCase()) || s.province?.toLowerCase().includes(siteSearch?.toLowerCase())).map((s: any) => (
                                                            <div key={s.id} onClick={() => handleSelectSite(idx, s)}
                                                                className="p-4 hover:bg-blue-50 cursor-pointer rounded-2xl text-sm font-bold text-slate-600 flex justify-between items-center transition-colors">
                                                                {s.site_name} <span className="text-[11px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-black uppercase">{s.province}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Granular Subject & Mentor Selection */}
                                            <div className="space-y-4">
                                                {as.subjects.map((sub: any, sIdx: number) => (
                                                    <div key={`${idx}-${sIdx}`} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm ml-4">
                                                        <div className="text-xs font-black text-blue-600 mb-3 flex items-center gap-2">
                                                            <div className="w-1 h-3 rounded-full bg-blue-600" />
                                                            {sub.displayName}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {mentors.filter((m: any) => {
                                                                const isSameSite = String(m.site_id) === String(as.site_id);
                                                                const isResponsible = m.supervisor_subjects?.some((ss: any) => {
                                                                    const matchMain = String(ss.subject_id) === String(sub.subject_id);
                                                                    if (sub.sub_subject_id) {
                                                                        return matchMain && String(ss.sub_subject_id) === String(sub.sub_subject_id);
                                                                    }
                                                                    return matchMain;
                                                                });
                                                                return isSameSite && isResponsible;
                                                            }).map((m: any) => (
                                                                <button
                                                                    key={m.id}
                                                                    onClick={() => {
                                                                        const nAs = [...form.assignments];
                                                                        const current = nAs[idx].subjects[sIdx].supervisor_ids;
                                                                        nAs[idx].subjects[sIdx].supervisor_ids = current.includes(m.id)
                                                                            ? current.filter((id: any) => id !== m.id)
                                                                            : [...current, m.id];
                                                                        setForm({ ...form, assignments: nAs });
                                                                    }}
                                                                    className={`px-4 py-2 rounded-xl text-[10px] font-black border-2 transition-all ${sub.supervisor_ids.includes(m.id)
                                                                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                                        : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200'
                                                                        }`}
                                                                >
                                                                    {m.full_name}
                                                                </button>
                                                            ))}
                                                            {as.site_id && mentors.filter((m: any) => {
                                                                const isSameSite = String(m.site_id) === String(as.site_id);
                                                                const isResponsible = m.supervisor_subjects?.some((ss: any) => {
                                                                    const matchMain = String(ss.subject_id) === String(sub.subject_id);
                                                                    if (sub.sub_subject_id) {
                                                                        return matchMain && String(ss.sub_subject_id) === String(sub.sub_subject_id);
                                                                    }
                                                                    return matchMain;
                                                                });
                                                                return isSameSite && isResponsible;
                                                            }).length === 0 && (
                                                                    <p className="text-[10px] text-slate-300 font-bold italic py-1">ไม่มีรายชื่อพี่เลี้ยงที่รับผิดชอบวิชานี้</p>
                                                                )}
                                                            {!as.site_id && (
                                                                <p className="text-[10px] text-slate-300 font-bold italic py-1">กรุณาเลือกโรงพยาบาลก่อน</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t bg-white flex flex-col-reverse sm:flex-row justify-end items-stretch sm:items-center gap-3 sm:gap-5 shrink-0">
                        <Button onClick={handleSave} disabled={loading} className="h-16 px-14 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl gap-4 shadow-2xl transition-all active:scale-[0.98]">
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />} บันทึกข้อมูลนักศึกษา
                        </Button>
                        <Button onClick={onClose} variant="ghost" className="h-16 px-10 rounded-[1.5rem] font-black text-slate-400 uppercase tracking-widest hover:bg-red-50 hover:text-red-600">ยกเลิก</Button>
                    </div>
                </div>
            </DialogContent >
        </Dialog >
    );
}


