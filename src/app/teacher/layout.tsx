// "use client"
// import { useEffect, useState } from 'react'
// import { useRouter, usePathname } from 'next/navigation'
// import { createBrowserClient } from '@supabase/ssr'
// import { ShieldAlert, GraduationCap, ArrowLeft } from 'lucide-react'
// import { Skeleton } from "@/components/ui/skeleton"

// export default function TeacherLayout({ children }: { children: React.ReactNode }) {
//     const router = useRouter()
//     const pathname = usePathname()
//     const [status, setStatus] = useState<'loading' | 'unauthorized' | 'authorized'>('loading')

//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     useEffect(() => {
//         const checkAccess = async () => {
//             try {
//                 // 🛠️ ช่วง DEV: ใช้ Mock ID
//                 const lineUserId = 'U678862bd992a4cda7aaf972743b585ac'

//                 // เช็คว่ามีข้อมูลในตาราง supervisors และมีวิชาใน subject_teachers หรือไม่
//                 const { data: user } = await supabase
//                     .from('supervisors')
//                     .select('id, is_verified, subject_teachers(id)')
//                     .eq('line_user_id', lineUserId)
//                     .single()

//                 const isTeacher = user?.subject_teachers && user.subject_teachers.length > 0
//                 if (user && !user.is_verified) {
//                     if (pathname !== '/teacher/pending') {
//                         router.replace('/teacher/pending')
//                     }
//                     setStatus('authorized') // เพื่อให้ Render หน้า Pending ได้
//                     return
//                 }
//                 if (!user || !user.is_verified || !isTeacher) {
//                     setStatus('unauthorized')
//                 } else {
//                     setStatus('authorized')
//                 }
//             } catch (err) {
//                 setStatus('unauthorized')
//             }
//         }
//         checkAccess()
//     }, [pathname])

//     // --- Loading State (Skeleton) ---
//     if (status === 'loading') {
//         return (
//             <div className="min-h-screen bg-[#F0F7FF] p-6 space-y-8">
//                 <Skeleton className="h-44 w-full rounded-[3.5rem] bg-indigo-200 shimmer-wrapper" />
//                 <div className="grid grid-cols-3 gap-3">
//                     <Skeleton className="h-24 rounded-3xl bg-white shimmer-wrapper" />
//                     <Skeleton className="h-24 rounded-3xl bg-white shimmer-wrapper" />
//                     <Skeleton className="h-24 rounded-3xl bg-white shimmer-wrapper" />
//                 </div>
//             </div>
//         )
//     }

//     // --- Unauthorized State (หน้าแจ้งเตือนแบบเดียวกับพี่เลี้ยงแต่เป็นสีน้ำเงิน) ---
//     if (status === 'unauthorized') {
//         return (
//             <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F0F7FF] animate-in fade-in duration-500">
//                 <div className="w-24 h-24 bg-white text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100">
//                     <ShieldAlert size={48} />
//                 </div>
//                 <h2 className="text-2xl font-black text-slate-900 mb-3">ไม่พบสิทธิ์อาจารย์</h2>
//                 <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed">
//                     ขออภัย คุณไม่มีรายวิชาที่รับผิดชอบในระบบ หรือยังไม่ได้รับอนุมัติให้เข้าใช้งานส่วนอาจารย์
//                 </p>

//                 <button
//                     onClick={() => router.replace('/auth/check')}
//                     className="w-full max-w-xs py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
//                 >
//                     <ArrowLeft size={20} />
//                     กลับไปตรวจสอบสิทธิ์
//                 </button>
//             </div>
//         )
//     }

//     return <>{children}</>
// }


