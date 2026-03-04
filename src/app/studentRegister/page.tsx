// //ver4
"use client"
import { useState, useEffect, useCallback, useRef } from 'react'
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
    track: string;
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
    const [availableTracks, setAvailableTracks] = useState<string[]>(['A']);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)
    const [form, setForm] = useState<RegistrationForm>({
        student_code: '', prefix: '',
        first_name: '', last_name: '',
        nickname: '', phone: '',
        email: '',
        track: 'A',
        assignments: []
    })


    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('th-TH', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const initData = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const res = await fetch(`/api/register/student?action=init&track=${form.track}`)
            const result = await res.json()

            if (result.success) {
                const { trainingYear, rotations, sites, mentors, availableTracks: tracks } = result.data
                setTrainingYear(trainingYear)
                setSites(sites)
                setMentors(mentors)
                setAvailableTracks(tracks || ['A'])

                if (tracks && tracks.length > 0 && !tracks.includes(form.track)) {
                    setForm(prev => ({ ...prev, track: tracks[0] }));
                }

                if (rotations && rotations.length > 0) {
                    const initialAssignments = rotations.map((r: any) => {
                        const expandedSubjects: any[] = [];
                        (r.rotation_subjects || []).forEach((rs: any) => {
                            const subSubs = rs.subjects?.sub_subjects || [];
                            if (subSubs.length > 0) {
                                // Add Portfolio (Main Subject) - Admin calls it "ประเมินเล่ม"
                                expandedSubjects.push({
                                    subject_id: rs.subject_id,
                                    sub_subject_id: null,
                                    displayName: `${rs.subjects.name} (ประเมินเล่ม)`,
                                    supervisor_ids: [],
                                    isPortfolio: true,
                                    parentName: rs.subjects.name
                                });
                                // Add Sub-subjects
                                subSubs.forEach((ss: any) => {
                                    expandedSubjects.push({
                                        subject_id: rs.subject_id,
                                        sub_subject_id: ss.id,
                                        displayName: ss.name,
                                        supervisor_ids: [],
                                        isPortfolio: false,
                                        parentName: rs.subjects.name
                                    });
                                });
                            } else {
                                expandedSubjects.push({
                                    subject_id: rs.subject_id,
                                    sub_subject_id: null,
                                    displayName: rs.subjects?.name || 'ไม่ระบุวิชา',
                                    supervisor_ids: [],
                                    isPortfolio: false,
                                    parentName: rs.subjects?.name
                                });
                            }
                        });

                        return {
                            rotation_id: String(r.id),
                            rotation_name: r.name,
                            dates: `${formatDate(r.start_date)} - ${formatDate(r.end_date)}`,
                            site_id: '',
                            province: '',
                            provinceSearch: '',
                            subjects: expandedSubjects
                        };
                    });

                    setForm(prev => ({ ...prev, assignments: initialAssignments }));
                }

                // Province set up
                const uniqueProvinces = Array.from(new Set(sites.map((item: any) => item.province?.trim()).filter(Boolean))) as string[]
                setAllProvinces(uniqueProvinces.sort())
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initData();
    }, [form.track]);

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
    // Fetching handled by initData now
    useEffect(() => {
        // --- ระบบ REAL-TIME SUBSCRIPTION ---
        const handleRealtime = () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            debounceTimer.current = setTimeout(() => {
                initData(true) // Silent update
            }, 1500)
        }

        const siteChannel = supabase
            .channel('realtime-sites')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'training_sites' }, handleRealtime)
            .subscribe()

        const mentorChannel = supabase
            .channel('realtime-mentors')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'supervisors' }, handleRealtime)
            .subscribe()

        return () => {
            supabase.removeChannel(siteChannel)
            supabase.removeChannel(mentorChannel)
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        }
    }, [])

    const validate = () => {
        let tempErrors: any = {}

        if (!form.prefix) tempErrors.prefix = "กรุณาเลือกคำนำหน้า"

        if (!form.student_code) {
            tempErrors.student_code = "กรุณากรอกรหัสนักศึกษา"
        }
        if (!form.first_name || !form.last_name) tempErrors.name = "กรุณากรอกชื่อ-นามสกุล"
        if (!avatarFile) tempErrors.avatar = "กรุณาแนบรูปโปรไฟล์"
        if (!form.phone || form.phone.length < 10) tempErrors.phone = "กรุณากรอกเบอร์โทร 10 หลัก"

        // กรองการเลือกพี่เลี้ยงว่าครบทุกวิชา (ยกเว้น Portfolio ผดุงครรภ์ที่ระบบจะออโต้)
        const mentorMissing = form.assignments.some((as: any) =>
            as.subjects.some((sub: any) =>
                !sub.isPortfolio && sub.supervisor_ids.length === 0
            )
        )
        if (mentorMissing) tempErrors.rotation = "กรุณาเลือกพี่เลี้ยงให้ครบทุกรายวิชาในทุกผลัด"

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
                newAssignments[idx].provinceSearch = value;
                // ล้างพี่เลี้ยงในทุกวิชา
                newAssignments[idx].subjects = newAssignments[idx].subjects.map((s: any) => ({ ...s, supervisor_ids: [] }));
            }
            if (field === 'site_id') {
                newAssignments[idx].subjects = newAssignments[idx].subjects.map((s: any) => ({ ...s, supervisor_ids: [] }));
            }
            return { ...prev, assignments: newAssignments }
        })
    }

    const handleSubjectMentorToggle = (rotationIdx: number, subjectIdx: number, mentorId: number) => {
        setForm((prev: any) => {
            const newAssignments = [...prev.assignments];
            // 🚨 Fix mutation: clone assignment and subjects array
            newAssignments[rotationIdx] = {
                ...newAssignments[rotationIdx],
                subjects: [...newAssignments[rotationIdx].subjects]
            };

            const currentSubject = { ...newAssignments[rotationIdx].subjects[subjectIdx] };
            const currentIds = [...currentSubject.supervisor_ids];

            if (currentIds.includes(mentorId)) {
                currentSubject.supervisor_ids = currentIds.filter(id => id !== mentorId);
            } else {
                currentSubject.supervisor_ids = [...currentIds, mentorId];
            }

            newAssignments[rotationIdx].subjects[subjectIdx] = currentSubject;

            // Logic สำหรับ "ผดุงครรภ์" - Auto Sync Portfolio
            if (currentSubject.parentName?.includes('ผดุงครรภ์')) {
                const portfolioIdx = newAssignments[rotationIdx].subjects.findIndex((s: any) =>
                    s.parentName === currentSubject.parentName && s.isPortfolio
                );

                if (portfolioIdx !== -1) {
                    const allMidwiferyMentors = new Set<number>();
                    newAssignments[rotationIdx].subjects.forEach((s: any) => {
                        if (s.parentName === currentSubject.parentName && !s.isPortfolio) {
                            s.supervisor_ids.forEach((id: any) => allMidwiferyMentors.add(id));
                        }
                    });
                    newAssignments[rotationIdx].subjects[portfolioIdx] = {
                        ...newAssignments[rotationIdx].subjects[portfolioIdx],
                        supervisor_ids: Array.from(allMidwiferyMentors)
                    };
                }
            }

            return { ...prev, assignments: newAssignments };
        });
    };


    const handleRegister = async () => {
        if (!validate()) return;

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
            confirmButtonColor: '#1e293b',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'ยืนยันข้อมูลถูกต้อง',
            cancelButtonText: 'กลับไปแก้ไข',
        });

        if (!confirmResult.isConfirmed) return;

        setLoading(true);
        try {
            // 1. Storage Upload
            const fileExt = avatarFile!.name.split('.').pop();
            const fileName = `${form.student_code}_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, avatarFile!);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // 2. API Registration
            const res = await fetch('/api/register/student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentCode: form.student_code,
                    prefix: form.prefix,
                    firstName: form.first_name,
                    lastName: form.last_name,
                    nickname: form.nickname,
                    phone: form.phone,
                    email: form.email,
                    avatarUrl: publicUrl,
                    trainingYear: trainingYear,
                    track: form.track,
                    assignments: form.assignments
                })
            })

            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            // 3. Reset Form
            Swal.fire({
                icon: 'success',
                title: 'ลงทะเบียนสำเร็จ',
                text: 'ข้อมูลของคุณถูกบันทึกเข้าระบบเรียบร้อยแล้ว',
                timer: 2000,
                showConfirmButton: false
            });

            setForm({
                student_code: '',
                prefix: '',
                first_name: '',
                last_name: '',
                nickname: '',
                phone: '',
                email: '',
                track: 'A',
                assignments: form.assignments.map((as: any) => ({
                    ...as,
                    site_id: '',
                    supervisor_ids: []
                }))
            });

            setAvatarFile(null);
            setAvatarPreview(null);

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

                <Card className="p-7 rounded-[3rem] border-none shadow-2xl shadow-blue-100/50 space-y-2.5">
                    {/* Track Selection Section */}
                    <div className="space-y-3 pb-3 border-b border-slate-50">
                        <div className="flex items-center gap-2 ml-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">สายการฝึก (TRACK)</label>
                        </div>
                        <div className={`grid gap-2 ${availableTracks.length === 1 ? 'grid-cols-1' :
                            availableTracks.length === 2 ? 'grid-cols-2' :
                                'grid-cols-3'
                            }`}>
                            {availableTracks.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setForm(prev => ({ ...prev, track: t }))}
                                    className={`h-11 rounded-2xl font-black text-sm transition-all border-2 flex items-center justify-center ${form.track === t
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100 active:scale-95 text-xs'
                                        : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-emerald-200 hover:bg-white text-xs'
                                        }`}
                                >
                                    สาย {t}
                                </button>
                            ))}
                        </div>
                        <p className="text-[8px] text-slate-400 font-bold ml-1 italic leading-relaxed">
                            * ระบบจะเปลี่ยนชุดวิชาและวันที่ในผลัดฝึกตามสายที่เลือกอัตโนมัติ
                        </p>
                    </div>

                    {/* Student Info - Row 1 (Prefix & ID) */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-[4] min-w-[120px] space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">คำนำหน้า (title)</label>
                            <div className="relative">
                                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select className="w-full h-12 rounded-2xl bg-slate-50 pl-11 pr-4 font-bold border-none appearance-none focus:ring-2 ring-blue-500 transition-all text-sm outline-none"
                                    value={form.prefix}
                                    onChange={e => setForm({ ...form, prefix: e.target.value })}>
                                    <option value="" disabled>เลือก...</option>
                                    <option value="นาย">นาย</option>
                                    <option value="นางสาว">นางสาว</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex-[8] space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">รหัสนักศึกษา (studentid)</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input
                                    className={`h-12 pl-11 rounded-2xl bg-slate-50 font-bold border-none focus:ring-2 ${errors.student_code ? 'ring-red-500' : 'ring-blue-500'} cursor-not-allowed`}
                                    placeholder="รหัส นศ."
                                    value={form.student_code}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    {/* Row 2 (Name) */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อ (firstname)</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input className="h-12 rounded-2xl bg-slate-50 pl-11 font-bold border-none cursor-not-allowed text-sm"
                                    placeholder="ชื่อ" value={form.first_name} readOnly />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">นามสกุล (Lastname)</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input className="h-12 rounded-2xl bg-slate-50 pl-11 font-bold border-none cursor-not-allowed text-sm"
                                    placeholder="นามสกุล" value={form.last_name} readOnly />
                            </div>
                        </div>
                    </div>

                    {/* Other Info Sections (Unified spacing) */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1">ชื่อเล่น (NICKNAME)</label>
                        <div className="relative">
                            <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                            <Input className="h-12 pl-11 rounded-2xl bg-blue-50/30 font-extrabold border-none text-blue-700 placeholder:text-blue-200 outline-none focus:ring-2 ring-blue-100 transition-all text-sm" placeholder="ระบุชื่อเล่น..." value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
                        </div>
                        {errors.nickname && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.nickname}</span>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">อีเมลติดต่อ (E-mail)</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input className="h-12 pl-11 rounded-2xl bg-slate-50 font-bold border-none outline-none focus:ring-2 ring-blue-50 transition-all text-sm" placeholder="example@psu.ac.th" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                        {errors.email && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.email}</span>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เบอร์โทรศัพท์ (Phone)</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <Input className="h-12 pl-11 rounded-2xl bg-slate-50 font-bold border-none outline-none focus:ring-2 ring-blue-50 transition-all text-sm" placeholder="0XXXXXXXXX" value={form.phone} maxLength={10} onChange={e => setForm({ ...form, phone: e.target.value.replace(/[^0-9]/g, '') })} />
                        </div>
                        {errors.phone && <span className="text-red-500 text-[9px] font-bold italic ml-2">*{errors.phone}</span>}
                    </div>
                </Card>

                <div className="px-2 pt-6">
                    <h3 className="text-xl font-black text-slate-800 uppercase flex items-center gap-3">
                        <CalendarDays className="text-blue-600" size={28} /> Internship Plan
                    </h3>
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 italic mt-2 inline-block">
                        * หากมีพี่เลี้ยง 2 คน ให้เลือกทั้งสองคน
                    </p>
                </div>
                {errors.rotation && <p className="bg-red-50 text-red-500 text-[11px] font-bold italic p-3 rounded-xl animate-pulse">*{errors.rotation}</p>}

                {form.assignments.map((item: any, idx: number) => (
                    <Card key={idx} className="p-8 rounded-[3rem] border-none shadow-2xl space-y-1 relative group hover:ring-2 ring-blue-500 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 text-white w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black italic shadow-lg shadow-blue-100">0{idx + 1}</div>
                            <div>
                                <span className="font-black text-sm uppercase tracking-tight block">{item.rotation_name}</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {item.subject_names?.map((subName: string, sIdx: number) => (
                                        <span key={sIdx} className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-100">
                                            {subName}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 italic block mt-1">{item.dates}</span>
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

                            {/* Granular Subject & Mentor Selection */}
                            <div className="space-y-4 pt-2">
                                {item.subjects
                                    .filter((sub: any) => !(sub.parentName?.includes('ผดุงครรภ์') && sub.isPortfolio)) // ซ่อนประเมินเล่มผดุงครรภ์
                                    .map((sub: any, sIdx: number) => {
                                        const actualSubjectIdx = item.subjects.findIndex((s: any) => s === sub);
                                        return (
                                            <div key={sIdx} className="bg-white p-6 rounded-[2.5rem] border border-blue-100 shadow-sm relative group/sub transition-all hover:shadow-md hover:border-blue-200">
                                                <div className="text-[13px] font-black text-blue-600 mb-4 flex items-center gap-2">
                                                    <div className="w-1.5 h-4 rounded-full bg-blue-600 shadow-sm" />
                                                    {sub.displayName.toUpperCase()}
                                                </div>
                                                <div className="grid grid-cols-1 gap-2.5">
                                                    {mentors.filter((m: any) => {
                                                        const isSameSite = String(m.site_id) === String(item.site_id);
                                                        const isResponsible = m.supervisor_subjects?.some((ss: any) => {
                                                            const matchMain = String(ss.subject_id) === String(sub.subject_id);
                                                            if (sub.sub_subject_id) {
                                                                return matchMain && String(ss.sub_subject_id) === String(sub.sub_subject_id);
                                                            }
                                                            return matchMain;
                                                        });
                                                        return isSameSite && isResponsible;
                                                    }).map((m: any) => {
                                                        const isSelected = sub.supervisor_ids.includes(m.id);
                                                        return (
                                                            <button
                                                                key={m.id}
                                                                type="button"
                                                                onClick={() => handleSubjectMentorToggle(idx, actualSubjectIdx, m.id)}
                                                                className={`px-5 py-4 rounded-2xl text-[14px] font-bold border-2 transition-all active:scale-95 flex items-center gap-4 w-full text-left ${isSelected
                                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 ring-4 ring-blue-50/50'
                                                                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200 hover:bg-white hover:text-blue-600'
                                                                    }`}
                                                            >
                                                                <UserCircle size={20} className={`shrink-0 ${isSelected ? "text-blue-200" : "text-slate-300"}`} />
                                                                <span className="leading-tight flex-1">{m.full_name}</span>
                                                            </button>
                                                        );
                                                    })}

                                                    {item.site_id && mentors.filter((m: any) => {
                                                        const isSameSite = String(m.site_id) === String(item.site_id);
                                                        const isResponsible = m.supervisor_subjects?.some((ss: any) => {
                                                            const matchMain = String(ss.subject_id) === String(sub.subject_id);
                                                            if (sub.sub_subject_id) {
                                                                return matchMain && String(ss.sub_subject_id) === String(sub.sub_subject_id);
                                                            }
                                                            return matchMain;
                                                        });
                                                        return isSameSite && isResponsible;
                                                    }).length === 0 && (
                                                            <p className="text-[12px] text-slate-300 font-bold italic py-2">ไม่มีรายชื่อพี่เลี้ยงที่รับผิดชอบส่วนนี้</p>
                                                        )}

                                                    {!item.site_id && (
                                                        <p className="text-[12px] text-blue-300 font-bold italic py-2 opacity-50">* กรุณาเลือกโรงพยาบาลก่อน</p>
                                                    )}
                                                </div>
                                                {sub.supervisor_ids.length === 0 && !sub.isPortfolio && item.site_id && (
                                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white shadow-sm"></span>
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
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

