// "use client"
// import { useState, useEffect } from 'react'
// import { createBrowserClient } from '@supabase/ssr'
// import { Camera, ShieldCheck, MapPin, Phone, User, Loader2, AlertCircle, ImagePlus } from 'lucide-react'
// import Swal from 'sweetalert2'

// export default function SmartRegister() {
//     const [fullName, setFullName] = useState('')
//     const [phone, setPhone] = useState('')
//     const [inviteCode, setInviteCode] = useState('')
//     const [selectedSite, setSelectedSite] = useState('')
//     const [sites, setSites] = useState<{ id: string, name: string }[]>([])
//     const [isSupervisor, setIsSupervisor] = useState(false)
//     const [loading, setLoading] = useState(false)
//     const [preview, setPreview] = useState<string | null>(null)
//     const [file, setFile] = useState<File | null>(null)
//     const [errors, setErrors] = useState<{ [key: string]: string }>({})

//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     // --- ส่วนเช็กอัตโนมัติ (Automated Check) ---
//     useEffect(() => {
//         const checkInviteCode = async () => {
//             const cleanCode = inviteCode.trim().toUpperCase();
//             setErrors(prev => ({ ...prev, inviteCode: '' }));

//             if (cleanCode.length >= 4) {
//                 // 1. ตรวจสอบรหัสพี่เลี้ยง
//                 const { data: siteData } = await supabase
//                     .from('training_sites')
//                     .select('id, site_name')
//                     .eq('invite_code', cleanCode);

//                 // 2. ตรวจสอบรหัสอาจารย์
//                 const { data: configData } = await supabase
//                     .from('system_configs')
//                     .select('key_value')
//                     .eq('key_name', 'teacher_invite_code')
//                     .eq('key_value', cleanCode);

//                 if (siteData && siteData.length > 0) {
//                     const site = siteData[0];
//                     setIsSupervisor(true);
//                     setSites([{ id: site.id, name: site.site_name }]);
//                     setSelectedSite(site.id);
//                 } else if (configData && configData.length > 0) {
//                     setIsSupervisor(false);
//                     setSelectedSite('');
//                 } else {
//                     setIsSupervisor(false);
//                     if (cleanCode.length >= 6) {
//                         setErrors(prev => ({ ...prev, inviteCode: 'ไม่พบรหัสเชิญในระบบ' }));
//                     }
//                 }
//             }
//         };
//         checkInviteCode();
//     }, [inviteCode]);

//     const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         const value = e.target.value.replace(/\D/g, '');
//         if (value.length <= 10) {
//             setPhone(value);
//             if (value.length === 10) {
//                 setErrors(prev => ({ ...prev, phone: '' }));
//             }
//         }
//     }

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true); // เริ่มหมุน

//         try {
//             // 1. ตรวจสอบไฟล์รูปภาพ (ต้องมีตามที่คุณต้องการ)
//             if (!file) {
//                 throw new Error("กรุณาแนบรูปถ่ายหน้าตรง");
//             }

//             // 2. อัปโหลดรูปภาพไปยัง Storage
//             const fileExt = file.name.split('.').pop();
//             const fileName = `${Date.now()}.${fileExt}`;
//             const { error: uploadError } = await supabase.storage
//                 .from('avatars')
//                 .upload(fileName, file);

//             if (uploadError) throw uploadError;

//             const { data: { publicUrl } } = supabase.storage
//                 .from('avatars')
//                 .getPublicUrl(fileName);

//             // 3. บันทึกข้อมูลลงตาราง supervisors
//             const { error: insertError } = await supabase
//                 .from('supervisors')
//                 .insert([{
//                     full_name: fullName,
//                     phone: phone,
//                     avatar_url: publicUrl,
//                     site_id: isSupervisor ? selectedSite : null, // ใช้ชื่อคอลัมน์ site_id ตามโครงสร้างใหม่ของคุณ
//                     role: isSupervisor ? 'supervisor' : 'teacher',
//                     is_verified: false
//                 }]);

//             if (insertError) throw insertError;

//             // ถ้าสำเร็จ
//             Swal.fire('สำเร็จ', 'ลงทะเบียนเรียบร้อยแล้ว กรุณารอการตรวจสอบ', 'success');

