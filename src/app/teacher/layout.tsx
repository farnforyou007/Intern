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


// ver2
"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ShieldAlert, GraduationCap, ArrowLeft, UserPlus } from 'lucide-react'

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [status, setStatus] = useState<'loading' | 'unregistered' | 'pending' | 'unauthorized' | 'authorized'>('loading')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const checkTeacherAccess = async () => {
            try {
                // 1. เริ่มต้นด้วยการ Loading
                setStatus('loading')

                // 🛠️ ช่วง DEV: ใช้ Mock ID ของพี่ (สลับใช้ liff.getProfile() เมื่อต่อจริง)
                // const lineUserId = 'U678862bd992a4cda7aaf972743b585ac' 
                const lineUserId = 'test-c'


                // 2. ดึงข้อมูล User และความสัมพันธ์กับวิชา
                const { data: user } = await supabase
                    .from('supervisors')
                    .select('id, is_verified, role, supervisor_subjects(id)')
                    .eq('line_user_id', lineUserId)
                    .single()

                // if (error || !user) {
                //     // 🚩 ถ้า Query ผิดพลาด หรือไม่เจอ ID 'test-c' จะตกมาที่นี่
                //     setStatus('unregistered')
                //     setIsAuthorized(false)
                //     return
                // }

                //     if (!user) {
                //         // 🚩 ไม่พบข้อมูลในระบบเลย
                //         setStatus('unregistered')
                //         setIsAuthorized(false)
                //     } else if (!user.is_verified) {
                //         // 🚩 พบข้อมูลแต่แอดมินยังไม่อนุมัติ (is_verified: false)
                //         setStatus('pending')
                //         setIsAuthorized(false)
                //         if (pathname !== '/teacher/pending') {
                //             router.replace('/teacher/pending')
                //         }
                //     } else {
                //         // ✅ อนุมัติแล้ว แต่ต้องเช็คต่อว่าเป็นอาจารย์ที่มีวิชาดูแลไหม
                //         // const isTeacher = user.subject_teachers && user.subject_teachers.length > 0
                //         const hasSubject = user.supervisor_subject && user.supervisor_subject.length > 0

                //         // if (!isTeacher) {
                //         //     setStatus('unauthorized')
                //         //     setIsAuthorized(false)
                //         // } else {
                //         //     // ✅ ผ่านทุกด่าน
                //         //     setStatus('authorized')
                //         //     setIsAuthorized(true)
                //         // }
                //         if (!hasSubject) {
                //             setStatus('unauthorized')
                //             setIsAuthorized(false)
                //         } else {
                //             setStatus('authorized')
                //             setIsAuthorized(true)
                //         }
                //     }
                // } catch (err) {
                //     console.error("Teacher access check failed", err)
                //     setStatus('unregistered')
                // }
                if (!user) {
                    setStatus('unregistered')
                    setIsAuthorized(false)
                } else if (!user.is_verified) {
                    setStatus('pending')
                    setIsAuthorized(false)
                    if (pathname !== '/teacher/pending') {
                        router.replace('/teacher/pending')
                    }
                } else {
                    // ✅ อนุมัติแล้ว เช็คว่ามีการผูกวิชาในตารางกลางหรือยัง
                    const hasSubjects = user.supervisor_subjects && user.supervisor_subjects.length > 0

                    // ตรวจสอบเบื้องต้นว่าเป็นอาจารย์ไหม (เพื่อความชัวร์)
                    if (user.role === 'teacher' && hasSubjects) {
                        setStatus('authorized')
                        setIsAuthorized(true)
                    } else {
                        // ถ้าเป็นอาจารย์แต่ไม่มีวิชา หรือเป็น Role อื่นที่หลุดเข้ามา
                        setStatus('unauthorized')
                        setIsAuthorized(false)
                    }
                }
            } catch (err) {
                console.error("Teacher access check failed", err)
                setStatus('unregistered')
            }
        }
        checkTeacherAccess()
    }, [pathname])

    // --- 1. หน้า Loading (Style เดียวกับพี่เลี้ยง แต่โทน Indigo) ---
    if (status === 'loading') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative font-sans">
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-[100px]"></div>
                </div>

                <div className="relative flex flex-col items-center">
                    <div className="relative w-20 h-20 mb-8">
                        {/* วงนอก (Indigo) */}
                        <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-indigo-600 animate-spin"></div>
                        {/* วงใน (Blue) */}
                        <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-t-blue-400 animate-[spin_0.8s_linear_infinite]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2 text-center">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] ml-[0.3em]">
                            ตรวจสอบสิทธิ์อาจารย์
                        </h2>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                กรุณารอซักครู่...
                            </span>
                            <span className="flex gap-0.5">
                                <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_100ms]"></span>
                                <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                                <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_300ms]"></span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // --- 2. หน้าไม่พบข้อมูล (Unregistered) ---
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
                <button
                    onClick={() => router.push('/register')}
                    className="w-full max-w-xs py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <UserPlus size={20} />
                    ลงทะเบียนอาจารย์
                </button>
            </div>
        )
    }

    // --- 3. หน้าพบข้อมูลแต่ไม่มีสิทธิ์วิชา (Unauthorized) ---
    if (status === 'unauthorized') {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-[#F0F7FF] animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-white text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-indigo-100">
                    <ShieldAlert size={48} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">ไม่พบรายวิชาที่ดูแล</h2>
                <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed text-sm">
                    คุณได้รับการอนุมัติแล้ว แต่ยังไม่มีรายวิชาที่รับผิดชอบในระบบ กรุณาติดต่อแอดมินเพื่อผูกข้อมูลวิชา
                </p>
                <button
                    onClick={() => router.replace('/auth/check')}
                    className="w-full max-w-xs py-5 bg-indigo-600 text-white rounded-3xl font-black text-sm shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <ArrowLeft size={20} />
                    กลับไปตรวจสอบสิทธิ์
                </button>
            </div>
        )
    }

    return <>{children}</>
}