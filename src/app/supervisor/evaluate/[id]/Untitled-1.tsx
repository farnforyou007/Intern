// // /src/app/supervisor/evaluate/[id]/page.tsx
// // ver2
// "use client"
// import { useState, useEffect } from 'react'
// import { useParams, useRouter } from 'next/navigation'
// import { createBrowserClient } from '@supabase/ssr'
// import { ArrowLeft, Save, Loader2, Info, MessageSquare, CheckCircle2, User } from 'lucide-react'
// import Swal from 'sweetalert2'

// // --- 🚩 Skeleton Loading (โครงสร้างเดียวกับหน้าจริง) ---
// const SkeletonEval = () => (
//     <div className="min-h-screen bg-slate-50 p-6 animate-pulse space-y-6">
//         <div className="h-20 bg-white rounded-3xl" />
//         <div className="h-12 bg-white rounded-2xl w-3/4" />
//         <div className="space-y-4">
//             <div className="h-40 bg-white rounded-[2.5rem]" />
//             <div className="h-40 bg-white rounded-[2.5rem]" />
//         </div>
//     </div>
// )

// export default function EvaluationPage() {
//     const params = useParams()
//     const router = useRouter()
//     const id = params.id

//     const [loading, setLoading] = useState(true)
//     const [saving, setSaving] = useState(false)
//     const [assignment, setAssignment] = useState<any>(null)
//     const [groups, setGroups] = useState<any[]>([])
//     const [activeTab, setActiveTab] = useState<number>(0)

//     const [scores, setScores] = useState<{ [key: number]: number | 'N/A' }>({})
//     const [remarks, setRemarks] = useState<{ [key: number]: string }>({})

//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     useEffect(() => { fetchData() }, [id])

//     const fetchData = async () => {
//         setLoading(true)
//         try {
//             // 🚩 1. ตรวจสอบความปลอดภัยและดึงวิชาที่รับผิดชอบจริง
//             const { data: assign, error: assignErr } = await supabase
//                 .from('assignment_supervisors')
//                 .select(`
//                     *, 
//                     student_assignments:assignment_id(
//                         id, 
//                         students:student_id(*), 
//                         subjects:subject_id(*)
//                     )
//                 `)
//                 .eq('id', id)
//                 .single()

//             if (assignErr || !assign) {
//                 Swal.fire('Error', 'ไม่พบรายการประเมินหรือคุณไม่มีสิทธิ์เข้าถึง', 'error')
//                 router.replace('/supervisor/students')
//                 return
//             }
//             setAssignment(assign)

//             // 🚩 2. ดึงกลุ่มการประเมิน "เฉพาะวิชาที่มอบหมายให้พี่เลี้ยงคนนี้" เท่านั้น
//             const subjectId = assign.student_assignments.subjects.id
//             const { data: evalGroups } = await supabase
//                 .from('evaluation_groups')
//                 .select(`*, evaluation_items(*)`)
//                 .eq('subject_id', subjectId) // กรองตรงๆ ด้วย subject_id
//                 .order('group_name', { ascending: true }) // เรียงตามตัวอักษร

//             setGroups(evalGroups || [])

//             // 🚩 3. Real-time Restore: ดึงข้อมูลเก่า (ถ้ามี) มาใส่ State
//             const { data: logs } = await supabase
//                 .from('evaluation_logs')
//                 .select(`*, evaluation_answers(*)`)
//                 .eq('assignment_id', assign.student_assignments.id)
//                 .eq('supervisor_id', assign.supervisor_id)

//             if (logs && logs.length > 0) {
//                 const newScores = { ...scores }
//                 const newRemarks = { ...remarks }
//                 logs.forEach((log: any) => {
//                     newRemarks[log.group_id] = log.comment || ''
//                     log.evaluation_answers?.forEach((ans: any) => {
//                         newScores[ans.item_id] = ans.is_na ? 'N/A' : ans.score
//                     })
//                 })
//                 setScores(newScores)
//                 setRemarks(newRemarks)
//             }
//         } catch (error) {
//             console.error("Fetch Error:", error)
//         } finally {
//             setLoading(false)
//         }
//     }

//     const currentGroup = groups[activeTab]
//     const student = assignment?.student_assignments?.students
//     const subject = assignment?.student_assignments?.subjects