//         } catch (error: any) {
//             console.error("Submit Error:", error);
//             // แสดง Error ใต้อินพุตหรือใช้ Swal
//             Swal.fire('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถลงทะเบียนได้', 'error');
//         } finally {
//             setLoading(false); // หยุดหมุนเสมอ ไม่ว่าจะสำเร็จหรือไม่ก็ตาม
//         }
//     };

//     return (
//         <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans text-slate-900">
//             <div className="max-w-md mx-auto">
//                 <div className="text-center mb-8">
//                     <div className="inline-block p-3 bg-blue-600 rounded-3xl shadow-lg shadow-blue-200 mb-4 text-white">
//                         <ShieldCheck size={32} />
//                     </div>
//                     <h1 className="text-3xl font-black tracking-tight">ลงทะเบียนบุคลากร</h1>
//                     <p className="text-slate-500 mt-2">สำหรับอาจารย์และพี่เลี้ยงแหล่งฝึก</p>
//                 </div>

//                 <form onSubmit={handleSubmit} className="space-y-5">
//                     {/* ส่วนแนบรูปถ่าย */}
//                     <div className="flex flex-col items-center mb-7">
//                         <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-4">
//                             <ImagePlus size={18} className="text-blue-600" />
//                             แนบรูปถ่ายหน้าตรงของคุณ
//                         </p>
//                         <label className={`relative cursor-pointer transition-all hover:scale-105 active:scale-95 ${errors.file ? 'ring-4 ring-red-100 rounded-[2.5rem]' : ''}`}>
//                             <div className="w-36 h-36 rounded-[2.5rem] bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center">
//                                 {preview ? (
//                                     <img src={preview} className="w-full h-full object-cover" />
//                                 ) : (
//                                     <div className="flex flex-col items-center text-slate-300">
//                                         <Camera size={48} />
//                                         <span className="text-[10px] font-bold mt-2 uppercase tracking-widest text-slate-400">กดเพื่อแนบรูป</span>
//                                     </div>
//                                 )}
//                             </div>
//                             <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg border-4 border-[#F8FAFC]">
//                                 <Camera size={20} />
//                             </div>
//                             <input type="file" className="hidden" accept="image/*" onChange={(e) => {
//                                 if (e.target.files?.[0]) {
//                                     setFile(e.target.files[0]);
//                                     setPreview(URL.createObjectURL(e.target.files[0]));
//                                     setErrors(prev => ({ ...prev, file: '' }));
//                                 }
//                             }} />
//                         </label>
//                         {errors.file && <p className="text-red-500 text-xs font-bold mt-3 animate-bounce">{errors.file}</p>}
//                     </div>

//                     <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-5">
//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">ข้อมูลส่วนตัว</label>
//                             <div className="relative">
//                                 <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
//                                 <input
//                                     placeholder="ชื่อ-นามสกุลจริง"
//                                     className={`w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-2 outline-none transition-all ${errors.fullName ? 'border-red-200 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-blue-500 focus:bg-white'}`}
//                                     value={fullName} onChange={e => setFullName(e.target.value)}
//                                 />
//                             </div>
//                             {errors.fullName && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.fullName}</p>}
//                         </div>

//                         <div className="space-y-1">
//                             <div className="relative">
//                                 <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
//                                 <input
//                                     placeholder="เบอร์โทรศัพท์ (10 หลัก)"
//                                     className={`w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-2 outline-none transition-all ${errors.phone ? 'border-red-200 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-blue-500 focus:bg-white'}`}
//                                     value={phone} onChange={handlePhoneChange}
//                                 />
//                             </div>
//                             {errors.phone && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.phone}</p>}
//                         </div>

//                         <div className="space-y-1">
//                             <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">รหัสยืนยันสิทธิ์</label>
//                             <div className="relative">
//                                 <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
//                                 <input
//                                     placeholder="ระบุรหัสเชิญ"
//                                     className={`w-full h-14 pl-14 pr-6 rounded-2xl border-2 outline-none transition-all font-mono font-bold uppercase ${errors.inviteCode ? 'border-red-200 bg-red-50 text-red-600' : 'bg-blue-50/50 border-dashed border-blue-200 focus:border-blue-500 focus:bg-white text-blue-600'}`}
//                                     value={inviteCode} onChange={e => setInviteCode(e.target.value)}
//                                 />
//                             </div>
//                             {errors.inviteCode && <p className="text-red-500 text-[11px] font-bold ml-4 flex items-center gap-1"><AlertCircle size={12} /> {errors.inviteCode}</p>}
//                         </div>

