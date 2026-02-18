// ver2
// ver2
"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    Users, ClipboardCheck, Clock,
    Bell, ChevronRight, CheckCircle,
    AlertCircle, PieChart, GraduationCap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import liff from '@line/liff'

export default function SupervisorDashboard() {
    // 🚩 สลับโหมดที่นี่: true = ดู Mockup / false = ดึงข้อมูลจริงจาก DB
    const isMockup = false

    const themeColor = "bg-[#064e3b]"
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [supervisor, setSupervisor] = useState<any>(null)
    const [stats, setStats] = useState({ total: 0, evaluated: 0, pending: 0 })
    const [daysLeft, setDaysLeft] = useState<number | null>(null)
    const [pendingStudentsCount, setPendingStudentsCount] = useState(0)
    const [alertStatus, setAlertStatus] = useState<'normal' | 'overdue'>('normal') // เพิ่มบรรทัดนี้
    const [urgentRotationName, setUrgentRotationName] = useState<string>("")
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        if (isMockup) {
            // จำลองการโหลดข้อมูล Mockup
            setTimeout(() => {
                setSupervisor({
                    full_name: "อ.สมชาย สายชล (Mockup)",
                    sites: { name: "รพ.สมเด็จพระยุพราชสายบุรี" },
                    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
                })
                setStats({ total: 12, evaluated: 8, pending: 4 })
                setLoading(false)
            }, 1500)
        } else {
            fetchRealData()
        }
    }, [isMockup])

    // const fetchRealData = async () => {
    //     setLoading(true);
    //     try {
    //         // 1. กำหนด Profile (สำหรับใช้งานจริงให้สลับไปใช้ LIFF Profile)
    //         const profile = {
    //             userId: 'U678862bd992a4cda7aaf972743b585ac',
    //             displayName: '🐼 FARN 🌙'
    //         };

    //         // 2. ดึงข้อมูลพี่เลี้ยง และข้อมูลหน่วยงาน
    //         const { data: svData, error: svError } = await supabase
    //             .from('supervisors')
    //             .select('*, training_sites(site_name)')
    //             .eq('line_user_id', profile.userId)
    //             .single();

    //         if (svError || !svData) throw svError;

    //         // จัดการเรื่องรูปภาพโปรไฟล์ (คงเดิม)
    //         const imgPath = svData.avatar_url || svData.image;
    //         const publicUrl = imgPath?.startsWith('http')
    //             ? imgPath
    //             : `https://vvxsfibqlpkpzqyjwmuw.supabase.co/storage/v1/object/public/avatars/${imgPath}`;
    //         setSupervisor({ ...svData, avatar_url: publicUrl });

    //         // 3. ดึงข้อมูลงานที่ได้รับมอบหมายทั้งหมด (Assignments)
    //         // 🚩 สำคัญ: ต้องดึง students (id) มาด้วยเพื่อให้นับจำนวนคนไม่ซ้ำได้
    //         const { data: assignments, error: assignError } = await supabase
    //             .from('assignment_supervisors')
    //             .select(`
    //             is_evaluated,
    //             student_assignments:assignment_id (
    //                 student_id,
    //                 students:student_id ( id ), 
    //                 sub_subjects ( name ),
    //                 rotations ( end_date )
    //             )
    //         `)
    //             .eq('supervisor_id', svData.id);

    //         if (assignError) throw assignError;

    //         if (assignments) {
    //             // --- ส่วนที่ 1: คำนวณวันที่เหลือ (Notification Bar) ---
    //             const pendingTasksData = assignments.filter((a: any) => !a.is_evaluated);

    //             const pendingDates = pendingTasksData
    //                 .filter((a: any) => a.student_assignments?.rotations?.end_date)
    //                 .map((a: any) => new Date(a.student_assignments.rotations.end_date));

    //             if (pendingDates.length > 0) {
    //                 const nearestEnd = new Date(Math.min(...pendingDates.map(d => d.getTime())));
    //                 const today = new Date();
    //                 const diffTime = nearestEnd.getTime() - today.getTime();
    //                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    //                 setDaysLeft(diffDays);
    //             } else {
    //                 setDaysLeft(null);
    //             }

    //             // --- ส่วนที่ 2: คำนวณจำนวน "คน" (KPI ช่องแรก) ---
    //             // ใช้ Set เพื่อยุบรายวิชาหลายตัวให้เหลือแค่ "หัวคน" ที่ไม่ซ้ำกัน
    //             const uniqueStudentIds = assignments
    //                 .map((a: any) => a.student_assignments?.students?.id)
    //                 .filter(Boolean); // ป้องกันค่า null/undefined

    //             const totalMyStudentsCount = new Set(uniqueStudentIds).size;

    //             // --- ส่วนที่ 3: คำนวณจำนวน "ใบงาน" (KPI ช่อง 2 และ 3) ---
    //             const evaluatedCount = assignments.filter((a: any) => a.is_evaluated).length;
    //             const pendingTasksCount = assignments.length - evaluatedCount;

    //             // --- ส่วนที่ 4: คำนวณจำนวน "คน" ที่ยังมีงานค้าง (Notification Bar) ---
    //             const pendingPeopleCount = new Set(
    //                 pendingTasksData
    //                     .map((a: any) => a.student_assignments?.student_id)
    //                     .filter(Boolean)
    //             ).size;

    //             // --- อัปเดต State ทั้งหมด ---
    //             setPendingStudentsCount(pendingPeopleCount);
    //             setStats({
    //                 total: totalMyStudentsCount,   // 🚩 จะขึ้นเลข 3 คน (ตามหัวคนจริง)
    //                 evaluated: evaluatedCount,     // จำนวนใบที่ตรวจแล้ว
    //                 pending: pendingTasksCount     // จำนวนใบที่ยังค้าง (เช่น 6 หรือ 10 ใบ)
    //             });
    //         }
    //     } catch (error) {
    //         console.error("Dashboard Fetch Error:", error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchRealData = async () => {
        setLoading(true);
        try {
            // 🟢 1. เริ่มต้น LIFF และตรวจสอบการ Login (ใช้ของจริง)
            // (ต้องมั่นใจว่าใส่ NEXT_PUBLIC_LIFF_ID ใน .env.local แล้ว)
            // await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });

            // if (!liff.isLoggedIn()) {
            //     liff.login(); // ถ้ายังไม่ล็อคอิน ให้เด้งไปหน้า Login ของ LINE ทันที
            //     return; // จบการทำงานตรงนี้ รอ Redirect กลับมาใหม่
            // }

            // const profile = await liff.getProfile();
            // console.log("User Profile:", profile); // เช็คค่าได้ตรงนี้

            // ❌ ลบส่วนจำลอง (Hardcode) นี้ทิ้งไปได้เลยครับ
            const profile = {
                userId: 'U678862bd992a4cda7aaf972743b585ac',
                displayName: '🐼 FARN 🌙'
            };


            // 2. ดึงข้อมูลพี่เลี้ยง และข้อมูลหน่วยงาน (ใช้ profile.userId จาก LIFF)
            const { data: svData, error: svError } = await supabase
                .from('supervisors')
                .select('*, training_sites(site_name)')
                .eq('line_user_id', profile.userId) // 👈 ใช้ ID จริงที่ดึงมา
                .single();

            if (svError || !svData) {
                // กรณีไม่พบข้อมูลในระบบ (อาจจะยังไม่ได้ลงทะเบียน)
                console.error("User not found in DB");
                // อาจจะ Redirect ไปหน้าลงทะเบียน หรือแจ้งเตือน
                return;
            }

            // จัดการเรื่องรูปภาพโปรไฟล์ (Logic เดิม)
            const imgPath = svData.avatar_url || svData.image;
            const publicUrl = imgPath?.startsWith('http')
                ? imgPath
                : `https://vvxsfibqlpkpzqyjwmuw.supabase.co/storage/v1/object/public/avatars/${imgPath}`;

            setSupervisor({ ...svData, avatar_url: publicUrl });

            // 3. ดึงข้อมูลงานที่ได้รับมอบหมายทั้งหมด (Assignments)
            const { data: assignments, error: assignError } = await supabase
                .from('assignment_supervisors')
                .select(`
                    is_evaluated,
                    student_assignments:assignment_id (
                        student_id,
                        students:student_id ( id ), 
                        sub_subjects ( name ),
                        rotations ( end_date ,name)
                    )
                `)
                .eq('supervisor_id', svData.id);

            if (assignError) throw assignError;

            if (assignments) {
                // --- ส่วนคำนวณ Stats (เหมือนเดิมเป๊ะ) ---
                // const pendingTasksData = assignments.filter((a: any) => !a.is_evaluated);

                // const pendingDates = pendingTasksData
                //     .filter((a: any) => a.student_assignments?.rotations?.end_date)
                //     .map((a: any) => new Date(a.student_assignments.rotations.end_date));

                // if (pendingDates.length > 0) {
                //     const nearestEnd = new Date(Math.min(...pendingDates.map(d => d.getTime())));
                //     const today = new Date();
                //     const diffTime = nearestEnd.getTime() - today.getTime();
                //     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                //     setDaysLeft(diffDays);
                // } else {
                //     setDaysLeft(null);
                // }

                // กรองเฉพาะงานที่ยังไม่ตรวจ และมีข้อมูลวันสิ้นสุด
                const pendingTasksData = assignments.filter((a: any) =>
                    !a.is_evaluated && a.student_assignments?.rotations?.end_date
                );

                if (pendingTasksData.length > 0) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // เคลียร์เวลาให้เป็นเที่ยงคืน เพื่อเทียบแค่วันที่

                    // แยกงานออกเป็น 2 กอง: "งานที่เลยกำหนดแล้ว" กับ "งานที่ยังไม่ถึงกำหนด"
                    const overdueTasks = [];
                    const upcomingTasks = [];

                    for (const task of pendingTasksData) {
                        const endDate = new Date(task.student_assignments.rotations.end_date);
                        endDate.setHours(0, 0, 0, 0); // เคลียร์เวลาเช่นกัน

                        if (endDate < today) {
                            overdueTasks.push({ ...task, endDate });
                        } else {
                            upcomingTasks.push({ ...task, endDate });
                        }
                    }

                    // 🚩 Logic การเลือกแสดงผล:
                    if (overdueTasks.length > 0) {
                        // กรณี A: มีงานค้างที่เลยกำหนดแล้ว -> ให้เตือนงานค้างก่อน!
                        // เรียงเอาวันที่เก่าที่สุดขึ้นก่อน (ยิ่งเก่ายิ่งด่วน)
                        overdueTasks.sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
                        const urgentTask = overdueTasks[0];

                        const diffTime = today.getTime() - urgentTask.endDate.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // คำนวณว่าเลยมา กี่วัน

                        setDaysLeft(diffDays);
                        setUrgentRotationName(`งานค้าง ${urgentTask.student_assignments.rotations.name}`); // เช่น "งานค้าง ผลัด 1"
                        setAlertStatus('overdue'); // *ต้องเพิ่ม state นี้ (ดูวิธีเพิ่มด้านล่าง)

                    } else if (upcomingTasks.length > 0) {
                        // กรณี B: ไม่มีงานค้าง -> นับถอยหลังผลัดปัจจุบัน/อนาคต
                        upcomingTasks.sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
                        const nextTask = upcomingTasks[0];

                        const diffTime = nextTask.endDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // อีกกี่วันจะถึง

                        setDaysLeft(diffDays);
                        setUrgentRotationName(nextTask.student_assignments.rotations.name); // เช่น "ผลัด 2"
                        setAlertStatus('normal');
                    }
                } else {
                    setDaysLeft(null);
                    setUrgentRotationName("");
                    setAlertStatus('normal');
                }

                const uniqueStudentIds = assignments
                    .map((a: any) => a.student_assignments?.students?.id)
                    .filter(Boolean);

                const totalMyStudentsCount = new Set(uniqueStudentIds).size;
                const evaluatedCount = assignments.filter((a: any) => a.is_evaluated).length;
                const pendingTasksCount = assignments.length - evaluatedCount;

                const pendingPeopleCount = new Set(
                    pendingTasksData
                        .map((a: any) => a.student_assignments?.student_id)
                        .filter(Boolean)
                ).size;

                setPendingStudentsCount(pendingPeopleCount);
                setStats({
                    total: totalMyStudentsCount,
                    evaluated: evaluatedCount,
                    pending: pendingTasksCount
                });
            }
        } catch (error) {
            console.error("Dashboard Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // 🚩 ตัวอย่างการดักจับความเปลี่ยนแปลงแบบ Realtime
    useEffect(() => {
        fetchRealData();

        // ฟังการเปลี่ยนแปลงในตาราง assignment_supervisors
        const channel = supabase
            .channel('db-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'assignment_supervisors' },
                () => {
                    fetchRealData(); // ถ้ามีการ Insert/Update/Delete ให้ดึงข้อมูลใหม่ทันที
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel); // ปิด Channel เมื่อออกจากหน้า
        };
    }, []);

    useEffect(() => {
        fetchRealData(); // ดึงข้อมูลใหม่ทุกครั้งที่เข้ามาที่หน้านี้
    }, []);



    // --- Skeleton Loading Component ---
    if (loading) return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className={`${themeColor} p-8 pt-12 rounded-b-[3.5rem] h-64 animate-pulse`}>
                <div className="flex justify-between items-center mb-10">
                    <div className="space-y-3">
                        <div className="h-4 w-24 bg-white/20 rounded"></div>
                        <div className="h-8 w-48 bg-white/30 rounded-xl"></div>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/10 rounded-[2.2rem]"></div>)}
                </div>
            </div>
            <div className="px-6 -mt-8"><div className="h-24 bg-white rounded-[2.5rem] animate-pulse"></div></div>
            <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-[2.5rem] animate-pulse"></div>)}
            </div>
        </div>
    )

    const profileImage = supervisor?.avatar_url
        ? (supervisor.avatar_url.startsWith('http')
            ? supervisor.avatar_url
            : `https://vvxsfibqlpkpzqyjwmuw.supabase.co/storage/v1/object/public/avatars/${supervisor.avatar_url}`)
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${supervisor?.id || 'fallback'}`;

    // console.log("Current Supervisor Image:", supervisor?.avatar_url)
    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 animate-in fade-in duration-700">
            {/* --- Header Section --- */}
            <div className={`${themeColor} p-8 pt-12 rounded-b-[3.5rem] shadow-2xl relative overflow-hidden`}>
                <div className="absolute top-0 right-0 opacity-10 -mr-10 -mt-10">
                    <GraduationCap size={200} />
                </div>

                <div className="relative z-10 flex justify-between items-center mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                            <p className="text-emerald-200 text-[10px] font-black uppercase tracking-widest">
                                {isMockup ? "Mockup Mode" : "Supervisor Online"}
                            </p>
                        </div>
                        <h1 className="text-2xl font-black text-white">{supervisor?.full_name}</h1>
                        <p className="text-emerald-100/70 text-sm font-medium">{supervisor?.training_sites?.site_name}</p>
                    </div>
                    {/* <div className="w-16 h-16 rounded-2xl border-4 border-white/20 shadow-inner overflow-hidden bg-white">
                        <img src={supervisor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback`} alt="avatar" className="w-full h-full object-cover" />
                    </div> */}

                    <div className="w-16 h-16 rounded-2xl border-4 border-white/20 shadow-inner overflow-hidden bg-white">
                        <img
                            src={profileImage}
                            alt="avatar"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // ถ้าโหลดรูปจาก Storage ไม่สำเร็จ ให้ใช้รูปสำรองทันที
                                e.currentTarget.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback";
                            }}
                        />
                    </div>
                </div>

                {/* --- KPI Cards --- */}
                {/* <div className="p-2 relative z-10 grid grid-cols-3 gap-4">
                    <KPICard label="นศ. ทั้งหมด" value={stats.total} icon={<Users size={16} />} color="bg-white/10 text-white" />
                    <KPICard label="ประเมินแล้ว" value={stats.evaluated} icon={<CheckCircle size={16} />}  />
                    <KPICard label="ยังไม่ประเมิน" value={stats.pending} icon={<AlertCircle size={16} />} color="bg-rose-500/40 text-rose-100" />
                </div> */}

                <div className="p-2 relative z-10 grid grid-cols-3 gap-4">
                    <KPICard label="นศ. ในความดูแล" value={stats.total} icon={<Users size={16} />} color="bg-white/10 text-white" />
                    <KPICard label="ประเมินแล้ว (รายการ)" value={stats.evaluated} icon={<CheckCircle size={16} />} color="bg-emerald-500/40 text-emerald-100" />
                    <KPICard label="ยังไม่ประเมิน (รายการ)" value={stats.pending} icon={<AlertCircle size={16} />} color="bg-rose-500/40 text-rose-100" />
                </div>


            </div>

            {/* --- Notification Bar --- */}
            {/* <div className="px-6 -mt-8 relative z-20">
                <div className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-slate-50 flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 border border-amber-100">
                        <Bell size={28} className={stats.pending > 0 ? "animate-bounce" : ""} />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-black text-slate-800 text-sm">
                            {daysLeft !== null
                                ? `สิ้นสุดผลัดใน ${daysLeft} วัน`
                                : 'การแจ้งเตือน'}
                        </h3>
                     
                        <p className="text-[11px] text-slate-400 font-bold italic">
                            {stats.pending > 0
                                ? `เหลือ นศ. ${pendingStudentsCount} คน (${stats.pending} รายการ) ที่ยังไม่ประเมิน`
                                : "ประเมินครบถ้วนแล้ว ยอดเยี่ยม!"}
                        </p>
                    </div>
                    {stats.pending > 0 && (
                        <button onClick={() => router.push('/supervisor/students')} className="bg-[#064e3b] text-white text-[10px] font-black px-5 py-3 rounded-2xl shadow-lg active:scale-95 transition-all">
                            ดูรายชื่อ
                        </button>
                    )}
                </div>
            </div> */}

            {/* --- Notification Bar --- */}
            <div className="px-6 -mt-8 relative z-20">
                <div className={`p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/60 border flex items-center gap-4 transition-colors ${alertStatus === 'overdue' ? 'bg-red-50 border-red-100' : 'bg-white border-slate-50'
                    }`}>

                    {/* ไอคอน: ถ้าเกินกำหนดให้เป็นสีแดง */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${alertStatus === 'overdue'
                        ? 'bg-red-100 text-red-500 border-red-200'
                        : 'bg-amber-50 text-amber-500 border-amber-100'
                        }`}>
                        {alertStatus === 'overdue' ? <AlertCircle size={28} className="animate-pulse" /> : <Bell size={28} />}
                    </div>

                    <div className="flex-1">
                        <h3 className={`font-black text-sm ${alertStatus === 'overdue' ? 'text-red-700' : 'text-slate-800'}`}>
                            {daysLeft !== null
                                ? (alertStatus === 'overdue'
                                    ? ` ${urgentRotationName} ล่าช้า ${daysLeft} วัน`
                                    : ` สิ้นสุด ${urgentRotationName} ใน ${daysLeft} วัน`)
                                : 'การแจ้งเตือน'}
                        </h3>
                        <p className={`text-[11px] font-bold italic ${alertStatus === 'overdue' ? 'text-red-400' : 'text-slate-400'}`}>
                            {stats.pending > 0
                                ? `เหลือ นศ. ${pendingStudentsCount} คน (${stats.pending} รายการ) ที่ต้องประเมิน`
                                : "ประเมินครบถ้วนแล้ว ยอดเยี่ยม!"}
                        </p>
                    </div>

                    {/* ปุ่ม */}
                    {stats.pending > 0 && (
                        <button
                            onClick={() => router.push('/supervisor/students')}
                            className={`text-white text-[10px] font-black px-5 py-3 rounded-2xl shadow-lg active:scale-95 transition-all ${alertStatus === 'overdue' ? 'bg-red-500 hover:bg-red-600' : 'bg-[#064e3b] hover:bg-[#043e2f]'
                                }`}
                        >
                            {alertStatus === 'overdue' ? 'เคลียร์ด่วน' : 'ดูรายชื่อ'}
                        </button>
                    )}
                </div>
            </div>

            {/* --- Main Menus --- */}
            <div className="p-8 space-y-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 mb-2">เมนูการจัดการ</h2>
                <MenuCard
                    onClick={() => router.push('/supervisor/students')}
                    icon={<Users size={24} />}
                    title="รายชื่อนักศึกษา"
                    desc="ดูรายชื่อ นศ. และเริ่มประเมิน"
                    badge={stats.total > 0 ? `${stats.total} คน` : null}
                    color="text-emerald-600 bg-emerald-50"
                />
                <MenuCard icon={<ClipboardCheck size={24} />}
                    onClick={() => router.push('/supervisor/history')}
                    title="ประวัติประเมิน"
                    desc="ดูคะแนนย้อนหลังและสรุปผล"
                    color="text-blue-600 bg-blue-50" />
                <MenuCard icon={<Clock size={24} />}
                    onClick={() => router.push('/supervisor/schedule')}
                    title="ตารางผลัดฝึก"
                    desc="เช็กช่วงเวลาฝึกงานในแต่ละรอบ"
                    color="text-purple-600 bg-purple-50" />
            </div>
        </div >
    )
}

function KPICard({ label, value, icon, color, textColor = "text-white" }: any) {
    return (
        <div className={`${color} p-2 rounded-[2.2rem] border border-white/10 backdrop-blur-md flex flex-col items-center justify-center shadow-lg transition-all active:scale-95`}>
            <div className="mb-2 p-2 bg-white/10 rounded-xl text-white">{icon}</div>
            <p className={`text-[9px] font-bold uppercase tracking-wider opacity-80 mb-1 text-center ${textColor}`}>{label}</p>
            <p className={`text-3xl font-black tracking-tighter ${textColor}`}>{value}</p>
        </div>
    )
}

function MenuCard({ icon, title, desc, badge, color, onClick }: any) {
    return (
        <button onClick={onClick} className="w-full bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5 group hover:shadow-md transition-all active:scale-95">
            <div className={`w-14 h-14 ${color} rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110`}>{icon}</div>
            <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                    <p className="font-black text-slate-800 tracking-tight">{title}</p>
                    {badge && <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-full">{badge}</span>}
                </div>
                <p className="text-xs text-slate-400 font-medium">{desc}</p>
            </div>
            <ChevronRight className="text-slate-200 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" size={20} />
        </button>
    )
}

