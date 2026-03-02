// // src/lib/lineFlex.ts

// /**
//  * 📝 1. แจ้งเตือนหลังลงทะเบียน (Register Success)
//  */
// export const flexRegisterSuccess = (data: { name: string; site: string }) => ({
//     type: "bubble",
//     size: "mega",
//     header: {
//         type: "box",
//         layout: "vertical",
//         contents: [{ type: "text", text: "📝 ลงทะเบียนสำเร็จ", weight: "bold", color: "#ffffff", size: "lg" }],
//         backgroundColor: "#064e3b"
//     },
//     body: {
//         type: "box",
//         layout: "vertical",
//         spacing: "md",
//         contents: [
//             { type: "text", text: `เรียน อ.${data.name}`, weight: "bold", size: "md", color: "#1e293b" },
//             {
//                 type: "box",
//                 layout: "vertical",
//                 margin: "lg",
//                 spacing: "sm",
//                 contents: [
//                     {
//                         type: "box",
//                         layout: "baseline",
//                         spacing: "sm",
//                         contents: [
//                             { type: "text", text: "หน่วยงาน", color: "#94a3b8", size: "xs", flex: 2 },
//                             { type: "text", text: data.site, wrap: true, color: "#475569", size: "xs", flex: 5 }
//                         ]
//                     },
//                     {
//                         type: "box",
//                         layout: "baseline",
//                         spacing: "sm",
//                         contents: [
//                             { type: "text", text: "สถานะ", color: "#94a3b8", size: "xs", flex: 2 },
//                             { type: "text", text: "⏳ รอการอนุมัติ", color: "#f59e0b", weight: "bold", size: "xs", flex: 5 }
//                         ]
//                     }
//                 ]
//             },
//             { type: "text", text: "แอดมินจะตรวจสอบและแจ้งผลการอนุมัติให้ท่านทราบผ่านช่องทางนี้อีกครั้ง", size: "xxs", color: "#94a3b8", margin: "xl", align: "center", wrap: true }
//         ]
//     }
// });

// /**
//  * ✅ 2. แจ้งเตือนเมื่อได้รับการอนุมัติ (Approved)
//  */
// export const flexAccountApproved = (name: string) => ({
//     type: "bubble",
//     size: "mega",
//     body: {
//         type: "box",
//         layout: "vertical",
//         contents: [
//             { type: "text", text: "🎊 บัญชีได้รับการอนุมัติ", weight: "bold", size: "xl", color: "#10b981" },
//             { type: "text", text: `สวัสดี อ.${name}`, weight: "bold", size: "sm", margin: "md" },
//             { type: "text", text: "ขณะนี้บัญชีของคุณได้รับการอนุมัติเรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบเพื่อเริ่มดำเนินการประเมินนักศึกษาได้ทันที", wrap: true, size: "xs", color: "#64748b", margin: "sm" }
//         ]
//     },
//     footer: {
//         type: "box",
//         layout: "vertical",
//         contents: [
//             {
//                 type: "button",
//                 action: { type: "uri", label: "เข้าใช้งาน", uri: `${process.env.NEXT_PUBLIC_LIFF_URL}/` },
//                 style: "primary",
//                 color: "#064e3b",
//                 height: "sm"
//             }
//         ]
//     }
// });

// /**
//  * ⏰ 3. แจ้งเตือนใกล้ครบกำหนด (Reminder - สำหรับ Apps Script)
//  */
// export const flexTimeReminder = (data: { name: string; rotation: string; daysLeft: number; pendingCount: number }) => ({
//     type: "bubble",
//     header: {
//         type: "box",
//         layout: "vertical",
//         contents: [{ type: "text", text: "⏳ ใกล้ครบกำหนดประเมิน", color: "#ffffff", weight: "bold" }],
//         backgroundColor: "#e11d48"
//     },
//     body: {
//         type: "box",
//         layout: "vertical",
//         spacing: "sm",
//         contents: [
//             { type: "text", text: `เรียน อ.${data.name}`, weight: "bold" },
//             { type: "text", text: `ผลัดการฝึก: ${data.rotation}`, size: "sm", color: "#475569" },
//             { type: "text", text: `เหลือเวลาอีกเพียง ${data.daysLeft} วัน`, size: "sm", color: "#e11d48", weight: "bold" },
//             { type: "separator", margin: "md" },
//             { type: "text", text: `ยังค้างการประเมินอีก ${data.pendingCount} รายการ`, size: "xs", color: "#64748b", margin: "md" }
//         ]
//     },
//     footer: {
//         type: "box",
//         layout: "vertical",
//         contents: [
//             {
//                 type: "button",
//                 action: { type: "uri", label: "ดูรายชื่อนักศึกษา", uri: `${process.env.NEXT_PUBLIC_APP_URL}/supervisor/students` },
//                 style: "secondary",
//                 height: "sm"
//             }
//         ]
//     }
// });


