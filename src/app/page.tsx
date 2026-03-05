

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
                // 1. เริ่มการทำงาน LIFF ทันทีที่โหลดหน้า
                await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

                // 2. ถ้าผู้ใช้ Login อยู่แล้ว (ซึ่งรวมถึงจังหวะที่เพิ่ง Login กลับมาด้วย)
                if (liff.isLoggedIn()) {
                    const profile = await liff.getProfile();

                    // 3. ไปเช็กข้อมูลใน Supabase อัตโนมัติโดยไม่ต้องรอให้ผู้ใช้กดปุ่ม
                    const { data: user } = await supabase
                        .from('supervisors')
                        .select('is_verified, role')
                        .eq('line_user_id', profile.userId)
                        .single();

                    if (user) {
                        if (user.is_verified) {
                            router.replace(user.role === 'teacher' ? '/teacher/dashboard' : '/supervisor/dashboard');
                        } else {
                            router.replace('/supervisor/pending');
                        }
                        return; // จบการทำงาน
                    }
                }

                // 4. ถ้ายังไม่ได้ Login หรือไม่มีข้อมูลในระบบ ค่อยปิด Loading เพื่อโชว์หน้า UI ปกติ
                setIsChecking(false);
            } catch (err) {
                console.error("Auto Login Check Failed:", err);
                setIsChecking(false);
            }
        };

        autoCheckLogin();
    }, [router, supabase]); // ทำงานทุกครั้งที่หน้าเว็บถูกเปิดขึ้นมา

    const handleLineLogin = async () => {
        try {
            await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
            if (!liff.isLoggedIn()) {
                liff.login()
                return
            }
            const profile = await liff.getProfile()
            const { data: user } = await supabase
                .from('supervisors')
                .select('is_verified, role')
                .eq('line_user_id', profile.userId)
                .single()

            if (user) {
                if (user.is_verified) {
                    router.replace(user.role === 'teacher' ? '/teacher/dashboard' : '/supervisor/dashboard')
                } else {
                    router.replace('/supervisor/pending')
                }
            } else {
                router.push('/register')
            }
        } catch (err) {
            console.error("Login failed", err)
        }
    }

    useEffect(() => {
        setIsChecking(false)
    }, [])

    if (isChecking) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="relative flex items-center justify-center">
                <div className="absolute animate-ping h-12 w-12 rounded-full bg-indigo-400 opacity-20"></div>
                <div className="relative animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
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
                        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Faculty of Thai Med</p>
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

                    {/* Registration Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">เริ่มต้นใช้งาน / Registration</h2>
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
                                    <h3 className="text-lg lg:text-xl font-black text-slate-800">นักศึกษา</h3>
                                    <p className="text-xs text-slate-400 font-bold mt-2 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                                        ลงทะเบียนผ่าน PSU SSO <ChevronRight size={14} />
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
                                    <h3 className="text-lg lg:text-xl font-black text-slate-800">พี่เลี้ยง / อาจารย์</h3>
                                    <p className="text-xs text-slate-400 font-bold mt-2 flex items-center gap-1 group-hover:text-emerald-600 transition-colors">
                                        ลงทะเบียนใหม่ผ่าน LINE <ChevronRight size={14} />
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Login Section */}
                    <div className="space-y-6">
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">เข้าสู่ระบบ / Already Registered</h2>
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
                                        <h3 className="text-xl lg:text-2xl font-black leading-none">LINE Login</h3>
                                        <p className="text-indigo-200 text-[10px] lg:text-xs font-bold mt-2 uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">สำหรับพี่เลี้ยงและอาจารย์ที่ลงทะเบียนแล้ว</p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex w-14 h-14 rounded-full bg-white/10 items-center justify-center text-white border border-white/10 group-hover:bg-white group-hover:text-indigo-600 transition-all duration-300">
                                    <ArrowRight size={24} />
                                </div>
                            </div>
                        </button>
                    </div>

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