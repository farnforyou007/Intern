// version not invite code 
"use client"
export const dynamic = 'force-dynamic'
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    Camera, MapPin, Phone, User, Loader2, ImagePlus,
    CheckCircle2, BookOpen, Building2, ChevronDown, UserCircle2, Hospital, Mail
} from 'lucide-react'
import Swal from 'sweetalert2'
import liff from '@line/liff'
import { flexRegisterSuccess } from '@/lib/lineFlex';
import { getLineUserId } from '@/utils/auth';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react'

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    )
}

function RegisterForm() {
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [preview, setPreview] = useState<string | null>(null)
    const [file, setFile] = useState<File | null>(null)
    const [lineUserId, setLineUserId] = useState<string | null>(null)
    const [lineDisplayName, setLineDisplayName] = useState<string>('')
    const [linePictureUrl, setLinePictureUrl] = useState<string>('')

    // --- State สำหรับแยกประเภทผู้ใช้ ---
    const [userType, setUserType] = useState<'supervisor' | 'teacher'>('supervisor')

    // --- State สำหรับระบบค้นหาสถานที่ (Searchable Dropdown) ---
    const [allSites, setAllSites] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [selectedSite, setSelectedSite] = useState<any>(null)
    const [isAuthenticating, setIsAuthenticating] = useState(true) // New state
    const [authError, setAuthError] = useState<string | null>(null) // Error message for auth failures
    const dropdownRef = useRef<HTMLDivElement>(null)

    // --- State สำหรับวิชาที่รับผิดชอบ ---
    const [allSubjects, setAllSubjects] = useState<any[]>([])
    const [subSubjects, setSubSubjects] = useState<any[]>([])
    const [selectedSubjects, setSelectedSubjects] = useState<number[]>([])
    const [selectedSubSubjects, setSelectedSubSubjects] = useState<number[]>([])

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const searchParams = useSearchParams();

    useEffect(() => {
        const initLiff = async () => {
            setIsAuthenticating(true);
            setAuthError(null);
            try {
                // 1. Check for User ID (Debug or Search Params)
                const lineId = await getLineUserId(searchParams);
                const isDebug = searchParams.get('debug') || localStorage.getItem('debug_mode');
                const { data: { user } } = await supabase.auth.getUser();

                // ✅ 1.1 ตรวจสอบความถูกต้องของ Session (ถ้ามี Session อยู่ต้องเป็นของ LINE คนเดิม)
                if (user && lineId) {
                    const sessionLineId = user.user_metadata?.line_user_id || user.app_metadata?.line_user_id;
                    
                    // ถ้าใน Session ไม่มี LINE ID (เช่น ล็อกอินแอดมินค้างไว้) 
                    // หรือมีแต่ไม่ตรงกับคนปัจจุบัน ให้ Logout ทันทีเพื่อเริ่มใหม่
                    if (!sessionLineId || sessionLineId !== lineId) {
                        console.log("Session conflict, signing out...", { sessionLineId, lineId });
                        await supabase.auth.signOut();
                        window.location.reload();
                        return;
                    }
                }

                // 2. ถ้าไม่มี User Session หรือ ข้อมูล Metadata ไม่ครบ ให้ทำการ Bridge
                // (ถ้ามี session แต่ขาด line_user_id ให้ถือว่าต้องซ่อมแซมข้อมูลผ่าน Bridge)
                const sessionLineId = user?.user_metadata?.line_user_id || user?.app_metadata?.line_user_id;
                
                if (!user || !sessionLineId) {
                    const debugName = searchParams.get('name') || `DEBUG_USER_${lineId?.slice(-4) || 'UNKNOWN'}`;

                    if (isDebug && isDebug !== 'clear' && lineId) {
                        // Debug Bridge
                        const res = await fetch('/api/auth/debug', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ lineUserId: lineId, name: debugName })
                        });
                        if (res.ok) {
                            const { user: newUser } = await res.json();
                            if (newUser) {
                                // ดึงชื่อจากหลายแหล่งเพื่อให้ชัวร์
                                const displayName = newUser.user_metadata?.full_name || 
                                                  newUser.user_metadata?.name || 
                                                  newUser.user_metadata?.display_name || 
                                                  debugName;
                                setLineDisplayName(displayName);
                                setLineUserId(newUser.user_metadata?.line_user_id || lineId);
                            }
                        }
                    } else {
                        // Real LINE Bridge
                        if (!liff.id) {
                            await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
                        }

                        if (liff.isLoggedIn()) {
                            const idToken = liff.getIDToken();
                            const res = await fetch('/api/auth/line', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ idToken })
                            });

                            // ✅ ดึงข้อมูลจากคำตอบของเซิร์ฟเวอร์
                            let bridgeUser = null;
                            if (res.ok) {
                                const data = await res.json();
                                bridgeUser = data.user;
                            }

                            // ✅ Final Fail-safe: ถ้าเซิร์ฟเวอร์ไม่คืนข้อมูลมา หรือข้อมูลไม่ครบ ให้ดึงจาก LIFF โดยตรง
                            const liffProfile = await liff.getProfile();
                            const finalName = bridgeUser?.user_metadata?.full_name || 
                                            bridgeUser?.user_metadata?.name || 
                                            bridgeUser?.user_metadata?.display_name || 
                                            liffProfile.displayName;
                            const finalId = bridgeUser?.user_metadata?.line_user_id || 
                                          bridgeUser?.app_metadata?.line_user_id || 
                                          liffProfile.userId;

                            setLineDisplayName(finalName);
                            setLineUserId(finalId);
                            setLinePictureUrl(bridgeUser?.user_metadata?.avatar_url || liffProfile.pictureUrl || '');
                        } else {
                            // ถ้าไม่ได้ล็อกอินใน LINE ให้บังคับล็อกอิน
                            liff.login({ redirectUri: window.location.href });
                            return;
                        }
                    }
                } else {
                    // Session established and has Metadata
                    let displayName = user.user_metadata?.full_name || 
                                      user.user_metadata?.name || 
                                      user.user_metadata?.display_name || 
                                      'User';
                    
                    // เพิ่มเติม: ถ้าเป็นอีเมลจริง (ไม่ใช่ shadow) อาจจะไม่มีชื่อจาก LINE ติดมาในชุดเก่า
                    // ให้ลองดึงจาก LIFF ซ่อมแซมอีกรอบเพื่อความชัวร์
                    if (displayName === 'User' && !isDebug) {
                        try {
                            if (liff.isLoggedIn()) {
                                const liffProfile = await liff.getProfile();
                                displayName = liffProfile.displayName;
                            }
                        } catch(e) {}
                    }

                    setLineDisplayName(displayName);
                    setLineUserId(sessionLineId);
                    setLinePictureUrl(user.user_metadata?.avatar_url || '');
                }
            } catch (err: any) {
                console.error("Auth Init Error", err)
                setAuthError(err?.message || 'ไม่สามารถยืนยันตัวตนได้ กรุณาลองใหม่อีกครั้ง');
            } finally {
                setIsAuthenticating(false);
            }
        }
        initLiff()
    }, [searchParams])

    // useEffect(() => {
    //     const initLiff = async () => {
    //         try {
    //             await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
    //             if (!liff.isLoggedIn()) {
    //                 liff.login();
    //                 return;
    //             }

    //             const idToken = liff.getIDToken();
    //             const res = await fetch('/api/auth/line', {
    //                 method: 'POST',
    //                 headers: { 'Content-Type': 'application/json' },
    //                 body: JSON.stringify({ idToken })
    //             });

    //             if (res.ok) {
    //                 const { data: { user } } = await supabase.auth.getUser();
    //                 if (user) {
    //                     setLineUserId(user.user_metadata.line_user_id);
    //                     setLineDisplayName(user.user_metadata.full_name);
    //                 }
    //             }
    //         } catch (err) {
    //             console.error("LIFF Init Error", err);
    //         }
    //     }
    //     initLiff();
    // }, []);

    // ปรับปรุง useEffect สำหรับ Init LIFF
    // useEffect(() => {
    //     const initLiff = async () => {
    //         try {
    //             // 1. ตรวจสอบก่อนว่า init ไปหรือยัง
    //             if (!liff.id) {
    //                 await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
    //             }

    //             // 2. ถ้าไม่ได้ Login ให้สั่ง Login ทันที
    //             if (!liff.isLoggedIn()) {
    //                 liff.login({ redirectUri: window.location.href });
    //                 return;
    //             }

    //             // 3. ดึงข้อมูลโปรไฟล์มาแสดงผลเบื้องต้น (ฝั่ง Client)
    //             const profile = await liff.getProfile();
    //             setLineDisplayName(profile.displayName);
    //             setLineUserId(profile.userId);

    //             // 4. ส่ง ID Token ไปให้ Supabase Auth Bridge (ตาม Logic เดิมของคุณ)
    //             const idToken = liff.getIDToken();
    //             if (idToken) {
    //                 const res = await fetch('/api/auth/line', {
    //                     method: 'POST',
    //                     headers: { 'Content-Type': 'application/json' },
    //                     body: JSON.stringify({ idToken })
    //                 });

    //                 if (res.ok) {
    //                     const { data: { user } } = await supabase.auth.getUser();
    //                     if (user) {
    //                         // อัปเดต State อีกครั้งจาก Supabase User
    //                         setLineUserId(user.user_metadata.line_user_id || profile.userId);
    //                     }
    //                 }
    //             }
    //         } catch (err) {
    //             console.error("LIFF Initialization failed", err);
    //             // ถ้าพังในคอมพิวเตอร์ (ไม่ใช่ LINE) อาจจะไม่ผ่านขั้นตอนล่าง
    //         }
    //    // };
    //     initLiff();
    // }, []);

    const handleResetAuth = async () => {
        const result = await Swal.fire({
            title: 'ต้องการเริ่มเข้าสู่ระบบใหม่?',
            text: "ระบบจะทำการ Logout และล้างข้อมูลแคชชั่วคราวในเครื่องของคุณ",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#94a3b8',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            setIsAuthenticating(true);
            try {
                await supabase.auth.signOut();
                localStorage.removeItem('debug_mode');
                if (liff.isLoggedIn()) {
                    liff.logout();
                }
                sessionStorage.clear();
                window.location.reload();
            } catch (error) {
                console.error("Reset Error:", error);
                window.location.reload();
            }
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                const res = await fetch('/api/register/supervisor');
                const result = await res.json();
                if (result.success) {
                    setAllSites(result.data.sites || []);
                    setAllSubjects(result.data.subjects || []);
                    setSubSubjects(result.data.subSubjects || []);
                }
            } catch (err) {
                console.error("Failed to fetch master data:", err);
            }
        }
        fetchMasterData();

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayedSites = allSites.filter(site =>
        site.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.province.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 10) setPhone(value);
    }

    const toggleSubject = (id: number) => {
        setSelectedSubjects(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    const toggleSubSubject = (id: number) => {
        setSelectedSubSubjects(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!lineUserId) {
            Swal.fire('เกิดข้อผิดพลาด', 'ไม่พบข้อมูล LINE ID กรุณาเข้าใช้งานผ่าน LINE', 'error');
            return;
        }

        // Validation เบื้องต้น
        if (!file || !fullName || !phone || !email || selectedSubjects.length === 0) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณากรอกข้อมูลส่วนตัว แแนบรูป และเลือกวิชาที่รับผิดชอบให้ครบถ้วน', 'warning');
            return;
        }
        if (userType === 'supervisor' && !selectedSite) {
            Swal.fire('ข้อมูลไม่ครบ', 'กรุณาเลือกหน่วยงานต้นสังกัดของคุณ', 'warning');
            return;
        }

        setLoading(true);
        try {
            // 1. Upload รูปภาพ (ยังทำที่ Client เพราะต้องการ direct storage interaction)
            const fileName = `avatar_${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);

            // 2. ส่งข้อมูลไปที่ API (✅ ส่ง lineUserId ไปด้วยเพื่อเป็น Fallback กรณี Cookie หาย)
            const res = await fetch('/api/register/supervisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName,
                    phone,
                    email,
                    avatarUrl: publicUrl,
                    siteId: userType === 'supervisor' ? selectedSite.id : null,
                    province: userType === 'supervisor' ? selectedSite?.province : 'มหาวิทยาลัย',
                    role: userType,
                    selectedSubjects,
                    selectedSubSubjects,
                    lineUserId // ✅ Fallback identity
                })
            })

            const result = await res.json()
            if (!result.success) throw new Error(result.error)

            const supervisor = result.data

            // 3. Line Notification
            try {
                await fetch('/api/line/push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lineUserId: supervisor.line_user_id,
                        flexMessage: flexRegisterSuccess({
                            name: supervisor.full_name,
                            site: userType === 'supervisor' ? selectedSite?.site_name : 'มหาวิทยาลัย'
                        })
                    })
                });
            } catch (lineErr) {
                console.error("Line Notification Error:", lineErr);
            }

            Swal.fire({
                title: 'ลงทะเบียนสำเร็จ',
                text: 'ข้อมูลของคุณถูกส่งไปรอการอนุมัติจากแอดมินแล้ว',
                icon: 'success',
                confirmButtonColor: '#2563eb'
            }).then(() => {
                window.location.reload();
            });
        } catch (error: any) {
            Swal.fire('เกิดข้อผิดพลาด', error.message, 'error');
        } finally {
            setLoading(false);
        }
    }

    if (isAuthenticating) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-slate-500 font-bold animate-pulse">กำลังยืนยันตัวตน LINE...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 pb-20 font-sans">
            <div className="max-w-md mx-auto space-y-8">
                {/* <div className="text-center">
                    <div className="inline-block p-4 bg-blue-600 rounded-[2rem] shadow-xl text-white mb-4">
                        <UserCircle2 size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">ลงทะเบียนบุคลากร</h1>
                    <p className="text-slate-500 font-medium">เข้าใช้งานระบบประเมินผลการฝึกงาน</p>
                    
                    {lineDisplayName && (
                        <div className="flex items-center gap-2 mb-6 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                <UserCircle2 size={18} />
                            </div>
                            <p className="text-[11px] font-bold text-emerald-700">
                                เชื่อมต่อกับบัญชี LINE: <span className="font-black">{lineDisplayName}</span>
                            </p>
                        </div>
                    )}
                </div> */}

                <div className="text-center">
                    <div className="inline-block p-4 bg-blue-600 rounded-[2rem] shadow-xl text-white mb-4">
                        <UserCircle2 size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">ลงทะเบียนบุคลากร</h1>
                    <p className="text-slate-500 font-medium">เข้าใช้งานระบบประเมินผลการฝึกงาน</p>

                    {/* ส่วนที่แก้ไข: เพิ่ม mt-6 และ justify-center */}
                    {lineDisplayName && (
                        <div className="flex items-center justify-center gap-2 mt-8 mb-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-2 mx-auto max-w-[300px] relative group">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 overflow-hidden border-2 border-white shadow-sm">
                                {linePictureUrl ? (
                                    <img src={linePictureUrl} alt="profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle2 size={24} />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className="text-[10px] font-bold text-emerald-600/70 leading-none mb-1">เชื่อมต่อบัญชี LINE แล้ว</p>
                                <p className="text-[14px] font-black text-emerald-900 leading-tight truncate max-w-[150px]">{lineDisplayName}</p>
                                <p className="text-[9px] font-mono text-emerald-600/60 truncate max-w-[150px]">{lineUserId}</p>
                            </div>
                            <button 
                                onClick={handleResetAuth}
                                className="shrink-0 p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-emerald-100 shadow-sm flex flex-col items-center gap-0.5"
                                title="ล้างแคชและเข้าใหม่"
                            >
                                <Loader2 size={12} className="rotate-45" />
                                <span className="text-[8px] font-bold leading-none">เริ่มใหม่</span>
                            </button>
                        </div>
                    )}

                    {/* ✅ แสดงข้อความเมื่อไม่มี LINE Identity (หลังจาก Auth เสร็จแล้ว) */}
                    {!lineDisplayName && !isAuthenticating && (
                        <div className="flex flex-col items-center gap-3 mt-8 mb-4 p-5 bg-red-50 rounded-2xl border border-red-100 animate-in fade-in slide-in-from-top-2 mx-auto max-w-[320px]">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                                <UserCircle2 size={28} />
                            </div>
                            <p className="text-sm font-bold text-red-700 text-center">
                                {authError || 'ยังไม่ได้เชื่อมต่อบัญชี LINE'}
                            </p>
                            <p className="text-xs text-red-500/70 text-center">
                                กรุณาเข้าใช้งานผ่านแอป LINE เพื่อลงทะเบียน
                            </p>
                            <div className="flex gap-2 mt-1">
                                <button
                                    onClick={async () => {
                                        setIsAuthenticating(true);
                                        setAuthError(null);
                                        try {
                                            if (!liff.id) {
                                                await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
                                            }
                                            if (!liff.isLoggedIn()) {
                                                liff.login({ redirectUri: window.location.href });
                                            } else {
                                                // ถ้า LIFF ล็อกอินอยู่แล้วแต่ Bridge พัง ให้ลองใหม่
                                                window.location.reload();
                                            }
                                        } catch (e) {
                                            setAuthError('ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาลองใหม่');
                                            setIsAuthenticating(false);
                                        }
                                    }}
                                    className="px-5 py-2.5 bg-[#06C755] text-white rounded-xl font-bold text-sm shadow-md hover:bg-[#05b34d] transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <UserCircle2 size={16} />
                                    เข้าสู่ระบบ LINE
                                </button>
                                <button
                                    onClick={handleResetAuth}
                                    className="px-4 py-2.5 bg-white text-slate-500 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    เริ่มใหม่
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ส่วนเลือกประเภทผู้ใช้งาน */}
                <div className="flex p-1.5 bg-slate-200/50 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => { setUserType('supervisor'); setSelectedSite(null); setSearchTerm(''); }}
                        className={`flex-1 h-12 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${userType === 'supervisor' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >
                        <Hospital size={18} /> พี่เลี้ยง
                    </button>
                    <button
                        type="button"
                        onClick={() => { setUserType('teacher'); setSelectedSite(null); setSearchTerm(''); }}
                        className={`flex-1 h-12 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${userType === 'teacher' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                    >
                        <User size={18} /> อาจารย์
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ส่วนแนบรูปถ่าย */}
                    <div className="flex flex-col items-center">
                        <label className="relative cursor-pointer transition-all hover:scale-105 active:scale-95">
                            <div className="w-36 h-36 rounded-[2.5rem] bg-white shadow-xl border-4 border-white overflow-hidden flex items-center justify-center">
                                {preview ? <img src={preview} className="w-full h-full object-cover" /> : <Camera size={48} className="text-slate-200" />}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg border-4 border-[#F8FAFC]">
                                <ImagePlus size={20} />
                            </div>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    setFile(e.target.files[0]);
                                    setPreview(URL.createObjectURL(e.target.files[0]));
                                }
                            }} />
                        </label>
                    </div>

                    {/* ข้อมูลส่วนตัว */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-5">
                        <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">ข้อมูลพื้นฐาน</label>
                        <div className="relative">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input placeholder="ชื่อ-นามสกุล" className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={fullName} onChange={e => setFullName(e.target.value)} />
                        </div>
                        {/* <div className="relative">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input placeholder="เบอร์โทรศัพท์" className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={phone} onChange={handlePhoneChange} />
                        </div> */}
                        <div className="relative">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="tel" // 1. เปลี่ยน type เป็น tel เพื่อให้มือถือเปิดคีย์บอร์ดตัวเลข
                                inputMode="numeric" // 2. บังคับให้แสดง number pad ในบางระบบปฏิบัติการ
                                pattern="[0-9]*" // 3. ช่วยให้ iOS มั่นใจว่าเป็นตัวเลข
                                placeholder="เบอร์โทรศัพท์"
                                className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                                value={phone}
                                onChange={handlePhoneChange}
                            />
                        </div>
                        <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input placeholder="อีเมล (สำหรับติดต่อ)" className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                    </div>

                    {/* ช่องเลือกสถานที่ฝึก (แสดงเฉพาะพี่เลี้ยง) */}
                    {userType === 'supervisor' && (
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-5">
                            <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-[0.2em]">หน่วยงานที่สังกัด</label>
                            <div className="relative" ref={dropdownRef}>
                                <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-600 z-10" size={20} />
                                <input
                                    type="text"
                                    placeholder="พิมพ์ค้นหาชื่อหน่วยงาน หรือ จังหวัด..."
                                    className="w-full h-14 pl-14 pr-12 rounded-2xl bg-slate-50 border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
                                    value={selectedSite ? selectedSite.site_name : searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setSelectedSite(null);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                />
                                <ChevronDown className={`absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} size={20} />

                                {isDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                        {displayedSites.length > 0 ? (
                                            displayedSites.map((site) => (
                                                <div
                                                    key={site.id}
                                                    className="p-4 hover:bg-blue-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-none group"
                                                    onClick={() => {
                                                        setSelectedSite(site);
                                                        setSearchTerm(site.site_name);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                >
                                                    <div>
                                                        <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{site.site_name}</p>
                                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">{site.province}</p>
                                                    </div>
                                                    {selectedSite?.id === site.id && <CheckCircle2 size={18} className="text-blue-600" />}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-slate-400 italic font-medium">ไม่พบรายชื่อสถานที่</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ส่วนเลือกวิชาที่รับผิดชอบ (2 คอลัมน์) */}
                    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
                        <div className="flex items-center gap-3">
                            <BookOpen size={20} className="text-blue-600" />
                            <h3 className="font-black text-slate-800 leading-none">วิชาที่รับผิดชอบ</h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {allSubjects.map(sub => {
                                const hasSub = subSubjects.some(ss => ss.parent_subject_id === sub.id);
                                const isSelected = selectedSubjects.includes(sub.id);

                                return (
                                    <div key={sub.id} className={`col-span-1 ${isSelected && hasSub ? 'sm:col-span-2' : ''} transition-all duration-300`}>
                                        <button
                                            type="button"
                                            onClick={() => toggleSubject(sub.id)}
                                            className={`w-full h-16 px-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${isSelected ? 'border-blue-600 bg-blue-50/30 shadow-md shadow-blue-100' : 'border-slate-50 bg-slate-50 hover:border-blue-200'}`}
                                        >
                                            <span className={`font-bold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>{sub.name}</span>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600 text-white scale-110' : 'border-slate-200 bg-white'}`}>
                                                {isSelected && <CheckCircle2 size={14} strokeWidth={3} />}
                                            </div>
                                        </button>

                                        {isSelected && hasSub && (
                                            <div className="mt-3 p-4 bg-blue-50/50 rounded-[1.5rem] border border-blue-100 animate-in zoom-in-95 duration-300">
                                                <div className="flex flex-wrap gap-2">
                                                    {subSubjects.filter(ss => ss.parent_subject_id === sub.id).map(ss => (
                                                        <button key={ss.id} type="button" onClick={() => toggleSubSubject(ss.id)} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${selectedSubSubjects.includes(ss.id) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-400 border border-slate-100'}`}>
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

                    <button disabled={loading || !lineUserId} className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-3">
                        {loading ? <Loader2 className="animate-spin" /> : "ยืนยันการลงทะเบียน"}
                    </button>
                </form>
            </div>
        </div>
    )
}