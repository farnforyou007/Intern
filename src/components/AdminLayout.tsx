// "use client"
// import React, { useState } from 'react'
// import { LayoutDashboard, Hospital, CalendarClock, BookOpen, UserCircle, Menu, X } from "lucide-react"
// import Link from 'next/link'
// import { usePathname } from 'next/navigation'
// import { LogOut } from 'lucide-react'

// const router = useRouter()
// const supabase = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// )

// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//     const pathname = usePathname()
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false) // State สำหรับมือถือ

//     const menuItems = [
//         { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin' },
//         { name: 'จัดการแหล่งฝึกงาน', icon: <Hospital size={20} />, href: '/admin/sites' },
//         { name: 'จัดการผลัดการฝึก', icon: <CalendarClock size={20} />, href: '/admin/rotations' },
//         { name: 'จัดการรายวิชา', icon: <BookOpen size={20} />, href: '/admin/subjects' },
//         { name: 'จัดการแบบประเมิน', icon: <BookOpen size={20} />, href: '/admin/templates' },
//         { name: 'จัดการพี่เลี้ยง', icon: <BookOpen size={20} />, href: '/admin/supervisors' },
//     ]

//     return (
//         <div className="flex min-h-screen font-sans bg-[#F8FAFC]">
//             {/* Overlay สำหรับปิดเมนูเมื่อกดพื้นที่ว่างบนมือถือ */}
//             {isSidebarOpen && (
//                 <div
//                     className="fixed inset-0 bg-black/50 z-40 lg:hidden"
//                     onClick={() => setIsSidebarOpen(false)}
//                 />
//             )}

//             {/* Sidebar */}
//             <aside className={`
//         fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 transform transition-transform duration-300 ease-in-out
//         lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
//       `}>
//                 <div className="p-8 text-white font-bold text-2xl flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                         <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">IES</div>
//                         Internship
//                     </div>
//                     {/* ปุ่มปิดบนมือถือ */}
//                     <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
//                         <X size={24} />
//                     </button>
//                 </div>

//                 <nav className="flex-1 px-4 space-y-2">
//                     {menuItems.map((item) => (
//                         <Link
//                             key={item.name}
//                             href={item.href}
//                             onClick={() => setIsSidebarOpen(false)} // ปิดเมนูเมื่อคลิก
//                             className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
//                         >
//                             {item.icon}
//                             <span className="font-medium">{item.name}</span>
//                         </Link>
//                     ))}
//                 </nav>
//             </aside>

//             {/* Main Content */}
//             <div className="flex-1 flex flex-col min-w-0">
//                 <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shadow-sm">
//                     <div className="flex items-center gap-4">
//                         {/* แฮมเบอร์เกอร์ปุ่ม */}
//                         <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsSidebarOpen(true)}>
//                             <Menu size={24} />
//                         </button>
//                         <div className="font-bold text-slate-700 text-lg hidden sm:block">Internship System</div>
//                     </div>
//                     <div className="flex items-center gap-3">
//                         <div className="text-right hidden sm:block">
//                             <p className="text-sm font-bold text-slate-900 leading-none">Admin</p>
//                             <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-widest">Administrator</p>
//                         </div>
//                         <UserCircle size={32} className="text-slate-300" />
//                     </div>
//                 </header>

//                 <main className="p-4 lg:p-10">{children}</main>
//             </div>
//         </div>
//     )
// }


// ver2
// "use client"

// import React, { useState, useEffect, useRef } from 'react'
// import { LayoutDashboard, Hospital, CalendarClock, BookOpen, UserCircle, Menu, X, LogOut } from "lucide-react"
// import Link from 'next/link'
// import { usePathname, useRouter } from 'next/navigation'
// import { createBrowserClient } from '@supabase/ssr'
// import Swal from 'sweetalert2'

// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//     const pathname = usePathname()
//     const router = useRouter()
//     const [isSidebarOpen, setIsSidebarOpen] = useState(false)
//     const [isLoading, setIsLoading] = useState(true)

