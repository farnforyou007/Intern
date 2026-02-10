"use client"
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
    GraduationCap, 
    UserCheck, 
    ShieldCheck, 
    ArrowRight, 
    CheckCircle2,
    Hospital,
    Sprout
} from 'lucide-react'
import { Button } from "@/components/ui/button"
import liff from '@line/liff' // เพิ่มการ import liff
import { createBrowserClient } from '@supabase/ssr'
export default function SplitHomePage() {
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // 1. เริ่มการทำงาน LIFF
                await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
                
                if (liff.isLoggedIn()) {
                    const profile = await liff.getProfile()
                    
                    // 2. เช็กในฐานข้อมูลว่าคนนี้ลงทะเบียนหรือยัง
                    const { data: user } = await supabase
                        .from('supervisors')
                        .select('is_verified')
                        .eq('line_user_id', profile.userId)
                        .single()

                    if (user) {
                        // ถ้าพบข้อมูลแล้ว
                        if (user.is_verified) {
                            router.replace('/supervisor/dashboard')
                        } else {
                            router.replace('/supervisor/pending')
                        }
                        return // จบการทำงาน ไม่ต้องโหลดหน้า Choice ต่อ
                    }
                }
                // ถ้ายังไม่ล็อกอิน หรือไม่มีข้อมูลในระบบ ให้แสดงหน้า Choice ปกติ
                setIsChecking(false)
            } catch (err) {
                console.error("Auth check failed", err)
                setIsChecking(false)
            }
        }
        checkAuth()
    }, [])

    // ถ้ากำลังตรวจสอบ ให้แสดงหน้า Loading สวยๆ ไปก่อน
    if (isChecking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">กำลังตรวจสอบ...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
            
            {/* --- ฝั่งซ้าย: รูปภาพพื้นหลังเกี่ยวกับการแพทย์แผนไทย (Visual Side) --- */}
            <div className="relative w-full lg:w-1/2 flex flex-col justify-center p-10 lg:p-24 overflow-hidden min-h-[450px] lg:min-h-screen">
                
                {/* รูปภาพพื้นหลัง (แนะนำรูปสมุนไพร หรือการนวดไทย) */}
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
                    style={{ 
                        backgroundImage: `url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop')` 
                    }}
                />
                
                {/* Overlay สีน้ำเงินเพื่อให้ข้อความอ่านง่าย */}
                <div className="absolute inset-0 z-10 bg-blue-900/70 mix-blend-multiply"></div>
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-blue-900 via-transparent to-blue-900/40"></div>

                <div className="relative z-20">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-white rounded-2xl shadow-2xl">
                            <Sprout size={32} className="text-blue-600" />
                        </div>
                        <span className="text-3xl font-black text-white tracking-tighter shadow-sm">
                            INTERN<span className="text-blue-200">FLOW</span>
                        </span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-8 drop-shadow-xl">
                        ระบบประเมิน <br />
                        <span className="text-blue-200 text-4xl lg:text-6xl">ทักษะการปฏิบัติงาน <br /> แพทย์แผนไทย</span>
                    </h1>

                    <div className="hidden sm:block space-y-6">
                        {[
                            "ประเมินทักษะแต่ละรายวิชาออนไลน์",
                            "เชื่อมต่อข้อมูลระหว่างนักศึกษาและพี่เลี้ยง",
                            "สรุปผลคะแนนรายบุคคลอัตโนมัติ"
                        ].map((text, i) => (
                            <div key={i} className="flex items-center gap-4 text-white/90 drop-shadow-sm">
                                <CheckCircle2 className="text-blue-300 shrink-0" />
                                <p className="text-lg font-medium">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer ฝั่งซ้าย (แสดงเฉพาะจอใหญ่) */}
                <div className="absolute bottom-12 hidden lg:block text-white/40 text-xs font-medium z-20 uppercase tracking-widest">
                    Faculty of Thai Traditional Medicine
                </div>
            </div>

            {/* --- ฝั่งขวา: เมนูเข้าใช้งาน (Menu Side) --- */}
            <div className="w-full lg:w-1/2 flex flex-col bg-slate-50 relative min-h-screen">
                
                {/* ปุ่ม Admin Portal มุมขวาบน */}
                <div className="p-6 flex justify-end shrink-0">
                    <Button 
                        variant="ghost" 
                        onClick={() => router.push('/admin/login')}
                        className="text-slate-400 hover:text-blue-600 font-bold gap-2 rounded-2xl h-12 px-6 bg-white/50 border border-slate-100 shadow-sm"
                    >
                        <ShieldCheck size={18} />
                        Admin
                    </Button>
                </div>

                {/* Content กลางหน้า */}
                <div className="flex-1 flex flex-col justify-center px-8 lg:px-24">
                    <div className="max-w-md mx-auto w-full">
                        <div className="mb-12">
                            <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">ระบบประเมิน</h2>
                            <p className="text-slate-500 font-medium">กรุณาเลือกประเภทการลงทะเบียน</p>
                        </div>

                        <div className="space-y-6">
                            {/* เมนูนักศึกษา */}
                            <button 
                                onClick={() => router.push('/register')}
                                className="w-full p-8 bg-white border-2 border-transparent hover:border-blue-600 rounded-[2.5rem] shadow-xl shadow-slate-200/50 transition-all flex items-center gap-6 group active:scale-[0.98] text-left"
                            >
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                                    <GraduationCap size={32} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-slate-900">นักศึกษา</h3>
                                    <p className="text-slate-400 font-medium text-sm">ลงทะเบียนสถานที่ฝึกงาน</p>
                                </div>
                                <ArrowRight className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
                            </button>

                            {/* เมนูพี่เลี้ยง / บุคลากร */}
                            <button 
                                onClick={() => router.push('supervisor/register')}
                                className="w-full p-8 bg-white border-2 border-transparent hover:border-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 transition-all flex items-center gap-6 group active:scale-[0.98] text-left"
                            >
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
                                    <Hospital size={32} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-slate-900">พี่เลี้ยง / บุคลากร</h3>
                                    <p className="text-slate-400 font-medium text-sm">ลงทะเบียนเพื่อประเมินนักศึกษา</p>
                                </div>
                                <ArrowRight className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-2 transition-all" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer ล่างสุดฝั่งขวา (Mobile Friendly) */}
                <div className="p-10 mt-auto shrink-0 border-t lg:border-none border-slate-100 text-center lg:text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        © 2026 Faculty of Traditional Medicine <br className="lg:hidden" /> All Rights Reserved.
                    </p>
                </div>
            </div>
        </div>
    )
}