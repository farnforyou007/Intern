// // app/forgot-password/page.tsx
// "use client"
// import { useState , useEffect } from 'react'
// import { createBrowserClient } from '@supabase/ssr'
// import Swal from 'sweetalert2'
// import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
// import Link from 'next/link'
// import { useSearchParams } from 'next/navigation'
// export default function ForgotPasswordPage() {
//     const [email, setEmail] = useState('')
//     const [loading, setLoading] = useState(false)
//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     const searchParams = useSearchParams() // ✅ เรียกใช้งาน Hook
//     const error = searchParams.get('error') // ✅ ดึงค่าพารามิเตอร์ 'error' จาก URL

//     useEffect(() => {
//         // 1. ตรวจสอบจาก Query String (?) - กรณีที่คุณสั่ง Redirect เอง
//         const errorQuery = searchParams.get('error')

//         // 2. ตรวจสอบจาก URL Fragment (#) - กรณี Supabase ส่งกลับมาเองอัตโนมัติ
//         // เราจะตัดเครื่องหมาย # ออกแล้วนำไปสร้าง URLSearchParams เพื่อให้อ่านง่าย
//         const hashParams = new URLSearchParams(window.location.hash.substring(1))
//         const errorCode = hashParams.get('error_code') || searchParams.get('error_code')

//         if (errorQuery === 'expired' || errorCode === 'otp_expired') {
//             Swal.fire({
//                 title: 'ลิงก์หมดอายุ',
//                 text: 'ลิงก์นี้ถูกใช้งานไปแล้วหรือหมดเวลา กรุณากรอกอีเมลเพื่อรับลิงก์ใหม่ครับ',
//                 icon: 'warning',
//                 confirmButtonColor: '#1e293b'
//             })

//             // ล้าง URL ให้สะอาด (ลบ #... ออก) เพื่อไม่ให้เด้งซ้ำตอน Refresh
//             window.history.replaceState(null, '', window.location.pathname)
//         }
//     }, [searchParams])

//     const handleReset = async (e: React.FormEvent) => {
//         e.preventDefault()
//         setLoading(true)

//         const { error } = await supabase.auth.resetPasswordForEmail(email, {
//             // เมื่อคลิกลิงก์ในเมล จะส่งไปที่ callback เพื่อสร้าง session แล้วเด้งไปหน้าตั้งรหัสใหม่
//             redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
//         })

//         if (error) {
//             Swal.fire('เกิดข้อผิดพลาด', error.message, 'error')
//         } else {
//             Swal.fire('ส่งอีเมลแล้ว', 'กรุณาตรวจสอบอีเมลของคุณเพื่อดำเนินการต่อ', 'success')
//         }
//         setLoading(false)
//     }


//     if (error === 'auth-callback-failed' || error === 'link-expired') {
//         Swal.fire({
//             title: 'ลิงก์หมดอายุหรือใช้งานไม่ได้',
//             text: 'กรุณากดลืมรหัสผ่านเพื่อรับลิงก์รีเซ็ตใหม่อีกครั้งครับ',
//             icon: 'warning',
//             confirmButtonColor: '#1e293b'
//         })
//     }
//     return (
//         <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
//             <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
//                 <div className="text-center mb-8">
//                     <h1 className="text-2xl font-bold text-slate-800">ลืมรหัสผ่าน?</h1>
//                     <p className="text-slate-500 text-sm mt-2">ระบุอีเมลแอดมินเพื่อรับลิงก์ตั้งรหัสผ่านใหม่</p>
//                 </div>

//                 <form onSubmit={handleReset} className="space-y-5">
//                     <div className="relative">
//                         <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
//                         <input
//                             type="email"
//                             placeholder="อีเมลแอดมิน"
//                             className="w-full h-14 pl-14 pr-6 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10"
//                             onChange={(e) => setEmail(e.target.value)}
//                             required
//                         />
//                     </div>

//                     <button
//                         disabled={loading}
//                         className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all disabled:bg-slate-300 flex items-center justify-center gap-2"
//                     >
//                         {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
//                     </button>
//                 </form>

//                 <Link href="/login" className="flex items-center justify-center gap-2 mt-8 text-sm text-slate-500 hover:text-slate-800 transition-colors">
//                     <ArrowLeft className="w-4 h-4" /> กลับหน้าเข้าสู่ระบบ
//                 </Link>
//             </div>
//         </div>
//     )
// }

// ver2
"use client"
import { useState, useEffect, Suspense } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Swal from 'sweetalert2'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// 1. Move all the logic that uses useSearchParams into a separate component
function ForgotPasswordForm() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    useEffect(() => {
        const errorQuery = searchParams.get('error')
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const errorCode = hashParams.get('error_code') || searchParams.get('error_code')

        if (errorQuery === 'expired' || errorCode === 'otp_expired' || error === 'auth-callback-failed' || error === 'link-expired') {
            Swal.fire({
                title: 'ลิงก์หมดอายุหรือใช้งานไม่ได้',
                text: 'ลิงก์นี้ถูกใช้งานไปแล้วหรือหมดเวลา กรุณากรอกอีเมลเพื่อรับลิงก์ใหม่ครับ',
                icon: 'warning',
                confirmButtonColor: '#1e293b'
            })

            // Clean URL hash
            if (window.location.hash) {
                window.history.replaceState(null, '', window.location.pathname)
            }
        }
    }, [searchParams, error])

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
        })

        if (error) {
            Swal.fire('เกิดข้อผิดพลาด', error.message, 'error')
        } else {
            Swal.fire('ส่งอีเมลแล้ว', 'กรุณาตรวจสอบอีเมลของคุณเพื่อดำเนินการต่อ', 'success')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleReset} className="space-y-5">
            <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    type="email"
                    placeholder="อีเมลแอดมิน"
                    className="w-full h-14 pl-14 pr-6 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-blue-500/10"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
            </div>

            <button
                disabled={loading}
                className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all disabled:bg-slate-300 flex items-center justify-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
            </button>
        </form>
    )
}

// 2. The main Page component wraps the form in Suspense
export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
            <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-800">ลืมรหัสผ่าน?</h1>
                    <p className="text-slate-500 text-sm mt-2">ระบุอีเมลแอดมินเพื่อรับลิงก์ตั้งรหัสผ่านใหม่</p>
                </div>

                {/* This boundary fixes the "Missing Suspense" build error */}
                <Suspense fallback={
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                    </div>
                }>
                    <ForgotPasswordForm />
                </Suspense>

                <Link href="/login" className="flex items-center justify-center gap-2 mt-8 text-sm text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> กลับหน้าเข้าสู่ระบบ
                </Link>
            </div>
        </div>
    )
}