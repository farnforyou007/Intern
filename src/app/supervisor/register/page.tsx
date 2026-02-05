"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Camera, ShieldCheck, MapPin, Phone, User, Loader2, AlertCircle, ImagePlus } from 'lucide-react'
import Swal from 'sweetalert2'

export default function SmartRegister() {
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [selectedSite, setSelectedSite] = useState('')
    const [sites, setSites] = useState<{ id: string, name: string }[]>([])
    const [isSupervisor, setIsSupervisor] = useState(false)
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // --- ส่วนเช็กอัตโนมัติ (Automated Check) ---
    useEffect(() => {
        const checkInviteCode = async () => {
            const cleanCode = inviteCode.trim().toUpperCase();
            setErrors(prev => ({ ...prev, inviteCode: '' }));

            if (cleanCode.length >= 4) {
                // 1. ตรวจสอบรหัสพี่เลี้ยง
                const { data: siteData } = await supabase
                    .from('training_sites')
                    .select('id, site_name')
                    .eq('invite_code', cleanCode);

                // 2. ตรวจสอบรหัสอาจารย์
                const { data: configData } = await supabase
                    .from('system_configs')
                    .select('key_value')
                    .eq('key_name', 'teacher_invite_code')
                    .eq('key_value', cleanCode);

                if (siteData && siteData.length > 0) {
                    const site = siteData[0];
                    setIsSupervisor(true);
                    setSites([{ id: site.id, name: site.site_name }]);
                    setSelectedSite(site.id);
                } else if (configData && configData.length > 0) {
                    setIsSupervisor(false);
                    setSelectedSite('');
                } else {
                    setIsSupervisor(false);
                    if (cleanCode.length >= 6) {
                        setErrors(prev => ({ ...prev, inviteCode: 'ไม่พบรหัสเชิญในระบบ' }));
                    }
                }
            }
        };
        checkInviteCode();
    }, [inviteCode]);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 10) {
            setPhone(value);
            if (value.length === 10) {
                setErrors(prev => ({ ...prev, phone: '' }));
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // เริ่มหมุน

        try {
            // 1. ตรวจสอบไฟล์รูปภาพ (ต้องมีตามที่คุณต้องการ)
            if (!file) {
                throw new Error("กรุณาแนบรูปถ่ายหน้าตรง");
            }

            // 2. อัปโหลดรูปภาพไปยัง Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            // 3. บันทึกข้อมูลลงตาราง supervisors
            const { error: insertError } = await supabase
                .from('supervisors')
                .insert([{
                    full_name: fullName,
                    phone: phone,
                    avatar_url: publicUrl,
                    site_id: isSupervisor ? selectedSite : null, // ใช้ชื่อคอลัมน์ site_id ตามโครงสร้างใหม่ของคุณ
                    role: isSupervisor ? 'supervisor' : 'teacher',
                    is_verified: false
                }]);

            if (insertError) throw insertError;

            // ถ้าสำเร็จ
            Swal.fire('สำเร็จ', 'ลงทะเบียนเรียบร้อยแล้ว กรุณารอการตรวจสอบ', 'success');

        } catch (error: any) {
            console.error("Submit Error:", error);
            // แสดง Error ใต้อินพุตหรือใช้ Swal
            Swal.fire('เกิดข้อผิดพลาด', error.message || 'ไม่สามารถลงทะเบียนได้', 'error');
        } finally {
            setLoading(false); // หยุดหมุนเสมอ ไม่ว่าจะสำเร็จหรือไม่ก็ตาม
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 font-sans text-slate-900">
            <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-block p-3 bg-blue-600 rounded-3xl shadow-lg shadow-blue-200 mb-4 text-white">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">ลงทะเบียนบุคลากร</h1>
                    <p className="text-slate-500 mt-2">สำหรับอาจารย์และพี่เลี้ยงแหล่งฝึก</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ส่วนแนบรูปถ่าย */}
                    <div className="flex flex-col items-center mb-7">
                        <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-4">
                            <ImagePlus size={18} className="text-blue-600" />
                            แนบรูปถ่ายหน้าตรงของคุณ
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

                    <button
                        disabled={loading}
                        className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all disabled:bg-slate-300 disabled:active:scale-100 flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" />
                                <span>กำลังบันทึกข้อมูล...</span>
                            </>
                        ) : (
                            <span>ยืนยันการลงทะเบียน</span>
                        )}
                    </button>

                    <p className="text-center text-[10px] text-slate-400 font-medium px-4">
                        การลงทะเบียนหมายถึงคุณยอมรับให้ระบบเก็บรักษาข้อมูลส่วนบุคคลเพื่อใช้ในการประเมินผลการฝึกประสบการณ์วิชาชีพ
                    </p>
                </form>
            </div>
        </div>
    )
}