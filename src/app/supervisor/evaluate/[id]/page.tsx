// ver6
"use client"
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Save, Loader2, Info, MessageSquare, CheckCircle2, User, Cloud, Check } from 'lucide-react'
import Swal from 'sweetalert2'
import { useSearchParams } from 'next/navigation'
// --- 🚩 Skeleton Loading ---
const SkeletonEval = () => (
    <div className="min-h-screen bg-slate-50 p-6 animate-pulse space-y-6">
        <div className="h-20 bg-white rounded-3xl" />
        <div className="h-12 bg-white rounded-2xl w-3/4" />
        <div className="space-y-4">
            <div className="h-40 bg-white rounded-[2.5rem]" />
            <div className="h-40 bg-white rounded-[2.5rem]" />
        </div>
    </div>
)

export default function EvaluationPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [assignment, setAssignment] = useState<any>(null)
    const [groups, setGroups] = useState<any[]>([])
    const [activeTab, setActiveTab] = useState<number>(0)
    const searchParams = useSearchParams()
    const isEditMode = searchParams.get('edit') === 'true'
    // สถานะการบันทึกอัตโนมัติ
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

    const [scores, setScores] = useState<{ [key: number]: number | 'N/A' }>({})
    const [remarks, setRemarks] = useState<{ [key: number]: string }>({})

    // ใช้ Ref เพื่อเก็บค่าล่าสุดสำหรับ Auto-save โดยไม่ Trigger Re-render วนลูป
    const scoresRef = useRef(scores)
    const remarksRef = useRef(remarks)
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const isLocked = assignment?.is_evaluated && !isEditMode

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        fetchData()
    }, [id])

    // อัปเดต Ref ทุกครั้งที่ State เปลี่ยน
    useEffect(() => {
        scoresRef.current = scores
        remarksRef.current = remarks
    }, [scores, remarks])

    const fetchData = async () => {
        setLoading(true)

        try {

            // 1. ดึงข้อมูล Assignment
            const { data: assign, error: assignErr } = await supabase
                .from('assignment_supervisors')
                .select(`
                    *, 
                    student_assignments:assignment_id(
                        id, 
                        sub_subject_id,
                        students:student_id(*), 
                        subjects:subject_id(*)
                    )
                `)
                .eq('id', id)
                .single()

            if (assignErr || !assign) {
                Swal.fire('Error', 'ไม่พบรายการประเมิน', 'error')
                router.replace('/supervisor/students')
                return
            }
            setAssignment(assign)

            // 2. ดึงกลุ่มการประเมิน
            const subjectId = assign.student_assignments.subjects.id
            const subSubjectId = assign.student_assignments.sub_subject_id

            // let query = supabase
            //     .from('evaluation_groups')
            //     .select(`*, evaluation_items(*)`)
            //     .eq('subject_id', subjectId)


            // if (subSubjectId) {
            //     query = query.eq('sub_subject_id', subSubjectId)
            // } else {
            //     query = query.is('sub_subject_id', null)
            // }
            let query = supabase
                .from('evaluation_groups')
                .select(`
                    *, 
                    evaluation_items (*)
                `)
                .eq('subject_id', subjectId)

            if (subSubjectId) {
                query = query.eq('sub_subject_id', subSubjectId)
            } else {
                query = query.is('sub_subject_id', null)
            }

            // const { data: evalGroups } = await query.order('order_index', { ascending: true })
            const { data: evalGroups, error: groupsErr } = await query
                .order('group_name', { ascending: true }) // 🚩 เรียง Tab ตามชื่อกลุ่ม (เพราะไม่มี order_index)
                .order('order_index', { foreignTable: 'evaluation_items', ascending: true }); // 🚩 เรียงข้อ 1,2,3 ตาม order_index
            if (groupsErr) {
                console.error("Groups Error:", groupsErr.message);
                return;
            }
            const validGroups = evalGroups || []
            setGroups(validGroups)

            // 3. ดึงคะแนนเก่า
            const { data: logs } = await supabase
                .from('evaluation_logs')
                .select(`*, evaluation_answers(*)`)
                .eq('assignment_id', assign.student_assignments.id)
                .eq('supervisor_id', assign.supervisor_id)

            const restoredScores: any = {}
            const restoredRemarks: any = {}

            if (logs && logs.length > 0) {
                logs.forEach((log: any) => {
                    restoredRemarks[log.group_id] = log.comment || ''
                    log.evaluation_answers?.forEach((ans: any) => {
                        restoredScores[ans.item_id] = ans.is_na ? 'N/A' : ans.score
                    })
                })
                setScores(restoredScores)
                setRemarks(restoredRemarks)
            }

            // 🎯 Smart Resume: หา Tab แรกที่ยังทำไม่เสร็จ แล้วเด้งไปหน้านั้นเลย
            let firstIncompleteIndex = 0
            for (let i = 0; i < validGroups.length; i++) {
                const g = validGroups[i]
                const totalItems = g.evaluation_items?.length || 0
                const answeredItems = g.evaluation_items?.filter((item: any) => restoredScores[item.id] !== undefined).length

                if (answeredItems < totalItems) {
                    firstIncompleteIndex = i
                    break // เจออันแรกที่ไม่เสร็จ หยุดเลย
                }
                // ถ้าวนลูปจนจบแล้วยังไม่ break แสดงว่าเสร็จหมดแล้ว จะอยู่ที่ tab สุดท้าย หรือ tab 0 ก็ได้
                if (i === validGroups.length - 1 && answeredItems === totalItems) {
                    firstIncompleteIndex = i
                }
            }
            setActiveTab(firstIncompleteIndex)

        } catch (error) {
            console.error("Fetch Error:", error)
        } finally {
            setLoading(false)
        }
    }

    const currentGroup = groups[activeTab]
    const student = assignment?.student_assignments?.students
    const subject = assignment?.student_assignments?.subjects

    // --- 💾 ฟังก์ชัน Auto Save ---
    const triggerAutoSave = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setAutoSaveStatus('saving')

        // หน่วงเวลา 1.5 วินาที หลังกดครั้งล่าสุดค่อยบันทึก (Debounce)
        timerRef.current = setTimeout(async () => {
            await saveDataToSupabase()
            setAutoSaveStatus('saved')
            // ซ่อนสถานะ Saved หลัง 2 วินาที
            setTimeout(() => setAutoSaveStatus('idle'), 2000)
        }, 3000)
    }

    const handleScoreChange = (itemId: number, val: number | 'N/A') => {
        setScores(prev => ({ ...prev, [itemId]: val }))
        triggerAutoSave() // เรียก Auto Save ทันทีที่มีการเปลี่ยนแปลง
    }

    const handleRemarkChange = (val: string) => {
        setRemarks(prev => ({ ...prev, [currentGroup?.id]: val }))
        triggerAutoSave()
    }

    // ฟังก์ชันบันทึกจริง (ใช้ทั้ง Auto-save และปุ่มกด)
    const saveDataToSupabase = async () => {
        if (!currentGroup || !assignment) return

        try {
            // 1. Upsert Log
            const { data: log, error: logErr } = await supabase
                .from('evaluation_logs')
                .upsert({
                    assignment_id: assignment.student_assignments.id,
                    group_id: currentGroup.id,
                    supervisor_id: assignment.supervisor_id,
                    comment: remarksRef.current[currentGroup.id] || '',
                }, { onConflict: 'assignment_id, group_id, supervisor_id' })
                .select().single()

            if (logErr) throw logErr

            // 2. Upsert Answers (เฉพาะหมวดปัจจุบัน)
            const currentScores = scoresRef.current
            const answerData = currentGroup.evaluation_items
                .filter((item: any) => currentScores[item.id] !== undefined)
                .map((item: any) => ({
                    log_id: log.id,
                    item_id: item.id,
                    score: currentScores[item.id] === 'N/A' ? null : currentScores[item.id],
                    is_na: currentScores[item.id] === 'N/A'
                }))

            if (answerData.length > 0) {
                await supabase.from('evaluation_answers').upsert(answerData, { onConflict: 'log_id, item_id' })
            }
        } catch (err) {
            console.error('Auto-save failed:', err)
            setAutoSaveStatus('idle') // Reset status on error
        }
    }

    const handleNextOrFinish = async (isFinal = false) => {
        setSaving(true)
        // บันทึกครั้งสุดท้ายก่อนเปลี่ยนหน้า เพื่อความชัวร์
        await saveDataToSupabase()

        if (isFinal) {
            // 🚩 เช็คว่าตอบครบทุกข้อทุกหมวดหรือยัง
            const totalItems = groups.reduce((sum: number, g: any) => sum + (g.evaluation_items?.length || 0), 0)
            const answeredItems = groups.reduce((sum: number, g: any) => {
                return sum + (g.evaluation_items?.filter((item: any) => scores[item.id] !== undefined).length || 0)
            }, 0)

            if (answeredItems < totalItems) {
                const remaining = totalItems - answeredItems
                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'ยังประเมินไม่ครบ',
                    html: `<p>ยังเหลืออีก <b>${remaining}</b> ข้อ จากทั้งหมด <b>${totalItems}</b> ข้อ</p><p class="text-sm text-slate-400 mt-2">ต้องการบันทึกและส่งผลอยู่หรือไม่?</p>`,
                    showCancelButton: true,
                    confirmButtonText: 'ส่งเลย',
                    cancelButtonText: 'กลับไปทำต่อ',
                    confirmButtonColor: '#064e3b',
                    cancelButtonColor: '#94a3b8',
                    customClass: { popup: 'rounded-[2.5rem] p-6 font-sans' }
                })
                if (!result.isConfirmed) {
                    setSaving(false)
                    return
                }
            }

            await supabase.from('assignment_supervisors').update({ is_evaluated: true }).eq('id', id)
            Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'ส่งผลการประเมินเรียบร้อยแล้ว', timer: 2000, showConfirmButton: false })
            router.back()
        } else {
            setActiveTab(activeTab + 1)
            window.scrollTo({ top: 0, behavior: 'smooth' })
        }
        setSaving(false)
    }

    const handlePreviewImage = (url: string) => {
        Swal.fire({
            imageUrl: url,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: { popup: 'rounded-[2.5rem] p-0 overflow-hidden', image: 'm-0 w-full h-auto' }
        })
    }

    if (loading) return <SkeletonEval />

    return (
        <div className="min-h-screen bg-slate-50 pb-40 font-sans">
            {/* Header */}
            <div className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
                <div className="p-6 pb-2 flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-emerald-600 transition-colors"><ArrowLeft size={20} /></button>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                            onClick={() => student?.avatar_url && handlePreviewImage(student.avatar_url)}
                            className="relative group cursor-pointer h-12 w-12 rounded-2xl bg-emerald-50 overflow-hidden border-2 border-white shadow-sm shrink-0 flex items-center justify-center text-emerald-600"
                        >
                            {student?.avatar_url ? (
                                <img src={student.avatar_url} className="h-full w-full object-cover" />
                            ) : (
                                <User size={24} />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                <h1 className="text-lg font-black text-slate-900 truncate">{student?.first_name} {student?.last_name}</h1>
                                <span className="inline-flex items-center justify-center bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shadow-emerald-100">
                                    {student?.nickname || 'นศ.'}
                                </span>
                                {/* 🟢 สถานะ Auto Save */}
                                <div className="flex items-center gap-5 text-[10px] font-bold">
                                    {autoSaveStatus === 'saving' && <span className="text-amber-500 flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> กำลังบันทึก...</span>}
                                    {autoSaveStatus === 'saved' && <span className="text-emerald-600 flex items-center gap-1"><Cloud size={10} /> บันทึกแล้ว</span>}
                                </div>
                            </div>
                            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wide truncate opacity-80">
                                {subject?.subject_code ? `${subject.subject_code} • ` : ''} {subject?.subject_name || subject?.name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tab List */}
                <div className="flex overflow-x-auto px-6 py-3 no-scrollbar gap-2 bg-white">
                    {groups.map((g, idx) => {
                        const answered = g.evaluation_items?.filter((i: any) => scores[i.id] !== undefined).length
                        const isDone = answered === g.evaluation_items?.length
                        return (
                            <button
                                key={g.id}
                                onClick={() => setActiveTab(idx)}
                                className={`shrink-0 px-4 py-2 rounded-xl text-[11px] font-black transition-all border-2 ${activeTab === idx ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                            >
                                {isDone && <CheckCircle2 size={10} className="inline mr-1" />}
                                {g.group_name}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div className="p-6 space-y-6">
                {isLocked && (
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl flex items-center gap-3 text-amber-700 text-sm font-bold shadow-sm">
                        <Info size={20} /> รายการนี้บันทึกผลแล้ว (แก้ไขได้ในประวัติ)
                    </div>
                )}
                {currentGroup?.evaluation_items?.map((item: any, idx: number) => (
                    <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                            <h3 className="font-black text-slate-800 text-base leading-tight flex gap-3">
                                <span className="text-emerald-700">{idx + 1}.</span>
                                {item.question_text}
                            </h3>
                            <div className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-lg shrink-0">x{item.factor || 1.0}</div>
                        </div>

                        {item.description && (
                            <div className="flex gap-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-emerald-700 text-[13px] font-medium leading-relaxed italic">
                                <Info size={16} className="shrink-0 mt-0.5 text-emerald-500" />
                                {item.description}
                            </div>
                        )}

                        <div className="grid grid-cols-6 gap-2 pt-2">
                            {[1, 2, 3, 4, 5].map((v) => (
                                <button
                                    key={v}
                                    // 🟢 ใช้ handleScoreChange แทนการ setScores โดยตรง
                                    disabled={isLocked}
                                    // onClick={() => handleScoreChange(item.id, v)}
                                    onClick={() => !isLocked && handleScoreChange(item.id, v)}
                                    className={`h-12 rounded-2xl font-black transition-all ${scores[item.id] === v ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >{v}</button>
                            ))}
                            {item.allow_na && (
                                <button
                                    onClick={() => handleScoreChange(item.id, 'N/A')}
                                    className={`h-12 rounded-2xl font-black text-[10px] ${scores[item.id] === 'N/A' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-300'}`}
                                >N/A</button>
                            )}
                        </div>

                    </div>
                ))}

                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 mt-8">
                    <div className="flex items-center gap-2 mb-4 text-slate-800">
                        <MessageSquare size={18} className="text-emerald-600" />
                        <h4 className="font-black text-sm uppercase tracking-widest">หมายเหตุ / ข้อเสนอแนะ</h4>
                    </div>
                    <textarea
                        value={remarks[currentGroup?.id] || ''}
                        // 🟢 ใช้ handleRemarkChange
                        onChange={(e) => handleRemarkChange(e.target.value)}
                        placeholder={`ระบุข้อเสนอแนะสำหรับหมวด ${currentGroup?.group_name}...`}
                        className="w-full min-h-[120px] p-5 rounded-[1.5rem] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-100 font-medium text-slate-600 text-sm"
                    />
                </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100">
                <div className="flex justify-between items-center mb-4 px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ความคืบหน้าหมวดนี้:</span>
                    <span className="text-sm font-black text-emerald-600">
                        {currentGroup?.evaluation_items?.filter((i: any) => scores[i.id] !== undefined).length} / {currentGroup?.evaluation_items?.length} ข้อ
                    </span>
                </div>

                <div className="flex gap-3">
                    {activeTab < groups.length - 1 ? (
                        /* --- ปุ่มถัดไป --- */
                        <button
                            onClick={() => handleNextOrFinish(false)}
                            disabled={saving}
                            className="flex-1 h-14 bg-emerald-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                'ถัดไป (Next)'
                            )}
                        </button>
                    ) : (
                        /* --- ปุ่มสุดท้าย --- */
                        <button
                            onClick={() => {
                                if (isLocked) {
                                    router.back()
                                } else {
                                    handleNextOrFinish(true)
                                }
                            }}
                            disabled={saving}
                            className={`flex-1 h-14 rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 ${isLocked
                                ? 'bg-slate-400 text-white'
                                : 'bg-slate-900 text-white shadow-slate-200'
                                }`}
                        >
                            {saving ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : isLocked ? (
                                'ปิดหน้าต่าง (Close)'
                            ) : (
                                <>
                                    <Save size={20} />
                                    <span>ยืนยันและบันทึก (Finish)</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}