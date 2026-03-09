// layout.tsx - Layout คุมการเข้าถึงของพี่เลี้ยง (Supervisor) ทั้งหมด
// ver4
"use client"
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import liff from '@line/liff'
import { createBrowserClient } from '@supabase/ssr'
import { ShieldAlert, UserPlus } from 'lucide-react'
import { getLineUserId } from '@/utils/auth';

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
            // 🚀 1. เช็ก Cache เป็นอย่างแรกสุด (ก่อนทำอย่างอื่น)
            const cachedAuth = sessionStorage.getItem('supervisor_auth_status');

            if (cachedAuth === 'authorized') {
                // ถ้ามีบัตรผ่านแล้ว ปรับสถานะเป็นผ่านทันทีและจบฟังก์ชัน
                if (status !== 'authorized') setStatus('authorized');
                return;
            }

            // 🟡 2. ถ้าไม่มี Cache ค่อยสั่งเริ่ม Loading
            setStatus('loading');
            // const lineUserId = 'U678862bd992a4cda7aaf972743b585ac'
            //             // const lineUserId = 'test-somruk'
            try {
                // ติดต่อ LINE (ส่วนที่ช้า)
                // await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
                // if (!liff.isLoggedIn()) {
                //     liff.login({ redirectUri: window.location.href });
                //     return;
                // }

                // const profile = await liff.getProfile();
                // const lineUserId = profile.userId;
                // ติดต่อ Database (ส่วนที่ช้า)

                const urlParams = new URLSearchParams(window.location.search);
                const lineUserId = await getLineUserId(urlParams);

                if (!lineUserId) return;

                const { data: user } = await supabase
                    .from('supervisors')
                    .select('is_verified, role')
                    .eq('line_user_id', lineUserId)
                    .maybeSingle();

                if (!user || user.role !== 'supervisor') {
                    setStatus('unregistered');
                } else if (!user.is_verified) {
                    setStatus('pending');
                    if (pathname !== '/supervisor/pending') router.replace('/supervisor/pending');
                } else {
                    // ✅ ผ่านสิทธิ์: บันทึกเข้า Cache
                    sessionStorage.setItem('supervisor_auth_status', 'authorized');
                    setStatus('authorized');
                }
            } catch (err) {
                console.error("Access check failed", err);
                setStatus('unregistered');
            }
        };
        checkAccess();
    }, [pathname]); // การใส่ pathname ตรงนี้ถูกต้องแล้วเพื่อให้ Layout คอยคุมทุกหน้า

    // --- ส่วนแสดงผลหน้าแจ้งเตือน (ค้างไว้ให้กดเอง) ---
    if (status === 'unregistered') {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-white animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm">
                    <ShieldAlert size={48} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3">ไม่สามารถเข้าถึงได้</h2>
                <p className="text-slate-500 font-medium mb-10 max-w-xs leading-relaxed">
                    ขออภัย คุณยังไม่มีสิทธิ์เข้าใช้งานในส่วนนี้ กรุณาลงทะเบียนข้อมูลบุคลากรก่อนเข้าใช้งานระบบ
                </p>

                <button
                    onClick={() => router.push('/register')}
                    className="w-full max-w-xs py-5 bg-[#064e3b] text-white rounded-3xl font-black text-sm shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                    <UserPlus size={20} />
                    ลงทะเบียนเข้าใช้งาน
                </button>

                {/* <button
                    onClick={() => router.replace('/')}
                    className="mt-6 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-colors"
                >
                    กลับหน้าหลัก
                </button> */}
            </div>
        )
    }

    // หน้า Loading ระหว่างเช็กสิทธิ์
    // if (status === 'loading') {
    //     return (
    //         <div className="h-screen flex flex-col items-center justify-center bg-white">
    //             <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#064e3b] mb-4"></div>
    //             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Checking Permission...</p>
    //         </div>
    //     )
    // }
    if (status === 'loading') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative">
                {/* พื้นหลังจางๆ เพื่อเพิ่มมิติ */}
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-[#064e3b] rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500 rounded-full blur-[100px]"></div>
                </div>

                <div className="relative flex flex-col items-center">
                    {/* Loader หลัก: วงโคจรซ้อนกัน */}
                    <div className="relative w-20 h-20 mb-8">
                        {/* วงนอก (หมุนช้า) */}
                        <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-[#064e3b] animate-spin"></div>
                        {/* วงใน (หมุนเร็ว) */}
                        <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-t-emerald-400 animate-[spin_0.8s_linear_infinite]"></div>
                        {/* จุดกลาง (กระพริบ) */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-[#064e3b] rounded-full animate-ping"></div>
                        </div>
                    </div>

                    {/* ข้อความสถานะ */}
                    <div className="flex flex-col items-center gap-2">
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em] ml-[0.3em]">
                            ตรวจสอบสิทธิ์เข้าใช้งาน
                        </h2>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                กรุณารอซักครู่...
                            </span>
                            {/* จุดไข่ปลาวิ่ง */}
                            <span className="flex gap-0.5">
                                <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_100ms]"></span>
                                <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                                <span className="w-0.5 h-0.5 bg-slate-400 rounded-full animate-[bounce_1s_infinite_300ms]"></span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ลายน้ำด้านล่างแบบจางๆ */}
                <p className="absolute bottom-10 text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pl-[0.5em]">
                    TTMED Internships Evolutions System
                </p>
            </div>
        )
    }

    return <>{children}</>
}