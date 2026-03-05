

//ver00 — Admin version
"use client"
import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
    ChevronLeft, User, Users, Search, GraduationCap, FileText, X,
    Download, MapPin, Phone, ListChecks, BookOpen, ChevronRight, FileSpreadsheet, Clock, ChevronDown,
    CalendarDays, Filter, CheckCircle
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import XLSX from 'xlsx-js-style'
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Swal from 'sweetalert2'
import AdminLayout from '@/components/AdminLayout'
import { Suspense } from 'react'

function AdminEvaluationContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const subjectId = searchParams.get('id') || ''


    const [loading, setLoading] = useState(true)
    const [isFirstLoad, setIsFirstLoad] = useState(true)
    const [isTabLoading, setIsTabLoading] = useState(false)
    const [subjects, setSubjects] = useState<any[]>([])
    const [data, setData] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    // Pagination & Batch Filter
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)
    const [selectedBatch, setSelectedBatch] = useState('all')

    // 🔒 Year Filter
    const [selectedTrainingYear, setSelectedTrainingYear] = useState<string>('')
    const [trainingYearOptions, setTrainingYearOptions] = useState<string[]>([])

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'summary' | 'details'>('summary')
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [activeDetailTab, setActiveDetailTab] = useState(0)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [selectedSupervisorIdx, setSelectedSupervisorIdx] = useState(0)



    const handleFilterChange = (id: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('id', id);
        router.push(`/admin/evaluations?${params.toString()}`);
    };



    const debounceTimer = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const fetchData = async (isSilent = false) => {
            if (!isSilent) {
                if (isFirstLoad) {
                    setLoading(true)
                } else {
                    setIsTabLoading(true)
                }
            }

            const yearParam = selectedTrainingYear ? `&selectedTrainingYear=${encodeURIComponent(selectedTrainingYear)}` : ''
            const subjectParam = subjectId ? `subjectId=${encodeURIComponent(subjectId)}` : ''

            try {
                const res = await fetch(`/api/admin/evaluations?${subjectParam}${yearParam}`)
                const result = await res.json()

                if (!result.success) {
                    setLoading(false)
                    setIsTabLoading(false)
                    return
                }

                const d = result.data
                if (!selectedTrainingYear && d.defaultYear) {
                    setSelectedTrainingYear(d.defaultYear)
                    // Don't set isFirstLoad to false yet, wait for the actual data fetch with year
                    return
                }

                setTrainingYearOptions(d.trainingYearOptions || [])
                setSubjects(d.subjects || [])

                if (!subjectId && d.effectiveSubjectId) {
                    handleFilterChange(d.effectiveSubjectId)
                    return
                }

                setData(d.data || [])
                setIsFirstLoad(false)
            } catch (error) {
                console.error("Fetch data error:", error)
            } finally {
                if (!isSilent) {
                    setLoading(false)
                    setIsTabLoading(false)
                }
            }
        }
        fetchData()

        // Realtime subscription — อัปเดตเมื่อพี่เลี้ยงส่งผลประเมิน
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        const handleRealtime = () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
            debounceTimer.current = setTimeout(() => {
                fetchData(true) // Silent update
            }, 1500) // Debounce 1.5s
        }

        const channel = supabase
            .channel('teacher_subjects_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluation_logs' }, handleRealtime)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assignment_supervisors' }, handleRealtime)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'evaluation_answers' }, handleRealtime)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        }
    }, [subjectId, selectedTrainingYear])

    // ฟังก์ชันเปิด Modal รายละเอียด พร้อมดึงข้อคำถามจริง
    // const openDetailModal = async (student: any) => {
    //     setSelectedStudent(student);
    //     setModalMode('details');
    //     setIsModalOpen(true);
    //     setActiveDetailTab(0);
    //     setLoadingDetail(true);

    //     // 🚩 ดึง Question Text ตาม Group ที่นักศึกษามีคะแนนประเมิน
    //     const groupIds = student.evaluations.map((e: any) => e.groupId);
    //     const { data: questions } = await supabase
    //         .from('evaluation_items')
    //         .select('id, question_text, order_index, group_id')
    //         .in('group_id', groupIds);

    //     const updated = { ...student };
    //     updated.evaluations = updated.evaluations.map((ev: any) => {
    //         // ดึงจำนวนข้อในกลุ่มนี้เพื่อนับ Max Score
    //         const groupQuestions = questions?.filter(q => q.group_id === ev.groupId) || [];
    //         const maxScore = groupQuestions.length * 5 || 40;

    //         return {
    //             ...ev,
    //             maxScore: maxScore,
    //             detailedAnswers: ev.answers.map((ans: any) => ({
    //                 ...ans,
    //                 question: questions?.find(q => q.id === ans.item_id)
    //             })).sort((a: any, b: any) => (a.question?.item_no || 0) - (b.question?.item_no || 0))
    //         };
    //     });

    //     setSelectedStudent(updated);
    //     setLoadingDetail(false);
    // };


    const openDetailModal = async (student: any) => {
        setSelectedStudent(student);
        setModalMode('details');
        setIsModalOpen(true);
        setActiveDetailTab(0);
        setSelectedSupervisorIdx(0);
        setLoadingDetail(true);

        // รวม groupIds จากทุก supervisor
        const allGroupIds = new Set<string>();
        student.evaluations.forEach((e: any) => allGroupIds.add(e.groupId));
        student.supervisorEvaluations?.forEach((sv: any) => {
            sv.evaluations.forEach((e: any) => allGroupIds.add(e.groupId));
        });
        const groupIds = Array.from(allGroupIds);

        // ดึง questions ผ่าน API
        const res = await fetch('/api/admin/evaluations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'fetch-questions', groupIds })
        })
        const result = await res.json()
        const questions = result.data?.questions || []

        // Helper: enrich evaluations with question details
        const enrichEvaluations = (evs: any[]) => evs.map((ev: any) => {
            const groupQuestions = questions.filter((q: any) => q.group_id === ev.groupId) || [];
            const maxScore = groupQuestions.length * 5 || 40;
            return {
                ...ev,
                maxScore,
                detailedAnswers: ev.answers.map((ans: any) => {
                    const qInfo = questions.find((q: any) => q.id === ans.item_id);
                    const isNoScore = ans.score === null || ans.score === undefined || ans.score === 0;
                    const displayScore = (isNoScore && qInfo?.allow_na) ? 'N/A' : (ans.score || 0);
                    return {
                        ...ans,
                        displayScore,
                        questionText: qInfo?.question_text || 'ไม่พบหัวข้อประเมิน',
                        description: qInfo?.description || '',
                        orderIndex: qInfo?.order_index || 0
                    };
                }).sort((a: any, b: any) => a.orderIndex - b.orderIndex)
            };
        });

        const updated = { ...student };
        updated.evaluations = enrichEvaluations(updated.evaluations);
        updated.supervisorEvaluations = updated.supervisorEvaluations?.map((sv: any) => ({
            ...sv,
            evaluations: enrichEvaluations(sv.evaluations)
        }));

        setSelectedStudent(updated);
        setLoadingDetail(false);
    };

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1) }, [searchTerm, selectedBatch, subjectId])

    // Derive unique batch codes from data
    const batchCodes = Array.from(new Set(
        data.map(item => (item.student?.student_code || '').substring(0, 2)).filter(Boolean)
    )).sort()

    const filteredData = data.filter(item => {
        const matchSearch = `${item.student?.first_name} ${item.student?.last_name} ${item.student?.student_code}`.toLowerCase().includes(searchTerm.toLowerCase())
        const matchBatch = selectedBatch === 'all' || (item.student?.student_code || '').startsWith(selectedBatch)
        return matchSearch && matchBatch
    })

    // Pagination helpers
    const totalPages = Math.ceil(filteredData.length / itemsPerPage)
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handleExportExcel = () => {
        const workbook = XLSX.utils.book_new();

        const evaluationSettings: { [key: string]: { short: string, color: string } } = {
            'แบบประเมินการบันทึก (เล่ม)': { short: 'เล่ม', color: 'E2F2E9' },
            'แบบประเมินฝึกประสบการณ์': { short: 'ฝึกงาน', color: 'E0E7FF' },
            'แบบประเมินบุคลิกภาพ': { short: 'บุคลิก', color: 'FEF3C7' },
            'การประเมินทักษะ': { short: 'ทักษะ', color: 'FCE7F3' }
        };

        const defaultColor = 'F3F4F6';
        const summaryColor = '105030';

        if (data.length > 0) {
            const allEvalTitles = Array.from(new Set(data.flatMap(d => d.evaluations.map((e: any) => e.title))));
            // --- เพิ่มส่วนนี้ก่อนเริ่มลูป allEvalTitles ---

            // --- ส่วนการสร้างชีทสรุปผลรวม (Summary Sheet) ---

            // 1. กำหนดตัวย่อสำหรับหัวข้อคอลัมน์
            const shortNames: { [key: string]: string } = {
                'แบบประเมินการบันทึกเล่ม': 'เล่ม',
                'แบบประเมินบุคลิกภาพ (ANC)': 'บุคลิก ANC',
                'แบบประเมินบุคลิกภาพ (LR)': 'บุคลิก LR',
                'แบบประเมินบุคลิกภาพ (PP)': 'บุคลิก PP',
                'แบบประเมินการฝึก (PP)': 'การฝึก PP',
                'แบบประเมินการฝึก (LR)': 'การฝึก LR',
                'แบบประเมินการฝึก (ANC)': 'การฝึก ANC' // เพิ่มเผื่อไว้ให้ครบ
            };

            const summaryData = data.map(item => {
                const row: any = {
                    'รหัสนักศึกษา': item.student?.student_code,
                    'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
                    'สถานที่ฝึก': item.place?.site_name || '-',
                };

                let totalNetScore = 0;

                item.evaluations.forEach((evalItem: any) => {
                    // ใช้ชื่อย่อที่กำหนดไว้ ถ้าไม่มีให้ตัดคำว่า "แบบประเมิน" ออก
                    const shortName = shortNames[evalItem.title] || evalItem.title.replace('แบบประเมินการ', '').trim();

                    const maxScore = (evalItem.answers?.length || 0) * 5;
                    const netScore = evalItem.rawScore ? (evalItem.rawScore / maxScore) * (evalItem.weight * 100) : 0;

                    row[shortName] = netScore !== 0 ? netScore.toFixed(2) : '-';
                    totalNetScore += netScore;
                });

                row['รวมสุทธิ (100)'] = totalNetScore.toFixed(2);
                row['สถานะ (>50)'] = totalNetScore >= 50 ? 'ผ่าน' : 'รอประเมิน'; // หรือเงื่อนไขอื่นๆ

                return row;
            });

            const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);

            // 2. ปรับความกว้างคอลัมน์ (Column Widths)
            // wch คือจำนวนตัวอักษรโดยประมาณ
            summaryWorksheet['!cols'] = [
                { wch: 12 }, // รหัสนักศึกษา
                { wch: 30 }, // ชื่อ-นามสกุล
                { wch: 40 }, // สถานที่ฝึก
                { wch: 20 }, // เล่ม
                { wch: 15 }, // บุคลิก ANC
                { wch: 15 }, // บุคลิก LR
                { wch: 15 }, // บุคลิก PP
                { wch: 15 }, // การฝึก PP
                { wch: 15 }, // การฝึก LR
                { wch: 20 }, // รวมสุทธิ
                { wch: 20 }, // สถานะ
            ];

            // 3. ตกแต่ง Header ให้สวยงาม (สีเขียวเข้ม ตัวอักษรขาว)
            const range = XLSX.utils.decode_range(summaryWorksheet['!ref'] || 'A1');
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const addr = XLSX.utils.encode_cell({ r: 0, c: C });
                if (!summaryWorksheet[addr]) continue;
                summaryWorksheet[addr].s = {
                    fill: { fgColor: { rgb: "105030" } },
                    font: { color: { rgb: "FFFFFF" }, bold: true },
                    alignment: { horizontal: "center", vertical: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } }
                    }
                };
            }

            XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "สรุปผลคะแนนรวม");

            // --- จากนั้นค่อยตามด้วยลูป allEvalTitles เดิมของคุณ ---
            allEvalTitles.forEach(title => {
                const config = evaluationSettings[title] || { short: title.replace('แบบประเมิน', '').trim(), color: defaultColor };
                const sheetData: any[] = [];

                // data.forEach(item => {
                //     const isMulti = item.mentorCount > 1;

                //     if (isMulti && item.supervisorEvaluations) {
                //         // 🆕 แยกแถวรายพี่เลี้ยง
                //         item.supervisorEvaluations.forEach((sv: any) => {
                //             const svEval = sv.evaluations.find((e: any) => e.title === title);
                //             const row: any = {
                //                 'รหัสประจำตัว': item.student?.student_code,
                //                 'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
                //             };
                //             if (svEval) {
                //                 svEval.answers.forEach((ans: any, idx: number) => {
                //                     row[`ข้อที่ ${idx + 1}`] = ans.score || 'N/A';
                //                 });
                //                 const maxCur = (svEval.answers?.length || 0) * 5;
                //                 row[`รวม ${config.short} (ดิบ/เต็ม)`] = `${svEval.rawScore}/${maxCur}`;
                //                 row[`สุทธิหมวดนี้ (${(svEval.weight * 100)}%)`] = svEval.rawScore ? ((svEval.rawScore / maxCur) * (svEval.weight * 100)).toFixed(2) : 'N/A';
                //                 row['ข้อเสนอแนะ'] = svEval.comment || '-';
                //             }
                //             row['ผู้ประเมิน'] = sv.supervisorName;
                //             row['_rowType'] = 'mentor'; // marker สำหรับไฮไลท์
                //             sheetData.push(row);
                //         });

                //         // 🆕 แถวเฉลี่ย
                //         const avgEval = item.evaluations.find((e: any) => e.title === title);
                //         const avgRow: any = {
                //             'รหัสประจำตัว': item.student?.student_code,
                //             'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
                //         };
                //         if (avgEval) {
                //             avgEval.answers.forEach((ans: any, idx: number) => {
                //                 avgRow[`ข้อที่ ${idx + 1}`] = ans.score || 'N/A';
                //             });
                //             const maxCur = (avgEval.answers?.length || 0) * 5;
                //             avgRow[`รวม ${config.short} (ดิบ/เต็ม)`] = `${avgEval.rawScore}/${maxCur}`;
                //             avgRow[`สุทธิหมวดนี้ (${(avgEval.weight * 100)}%)`] = avgEval.rawScore ? ((avgEval.rawScore / maxCur) * (avgEval.weight * 100)).toFixed(2) : 'N/A';
                //             avgRow['ข้อเสนอแนะ'] = avgEval.comment || '-';
                //         }
                //         avgRow['ผู้ประเมิน'] = `⭐ เฉลี่ย (${item.mentorCount} คน)`;
                //         avgRow['_rowType'] = 'average'; // marker สำหรับไฮไลท์
                //         sheetData.push(avgRow);

                //     } else {
                //         // พี่เลี้ยงคนเดียว — แสดงเหมือนเดิม
                //         const currentEval = item.evaluations.find((e: any) => e.title === title);
                //         const row: any = {
                //             'รหัสประจำตัว': item.student?.student_code,
                //             'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
                //         };
                //         if (currentEval) {
                //             currentEval.answers.forEach((ans: any, idx: number) => {
                //                 row[`ข้อที่ ${idx + 1}`] = ans.score || 'N/A';
                //             });
                //             const maxCur = (currentEval.answers?.length || 0) * 5;
                //             row[`รวม ${config.short} (ดิบ/เต็ม)`] = currentEval.rawScore !== null ? `${currentEval.rawScore}/${maxCur}` : 'N/A';
                //             row[`สุทธิหมวดนี้ (${(currentEval.weight * 100)}%)`] = currentEval.rawScore ? ((currentEval.rawScore / maxCur) * (currentEval.weight * 100)).toFixed(2) : 'N/A';
                //             row['ข้อเสนอแนะ'] = currentEval?.comment || '-';
                //         }
                //         row['ผู้ประเมิน'] = item.supervisorEvaluations?.[0]?.supervisorName || '-';
                //         sheetData.push(row);
                //     }
                // });

                // ภายใน allEvalTitles.forEach และ data.forEach
                data.forEach(item => {
                    // 1. หาว่าใน "แบบประเมินหัวข้อนี้" มีพี่เลี้ยงประเมินมากี่คน
                    const relevantEvals = item.supervisorEvaluations?.filter((sv: any) =>
                        sv.evaluations.some((e: any) => e.title === title && e.rawScore !== null)
                    ) || [];

                    const hasMultipleEvaluators = relevantEvals.length > 1;

                    // 2. ถ้ามีคนประเมินมากกว่า 1 คน ให้แยกแถวรายคน + แถวเฉลี่ย
                    if (hasMultipleEvaluators) {
                        // --- 🆕 ส่วนแสดงแถวรายพี่เลี้ยง (เฉพาะคนที่มีคะแนน) ---
                        relevantEvals.forEach((sv: any) => {
                            const svEval = sv.evaluations.find((e: any) => e.title === title);
                            const row: any = {
                                'รหัสประจำตัว': item.student?.student_code,
                                'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
                                'สถานที่ฝึก': item.place?.site_name || '-',
                            };
                            if (svEval) {
                                svEval.answers.forEach((ans: any, idx: number) => {
                                    row[`ข้อที่ ${idx + 1}`] = ans.score || 'N/A';
                                });
                                const maxCur = (svEval.answers?.length || 0) * 5;
                                row[`รวม ${config.short} (ดิบ/เต็ม)`] = `${svEval.rawScore}/${maxCur}`;
                                row[`สุทธิหมวดนี้ (${(svEval.weight * 100)}%)`] = svEval.rawScore ? ((svEval.rawScore / maxCur) * (svEval.weight * 100)).toFixed(2) : 'N/A';
                                row['ข้อเสนอแนะ'] = svEval.comment || '-';
                            }
                            row['ผู้ประเมิน'] = sv.supervisorName;
                            row['_rowType'] = 'mentor';
                            sheetData.push(row);
                        });

                        // --- 🆕 ส่วนแสดงแถวเฉลี่ย (เฉพาะเมื่อมี 2 คนขึ้นไปประเมินใบนี้) ---
                        const avgEval = item.evaluations.find((e: any) => e.title === title);
                        const avgRow: any = {
                            'รหัสประจำตัว': item.student?.student_code,
                            'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
                            'สถานที่ฝึก': item.place?.site_name || '-',

                        };
                        if (avgEval) {
                            avgEval.answers.forEach((ans: any, idx: number) => {
                                avgRow[`ข้อที่ ${idx + 1}`] = ans.score || 'N/A';
                            });
                            const maxCur = (avgEval.answers?.length || 0) * 5;
                            avgRow[`รวม ${config.short} (ดิบ/เต็ม)`] = `${avgEval.rawScore}/${maxCur}`;
                            avgRow[`สุทธิหมวดนี้ (${(avgEval.weight * 100)}%)`] = avgEval.rawScore ? ((avgEval.rawScore / maxCur) * (avgEval.weight * 100)).toFixed(2) : 'N/A';
                            avgRow['ข้อเสนอแนะ'] = avgEval.comment || '-';
                        }
                        avgRow['ผู้ประเมิน'] = `⭐ เฉลี่ย (${relevantEvals.length} คน)`;
                        avgRow['_rowType'] = 'average';
                        sheetData.push(avgRow);

                    } else {
                        // --- กรณีประเมินคนเดียว หรือ ไม่มีใครประเมินเลยในใบนี้ ---
                        const currentEval = item.evaluations.find((e: any) => e.title === title);
                        const row: any = {
                            'รหัสประจำตัว': item.student?.student_code,
                            'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
                            'สถานที่ฝึก': item.place?.site_name || '-',

                        };
                        // console.log('Current Item:', item)
                        if (currentEval) {
                            currentEval.answers.forEach((ans: any, idx: number) => {
                                row[`ข้อที่ ${idx + 1}`] = ans.score || 'N/A';
                            });
                            const maxCur = (currentEval.answers?.length || 0) * 5;
                            row[`รวม ${config.short} (ดิบ/เต็ม)`] = currentEval.rawScore !== null ? `${currentEval.rawScore}/${maxCur}` : 'N/A';
                            row[`สุทธิหมวดนี้ (${(currentEval.weight * 100)}%)`] = currentEval.rawScore ? ((currentEval.rawScore / maxCur) * (currentEval.weight * 100)).toFixed(2) : 'N/A';
                            row['ข้อเสนอแนะ'] = currentEval?.comment || '-';
                        }
                        // แสดงชื่อผู้ประเมินคนแรกที่เจอ (ถ้ามี)
                        row['ผู้ประเมิน'] = relevantEvals[0]?.supervisorName || '-';
                        sheetData.push(row);
                    }
                });

                // ลบ _rowType ก่อนสร้าง sheet แต่เก็บไว้ใช้ highlight
                const rowTypes = sheetData.map(r => r._rowType || 'normal');
                sheetData.forEach(r => delete r._rowType);

                const worksheet = XLSX.utils.json_to_sheet(sheetData);
                applyStyles(worksheet, evaluationSettings, defaultColor, summaryColor, 'detail');

                // 🆕 Highlight แถวพี่เลี้ยงและเฉลี่ย
                const wsRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
                rowTypes.forEach((type, rowIdx) => {
                    if (type === 'normal') return;
                    const bgColor = type === 'average' ? 'E8F5E9' : 'FFF8E1'; // เขียวอ่อน = เฉลี่ย, เหลืองอ่อน = พี่เลี้ยง
                    const fontWeight = type === 'average';
                    for (let C = wsRange.s.c; C <= wsRange.e.c; ++C) {
                        const addr = XLSX.utils.encode_cell({ r: rowIdx + 1, c: C }); // +1 เพราะ header อยู่แถว 0
                        if (!worksheet[addr]) worksheet[addr] = { v: '', t: 's' };
                        worksheet[addr].s = {
                            ...(worksheet[addr].s || {}),
                            fill: { fgColor: { rgb: bgColor } },
                            font: { bold: fontWeight, color: { rgb: type === 'average' ? '1B5E20' : '000000' } }
                        };
                    }
                });

                XLSX.utils.book_append_sheet(workbook, worksheet, config.short.substring(0, 31));
            });
        }

        const fileName = data.length > 0 ? data[0].subjectName : 'สรุปผลรวม';
        XLSX.writeFile(workbook, `Report_${fileName}_${new Date().toLocaleDateString()}.xlsx`);
    };

    // 🚩 ปรับฟังก์ชันใส่สีและขนาดคอลัมน์
    const applyStyles = (worksheet: any, settings: any, defColor: string, sumColor: string, mode: 'summary' | 'detail') => {
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const colWidths = [];

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!worksheet[address]) continue;

            const header = worksheet[address].v;
            let bgColor = defColor;
            let fontColor = '000000';

            // 🚩 ปรับขนาดคอลัมน์ตามประเภทข้อมูล
            if (header.includes('ข้อที่')) {
                colWidths.push({ wch: 8 }); // ปรับจาก 6 เป็น 8 หรือมากกว่าเพื่อให้ดูไม่เบียด
            } else if (header.includes('ชื่อ-นามสกุล')) {
                colWidths.push({ wch: 40 }); // ปรับจาก 30 เป็น 35
            } else if (header.includes('สถานที่ฝึก') || header.includes('ข้อเสนอแนะ')) {
                colWidths.push({ wch: 50 }); // ปรับจาก 45 เป็น 50 เพื่อให้เห็นชื่อหน่วยงานชัดๆ
            } else if (header.includes('รวม') || header.includes('สุทธิ') || header.includes('เปอร์เซ็นต์')) {
                colWidths.push({ wch: 25 }); // 💡 เพิ่มส่วนนี้: ปรับคอลัมน์คะแนนรวม/สุทธิให้กว้างขึ้นเป็น 25
            } else {
                colWidths.push({ wch: 20 }); // คอลัมน์ทั่วไปปรับจาก 15 เป็น 20
            }

            Object.values(settings).forEach((conf: any) => {
                if (header.includes(conf.short)) bgColor = conf.color;
            });

            if (header.includes('รวม') || header.includes('สุทธิ') || header.includes('เปอร์เซ็นต์')) {
                bgColor = sumColor;
                fontColor = 'FFFFFF';
            }

            worksheet[address].s = {
                fill: { fgColor: { rgb: bgColor } },
                font: { bold: true, color: { rgb: fontColor } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
        worksheet['!cols'] = colWidths;
    };

    const handleDownloadPDF = async () => {
        // 🚩 โหลดเฉพาะฟอนต์ตัวหนาจาก Local ตามความต้องการ
        const fontBoldPath = "/fonts/THSarabunNew-Bold.ttf";

        try {
            const boldRes = await fetch(fontBoldPath);
            if (!boldRes.ok) throw new Error("ไม่พบไฟล์ฟอนต์ THSarabunNew-Bold.ttf ใน public/fonts/");

            const boldBuffer = await boldRes.arrayBuffer();
            const boldBase64 = btoa(new Uint8Array(boldBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

            const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', putOnlyUsedFonts: true });

            // ลงทะเบียนฟอนต์ตัวหนาเพียงอย่างเดียว
            doc.addFileToVFS("ThaiFont-Bold.ttf", boldBase64);
            doc.addFont("ThaiFont-Bold.ttf", "ThaiFont", "bold");
            doc.setFont("ThaiFont", "bold"); // ตั้งค่าเริ่มต้นเป็นตัวหนาทั้งเอกสาร

            // --- 🔵 ส่วนหัวรายงาน (Header) ---
            doc.setFontSize(20);
            const mainTitle = modalMode === 'summary' ? "รายงานสรุปผลการประเมินภาพรวม" : "รายงานรายละเอียดผลการประเมิน";
            doc.text(mainTitle, 105, 18, { align: 'center' });

            doc.setFontSize(13);
            const startX = 15;
            const col2X = 110;

            // แสดงข้อมูลส่วนตัว: ชื่อ, รหัส, วิชา, เบอร์โทร, สถานที่, จังหวัด
            doc.text(`ชื่อ-นามสกุล: ${selectedStudent.student?.first_name} ${selectedStudent.student?.last_name}`, startX, 30);
            doc.text(`รหัสนักศึกษา: ${selectedStudent.student?.student_code}`, col2X, 30);

            doc.text(`วิชา: ${selectedStudent.subjectName}`, startX, 38);
            doc.text(`เบอร์โทรศัพท์: ${selectedStudent.student?.phone || '-'}`, col2X, 38);

            doc.text(`สถานที่ฝึกงาน: ${selectedStudent.place?.site_name || '-'}`, startX, 46);
            doc.text(`จังหวัด: ${selectedStudent.place?.province || '-'}`, col2X, 46);

            // ชื่อผู้ประเมิน
            const isMultiPdf = selectedStudent.mentorCount > 1;
            const evaluatorName = isMultiPdf
                ? selectedStudent.supervisorEvaluations[selectedSupervisorIdx]?.supervisorName || '-'
                : selectedStudent.supervisorEvaluations?.[0]?.supervisorName || '-';
            doc.text(`ผู้ประเมิน: ${evaluatorName}`, startX, 54);

            doc.line(15, 58, 195, 58);

            let currentY = 66;

            if (modalMode === 'summary') {
                // --- 🔵 1. รายงานสรุปภาพรวม ---
                let totalNetScore = 0;
                const summaryBody = selectedStudent.evaluations.map((ev: any) => {
                    const max = (ev.answers?.length || 0) * 5;
                    const percent = ev.rawScore ? ((ev.rawScore / max) * 100).toFixed(2) : '0.00';
                    const net = ev.rawScore ? ((ev.rawScore / max) * (ev.weight * 100)) : 0;
                    totalNetScore += net;
                    return [ev.title, `${ev.rawScore}/${max}`, `${percent}%`, `${(ev.weight * 100).toFixed(0)}%`, `${net.toFixed(2)}%`];
                });

                autoTable(doc, {
                    startY: currentY,
                    head: [['หัวข้อการประเมิน', 'คะแนนดิบ', 'คิดเป็น %', 'น้ำหนัก', 'สุทธิ']],
                    body: summaryBody,
                    styles: { font: 'ThaiFont', fontStyle: 'bold', fontSize: 12 }, // บังคับตัวหนาทุกช่อง
                    headStyles: { fillColor: [16, 80, 48], font: 'ThaiFont', fontStyle: 'bold', halign: 'center', fontSize: 13 },
                    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
                    margin: { left: 15, right: 15 }
                });

                const finalY = (doc as any).lastAutoTable.finalY || 100;
                doc.setFontSize(15);
                doc.text(`คะแนนรวมสุทธิทั้งสิ้น: ${totalNetScore.toFixed(2)}%`, 105, finalY + 15, { align: 'center' });

            } else {
                // --- 🟢 2. รายงานรายละเอียดรายข้อ (ใช้ข้อมูลจาก supervisor ที่เลือก) ---
                const isMultiDetail = selectedStudent.mentorCount > 1;
                const pdfEvaluations = isMultiDetail
                    ? selectedStudent.supervisorEvaluations[selectedSupervisorIdx]?.evaluations || []
                    : selectedStudent.evaluations;
                pdfEvaluations.forEach((evalGroup: any, index: number) => {
                    if (index > 0) { doc.addPage(); currentY = 20; }

                    const max = (evalGroup.answers?.length || 0) * 5;
                    const percent = evalGroup.rawScore ? ((evalGroup.rawScore / max) * 100).toFixed(2) : '0.00';
                    const weightVal = (evalGroup.weight * 100).toFixed(0);
                    const net = evalGroup.rawScore ? ((evalGroup.rawScore / max) * (evalGroup.weight * 100)).toFixed(2) : '0.00';

                    doc.setFontSize(15);
                    doc.text(`${index + 1}. ${evalGroup.title}`, 15, currentY);

                    // สรุปคะแนนหมวด: เพิ่ม "น้ำหนัก" เข้าไปตามที่ขอ
                    doc.setFontSize(12);
                    doc.text(`คะแนนดิบ: ${evalGroup.rawScore}/${max}  |  คิดเป็น: ${percent}%  |  น้ำหนัก: ${weightVal}%  |  คะแนนสุทธิในหมวดนี้: ${net}%`, 15, currentY + 8);

                    const tableBody = evalGroup.detailedAnswers.map((ans: any, i: number) => [
                        i + 1,
                        // คำอธิบายไม่ต้องใส่วงเล็บ และขึ้นบรรทัดใหม่
                        ans.description ? `${ans.questionText}\n${ans.description}` : ans.questionText,
                        ans.displayScore
                    ]);

                    autoTable(doc, {
                        startY: currentY + 14,
                        head: [['ข้อ', 'หัวข้อการประเมิน / คำอธิบาย', 'คะแนน']],
                        body: tableBody,
                        styles: { font: 'ThaiFont', fontStyle: 'bold', fontSize: 11, overflow: 'linebreak' },
                        headStyles: { fillColor: [16, 80, 48], font: 'ThaiFont', fontStyle: 'bold', halign: 'center', fontSize: 12 },
                        columnStyles: { 0: { cellWidth: 12, halign: 'center' }, 2: { cellWidth: 20, halign: 'center' } },
                        margin: { left: 15, right: 15 },
                        didDrawPage: (data) => { currentY = data.cursor?.y || 20; }
                    });

                    const finalY = (doc as any).lastAutoTable.finalY || currentY;
                    doc.text(`ข้อเสนอแนะ: ${evalGroup.comment || "-"}`, 15, finalY + 12, { maxWidth: 180 });
                    currentY = finalY + 28;
                });
            }

            doc.save(`Official_Report_${selectedStudent.student?.student_code}_${modalMode}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("กรุณาตรวจสอบว่ามีไฟล์ THSarabunNew-Bold.ttf ใน public/fonts/");
        }
    };




    if (loading) return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto pb-20 px-4 animate-pulse">
                {/* Header skeleton */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                    <div>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-200 rounded-2xl" />
                            <div className="h-10 w-64 bg-slate-200 rounded-2xl" />
                        </div>
                        <div className="h-3 w-48 bg-slate-100 rounded mt-4 ml-1" />
                    </div>
                </div>

                {/* Subject pills skeleton */}
                <div className="flex gap-2 pb-4 mb-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-28 h-10 bg-slate-200 rounded-2xl" />
                    ))}
                </div>

                {/* Filter bar skeleton */}
                <div className="bg-white/50 p-4 rounded-[2.5rem] border border-slate-100 mb-8">
                    <div className="flex flex-col xl:flex-row items-center gap-4">
                        <div className="w-48 h-14 bg-slate-100 rounded-[1.5rem]" />
                        <div className="w-64 h-14 bg-slate-100 rounded-[1.5rem]" />
                        <div className="flex-1 h-14 bg-slate-100 rounded-[1.5rem] w-full" />
                        <div className="w-40 h-14 bg-emerald-100 rounded-[1.5rem]" />
                    </div>
                </div>

                {/* Table skeleton */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="h-16 bg-slate-50/50 border-b border-slate-100" />
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex items-center gap-6 px-6 py-5 border-b border-slate-50">
                            <div className="w-8 h-4 bg-slate-100 rounded" />
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                                <div className="space-y-2">
                                    <div className="h-4 w-36 bg-slate-100 rounded" />
                                    <div className="h-2 w-20 bg-slate-50 rounded" />
                                </div>
                            </div>
                            <div className="h-6 w-32 bg-blue-50 rounded-lg hidden md:block" />
                            <div className="h-4 w-24 bg-slate-100 rounded hidden lg:block" />
                            <div className="h-8 w-16 bg-slate-100 rounded-lg" />
                            <div className="h-8 w-8 bg-slate-100 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )

    return (
        <>
            <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans text-slate-900">
                {/* Admin-style Header */}
                <div className="max-w-7xl mx-auto pb-20 px-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                                <GraduationCap size={28} className="text-blue-600" />
                                <span>ผลการประเมิน <span className="text-blue-600">ทุกรายวิชา</span></span>
                            </h1>
                            <p className="text-slate-400 font-bold mt-2 ml-1 text-[11px] uppercase tracking-[0.2em]">ผลการประเมินทุกรายวิชา (Admin) — Weighted Summary</p>
                        </div>
                    </div>

                    {/* Subject pills */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 mb-6">
                        {subjects.reduce((acc: any[], s: any) => {
                            if (!acc.find((u: any) => u.subject_id === s.subject_id)) acc.push(s);
                            return acc;
                        }, []).map((s: any, i: number) => (
                            <button key={i} onClick={() => handleFilterChange(s.subject_id)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black border transition-all shrink-0 ${String(subjectId) === String(s.subject_id) ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'}`}>{s.subjects.name}</button>
                        ))}
                    </div>

                    {/* Filter Bar — admin style */}
                    <div className="bg-white/50 backdrop-blur-md p-4 rounded-[2.5rem] border border-slate-100 shadow-sm mb-8">
                        <div className="flex flex-col xl:flex-row items-center gap-4">
                            {/* 🔒 Training Year Filter */}
                            <div className="flex items-center gap-2 bg-white px-4 h-14 rounded-[1.5rem] border-2 border-slate-50 shadow-sm shrink-0">
                                <CalendarDays size={16} className="text-blue-500" />
                                <select
                                    value={selectedTrainingYear}
                                    onChange={(e) => { setSelectedTrainingYear(e.target.value); setSelectedBatch('all'); }}
                                    className="text-sm font-black text-blue-600 bg-transparent outline-none cursor-pointer"
                                >
                                    <option value="">ปีการศึกษาทั้งหมด</option>
                                    {trainingYearOptions.map(year => (
                                        <option key={year} value={year}>ปีการศึกษา {year}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Batch (2-digit code) Filter */}
                            <div className="relative w-full xl:w-64 shrink-0">
                                <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={selectedBatch}
                                    onChange={(e) => setSelectedBatch(e.target.value)}
                                    className="w-full h-14 pl-14 pr-10 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm focus:border-indigo-500 focus:ring-0 outline-none appearance-none cursor-pointer text-slate-700 transition-all"
                                >
                                    <option value="all">ทุกรุ่นรหัส</option>
                                    {batchCodes.map(code => (
                                        <option key={code} value={code}>รหัส {code}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                            </div>
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..." className="w-full h-14 pl-14 pr-6 rounded-[1.5rem] border-2 border-slate-50 bg-white font-bold text-sm focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-slate-300" onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <button onClick={handleExportExcel} className="h-14 px-6 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all shrink-0">
                                <FileSpreadsheet size={18} />
                                <span className="hidden sm:inline">EXPORT EXCEL</span>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center w-14">#</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">นักศึกษา</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">รายวิชา</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">สถานที่ฝึก</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">คะแนนสุทธิ</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">สถานะ</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isTabLoading ? (
                                        /* Table Skeleton while switching tabs */
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={`skeleton-${i}`} className="animate-pulse">
                                                <td className="px-6 py-5.5 text-center"><div className="w-4 h-4 bg-slate-100 rounded mx-auto" /></td>
                                                <td className="px-6 py-5.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                                                        <div className="space-y-2">
                                                            <div className="h-4 w-32 bg-slate-100 rounded" />
                                                            <div className="h-2 w-20 bg-slate-50 rounded" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5.5"><div className="h-6 w-24 bg-indigo-50 rounded-lg" /></td>
                                                <td className="px-6 py-5.5">
                                                    <div className="space-y-2">
                                                        <div className="h-4 w-28 bg-slate-100 rounded" />
                                                        <div className="h-2 w-16 bg-slate-50 rounded" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5.5 text-center"><div className="h-6 w-12 bg-indigo-50 rounded mx-auto" /></td>
                                                <td className="px-6 py-5.5 text-center"><div className="h-6 w-20 bg-emerald-50 rounded-full mx-auto" /></td>
                                                <td className="px-6 py-5.5 text-center"><div className="h-8 w-20 bg-slate-100 rounded-xl mx-auto" /></td>
                                            </tr>
                                        ))
                                    ) : (
                                        paginatedData.map((item, idx) => {
                                            const totalNet = item.evaluations.reduce((acc: number, ev: any) => {
                                                const max = (ev.answers?.length || 8) * 5;
                                                return acc + (ev.rawScore / max * (ev.weight * 100));
                                            }, 0).toFixed(2);
                                            const isMultiMentor = item.mentorCount > 1;
                                            const rowNum = (currentPage - 1) * itemsPerPage + idx + 1;

                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/40 transition-colors group">
                                                    <td className="px-6 py-4 text-center text-sm font-bold text-slate-300">{rowNum}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden border border-white shadow-sm shrink-0">
                                                                {item.student?.avatar_url ? <img src={item.student.avatar_url} className="w-full h-full object-cover" /> : <User size={16} className="m-auto mt-2.5 text-slate-300" />}
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-slate-800 text-sm leading-tight">{item.student?.first_name} {item.student?.last_name}</div>
                                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">รหัส {item.student?.student_code}</div>
                                                                {isMultiMentor && (
                                                                    <div className="text-[9px] font-black text-violet-500 mt-0.5 flex items-center gap-1"><Users size={10} />พี่เลี้ยง {item.mentorCount} คนประเมิน</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black border border-indigo-100/50">{item.subjectName}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-slate-700 leading-tight">{item.place?.site_name || 'ไม่ระบุ'}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 mt-0.5">{item.place?.province || ''}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="text-lg font-black text-indigo-600">{totalNet}</span>
                                                        {isMultiMentor && <p className="text-[8px] font-black text-slate-300 uppercase">AVG</p>}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {item.evalStatus === 'done' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100">
                                                                <CheckCircle size={12} /> ครบแล้ว
                                                            </span>
                                                        ) : item.evalStatus === 'partial' ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black border border-amber-100">
                                                                <Clock size={12} /> {item.doneSupervisors}/{item.totalSupervisors}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black border border-slate-100">
                                                                <Clock size={12} /> รอประเมิน
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => { setSelectedStudent(item); setModalMode('summary'); setIsModalOpen(true); setSelectedSupervisorIdx(0); }} className="h-9 w-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="สรุปผล"><FileText size={16} /></button>
                                                            <button onClick={() => openDetailModal(item)} className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="รายละเอียด"><ListChecks size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {paginatedData.length === 0 && (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200"><Users size={32} /></div>
                                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">ไม่พบข้อมูลนักศึกษา</p>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        {filteredData.length > 0 && (
                            <div className="px-8 py-5 bg-slate-50/30 border-t flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-[2.5rem]">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">แสดงแถว:</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                        className="bg-white border-none shadow-sm rounded-xl px-3 py-1.5 text-xs font-black text-slate-600 outline-none focus:ring-2 ring-indigo-500 cursor-pointer transition-all hover:shadow-md"
                                    >
                                        {[5, 10, 20, 50].map(val => <option key={val} value={val}>{val}</option>)}
                                    </select>
                                    <p className="text-xs font-bold text-slate-400 ml-2">
                                        {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} จาก {filteredData.length} รายการ
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className="h-9 px-4 rounded-xl font-bold text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                                    >
                                        <ChevronLeft size={16} /> ก่อนหน้า
                                    </button>
                                    <div className="flex items-center gap-1">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                            if (totalPages > 7 && (page !== 1 && page !== totalPages && Math.abs(currentPage - page) > 1)) {
                                                if (page === 2 || page === totalPages - 1) return <span key={page} className="text-slate-300 text-xs px-1">...</span>;
                                                return null;
                                            }
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110' : 'text-slate-400 hover:bg-slate-100'}`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <button
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-9 px-4 rounded-xl font-bold text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                                    >
                                        ถัดไป <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal: สวยงามและครบถ้วน */}
                {isModalOpen && selectedStudent && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
                        <div className="bg-white w-full max-w-4xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl flex flex-col relative overflow-hidden animate-in slide-in-from-bottom duration-300">
                            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-20">
                                <h2 className="text-base sm:text-xl font-black text-slate-800">{modalMode === 'summary' ? 'ใบสรุปรายงานการประเมิน' : 'รายละเอียดการให้คะแนนรายข้อ'}</h2>
                                <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={24} /></button>
                            </div>

                            {/* Tabs Pills: ปรับให้สวยและแสดงครบตัวอักษร */}
                            {modalMode === 'details' && (() => {
                                const isMulti = selectedStudent.mentorCount > 1;
                                const tabEvs = isMulti
                                    ? selectedStudent.supervisorEvaluations[selectedSupervisorIdx]?.evaluations || []
                                    : selectedStudent.evaluations;
                                return (
                                    <div className="bg-slate-50/50 border-b border-slate-100">
                                        <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar scroll-smooth px-6">
                                            {tabEvs.map((ev: any, i: number) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setActiveDetailTab(i)}
                                                    className={`
                                    px-6 py-3 rounded-2xl text-[11px] font-black transition-all shrink-0 shadow-sm whitespace-nowrap
                                    ${activeDetailTab === i
                                                            ? 'bg-indigo-600 text-white shadow-indigo-200 scale-105 ring-4 ring-indigo-600/10'
                                                            : 'bg-white text-slate-400 border border-slate-200 hover:border-indigo-300 hover:text-indigo-500'
                                                        }
                                            `}
                                                    style={{ minWidth: 'max-content' }}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${activeDetailTab === i ? 'bg-white' : 'bg-slate-200'}`}></div>
                                                        {ev.title}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>


                                    </div>

                                );
                            })()}

                            <div className="flex-1 overflow-y-auto p-6 sm:p-10 no-scrollbar">
                                {loadingDetail ? (
                                    <div className="text-center py-20 opacity-30 font-black uppercase text-xs animate-pulse">กำลังโหลดรายละเอียด...</div>
                                ) : (
                                    <div id="pdf-content">

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-10 p-6 sm:p-8 bg-slate-50 rounded-[2rem] text-sm">
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ข้อมูลนักศึกษา</p>
                                                <h3 className="font-black text-slate-800 text-xl">{selectedStudent.student.first_name} {selectedStudent.student.last_name}</h3>
                                                <p className="font-bold text-slate-500">รหัสนักศึกษา : {selectedStudent.student.student_code}</p>
                                                <p className="text-xs font-bold text-slate-500 flex items-center gap-2"><Phone size={12} /> {selectedStudent.student.phone || '-'}</p>
                                                <p className="text-xs font-bold text-violet-600 flex items-center gap-2 mt-1"><Users size={12} /> ผู้ประเมิน: {selectedStudent.supervisorEvaluations?.map((sv: any) => sv.supervisorName).join(', ') || '-'}</p>

                                            </div>
                                            <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-8 space-y-1.5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สถานที่ฝึกปฏิบัติงาน</p>
                                                <h3 className="font-black text-slate-800 text-base leading-tight">{selectedStudent.place?.site_name || '-'}</h3>
                                                <p className="text-sm font-bold text-slate-500">จังหวัด: {selectedStudent.place?.province || '-'}</p>
                                                <p className="text-[11px] font-bold text-indigo-500 bg-indigo-50 inline-block px-2 py-1 rounded-md uppercase">{selectedStudent.subjectName}</p>
                                            </div>
                                        </div>

                                        {modalMode === 'summary' ? (
                                            /* ตารางสรุป (Header เขียว) */
                                            <>
                                                <div className="overflow-x-auto border border-slate-100 rounded-3xl shadow-sm">
                                                    <table className="w-full border-collapse">
                                                        <thead className="bg-[#105030] text-white">
                                                            <tr>
                                                                <th className="p-5 text-left text-xs sm:text-sm font-black uppercase">หัวข้อการประเมิน</th>
                                                                <th className="p-5 text-center text-xs sm:text-sm font-black w-24 sm:w-32 uppercase">{selectedStudent.mentorCount > 1 ? 'คะแนนดิบ (เฉลี่ย)' : 'คะแนนดิบ'}</th>
                                                                <th className="p-5 text-center text-xs sm:text-sm font-black w-20 sm:w-28 uppercase">น้ำหนัก</th>
                                                                <th className="p-5 text-center text-xs sm:text-sm font-black w-24 sm:w-32 uppercase tracking-tighter    text-left ">คะแนนสุทธิ</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {selectedStudent.evaluations.map((ev: any, i: number) => {
                                                                const max = (ev.answers?.length || 8) * 5;
                                                                const net = (ev.rawScore / max * (ev.weight * 100));
                                                                return (
                                                                    <tr key={i} className="hover:bg-slate-50/50">
                                                                        <td className="p-5 font-bold text-slate-600 text-xs sm:text-sm">{ev.title}</td>
                                                                        <td className="p-5 text-center font-bold text-slate-400 text-xs sm:text-sm whitespace-nowrap">{ev.rawScore} / {max}</td>
                                                                        <td className="p-5 text-center font-bold text-slate-400 text-xs sm:text-sm whitespace-nowrap">{ev.weight * 100}%</td>
                                                                        <td className="p-5 text-center font-black text-indigo-600 text-base sm:text-lg whitespace-nowrap">{net.toFixed(2)}</td>
                                                                    </tr>
                                                                )
                                                            })}
                                                            <tr className="bg-slate-50 font-black">
                                                                <td colSpan={3} className="p-6 text-right text-[10px] text-slate-400 uppercase tracking-widest">Total Weighted Result</td>
                                                                <td className="p-6 text-right text-2xl sm:text-3xl text-indigo-700">
                                                                    {selectedStudent.evaluations.reduce((acc: any, ev: any) => {
                                                                        const max = (ev.answers?.length || 8) * 5;
                                                                        return acc + (ev.rawScore / max * (ev.weight * 100));
                                                                    }, 0).toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>

                                                {/* ข้อความบอกว่าเป็นค่าเฉลี่ย */}
                                                {selectedStudent.mentorCount > 1 && (
                                                    <p className="text-[10px] font-bold text-amber-600 text-center mt-4 bg-amber-50 py-2 px-4 rounded-xl inline-block w-full">
                                                        * คะแนนดิบข้างต้นเป็นค่าเฉลี่ยจากผู้ประเมิน {selectedStudent.mentorCount} คน
                                                    </p>
                                                )}

                                                {/* 🆕 Per-mentor breakdown (เฉพาะ 2+ พี่เลี้ยง) */}
                                                {selectedStudent.mentorCount > 1 && (
                                                    <div className="mt-8 space-y-4">
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2"><Users size={14} /> คะแนนแยกรายพี่เลี้ยง ({selectedStudent.mentorCount} คน)</p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                            {selectedStudent.supervisorEvaluations.map((sv: any, sIdx: number) => {
                                                                const svNet = sv.evaluations.reduce((acc: number, ev: any) => {
                                                                    const max = (ev.answers?.length || 8) * 5;
                                                                    return acc + (ev.rawScore / max * (ev.weight * 100));
                                                                }, 0);
                                                                return (
                                                                    <div key={sIdx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:border-violet-200 transition-all">
                                                                        <div className="flex items-center justify-between mb-3">
                                                                            <p className="font-black text-slate-700 text-sm">{sv.supervisorName}</p>
                                                                            <p className="text-lg font-black text-violet-600">{svNet.toFixed(2)}</p>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            {sv.evaluations.map((ev: any, eIdx: number) => {
                                                                                const max = (ev.answers?.length || 8) * 5;
                                                                                const net = (ev.rawScore / max * (ev.weight * 100));
                                                                                return (
                                                                                    <div key={eIdx} className="flex justify-between text-[11px] items-center">
                                                                                        <span className="text-slate-400 font-bold truncate mr-2">{ev.title}</span>
                                                                                        <span className="whitespace-nowrap">
                                                                                            <span className="font-black text-slate-600">{net.toFixed(2)}</span>
                                                                                            <span className="text-slate-300 ml-1 text-[10px]">({ev.rawScore}/{max})</span>
                                                                                        </span>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (() => {
                                            /* ตารางรายละเอียดรายข้อ — ใช้ข้อมูลจาก supervisor ที่เลือก (ถ้ามีหลายคน) */
                                            const isMulti = selectedStudent.mentorCount > 1;
                                            const activeEvs = isMulti
                                                ? selectedStudent.supervisorEvaluations[selectedSupervisorIdx]?.evaluations || []
                                                : selectedStudent.evaluations;
                                            const activeEv = activeEvs[activeDetailTab];
                                            const dynamicMaxScore = (activeEv?.answers?.length || 0) * 5;
                                            return (
                                                <div className="space-y-6">
                                                    {/* 🆕 Supervisor selector pills (เฉพาะ 2+ พี่เลี้ยง) */}
                                                    {isMulti && (
                                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                                            {selectedStudent.supervisorEvaluations.map((sv: any, sIdx: number) => (
                                                                <button key={sIdx} onClick={() => { setSelectedSupervisorIdx(sIdx); setActiveDetailTab(0); }}
                                                                    className={`px-4 py-2 rounded-xl text-[11px] font-black transition-all shrink-0 flex items-center gap-1.5 ${selectedSupervisorIdx === sIdx ? 'bg-violet-600 text-white shadow-lg' : 'bg-violet-50 text-violet-500 border border-violet-100 hover:border-violet-300'}`}>
                                                                    <User size={12} />{sv.supervisorName}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-3 border-l-4 border-indigo-600 pl-3">
                                                        <h4 className="text-sm sm:text-base font-black text-slate-800 uppercase leading-none">รายละเอียด: {activeEv?.title}</h4>
                                                        {activeEv?.evaluatedAt && (
                                                            <div className="flex items-center gap-1.5 text-indigo-500 font-bold text-[10px] bg-indigo-50 w-fit px-2 py-1 rounded-lg">
                                                                <Clock size={12} />
                                                                ประเมินเมื่อ: {new Date(activeEv.evaluatedAt).toLocaleDateString('th-TH', {
                                                                    day: '2-digit', month: 'long', year: 'numeric'
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="overflow-hidden border border-slate-100 rounded-3xl shadow-sm ">
                                                        <table className="w-full text-xs sm:text-sm">
                                                            <thead className="bg-[#186e43] text-white font-black">
                                                                <tr>
                                                                    <th className="p-4 text-center w-12">#</th>
                                                                    <th className="p-4 text-left">เกณฑ์การประเมิน</th>
                                                                    <th className="p-4 text-center w-16 sm:w-24">คะแนน</th>
                                                                </tr>
                                                            </thead>


                                                            <tbody className="divide-y divide-slate-100 bg-white font-bold text-slate-600">
                                                                {activeEv?.detailedAnswers?.map((ans: any, i: number) => (
                                                                    <tr key={i} className="hover:bg-indigo-50/20 transition-colors">
                                                                        {/* 🚩 ลำดับข้อ: ใช้ i + 1 เพื่อให้รันเลข 1, 2, 3... เสมอ */}
                                                                        <td className="p-5 text-center text-slate-300 font-black text-xl border-r border-slate-50 w-20">
                                                                            {i + 1}
                                                                        </td>

                                                                        <td className="p-5 text-left border-r border-slate-50">
                                                                            <div className="flex flex-col gap-1">
                                                                                <span className="text-slate-800 text-sm sm:text-base font-black leading-snug">
                                                                                    {ans.questionText}
                                                                                </span>
                                                                                {ans.description && (
                                                                                    <span className="text-slate-400 text-[11px] font-medium italic leading-relaxed">
                                                                                        {ans.description}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </td>

                                                                        <td className="p-5 text-center w-28">
                                                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg mx-auto shadow-sm transition-all
                                                                        ${ans.displayScore === 'N/A'
                                                                                    ? 'bg-slate-100 text-slate-400 italic'
                                                                                    : 'bg-indigo-50 text-indigo-600'
                                                                                }`}>
                                                                                {ans.displayScore}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>

                                                    </div>
                                                    <div className="mt-4 space-y-4 ">
                                                        <div className="bg-[#186e43] p-5 rounded-[2rem] text-white shadow-lg shadow-indigo-100">
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">คะแนนดิบรวมหมวดนี้</p>
                                                                    <h5 className="text-xl font-black">สรุปผลการประเมิน</h5>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span className="text-2xl font-black">{activeEv?.rawScore}</span>
                                                                    <span className="text-lg opacity-60 font-bold ml-1">/ {dynamicMaxScore}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                                <ListChecks size={14} /> ข้อเสนอแนะเพิ่มเติมจากผู้ประเมิน
                                                            </p>
                                                            <p className="text-slate-600 font-bold leading-relaxed italic whitespace-pre-wrap">
                                                                {activeEv?.comment || 'ไม่มีข้อเสนอแนะสำหรับส่วนนี้'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div className="p-6 sm:p-8 bg-white border-t border-slate-100 flex gap-3">
                                <button onClick={handleDownloadPDF} className="flex-1 bg-slate-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-xl text-xs sm:text-sm uppercase tracking-widest">
                                    <Download size={18} /> Export PDF Report
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}

export default function AdminEvaluationSummary() {
    return (
        <AdminLayout>
            <Suspense fallback={
                <div className="min-h-screen flex flex-col items-center justify-center bg-white overflow-hidden relative font-sans">
                    <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full blur-[100px]"></div>
                        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-[100px]"></div>
                    </div>
                    <div className="relative flex flex-col items-center">
                        <div className="relative w-20 h-20 mb-8">
                            <div className="absolute inset-0 rounded-full border-[3px] border-slate-100 border-t-indigo-600 animate-spin"></div>
                            <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-t-blue-400 animate-[spin_0.8s_linear_infinite]"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                            </div>
                        </div>
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-[0.3em]">กำลังโหลดข้อมูล</h2>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">กรุณารอซักครู่...</span>
                    </div>
                </div>
            }>
                <AdminEvaluationContent />
            </Suspense>
        </AdminLayout>
    )
}