// src/lib/lineFlex.ts

/**
 * 📝 1. แจ้งเตือนหลังลงทะเบียน (Register Success) - สีเขียวเข้ม
 */
export const flexRegisterSuccess = (data: { name: string; site: string }) => ({
    type: "flex",
    altText: "📝 ลงทะเบียนสำเร็จ: รอการอนุมัติ",
    contents: {
        type: "bubble",
        size: "mega",
        header: {
            type: "box",
            layout: "vertical",
            contents: [
                { type: "text", text: "REGISTRATION", weight: "bold", color: "#ffffff", size: "xs", align: "center" },
                { type: "text", text: "ลงทะเบียนสำเร็จ", weight: "bold", color: "#ffffff", size: "lg", align: "center", margin: "md" }
            ],
            backgroundColor: "#064e3b",
            paddingAll: "20px"
        },
        body: {
            type: "box",
            layout: "vertical",
            contents: [
                { type: "text", text: `เรียน ${data.name}`, weight: "bold", size: "xl", align: "center", color: "#1e293b" },
                { type: "separator", margin: "lg" },
                {
                    type: "box",
                    layout: "vertical",
                    margin: "lg",
                    spacing: "sm",
                    contents: [
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: "หน่วยงาน", color: "#aaaaaa", size: "sm", flex: 2 },
                                { type: "text", text: data.site, wrap: true, color: "#475569", size: "sm", flex: 5, weight: "bold" }
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: "สถานะ", color: "#aaaaaa", size: "sm", flex: 2 },
                                { type: "text", text: "⏳ รอการอนุมัติ", color: "#f59e0b", weight: "bold", size: "sm", flex: 5 }
                            ]
                        }
                    ]
                },
                { type: "text", text: "แอดมินจะตรวจสอบและแจ้งผลการอนุมัติให้ท่านทราบผ่านช่องทางนี้อีกครั้ง", size: "xxs", color: "#94a3b8", margin: "xl", align: "center", wrap: true }
            ]
        }
    }
});

/**
 * ✅ 2. แจ้งเตือนเมื่อได้รับการอนุมัติ (Approved) - สีเขียว Emerald
 */
// export const flexAccountApproved = (name: string) => ({

//     type: "flex",
//     altText: "🎊 บัญชีของคุณได้รับการอนุมัติแล้ว",
//     contents: {
//         type: "bubble",
//         size: "mega",
//         header: {
//             type: "box",
//             layout: "vertical",
//             contents: [
//                 { type: "text", text: "APPROVED", weight: "bold", color: "#ffffff", size: "xs", align: "center" },
//                 { type: "text", text: "บัญชีได้รับการอนุมัติ", weight: "bold", color: "#ffffff", size: "lg", align: "center", margin: "md" }
//             ],
//             backgroundColor: "#10b981",
//             paddingAll: "20px"
//         },
//         body: {
//             type: "box",
//             layout: "vertical",
//             contents: [
//                 { type: "text", text: `สวัสดี อ.${name}`, weight: "bold", size: "xl", align: "center", color: "#1e293b" },
//                 { type: "text", text: "ท่านสามารถเข้าใช้งานระบบได้แล้ว", size: "sm", color: "#64748b", align: "center", margin: "sm" },
//                 { type: "separator", margin: "lg" },
//                 {
//                     type: "box",
//                     layout: "vertical",
//                     margin: "lg",
//                     contents: [
//                         { type: "text", text: "ขณะนี้ท่านสามารถเริ่มดำเนินการประเมินนักศึกษาในส่วนที่รับผิดชอบได้ทันที", wrap: true, size: "xs", color: "#94a3b8", align: "center" }
//                     ]
//                 }
//             ]
//         },
//         footer: {
//             type: "box",
//             layout: "vertical",
//             contents: [
//                 {
//                     type: "button",
//                     action: { type: "uri", label: "เข้าใช้งานระบบ", uri: `${process.env.NEXT_PUBLIC_LIFF_URL}` },
//                     style: "primary",
//                     color: "#10b981"
//                 }
//             ]
//         }
//     }
// });