//     const timerRef = useRef<NodeJS.Timeout | null>(null)
//     // สร้าง Supabase Client ภายใน Component
//     const supabase = createClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     const menuItems = [
//         { name: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin' },
//         { name: 'จัดการแหล่งฝึกงาน', icon: <Hospital size={20} />, href: '/admin/sites' },
//         { name: 'จัดการผลัดการฝึก', icon: <CalendarClock size={20} />, href: '/admin/rotations' },
//         { name: 'จัดการบุคลากร', icon: <UserRoundCheck size={20} />, href: '/admin/supervisors' },
//         { name: 'จัดการนักศึกษา', icon: <Users size={20} />, href: '/admin/students' },
//         { name: 'จัดการรายวิชา', icon: <BookOpen size={20} />, href: '/admin/subjects' },
//         { name: 'จัดการแบบประเมิน', icon: <ClipboardPen size={20} />, href: '/admin/templates' },
//         { name: 'ตั้งค่าระบบ', icon: <Settings size={20} />, href: '/admin/settings' },

//     ]

//     useEffect(() => {
//         const checkUser = async () => {
//             const { data: { session } } = await supabase.auth.getSession();
//             if (!session) {
//                 router.replace('/'); // ถ้าไม่มี Session ให้ดีดไปหน้า Login ทันที
//             }
//         };
//         checkUser();

//         // ติดตามการเปลี่ยนแปลงของ Auth (เช่น มีการล็อกเอาท์จาก Tab อื่น)
//         const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
//             if (event === 'SIGNED_OUT') {
//                 router.replace('/');
//             }
//         });

//         return () => subscription.unsubscribe();
//     }, []);

//     // ฟังก์ชันออกจากระบบ
//     const handleLogout = async () => {
//         const result = await Swal.fire({
//             title: 'ออกจากระบบ?',
//             text: "คุณต้องการออกจากระบบจัดการแอดมินใช่หรือไม่?",
//             icon: 'warning',
//             showCancelButton: true,
//             confirmButtonColor: '#3b82f6',
//             cancelButtonColor: '#64748b',
//             confirmButtonText: 'ยืนยัน',
//             cancelButtonText: 'ยกเลิก',
//             customClass: { popup: 'rounded-[2rem] font-sans' }
//         })

//         if (result.isConfirmed) {
//             const { error } = await supabase.auth.signOut()
//             localStorage.clear()
//             sessionStorage.clear()
//             if (!error) {
//                 router.push('/') // เปลี่ยนเส้นทางไปยังหน้า login หลังจากออกจากระบบ
//                 router.refresh()
//             }
//         }
//     }

//     useEffect(() => {
//     let timeoutId: NodeJS.Timeout;

//     const handleAutoLogout = async () => {
//         // ล้างข้อมูล
//         await supabase.auth.signOut();
//         localStorage.clear();
//         sessionStorage.clear();

//         await Swal.fire({
//             title: 'เซสชั่นหมดอายุ',
//             text: 'คุณไม่มีการเคลื่อนไหวนานเกินไป กรุณาเข้าสู่ระบบใหม่',
//             icon: 'warning',
//             confirmButtonText: 'ตกลง',
//             confirmButtonColor: '#3b82f6',
//             allowOutsideClick: false,
//             customClass: { popup: 'rounded-[2rem] font-sans' }
//         });

//         window.location.href = '/';
//     };

//     const resetTimer = () => {
//         if (timeoutId) clearTimeout(timeoutId);
//         // ตั้งเวลา 30 วินาทีสำหรับทดสอบ (30000 ms)
//         timeoutId = setTimeout(handleAutoLogout, 30000);
//     };

//     // ตรวจสอบก่อนว่าล็อกอินหรือยัง ถึงจะเริ่มนับถอยหลัง
//     const setupTimer = async () => {
//         const { data: { session } } = await supabase.auth.getSession();
//         if (session) {
//             resetTimer();
//             const events = ['mousemove', 'keypress', 'scroll', 'click', 'touchstart'];
//             events.forEach(event => window.addEventListener(event, resetTimer));
//         }
//     };

//     setupTimer();

//     return () => {
//         if (timeoutId) clearTimeout(timeoutId);
//         const events = ['mousemove', 'keypress', 'scroll', 'click', 'touchstart'];
//         events.forEach(event => window.removeEventListener(event, resetTimer));
//     };
// }, [supabase]); // ใส่ supabase เป็น dependency เดียวพอ

