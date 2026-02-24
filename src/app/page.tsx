// // "use client"
// // import React, { useEffect, useState } from 'react'
// // import { useRouter } from 'next/navigation'
// // import {
// //     GraduationCap,
// //     UserCheck,
// //     ShieldCheck,
// //     ArrowRight,
// //     CheckCircle2,
// //     Hospital,
// //     Sprout
// // } from 'lucide-react'
// // import { Button } from "@/components/ui/button"
// // import liff from '@line/liff' // เพิ่มการ import liff
// // import { createBrowserClient } from '@supabase/ssr'
// // export default function SplitHomePage() {
// //     const router = useRouter()
// //     const [isChecking, setIsChecking] = useState(true)
// //     const supabase = createBrowserClient(
// //         process.env.NEXT_PUBLIC_SUPABASE_URL!,
// //         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// //     )

// //     useEffect(() => {
// //         const checkAuth = async () => {
// //             try {
// //                 // 1. เริ่มการทำงาน LIFF
// //                 await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

// //                 if (liff.isLoggedIn()) {
// //                     const profile = await liff.getProfile()

// //                     // 2. เช็กในฐานข้อมูลว่าคนนี้ลงทะเบียนหรือยัง
// //                     const { data: user } = await supabase
// //                         .from('supervisors')
// //                         .select('is_verified')
// //                         .eq('line_user_id', profile.userId)
// //                         .single()

// //                     if (user) {
// //                         // ถ้าพบข้อมูลแล้ว
// //                         if (user.is_verified) {
// //                             router.replace('/supervisor/dashboard')
// //                         } else {
// //                             router.replace('/supervisor/pending')
// //                         }
// //                         return // จบการทำงาน ไม่ต้องโหลดหน้า Choice ต่อ
// //                     }
// //                 }
// //                 // ถ้ายังไม่ล็อกอิน หรือไม่มีข้อมูลในระบบ ให้แสดงหน้า Choice ปกติ
// //                 setIsChecking(false)
// //             } catch (err) {
// //                 console.error("Auth check failed", err)
// //                 setIsChecking(false)
// //             }
// //         }
// //         checkAuth()
// //     }, [])

// //     // ถ้ากำลังตรวจสอบ ให้แสดงหน้า Loading สวยๆ ไปก่อน
// //     if (isChecking) {
// //         return (
// //             <div className="min-h-screen flex flex-col items-center justify-center bg-white">
// //                 <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
// //                 <p className="font-black text-slate-400 uppercase tracking-widest text-xs">กำลังโหลด...</p>
// //             </div>
// //         )
// //     }

// //     return (
// //         <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">

// //             {/* --- ฝั่งซ้าย: รูปภาพพื้นหลังเกี่ยวกับการแพทย์แผนไทย (Visual Side) --- */}
// //             <div className="relative w-full lg:w-1/2 flex flex-col justify-center p-10 lg:p-24 overflow-hidden min-h-[450px] lg:min-h-screen">

// //                 {/* รูปภาพพื้นหลัง (แนะนำรูปสมุนไพร หรือการนวดไทย) */}
// //                 <div
// //                     className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000"
// //                     style={{
// //                         backgroundImage: `url('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=2070&auto=format&fit=crop')`
// //                     }}
// //                 />

// //                 {/* Overlay สีน้ำเงินเพื่อให้ข้อความอ่านง่าย */}
// //                 <div className="absolute inset-0 z-10 bg-blue-900/70 mix-blend-multiply"></div>
// //                 <div className="absolute inset-0 z-10 bg-gradient-to-t from-blue-900 via-transparent to-blue-900/40"></div>

// //                 <div className="relative z-20">
// //                     <div className="flex items-center gap-4 mb-8">
// //                         <div className="p-3 bg-white rounded-2xl shadow-2xl">
// //                             <Sprout size={32} className="text-blue-600" />
// //                         </div>
// //                         <span className="text-3xl font-black text-white tracking-tighter shadow-sm">
// //                             INTERN<span className="text-blue-200">Ship</span>
// //                         </span>
// //                     </div>

// //                     <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] mb-8 drop-shadow-xl">
// //                         ระบบประเมิน <br />
// //                         <span className="text-blue-200 text-4xl lg:text-6xl">ทักษะการปฏิบัติงาน <br /> แพทย์แผนไทย</span>
// //                     </h1>