// ver3 — Sidebar Layout
"use client"
import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import {
    ShieldAlert, ArrowLeft, ArrowRight, UserPlus, LayoutDashboard, GraduationCap, BookOpen, Settings, Users, LogOut, Menu, X, UserCircle, ListChecks
} from 'lucide-react'
import Link from 'next/link'
import Swal from 'sweetalert2'
import liff from '@line/liff'
import { getLineUserId } from '@/utils/auth';
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [status, setStatus] = useState<'loading' | 'unregistered' | 'pending' | 'unauthorized' | 'authorized'>('loading')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [user, setUser] = useState<any>(null);
    const isLogoutInProgress = useRef(false);
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const menuItems = [
        { name: 'แดชบอร์ด', desc: 'ภาพรวม KPI และสถิติ', icon: <LayoutDashboard size={20} />, href: '/teacher/dashboard' },
        { name: 'รายชื่อนักศึกษา', desc: 'ข้อมูลติดต่อ นศ.', icon: <Users size={20} />, href: '/teacher/students' },
        { name: 'จัดการเกณฑ์ประเมิน', desc: 'ตั้งค่าหมวดและข้อคำถาม', icon: <ListChecks size={20} />, href: '/teacher/criteria' },
        { name: 'ผลการประเมิน', desc: 'คะแนนและส่งออก Excel', icon: <BookOpen size={20} />, href: '/teacher/evaluations' },
        { name: 'ข้อมูลส่วนตัว', desc: 'ข้อมูลส่วนตัวและวิชาที่ดูแล', icon: <Settings size={20} />, href: '/teacher/profile' },
    ]

    const performLogout = async (isAuto = false) => {
        if (isLogoutInProgress.current) return;
        isLogoutInProgress.current = true;

        if (isAuto) {
            await Swal.fire({
                title: 'เซสชั่นหมดอายุ',
                text: 'คุณไม่มีการเคลื่อนไหวนานเกินไป กรุณาเข้าสู่ระบบใหม่',
                icon: 'warning',
                confirmButtonText: 'ตกลง',
                confirmButtonColor: '#4f46e5',
                allowOutsideClick: false,
                allowEscapeKey: false,
                customClass: { popup: 'rounded-[2rem] font-sans' }
            });
        }

        // เคลียร์ Storage ทั้งหมด
        localStorage.clear();
        sessionStorage.clear();

        try {
            await Promise.race([
                supabase.auth.signOut({ scope: 'local' }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('signOut timeout')), 2000))
            ]);
        } catch (e) {
            console.warn('signOut skipped or timed out:', e);
        }

        window.location.href = '/';
    };

    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'ออกจากระบบ?',
            text: "คุณต้องการออกจากระบบอาจารย์ใช่หรือไม่?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            customClass: { popup: 'rounded-[2rem] font-sans' }
        })
        if (result.isConfirmed) {
            performLogout();
        }
    }

    // useEffect(() => {

    //     const checkTeacherAccess = async () => {
    //         try {
    //             setStatus('loading')
    //             const lineUserId = 'test-c'

    //             const { data: user } = await supabase
    //                 .from('supervisors')
    //                 .select('id, is_verified, role, supervisor_subjects(id)')
    //                 .eq('line_user_id', lineUserId)
    //                 .single()

    //             if (!user) {
    //                 setStatus('unregistered')
    //                 setIsAuthorized(false)
    //             } else if (!user.is_verified) {
    //                 setStatus('pending')
    //                 setIsAuthorized(false)
    //                 if (pathname !== '/teacher/pending') {
    //                     router.replace('/teacher/pending')
    //                 }
    //             } else {
    //                 const hasSubjects = user.supervisor_subjects && user.supervisor_subjects.length > 0
    //                 if (user.role === 'teacher' && hasSubjects) {
    //                     setStatus('authorized')
    //                     setIsAuthorized(true)
    //                 } else {
    //                     setStatus('unauthorized')
    //                     setIsAuthorized(false)
    //                 }
    //             }
    //         } catch (err) {
    //             console.error("Teacher access check failed", err)
    //             setStatus('unregistered')
    //         }
    //     }
    //     checkTeacherAccess()
    // }, [pathname])

    // Close sidebar on route change

    const [showTroubleshoot, setShowTroubleshoot] = useState(false);

    useEffect(() => {
        let hangTimer: NodeJS.Timeout;
        const checkTeacherAccess = async () => {
            try {
                const cachedAuth = sessionStorage.getItem('teacher_auth_status')
                if (cachedAuth === 'authorized') {
                    if (status !== 'authorized') setStatus('authorized')
                    return
                }

                setStatus('loading')
                hangTimer = setTimeout(() => setShowTroubleshoot(true), 7000);

                const urlParams = new URLSearchParams(window.location.search);
                const lineUserId = await getLineUserId(urlParams);

                if (!lineUserId) {
                    performLogout();
                    return;
                }

                // Fetch with timeout
                const res = await Promise.race([
                    fetch(`/api/teacher/profile?lineUserId=${lineUserId}`),
                    new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('Fetch timeout')), 6000))
                ]);
                const result = await res.json()

                if (!result.success || !result.data) {
                    setStatus('unregistered')
                    setIsAuthorized(false)
                    clearTimeout(hangTimer);
                    return
                }

                const userData = result.data
                setUser(userData);

                if (!userData.is_verified) {
                    setStatus('pending')
                    setIsAuthorized(false)
                    if (pathname !== '/teacher/pending') {
                        router.replace('/teacher/pending')
                    }
                } else {
                    const hasSubjects = userData.supervisor_subjects && userData.supervisor_subjects.length > 0
                    const canAccess = userData.role === 'teacher' || userData.role === 'both'

                    if (canAccess && hasSubjects) {
                        sessionStorage.setItem('teacher_auth_status', 'authorized')
                        setStatus('authorized')
                        setIsAuthorized(true)
                    } else {
                        setStatus('unauthorized')
                        setIsAuthorized(false)
                    }
                }
            } catch (err) {
                console.error("Teacher access check failed", err)
                // ถ้าเคยเป็น authorized มาก่อน อนุโลมให้ใช้ต่อ (อาจจะแค่เน็ตหลุด)
                if (sessionStorage.getItem('teacher_auth_status') === 'authorized') {
                    setStatus('authorized');
                    setIsAuthorized(true);
                } else {
                    setStatus('unregistered')
                }
            } finally {
                if (hangTimer) clearTimeout(hangTimer);
            }
        }
        checkTeacherAccess()
        return () => { if (hangTimer) clearTimeout(hangTimer) }
    }, [pathname])

    useEffect(() => { setIsSidebarOpen(false) }, [pathname])

    // --- Loading ---
    if (status === 'loading') {
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
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">ตรวจสอบสิทธิ์อาจารย์</h2>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 mb-8">กรุณารอซักครู่...</span>

                    {/* Troubleshooting UI */}
                    {showTroubleshoot && (
                        <div className="mt-4 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <p className="text-[10px] text-slate-400 mb-4 max-w-[200px] text-center leading-relaxed">
                                ใช้เวลานานผิดปกติ? อาจเกิดจากเซสชั่นเดิมค้าง
                            </p>
                            <button
                                onClick={() => performLogout()}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                            >
                                ออกจากระบบเพื่อเริ่มใหม่
                            </button>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // --- Unregistered ---
    if (status === 'unregistered') {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-white animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm">
                    <ShieldAlert size={48} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">ไม่พบข้อมูลในระบบ</h2>
                <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed text-sm">
                    ขออภัย คุณยังไม่ได้ลงทะเบียนในระบบ หรือยังไม่มีข้อมูลบุคลากรในฐานข้อมูลของเรา
                </p>
                <button onClick={() => router.push('/register')} className="w-full max-w-xs py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <UserPlus size={20} /> ลงทะเบียนอาจารย์
                </button>
            </div>
        )
    }

    // --- Unauthorized ---
    /* The above code is a TypeScript React component that checks if the `status` variable is equal to 'unauthorized'. If the condition is met, it renders a UI displaying a message indicating that no courses are found for the user to manage. It includes a title, description, and a button that allows the user to navigate back to the authentication check page. The UI is styled using Tailwind CSS classes for layout, colors, typography, and animations. */
    // if (status === 'unauthorized') {
    //     return (
    //         <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F0F7FF] animate-in fade-in duration-500">
    //             <div className="w-24 h-24 bg-white text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100">
    //                 <ShieldAlert size={48} />
    //             </div>
    //             <h2 className="text-2xl font-black text-slate-900 mb-3">ไม่พบรายวิชาที่ดูแล</h2>
    //             <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed text-sm">
    //                 คุณได้รับการอนุมัติแล้ว แต่ยังไม่มีรายวิชาที่รับผิดชอบในระบบ กรุณาติดต่อแอดมินเพื่อผูกข้อมูลวิชา
    //             </p>
    //             <button onClick={() => router.replace('/auth/check')} className="w-full max-w-xs py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-all">
    //                 <ArrowLeft size={20} /> กลับไปตรวจสอบสิทธิ์
    //             </button>
    //         </div>
    //     )
    // }

    if (status === 'unauthorized') {
        // เช็คว่าจริงๆ แล้วเขาเป็นใคร
        const isActuallySupervisor = user?.role === 'supervisor';

        return (
            <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F0F7FF] animate-in fade-in duration-500 font-sans">
                <div className="w-24 h-24 bg-white text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100">
                    <ShieldAlert size={48} />
                </div>

                {isActuallySupervisor ? (
                    // กรณี A: เป็นพี่เลี้ยงแต่หลงเข้ามาหน้าอาจารย์
                    <>
                        <h2 className="text-2xl font-black text-slate-900 mb-3">เข้าถึงเฉพาะอาจารย์</h2>
                        <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed text-sm">
                            บัญชีของคุณคือ <span className="text-indigo-600 font-bold">"พี่เลี้ยง"</span> ไม่สามารถเข้าใช้งานระบบในส่วนของอาจารย์ได้ กรุณากลับไปที่หน้า Dashboard ของคุณ
                        </p>
                        <button
                            onClick={() => router.replace('/supervisor/dashboard')}
                            className="w-full max-w-xs py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            ไปยังหน้าพี่เลี้ยง <ArrowRight size={20} />
                        </button>
                    </>
                ) : (
                    // กรณี B: เป็นอาจารย์จริงๆ แต่ยังไม่มีวิชา (เหมือนเดิม)
                    <>
                        <h2 className="text-2xl font-black text-slate-900 mb-3">ไม่พบรายวิชาที่ดูแล</h2>
                        <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed text-sm">
                            คุณมีสิทธิ์เป็นอาจารย์แล้ว แต่ยังไม่มีรายวิชาที่รับผิดชอบในระบบ กรุณาติดต่อแอดมินเพื่อผูกข้อมูลวิชา
                        </p>
                        <button
                            onClick={() => router.replace('/')}
                            className="w-full max-w-xs py-5 bg-slate-800 text-white rounded-3xl font-black text-sm shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <ArrowLeft size={20} /> กลับหน้าหลัก
                        </button>
                    </>
                )}
            </div>
        )
    }

    // --- ✅ Authorized: Sidebar Layout ---
    return (
        <div className="flex min-h-screen font-sans bg-[#F8FAFC]">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-[#1e1b4b] text-slate-300 flex flex-col transform transition-transform duration-300 ease-in-out
                lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Sidebar Header */}
                <div className="p-6 text-white flex items-center justify-between border-b border-indigo-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/50">
                            <GraduationCap size={18} />
                        </div>
                        <div>
                            <p className="font-black text-sm leading-none">Internship</p>
                            <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-widest mt-0.5">Teacher Portal</p>
                        </div>
                    </div>
                    <button className="lg:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setIsSidebarOpen(false)}>
                        <X size={22} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/teacher/dashboard' && pathname.startsWith(item.href))
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                    }`}
                            >
                                <div className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'}`}>
                                    {item.icon}
                                </div>
                                <div className="min-w-0">
                                    <p className={`font-medium leading-none ${isActive ? 'text-white' : ''}`}>{item.name}</p>
                                    <p className={`text-[10px] font-medium mt-1 leading-none ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>{item.desc}</p>
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <div className="p-3 border-t border-indigo-800/50">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold text-sm"
                    >
                        <LogOut size={18} />
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all" onClick={() => setIsSidebarOpen(true)}>
                            <Menu size={24} />
                        </button>
                        <div className="font-bold text-slate-700 text-lg hidden sm:block">Internship System</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-black text-slate-900 leading-none">{user?.full_name || 'Teacher'}</p>
                            <p className="text-[10px] text-blue-600 font-bold mt-1 uppercase tracking-widest truncate max-w-[200px]">
                                {user?.supervisor_subjects && user.supervisor_subjects.length > 0
                                    ? user.supervisor_subjects.map((s: any) => s.subjects?.name).filter(Boolean).join(', ')
                                    : 'รายวิชาที่รับผิดชอบ'}
                            </p>
                        </div>
                        <UserCircle size={32} className="text-slate-300" />
                    </div>
                </header>

                <main className="p-4 lg:p-10 flex-1">{children}</main>
            </div>
        </div>
    )
}