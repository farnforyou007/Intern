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




"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import liff from '@line/liff'
import { createBrowserClient } from '@supabase/ssr'
import { ShieldAlert } from 'lucide-react'

export default function SupervisorLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        const checkAccess = async () => {
            // ยกเว้นหน้าลงทะเบียนไม่ต้องดักสิทธิ์ละเอียด
            if (pathname === '/supervisor/register' || pathname === '/supervisor/pending') {
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
                    router.replace('/supervisor/register')
                } else if (!user.is_verified && pathname !== '/supervisor/pending') {
                    router.replace('/supervisor/pending')
                } else {
                    setIsAuthorized(true) // อนุมัติให้เข้าถึงหน้าลูกๆ ได้
                }
            } catch (err) {
                console.error("Access check failed", err)
                router.replace('/')
            }
        }
        checkAccess()
    }, [pathname])

    if (!isAuthorized) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
                <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-6">
                    <ShieldAlert size={40} />
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">คุณไม่มีสิทธิ์เข้าใช้งานหน้าบุคลากร</h2>
                <p className="text-sm text-slate-400 font-medium mb-8">กรุณาลงทะเบียนหรือรอการอนุมัติจากผู้ดูแลระบบ</p>
                <button
                    onClick={() => router.push('/supervisor/register')}
                    className="px-8 py-4 bg-[#064e3b] text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all"
                >
                    ไปหน้าลงทะเบียน
                </button>
            </div>
        )
    }

    return <>{children}</>
}