// //                     <div className="hidden sm:block space-y-6">
// //                         {[
// //                             "ประเมินทักษะแต่ละรายวิชาออนไลน์",
// //                             "เชื่อมต่อข้อมูลระหว่างนักศึกษาและพี่เลี้ยง",
// //                             "สรุปผลคะแนนรายบุคคลอัตโนมัติ"
// //                         ].map((text, i) => (
// //                             <div key={i} className="flex items-center gap-4 text-white/90 drop-shadow-sm">
// //                                 <CheckCircle2 className="text-blue-300 shrink-0" />
// //                                 <p className="text-lg font-medium">{text}</p>
// //                             </div>
// //                         ))}
// //                     </div>
// //                 </div>

// //                 {/* Footer ฝั่งซ้าย (แสดงเฉพาะจอใหญ่) */}
// //                 <div className="absolute bottom-12 hidden lg:block text-white/40 text-xs font-medium z-20 uppercase tracking-widest">
// //                     Faculty of Thai Traditional Medicine
// //                 </div>
// //             </div>

// //             {/* --- ฝั่งขวา: เมนูเข้าใช้งาน (Menu Side) --- */}
// //             <div className="w-full lg:w-1/2 flex flex-col bg-slate-50 relative min-h-screen">

// //                 {/* ปุ่ม Admin Portal มุมขวาบน */}
// //                 <div className="p-6 flex justify-end shrink-0">
// //                     <Button
// //                         variant="ghost"
// //                         onClick={() => router.push('/admin/login')}
// //                         className="text-slate-400 hover:text-blue-600 font-bold gap-2 rounded-2xl h-12 px-6 bg-white/50 border border-slate-100 shadow-sm"
// //                     >
// //                         <ShieldCheck size={18} />
// //                         Admin
// //                     </Button>
// //                 </div>

// //                 {/* Content กลางหน้า */}
// //                 <div className="flex-1 flex flex-col justify-center px-8 lg:px-24">
// //                     <div className="max-w-md mx-auto w-full">
// //                         <div className="mb-12">
// //                             <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">ระบบประเมิน</h2>
// //                             <p className="text-slate-500 font-medium">กรุณาเลือกประเภทการลงทะเบียน</p>
// //                         </div>

// //                         <div className="space-y-6">
// //                             {/* เมนูนักศึกษา */}
// //                             <button
// //                                 onClick={() => router.push('/register')}
// //                                 className="w-full p-8 bg-white border-2 border-transparent hover:border-blue-600 rounded-[2.5rem] shadow-xl shadow-slate-200/50 transition-all flex items-center gap-6 group active:scale-[0.98] text-left"
// //                             >
// //                                 <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
// //                                     <GraduationCap size={32} />
// //                                 </div>
// //                                 <div className="flex-1">
// //                                     <h3 className="text-xl font-black text-slate-900">นักศึกษา</h3>
// //                                     <p className="text-slate-400 font-medium text-sm">ลงทะเบียนสถานที่ฝึกงาน</p>
// //                                 </div>
// //                                 <ArrowRight className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
// //                             </button>

// //                             {/* เมนูพี่เลี้ยง / บุคลากร */}
// //                             <button
// //                                 onClick={() => router.push('supervisor/register')}
// //                                 className="w-full p-8 bg-white border-2 border-transparent hover:border-slate-900 rounded-[2.5rem] shadow-xl shadow-slate-200/50 transition-all flex items-center gap-6 group active:scale-[0.98] text-left"
// //                             >
// //                                 <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
// //                                     <Hospital size={32} />
// //                                 </div>
// //                                 <div className="flex-1">
// //                                     <h3 className="text-xl font-black text-slate-900">พี่เลี้ยง / บุคลากร</h3>
// //                                     <p className="text-slate-400 font-medium text-sm">ลงทะเบียนเพื่อประเมินนักศึกษา</p>
// //                                 </div>
// //                                 <ArrowRight className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-2 transition-all" />
// //                             </button>
// //                         </div>
// //                     </div>
// //                 </div>

// //                 <div className="space-y-4">
// //                     {/* 1. เมนูนักศึกษา - ใช้ PSU Passport */}
// //                     <button
// //                         onClick={() => window.location.href = 'https://psusso.ttmedpsu.org/login.php?app=internship'} // ลิงก์ PSU SSO ที่คุณเคยระบุไว้
// //                         className="w-full p-6 bg-white border-2 border-transparent hover:border-blue-600 rounded-[2.5rem] shadow-lg shadow-slate-200/40 transition-all flex items-center gap-6 group active:scale-[0.98] text-left"
// //                     >
// //                         <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
// //                             <GraduationCap size={28} />
// //                         </div>
// //                         <div className="flex-1">
// //                             <h3 className="text-lg font-black text-slate-900">นักศึกษา</h3>
// //                             <p className="text-slate-400 font-medium text-xs">เข้าสู่ระบบด้วย PSU One Passport</p>
// //                         </div>
// //                         <ArrowRight className="text-slate-200 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" />
// //                     </button>