//     const handleSaveGroup = async (isFinal = false) => {
//         if (!currentGroup) return
//         setSaving(true)
//         try {
//             // บันทึก Log และ Remark (Real-time Upsert)
//             const { data: log, error: logErr } = await supabase
//                 .from('evaluation_logs')
//                 .upsert({
//                     assignment_id: assignment.student_assignments.id,
//                     group_id: currentGroup.id,
//                     supervisor_id: assignment.supervisor_id,
//                     comment: remarks[currentGroup.id] || '',
//                 }, { onConflict: 'assignment_id, group_id, supervisor_id' })
//                 .select().single()

//             if (logErr) throw logErr

//             // บันทึกคะแนนรายข้อ
//             const answerData = currentGroup.evaluation_items
//                 .filter((item: any) => scores[item.id] !== undefined)
//                 .map((item: any) => ({
//                     log_id: log.id,
//                     item_id: item.id,
//                     score: scores[item.id] === 'N/A' ? null : scores[item.id],
//                     is_na: scores[item.id] === 'N/A'
//                 }))

//             if (answerData.length > 0) {
//                 await supabase.from('evaluation_answers').upsert(answerData, { onConflict: 'log_id, item_id' })
//             }

//             // ถ้าทำครบทุกข้อในหมวดนี้แล้ว ให้อัปเดตสถานะใน assignment_supervisors (Optional)
//             if (isFinal) {
//                  await supabase.from('assignment_supervisors').update({ is_evaluated: true }).eq('id', id)
//             }

//             if (!isFinal) {
//                 setActiveTab(activeTab + 1)
//                 window.scrollTo({ top: 0, behavior: 'smooth' })
//             } else {
//                 Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'ส่งผลการประเมินเรียบร้อยแล้ว', timer: 2000, showConfirmButton: false })
//                 router.back()
//             }
//         } catch (err) {
//             Swal.fire('Error', 'ไม่สามารถบันทึกข้อมูลได้', 'error')
//         } finally { setSaving(false) }
//     }

//     const handlePreviewImage = (url: string) => {
//         Swal.fire({
//             imageUrl: url,
//             showConfirmButton: false,
//             showCloseButton: true,
//             customClass: { popup: 'rounded-[2.5rem] p-0 overflow-hidden', image: 'm-0 w-full h-auto' }
//         })
//     }

//     if (loading) return <SkeletonEval />

//     return (
//         <div className="min-h-screen bg-slate-50 pb-40 font-sans">
//             {/* Header: ธีมสีเขียว-ขาว สะอาดตา */}
//             <div className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
//                 <div className="p-6 pb-2 flex items-center gap-4">
//                     <button onClick={() => router.back()} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-emerald-600 transition-colors"><ArrowLeft size={20} /></button>

//                     <div className="flex items-center gap-3 flex-1 min-w-0">
//                         <div
//                             onClick={() => student?.avatar_url && handlePreviewImage(student.avatar_url)}
//                             className="relative group cursor-pointer h-12 w-12 rounded-2xl bg-emerald-50 overflow-hidden border-2 border-white shadow-sm shrink-0 flex items-center justify-center text-emerald-600"
//                         >
//                             {student?.avatar_url ? (
//                                 <>
//                                     <img src={student.avatar_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
//                                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" />
//                                 </>
//                             ) : (
//                                 <User size={24} />
//                             )}
//                         </div>

//                         <div className="min-w-0 flex-1">
//                             <div className="flex items-center flex-wrap gap-2 mb-1.5">
//                                 <h1 className="text-xl font-black text-slate-800 leading-none tracking-tight">
//                                     {student?.first_name} {student?.last_name}
//                                 </h1>
//                                 <span className="inline-flex items-center justify-center bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shadow-emerald-100">
//                                     {student?.nickname || 'นศ.'}
//                                 </span>
//                             </div>
//                             <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wide truncate opacity-80">
//                                 {subject?.subject_code ? `${subject.subject_code} • ` : ''} {subject?.subject_name || subject?.name}
//                             </p>
//                         </div>
//                     </div>
//                 </div>

//                 <div className="flex overflow-x-auto px-6 py-3 no-scrollbar gap-2 bg-white">
//                     {groups.map((g, idx) => {
//                         const answered = g.evaluation_items?.filter((i: any) => scores[i.id] !== undefined).length
//                         const isDone = answered === g.evaluation_items?.length
//                         return (
//                             <button
//                                 key={g.id}
//                                 onClick={() => setActiveTab(idx)}
//                                 className={`shrink-0 px-4 py-2 rounded-xl text-[11px] font-black transition-all border-2 ${activeTab === idx ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
//                             >
//                                 {isDone && <CheckCircle2 size={10} className="inline mr-1" />}
//                                 {g.group_name}
//                             </button>
//                         )
//                     })}
//                 </div>
//             </div>

