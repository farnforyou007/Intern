// src/lib/lineFlex.ts

/**
 * 📝 1. แจ้งเตือนหลังลงทะเบียน (Register Success)
 */
export const flexRegisterSuccess = (data: { name: string; site: string }) => ({
    type: "bubble",
    size: "mega",
    header: {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text: "📝 ลงทะเบียนสำเร็จ", weight: "bold", color: "#ffffff", size: "lg" }],
        backgroundColor: "#064e3b"
    },
    body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
            { type: "text", text: `เรียน อ.${data.name}`, weight: "bold", size: "md", color: "#1e293b" },
            {
                type: "box",
                layout: "vertical",
                margin: "lg",
                spacing: "sm",
                contents: [
                    {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                            { type: "text", text: "หน่วยงาน", color: "#94a3b8", size: "xs", flex: 2 },
                            { type: "text", text: data.site, wrap: true, color: "#475569", size: "xs", flex: 5 }
                        ]
                    },
                    {
                        type: "box",
                        layout: "baseline",
                        spacing: "sm",
                        contents: [
                            { type: "text", text: "สถานะ", color: "#94a3b8", size: "xs", flex: 2 },
                            { type: "text", text: "⏳ รอการอนุมัติ", color: "#f59e0b", weight: "bold", size: "xs", flex: 5 }
                        ]
                    }
                ]
            },
            { type: "text", text: "แอดมินจะตรวจสอบและแจ้งผลการอนุมัติให้ท่านทราบผ่านช่องทางนี้อีกครั้ง", size: "xxs", color: "#94a3b8", margin: "xl", align: "center", wrap: true }
        ]
    }
});

/**
 * ✅ 2. แจ้งเตือนเมื่อได้รับการอนุมัติ (Approved)
 */
export const flexAccountApproved = (name: string) => ({
    type: "bubble",
    size: "mega",
    body: {
        type: "box",
        layout: "vertical",
        contents: [
            { type: "text", text: "🎊 บัญชีได้รับการอนุมัติ", weight: "bold", size: "xl", color: "#10b981" },
            { type: "text", text: `สวัสดี อ.${name}`, weight: "bold", size: "sm", margin: "md" },
            { type: "text", text: "ขณะนี้บัญชีของคุณได้รับการอนุมัติเรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบเพื่อเริ่มดำเนินการประเมินนักศึกษาได้ทันที", wrap: true, size: "xs", color: "#64748b", margin: "sm" }
        ]
    },
    footer: {
        type: "box",
        layout: "vertical",
        contents: [
            {
                type: "button",
                action: { type: "uri", label: "เข้าใช้งาน", uri: `${process.env.NEXT_PUBLIC_LIFF_URL}/` },
                style: "primary",
                color: "#064e3b",
                height: "sm"
            }
        ]
    }
});

/**
 * ⏰ 3. แจ้งเตือนใกล้ครบกำหนด (Reminder - สำหรับ Apps Script)
 */
export const flexTimeReminder = (data: { name: string; rotation: string; daysLeft: number; pendingCount: number }) => ({
    type: "bubble",
    header: {
        type: "box",
        layout: "vertical",
        contents: [{ type: "text", text: "⏳ ใกล้ครบกำหนดประเมิน", color: "#ffffff", weight: "bold" }],
        backgroundColor: "#e11d48"
    },
    body: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
            { type: "text", text: `เรียน อ.${data.name}`, weight: "bold" },
            { type: "text", text: `ผลัดการฝึก: ${data.rotation}`, size: "sm", color: "#475569" },
            { type: "text", text: `เหลือเวลาอีกเพียง ${data.daysLeft} วัน`, size: "sm", color: "#e11d48", weight: "bold" },
            { type: "separator", margin: "md" },
            { type: "text", text: `ยังค้างการประเมินอีก ${data.pendingCount} รายการ`, size: "xs", color: "#64748b", margin: "md" }
        ]
    },
    footer: {
        type: "box",
        layout: "vertical",
        contents: [
            {
                type: "button",
                action: { type: "uri", label: "ดูรายชื่อนักศึกษา", uri: `${process.env.NEXT_PUBLIC_APP_URL}/supervisor/students` },
                style: "secondary",
                height: "sm"
            }
        ]
    }
});