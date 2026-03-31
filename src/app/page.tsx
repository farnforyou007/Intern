

// ver5
"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
    GraduationCap, UserCheck, ShieldCheck, ArrowRight,
    UserPlus, LogIn, Sprout, ChevronRight, Sparkles
} from 'lucide-react'
import liff from '@line/liff'
import { createBrowserClient } from '@supabase/ssr'

export default function SplitHomePage() {
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    // ภายในฟังก์ชัน SplitHomePage
    useEffect(() => {
        const autoCheckLogin = async () => {
            try {
                // 1. เริ่มการทำงาน LIFF
                await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

                // 2. เช็ก Supabase Session (Secure Cookie)
                const { data: { user: authUser } } = await supabase.auth.getUser();

                if (authUser) {
                    const { data: user } = await supabase
                        .from('supervisors')
                        .select('is_verified, role')
                        .eq('user_id', authUser.id)
                        .maybeSingle();

                    if (user) {
                        if (user.is_verified) {
                            router.replace(user.role === 'teacher' ? '/teacher/dashboard' : '/supervisor/dashboard');
                        } else {
                            router.replace(user.role === 'teacher' ? '/teacher/pending' : '/supervisor/pending');
                        }
                        return;
                    }
                }

                // 3. ถ้าไม่มี Supabase Session แต่ Login LIFF ไว้แล้ว -> ทำการ Bridge สิทธิ
                if (liff.isLoggedIn()) {
                    const idToken = liff.getIDToken();

                    // ป้องกัน idToken เป็น null (token หมดอายุ) → บังคับ login ใหม่
                    if (!idToken) {
                        liff.login({ redirectUri: window.location.href });
                        return;
                    }

                    const res = await fetch('/api/auth/line', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken })
                    });

                    const data = await res.json();
                    if (res.ok && data.redirectTo) {
                        // ✅ Set session ฝั่ง client เพื่อให้ cookie ถูก set ใน LINE browser
                        if (data.session?.access_token && data.session?.refresh_token) {
                            await supabase.auth.setSession({
                                access_token: data.session.access_token,
                                refresh_token: data.session.refresh_token
                            })
                        }
                        // ✅ ใช้ full page navigation เพื่อให้ cookie ถูกส่งไปกับ middleware
                        window.location.href = data.redirectTo;
                        return;
                    }
                }

                setIsChecking(false);
            } catch (err) {
                console.error("Auto Login Check Failed:", err);
                setIsChecking(false);
            }
        };

        autoCheckLogin();
    }, [router, supabase]);

    const handleLineLogin = async () => {
        try {
            await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
            if (!liff.isLoggedIn()) {
                liff.login({ redirectUri: window.location.href })
                return
            }

            const idToken = liff.getIDToken()

            // ป้องกัน idToken เป็น null → บังคับ login ใหม่เพื่อรับ token ใหม่
            if (!idToken) {
                liff.login({ redirectUri: window.location.href })
                return
            }

            const res = await fetch('/api/auth/line', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            })

            if (res.ok) {
                const data = await res.json()
                // ✅ Set session ฝั่ง client เพื่อให้ cookie ถูก set ใน LINE browser
                if (data.session?.access_token && data.session?.refresh_token) {
                    await supabase.auth.setSession({
                        access_token: data.session.access_token,
                        refresh_token: data.session.refresh_token
                    })
                }
                // ✅ ใช้ full page navigation เพื่อให้ cookie ถูกส่งไปกับ middleware
                window.location.href = data.redirectTo || '/'
            } else {
                // Bridge ล้มเหลว → ลอง login ใหม่แทนการเด้งไป register ทันที
                liff.login({ redirectUri: window.location.href })
            }
        } catch (err) {
            console.error("Login failed", err)
            // เกิด error → ลอง login ใหม่แทนการเด้งไป register
            try { liff.login({ redirectUri: window.location.href }) } catch { router.push('/register') }
        }
    }

    const [debugLineId, setDebugLineId] = useState('')
    const [isDev, setIsDev] = useState(false)

    useEffect(() => {
        setIsDev(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    }, [])

    if (isChecking) return (
        // <div className="min-h-screen flex items-center justify-center bg-slate-50">
        //     <div className="relative flex items-center justify-center">
        //         <div className="absolute animate-ping h-12 w-12 rounded-full bg-indigo-400 opacity-20"></div>
        //         <div className="relative animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
        //     </div>
        // </div>

        <div className="h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative font-sans">
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-[100px]"></div>
            </div>
            <div className="relative flex flex-col items-center">
                <div className="relative w-20 h-20 mb-8">
                    <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-indigo-600 animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-t-blue-400 animate-[spin_0.8s_linear_infinite]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                    </div>
                </div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">กำลังโหลด...</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">กรุณารอซักครู่...</span>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans selection:bg-indigo-100 selection:text-indigo-900">

            {/* --- ฝั่งซ้าย: Visual Experience (Hidden on small mobile if needed, but here we keep it) --- */}
            <div className="relative w-full lg:w-5/12 xl:w-1/2 flex flex-col justify-end lg:justify-center p-8 lg:p-24 overflow-hidden min-h-[350px] lg:min-h-screen">
                <Image
                    src="/images/bg-thai-medicine.jpg"
                    alt="Thai Traditional Medicine"
                    fill
                    className="object-cover z-0"
                    priority
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-b from-indigo-950/40 via-indigo-950/80 to-indigo-950"></div>

                <div className="relative z-20 space-y-6 lg:space-y-10">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                        <Sparkles size={16} className="text-indigo-300" />
                        <span className="text-[10px] font-black text-indigo-100 uppercase tracking-widest">Digital Internship System</span>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-4xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight">
                            ระบบประเมิน <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-emerald-300">ทักษะวิชาชีพ</span>
                        </h1>
                        <p className="text-indigo-100/60 text-sm lg:text-xl font-medium max-w-sm leading-relaxed">
                            คณะการแพทย์แผนไทย มหาวิทยาลัยสงขลานครินทร์
                        </p>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                        <div className="h-1 w-12 bg-indigo-500 rounded-full"></div>
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">The Faculty of Traditional Thai Medicine</p>
                    </div>
                </div>
            </div>

            {/* --- ฝั่งขวา: Menu Interaction --- */}
            <div className="w-full lg:w-7/12 xl:w-1/2 flex flex-col bg-slate-50/50 relative p-6 lg:p-20 justify-center">
                <div className="max-w-xl mx-auto w-full space-y-12 lg:space-y-20">

                    {/* Header for Mobile */}
                    <div className="lg:hidden flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-200">
                            <Sprout size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-black text-slate-900 tracking-tighter">INTERN<span className="text-indigo-600">Ship</span></span>
                    </div>

                    {/* Login Section */}
                    <div className="space-y-6">
                        <h2 className="text-[16px] font-black text-slate-400 uppercase tracking-[0.25em]">เข้าสู่ระบบ</h2>
                        <button
                            onClick={handleLineLogin}
                            className="w-full relative group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-800 transition-all duration-300 group-hover:scale-105 rounded-[2.5rem]"></div>
                            <div className="relative p-6 lg:p-10 flex items-center justify-between">
                                <div className="flex items-center gap-5 text-left">
                                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                                        <LogIn size={32} className="text-white" />
                                    </div>
                                    <div className="text-white">
                                        <h3 className="text-xl lg:text-2xl font-black leading-none">เข้าสู่ระบบเฉพาะอาจารย์และพี่เลี้ยง</h3>
                                        <p className="text-indigo-200 text-[10px] lg:text-xs font-bold mt-2 uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">สำหรับพี่เลี้ยงและอาจารย์ที่ลงทะเบียนแล้ว</p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex w-14 h-14 rounded-full bg-white/10 items-center justify-center text-white border border-white/10 group-hover:bg-white group-hover:text-indigo-600 transition-all duration-300">
                                    <ArrowRight size={24} />
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Registration Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[16px] font-black text-slate-400 uppercase tracking-[0.25em]">ลงทะเบียนใหม่สำหรับผู้ใช้งานใหม่</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                            {/* Card: Student */}
                            <button
                                onClick={() => window.location.href = 'https://psusso.ttmedpsu.org/login.php?app=internship'}
                                className="group relative bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-200/40 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                            >
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100"></div>
                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                                        <GraduationCap size={28} />
                                    </div>
                                    <h3 className="text-lg lg:text-xl font-black text-slate-800">ลงทะเบียนใหม่สำหรับนักศึกษา</h3>
                                    <p className="text-xs text-slate-400 font-bold mt-2 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                                        PSU Passport <ChevronRight size={14} />
                                    </p>
                                </div>
                            </button>

                            {/* Card: Supervisor */}
                            <button
                                onClick={() => router.push('/register')}
                                className="group relative bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-emerald-200/40 hover:-translate-y-1 transition-all duration-300 text-left overflow-hidden"
                            >
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 scale-50 group-hover:scale-100"></div>
                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                                        <UserPlus size={28} />
                                    </div>
                                    <h3 className="text-lg lg:text-xl font-black text-slate-800"> ลงทะเบียนสำหรับพี่เลี้ยง / อาจารย์</h3>
                                    <p className="text-xs text-slate-400 font-bold mt-2 flex items-center gap-1 group-hover:text-emerald-600 transition-colors">
                                        ลงทะเบียนใหม่ผ่าน LINE <ChevronRight size={14} />
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>



                    {/* Debug Mode (Local Dev only) */}
                    {isDev && (
                        <div className="p-6 bg-amber-50/50 rounded-[2.5rem] border border-amber-200/50 border-dashed">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck size={14} className="text-amber-600" />
                                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Debug Mode (Local Only)</h4>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="ใส่ LINE ID ที่ต้องการเทส"
                                    value={debugLineId}
                                    onChange={(e) => setDebugLineId(e.target.value)}
                                    className="flex-1 px-4 py-2 rounded-xl border border-amber-200 text-sm font-medium focus:ring-2 focus:ring-amber-500 outline-none bg-white font-sans"
                                />
                                <button
                                    onClick={async () => {
                                        if (!debugLineId) return;
                                        const res = await fetch('/api/auth/debug', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ lineUserId: debugLineId })
                                        });
                                        const data = await res.json();
                                        if (res.ok && data.redirectTo) {
                                            // ✅ บันทึก ID ลงใน localStorage เพื่อให้ getLineUserId ดึงไปใช้ต่อได้โดยไม่เด้งไป LINE
                                            localStorage.setItem('debug_mode', debugLineId);
                                            router.replace(data.redirectTo);
                                        } else {
                                            alert(`Debug login failed: ${data.error || 'Unknown error'}`);
                                        }
                                    }}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-black hover:bg-amber-700 transition-colors shadow-sm"
                                >
                                    Login
                                </button>
                            </div>
                            <p className="text-[9px] text-amber-500 mt-2 font-bold uppercase italic opacity-70">* ใช้สำหรับจำลองการ Login เพื่อความรวดเร็วในการพัฒนาบนเครื่อง Local</p>
                        </div>
                    )}

                    {/* Bottom Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200 pt-10">
                        <button
                            onClick={() => router.push('/auth/login')}
                            className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-all"
                        >
                            <ShieldCheck size={16} className="opacity-50" /> Admin Access
                        </button>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                            © 2026 Prince of Songkla University
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}