// //                     {/* 2. เมนูพี่เลี้ยง / อาจารย์ - ใช้ LINE */}
// //                     <button
// //                         onClick={() => router.push('/supervisor/register')}
// //                         className="w-full p-6 bg-white border-2 border-transparent hover:border-emerald-600 rounded-[2.5rem] shadow-lg shadow-slate-200/40 transition-all flex items-center gap-6 group active:scale-[0.98] text-left"
// //                     >
// //                         <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
// //                             <UserCheck size={28} />
// //                         </div>
// //                         <div className="flex-1">
// //                             <h3 className="text-lg font-black text-slate-900">พี่เลี้ยง / อาจารย์</h3>
// //                             <p className="text-slate-400 font-medium text-xs">เข้าใช้งานผ่าน LINE Application</p>
// //                         </div>
// //                         <ArrowRight className="text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all" />
// //                     </button>

// //                     {/* 3. เมนูแอดมิน - ใช้ Supabase Auth (Email/Password) */}
// //                     <button
// //                         onClick={() => router.push('/admin/login')}
// //                         className="w-full p-5 bg-slate-100 border-2 border-transparent hover:border-slate-400 rounded-[2.5rem] transition-all flex items-center gap-6 group active:scale-[0.98] text-left opacity-80 hover:opacity-100"
// //                     >
// //                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-all shrink-0">
// //                             <ShieldCheck size={24} />
// //                         </div>
// //                         <div className="flex-1">
// //                             <h3 className="text-md font-black text-slate-700">ผู้ดูแลระบบ (Admin)</h3>
// //                             <p className="text-slate-400 font-medium text-[10px]">Supabase Auth Management</p>
// //                         </div>
// //                         <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-800" />
// //                     </button>
// //                 </div>

// //                 {/* Footer ล่างสุดฝั่งขวา (Mobile Friendly) */}
// //                 <div className="p-10 mt-auto shrink-0 border-t lg:border-none border-slate-100 text-center lg:text-right">
// //                     <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
// //                         © 2026 Faculty of Traditional Medicine <br className="lg:hidden" /> All Rights Reserved.
// //                     </p>
// //                 </div>
// //             </div>
// //         </div>
// //     )
// // }



// //ver3
// "use client"
// import React, { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import Image from 'next/image'
// import { 
//     GraduationCap, UserCheck, ShieldCheck, ArrowRight, 
//     UserPlus, LogIn, Sprout, ChevronRight
// } from 'lucide-react'
// import liff from '@line/liff'
// import { createBrowserClient } from '@supabase/ssr'

// export default function SplitHomePage() {
//     const router = useRouter()
//     const [isChecking, setIsChecking] = useState(true)
//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     const handleLineLogin = async () => {
//         try {
//             await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
//             if (!liff.isLoggedIn()) {
//                 liff.login()
//                 return
//             }
//             const profile = await liff.getProfile()
//             const { data: user } = await supabase
//                 .from('supervisors')
//                 .select('is_verified, role')
//                 .eq('line_user_id', profile.userId)
//                 .single()

//             if (user) {
//                 if (user.is_verified) {
//                     // แยก Path อัตโนมัติ: ถ้า role เป็น teacher ไปหน้า dashboard อาจารย์
//                     router.replace(user.role === 'teacher' ? '/teacher/dashboard' : '/supervisor/dashboard')
//                 } else {
//                     router.replace('/supervisor/pending')
//                 }
//             } else {
//                 router.push('/supervisor/register')
//             }
//         } catch (err) {
//             console.error("Login failed", err)
//         }
//     }

//     useEffect(() => {
//         setIsChecking(false)
//     }, [])

//     if (isChecking) return (
//         <div className="min-h-screen flex items-center justify-center bg-white">
//             <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-indigo-600"></div>
//         </div>
//     )

//     return (
//         <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans">
            
//             {/* --- ฝั่งซ้าย: Visual Side (ใช้รูปในเครื่อง) --- */}
//             <div className="relative w-full lg:w-1/2 flex flex-col justify-center p-12 lg:p-24 overflow-hidden min-h-[450px]">
//                 <Image 
//                     src="/images/bg-thai-medicine.jpg" 
//                     alt="Thai Traditional Medicine"
//                     fill
//                     className="object-cover z-0 scale-105"
//                     priority
//                 />
//                 <div className="absolute inset-0 z-10 bg-indigo-950/80 mix-blend-multiply"></div>
//                 <div className="absolute inset-0 z-10 bg-gradient-to-tr from-indigo-900 via-transparent to-transparent opacity-60"></div>