//                         {isSupervisor && (
//                             <div className="space-y-2 pt-2 animate-in slide-in-from-top-4 duration-500">
//                                 <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">สถานที่ฝึกประสบการณ์</label>
//                                 <div className="relative">
//                                     <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
//                                     <select
//                                         className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none appearance-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
//                                         value={selectedSite} onChange={e => setSelectedSite(e.target.value)}
//                                     >
//                                         <option value="">เลือกโรงพยาบาล/แหล่งฝึก</option>
//                                         {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
//                                     </select>
//                                 </div>
//                                 {errors.site && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.site}</p>}
//                             </div>
//                         )}
//                     </div>

//                     <button
//                         disabled={loading}
//                         className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all disabled:bg-slate-300 disabled:active:scale-100 flex items-center justify-center gap-3"
//                     >
//                         {loading ? (
//                             <>
//                                 <Loader2 className="animate-spin" />
//                                 <span>กำลังบันทึกข้อมูล...</span>
//                             </>
//                         ) : (
//                             <span>ยืนยันการลงทะเบียน</span>
//                         )}
//                     </button>

//                     <p className="text-center text-[10px] text-slate-400 font-medium px-4">
//                         การลงทะเบียนหมายถึงคุณยอมรับให้ระบบเก็บรักษาข้อมูลส่วนบุคคลเพื่อใช้ในการประเมินผลการฝึกประสบการณ์วิชาชีพ
//                     </p>
//                 </form>
//             </div>
//         </div>
//     )
// }


// ver2

"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Camera, ShieldCheck, MapPin, Phone, User, Loader2, AlertCircle, ImagePlus, CheckCircle2, BookOpen } from 'lucide-react'
import Swal from 'sweetalert2'