//             <div className="p-6 space-y-6">
//                 {currentGroup?.evaluation_items?.map((item: any, idx: number) => (
//                     <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4">
//                         <div className="flex justify-between items-start gap-4">
//                             <h3 className="font-black text-slate-800 text-base leading-tight flex gap-3">
//                                 <span className="text-emerald-700">{idx + 1}.</span>
//                                 {item.question_text}
//                             </h3>
//                             <div className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-lg shrink-0">Factor x{item.factor || 1.0}</div>
//                         </div>

//                         {item.description && (
//                             <div className="flex gap-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-emerald-700 text-[13px] font-medium leading-relaxed italic">
//                                 <Info size={16} className="shrink-0 mt-0.5 text-emerald-500" />
//                                 {item.description}
//                             </div>
//                         )}

//                         <div className="grid grid-cols-6 gap-2 pt-2">
//                             {[1, 2, 3, 4, 5].map((v) => (
//                                 <button
//                                     key={v}
//                                     onClick={() => setScores({ ...scores, [item.id]: v })}
//                                     className={`h-12 rounded-2xl font-black transition-all ${scores[item.id] === v ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
//                                 >{v}</button>
//                             ))}
//                             {item.allow_na && (
//                                 <button
//                                     onClick={() => setScores({ ...scores, [item.id]: 'N/A' })}
//                                     className={`h-12 rounded-2xl font-black text-[10px] ${scores[item.id] === 'N/A' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-300'}`}
//                                 >N/A</button>
//                             )}
//                         </div>
//                     </div>
//                 ))}

//                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 mt-8">
//                     <div className="flex items-center gap-2 mb-4 text-slate-800">
//                         <MessageSquare size={18} className="text-emerald-600" />
//                         <h4 className="font-black text-sm uppercase tracking-widest">หมายเหตุ / ข้อเสนอแนะ</h4>
//                     </div>
//                     <textarea
//                         value={remarks[currentGroup?.id] || ''}
//                         onChange={(e) => setRemarks({ ...remarks, [currentGroup?.id]: e.target.value })}
//                         placeholder={`ระบุข้อเสนอแนะสำหรับหมวด ${currentGroup?.group_name}...`}
//                         className="w-full min-h-[120px] p-5 rounded-[1.5rem] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-100 font-medium text-slate-600 text-sm"
//                     />
//                 </div>
//             </div>

//             <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100">
//                 <div className="flex justify-between items-center mb-4 px-2">
//                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ความคืบหน้าหมวดนี้:</span>
//                     <span className="text-sm font-black text-emerald-600">
//                         {currentGroup?.evaluation_items?.filter((i: any) => scores[i.id] !== undefined).length} / {currentGroup?.evaluation_items?.length} ข้อ
//                     </span>
//                 </div>
//                 <div className="flex gap-3">
//                     {activeTab < groups.length - 1 ? (
//                         <button
//                             onClick={() => handleSaveGroup(false)}
//                             disabled={saving}
//                             className="flex-1 h-14 bg-emerald-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
//                         >
//                             {saving ? <Loader2 className="animate-spin" /> : 'บันทึกและไปหมวดถัดไป'}
//                         </button>
//                     ) : (
//                         <button
//                             onClick={() => handleSaveGroup(true)}
//                             disabled={saving}
//                             className="flex-1 h-14 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
//                         >
//                             {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> ยืนยันผลการประเมินทั้งหมด</>}
//                         </button>
//                     )}
//                 </div>
//             </div>
//         </div>
//     )
// }


// ver3
// "use client"
// import { useState, useEffect } from 'react'
// import { useParams, useRouter } from 'next/navigation'
// import { createBrowserClient } from '@supabase/ssr'
// import { ArrowLeft, Save, Loader2, Info, MessageSquare, CheckCircle2, User } from 'lucide-react'
// import Swal from 'sweetalert2'

// const SkeletonEval = () => (
//     <div className="min-h-screen bg-slate-50 p-6 animate-pulse space-y-6">
//         <div className="h-20 bg-white rounded-3xl" />
//         <div className="h-12 bg-white rounded-2xl w-3/4" />
//         <div className="space-y-4"><div className="h-40 bg-white rounded-[2.5rem]" /><div className="h-40 bg-white rounded-[2.5rem]" /></div>
//     </div>
// )