//                 <div className="relative z-20 space-y-8">
//                     <div className="flex items-center gap-4">
//                         <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
//                             <Sprout size={32} className="text-indigo-200" />
//                         </div>
//                         <span className="text-3xl font-black text-white tracking-tighter">
//                             INTERN<span className="text-indigo-300">Ship</span>
//                         </span>
//                     </div>

//                     <div>
//                         <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight">
//                             ระบบประเมิน <br />
//                             <span className="text-indigo-300">ทักษะวิชาชีพ</span>
//                         </h1>
//                         <p className="text-indigo-100/70 text-lg font-medium mt-4 max-w-md">
//                             ยกระดับการติดตามและประเมินผลการฝึกปฏิบัติงาน แพทย์แผนไทยแบบครบวงจร
//                         </p>
//                     </div>
//                 </div>
                
//                 <div className="absolute bottom-12 left-12 lg:left-24 z-20">
//                     <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
//                         Faculty of Thai Traditional Medicine
//                     </p>
//                 </div>
//             </div>

//             {/* --- ฝั่งขวา: Menu Side (Registration & Login) --- */}
//             <div className="w-full lg:w-1/2 flex flex-col bg-slate-50 relative p-8 lg:p-24 justify-center">
//                 <div className="max-w-md mx-auto w-full space-y-16">
                    
//                     {/* ส่วนที่ 1: ลงทะเบียนใหม่ */}
//                     <div className="space-y-6">
//                         <div className="flex items-center gap-3 mb-2">
//                             <div className="h-[2px] w-8 bg-indigo-600"></div>
//                             <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">New Registration</h2>
//                         </div>
//                         <div className="grid grid-cols-2 gap-4">
//                             <button 
//                                 onClick={() => window.location.href = 'https://psusso.ttmedpsu.org/login.php?app=internship'}
//                                 className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-500 transition-all group text-left"
//                             >
//                                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
//                                     <GraduationCap size={24} />
//                                 </div>
//                                 <p className="text-sm font-black text-slate-800">นักศึกษา</p>
//                                 <p className="text-[10px] text-slate-400 font-bold mt-1">PSU SSO Login</p>
//                             </button>

//                             <button 
//                                 onClick={() => router.push('/supervisor/register')}
//                                 className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all group text-left"
//                             >
//                                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
//                                     <UserPlus size={24} />
//                                 </div>
//                                 <p className="text-sm font-black text-slate-800">พี่เลี้ยง/อาจารย์</p>
//                                 <p className="text-[10px] text-slate-400 font-bold mt-1">LINE Register</p>
//                             </button>
//                         </div>
//                     </div>

//                     {/* ส่วนที่ 2: เข้าสู่ระบบ (Single Login) */}
//                     <div className="space-y-6">
//                         <div className="flex items-center gap-3 mb-2">
//                             <div className="h-[2px] w-8 bg-indigo-600"></div>
//                             <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">System Access</h2>
//                         </div>
//                         <button 
//                             onClick={handleLineLogin}
//                             className="w-full p-8 bg-indigo-600 text-white rounded-[2.5rem] shadow-2xl shadow-indigo-200 flex items-center justify-between group hover:bg-indigo-700 transition-all active:scale-[0.98]"
//                         >
//                             <div className="flex items-center gap-5 text-left">
//                                 <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
//                                     <LogIn size={32} />
//                                 </div>
//                                 <div>
//                                     <h3 className="text-xl font-black leading-none">เข้าสู่ระบบด้วย LINE</h3>
//                                     <p className="text-indigo-200/80 text-[11px] font-bold mt-2 uppercase tracking-wider">สำหรับพี่เลี้ยงและอาจารย์</p>
//                                 </div>
//                             </div>
//                             <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">
//                                 <ChevronRight />
//                             </div>
//                         </button>
//                     </div>

//                     {/* Footer & Admin */}
//                     <div className="flex flex-col items-center gap-6 pt-4">
//                         <button 
//                             onClick={() => router.push('/admin/login')}
//                             className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-indigo-600 transition-colors"
//                         >
//                             <ShieldCheck size={14} /> Admin Portal
//                         </button>
//                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] text-center">
//                             © 2026 Prince of Songkla University
//                         </p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }


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
                router.push('/supervisor/register')
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