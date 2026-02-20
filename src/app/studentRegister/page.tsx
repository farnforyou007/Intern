// //ver4
"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Camera, Save, Loader2, GraduationCap, CalendarDays,
    Search, Mail, Phone, User, Hash, UserCircle, Trash2,
    Plus, X, Hospital
} from "lucide-react"
import Swal from 'sweetalert2'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Mentor {
    id: number;
    full_name: string;
    site_id: number;
}

export default function StudentRegisterPage() {
    const [loading, setLoading] = useState(false)
    const [allowedBatch, setAllowedBatch] = useState('')
    const [allProvinces, setAllProvinces] = useState<string[]>([])
    const [sites, setSites] = useState<any[]>([])
    const [mentors, setMentors] = useState<any[]>([])
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null)
    const [errors, setErrors] = useState<any>({})

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)

    const [form, setForm] = useState<any>({
        student_code: '', prefix: 'นางสาว',
        first_name: '', last_name: '',
        nickname: '', phone: '',
        email: '', class_year: '4',
        assignments: []
    })

    // ฟังก์ชันสำหรับดึงข้อมูล (ใช้ซ้ำได้ทั้งตอนโหลดครั้งแรกและตอน Real-time Update)
    const fetchSites = async () => {
        const { data } = await supabase.from('training_sites').select('*')
        if (data) {
            setSites(data)
            const uniqueProvinces = Array.from(new Set(data.map(item => item.province?.trim()).filter(Boolean))) as string[]
            setAllProvinces(uniqueProvinces.sort())
        }
    }

    // const fetchMentors = async () => {
    //     const { data } = await supabase.from('supervisors').select('*')
    //     if (data) setMentors(data)
    // }
    const fetchMentors = async () => {
        // ดึงข้อมูลพี่เลี้ยง พร้อมข้อมูลจากตารางกลาง (supervisor_subjects)
        const { data, error } = await supabase
            .from('supervisors')
            .select(`
            *,
            supervisor_subjects (
                subject_id,
                sub_subject_id
            )
        `)

        if (error) {
            console.error("Error fetching mentors:", error)
            return
        }

        if (data) {
            setMentors(data)
            // console.log("Mentors with subjects:", data) // 🚩 ลองเช็กใน Console ว่ามีก้อน supervisor_subjects มาไหม
        }
    }

    // ค้นหาฟังก์ชัน fetchConfigs เดิม แล้วแก้ไขเป็นตามนี้:
    const fetchConfigs = async () => {
        const { data } = await supabase
            .from('system_configs')
            .select('key_value') // แก้จาก value เป็น key_value ให้ตรงกับ DB
            .eq('key_name', 'allowed_student_batch') // แก้จาก key เป็น key_name ให้ตรงกับ DB
            .maybeSingle();

        if (data) {
            setAllowedBatch(data.key_value);
            console.log("Allowed Batch loaded:", data.key_value); // เช็คใน Console ดูได้เลยว่าเลข 65 มาหรือยัง
        } else {
            console.warn("Could not find configuration for allowed_student_batch");
        }
    }

    useEffect(() => {
        // โหลดข้อมูลครั้งแรก
        fetchConfigs()
        fetchSites()
        fetchMentors()

        // 1. ดึงข้อมูลผลัด (ครั้งเดียว)
        // const fetchRotations = async () => {
        //     const { data: r } = await supabase.from('rotations').select('*').order('round_number', { ascending: true }).limit(3)
        //     if (r) {
        //         setForm((prev: any) => ({
        //             ...prev,
        //             assignments: r.map((rot: any) => ({
        //                 rotation_id: String(rot.id),
        //                 rotation_name: rot.name,
        //                 dates: `${rot.start_date} - ${rot.end_date}`,
        //                 site_id: "", province: "", supervisor_ids: [], provinceSearch: ""
        //             }))
        //         }))
        //     }
        // }
        const fetchRotations = async () => {
            // 🚩 ปรับให้ดึงข้อมูลวิชาจาก rotation_subjects มาด้วย
            const { data: r } = await supabase
                .from('rotations')
                .select(`
            *,
            rotation_subjects (
                subject_id
            )
        `)
                .order('round_number', { ascending: true })
                .limit(3)

            if (r) {
                setForm((prev: any) => ({
                    ...prev,
                    assignments: r.map((rot: any) => ({
                        rotation_id: String(rot.id),
                        rotation_name: rot.name,
                        // 🚩 เก็บ ID วิชาไว้ใน item เพื่อเอาไปกรองพี่เลี้ยง
                        subject_id: rot.rotation_subjects?.[0]?.subject_id || null,
                        dates: `${rot.start_date} - ${rot.end_date}`,
                        site_id: "",
                        province: "",
                        supervisor_ids: [],
                        provinceSearch: ""
                    }))
                }))
            }
        }
        fetchRotations()

        // --- ระบบ REAL-TIME SUBSCRIPTION ---

        // ติดตามการเปลี่ยนแปลงตารางสถานที่ฝึก (จังหวัด/รพ.)
        const siteChannel = supabase
            .channel('realtime-sites')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'training_sites' }, () => {
                fetchSites()
            })
            .subscribe()

        // ติดตามการเปลี่ยนแปลงตารางพี่เลี้ยง
        const mentorChannel = supabase
            .channel('realtime-mentors')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'supervisors' }, () => {
                fetchMentors()
            })
            .subscribe()

        // ติดตามการเปลี่ยนแปลงตาราง Config (ปีที่อนุญาต)
        const configChannel = supabase
            .channel('realtime-configs')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'system_configs' }, () => {
                fetchConfigs()
            })
            .subscribe()

        // Clean up เมื่อปิดหน้าจอ
        return () => {
            supabase.removeChannel(siteChannel)
            supabase.removeChannel(mentorChannel)
            supabase.removeChannel(configChannel)
        }
    }, [])

    const validate = () => {
        let tempErrors: any = {}

        if (!form.student_code) {
            tempErrors.student_code = "กรุณากรอกรหัสนักศึกษา"
        }
        // เพิ่มการดักรหัส 2 ตัวหน้าตรงนี้
        else if (allowedBatch && !form.student_code.startsWith(allowedBatch)) {
            tempErrors.student_code = `(รหัสต้องขึ้นต้นด้วย ${allowedBatch} เท่านั้น)`
        }

        if (!form.first_name || !form.last_name) tempErrors.name = "กรุณากรอกชื่อ-นามสกุล"
        if (!avatarFile) tempErrors.avatar = "กรุณาใส่รูป"

        const mentorMissing = form.assignments.some((as: any) => as.supervisor_ids.length === 0)
        if (mentorMissing) tempErrors.rotation = "กรุณาเลือกพี่เลี้ยงอย่างน้อย 1 คนในทุกผลัด"

        setErrors(tempErrors)
        return Object.keys(tempErrors).length === 0
    }

    const handleAssignChange = (idx: number, field: string, value: any) => {
        setForm((prev: any) => {
            const newAssignments = [...prev.assignments]
            newAssignments[idx] = { ...newAssignments[idx], [field]: value }
            if (field === 'province') {
                newAssignments[idx].site_id = "";
                newAssignments[idx].supervisor_ids = [];
                newAssignments[idx].provinceSearch = value;
            }
            if (field === 'site_id') {
                newAssignments[idx].supervisor_ids = []; // ล้างพี่เลี้ยงเมื่อเปลี่ยน รพ.
            }
            return { ...prev, assignments: newAssignments }
        })
    }

    // ฟังก์ชันสำหรับ เพิ่ม/ลบ พี่เลี้ยงในลิสต์
    const addSupervisor = (idx: number, supervisorId: string) => {
        if (!supervisorId) return;
        const currentIds = [...form.assignments[idx].supervisor_ids];
        if (!currentIds.includes(supervisorId)) {
            currentIds.push(supervisorId);
            handleAssignChange(idx, 'supervisor_ids', currentIds);
        }
    }

    const removeSupervisor = (idx: number, supervisorId: string) => {
        const currentIds = form.assignments[idx].supervisor_ids.filter((id: string) => id !== supervisorId);
        handleAssignChange(idx, 'supervisor_ids', currentIds);
    }

    // const handleRegister = async () => {
    //     if (!validate()) return
    //     setLoading(true);
    //     try {
    //         const { data: check } = await supabase.from('students').select('id').eq('student_code', form.student_code).maybeSingle()
    //         if (check) { setLoading(false); return Swal.fire('ข้อมูลซ้ำ', 'รหัสนี้ลงทะเบียนแล้ว', 'error'); }

    //         const fileExt = avatarFile.name.split('.').pop();
    //         const fileName = `${form.student_code}_${Date.now()}.${fileExt}`;
    //         await supabase.storage.from('avatars').upload(fileName, avatarFile);
    //         const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

    //         const { data: student, error: stError } = await supabase.from('students').insert([{
    //             student_code: form.student_code, prefix: form.prefix, first_name: form.first_name,
    //             last_name: form.last_name, nickname: form.nickname, phone: form.phone,
    //             email: form.email, avatar_url: publicUrl
    //         }]).select().single();
    //         if (stError) throw stError;

    //         for (const as of form.assignments) {
    //             const { data: assignment, error: asError } = await supabase.from('student_assignments').insert([{
    //                 student_id: student.id, rotation_id: parseInt(as.rotation_id),
    //                 site_id: parseInt(as.site_id), status: 'active'
    //             }]).select().single();
    //             if (asError) throw asError;

    //             const mentorRecords = as.supervisor_ids.map((sId: any) => ({
    //                 assignment_id: assignment.id, supervisor_id: parseInt(sId)
    //             }));
    //             await supabase.from('assignment_supervisors').insert(mentorRecords);
    //         }

    //         Swal.fire({ icon: 'success', title: 'ลงทะเบียนสำเร็จ' });
    //     } catch (error: any) { Swal.fire('Error', error.message, 'error'); }
    //     finally { setLoading(false); }
    // };

    const handleRegister = async () => {
        if (!validate()) return;

        // 1. เช็คว่าเลือกรูปภาพหรือยัง
        if (!avatarFile) {
            return Swal.fire('กรุณาเลือกรูปภาพ', 'ต้องมีรูปโปรไฟล์นักศึกษาเพื่อลงทะเบียน', 'warning');
        }

        setLoading(true);
        try {
            // 2. เช็คข้อมูลซ้ำในระบบ
            const { data: check } = await supabase
                .from('students')
                .select('id')
                .eq('student_code', form.student_code)
                .maybeSingle();

            if (check) {
                setLoading(false);
                return Swal.fire('ข้อมูลซ้ำ', 'รหัสนี้ลงทะเบียนแล้ว', 'error');
            }

            // 3. จัดการอัปโหลดไฟล์รูปภาพ
            const fileExt = avatarFile!.name.split('.').pop();
            const fileName = `${form.student_code}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, avatarFile!);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // 4. บันทึกข้อมูลนักศึกษาลงตารางหลัก
            const { data: student, error: stError } = await supabase.from('students').insert([{
                student_code: form.student_code,
                prefix: form.prefix,
                first_name: form.first_name,
                last_name: form.last_name,
                nickname: form.nickname,
                phone: form.phone,
                email: form.email,
                avatar_url: publicUrl
            }]).select().single();

            if (stError) throw stError;

            // 5. บันทึกข้อมูลการมอบหมายสถานที่ฝึก (Assignments)
            // if (form.assignments && form.assignments.length > 0) {
            //     for (const as of form.assignments) {
            //         if (as.site_id) {
            //             const { data: assignment, error: asError } = await supabase
            //                 .from('student_assignments')
            //                 .insert([{
            //                     student_id: student.id, 
            //                     rotation_id: parseInt(as.rotation_id),
            //                     site_id: parseInt(as.site_id), 
            //                     status: 'active'
            //                 }]).select().single();

            //             if (asError) throw asError;

            //             // 6. บันทึกรายชื่อพี่เลี้ยง
            //             if (as.supervisor_ids && as.supervisor_ids.length > 0) {
            //                 const mentorRecords = as.supervisor_ids.map((sId: any) => ({
            //                     assignment_id: assignment.id, 
            //                     supervisor_id: parseInt(sId)
            //                 }));
            //                 await supabase.from('assignment_supervisors').insert(mentorRecords);
            //             }
            //         }
            //     }
            // }

            // 5. บันทึกข้อมูลการมอบหมายสถานที่ฝึก (Assignments)
            // 🚩 แก้ไขภายในฟังก์ชัน handleRegister
            // if (form.assignments && form.assignments.length > 0) {
            //     for (const as of form.assignments) {
            //         if (as.site_id) {
            //             // 🚩 1. ดึง "วิชาย่อยทั้งหมด" ที่ผูกกับผลัดนี้ออกมา 
            //             // เช่น ถ้าผลัดนี้คือ ผดุงครรภ์ จะได้ ID ของ ANC, LR, PP ออกมา 3 แถว
            //             const { data: rotSubjects } = await supabase
            //                 .from('rotation_subjects')
            //                 .select('subject_id')
            //                 .eq('rotation_id', parseInt(as.rotation_id));

            //             if (rotSubjects && rotSubjects.length > 0) {
            //                 // 🚩 2. ลูปบันทึกแยกทีละวิชาย่อยลง student_assignments
            //                 for (const rs of rotSubjects) {
            //                     const { data: assignment, error: asError } = await supabase
            //                         .from('student_assignments')
            //                         .insert([{
            //                             student_id: student.id,
            //                             rotation_id: parseInt(as.rotation_id),
            //                             subject_id: rs.subject_id, // ✅ บันทึก ID วิชาย่อย (ไม่เป็น NULL แล้ว)
            //                             site_id: parseInt(as.site_id),
            //                             status: 'active'
            //                         }]).select().single();

            //                     if (asError) throw asError;

            //                     // 🚩 3. บันทึกรายชื่อพี่เลี้ยงให้เชื่อมกับ "ทุกวิชาย่อย"
            //                     if (as.supervisor_ids && as.supervisor_ids.length > 0) {
            //                         const mentorRecords = as.supervisor_ids.map((sId: any) => ({
            //                             assignment_id: assignment.id, // เชื่อมกับ ID ของวิชาย่อยแต่ละอัน
            //                             supervisor_id: parseInt(sId),
            //                             is_evaluated: false
            //                         }));
            //                         await supabase.from('assignment_supervisors').insert(mentorRecords);
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }

            // 🚩 แก้ไขภายในฟังก์ชัน handleRegister (ส่วนที่ 5)
            // 🚩 5. บันทึกข้อมูลการมอบหมายสถานที่ฝึก (Assignments)
            // if (form.assignments && form.assignments.length > 0) {
            //     for (const as of form.assignments) {
            //         if (as.site_id) {
            //             // STEP A: ดึง ID วิชาหลักที่ผูกกับผลัดนี้จาก rotation_subjects
            //             const { data: rotSubs } = await supabase
            //                 .from('rotation_subjects')
            //                 .select('subject_id')
            //                 .eq('rotation_id', parseInt(as.rotation_id));

            //             if (rotSubs && rotSubs.length > 0) {
            //                 for (const rs of rotSubs) {
            //                     const mainSubjectId = rs.subject_id;

            //                     // STEP B: ไปเช็กในตาราง sub_subjects ว่าวิชาหลักนี้มี "วิชาย่อย" หรือไม่
            //                     const { data: subSubjects } = await supabase
            //                         .from('sub_subjects')
            //                         .select('id')
            //                         .eq('parent_subject_id', mainSubjectId);

            //                     if (subSubjects && subSubjects.length > 0) {
            //                         // 🚩 กรณีมีวิชาย่อย (เช่น ผดุงครรภ์ -> ANC, LR, PP)
            //                         // ให้บันทึกแยกแถวตามจำนวนวิชาย่อย
            //                         for (const sub of subSubjects) {
            //                             const { data: assignment, error: asError } = await supabase
            //                                 .from('student_assignments')
            //                                 .insert([{
            //                                     student_id: student.id,
            //                                     rotation_id: parseInt(as.rotation_id),
            //                                     subject_id: mainSubjectId,
            //                                     sub_subject_id: sub.id, // ✅ ใส่ ID วิชาย่อย (เช่น ANC)
            //                                     site_id: parseInt(as.site_id),
            //                                     status: 'active'
            //                                 }]).select().single();

            //                             if (asError) throw asError;

            //                             // บันทึกพี่เลี้ยงให้เชื่อมกับทุกวิชาย่อย
            //                             if (as.supervisor_ids && as.supervisor_ids.length > 0) {
            //                                 const mentorRecords = as.supervisor_ids.map((sId: any) => ({
            //                                     assignment_id: assignment.id,
            //                                     supervisor_id: parseInt(sId)
            //                                 }));
            //                                 await supabase.from('assignment_supervisors').insert(mentorRecords);
            //                             }

            //                         }
            //                     } else {
            //                         // 🚩 กรณีไม่มีวิชาย่อย (วิชาทั่วไป) -> บันทึก 1 แถวปกติ
            //                         const { data: assignment, error: asError } = await supabase
            //                             .from('student_assignments')
            //                             .insert([{
            //                                 student_id: student.id,
            //                                 rotation_id: parseInt(as.rotation_id),
            //                                 subject_id: mainSubjectId,
            //                                 sub_subject_id: null,
            //                                 site_id: parseInt(as.site_id),
            //                                 status: 'active'
            //                             }]).select().single();

            //                         if (asError) throw asError;

            //                         if (as.supervisor_ids && as.supervisor_ids.length > 0) {
            //                             const mentorRecords = as.supervisor_ids.map((sId: any) => ({
            //                                 assignment_id: assignment.id,
            //                                 supervisor_id: parseInt(sId)
            //                             }));
            //                             await supabase.from('assignment_supervisors').insert(mentorRecords);
            //                         }
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }



            if (form.assignments && form.assignments.length > 0) {
                for (const as of form.assignments) {
                    if (as.site_id) {
                        // STEP A: ดึง ID วิชาหลัก
                        const { data: rotSubs } = await supabase
                            .from('rotation_subjects')
                            .select('subject_id')
                            .eq('rotation_id', parseInt(as.rotation_id));

                        if (rotSubs && rotSubs.length > 0) {
                            for (const rs of rotSubs) {
                                const mainSubjectId = rs.subject_id;

                                // STEP B: เช็คว่ามีวิชาย่อยไหม
                                const { data: subSubjects } = await supabase
                                    .from('sub_subjects')
                                    .select('id')
                                    .eq('parent_subject_id', mainSubjectId);

                                if (subSubjects && subSubjects.length > 0) {
                                    // 🟢 CASE 1: มีวิชาย่อย (เช่น ผดุงครรภ์)

                                    // 1.1 วนลูปสร้างวิชาย่อย (ANC, LR, PP)
                                    for (const sub of subSubjects) {
                                        const { data: assignment, error: asError } = await supabase
                                            .from('student_assignments')
                                            .insert([{
                                                student_id: student.id,
                                                rotation_id: parseInt(as.rotation_id),
                                                subject_id: mainSubjectId,
                                                sub_subject_id: sub.id, // ใส่ ID วิชาย่อย
                                                site_id: parseInt(as.site_id),
                                                status: 'active'
                                            }]).select().single();

                                        if (asError) throw asError;

                                        // บันทึกพี่เลี้ยงวิชาย่อย
                                        if (as.supervisor_ids && as.supervisor_ids.length > 0) {
                                            const mentorRecords = as.supervisor_ids.map((sId: any) => ({
                                                assignment_id: assignment.id,
                                                supervisor_id: parseInt(sId)
                                            }));
                                            await supabase.from('assignment_supervisors').insert(mentorRecords);
                                        }
                                    }

                                    // 1.2 🚩 สร้าง "เล่มรายงาน/Portfolio" (ทำแค่ครั้งเดียว นอกลูป sub)
                                    const { data: mainAssign, error: mainErr } = await supabase
                                        .from('student_assignments')
                                        .insert([{
                                            student_id: student.id,
                                            rotation_id: parseInt(as.rotation_id),
                                            subject_id: mainSubjectId,
                                            sub_subject_id: null, // เป็น NULL คือเล่มรายงาน
                                            site_id: parseInt(as.site_id),
                                            status: 'active'
                                        }]).select().single();

                                    if (mainErr) throw mainErr;

                                    // บันทึกพี่เลี้ยงให้เล่มรายงานด้วย (จะได้เห็นทุกคน)
                                    if (as.supervisor_ids && as.supervisor_ids.length > 0) {
                                        const mainMentorRecords = as.supervisor_ids.map((sId: any) => ({
                                            assignment_id: mainAssign.id,
                                            supervisor_id: parseInt(sId)
                                        }));
                                        await supabase.from('assignment_supervisors').insert(mainMentorRecords);
                                    }

                                } else {
                                    // 🔵 CASE 2: วิชาทั่วไป (ไม่มีวิชาย่อย)
                                    const { data: assignment, error: asError } = await supabase
                                        .from('student_assignments')
                                        .insert([{
                                            student_id: student.id,
                                            rotation_id: parseInt(as.rotation_id),
                                            subject_id: mainSubjectId,
                                            sub_subject_id: null,
                                            site_id: parseInt(as.site_id),
                                            status: 'active'
                                        }]).select().single();

                                    if (asError) throw asError;

                                    if (as.supervisor_ids && as.supervisor_ids.length > 0) {
                                        const mentorRecords = as.supervisor_ids.map((sId: any) => ({
                                            assignment_id: assignment.id,
                                            supervisor_id: parseInt(sId)
                                        }));
                                        await supabase.from('assignment_supervisors').insert(mentorRecords);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // --- 7. ส่วนการ RESET FORM เมื่อสำเร็จ ---
            Swal.fire({
                icon: 'success',
                title: 'ลงทะเบียนสำเร็จ',
                text: 'ข้อมูลของคุณถูกบันทึกเข้าระบบเรียบร้อยแล้ว',
                timer: 2000,
                showConfirmButton: false
            });

            // รีเซ็ตค่าใน State ทั้งหมด
            setForm({
                student_code: '',
                prefix: 'นางสาว',
                first_name: '',
                last_name: '',
                nickname: '',
                phone: '',
                email: '',
                assignments: form.assignments.map((as: any) => ({
                    ...as,
                    site_id: '',
                    supervisor_ids: []
                }))
            });

            // ล้างรูปภาพที่เลือกไว้
            setAvatarFile(null);
            setAvatarPreview(null); // ถ้าคุณมี State สำหรับแสดงตัวอย่างรูป (Preview) อย่าลืมล้างตัวนี้ด้วย

        } catch (error: any) {
            console.error('Registration Error:', error);
            Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900 font-sans antialiased">
            <div className="bg-white border-b border-slate-100 py-10 text-center mb-10 shadow-sm">
                <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                    <GraduationCap className="text-white" size={36} />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-slate-800">Nurse Registry</h1>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-1">ระบบลงทะเบียนฝึกปฏิบัติงานปี 4</p>
            </div>

            <div className="max-w-md mx-auto px-5 space-y-4">
                <div className="flex flex-col items-center gap-3">
                    <div className={`w-36 h-36 rounded-[3rem] bg-white border-4 ${errors.avatar ? 'border-red-400' : 'border-white'} shadow-2xl flex items-center justify-center relative overflow-hidden ring-1 ring-slate-100 group`}>
                        {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover transition group-hover:scale-110" /> : <Camera size={40} className="text-slate-300" />}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold uppercase">คลิกเพื่อเปลี่ยนรูป</div>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
                        }} />
                    </div>
                    {errors.avatar && <span className="text-red-500 text-[11px] font-bold italic animate-bounce">*{errors.avatar}</span>}
                </div>

                <Card className="p-8 rounded-[3rem] border-none shadow-2xl shadow-blue-100/50 -space-y-2">
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-5 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">คำนำหน้า</label>
                            <div className="relative">
                                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select className="w-full h-14 rounded-2xl bg-slate-50 pl-11 pr-4 font-bold border-none appearance-none focus:ring-2 ring-blue-500 transition-all" value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })}>
                                    <option>นางสาว</option><option>นาย</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-span-7 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                รหัสนักศึกษา {allowedBatch && <span className="text-blue-500">(เฉพาะรหัส {allowedBatch})</span>}
                            </label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    className={`h-14 pl-11 rounded-2xl bg-slate-50 font-bold border-none focus:ring-2 ${errors.student_code ? 'ring-red-500' : 'ring-blue-500'}`}
                                    placeholder={`${allowedBatch || '6X'}XXXXXX`}
                                    value={form.student_code}
                                    onChange={e => setForm({ ...form, student_code: e.target.value })}
                                />
                            </div>
                            {errors.student_code && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.student_code}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อจริง</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input className="h-14 pl-11 rounded-2xl bg-slate-50 font-bold border-none" placeholder="ชื่อ" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                            </div>
                            {errors.first_name && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.first_name}</span>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">นามสกุล</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input className="h-14 pl-11 rounded-2xl bg-slate-50 font-bold border-none" placeholder="นามสกุล" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                            </div>
                            {errors.last_name && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.last_name}</span>}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-blue-500">ชื่อเล่น (NICKNAME)</label>
                        <div className="relative">
                            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                            <Input className="h-14 pl-11 rounded-2xl bg-blue-50/50 font-bold border-none text-blue-600 placeholder:text-blue-300" placeholder="ชื่อเล่น" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
                        </div>
                        {errors.nickname && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.nickname}</span>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">อีเมลติดต่อ</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input className="h-14 pl-11 rounded-2xl bg-slate-50 font-bold border-none" placeholder="example@psu.ac.th" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                        {errors.email && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.email}</span>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์ (10 หลัก)</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input className="h-14 pl-11 rounded-2xl bg-slate-50 font-bold border-none" placeholder="0XXXXXXXXX" value={form.phone} maxLength={10} onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') })} />
                        </div>
                        {errors.phone && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.phone}</span>}
                    </div>
                </Card>

                <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-3 px-2 pt-6">
                    <CalendarDays className="text-blue-600" size={28} /> Internship Plan
                </h3>
                {errors.rotation && <p className="bg-red-50 text-red-500 text-[11px] font-bold italic p-3 rounded-xl animate-pulse">*{errors.rotation}</p>}

                {form.assignments.map((item: any, idx: number) => (
                    <Card key={idx} className="p-8 rounded-[3rem] border-none shadow-2xl space-y-6 relative group hover:ring-2 ring-blue-500 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black italic shadow-lg shadow-blue-100">0{idx + 1}</div>
                            <div>
                                <span className="font-black text-sm uppercase tracking-tight block">{item.rotation_name}</span>
                                <span className="text-[10px] font-bold text-slate-400 italic">{item.dates}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Province & Hospital Select (เหมือนเดิม) */}
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input className="h-12 pl-12 rounded-xl bg-slate-50 border-none font-bold text-sm" placeholder="ระบุจังหวัดที่ฝึก..." onFocus={() => setOpenDropdownIndex(idx)} value={item.provinceSearch || ""} onChange={(e) => handleAssignChange(idx, 'provinceSearch', e.target.value)} />
                                {openDropdownIndex === idx && (
                                    <div className="absolute z-20 w-full mt-2 bg-white rounded-2xl shadow-2xl max-h-56 overflow-auto border border-slate-100 ring-1 ring-slate-200 py-2">
                                        {allProvinces.filter(p => !item.provinceSearch || p.includes(item.provinceSearch)).map(p => (
                                            <div key={p} className="px-5 py-3 hover:bg-blue-50 cursor-pointer font-bold text-sm text-slate-600 flex items-center justify-between" onClick={() => { handleAssignChange(idx, 'province', p); setOpenDropdownIndex(null); }}>
                                                {p} <span className="text-[10px] text-blue-300 uppercase font-black">Select</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <select className="w-full h-12 rounded-xl bg-slate-100/50 px-5 font-bold text-sm border-none focus:ring-2 ring-blue-500 appearance-none disabled:opacity-30" disabled={!item.province} value={item.site_id || ""} onChange={(e) => handleAssignChange(idx, 'site_id', e.target.value)}>
                                <option value="">เลือกโรงพยาบาลใน {item.province || 'จังหวัด'}</option>
                                {sites.filter((s: any) => String(s.province || "").trim() === String(item.province || "").trim()).map(s => (<option key={s.id} value={String(s.id)}>{s.site_name}</option>))}
                            </select>

                            {/* ปรับปรุงส่วนเลือกพี่เลี้ยงแบบเพิ่มทีละคน */}
                            <div className="bg-blue-50/50 p-5 rounded-3xl border border-blue-100 space-y-3">
                                <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-1 block italic">รายชื่อพี่เลี้ยงที่เลือก (SUPERVISORS)</label>

                                {/* แสดงรายชื่อที่เลือกแล้ว */}
                                <div className="space-y-2">
                                    {item.supervisor_ids.map((sId: string) => {
                                        const mentor = mentors.find((m: any) => String(m.id) === String(sId));
                                        return (
                                            <div key={sId} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-blue-100">
                                                <span className="text-xs font-bold text-blue-700">{mentor?.full_name || 'ไม่พบข้อมูล'}</span>
                                                <button onClick={() => removeSupervisor(idx, sId)} className="text-red-400 hover:text-red-600 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Dropdown สำหรับกดเพิ่มพี่เลี้ยง */}
                                <div className="pt-2">
                                    <select
                                        className="w-full bg-white h-10 rounded-lg px-4 font-bold text-slate-500 text-xs border border-blue-100 outline-none disabled:opacity-30 shadow-sm"
                                        disabled={!item.site_id}
                                        value=""
                                        onChange={(e) => addSupervisor(idx, e.target.value)}
                                    >
                                        <option value="">+ เพิ่มรายชื่อพี่เลี้ยง...</option>
                                        {/* {mentors
                                            .filter((m: any) => String(m.site_id) === String(item.site_id) && !item.supervisor_ids.includes(String(m.id)))
                                            .map((m: any) => (<option key={m.id} value={String(m.id)}>{m.full_name}</option>))
                                        } */}
                                        {mentors
                                            .filter((m: any) => {
                                                // 1. เช็กโรงพยาบาล (ต้องตรงกัน)
                                                const isSameSite = String(m.site_id) === String(item.site_id);

                                                // 2. เช็กวิชา (ถ้าใน m.supervisor_subjects มี subject_id ตรงกับผลัด)
                                                const teachesThisSubject = m.supervisor_subjects?.some((sub: any) =>
                                                    Number(sub.subject_id) === Number(item.subject_id)
                                                );

                                                // 3. ยังไม่ถูกเลือก
                                                const isNotSelected = !item.supervisor_ids.includes(String(m.id));

                                                return isSameSite && teachesThisSubject && isNotSelected;
                                            })
                                            .map((m: any) => (
                                                <option key={m.id} value={String(m.id)}>
                                                    {m.full_name}
                                                </option>
                                            ))
                                        }
                                    </select>
                                    {!item.site_id && <p className="text-[8px] text-blue-400 mt-1 ml-1 font-bold">* กรุณาเลือกโรงพยาบาลก่อน</p>}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}

                <Button onClick={handleRegister} disabled={loading} className="w-full h-24 bg-slate-900 hover:bg-black text-white rounded-[3rem] font-black text-2xl shadow-2xl transition-all active:scale-[0.97] mb-10">
                    {loading ? <Loader2 className="animate-spin mr-3" size={28} /> : <Save className="mr-3" size={28} />} {loading ? 'PROCESSING...' : 'CONFIRM & REGISTER'}
                </Button>
            </div>
        </div>
    )
}

// เพิ่มมอดอลนี้เข้าไปใน StudentManagement.tsx

// function StudentAddModal({ isOpen, onClose, sites, mentors, fetchData }: any) {
//     const [loading, setLoading] = useState(false);
//     const [siteSearch, setSiteSearch] = useState("");
//     const [activeEditIdx, setActiveEditIdx] = useState<number | null>(null);
//     const [form, setForm] = useState<any>({
//         student_code: '', prefix: 'นางสาว', first_name: '', last_name: '',
//         phone: '', email: '',
//         assignments: []
//     });

//     // เตรียมผลัดการฝึกอัตโนมัติเมื่อเปิดมอดอล
//     useEffect(() => {
//         if (isOpen) {
//             const initRotations = async () => {
//                 const { data } = await supabase.from('rotations').select('*').order('round_number', { ascending: true }).limit(3);
//                 if (data) {
//                     setForm((prev: any) => ({
//                         ...prev,
//                         assignments: data.map(r => ({
//                             rotation_id: r.id,
//                             rotation_name: r.name,
//                             site_id: "",
//                             supervisor_ids: []
//                         }))
//                     }));
//                 }
//             };
//             initRotations();
//         }
//     }, [isOpen]);

//     const handleSave = async () => {
//         if (!form.student_code || !form.first_name) return Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกรหัสและชื่อนักศึกษา', 'warning');

//         setLoading(true);
//         try {
//             // 1. เพิ่มนักศึกษา
//             const { data: student, error: stError } = await supabase.from('students').insert([{
//                 student_code: form.student_code, prefix: form.prefix,
//                 first_name: form.first_name, last_name: form.last_name,
//                 phone: form.phone, email: form.email
//             }]).select().single();
//             if (stError) throw stError;

//             // 2. เพิ่มผลัดและพี่เลี้ยง
//             for (const as of form.assignments) {
//                 if (as.site_id) {
//                     const { data: assignment } = await supabase.from('student_assignments').insert([{
//                         student_id: student.id, rotation_id: as.rotation_id,
//                         site_id: as.site_id, status: 'active'
//                     }]).select().single();

//                     if (as.supervisor_ids.length > 0) {
//                         const mentorRecords = as.supervisor_ids.map((sId: any) => ({
//                             assignment_id: assignment.id, supervisor_id: sId
//                         }));
//                         await supabase.from('assignment_supervisors').insert(mentorRecords);
//                     }
//                 }
//             }

//             Swal.fire({ icon: 'success', title: 'เพิ่มนักศึกษาสำเร็จ', timer: 1500, showConfirmButton: false });
//             fetchData();
//             onClose();
//         } catch (e: any) { Swal.fire('Error', e.message, 'error'); }
//         finally { setLoading(false); }
//     };

//     return (
//         <Dialog open={isOpen} onOpenChange={onClose}>
//             <DialogContent className="max-w-5xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
//                 <div className="flex flex-col h-[90vh]">
//                     <div className="px-10 py-6 border-b border-slate-50 flex justify-between items-center bg-blue-600 text-white">
//                         <div className="flex items-center gap-3">
//                             <Plus size={24} />
//                             <h2 className="text-xl font-black uppercase tracking-tight">เพิ่มนักศึกษาใหม่ (Manual Add)</h2>
//                         </div>
//                         <Button onClick={onClose} variant="ghost" className="text-white hover:bg-blue-700 rounded-full w-10 h-10 p-0"><X size={20} /></Button>
//                     </div>

//                     <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-10">
//                         {/* ส่วนข้อมูลส่วนตัว */}
//                         <div className="bg-slate-50 p-8 rounded-[2rem] space-y-6">
//                             <div className="grid grid-cols-3 gap-4">
//                                 <div className="space-y-2">
//                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสนักศึกษา</label>
//                                     <Input value={form.student_code} onChange={e => setForm({ ...form, student_code: e.target.value })} className="h-12 rounded-xl bg-white border-none font-bold shadow-sm" placeholder="เช่น 64XXXXX" />
//                                 </div>
//                                 <div className="space-y-2">
//                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อ</label>
//                                     <div className="flex gap-2">
//                                         <select className="h-12 rounded-xl bg-white border-none font-bold shadow-sm px-3 text-sm" value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })}>
//                                             <option>นางสาว</option><option>นาย</option>
//                                         </select>

//                                         <Input value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} className="h-12 rounded-xl bg-white border-none font-bold shadow-sm flex-1" />
//                                     </div>
//                                 </div>
//                                 <div className="space-y-2">
//                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">นามสกุล</label>
//                                     <Input value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} className="h-12 rounded-xl bg-white border-none font-bold shadow-sm" />
//                                 </div>
//                             </div>
//                         </div>

//                         {/* ส่วนจัดสรรผลัด */}
//                         <div className="space-y-6">
//                             <label className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
//                                 <Hospital size={18} className="text-blue-500" /> การจัดการสถานที่ฝึกงานและพี่เลี้ยง
//                             </label>
//                             <div className="grid grid-cols-1 gap-4">
//                                 {form.assignments.map((as: any, idx: number) => (
//                                     <div key={idx} className="p-6 border border-slate-100 rounded-[2rem] bg-white shadow-sm flex gap-6">
//                                         <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shrink-0">{idx + 1}</div>
//                                         <div className="flex-1 space-y-4">
//                                             <div className="relative">
//                                                 <Input
//                                                     placeholder="ค้นหา รพ./จังหวัด..."
//                                                     className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs"
//                                                     onFocus={() => setActiveEditIdx(idx)}
//                                                     onChange={(e) => setSiteSearch(e.target.value)}
//                                                 />
//                                                 {activeEditIdx === idx && (
//                                                     <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border p-2 max-h-40 overflow-auto">
//                                                         {sites.filter((s: any) => s.site_name.includes(siteSearch) || s.province.includes(siteSearch)).map((s: any) => (
//                                                             <div key={s.id} onClick={() => {
//                                                                 const nAs = [...form.assignments];
//                                                                 nAs[idx].site_id = s.id;
//                                                                 nAs[idx].site_name = s.site_name;
//                                                                 setForm({ ...form, assignments: nAs });
//                                                                 setActiveEditIdx(null);
//                                                             }} className="p-2 hover:bg-blue-50 cursor-pointer rounded-lg text-xs font-bold">{s.site_name} ({s.province})</div>
//                                                         ))}
//                                                     </div>
//                                                 )}
//                                                 {as.site_name && <p className="mt-1 text-blue-600 text-[10px] font-black uppercase">เลือกแล้ว: {as.site_name}</p>}
//                                             </div>

//                                             {/* เลือกพี่เลี้ยง */}
//                                             <div className="flex flex-wrap gap-2">
//                                                 {mentors.filter((m: any) => m.site_id === as.site_id).map((m: any) => (
//                                                     <button key={m.id} onClick={() => {
//                                                         const nAs = [...form.assignments];
//                                                         const current = nAs[idx].supervisor_ids;
//                                                         nAs[idx].supervisor_ids = current.includes(m.id) ? current.filter((id: any) => id !== m.id) : [...current, m.id];
//                                                         setForm({ ...form, assignments: nAs });
//                                                     }} className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all ${as.supervisor_ids.includes(m.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white text-slate-400 border-slate-100'}`}>{m.full_name}</button>
//                                                 ))}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>
//                     </div>

//                     <div className="p-8 border-t bg-slate-50">
//                         <Button onClick={handleSave} disabled={loading} className="w-full h-16 rounded-2xl bg-slate-900 font-black text-lg gap-3">
//                             {loading ? <Loader2 className="animate-spin" /> : <Save />} บันทึกและเพิ่มรายชื่อนักศึกษา
//                         </Button>
//                     </div>
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// }