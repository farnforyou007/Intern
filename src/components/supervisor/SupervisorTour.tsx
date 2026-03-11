"use client"
import { useEffect, useCallback, useRef } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { usePathname, useRouter } from "next/navigation";

interface SupervisorTourProps {
    startTour: boolean;
    onComplete: () => void;
}

export default function SupervisorTour({ startTour, onComplete }: SupervisorTourProps) {
    const pathname = usePathname();
    const router = useRouter();
    const driverRef = useRef<any>(null);

    const runTour = useCallback((startStep = 0) => {
        if (driverRef.current) {
            driverRef.current.destroy();
        }

        const driverObj = driver({
            showProgress: true,
            nextBtnText: 'ถัดไป <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle; margin-left:4px;"><path d="m9 18 6-6-6-6"/></svg>',
            prevBtnText: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle; margin-right:4px;"><path d="m15 18-6-6 6-6"/></svg> ย้อนกลับ',
            doneBtnText: 'เสร็จสิ้น <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle; margin-left:4px;"><path d="M20 6 9 17l-5-5"/></svg>',
            popoverClass: 'premium-tour-popover',
            steps: [
                {
                    element: '#welcome-section',
                    popover: {
                        title: '<div style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg> <span>สวัสดีครับ</span></div>',
                        description: 'ยินดีต้อนรับสู่ระบบแนะนำการใช้งานเบื้องต้น เราจะพาคุณไปดูส่วนประกอบสำคัญต่างๆ ครับ',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#menu-students',
                    popover: {
                        title: '<div style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> <span>รายชื่อนักศึกษา</span></div>',
                        description: 'จุดเริ่มต้นของการประเมิน! คุณสามารถดูรายชื่อนักศึกษาทั้งหมดภายใน รพ.และเพิ่มนักศึกษาในความดูแลเพื่อประเมินได้จากที่นี่ครับ',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#menu-history',
                    popover: {
                        title: '<div style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><circle cx="9" cy="13" r="1"/></svg> <span>ประวัติประเมิน</span></div>',
                        description: 'หากต้องการดูคะแนนย้อนหลัง หรืออยาก "แก้ไขคะแนน" ที่เคยให้ไปแล้ว สามารถมาที่เมนูนี้ได้เลยครับ',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#menu-schedule',
                    popover: {
                        title: '<div style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg> <span>ตารางผลัดฝึก</span></div>',
                        description: 'ตรวจสอบวันที่เริ่มต้นและสิ้นสุดของแต่ละผลัดการฝึกงานได้ที่นี่ เพื่อให้ไม่พลาดการประเมินครับ',
                        side: "bottom",
                        align: 'start'
                    }
                },
                {
                    element: '#menu-students',
                    popover: {
                        title: '<div style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-3 5-3"/><path d="M12 15v5s3.03-.55 5-2c2.2-1.62 3-5 3-5"/></svg> <span>ขั้นตอนแรก: เลือกนักศึกษา</span></div>',
                        description: 'กดที่เมนูนี้เพื่อไปหน้าเลือกนักศึกษาที่เรารับผิดชอบกันครับ (ระบบจะพาไปอัตโนมัติเมื่อกด "ถัดไป")',
                        side: "top",
                        align: 'center',
                        onNextClick: () => {
                            localStorage.setItem('supervisor_tour_active', 'true');
                            localStorage.setItem('supervisor_tour_step', '5');
                            localStorage.setItem('supervisor_tour_mockup', 'true');
                            router.push('/supervisor/students');
                            driverObj.destroy();
                        }
                    },
                },
                {
                    element: '#tab-all-students',
                    popover: {
                        title: '<div style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> <span>ค้นหานักศึกษาทั้งหมด</span></div>',
                        description: 'เมื่อต้องการรับนักศึกษาใหม่เข้ามาดูแล ให้กดที่แถบ "นักศึกษาทั้งหมด" เพื่อดูรายชื่อทั้งหมดครับ',
                        side: "bottom",
                        align: 'center',
                        onNextClick: () => {
                            const btn = document.querySelector('#tab-all-students') as HTMLElement;
                            if (btn) btn.click();
                            setTimeout(() => driverObj.moveNext(), 500);
                        }
                    }
                },
                {
                    element: '#first-student-card',
                    popover: {
                        title: '<div style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> <span>ข้อมูลนักศึกษา</span></div>',
                        description: 'เมื่อเจอนักศึกษาที่รับผิดชอบแล้ว ให้กดดูรายละเอียดเพื่อเตรียมเลือกรายวิชาครับ',
                        side: "top",
                        align: 'center'
                    }
                },
                {
                    element: '#first-subject-claim',
                    popover: {
                        title: '<div style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> <span>เลือกรายวิชา</span></div>',
                        description: 'กดเลือกรายวิชาที่คุณรับผิดชอบนักศึกษาคนนี้ เป็นอันเสร็จสิ้นขั้นตอนการเลือกครับ!',
                        side: "bottom",
                        align: 'center',
                        onNextClick: () => {
                            const btn = document.querySelector('#tab-mine-students') as HTMLElement;
                            if (btn) btn.click();
                            setTimeout(() => driverObj.moveNext(), 500);
                        }
                    }
                },
                {
                    element: '#evaluation-highlight',
                    popover: {
                        title: '<div style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> <span>เตรียมการประเมิน</span></div>',
                        description: 'เมื่อเลือกเสร็จแล้ว นักศึกษาจะมาปรากฏในแถบ "นักศึกษาที่รับผิดชอบ" โดยคุณจะประเมินเมื่อใกล้จบผลัดครับ',
                        side: "top",
                        align: 'center'
                    }
                },
                {
                    popover: {
                        title: '<div style="display:flex; align-items:center; gap:8px;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color:#059669;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg> <span>เยี่ยมมากครับ!</span></div>',
                        description: 'ขณะนี้คุณพร้อมใช้งานระบบแล้วครับ หากต้องการความช่วยเหลือเพิ่มเติม สามารถกดปุ่มแนะนำได้เสมอ ขอให้เป็นวันที่ดีครับ!',
                        side: "bottom",
                        align: 'center'
                    }
                }
            ],
            onDestroyed: () => {
                const isActive = localStorage.getItem('supervisor_tour_active');
                if (isActive !== 'true') {
                    localStorage.removeItem('supervisor_tour_step');
                    localStorage.removeItem('supervisor_tour_mockup');
                }
                onComplete();
            }
        });

        driverRef.current = driverObj;
        driverObj.drive(startStep);
    }, [router, onComplete]);

    useEffect(() => {
        if (startTour) {
            const initialStep = pathname === '/supervisor/students' ? 5 : 0;
            if (initialStep === 0) {
                localStorage.setItem('supervisor_tour_active', 'true');
            } else {
                localStorage.setItem('supervisor_tour_mockup', 'true');
            }
            runTour(initialStep);
        }
    }, [startTour, runTour, pathname]);

    useEffect(() => {
        const isActive = localStorage.getItem('supervisor_tour_active');
        const savedStep = localStorage.getItem('supervisor_tour_step');

        if (isActive === 'true' && savedStep) {
            const stepInt = parseInt(savedStep, 10);

            if (pathname === '/supervisor/students' && stepInt >= 5) {
                const timer = setTimeout(() => {
                    const targetEl = stepInt === 5 ? '#tab-all-students' :
                        stepInt === 6 ? '#first-student-card' : '#first-subject-claim';

                    if (document.querySelector(targetEl)) {
                        localStorage.removeItem('supervisor_tour_active');
                        runTour(stepInt);
                    }
                }, 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [pathname, runTour]);

    return (
        <style jsx global>{`
            .premium-tour-popover {
                background: #ffffff !important;
                border-radius: 24px !important;
                padding: 24px !important;
                box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1) !important;
                border: 1px solid #f1f5f9 !important;
                font-family: 'Sarabun', 'Inter', sans-serif !important;
                max-width: 350px !important;
                color: #0f172a !important;
            }

            .premium-tour-popover .driver-popover-title {
                font-size: 1.25rem !important;
                font-weight: 800 !important;
                color: #064e3b !important;
                margin-bottom: 8px !important;
                line-height: 1.4 !important;
            }

            .premium-tour-popover .driver-popover-description {
                font-size: 0.95rem !important;
                font-weight: 500 !important;
                color: #64748b !important;
                line-height: 1.6 !important;
            }

            .premium-tour-popover .driver-popover-footer {
                margin-top: 20px !important;
                display: flex !important;
                gap: 8px !important;
                justify-content: flex-end !important;
            }

            .premium-tour-popover .driver-popover-btn {
                border-radius: 12px !important;
                padding: 8px 16px !important;
                font-size: 0.875rem !important;
                font-weight: 700 !important;
                transition: all 0.2s !important;
                text-shadow: none !important;
            }

            .premium-tour-popover .driver-popover-next-btn {
                background-color: #10b981 !important;
                color: white !important;
                border: none !important;
                padding: 10px 20px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            .premium-tour-popover .driver-popover-next-btn:hover {
                background-color: #059669 !important;
                transform: translateY(-2px) !important;
                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
            }

            .premium-tour-popover .driver-popover-prev-btn {
                background-color: #ffffff !important;
                color: #64748b !important;
                border: 1px solid #e2e8f0 !important;
                padding: 10px 20px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            .premium-tour-popover .driver-popover-prev-btn:hover {
                background-color: #f8fafc !important;
                color: #334155 !important;
            }

            .premium-tour-popover .driver-popover-close-btn {
                color: #94a3b8 !important;
            }

            .driver-popover-progress-text {
                font-size: 0.75rem !important;
                font-weight: 700 !important;
                color: #94a3b8 !important;
            }
        `}</style>
    );
}
