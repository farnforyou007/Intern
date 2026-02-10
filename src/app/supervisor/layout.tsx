// "use client"
// import { useEffect, useState } from 'react'
// import { useRouter, usePathname } from 'next/navigation'
// import liff from '@line/liff'
// import { createBrowserClient } from '@supabase/ssr'
// import { ShieldAlert } from 'lucide-react';
// export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
//     const router = useRouter()
//     const pathname = usePathname()
//     const [isAuthorized, setIsAuthorized] = useState(false)

//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     useEffect(() => {
//         const checkAccess = async () => {
//             // 1. ยกเว้นหน้าลงทะเบียนและหน้า Pending ไม่ต้องดักแบบ Redirect Loop
//             if (pathname === '/supervisor/register' || pathname === '/supervisor/pending') {
//                 setIsAuthorized(true)
//                 return
//             }

//             try {
//                 // 2. เริ่มการทำงาน LIFF (ใช้ ID จากรูปที่คุณส่งมาในระบบ LINE Dev)
//                 await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })

//                 if (!liff.isLoggedIn()) {
//                     liff.login({ redirectUri: window.location.href })
//                     return
//                 }

//                 const profile = await liff.getProfile()

//                 // 3. ตรวจสอบสถานะใน Database
//                 const { data: user, error } = await supabase
//                     .from('supervisors')
//                     .select('is_verified')
//                     .eq('line_user_id', profile.userId)
//                     .single()

//                 if (error || !user) {
//                     // ไม่พบข้อมูลบุคลากร -> ดีดไปหน้าลงทะเบียน
//                     router.replace('/supervisor/register')
//                 } else if (!user.is_verified) {
//                     // พบข้อมูลแต่ยังไม่อนุมัติ -> ดีดไปหน้า Pending
//                     router.replace('/supervisor/pending')
//                 } else {
//                     // ผ่านการตรวจสอบ -> อนุญาตให้เข้าถึงเนื้อหา
//                     setIsAuthorized(true)
//                 }
//             } catch (err) {
//                 console.error("Access check failed", err)
//                 router.replace('/') // หากเกิดข้อผิดพลาดร้ายแรงให้กลับไปหน้าแรก
//             }
//         }

//         checkAccess()
//     }, [pathname, router])

//     // ระหว่างตรวจสอบสิทธิ์ ให้แสดงหน้า Loading
//     if (!isAuthorized) {
//     return (
//         <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
//             <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
//                 <ShieldAlert size={40} />
//             </div>
//             <h2 className="text-xl font-black text-slate-900 mb-2">คุณไม่มีสิทธิ์เข้าใช้งานหน้าบุคลากร</h2>
//             <p className="text-sm text-slate-400 font-medium mb-8">กรุณาลงทะเบียนหรือรอการอนุมัติจากผู้ดูแลระบบ</p>
//             <button 
//                 onClick={() => router.push('/supervisor/register')}
//                 className="px-8 py-4 bg-[#064e3b] text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
//             >
//                 ไปหน้าลงทะเบียน
//             </button>
//         </div>
//     )
// }

//     return <>{children}</>
// }




// "use client"
// import { useEffect, useState } from 'react'
// import { useRouter, usePathname } from 'next/navigation'
// import liff from '@line/liff'
// import { createBrowserClient } from '@supabase/ssr'
// import { ShieldAlert } from 'lucide-react'

// export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
//     const router = useRouter()
//     const pathname = usePathname()
//     const [isAuthorized, setIsAuthorized] = useState(false)

//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     useEffect(() => {
//         const checkAccess = async () => {
//             // ยกเว้นหน้าลงทะเบียนไม่ต้องดักสิทธิ์ละเอียด
//             if (pathname === '/supervisor/register' || pathname === '/supervisor/pending') {
//                 setIsAuthorized(true)
//                 return
//             }

//             try {
//                 await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
//                 if (!liff.isLoggedIn()) {
//                     liff.login({ redirectUri: window.location.href })
//                     return
//                 }

//                 const profile = await liff.getProfile()
//                 const { data: user } = await supabase
//                     .from('supervisors')
//                     .select('is_verified')
//                     .eq('line_user_id', profile.userId)
//                     .single()

