

//ver00
"use client"
import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ChevronLeft, User, Users, Search, GraduationCap, FileText, X, Download, MapPin, Phone, ListChecks, BookOpen, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import html2canvas from 'html2canvas'
import XLSX from 'xlsx-js-style'
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function EvaluationSummary() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const subjectId = searchParams.get('id') || 'all'


    const [loading, setLoading] = useState(true)
    const [subjects, setSubjects] = useState<any[]>([])
    const [data, setData] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'summary' | 'details'>('summary')
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [activeDetailTab, setActiveDetailTab] = useState(0)
    const [loadingDetail, setLoadingDetail] = useState(false)
    const [selectedSupervisorIdx, setSelectedSupervisorIdx] = useState(0)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleFilterChange = (id: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('id', id);
        router.push(`/teacher/subjects?${params.toString()}`);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            const lineId = 'test-c'
            const { data: user } = await supabase.from('supervisors').select('id').eq('line_user_id', lineId).single()

            if (user) {
                const { data: subData } = await supabase.from('supervisor_subjects').select('subject_id, subjects(name, id)').eq('supervisor_id', user.id)
                setSubjects(subData || [])

                // 🚩 Query รวม supervisor info
                let query = supabase.from('student_assignments').select(`
                    id, 
                    students (id, first_name, last_name, student_code, avatar_url, phone),
                    subjects (name),
                    training_sites (site_name, province), 
                    evaluation_logs (
                        id, total_score, comment, supervisor_id,
                        supervisors (id, full_name),
                        evaluation_groups (id, group_name, weight),
                        evaluation_answers (score, item_id)
                    )
                `)

                if (subjectId !== 'all') query = query.eq('subject_id', subjectId)
                else if (subData) query = query.in('subject_id', subData.map(s => s.subject_id))

                const { data: res } = await query
                const processed = res?.map((item: any) => {
                    const logs = item.evaluation_logs || []

                    // จัดกลุ่ม logs ตาม supervisor_id
                    const supervisorMap: { [key: string]: { supervisorId: string, supervisorName: string, logs: any[] } } = {}
                    logs.forEach((log: any) => {
                        const svId = log.supervisor_id || 'unknown'
                        if (!supervisorMap[svId]) {
                            supervisorMap[svId] = {
                                supervisorId: svId,
                                supervisorName: log.supervisors?.full_name || 'ไม่ระบุชื่อ',
                                logs: []
                            }
                        }
                        supervisorMap[svId].logs.push(log)
                    })

                    const supervisorEvaluations = Object.values(supervisorMap).map(sv => ({
                        ...sv,
                        evaluations: sv.logs.map((log: any) => ({
                            groupId: log.evaluation_groups?.id,
                            title: log.evaluation_groups?.group_name,
                            rawScore: log.total_score || 0,
                            weight: log.evaluation_groups?.weight || 1,
                            comment: log.comment || '-',
                            answers: log.evaluation_answers || []
                        }))
                    }))

                    const mentorCount = supervisorEvaluations.length

                    // คำนวณ evaluations เฉลี่ย (สำหรับ card & summary)
                    // ถ้า 1 คน ใช้ตรง ๆ / ถ้าหลายคน หาค่าเฉลี่ย
                    let evaluations: any[] = []
                    if (mentorCount === 1) {
                        evaluations = supervisorEvaluations[0].evaluations
                    } else if (mentorCount > 1) {
                        // รวม evaluations จากทุก supervisor แล้วหาค่าเฉลี่ยตาม groupId
                        const groupMap: { [groupId: string]: any[] } = {}
                        supervisorEvaluations.forEach(sv => {
                            sv.evaluations.forEach((ev: any) => {
                                if (!groupMap[ev.groupId]) groupMap[ev.groupId] = []
                                groupMap[ev.groupId].push(ev)
                            })
                        })
                        evaluations = Object.values(groupMap).map(evs => {
                            const avgRawScore = evs.reduce((sum: number, e: any) => sum + e.rawScore, 0) / evs.length
                            return {
                                groupId: evs[0].groupId,
                                title: evs[0].title,
                                rawScore: Math.round(avgRawScore * 100) / 100,
                                weight: evs[0].weight,
                                comment: evs.map((e: any) => e.comment).join(' / '),
                                answers: evs[0].answers // ใช้ answers ของคนแรกเพื่อนับจำนวนข้อ
                            }
                        })
                    }

                    return {
                        student: item.students,
                        place: item.training_sites,
                        subjectName: item.subjects?.name,
                        evaluations,
                        supervisorEvaluations,
                        mentorCount
                    }
                });
                setData(processed || [])
            }
            setLoading(false)
        }
        fetchData()
    }, [subjectId, supabase])

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

        const { data: questions } = await supabase
            .from('evaluation_items')
            .select('id, question_text, description, allow_na, order_index, group_id')
            .in('group_id', groupIds);

        // Helper: enrich evaluations with question details
        const enrichEvaluations = (evs: any[]) => evs.map((ev: any) => {
            const groupQuestions = questions?.filter(q => q.group_id === ev.groupId) || [];
            const maxScore = groupQuestions.length * 5 || 40;
            return {
                ...ev,
                maxScore,
                detailedAnswers: ev.answers.map((ans: any) => {
                    const qInfo = questions?.find(q => q.id === ans.item_id);
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

    const filteredData = data.filter(item =>
        `${item.student?.first_name} ${item.student?.last_name} ${item.student?.student_code}`.toLowerCase().includes(searchTerm.toLowerCase())
    )

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

        if (subjectId === 'all') {
            const subjectList = Array.from(new Set(data.map(d => d.subjectName)));
            subjectList.forEach(subName => {
                const studentsInSub = data.filter(d => d.subjectName === subName);
                const sheetData = studentsInSub.map(item => {
                    const row: any = {
                        'รหัสประจำตัว': item.student?.student_code,
                        'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
                        'หน่วยงาน': item.place?.site_name || 'N/A'
                    };

                    let grandRaw = 0;
                    let grandFull = 0;
                    let grandNetTotal = 0; // 🚩 สำหรับรวมคะแนนสุทธิทุกหมวด

                    item.evaluations.forEach((ev: any) => {
                        const config = evaluationSettings[ev.title] || { short: ev.title.replace('แบบประเมิน', '').trim(), color: defaultColor };
                        const max = (ev.answers?.length || 0) * 5;
                        const net = ev.rawScore ? ((ev.rawScore / max) * (ev.weight * 100)) : 0;

                        row[`${config.short} (ที่ได้/เต็ม)`] = ev.rawScore !== null ? `${ev.rawScore}/${max}` : 'N/A';
                        row[`${config.short} (น้ำหนัก)`] = `${(ev.weight * 100)}%`;
                        row[`${config.short} (สุทธิ)`] = ev.rawScore ? net.toFixed(2) : 'N/A';

                        if (ev.rawScore) {
                            grandRaw += ev.rawScore;
                            grandFull += max;
                            grandNetTotal += parseFloat(net.toFixed(2));
                        }
                    });

                    // 🚩 เพิ่มคอลัมน์รวมคะแนนสุทธิ และคะแนนดิบรวม
                    row['คะแนนรวมสุทธิ'] = grandNetTotal.toFixed(2);
                    row['คะแนนดิบรวม (ดิบ/เต็ม)'] = grandFull > 0 ? `${grandRaw}/${grandFull}` : 'N/A';
                    row['เปอร์เซ็นต์รวมสุทธิ (%)'] = grandFull > 0 ? ((grandRaw / grandFull) * 100).toFixed(2) : 'N/A';

                    // 🆕 เพิ่มคอลัมน์ชื่อผู้ประเมินและจำนวน
                    row['จำนวนผู้ประเมิน'] = item.mentorCount > 1 ? `เฉลี่ย ${item.mentorCount} คน` : '1';
                    row['ผู้ประเมิน'] = item.supervisorEvaluations?.map((sv: any) => sv.supervisorName).join(', ') || '-';

                    return row;
                });

                const worksheet = XLSX.utils.json_to_sheet(sheetData);
                applyStyles(worksheet, evaluationSettings, defaultColor, summaryColor, 'summary');
                XLSX.utils.book_append_sheet(workbook, worksheet, subName.substring(0, 31));
            });
        } else {
            if (data.length > 0) {
                const allEvalTitles = Array.from(new Set(data.flatMap(d => d.evaluations.map((e: any) => e.title))));

                allEvalTitles.forEach(title => {
                    const config = evaluationSettings[title] || { short: title.replace('แบบประเมิน', '').trim(), color: defaultColor };
                    const sheetData: any[] = [];

                    data.forEach(item => {
                        const isMulti = item.mentorCount > 1;

                        if (isMulti && item.supervisorEvaluations) {
                            // 🆕 แยกแถวรายพี่เลี้ยง
                            item.supervisorEvaluations.forEach((sv: any) => {
                                const svEval = sv.evaluations.find((e: any) => e.title === title);
                                const row: any = {
                                    'รหัสประจำตัว': item.student?.student_code,
                                    'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
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
                                row['_rowType'] = 'mentor'; // marker สำหรับไฮไลท์
                                sheetData.push(row);
                            });

                            // 🆕 แถวเฉลี่ย
                            const avgEval = item.evaluations.find((e: any) => e.title === title);
                            const avgRow: any = {
                                'รหัสประจำตัว': item.student?.student_code,
                                'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
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
                            avgRow['ผู้ประเมิน'] = `⭐ เฉลี่ย (${item.mentorCount} คน)`;
                            avgRow['_rowType'] = 'average'; // marker สำหรับไฮไลท์
                            sheetData.push(avgRow);

                        } else {
                            // พี่เลี้ยงคนเดียว — แสดงเหมือนเดิม
                            const currentEval = item.evaluations.find((e: any) => e.title === title);
                            const row: any = {
                                'รหัสประจำตัว': item.student?.student_code,
                                'ชื่อ-นามสกุล': `${item.student?.first_name} ${item.student?.last_name}`,
                            };
                            if (currentEval) {
                                currentEval.answers.forEach((ans: any, idx: number) => {
                                    row[`ข้อที่ ${idx + 1}`] = ans.score || 'N/A';
                                });
                                const maxCur = (currentEval.answers?.length || 0) * 5;
                                row[`รวม ${config.short} (ดิบ/เต็ม)`] = currentEval.rawScore !== null ? `${currentEval.rawScore}/${maxCur}` : 'N/A';
                                row[`สุทธิหมวดนี้ (${(currentEval.weight * 100)}%)`] = currentEval.rawScore ? ((currentEval.rawScore / maxCur) * (currentEval.weight * 100)).toFixed(2) : 'N/A';
                                row['ข้อเสนอแนะ'] = currentEval?.comment || '-';
                            }
                            row['ผู้ประเมิน'] = item.supervisorEvaluations?.[0]?.supervisorName || '-';
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
        }

        const fileName = subjectId !== 'all' && data.length > 0 ? data[0].subjectName : 'สรุปผลรวม';
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
                colWidths.push({ wch: 35 }); // ปรับจาก 30 เป็น 35
            } else if (header.includes('หน่วยงาน') || header.includes('ข้อเสนอแนะ')) {
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


    return (
        <div className="min-h-screen bg-[#F0F7FF] pb-24 font-sans text-slate-900">
            {/* Header: ปรับปรุงระยะห่าง */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 pt-10 pb-6">
                    <div className="flex items-center justify-between mb-8 px-2">
                        <button onClick={() => router.push('/teacher/dashboard')} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 transition-all active:scale-90"><ChevronLeft size={20} /></button>
                        <div className="text-center">
                            <h1 className="text-lg font-black text-slate-800 leading-none">ผลการประเมินวิชา</h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Weighted Summary</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><GraduationCap size={20} /></div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 px-2">
                        <button onClick={() => handleFilterChange('all')} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black border transition-all shrink-0 ${subjectId === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>ทุกวิชา</button>
                        {subjects.map((s, i) => (
                            <button key={i} onClick={() => handleFilterChange(s.subject_id)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black border transition-all shrink-0 ${String(subjectId) === String(s.subject_id) ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{s.subjects.name}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="max-w-4xl mx-auto px-4 mt-8 space-y-4">
                <div className="flex gap-3 px-2 mb-8 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input type="text" placeholder="ค้นหาชื่อ หรือ รหัสนักศึกษา..." className="w-full bg-white border border-slate-200 rounded-2xl py-4.5 pl-14 pr-4 text-sm font-bold shadow-sm focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all" onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={handleExportExcel} className="h-[54px] px-6 bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all shrink-0">
                        <FileSpreadsheet size={18} />
                        <span className="hidden sm:inline">EXPORT EXCEL</span>
                    </button>
                </div>

                {filteredData.map((item, idx) => {
                    const totalNet = item.evaluations.reduce((acc: number, ev: any) => {
                        const max = (ev.answers?.length || 8) * 5;
                        return acc + (ev.rawScore / max * (ev.weight * 100));
                    }, 0).toFixed(2);
                    const isMultiMentor = item.mentorCount > 1;

                    return (
                        <div key={idx} className="bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 hover:border-indigo-300 transition-all relative overflow-hidden group">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                                    {item.student?.avatar_url ? <img src={item.student.avatar_url} className="w-full h-full object-cover" /> : <User size={20} className="m-auto mt-4 text-slate-200" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-black text-slate-800 text-base leading-tight truncate">{item.student?.first_name} {item.student?.last_name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5 tracking-tight uppercase">รหัส: {item.student?.student_code}</p>
                                    {isMultiMentor && (
                                        <p className="text-[9px] font-black text-violet-500 mt-1 flex items-center gap-1"><Users size={10} /> {item.mentorCount} พี่เลี้ยงประเมิน</p>
                                    )}
                                </div>
                                <div className="text-right sm:hidden pr-2">
                                    <p className="text-xl font-black text-indigo-600 leading-none">{totalNet}</p>
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">{isMultiMentor ? 'Avg Net' : 'Net %'}</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-6 border-slate-50">
                                <div className="flex flex-col gap-1 flex-1">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase"><BookOpen size={10} /> {item.subjectName}</div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase"><MapPin size={10} /> {item.place?.site_name || 'ไม่ระบุสถานที่'}</div>
                                </div>
                                <div className="hidden sm:block text-right min-w-[70px]">
                                    <p className="text-2xl font-black text-indigo-600 leading-none">{totalNet}</p>
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">{isMultiMentor ? 'Avg Net' : 'Net Score'}</p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                    <button onClick={() => { setSelectedStudent(item); setModalMode('summary'); setIsModalOpen(true); setSelectedSupervisorIdx(0); }} className="flex-1 sm:flex-none h-11 px-4 sm:px-0 sm:w-11 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><FileText size={18} /></button>
                                    <button onClick={() => openDetailModal(item)} className="flex-1 sm:flex-none h-11 px-4 sm:px-0 sm:w-11 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><ListChecks size={18} /></button>
                                </div>
                            </div>
                        </div>
                    )
                })}
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
                                    {/* Header Info (เหมือนในรูป) */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-10 p-6 sm:p-8 bg-slate-50 rounded-[2rem] text-sm">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ข้อมูลนักศึกษา</p>
                                            <h3 className="font-black text-slate-800 text-xl">{selectedStudent.student.first_name} {selectedStudent.student.last_name}</h3>
                                            <p className="font-bold text-indigo-600">รหัส: {selectedStudent.student.student_code}</p>
                                            <p className="text-xs font-bold text-slate-500 flex items-center gap-2"><Phone size={12} /> {selectedStudent.student.phone || '-'}</p>
                                            <p className="text-xs font-bold text-violet-600 flex items-center gap-2 mt-1"><Users size={12} /> ผู้ประเมิน: {selectedStudent.supervisorEvaluations?.map((sv: any) => sv.supervisorName).join(', ') || '-'}</p>
                                        </div>
                                        <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 pt-4 sm:pt-0 sm:pl-8 space-y-1.5">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สถานที่ฝึกปฏิบัติงาน</p>
                                            <h3 className="font-black text-slate-800 text-base leading-tight">{selectedStudent.place?.site_name || '-'}</h3>
                                            <p className="text-sm font-bold text-slate-500">จังหวัด: {selectedStudent.place?.province || '-'}</p>
                                            <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 inline-block px-2 py-1 rounded-md uppercase">{selectedStudent.subjectName}</p>
                                        </div>
                                    </div>

                                    {modalMode === 'summary' ? (
                                        /* ตารางสรุป (Header เขียว) */
                                        <>
                                            <div className="overflow-hidden border border-slate-100 rounded-3xl shadow-sm">
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
                                                </div>
                                                <div className="overflow-hidden border border-slate-100 rounded-3xl shadow-sm">
                                                    <table className="w-full text-xs sm:text-sm">
                                                        <thead className="bg-[#105030] text-white font-black">
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
                                                <div className="mt-8">
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
                                        );
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
    )
}


// ver2