// export default function EvaluationPage() {
//     const params = useParams()
//     const router = useRouter()
//     const id = params.id
//     const [loading, setLoading] = useState(true)
//     const [saving, setSaving] = useState(false)
//     const [assignment, setAssignment] = useState<any>(null)
//     const [groups, setGroups] = useState<any[]>([])
//     const [activeTab, setActiveTab] = useState<number>(0)
//     const [scores, setScores] = useState<{ [key: number]: number | 'N/A' }>({})
//     const [remarks, setRemarks] = useState<{ [key: number]: string }>({})

//     const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

//     useEffect(() => { fetchData() }, [id])

//     const fetchData = async () => {
//         setLoading(true)
//         try {
//             // 🚩 1. ดึงข้อมูลงาน (Assignment) พร้อม "sub_subject_id"
//             const { data: assign, error: assignErr } = await supabase
//                 .from('assignment_supervisors')
//                 .select(`*, student_assignments:assignment_id( id, sub_subject_id, students:student_id(*), subjects:subject_id(*) )`)
//                 .eq('id', id).single()

//             if (assignErr || !assign) {
//                 Swal.fire('Error', 'ไม่พบข้อมูล', 'error'); router.replace('/supervisor/students'); return
//             }
//             setAssignment(assign)

//             // 🚩 2. กรองกลุ่มประเมินด้วย sub_subject_id (ถ้ามี)
//             // ถ้า sub_subject_id เป็น ANC -> ก็จะดึงแค่กลุ่ม ANC มาโชว์
//             const subjectId = assign.student_assignments.subjects.id
//             const subSubjectId = assign.student_assignments.sub_subject_id

//             let query = supabase.from('evaluation_groups').select(`*, evaluation_items(*)`).eq('subject_id', subjectId)
            
//             if (subSubjectId) {
//                 query = query.eq('sub_subject_id', subSubjectId) // 🎯 จุดที่ทำให้แท็บขึ้นแค่อันเดียว
//             }

//             const { data: evalGroups } = await query.order('group_name')
//             setGroups(evalGroups || [])

//             // 3. ดึงคะแนนเก่า
//             const { data: logs } = await supabase.from('evaluation_logs').select(`*, evaluation_answers(*)`).eq('assignment_id', assign.student_assignments.id).eq('supervisor_id', assign.supervisor_id)
//             if (logs?.length) {
//                 const newScores = { ...scores }, newRemarks = { ...remarks }
//                 logs.forEach((log: any) => {
//                     newRemarks[log.group_id] = log.comment || ''
//                     log.evaluation_answers?.forEach((ans: any) => newScores[ans.item_id] = ans.is_na ? 'N/A' : ans.score)
//                 })
//                 setScores(newScores); setRemarks(newRemarks)
//             }
//         } catch (error) { console.error(error) } finally { setLoading(false) }
//     }

//     const currentGroup = groups[activeTab]
//     const student = assignment?.student_assignments?.students
//     const subject = assignment?.student_assignments?.subjects

//     const handleSaveGroup = async (isFinal = false) => {
//         if (!currentGroup) return
//         setSaving(true)
//         try {
//             const { data: log, error: logErr } = await supabase.from('evaluation_logs').upsert({
//                 assignment_id: assignment.student_assignments.id, group_id: currentGroup.id, supervisor_id: assignment.supervisor_id, comment: remarks[currentGroup.id] || ''
//             }, { onConflict: 'assignment_id, group_id, supervisor_id' }).select().single()
//             if (logErr) throw logErr

//             const answerData = currentGroup.evaluation_items.filter((item: any) => scores[item.id] !== undefined).map((item: any) => ({
//                 log_id: log.id, item_id: item.id, score: scores[item.id] === 'N/A' ? null : scores[item.id], is_na: scores[item.id] === 'N/A'
//             }))
//             if (answerData.length > 0) await supabase.from('evaluation_answers').upsert(answerData, { onConflict: 'log_id, item_id' })

//             if (isFinal) await supabase.from('assignment_supervisors').update({ is_evaluated: true }).eq('id', id)

//             if (!isFinal) { setActiveTab(activeTab + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
//             else { Swal.fire({ icon: 'success', title: 'เสร็จสิ้น', timer: 1500, showConfirmButton: false }); router.back() }
//         } catch (err) { Swal.fire('Error', 'บันทึกไม่สำเร็จ', 'error') } finally { setSaving(false) }
//     }

//     const handlePreviewImage = (url: string) => Swal.fire({ imageUrl: url, showConfirmButton: false, customClass: { popup: 'rounded-[2.5rem] p-0' } })

//     if (loading) return <SkeletonEval />

