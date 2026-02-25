// ver2
"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import liff from '@line/liff'

export default function AuthCheckPage() {
    const router = useRouter()
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // ใช้แค่ loading เพราะหน้านี้ทำหน้าที่เป็น Router เฉยๆ
    const [status, setStatus] = useState<'loading' | 'authorized'>('loading')

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // 🚀 1. เช็ก Cache ก่อน ถ้าเคยเข้าแล้วให้ดีดไปหน้า Dashboard เลย
                const cachedSupervisor = sessionStorage.getItem('supervisor_auth_status');
                const cachedTeacher = sessionStorage.getItem('teacher_auth_status');

                if (cachedSupervisor === 'authorized') {
                    router.replace('/supervisor/dashboard');
                    return;
                }
                if (cachedTeacher === 'authorized') {
                    router.replace('/teacher/dashboard');
                    return;
                }

                // 🌐 2. เริ่มต้น LIFF
                await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
                if (!liff.isLoggedIn()) {
                    liff.login({ redirectUri: window.location.href });
                    return;
                }

                const profile = await liff.getProfile();
                const lineUserId = profile.userId;

                // 🗄️ 3. ดึงข้อมูลจาก Database
                const { data: user, error } = await supabase
                    .from('supervisors')
                    .select(`
                        id, role, is_verified,
                        supervisor_subjects(id)
                    `)
                    .eq('line_user_id', lineUserId)
                    .single();

                // 🚫 4. กรณีไม่มีข้อมูล User
                if (!user || error) {
                    router.replace('/register'); // หรือ /supervisor/register ตามโครงสร้างคุณ
                    return;
                }

                // ⏳ 5. กรณีมีข้อมูลแต่ยังไม่อนุมัติ
                if (!user.is_verified) {
                    if (user.role === 'teacher') {
                        router.replace('/teacher/pending');
                    } else {
                        router.replace('/supervisor/pending');
                    }
                    return;
                }

                // ✅ 6. อนุมัติแล้ว -> ตรวจสอบเงื่อนไขวิชา
                const hasSubject = user.supervisor_subjects && user.supervisor_subjects.length > 0;
                
                // แยก Logic ตาม Role
                if (user.role === 'teacher') {
                    if (hasSubject) {
                        sessionStorage.setItem('teacher_auth_status', 'authorized');
                        router.replace('/teacher/dashboard');
                    } else {
                        // อาจารย์ที่ Verified แล้วแต่ยังไม่มีวิชา
                        router.replace('/teacher/unauthorized');
                    }
                } else {
                    // กรณีเป็นพี่เลี้ยง (Supervisor)
                    sessionStorage.setItem('supervisor_auth_status', 'authorized');
                    router.replace('/supervisor/dashboard');
                }

            } catch (err) {
                console.error("Auth Check Error:", err);
                router.replace('/register');
            }
        };

        checkAuth();
    }, [router, supabase]);

    // แสดงหน้า Loading สวยๆ ที่คุณออกแบบไว้
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#064e3b] rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative flex flex-col items-center">
                <div className="relative w-20 h-20 mb-8">
                    <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-[#064e3b] animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-t-emerald-400 animate-[spin_0.8s_linear_infinite]"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-[#064e3b] rounded-full animate-ping"></div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                    <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] ml-[0.3em]">
                        กำลังเข้าสู่ระบบ
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

            <p className="absolute bottom-10 text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
                TTMED Internships Management System
            </p>
        </div>
    );
}

// -------------------------------------------------------------------------------


// // auth/check/page.tsx - หน้าตรวจสอบสิทธิ์การเข้าถึง (Auth Check) สำหรับพี่เลี้ยงและอาจารย์
// "use client"
// import { useEffect, useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { createBrowserClient } from '@supabase/ssr'
// import liff from '@line/liff'
// export default function AuthCheckPage() {
//     const router = useRouter()
//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )
//     const [isAuthorized, setIsAuthorized] = useState(false)
//     const [status, setStatus] = useState<'loading' | 'unregistered' | 'pending' | 'authorized'>('loading')

//     useEffect(() => {
//         const checkAuth = async () => {
//             // 🛠️ ช่วง DEV: ใช้ Mock ID ของพี่
//             // const lineUserId = 'U678862bd992a4cda7aaf972743b585ac'
//             // const lineUserId = 'test-c'

//             const cachedAuth = sessionStorage.getItem('supervisor_auth_status');
//             if (cachedAuth === 'authorized') {
//                 // ถ้ามีบัตรผ่านแล้ว ปรับสถานะเป็นผ่านทันทีและจบฟังก์ชัน
//                 if (status !== 'authorized') setStatus('authorized');
//                 return;
//             }
//             // 🛠️ ช่วงต่อจริง (Uncomment ส่วนนี้):
//             // if (!liff.isLoggedIn()) { liff.login(); return; }
//             // const profile = await liff.getProfile();
//             // const lineUserId = profile.userId;


//             try {
//                 // 1. ดึงข้อมูล User (ดึง role มาด้วยเพื่อแยกหน้า Pending)
//                 await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
//                 if (!liff.isLoggedIn()) {
//                     liff.login({ redirectUri: window.location.href });
//                     return;
//                 }

