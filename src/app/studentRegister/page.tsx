// //ver4
"use client"
import { useState, useEffect, useCallback } from 'react'
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
import { jwtVerify } from 'jose'
import { decodeJwt } from 'jose';
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

interface RegistrationForm {
    student_code: string;
    prefix: string;
    first_name: string;
    last_name: string;
    nickname: string;
    phone: string;
    email: string;
    assignments: any[]; // หรือระบุ Type ของ assignment ให้ละเอียด
}

export default function StudentRegisterPage() {
    const [loading, setLoading] = useState(false)
    // const [allowedBatch, setAllowedBatch] = useState('')
    const [user, setUser] = useState<any>(null)
    const [allProvinces, setAllProvinces] = useState<string[]>([])
    const [sites, setSites] = useState<any[]>([])
    const [mentors, setMentors] = useState<any[]>([])
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null)
    const [errors, setErrors] = useState<any>({})
    const [isAuthenticating, setIsAuthenticating] = useState(true)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    // const [trainingYear, setTrainingYear] = useState('');
    const [trainingYear, setTrainingYear] = useState<string>('');
    const [rotations, setRotations] = useState<any[]>([]);
    const [form, setForm] = useState<RegistrationForm>({
        student_code: '', prefix: '',
        first_name: '', last_name: '',
        nickname: '', phone: '',
        email: '',
        // class_year: '4',
        assignments: []
    })


    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                const { data: config } = await supabase
                    .from('system_configs')
                    .select('key_value')
                    .eq('key_name', 'current_training_year')
                    .single();

                if (config) {
                    const year = config.key_value;
                    setTrainingYear(year);

                    // 🚩 แก้ไข Query: ดึง rotations พร้อม subjects ที่เกี่ยวข้อง
                    const { data: rots } = await supabase
                        .from('rotations')
                        .select(`
                        id, 
                        name, 
                        rotation_subjects (subject_id)
                    `)
                        .eq('academic_year', year)
                        .order('name', { ascending: true });

                    if (rots && rots.length > 0) {
                        const initialAssignments = rots.map((r: any) => ({
                            rotation_id: String(r.id),
                            rotation_name: r.name,
                            // 🚩 เก็บรายการ ID วิชาไว้เพื่อให้ Filter พี่เลี้ยงทำงานได้
                            subject_ids: r.rotation_subjects?.map((rs: any) => rs.subject_id) || [],
                            site_id: '',
                            supervisor_ids: []
                        }));

                        setForm(prev => ({ ...prev, assignments: initialAssignments }));
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, []);

    const handleAuth = useCallback(async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const jwtFromUrl = urlParams.get('jwt');
        const savedToken = localStorage.getItem('student_token');

        // ใช้ค่าจาก ENV ถ้าไม่มีให้ใช้ค่าสำรอง (Fallback) กันพัง
        const secretKey = process.env.NEXT_PUBLIC_JWT_SECRET;
        // console.log("Secret from ENV:", secretKey);
        if (!secretKey) {
            console.error("หา Secret Key ไม่เจอใน Environment Variable!");
            return;
        }

        const encodedSecret = new TextEncoder().encode(secretKey);

        try {
            // 1. ลำดับการเช็ค: เช็คจาก URL ก่อน (คนเพิ่ง Login) -> ถ้าไม่มีให้เช็คจาก LocalStorage (คนหน้าเดิม)
            const tokenToVerify = jwtFromUrl || savedToken;

            if (tokenToVerify) {
                const { payload } = await jwtVerify(tokenToVerify, encodedSecret, {
                    algorithms: ['HS256'],
                });

                setUser(payload);

                // ถ้าเป็น Token ใหม่จาก URL ให้บันทึกลงเครื่องและล้าง URL
                if (jwtFromUrl) {
                    localStorage.setItem('student_token', jwtFromUrl);
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        } catch (err) {
            console.error("Auth System Error:", err);
            // ถ้า Token ปลอมหรือหมดอายุ ให้ล้างค่าทิ้งเพื่อให้ Login ใหม่ได้
            localStorage.removeItem('student_token');
            setUser(null);
        } finally {
            // ✅ ไม่ว่าจะเกิดอะไรขึ้น ต้องปิดหน้า Loading เสมอ
            setIsAuthenticating(false);
        }
    }, []);

    useEffect(() => {
        handleAuth();
    }, [handleAuth]);


    useEffect(() => {
        if (user) {
            setForm((prev: any) => ({
                ...prev,
                student_code: user.username || '',
                first_name: user.first_name_th || '',
                last_name: user.last_name_th || '',
                email: user.email || ''
            }));
        }
    }, [user]);

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
            // setAllowedBatch(data.key_value);
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

        //  ดึงข้อมูลผลัด (ครั้งเดียว)
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
                .eq('academic_year', trainingYear)
                .order('round_number', { ascending: true })
            // .limit(3)

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

        if (!form.prefix) tempErrors.prefix = "กรุณาเลือกคำนำหน้า" // เช็คคำนำหน้า

        if (!form.student_code) {
            tempErrors.student_code = "กรุณากรอกรหัสนักศึกษา"
        }
        if (!form.first_name || !form.last_name) tempErrors.name = "กรุณากรอกชื่อ-นามสกุล"
        if (!avatarFile) tempErrors.avatar = "กรุณาแนบรูปโปรไฟล์"
        if (!form.phone || form.phone.length < 10) tempErrors.phone = "กรุณากรอกเบอร์โทร 10 หลัก"
        const mentorMissing = form.assignments.some((as: any) => as.supervisor_ids.length === 0)
        if (mentorMissing) tempErrors.rotation = "กรุณาเลือกพี่เลี้ยงอย่างน้อย 1 คนในทุกผลัด"

        setErrors(tempErrors)

        if (Object.keys(tempErrors).length > 0) {
            // รอให้ State อัปเดตแป๊บนึง แล้วหา Error ตัวแรก
            setTimeout(() => {
                const firstErrorElement = document.querySelector('.text-red-500');
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            return false;
        }
        return true;
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

    const handleRegister = async () => {
        if (!validate()) return;

        // 1. เช็คว่าเลือกรูปภาพหรือยัง
        if (!avatarFile) {
            return Swal.fire('กรุณาเลือกรูปภาพ', 'ต้องมีรูปโปรไฟล์นักศึกษาเพื่อลงทะเบียน', 'warning');
        }

        const confirmResult = await Swal.fire({
            title: 'ตรวจสอบข้อมูลอีกครั้ง?',
            html: `
            <div className="text-left text-sm space-y-1 font-sans">
                <p><b>ชื่อ-นามสกุล:</b> ${form.prefix}${form.first_name} ${form.last_name}</p>
                <p><b>รหัส:</b> ${form.student_code}</p>
                <p><b>เบอร์โทร:</b> ${form.phone}</p>
                <hr className="my-2"/>
                <p className="text-center text-blue-600 font-bold">กรุณาตรวจสอบ "พี่เลี้ยง" และ "โรงพยาบาล" ในทุกผลัดให้ถูกต้องก่อนยืนยัน</p>
            </div>
        `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e293b', // Slate-900
            cancelButtonColor: '#cbd5e1', // Slate-300
            confirmButtonText: 'ยืนยันข้อมูลถูกต้อง',
            cancelButtonText: 'กลับไปแก้ไข',
        });

        if (!confirmResult.isConfirmed) return;

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
                avatar_url: publicUrl,
                training_year: trainingYear
            }]).select().single();

            if (stError) throw stError;

            // 🚩 แก้ไข Logic ให้รัดกุม: กรองตามวิชาที่สอนเท่านั้น (รวมถึงเล่มรายงานด้วย)
            // 27/2/69
            // if (form.assignments && form.assignments.length > 0) {
            //     for (const as of form.assignments) {
            //         if (as.site_id) {
            //             const { data: rotSubs } = await supabase
            //                 .from('rotation_subjects')
            //                 .select('subject_id')
            //                 .eq('rotation_id', parseInt(as.rotation_id));

            //             if (rotSubs && rotSubs.length > 0) {
            //                 for (const rs of rotSubs) {
            //                     const mainSubjectId = rs.subject_id;

            //                     // 🚩 ฟังก์ชัน Helper สำหรับกรองพี่เลี้ยงที่ "สอนวิชานี้" และ "อยู่รพ. นี้"
            //                     // const getValidMentorRecords = (assignmentId: number, targetSubjectId: number) => {
            //                     //     return mentors
            //                     //         .filter(m => 
            //                     //             as.supervisor_ids.includes(String(m.id)) && 
            //                     //             String(m.site_id) === String(as.site_id) && 
            //                     //             m.supervisor_subjects?.some((ss: any) => Number(ss.subject_id) === Number(targetSubjectId))
            //                     //         )
            //                     //         .map((m: any) => ({
            //                     //             assignment_id: assignmentId,
            //                     //             supervisor_id: m.id
            //                     //         }));
            //                     // };

            //                     // 🚩 ปรับปรุง Logic การบันทึกพี่เลี้ยงให้เช็คทั้งวิชาหลักและวิชาย่อย (page.tsx)
            //                     //27/2/69
            //                     const getValidMentorRecords = (assignmentId: number, mainSubjectId: number, subSubjectId: number | null) => {
            //                         return mentors.filter(m => {
            //                             // 1. ตรวจสอบว่าเป็นพี่เลี้ยงที่นักศึกษาเลือก และอยู่ รพ. เดียวกัน
            //                             const isSelected = as.supervisor_ids.includes(String(m.id));
            //                             const isSameSite = String(m.site_id) === String(as.site_id);

            //                             if (!isSelected || !isSameSite) return false;

            //                             // 2. ตรวจสอบความรับผิดชอบในวิชา
            //                             return m.supervisor_subjects?.some((ss: any) => {
            //                                 const matchMain = Number(ss.subject_id) === Number(mainSubjectId);

            //                                 // กรณีเป็นวิชาย่อย (เช่น PP): ต้องเช็คว่า ss.sub_subject_id ตรงกันด้วย
            //                                 if (subSubjectId !== null) {
            //                                     return matchMain && Number(ss.sub_subject_id) === Number(subSubjectId);
            //                                 }

            //                                 // กรณีเป็นวิชาหลัก/เล่มรายงาน: เช็คแค่ subject_id และ sub_subject_id ใน DB ต้องเป็น NULL
            //                                 return matchMain && (ss.sub_subject_id === null);
            //                             });
            //                         }).map((m: any) => ({
            //                             assignment_id: assignmentId,
            //                             supervisor_id: m.id
            //                         }));
            //                     };

            //                     // --- ตอนเรียกใช้งานในลูป ---

            //                     // 🟢 สำหรับวิชาย่อย (ANC, LR, PP)
            //                     const mentorRecords = getValidMentorRecords(assignment.id, mainSubjectId, sub.id); // ส่ง sub.id เข้าไปด้วย
            //                     if (mentorRecords.length > 0) {
            //                         await supabase.from('assignment_supervisors').insert(mentorRecords);
            //                     }

            //                     // 🔵 สำหรับวิชาทั่วไป หรือ เล่มรายงาน
            //                     const mainMentorRecords = getValidMentorRecords(mainAssign.id, mainSubjectId, null); // ส่ง null สำหรับวิชาหลัก
            //                     if (mainMentorRecords.length > 0) {
            //                         await supabase.from('assignment_supervisors').insert(mainMentorRecords);
            //                     }

            //                     const { data: subSubjects } = await supabase
            //                         .from('sub_subjects')
            //                         .select('id')
            //                         .eq('parent_subject_id', mainSubjectId);

            //                     if (subSubjects && subSubjects.length > 0) {
            //                         // 🟢 CASE 1: มีวิชาย่อย (เช่น ผดุงครรภ์)
            //                         for (const sub of subSubjects) {
            //                             const { data: assignment, error: asError } = await supabase
            //                                 .from('student_assignments')
            //                                 .insert([{
            //                                     student_id: student.id,
            //                                     rotation_id: parseInt(as.rotation_id),
            //                                     subject_id: mainSubjectId,
            //                                     sub_subject_id: sub.id,
            //                                     site_id: parseInt(as.site_id),
            //                                     status: 'active'
            //                                 }]).select().single();

            //                             if (asError) throw asError;

            //                             // ✅ ใส่เฉพาะพี่เลี้ยงที่สอนวิชานี้ (เช่น อิฟฟานที่สอน ANC/LR จะไม่ติดมาใน PP)
            //                             const mentorRecords = getValidMentorRecords(assignment.id, mainSubjectId);
            //                             if (mentorRecords.length > 0) {
            //                                 await supabase.from('assignment_supervisors').insert(mentorRecords);
            //                             }
            //                         }

            //                         // 1.2 เล่มรายงาน (Portfolio) ของวิชานี้
            //                         const { data: mainAssign, error: mainErr } = await supabase
            //                             .from('student_assignments')
            //                             .insert([{
            //                                 student_id: student.id,
            //                                 rotation_id: parseInt(as.rotation_id),
            //                                 subject_id: mainSubjectId,
            //                                 sub_subject_id: null, // เล่มรายงาน
            //                                 site_id: parseInt(as.site_id),
            //                                 status: 'active'
            //                             }]).select().single();

            //                         if (mainErr) throw mainErr;

            //                         // ✅ แก้ไข: เล่มรายงานก็ต้องกรอง! 
            //                         // ปาณิที่สอนแค่นวดไทย จะไม่ถูกดึงมาใส่ในเล่มรายงานผดุงครรภ์
            //                         const mainMentorRecords = getValidMentorRecords(mainAssign.id, mainSubjectId);
            //                         if (mainMentorRecords.length > 0) {
            //                             await supabase.from('assignment_supervisors').insert(mainMentorRecords);
            //                         }

            //                     } else {
            //                         // 🔵 CASE 2: วิชาทั่วไป (เช่น นวดไทย)
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

            //                         const mentorRecords = getValidMentorRecords(assignment.id, mainSubjectId);
            //                         if (mentorRecords.length > 0) {
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
                        // STEP 1: ดึงรายชื่อวิชาทั้งหมดในผลัดนั้น
                        const { data: rotSubs } = await supabase
                            .from('rotation_subjects')
                            .select('subject_id')
                            .eq('rotation_id', parseInt(as.rotation_id));

                        if (rotSubs && rotSubs.length > 0) {
                            for (const rs of rotSubs) {
                                const mainSubjectId = rs.subject_id;

                                // 🚩 ฟังก์ชัน Helper สำหรับบันทึกพี่เลี้ยง (ย้ายมาไว้ตรงนี้เพื่อให้เรียกใช้ได้ทุก Case)
                                // 🚩 ฟังก์ชัน Helper ที่ปรับปรุงใหม่เพื่อให้พี่เลี้ยงเข้าเล่มรายงานได้
                                const saveMentorsForAssignment = async (targetAssignmentId: number, targetMainSub: number, targetSubSub: number | null) => {
                                    const validMentorRecords = mentors.filter(m => {
                                        const isSelected = as.supervisor_ids.includes(String(m.id));
                                        const isSameSite = String(m.site_id) === String(as.site_id);
                                        if (!isSelected || !isSameSite) return false;

                                        return m.supervisor_subjects?.some((ss: any) => {
                                            const matchMain = Number(ss.subject_id) === Number(targetMainSub);

                                            // 🟢 Case 1: ถ้าเป็นวิชาย่อย (ANC, LR, PP)
                                            // ต้องตรงทั้งวิชาหลัก และวิชาย่อยเป๊ะๆ (อิฟฟานเลยไม่ติด PP)
                                            if (targetSubSub !== null) {
                                                return matchMain && Number(ss.sub_subject_id) === Number(targetSubSub);
                                            }

                                            // 🔵 Case 2: ถ้าเป็นเล่มรายงาน (Portfolio) หรือวิชาที่ไม่มีวิชาย่อย
                                            // ให้ยอมรับถ้าพี่เลี้ยงสอนวิชาหลักนั้น (null) หรือ สอนวิชาย่อยใดๆ ของวิชานั้น
                                            return matchMain;
                                        });
                                    }).map((m: any) => ({
                                        assignment_id: targetAssignmentId,
                                        supervisor_id: m.id
                                    }));

                                    if (validMentorRecords.length > 0) {
                                        await supabase.from('assignment_supervisors').insert(validMentorRecords);
                                    }
                                };

                                // STEP 2: ตรวจสอบวิชาย่อย (ANC, LR, PP)
                                const { data: subSubjects } = await supabase
                                    .from('sub_subjects')
                                    .select('id')
                                    .eq('parent_subject_id', mainSubjectId);

                                if (subSubjects && subSubjects.length > 0) {
                                    // 🟢 CASE 1: มีวิชาย่อย
                                    for (const sub of subSubjects) {
                                        const { data: subAssign, error: asError } = await supabase
                                            .from('student_assignments')
                                            .insert([{
                                                student_id: student.id,
                                                rotation_id: parseInt(as.rotation_id),
                                                subject_id: mainSubjectId,
                                                sub_subject_id: sub.id,
                                                site_id: parseInt(as.site_id),
                                                status: 'active'
                                            }]).select().single();

                                        if (asError) throw asError;
                                        if (subAssign) await saveMentorsForAssignment(subAssign.id, mainSubjectId, sub.id);
                                    }

                                    // 1.2 สร้างเล่มรายงาน (Portfolio)
                                    const { data: mainAssign, error: mainErr } = await supabase
                                        .from('student_assignments')
                                        .insert([{
                                            student_id: student.id,
                                            rotation_id: parseInt(as.rotation_id),
                                            subject_id: mainSubjectId,
                                            sub_subject_id: null,
                                            site_id: parseInt(as.site_id),
                                            status: 'active'
                                        }]).select().single();

                                    if (mainErr) throw mainErr;
                                    if (mainAssign) await saveMentorsForAssignment(mainAssign.id, mainSubjectId, null);

                                } else {
                                    // 🔵 CASE 2: วิชาทั่วไป (ไม่มีวิชาย่อย)
                                    const { data: singleAssign, error: asError } = await supabase
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
                                    if (singleAssign) await saveMentorsForAssignment(singleAssign.id, mainSubjectId, null);
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
                prefix: '',
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

    if (isAuthenticating) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-white">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <GraduationCap className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 text-blue-600" size={24} />
                </div>
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Checking Authorization...</p>
            </div>
        )
    }

    // if (!user) {
    //     return (
    //         <div className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
    //             <Card className="max-w-md w-full p-10 rounded-[3rem] text-center space-y-6 shadow-2xl">
    //                 <div className="bg-[#193C6C] w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
    //                     <Hospital className="text-white" size={40} />
    //                 </div>
    //                 <div className="space-y-2">
    //                     <h2 className="text-2xl font-black uppercase">Internship Registry</h2>
    //                     <p className="text-slate-500 text-sm">กรุณาเข้าสู่ระบบด้วย PSU One Passport<br />เพื่อดำเนินการลงทะเบียนฝึกงาน</p>
    //                 </div>
    //                 <a href={process.env.NEXT_PUBLIC_LOGIN_URL}>
    //                     <Button className="w-full h-16 bg-[#193C6C] hover:bg-[#294787] rounded-2xl font-black text-lg gap-3">
    //                         🔑 เข้าสู่ระบบด้วย PSU One Passport
    //                     </Button>
    //                 </a>
    //             </Card>
    //         </div>
    //     )
    // }


    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <Card className="max-w-sm w-full p-8 rounded-[3rem] text-center space-y-8 shadow-2xl border-none">
                    <div className="bg-[#193C6C] w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl ring-8 ring-blue-50">
                        <Hospital className="text-white" size={32} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Internship</h2>
                        <p className="text-slate-400 text-xs font-bold leading-relaxed">
                            กรุณาเข้าสู่ระบบด้วย PSU Passport<br />เพื่อดำเนินการลงทะเบียนฝึกงาน
                        </p>
                    </div>
                    <a href={process.env.NEXT_PUBLIC_LOGIN_URL} className="block">
                        <Button className="w-full py-8 bg-[#193C6C] hover:bg-[#294787] rounded-2xl font-black text-base shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 px-4">
                            <UserCircle size={24} className="shrink-0" />
                            <span className="whitespace-normal leading-tight">LOGIN WITH PSU PASSPORT</span>
                        </Button>
                    </a>
                </Card>
            </div>
        )
    }
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900 font-sans antialiased">
            {/* <div className="bg-white border-b border-slate-100 py-8 text-center mb-10 shadow-sm">
                <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                    <GraduationCap className="text-white" size={36} />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-slate-800">Student Registry</h1>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-1">ระบบลงทะเบียนฝึกปฏิบัติงาน</p>

            </div>

            {trainingYear && (
                <div className="bg-blue-50 border border-blue-100 p-2 rounded-[2rem] mb-4 flex items-center justify-between px-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-2 rounded-xl text-white">
                            <CalendarDays size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">รอบปีการศึกษาที่เปิดรับ</p>
                            <p className="text-lg font-black text-blue-700">ปีการศึกษา {trainingYear}</p>
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <span className="bg-blue-100 text-blue-600 text-[10px] font-black px-3 py-1 rounded-full">ACTIVE NOW</span>
                    </div>
                </div>
            )} */}

            <div className="bg-white border-b border-slate-100 py-10 text-center mb-10 shadow-sm relative overflow-hidden">
                {/* ส่วนตกแต่ง Background เบาๆ */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10"></div>

                <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 transition-transform hover:scale-105 duration-300">
                    <GraduationCap className="text-white" size={36} />
                </div>

                <h1 className="text-3xl font-black uppercase tracking-tight text-slate-800">Student Registry</h1>

                <div className="flex flex-col items-center gap-1 mt-1">
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em]">
                        ระบบลงทะเบียนฝึกปฏิบัติงาน
                    </p>

                    {/* แสดงปีการศึกษาแบบเรียบง่ายใต้ชื่อระบบ */}
                    {trainingYear && (
                        <div className="flex items-center gap-1.5 mt-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                ปีการศึกษาที่ฝึกงาน : <span className="text-blue-600">{trainingYear}</span>
                            </p>
                        </div>
                    )}
                </div>
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
                                <select className="w-full h-14 rounded-2xl bg-slate-50 pl-11 pr-4 font-bold border-none appearance-none focus:ring-2 ring-blue-500 transition-all"
                                    value={form.prefix}
                                    onChange={e => setForm({ ...form, prefix: e.target.value })}>
                                    <option value="" disabled>เลือก...</option>
                                    <option value="นาย">นาย</option>
                                    <option value="นางสาว">นางสาว</option>
                                </select>
                            </div>
                            {errors.prefix && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.prefix}</span>}
                        </div>
                        <div className="col-span-7 space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                รหัสนักศึกษา
                            </label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    className={`h-14 pl-11 rounded-2xl bg-slate-50 font-bold border-none focus:ring-2 ${errors.student_code ? 'ring-red-500' : 'ring-blue-500'}`}
                                    placeholder="67xxxxxxxxx"
                                    value={form.student_code}
                                    readOnly
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
                                <Input className="h-14 pl-11 rounded-2xl bg-slate-50 font-bold border-none"
                                    placeholder="ชื่อ" value={form.first_name}
                                    readOnly
                                    onChange={e => setForm({ ...form, first_name: e.target.value })} />
                            </div>
                            {errors.first_name && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.first_name}</span>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">นามสกุล</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input className="h-14 pl-11 rounded-2xl bg-slate-50 font-bold border-none"
                                    placeholder="นามสกุล"
                                    readOnly
                                    value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
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
                                                    // Number(sub.subject_id) === Number(item.subject_id)
                                                    item.subject_ids?.includes(sub.subject_id)
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
                    {loading ? <Loader2 className="animate-spin mr-3" size={28} /> : <Save className="mr-3" size={28} />} {loading ? 'กำลังประมวลผล...' : 'ยืนยันการลงทะเบียน'}
                </Button>
            </div>
        </div>
    )
}