//     return (
//         <div className="min-h-screen bg-slate-50 pb-40 font-sans">
//             <div className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
//                 <div className="p-6 pb-2 flex items-center gap-4">
//                     <button onClick={() => router.back()} className="p-2 bg-slate-50 rounded-full text-slate-400"><ArrowLeft size={20} /></button>
//                     <div className="flex items-center gap-3 flex-1 min-w-0">
//                         <div onClick={() => student?.avatar_url && handlePreviewImage(student.avatar_url)} className="relative h-12 w-12 rounded-2xl bg-emerald-50 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center cursor-pointer">
//                             {student?.avatar_url ? <img src={student.avatar_url} className="h-full w-full object-cover" /> : <User size={24} className="text-emerald-600"/>}
//                         </div>
//                         <div className="min-w-0 flex-1">
//                             <h1 className="text-lg font-black text-slate-900 truncate">{student?.first_name} {student?.last_name}</h1>
//                             <p className="text-xs font-bold text-slate-400">{subject?.subject_code} • {assignment?.student_assignments?.sub_subjects?.name || subject?.name}</p>
//                         </div>
//                     </div>
//                 </div>
//                 {/* 🚩 แท็บแสดงหมวดประเมิน (จะขึ้นแค่อันเดียวถ้ากรอง sub_subject_id ถูกต้อง) */}
//                 <div className="flex overflow-x-auto px-6 py-3 no-scrollbar gap-2 bg-white">
//                     {groups.map((g, idx) => {
//                         const isDone = g.evaluation_items?.every((i: any) => scores[i.id] !== undefined)
//                         return (
//                             <button key={g.id} onClick={() => setActiveTab(idx)} className={`shrink-0 px-4 py-2 rounded-xl text-[11px] font-black border-2 transition-all ${activeTab === idx ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>
//                                 {isDone && <CheckCircle2 size={10} className="inline mr-1" />}{g.group_name}
//                             </button>
//                         )
//                     })}
//                 </div>
//             </div>

//             <div className="p-6 space-y-6">
//                 {currentGroup?.evaluation_items?.map((item: any, idx: number) => (
//                     <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4">
//                         <div className="flex justify-between items-start gap-4">
//                             <h3 className="font-black text-slate-800 text-base"><span className="text-emerald-700 mr-2">{idx + 1}.</span>{item.question_text}</h3>
//                             <div className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-lg">x{item.factor || 1}</div>
//                         </div>
//                         {item.description && <div className="p-3 bg-emerald-50 rounded-2xl text-xs text-emerald-700"><Info size={14} className="inline mr-1"/>{item.description}</div>}
//                         <div className="grid grid-cols-6 gap-2">
//                             {[1, 2, 3, 4, 5].map(v => (
//                                 <button key={v} onClick={() => setScores({ ...scores, [item.id]: v })} className={`h-12 rounded-2xl font-black ${scores[item.id] === v ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-slate-50 text-slate-400'}`}>{v}</button>
//                             ))}
//                             {item.allow_na && <button onClick={() => setScores({ ...scores, [item.id]: 'N/A' })} className={`h-12 rounded-2xl font-black text-[10px] ${scores[item.id] === 'N/A' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-300'}`}>N/A</button>}
//                         </div>
//                     </div>
//                 ))}
//                 <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">
//                     <h4 className="font-black text-sm mb-3 flex items-center gap-2"><MessageSquare size={16} className="text-emerald-600"/>ข้อเสนอแนะ</h4>
//                     <textarea value={remarks[currentGroup?.id] || ''} onChange={e => setRemarks({ ...remarks, [currentGroup?.id]: e.target.value })} className="w-full h-32 p-4 bg-slate-50 rounded-2xl border-none text-sm" placeholder="ระบุความคิดเห็น..." />
//                 </div>
//             </div>

//             <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-slate-100">
//                 <div className="flex gap-3">
//                     {activeTab < groups.length - 1 
//                         ? <button onClick={() => handleSaveGroup(false)} disabled={saving} className="flex-1 h-14 bg-emerald-600 text-white rounded-2xl font-black shadow-lg">{saving ? <Loader2 className="animate-spin m-auto"/> : 'ถัดไป'}</button>
//                         : <button onClick={() => handleSaveGroup(true)} disabled={saving} className="flex-1 h-14 bg-slate-900 text-white rounded-2xl font-black shadow-xl">{saving ? <Loader2 className="animate-spin m-auto"/> : 'บันทึกทั้งหมด'}</button>
//                     }
//                 </div>
//             </div>
//         </div>
//     )
// }