//                 if (!user) {
//                     router.replace('/supervisor/register')
//                 } else if (!user.is_verified && pathname !== '/supervisor/pending') {
//                     router.replace('/supervisor/pending')
//                 } else {
//                     setIsAuthorized(true) // อนุมัติให้เข้าถึงหน้าลูกๆ ได้
//                 }
//             } catch (err) {
//                 console.error("Access check failed", err)
//                 router.replace('/')
//             }
//         }
//         checkAccess()
//     }, [pathname])

//     if (!isAuthorized) {
//         return (
//             <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
//                 <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
//                     <ShieldAlert size={40} />
//                 </div>
//                 <h2 className="text-xl font-black text-slate-900 mb-2">คุณไม่มีสิทธิ์เข้าใช้งานหน้าบุคลากร</h2>
//                 <p className="text-sm text-slate-400 font-medium mb-8">กรุณาลงทะเบียนหรือรอการอนุมัติจากผู้ดูแลระบบ</p>
//                 <button
//                     onClick={() => router.push('/supervisor/register')}
//                     className="px-8 py-4 bg-[#064e3b] text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
//                 >
//                     ไปหน้าลงทะเบียน
//                 </button>
//             </div>
//         )
//     }

//     return <>{children}</>
// }


// ver4
"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import liff from '@line/liff'
import { createBrowserClient } from '@supabase/ssr'
import { ShieldAlert, UserPlus } from 'lucide-react'

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [status, setStatus] = useState<'loading' | 'unregistered' | 'pending' | 'authorized'>('loading')

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const checkAccess = async () => {
            // หน้าลงทะเบียนให้ผ่านตลอด
            if (pathname === '/supervisor/register') {
                setStatus('authorized')
                setIsAuthorized(true)
                return
            }

            try {
                await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
                
                if (!liff.isLoggedIn()) {
                    liff.login({ redirectUri: window.location.href })
                    return
                }

                const profile = await liff.getProfile()
                const { data: user } = await supabase
                    .from('supervisors')
                    .select('is_verified')
                    .eq('line_user_id', profile.userId)
                    .single()

                if (!user) {
                    // 🚩 ไม่พบข้อมูล: ตั้งสถานะให้ค้างหน้าแจ้งเตือนไว้ ไม่สั่ง redirect
                    setStatus('unregistered')
                    setIsAuthorized(false)
                } else if (!user.is_verified) {
                    // 🚩 พบข้อมูลแต่ยังไม่อนุมัติ: ค้างหน้าแจ้งเตือนไว้ หรือส่งไปหน้า Pending
                    setStatus('pending')
                    setIsAuthorized(false)
                    if (pathname !== '/supervisor/pending') {
                        router.replace('/supervisor/pending')
                    }
                } else {
                    // ✅ อนุมัติแล้ว
                    setStatus('authorized')
                    setIsAuthorized(true)
                }
            } catch (err) {
                console.error("Access check failed", err)
                setStatus('unregistered')
            }
        }
        checkAccess()
    }, [pathname])

    // --- ส่วนแสดงผลหน้าแจ้งเตือน (ค้างไว้ให้กดเอง) ---
    if (status === 'unregistered') {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-white animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm">
                    <ShieldAlert size={48} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">เข้าถึงไม่ได้</h2>
                <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed">
                    ขออภัย คุณยังไม่มีสิทธิ์เข้าใช้งานในส่วนนี้ กรุณาลงทะเบียนข้อมูลบุคลากรก่อนเข้าใช้งานระบบ
                </p>
                
                <button 
                    onClick={() => router.push('/supervisor/register')}
                    className="w-full max-w-xs py-5 bg-[#064e3b] text-white rounded-3xl font-black text-sm shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <UserPlus size={20} />
                    ลงทะเบียนเข้าใช้งาน
                </button>
                
                <button 
                    onClick={() => router.replace('/')}
                    className="mt-6 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                    กลับหน้าหลัก
                </button>
            </div>
        )
    }

    // หน้า Loading ระหว่างเช็กสิทธิ์
    if (status === 'loading') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#064e3b] mb-4"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checking Permission...</p>
            </div>
        )
    }

    return <>{children}</>
}