//     return (
//         <div className="flex min-h-screen font-sans bg-[#F8FAFC]">
//             {isSidebarOpen && (
//                 <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
//             )}

//             {/* <aside className={`
//                 fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out
//                 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
//             `}> */}
//             <aside className={`
//                 fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out
//                 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
//             `}>
//                 <div className="p-8 text-white font-bold text-2xl flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                         <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">IES</div>
//                         Internship
//                     </div>
//                     <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
//                         <X size={24} />
//                     </button>
//                 </div>

//                 <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
//                     {menuItems.map((item) => (
//                         <Link
//                             key={item.name}
//                             href={item.href}
//                             onClick={() => setIsSidebarOpen(false)}
//                             className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
//                         >
//                             {item.icon}
//                             <span className="font-medium">{item.name}</span>
//                         </Link>
//                     ))}
//                 </nav>

//                 {/* ปุ่ม Logout ด้านล่าง Sidebar */}
//                 <div className="p-4 mt-auto border-t border-slate-800">
//                     <button
//                         onClick={handleLogout}
//                         className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold"
//                     >
//                         <LogOut size={20} />
//                         <span>ออกจากระบบ</span>
//                     </button>
//                 </div>
//             </aside>

//             <div className="flex-1 flex flex-col min-w-0">
//                 <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shadow-sm">
//                     <div className="flex items-center gap-4">
//                         <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsSidebarOpen(true)}>
//                             <Menu size={24} />
//                         </button>
//                         <div className="font-bold text-slate-700 text-lg hidden sm:block">Internship System</div>
//                     </div>
//                     <div className="flex items-center gap-3">
//                         <div className="text-right hidden sm:block">
//                             <p className="text-sm font-bold text-slate-900 leading-none">Admin</p>
//                             <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-widest">Administrator</p>
//                         </div>
//                         <UserCircle size={32} className="text-slate-300" />
//                     </div>
//                 </header>

//                 <main className="p-4 lg:p-10">{children}</main>
//             </div>
//         </div>
//     )
// }

//ver4
"use client"