// // ver5
// "use client"
// import { useState, useEffect } from 'react'
// import { useParams, useRouter } from 'next/navigation'
// import { createBrowserClient } from '@supabase/ssr'
// import { ArrowLeft, Save, Loader2, Info, MessageSquare, CheckCircle2, User } from 'lucide-react'
// import Swal from 'sweetalert2'

// // --- 🚩 Skeleton Loading ---
// const SkeletonEval = () => (
//     <div className="min-h-screen bg-slate-50 p-6 animate-pulse space-y-6">
//         <div className="h-20 bg-white rounded-3xl" />
//         <div className="h-12 bg-white rounded-2xl w-3/4" />
//         <div className="space-y-4">
//             <div className="h-40 bg-white rounded-[2.5rem]" />
//             <div className="h-40 bg-white rounded-[2.5rem]" />
//         </div>
//     </div>
// )

// export default function EvaluationPage() {
//     const params = useParams()
//     const router = useRouter()
//     const id = params.id

//     const [loading, setLoading] = useState(true)
//     const [saving, setSaving] = useState(false)
//     const [assignment, setAssignment] = useState<any>(null)
//     const [groups, setGroups] = useState<any[]>([])
//     const [activeTab, setActiveTab] = useState<number>(0)

//     const [scores, setScores] = useState<{ [key: number]: number | 'N/A' }>({})
//     const [remarks, setRemarks] = useState<{ [key: number]: string }>({})

//     const supabase = createBrowserClient(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
//     )

//     useEffect(() => { fetchData() }, [id])

//     const fetchData = async () => {
//         setLoading(true)
//         try {
//             // 🚩 1. ดึงข้อมูลงาน (Assignment) และพ่วง sub_subject_id มาด้วย
//             const { data: assign, error: assignErr } = await supabase
//                 .from('assignment_supervisors')
//                 .select(`
//                     *, 
//                     student_assignments:assignment_id(
//                         id, 
//                         sub_subject_id,
//                         students:student_id(*), 
//                         subjects:subject_id(*)
//                     )
//                 `)
//                 .eq('id', id)
//                 .single()

//             if (assignErr || !assign) {
//                 Swal.fire('Error', 'ไม่พบรายการประเมินหรือคุณไม่มีสิทธิ์เข้าถึง', 'error')
//                 router.replace('/supervisor/students')
//                 return
//             }
//             setAssignment(assign)

//             // 🚩 2. ดึงกลุ่มการประเมิน (แก้ไข Logic การกรองตรงนี้)
//             const subjectId = assign.student_assignments.subjects.id
//             const subSubjectId = assign.student_assignments.sub_subject_id

//             // เริ่ม Query ด้วย subject_id ก่อน
//             let query = supabase
//                 .from('evaluation_groups')
//                 .select(`*, evaluation_items(*)`)
//                 .eq('subject_id', subjectId)
            
//             // เพิ่มเงื่อนไขกรอง sub_subject_id
//             if (subSubjectId) {
//                 // กรณี: เป็นวิชาย่อย (ANC, LR, PP) -> ดึงเฉพาะของวิชาย่อยนั้น
//                 query = query.eq('sub_subject_id', subSubjectId)
//             } else {
//                 // กรณี: เป็นเล่มรายงาน หรือวิชาทั่วไป (ไม่มี sub_subject)
//                 // ⚠️ ต้องสั่ง .is('sub_subject_id', null) เพื่อไม่ให้ดึง ANC/LR มาปน
//                 query = query.is('sub_subject_id', null)
//             }

//             const { data: evalGroups } = await query.order('group_name', { ascending: true })

//             setGroups(evalGroups || [])

//             // 🚩 3. Real-time Restore: ดึงข้อมูลเก่า (ถ้ามี)
//             const { data: logs } = await supabase
//                 .from('evaluation_logs')
//                 .select(`*, evaluation_answers(*)`)
//                 .eq('assignment_id', assign.student_assignments.id)
//                 .eq('supervisor_id', assign.supervisor_id)

//             if (logs && logs.length > 0) {
//                 const newScores = { ...scores }
//                 const newRemarks = { ...remarks }
//                 logs.forEach((log: any) => {
//                     newRemarks[log.group_id] = log.comment || ''
//                     log.evaluation_answers?.forEach((ans: any) => {
//                         newScores[ans.item_id] = ans.is_na ? 'N/A' : ans.score
//                     })
//                 })
//                 setScores(newScores)
//                 setRemarks(newRemarks)
//             }
//         } catch (error) {
//             console.error("Fetch Error:", error)
//         } finally {
//             setLoading(false)
//         }
//     }

//     const currentGroup = groups[activeTab]
//     const student = assignment?.student_assignments?.students
//     const subject = assignment?.student_assignments?.subjects