//                 const profile = await liff.getProfile();
//                 const lineUserId = profile.userId;

//                 const { data: user, error } = await supabase
//                     .from('supervisors')
//                     .select(`
//                         id, role, is_verified,
//                         supervisor_subject(id)
//                         `)
//                     .eq('line_user_id', lineUserId)
//                     .single()

//                 // 2. ตรวจสอบสถานะ User
//                 if (!user) {
//                     // กรณีไม่มีข้อมูลเลยจริงๆ -> ส่งไปลงทะเบียน
//                     router.replace('/register')
//                     return
//                 }

//                 if (!user.is_verified) {
//                     // กรณีมีข้อมูลแล้วแต่ "ยังไม่อนุมัติ" -> แยกหน้าตาม Role ที่เขาเลือกตอนสมัคร
//                     if (user.role === 'teacher') {
//                         router.replace('/teacher/pending')
//                     } else {
//                         router.replace('/supervisor/pending')
//                     }
//                     return
//                 }

//                 // 3. ถ้าอนุมัติแล้ว (Verified: true) -> เช็คสิทธิ์การเข้าถึงหน้า
//                 const hasSubject = user.supervisor_subject && user.supervisor_subject.length > 0
//                 const isTeacher = user.role === 'teacher' && hasSubject // เป็นอาจารย์และมีวิชาดูแล
//                 const isSupervisor = user.role === 'supervisor' && hasSubject

//                 // 4. Redirect ไปหน้า Dashboard ที่ถูกต้อง
//                 if (isTeacher && isSupervisor) {
//                     router.replace('/select-role')
//                 } else if (isTeacher) {
//                     router.replace('/teacher/dashboard') // เข้า Dashboard อาจารย์
//                     sessionStorage.setItem('teacher_auth_status', 'authorized');
//                     setStatus('authorized');
//                 } else if (isSupervisor) {
//                     sessionStorage.setItem('supervisor_auth_status', 'authorized');
//                     setStatus('authorized');
//                     router.replace('/supervisor/dashboard') // เข้า Dashboard พี่เลี้ยง
//                 } else {
//                     // กรณี Verified แล้วแต่ไม่มีวิชา (อาจารย์ที่รอแอดมินผูกวิชาให้)
//                     // router.replace('/teacher/unauthorized')
//                     // 4. กรณีที่เหลือ (เช่น เป็นอาจารย์ที่ Verified แล้วแต่แอดมินยังไม่ผูกวิชาให้)
//                     if (user.role === 'teacher') {
//                         router.replace('/teacher/unauthorized')
//                     } else {
//                         // ถ้าหลุดมาถึงนี่แล้วเป็นพี่เลี้ยง (ซึ่งปกติไม่ควรหลุดมาเพราะเช็ค isSupervisor ไปแล้ว)
//                         // ให้ส่งไปหน้า dashboard ของเขา หรือหน้าแจ้งเตือนของฝั่งพี่เลี้ยง
//                         sessionStorage.setItem('supervisor_auth_status', 'authorized');
//                         setStatus('authorized');
//                         router.replace('/supervisor/dashboard')
//                     }
//                 }

//             } catch (err) {
//                 console.error("Auth Check Error:", err)
//                 router.replace('/supervisor/register')
//                 setStatus('unregistered');

//             }
//         }

//         checkAuth()
//     }, [])

//     return (
//         <div className="h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative">
//             {/* พื้นหลังจางๆ แบบเดียวกับ Layout พี่เลี้ยง */}
//             <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
//                 <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#064e3b] rounded-full blur-[100px]"></div>
//                 <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full blur-[100px]"></div>
//             </div>

//             <div className="relative flex flex-col items-center">
//                 {/* Loader หลัก: วงโคจรซ้อนกัน (Design พี่เลี้ยง) */}
//                 <div className="relative w-20 h-20 mb-8">
//                     {/* วงนอก */}
//                     <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-[#064e3b] animate-spin"></div>
//                     {/* วงใน */}
//                     <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-t-emerald-400 animate-[spin_0.8s_linear_infinite]"></div>
//                     {/* จุดกลาง */}
//                     <div className="absolute inset-0 flex items-center justify-center">
//                         <div className="w-2 h-2 bg-[#064e3b] rounded-full animate-ping"></div>
//                     </div>
//                 </div>

//                 {/* ข้อความสถานะ */}
//                 <div className="flex flex-col items-center gap-2">
//                     <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] ml-[0.3em]">
//                         กำลังเข้าสู่ระบบ
//                     </h2>
//                     <div className="flex items-center gap-1">
//                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
//                             กรุณารอซักครู่...
//                         </span>
//                         {/* จุดไข่ปลาวิ่ง */}
//                         <span className="flex gap-0.5">
//                             <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_100ms]"></span>
//                             <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
//                             <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_300ms]"></span>
//                         </span>
//                     </div>
//                 </div>
//             </div>

//             {/* ลายน้ำด้านล่าง */}
//             <p className="absolute bottom-10 text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
//                 TTMED Internships Management System
//             </p>
//         </div>
//     )
// }