import React, { useState, useEffect, useRef } from 'react'
import {
    LayoutDashboard, Hospital, CalendarClock, BookOpen,
    UserCircle, Menu, X, LogOut, UserRoundCheck,
    Users, ClipboardPen, Settings
} from "lucide-react"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Swal from 'sweetalert2'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // ใช้ useRef เพื่อเก็บค่า Timeout ID ป้องกันการสร้าง Timer ซ้อนกันเมื่อ Re-render
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    // สร้าง Supabase Client
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const menuItems = [
        { name: 'แดชบอร์ด', icon: <LayoutDashboard size={20} />, href: '/admin' },
        { name: 'จัดการแหล่งฝึกงาน', icon: <Hospital size={20} />, href: '/admin/sites' },
        { name: 'จัดการผลัดการฝึก', icon: <CalendarClock size={20} />, href: '/admin/rotations' },
        { name: 'จัดการรายวิชา', icon: <BookOpen size={20} />, href: '/admin/subjects' },
        { name: 'จัดการแบบประเมิน', icon: <ClipboardPen size={20} />, href: '/admin/templates' },
        { name: 'จัดการบุคลากร', icon: <UserRoundCheck size={20} />, href: '/admin/supervisors' },
        { name: 'จัดการนักศึกษา', icon: <Users size={20} />, href: '/admin/students' },
        { name: 'ตั้งค่าระบบ', icon: <Settings size={20} />, href: '/admin/settings' },
    ]

    // ฟังก์ชันออกจากระบบ (เรียกใช้ได้ทั้งแบบกดเอง และแบบ Auto)
    // const performLogout = async (isAuto = false) => {
    //     if (timerRef.current) clearTimeout(timerRef.current)

    //     await supabase.auth.signOut()
    //     localStorage.clear()
    //     sessionStorage.clear()

    //     if (isAuto) {
    //         await Swal.fire({
    //             title: 'เซสชั่นหมดอายุ',
    //             text: 'คุณไม่มีการเคลื่อนไหวนานเกินไป กรุณาเข้าสู่ระบบใหม่',
    //             icon: 'warning',
    //             confirmButtonText: 'ตกลง',
    //             confirmButtonColor: '#3b82f6',
    //             allowOutsideClick: false,
    //             customClass: { popup: 'rounded-[2rem] font-sans' }
    //         })
    //     }
    //     window.location.href = '/' // ใช้ window.location เพื่อล้าง Memory Cache ของเบราว์เซอร์
    // }


    const performLogout = async (isAuto = false) => {
        // 1. เคลียร์ Timer ทันทีเพื่อไม่ให้รันซ้อน
        if (timerRef.current) clearTimeout(timerRef.current);

        if (isAuto) {
            // กรณีหมดเวลา: แสดง Swal ก่อน แล้วค่อย SignOut
            const result = await Swal.fire({
                title: 'เซสชั่นหมดอายุ',
                text: 'คุณไม่มีการเคลื่อนไหวนานเกินไป กรุณาเข้าสู่ระบบใหม่',
                icon: 'warning',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#3b82f6',
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: { popup: 'rounded-[2rem] font-sans' }
            });

            // เมื่อกดตกลง หรือ Swal ปิดลง ค่อยล้างข้อมูลและเด้งออก
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
        } else {
            // กรณีตั้งใจกด Logout เอง: ล้างข้อมูลแล้วเด้งออกทันที
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
        }
    };

    // ฟังก์ชันรีเซ็ตเวลา (Timer)
    const resetTimer = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        // ตั้งเวลา 30 วินาทีสำหรับทดสอบ (30000 ms) 
        // เปลี่ยนเป็น 1800000 เมื่อใช้งานจริง (30 นาที)
        timerRef.current = setTimeout(() => performLogout(true), 3600000)
    }

    useEffect(() => {
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                window.location.href = '/'
                return
            }

            setIsLoading(false)
            resetTimer() // เริ่มนับเวลาถอยหลัง

            // ดักจับเหตุการณ์การเคลื่อนไหวเพื่อรีเซ็ต Timer
            const events = ['mousemove', 'keypress', 'scroll', 'click', 'touchstart']
            events.forEach(event => window.addEventListener(event, resetTimer))
        }

        initAuth()

        // ติดตามการเปลี่ยนแปลง Auth (เช่น มีการ Logout จาก Tab อื่น)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            // if (event === 'SIGNED_OUT') window.location.href = '/'
        })

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
            subscription.unsubscribe()
            const events = ['mousemove', 'keypress', 'scroll', 'click', 'touchstart']
            events.forEach(event => window.removeEventListener(event, resetTimer))
        }
    }, [])

    const handleManualLogout = async () => {
        const result = await Swal.fire({
            title: 'ออกจากระบบ?',
            text: "คุณต้องการออกจากระบบจัดการแอดมินใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            customClass: { popup: 'rounded-[2rem] font-sans' }
        })

        if (result.isConfirmed) {
            performLogout(false)
        }
    }

    // if (isLoading) return (
    //     <div className="min-h-screen flex flex-col items-center justify-center bg-white">
    //         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
    //         <p className="font-black text-slate-400 uppercase tracking-widest text-xs">กำลังตรวจสอบสิทธิ์...</p>
    //     </div>
    // )

    if (isLoading) {
        return (
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
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">ตรวจสอบสิทธิ์</h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">กรุณารอซักครู่...</span>
                </div>
            </div>
        )
    }
    return (
        <div className="flex min-h-screen font-sans bg-[#F8FAFC]">
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-[#0F172A] text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out
                lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-8 text-white font-bold text-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">IES</div>
                        Internship
                    </div>
                    <button className="lg:hidden text-slate-400" onClick={() => setIsSidebarOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 mt-auto border-t border-slate-800">
                    <button
                        onClick={handleManualLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold"
                    >
                        <LogOut size={20} />
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 text-slate-600" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="font-bold text-slate-700 text-lg hidden sm:block">Internship System</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-900 leading-none">Admin</p>
                            <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-widest">Administrator</p>
                        </div>
                        <UserCircle size={32} className="text-slate-300" />
                    </div>
                </header>

                <main className="p-4 lg:p-10">{children}</main>
            </div>
        </div>
    )
}