//     const handleSaveGroup = async (isFinal = false) => {
//         if (!currentGroup) return
//         setSaving(true)
//         try {
//             // บันทึก Log และ Remark
//             const { data: log, error: logErr } = await supabase
//                 .from('evaluation_logs')
//                 .upsert({
//                     assignment_id: assignment.student_assignments.id,
//                     group_id: currentGroup.id,
//                     supervisor_id: assignment.supervisor_id,
//                     comment: remarks[currentGroup.id] || '',
//                 }, { onConflict: 'assignment_id, group_id, supervisor_id' })
//                 .select().single()

//             if (logErr) throw logErr

//             // บันทึกคะแนนรายข้อ
//             const answerData = currentGroup.evaluation_items
//                 .filter((item: any) => scores[item.id] !== undefined)
//                 .map((item: any) => ({
//                     log_id: log.id,
//                     item_id: item.id,
//                     score: scores[item.id] === 'N/A' ? null : scores[item.id],
//                     is_na: scores[item.id] === 'N/A'
//                 }))

//             if (answerData.length > 0) {
//                 await supabase.from('evaluation_answers').upsert(answerData, { onConflict: 'log_id, item_id' })
//             }

//             // ถ้าเป็นกลุ่มสุดท้าย (ยืนยันผล) ให้อัปเดตสถานะงาน
//             if (isFinal) {
//                  await supabase.from('assignment_supervisors').update({ is_evaluated: true }).eq('id', id)
//             }

//             if (!isFinal) {
//                 setActiveTab(activeTab + 1)
//                 window.scrollTo({ top: 0, behavior: 'smooth' })
//             } else {
//                 Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ', text: 'ส่งผลการประเมินเรียบร้อยแล้ว', timer: 2000, showConfirmButton: false })
//                 router.back()
//             }
//         } catch (err) {
//             Swal.fire('Error', 'ไม่สามารถบันทึกข้อมูลได้', 'error')
//         } finally { setSaving(false) }
//     }

//     const handlePreviewImage = (url: string) => {
//         Swal.fire({
//             imageUrl: url,
//             showConfirmButton: false,
//             showCloseButton: true,
//             customClass: { popup: 'rounded-[2.5rem] p-0 overflow-hidden', image: 'm-0 w-full h-auto' }
//         })
//     }

//     if (loading) return <SkeletonEval />

//     return (
//         <div className="min-h-screen bg-slate-50 pb-40 font-sans">
//             {/* Header */}
//             <div className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm">
//                 <div className="p-6 pb-2 flex items-center gap-4">
//                     <button onClick={() => router.back()} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-emerald-600 transition-colors"><ArrowLeft size={20} /></button>

//                     <div className="flex items-center gap-3 flex-1 min-w-0">
//                         <div
//                             onClick={() => student?.avatar_url && handlePreviewImage(student.avatar_url)}
//                             className="relative group cursor-pointer h-12 w-12 rounded-2xl bg-emerald-50 overflow-hidden border-2 border-white shadow-sm shrink-0 flex items-center justify-center text-emerald-600"
//                         >
//                             {student?.avatar_url ? (
//                                 <>
//                                     <img src={student.avatar_url} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
//                                     <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" />
//                                 </>
//                             ) : (
//                                 <User size={24} />
//                             )}
//                         </div>

//                         <div className="min-w-0 flex-1">
//                             <div className="flex items-center flex-wrap gap-2 mb-1.5">
//                                 <h1 className="text-xl font-black text-slate-800 leading-none tracking-tight">
//                                     {student?.first_name} {student?.last_name}
//                                 </h1>
//                                 <span className="inline-flex items-center justify-center bg-emerald-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm shadow-emerald-100">
//                                     {student?.nickname || 'นศ.'}
//                                 </span>
//                             </div>
//                             <p className="text-[13px] font-bold text-slate-400 uppercase tracking-wide truncate opacity-80">
//                                 {subject?.subject_code ? `${subject.subject_code} • ` : ''} {subject?.subject_name || subject?.name}
//                             </p>
//                         </div>
//                     </div>
//                 </div>

//                 {/* Tab List */}
//                 <div className="flex overflow-x-auto px-6 py-3 no-scrollbar gap-2 bg-white">
//                     {groups.map((g, idx) => {
//                         const answered = g.evaluation_items?.filter((i: any) => scores[i.id] !== undefined).length
//                         const isDone = answered === g.evaluation_items?.length
//                         return (
//                             <button
//                                 key={g.id}
//                                 onClick={() => setActiveTab(idx)}
//                                 className={`shrink-0 px-4 py-2 rounded-xl text-[11px] font-black transition-all border-2 ${activeTab === idx ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
//                             >
//                                 {isDone && <CheckCircle2 size={10} className="inline mr-1" />}
//                                 {g.group_name}
//                             </button>
//                         )
//                     })}
//                 </div>
//             </div>