export default function SmartRegister() {
    // --- State เดิม ---
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [selectedSite, setSelectedSite] = useState('')
    const [sites, setSites] = useState<{ id: string, name: string, province: string }[]>([])
    const [isSupervisor, setIsSupervisor] = useState(false)
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    // --- State ใหม่สำหรับวิชา ---
    const [allSubjects, setAllSubjects] = useState<any[]>([])
    const [subSubjects, setSubSubjects] = useState<any[]>([])
    const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]) // วิชาหลักที่เลือก
    const [selectedSubSubjects, setSelectedSubSubjects] = useState<number[]>([]) // วิชาย่อย (ANC, LR, PP)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )


    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 10) {
            setPhone(value);
            if (value.length === 10) {
                setErrors(prev => ({ ...prev, phone: '' }));
            }
        }
    }

    // ดึงข้อมูลวิชาและวิชาย่อยมาเตรียมไว้
    useEffect(() => {
        const fetchMasterData = async () => {
            const { data: subs } = await supabase.from('subjects').select('*').order('id');
            const { data: subSubs } = await supabase.from('sub_subjects').select('*').order('id');
            if (subs) setAllSubjects(subs);
            if (subSubs) setSubSubjects(subSubs);
        }
        fetchMasterData();
    }, []);

    // เช็ครหัสเชิญและดึงข้อมูลจังหวัด/หน่วยงาน
    useEffect(() => {
        const checkInviteCode = async () => {
            const cleanCode = inviteCode.trim().toUpperCase();
            if (cleanCode.length >= 4) {
                const { data: siteData } = await supabase
                    .from('training_sites')
                    .select('id, site_name, province')
                    .eq('invite_code', cleanCode);

                if (siteData && siteData.length > 0) {
                    const site = siteData[0];
                    setIsSupervisor(true);
                    setSites([{ id: site.id, name: site.site_name, province: site.province }]);
                    setSelectedSite(site.id);
                } else {
                    setIsSupervisor(false);
                }
            }
        };
        checkInviteCode();
    }, [inviteCode]);

    // จัดการการเลือกวิชาหลัก
    const toggleSubject = (id: number) => {
        setSelectedSubjects(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }

    // จัดการการเลือกวิชาย่อย
    const toggleSubSubject = (id: number) => {
        setSelectedSubSubjects(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || selectedSubjects.length === 0) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณาแนบรูปและเลือกวิชาที่รับผิดชอบ', 'warning');
            return;
        }

        setLoading(true);
        try {
            // 1. Upload รูป
            const fileName = `${Date.now()}.jpg`;
            await supabase.storage.from('avatars').upload(fileName, file);
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            // 2. บันทึกข้อมูลบุคลากร
            const { data: supervisor, error: insError } = await supabase
                .from('supervisors')
                .insert([{
                    full_name: fullName,
                    phone: phone,
                    avatar_url: publicUrl,
                    site_id: isSupervisor ? selectedSite : null,
                    role: isSupervisor ? 'supervisor' : 'teacher',
                    is_verified: false
                }]).select().single();

            if (insError) throw insError;

            // 3. บันทึกสิทธิ์วิชาลง supervisor_subjects
            const subjectInserts = [];

            // สำหรับวิชาที่ไม่มีวิชาย่อย หรือวิชาผดุงครรภ์
            for (const subId of selectedSubjects) {
                const relatedSubSubs = subSubjects.filter(ss => ss.parent_subject_id === subId);

                if (relatedSubSubs.length > 0) {
                    // ถ้าเป็นผดุงครรภ์ ให้บันทึกตามวิชาย่อยที่เลือก
                    const pickedSubSubs = selectedSubSubjects.filter(ssId =>
                        relatedSubSubs.some(rss => rss.id === ssId)
                    );
                    pickedSubSubs.forEach(ssId => {
                        subjectInserts.push({ supervisor_id: supervisor.id, subject_id: subId, sub_subject_id: ssId });
                    });
                } else {
                    // วิชาทั่วไป (นวด, เวช, ฯลฯ) บันทึกแบบ sub_subject_id เป็น null
                    subjectInserts.push({ supervisor_id: supervisor.id, subject_id: subId, sub_subject_id: null });
                }
            }

            if (subjectInserts.length > 0) {
                await supabase.from('supervisor_subjects').insert(subjectInserts);
            }

            Swal.fire('สำเร็จ', 'ลงทะเบียนเรียบร้อยแล้ว กรุณารอแอดมินอนุมัติ', 'success');
        } catch (error: any) {
            Swal.fire('Error', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 pb-20">
            <div className="max-w-md mx-auto space-y-8">
                {/* Header ส่วนเดิมของคุณ */}
                <div className="text-center">
                    <div className="inline-block p-4 bg-blue-600 rounded-[2rem] shadow-xl text-white mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-black">ลงทะเบียนบุคลากร</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ส่วนแนบรูปถ่าย */}
                    <div className="flex flex-col items-center mb-7">
                        <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-4">
                            <ImagePlus size={18} className="text-blue-600" />
                            แนบรูปถ่ายหน้า
                        </p>
                        <label className={`relative cursor-pointer transition-all hover:scale-105 active:scale-95 ${errors.file ? 'ring-4 ring-red-100 rounded-[2.5rem]' : ''}`}>
                            <div className="w-36 h-36 rounded-[2.5rem] bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center">
                                {preview ? (
                                    <img src={preview} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-300">
                                        <Camera size={48} />
                                        <span className="text-[10px] font-bold mt-2 uppercase tracking-widest text-slate-400">กดเพื่อแนบรูป</span>
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg border-4 border-[#F8FAFC]">
                                <Camera size={20} />
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setFile(e.target.files[0]);
                                    setPreview(URL.createObjectURL(e.target.files[0]));
                                    setErrors(prev => ({ ...prev, file: '' }));
                                }
                            }} />
                        </label>
                        {errors.file && <p className="text-red-500 text-xs font-bold mt-3 animate-bounce">{errors.file}</p>}
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">ข้อมูลส่วนตัว</label>
                            <div className="relative">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    placeholder="ชื่อ-นามสกุลจริง"
                                    className={`w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-2 outline-none transition-all ${errors.fullName ? 'border-red-200 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-blue-500 focus:bg-white'}`}
                                    value={fullName} onChange={e => setFullName(e.target.value)}
                                />
                            </div>
                            {errors.fullName && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.fullName}</p>}
                        </div>

                        <div className="space-y-1">
                            <div className="relative">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    placeholder="เบอร์โทรศัพท์ (10 หลัก)"
                                    className={`w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-2 outline-none transition-all ${errors.phone ? 'border-red-200 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-blue-500 focus:bg-white'}`}
                                    value={phone} onChange={handlePhoneChange}
                                />
                            </div>
                            {errors.phone && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.phone}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">รหัสยืนยันสิทธิ์</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                                <input
                                    placeholder="ระบุรหัสเชิญ"
                                    className={`w-full h-14 pl-14 pr-6 rounded-2xl border-2 outline-none transition-all font-mono font-bold uppercase ${errors.inviteCode ? 'border-red-200 bg-red-50 text-red-600' : 'bg-blue-50/50 border-dashed border-blue-200 focus:border-blue-500 focus:bg-white text-blue-600'}`}
                                    value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                                />
                            </div>
                            {errors.inviteCode && <p className="text-red-500 text-[11px] font-bold ml-4 flex items-center gap-1"><AlertCircle size={12} /> {errors.inviteCode}</p>}
                        </div>

                        {isSupervisor && (
                            <div className="space-y-2 pt-2 animate-in slide-in-from-top-4 duration-500">
                                <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">สถานที่ฝึกประสบการณ์</label>
                                <div className="relative">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                    <select
                                        className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none appearance-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                                        value={selectedSite} onChange={e => setSelectedSite(e.target.value)}
                                    >
                                        <option value="">เลือกโรงพยาบาล/แหล่งฝึก</option>
                                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                {errors.site && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.site}</p>}
                            </div>
                        )}
                    </div>
                    {/* ส่วนใหม่: เลือกวิชาที่รับผิดชอบ (แบบ 2 คอลัมน์) */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <BookOpen size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 leading-none">วิชาที่รับผิดชอบ</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select Subjects</p>
                            </div>
                        </div>

                        {/* ปรับเป็น Grid 2 คอลัมน์สำหรับวิชาหลัก */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {allSubjects.map(sub => {
                                const hasSub = subSubjects.some(ss => ss.parent_subject_id === sub.id);
                                const isSelected = selectedSubjects.includes(sub.id);

                                return (
                                    <div key={sub.id} className={`col-span-1 ${isSelected && hasSub ? 'sm:col-span-2' : ''} transition-all duration-300`}>
                                        <button
                                            type="button"
                                            onClick={() => toggleSubject(sub.id)}
                                            className={`w-full h-16 px-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${isSelected
                                                    ? 'border-blue-600 bg-blue-50/30 shadow-md shadow-blue-100'
                                                    : 'border-slate-100 bg-slate-50 hover:border-blue-200'
                                                }`}
                                        >
                                            <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>{sub.name}</span>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white scale-110' : 'border-slate-200 bg-white'
                                                }`}>
                                                {isSelected && <CheckCircle2 size={14} strokeWidth={3} />}
                                            </div>
                                        </button>

                                        {/* แสดงวิชาย่อยแบบแนวนอน (Horizontal Pill) */}
                                        {isSelected && hasSub && (
                                            <div className="mt-3 p-4 bg-blue-50/50 rounded-[1.5rem] border border-blue-100 animate-in zoom-in-95 duration-300">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 ml-1">วิชาย่อย / แผนกที่รับผิดชอบ</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {subSubjects.filter(ss => ss.parent_subject_id === sub.id).map(ss => (
                                                        <button
                                                            key={ss.id}
                                                            type="button"
                                                            onClick={() => toggleSubSubject(ss.id)}
                                                            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm ${selectedSubSubjects.includes(ss.id)
                                                                    ? 'bg-blue-600 text-white translate-y-[-2px] shadow-blue-200'
                                                                    : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
                                                                }`}
                                                        >
                                                            {ss.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <button disabled={loading} className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="animate-spin" /> : "ยืนยันการลงทะเบียน"}
                    </button>
                </form>
            </div>
        </div>
    )
}