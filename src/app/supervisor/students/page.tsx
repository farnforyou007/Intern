
//ver99
"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    Search, ChevronRight, ChevronDown, ChevronUp,
    ArrowLeft, GraduationCap, ClipboardCheck, User,
    PhoneCall, BookOpen, FolderOpen, FileSignature, PlusCircle,
    UserPlus, ClipboardPenLine, Mail, Send,
    Users,
    SendHorizonal,
    SquareActivity,
    SquareUserRound
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import liff from '@line/liff'

// --- 1. Component ย่อย: SmartSubjectGroup ---
const SmartSubjectGroup = ({ subjectName, tasks, isMine, onAction }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    const getTaskData = (task: any) => isMine ? task.student_assignments : task;
    const firstTaskData = getTaskData(tasks[0]);
    const isGeneralSubject = tasks.length === 1 && !firstTaskData?.sub_subject_id;
    const completedCount = tasks.filter((t: any) => isMine ? t.is_evaluated : false).length;

    const getIcon = (isMine: boolean, isBook: boolean = false) => {
        if (!isMine) return <UserPlus size={isGeneralSubject ? 20 : 16} />;
        if (isBook) return <BookOpen size={16} />;
        return <ClipboardCheck size={isGeneralSubject ? 20 : 16} />;
    };

    if (isGeneralSubject) {
        return (
            <TaskButton
                task={tasks[0]}
                isMine={isMine}
                onAction={onAction}
                label={subjectName}
                icon={getIcon(isMine)}
                styleType="card"
            />
        );
    }

    return (
        <div className="border border-slate-200 rounded-3xl overflow-hidden mb-3 bg-white shadow-sm transition-all">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-4 flex justify-between items-center transition-colors ${isOpen ? 'bg-slate-50' : 'bg-white'}`}
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <FolderOpen size={20} />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-black text-slate-800">{subjectName}</p>
                        <p className="text-[10px] text-slate-500 font-bold">
                            {isMine
                                ? <span className="text-emerald-600">เสร็จแล้ว {completedCount}/{tasks.length} รายการ</span>
                                : <span>{tasks.length} รายการย่อย</span>
                            }
                        </p>
                    </div>
                </div>
                {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
            </button>

            {isOpen && (
                <div className="bg-slate-50 p-2 space-y-2 border-t border-slate-100">
                    {tasks.map((task: any) => {
                        const tData = getTaskData(task);
                        const isBook = !tData.sub_subjects?.name;
                        const subName = tData.sub_subjects?.name
                            ? `${tData.sub_subjects.name}`
                            : 'บันทึกเล่ม / รายงาน (Portfolio)';
                        const icon = getIcon(isMine, isBook);

                        return (
                            <TaskButton
                                key={task.id}
                                task={task}
                                isMine={isMine}
                                onAction={onAction}
                                label={subName}
                                icon={icon}
                                styleType="sub"
                            />
                        )
                    })}
                </div>
            )}
        </div>
    );
};

// --- 2. Component ปุ่มกด ---
const TaskButton = ({ task, isMine, onAction, label, icon, styleType }: any) => {
    const isClaimed = task.isClaimedByMe;
    const evaluated = isMine ? task.is_evaluated : false;
    const isCard = styleType === 'card';

    let containerClass = "relative w-full flex justify-between items-center transition-all active:scale-[0.98] overflow-hidden";
    let paddingClass = isCard ? "p-4 rounded-3xl mb-3" : "p-3 rounded-2xl pl-4";
    let leftBorderClass = "border-l-[6px] border-l-amber-400";
    let bgClass = "bg-white hover:border-emerald-500 border-slate-100 border-2";
    let iconBgClass = "bg-emerald-50 text-emerald-600";

    if (isMine && evaluated) {
        bgClass = "bg-emerald-50/50 border-emerald-100 border-2";
        leftBorderClass = "border-l-[6px] border-l-emerald-500";
    } else if (!isMine) {
        bgClass = "bg-white border-dashed border-slate-300 border-2 hover:border-amber-400 hover:bg-amber-50/30";
        iconBgClass = "bg-slate-100 text-slate-400";
        leftBorderClass = "border-l-[6px] border-l-slate-200 hover:border-l-amber-400";
    }

    if (!isMine && isClaimed) {
        bgClass = "bg-slate-50 border-transparent opacity-50";
        leftBorderClass = "border-l-[6px] border-l-slate-300";
    }

    return (
        <button
            onClick={(e) => { e.stopPropagation(); onAction(task); }}
            disabled={!isMine && isClaimed}
            className={`${containerClass} ${paddingClass} ${bgClass} ${leftBorderClass}`}
        >
            <div className="text-left flex items-center gap-3">
                <div className={`p-2.5 rounded-xl transition-colors ${iconBgClass}`}>
                    {icon}
                </div>
                <div>
                    <p className={`font-bold ${isCard ? 'text-sm text-slate-800' : 'text-xs text-slate-700'}`}>
                        {label}
                    </p>
                    {isMine ? (
                        <p className="text-[9px] text-slate-400 font-medium">
                            {evaluated ? 'บันทึกเรียบร้อย' : 'คลิกเพื่อประเมิน'}
                        </p>
                    ) : (
                        !isClaimed && (
                            <p className="text-[9px] text-amber-600 font-bold flex items-center gap-1">
                                <PlusCircle size={10} /> กดเพื่อรับดูแล
                            </p>
                        )
                    )}
                </div>
            </div>
            {isMine ? (
                evaluated ? (
                    <div className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1">
                        <ClipboardCheck size={10} /> เรียบร้อย
                    </div>
                ) : <ChevronRight size={isCard ? 20 : 16} className="text-slate-300" />
            ) : (
                !isClaimed && <div className="bg-amber-100 text-amber-700 p-1.5 rounded-lg"><ChevronRight size={16} /></div>
            )}
        </button>
    )
}

// --- Main Page ---
const SkeletonCard = () => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 animate-pulse mb-4">
        <div className="flex items-start gap-5">
            <div className="mt-2 w-23 h-23 rounded-[2rem] bg-slate-100 shrink-0 border-4 border-slate-50" />
            <div className="flex-1 space-y-3 pt-2">
                <div className="h-3 bg-slate-100 rounded w-16" />
                <div className="h-5 bg-slate-100 rounded w-48" />
            </div>
        </div>
    </div>
)

export default function SupervisorStudentList() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<'mine' | 'all'>('mine')
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const [myStudents, setMyStudents] = useState<any[]>([])
    const [allSiteStudents, setAllSiteStudents] = useState<any[]>([])
    const [supervisorInfo, setSupervisorInfo] = useState<any>(null)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 🛠️ Helper: ตรวจสอบสิทธิ์ (Logic การแสดงผล)
    const checkPermission = (assign: any, permissions: any[]) => {
        if (!permissions || permissions.length === 0) return false;

        // 1. ถ้าเป็นวิชาย่อย (เช่น ANC, PP) -> ต้องมีสิทธิ์ตรงเป๊ะๆ
        if (assign.sub_subject_id) {
            return permissions.some((p: any) =>
                p.subject_id === assign.subject_id &&
                p.sub_subject_id === assign.sub_subject_id
            );
        }

        // 2. ถ้าเป็นเล่มรายงาน (sub=null) -> อนุญาตให้เห็นได้ "ถ้ามีสิทธิ์ในวิชาหลักนั้นอย่างน้อย 1 อย่าง"
        return permissions.some((p: any) => p.subject_id === assign.subject_id);
    }

    const fetchData = async (lineUserId: string) => {
        // setLoading(true) // 🚩 เอาออกเพื่อให้ UI ไม่กระพริบตอน Realtime Update
        try {
            // 1. ดึงข้อมูล Supervisor
            const { data: supervisor } = await supabase.from('supervisors').select('*').eq('line_user_id', lineUserId).single()
            if (!supervisor) return
            setSupervisorInfo(supervisor)

            // 2. ดึงสิทธิ์ (Permissions)
            const { data: permissions } = await supabase
                .from('supervisor_subjects')
                .select('subject_id, sub_subject_id')
                .eq('supervisor_id', supervisor.id)

            // 3. ดึงงานทีมฉัน (My Students)
            const { data: mine } = await supabase.from('assignment_supervisors').select(`
                id, is_evaluated,
                student_assignments:assignment_id ( 
                    id, rotation_id, student_id, subject_id, sub_subject_id,
                    students:student_id ( id, prefix, first_name, last_name, nickname, student_code, avatar_url, phone , email ),
                    subjects:subject_id ( id, name ), 
                    sub_subjects:sub_subject_id ( name ),
                    rotations:rotation_id ( name )
                )
            `).eq('supervisor_id', supervisor.id)

            // 🚩 กรอง 'ทีมฉัน' ให้ตรงกับสิทธิ์ปัจจุบันเสมอ (กันข้อมูลเก่าค้าง)
            const filteredMine = (mine || []).filter((item: any) => {
                const assign = item.student_assignments;
                if (!assign) return false;
                return checkPermission(assign, permissions || []);
            });
            setMyStudents(filteredMine)

            // 4. ดึงงานทั้งหมด (All Students)
            const { data: all } = await supabase.from('student_assignments').select(`
                id, rotation_id, student_id, subject_id, sub_subject_id,
                students:student_id ( id, prefix, first_name, last_name, nickname, student_code, avatar_url, phone ,email ),
                subjects:subject_id ( id, name ), 
                sub_subjects:sub_subject_id ( name ),
                rotations:rotation_id ( name )
            `).eq('site_id', supervisor.site_id)

            // 🚩 กรอง 'ทั้งหมด' ให้โชว์เฉพาะที่มีสิทธิ์กดรับ
            const filteredAll = (all || []).filter((assign: any) => {
                return checkPermission(assign, permissions || []);
            });
            setAllSiteStudents(filteredAll)

        } catch (error) { console.error("Fetch Error:", error) } finally { setLoading(false) }
    }

    useEffect(() => {
        let channel: any;
        const init = async () => {
            try {
                // ✅ ใช้งานจริง: เปิดระบบ LIFF (ลบคอมเมนต์ออกถ้าขึ้น Production)
                /* await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
                if (!liff.isLoggedIn()) { liff.login(); return }
                const profile = await liff.getProfile()
                const userId = profile.userId */

                // ⚠️ Dev Mode:
                const userId = 'U678862bd992a4cda7aaf972743b585ac'

                if (userId) {
                    fetchData(userId)

                    // 🚩 Real-time: ฟัง 3 ตารางหลัก ถ้ามีอะไรเปลี่ยนให้โหลดใหม่ทันที
                    channel = supabase.channel('supervisor_realtime')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'assignment_supervisors' }, () => fetchData(userId))
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_assignments' }, () => fetchData(userId))
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'supervisor_subjects' }, () => fetchData(userId))
                        .subscribe()
                }
            } catch (error) { console.error("Init Error:", error) }
        }
        init()
        return () => { if (channel) supabase.removeChannel(channel) }
    }, [])

    const getGroupedData = (data: any[], isMine: boolean) => {
        const grouped: { [key: string]: any } = {}
        data.forEach(item => {
            const assignment = isMine ? item.student_assignments : item;
            const student = assignment?.students;
            if (!student?.id) return

            const groupKey = `${student.id}`
            if (!grouped[groupKey]) {
                grouped[groupKey] = { id: groupKey, student, tasks: [] }
            }

            const taskId = isMine ? item.id : item.id;
            const isClaimedByMe = !isMine && myStudents.some(ms => ms.student_assignments?.id === taskId);

            const exists = grouped[groupKey].tasks.some((t: any) => (isMine ? t.id : t.id) === taskId);
            if (!exists) {
                grouped[groupKey].tasks.push({ ...item, isClaimedByMe })
            }
        })
        return Object.values(grouped)
    }

    const groupedMine = getGroupedData(myStudents, true)
    const groupedAll = getGroupedData(allSiteStudents, false)
    const currentList = activeTab === 'mine' ? groupedMine : groupedAll

    const filteredList = currentList.filter((item: any) => {
        const s = item.student
        const search = searchTerm.toLowerCase()
        return `${s?.first_name} ${s?.last_name} ${s?.nickname} ${s?.student_code}`.toLowerCase().includes(search)
    })

    const handleAction = (task: any) => {
        const isMine = activeTab === 'mine';
        const tData = isMine ? task.student_assignments : task;

        if (isMine) {
            router.push(`/supervisor/evaluate/${task.id}`);
        } else {
            if (task.isClaimedByMe) {
                // ถ้ามีคนรับแล้ว แต่เป็นเราเอง -> พาไปหน้าประเมินเลย
                const myTask = myStudents.find(ms => ms.student_assignments?.id === tData.id);
                if (myTask) router.push(`/supervisor/evaluate/${myTask.id}`);
            } else {
                const isBook = !tData.sub_subject_id;
                const showName = isBook ? "เล่มรายงาน/Portfolio" : tData.subjects?.name;
                handleClaimStudent(tData.id, task.student?.first_name, showName);
            }
        }
    }

    const handleClaimStudent = async (assignmentId: number, name: string, subject: string) => {
        const { isConfirmed } = await Swal.fire({
            title: 'ยืนยันรับดูแล?',
            html: `<div class="text-left text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100"><p class="mb-1">คุณต้องการรับผิดชอบ:</p><p class="text-lg font-black text-emerald-700 mb-2">${subject}</p><p>ของนักศึกษา: <b>${name}</b> ใช่หรือไม่?</p></div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ใช่, รับดูแล', confirmButtonColor: '#064e3b',
            cancelButtonText: 'ยกเลิก', cancelButtonColor: '#94a3b8',
            customClass: { popup: 'rounded-[2.5rem] p-6 font-sans' }
        })

        if (isConfirmed && supervisorInfo) {
            const { error } = await supabase.from('assignment_supervisors').insert([{ assignment_id: assignmentId, supervisor_id: supervisorInfo.id }])
            if (!error) {
                Swal.fire({ icon: 'success', title: 'เรียบร้อย!', text: 'เพิ่มรายการลงใน "ทีมฉัน" แล้ว', timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-[2.5rem]' } })

                // 🚩 Update ทันที! (ไม่ต้องรอ Realtime) เพื่อ UX ที่ลื่นไหล
                fetchData(supervisorInfo.line_user_id)
            }
        }
    }

    const handlePreviewImage = (url: string) => Swal.fire({ imageUrl: url, showConfirmButton: false, customClass: { popup: 'rounded-[2.5rem] p-0' } })

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">
            <div className="bg-white px-6 pt-12 pb-6 sticky top-0 z-30 shadow-sm border-b border-slate-100">
                {/* <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={24} className="text-slate-600" /></button>
                    <h1 className="text-xl font-black text-slate-900">รายชื่อนักศึกษา</h1>
                </div> */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => router.back()}
                        className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
                    >
                        <ArrowLeft size={20} strokeWidth={2.5} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">รายชื่อนักศึกษา</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Students List</p>
                    </div>
                    <div className="w-11 h-11 flex items-center justify-center text-slate-300 bg-slate-50 rounded-2xl border border-slate-100">
                        <GraduationCap size={20} />
                    </div>
                </div>

                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="ค้นหา..." className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-100 outline-none font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex p-1.5 bg-slate-100 rounded-2xl shadow-inner">
                    <button onClick={() => setActiveTab('mine')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'mine' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>ทีมฉัน ({groupedMine.length})</button>
                    <button onClick={() => setActiveTab('all')} className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-400'}`}>ทั้งหมด ({groupedAll.length})</button>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {loading ? <><SkeletonCard /><SkeletonCard /></> : filteredList.length > 0 ? (
                    filteredList.map((group: any) => {
                        const isMine = activeTab === 'mine';
                        const { student, tasks, id: groupKey } = group;
                        const isExpanded = expandedId === groupKey;
                        const totalTasks = tasks.length;
                        const totalCompleted = tasks.filter((t: any) => isMine ? t.is_evaluated : false).length;

                        const tasksBySubject: { [key: string]: any[] } = {};
                        tasks.forEach((t: any) => {
                            const tData = isMine ? t.student_assignments : t;
                            const subjId = tData.subjects?.id || 'unknown';
                            if (!tasksBySubject[subjId]) tasksBySubject[subjId] = [];
                            tasksBySubject[subjId].push(t);
                        });

                        return (
                            <div key={groupKey} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all">
                                <div className="p-6">
                                    <div className="flex items-start gap-5">
                                        <div onClick={() => student?.avatar_url && handlePreviewImage(student.avatar_url)} className="relative mt-2 w-23 h-23 rounded-[2rem] bg-slate-100 shrink-0 border-4 border-slate-50 overflow-hidden cursor-pointer">
                                            {student?.avatar_url ? <img src={student.avatar_url} className="w-full h-full object-cover" /> : <User size={28} className="m-auto mt-7 text-slate-300" />}
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-[9px] font-black text-slate-500 mb-1">#{student.student_code}</span>
                                            <h3 className="text-[15px] font-bold text-slate-900">{student.first_name} {student.last_name}</h3>
                                            <p className="text-slate-700 font-black text-xs flex items-center gap-1"><SquareUserRound size={12} />{student.nickname || '-'}</p>
                                            <p className="text-slate-700 font-black text-xs flex items-center gap-1"><Send size={10} />{student.email || '-'}</p>
                                            <a href={`tel:${student.phone}`} className="text-[11px] text-slate-600 font-black underline flex items-center gap-1"><PhoneCall size={10} /> {student.phone}</a>
                                        </div>
                                        <button onClick={() => setExpandedId(isExpanded ? null : groupKey)} className={`p-3 rounded-2xl transition-all shadow-lg ${isExpanded ? 'bg-slate-900 text-white rotate-180' : 'bg-[#064e3b] text-white'}`}>
                                            {isExpanded ? <ChevronDown size={20} /> : (isMine ? <ClipboardPenLine size={20} /> : <UserPlus size={20} />)}
                                        </button>
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-6 pt-5 border-t border-slate-50">
                                            <div className="flex justify-between items-center mb-4 px-1">
                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <ClipboardCheck size={14} className="text-emerald-600" />
                                                    {isMine ? 'รายการประเมิน' : 'รายวิชาที่สามารถรับเป็นพี่เลี้ยง'}
                                                </p>
                                                {isMine && <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px] font-black">เสร็จแล้ว {totalCompleted}/{totalTasks}</span>}
                                            </div>
                                            <div className="space-y-1">
                                                {Object.keys(tasksBySubject).map(subjId => {
                                                    const subjectTasks = tasksBySubject[subjId];
                                                    const tData = isMine ? subjectTasks[0].student_assignments : subjectTasks[0];
                                                    const subjectName = tData.subjects?.name || 'วิชาทั่วไป';
                                                    return <SmartSubjectGroup key={subjId} subjectName={subjectName} tasks={subjectTasks} isMine={isMine} onAction={handleAction} />
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                ) : <div className="text-center py-20 text-slate-400 font-bold italic">ไม่พบข้อมูล</div>}
            </div>
        </div>
    )
}