//             <div className="p-6 space-y-6">
//                 {currentGroup?.evaluation_items?.map((item: any, idx: number) => (
//                     <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-4">
//                         <div className="flex justify-between items-start gap-4">
//                             <h3 className="font-black text-slate-800 text-base leading-tight flex gap-3">
//                                 <span className="text-emerald-700">{idx + 1}.</span>
//                                 {item.question_text}
//                             </h3>
//                             <div className="text-[10px] font-black bg-slate-50 text-slate-400 px-2 py-1 rounded-lg shrink-0">Factor x{item.factor || 1.0}</div>
//                         </div>

//                         {item.description && (
//                             <div className="flex gap-2 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-emerald-700 text-[13px] font-medium leading-relaxed italic">
//                                 <Info size={16} className="shrink-0 mt-0.5 text-emerald-500" />
//                                 {item.description}
//                             </div>
//                         )}

//                         <div className="grid grid-cols-6 gap-2 pt-2">
//                             {[1, 2, 3, 4, 5].map((v) => (
//                                 <button
//                                     key={v}
//                                     onClick={() => setScores({ ...scores, [item.id]: v })}
//                                     className={`h-12 rounded-2xl font-black transition-all ${scores[item.id] === v ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100 scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
//                                 >{v}</button>
//                             ))}
//                             {item.allow_na && (
//                                 <button
//                                     onClick={() => setScores({ ...scores, [item.id]: 'N/A' })}
//                                     className={`h-12 rounded-2xl font-black text-[10px] ${scores[item.id] === 'N/A' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-300'}`}
//                                 >N/A</button>
//                             )}
//                         </div>
//                     </div>
//                 ))}

//                 {/* ส่วนแสดงหมายเหตุ */}
//                 {groups.length > 0 ? (
//                     <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 mt-8">
//                         <div className="flex items-center gap-2 mb-4 text-slate-800">
//                             <MessageSquare size={18} className="text-emerald-600" />
//                             <h4 className="font-black text-sm uppercase tracking-widest">หมายเหตุ / ข้อเสนอแนะ</h4>
//                         </div>
//                         <textarea
//                             value={remarks[currentGroup?.id] || ''}
//                             onChange={(e) => setRemarks({ ...remarks, [currentGroup?.id]: e.target.value })}
//                             placeholder={`ระบุข้อเสนอแนะสำหรับหมวด ${currentGroup?.group_name}...`}
//                             className="w-full min-h-[120px] p-5 rounded-[1.5rem] bg-slate-50 border-none outline-none focus:ring-2 focus:ring-emerald-100 font-medium text-slate-600 text-sm"
//                         />
//                     </div>
//                 ) : (
//                     // กรณีไม่พบแบบประเมิน (เช่น filter แล้วไม่เจอ)
//                     <div className="text-center py-20 text-slate-400 font-bold italic">ไม่พบแบบประเมินสำหรับรายการนี้</div>
//                 )}
//             </div>

//             {/* Footer Buttons */}
//             {groups.length > 0 && (
//                 <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100">
//                     <div className="flex justify-between items-center mb-4 px-2">
//                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ความคืบหน้าหมวดนี้:</span>
//                         <span className="text-sm font-black text-emerald-600">
//                             {currentGroup?.evaluation_items?.filter((i: any) => scores[i.id] !== undefined).length} / {currentGroup?.evaluation_items?.length} ข้อ
//                         </span>
//                     </div>
//                     <div className="flex gap-3">
//                         {activeTab < groups.length - 1 ? (
//                             <button
//                                 onClick={() => handleSaveGroup(false)}
//                                 disabled={saving}
//                                 className="flex-1 h-14 bg-emerald-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-2"
//                             >
//                                 {saving ? <Loader2 className="animate-spin" /> : 'บันทึกและไปหมวดถัดไป'}
//                             </button>
//                         ) : (
//                             <button
//                                 onClick={() => handleSaveGroup(true)}
//                                 disabled={saving}
//                                 className="flex-1 h-14 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
//                             >
//                                 {saving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> ยืนยันผลการประเมินทั้งหมด</>}
//                             </button>
//                         )}
//                     </div>
//                 </div>
//             )}
//         </div>
//     )
// }