export const flexAccountApproved = (name: string) => {
    // 1. จัดการค่า URL ให้ชัวร์ว่าไม่เป็นค่าว่าง
    const liffUrl = process.env.NEXT_PUBLIC_LIFF_URL || "https://liff.line.me/2009096451-rkWSBIMh";
    const finalUri = liffUrl.endsWith('/') ? liffUrl : `${liffUrl}/`;

    // 2. Return Object ที่ถูกต้องออกไปเพียงตัวเดียว
    return {
        type: "flex" as const,
        altText: "🎊 บัญชีของคุณได้รับการอนุมัติแล้ว",
        contents: {
            type: "bubble" as const,
            size: "mega" as const,
            header: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: "APPROVED", weight: "bold", color: "#ffffff", size: "xs", align: "center" },
                    { type: "text", text: "บัญชีได้รับการอนุมัติ", weight: "bold", color: "#ffffff", size: "lg", align: "center", margin: "md" }
                ],
                backgroundColor: "#10b981",
                paddingAll: "20px"
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: `สวัสดี ${name}`, weight: "bold", size: "xl", align: "center", color: "#1e293b" },
                    { type: "text", text: "ท่านสามารถเข้าใช้งานระบบได้แล้ว", size: "sm", color: "#64748b", align: "center", margin: "sm" },
                    { type: "separator", margin: "lg" },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        contents: [
                            { type: "text", text: "ขณะนี้ท่านสามารถเริ่มดำเนินการประเมินนักศึกษาในส่วนที่รับผิดชอบได้ทันที", wrap: true, size: "xs", color: "#94a3b8", align: "center" }
                        ]
                    }
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "button",
                        action: {
                            type: "uri",
                            label: "เข้าใช้งานระบบ",
                            uri: finalUri
                        },
                        style: "primary",
                        color: "#10b981"
                    }
                ]
            }
        }
    };
};

/**
 * ⏰ 3. แจ้งเตือนใกล้ครบกำหนด (Reminder) - สีแดง Urgent
 */
export const flexTimeReminder = (data: { name: string; rotation: string; daysLeft: number; pendingCount: number }) => ({
    type: "flex",
    altText: `⚠️ แจ้งเตือนการประเมินค้าง: อ.${data.name}`,
    contents: {
        type: "bubble",
        header: {
            type: "box",
            layout: "vertical",
            contents: [
                { type: "text", text: "URGENT", weight: "bold", color: "#ffffff", size: "xs", align: "center" },
                { type: "text", text: "ใกล้ครบกำหนดประเมิน", weight: "bold", color: "#ffffff", size: "lg", align: "center", margin: "md" }
            ],
            backgroundColor: "#e11d48",
            paddingAll: "20px"
        },
        body: {
            type: "box",
            layout: "vertical",
            contents: [
                { type: "text", text: `เรียน ${data.name}`, weight: "bold", size: "md", color: "#1e293b" },
                { type: "separator", margin: "lg" },
                {
                    type: "box",
                    layout: "vertical",
                    margin: "lg",
                    spacing: "sm",
                    contents: [
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: "ผลัดการฝึก", color: "#aaaaaa", size: "sm", flex: 3 },
                                { type: "text", text: data.rotation, wrap: true, color: "#475569", size: "sm", flex: 5, weight: "bold" }
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: "เวลาที่เหลือ", color: "#aaaaaa", size: "sm", flex: 3 },
                                { type: "text", text: `${data.daysLeft} วัน`, color: "#e11d48", weight: "bold", size: "sm", flex: 5 }
                            ]
                        },
                        {
                            type: "box",
                            layout: "baseline",
                            contents: [
                                { type: "text", text: "ค้างประเมิน", color: "#aaaaaa", size: "sm", flex: 3 },
                                { type: "text", text: `${data.pendingCount} รายการ`, color: "#475569", size: "sm", flex: 5, weight: "bold" }
                            ]
                        }
                    ]
                }
            ]
        },
        footer: {
            type: "box",
            layout: "vertical",
            contents: [
                {
                    type: "button",
                    action: { type: "uri", label: "ดูรายชื่อนักศึกษา", uri: `${process.env.NEXT_PUBLIC_APP_URL}/supervisor/students` },
                    style: "primary",
                    color: "#e11d48"
                }
            ]
        }
    }
});

/**
 * 📊 4. แจ้งเตือนการประเมินค้าง (Evaluation Reminder - ส่งจากแอดมิน)
 */
export const flexEvaluationReminder = (data: { name: string; evaluated: number; total: number; pending: number }) => {
    const liffUrl = process.env.NEXT_PUBLIC_LIFF_URL || "https://liff.line.me/2009096451-rkWSBIMh";
    const finalUri = liffUrl.endsWith('/') ? liffUrl : `${liffUrl}/`;
    const percent = data.total > 0 ? Math.round((data.evaluated / data.total) * 100) : 0;

    return {
        type: "flex" as const,
        altText: `📊 แจ้งเตือนการประเมิน: ค้างอีก ${data.pending} รายการ`,
        contents: {
            type: "bubble" as const,
            size: "mega" as const,
            header: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: "EVALUATION REMINDER", weight: "bold", color: "#ffffff", size: "xs", align: "center" },
                    { type: "text", text: "แจ้งเตือนการประเมิน", weight: "bold", color: "#ffffff", size: "lg", align: "center", margin: "md" }
                ],
                backgroundColor: "#d97706",
                paddingAll: "20px"
            },
            body: {
                type: "box",
                layout: "vertical",
                contents: [
                    { type: "text", text: `เรียน ${data.name}`, weight: "bold", size: "md", align: "center", color: "#1e293b" },
                    { type: "text", text: "กรุณาดำเนินการประเมินนักศึกษาที่ยังค้างอยู่", size: "xs", color: "#64748b", align: "center", margin: "sm", wrap: true },
                    { type: "separator", margin: "lg" },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "lg",
                        spacing: "sm",
                        contents: [
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    { type: "text", text: "ประเมินแล้ว", color: "#aaaaaa", size: "sm", flex: 3 },
                                    { type: "text", text: `${data.evaluated}/${data.total} รายการ (${percent}%)`, color: "#475569", size: "sm", flex: 5, weight: "bold" }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                contents: [
                                    { type: "text", text: "ค้างประเมิน", color: "#aaaaaa", size: "sm", flex: 3 },
                                    { type: "text", text: `${data.pending} รายการ`, color: "#d97706", size: "sm", flex: 5, weight: "bold" }
                                ]
                            }
                        ]
                    },
                    {
                        type: "box",
                        layout: "vertical",
                        margin: "xl",
                        contents: [
                            {
                                type: "box",
                                layout: "vertical",
                                height: "6px",
                                backgroundColor: "#e2e8f0",
                                cornerRadius: "3px",
                                contents: [
                                    {
                                        type: "box",
                                        layout: "vertical",
                                        height: "6px",
                                        width: `${percent}%`,
                                        backgroundColor: percent === 100 ? "#10b981" : "#d97706",
                                        cornerRadius: "3px",
                                        contents: []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            footer: {
                type: "box",
                layout: "vertical",
                contents: [
                    {
                        type: "button",
                        action: {
                            type: "uri",
                            label: "เข้าประเมินนักศึกษา",
                            uri: finalUri
                        },
                        style: "primary",
                        color: "#d97706"
                    }
                ]
            }
        }
    };
};