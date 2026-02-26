// // src/app/api/line/push/route.ts
// import { NextResponse } from 'next/server';

// export async function POST(req: Request) {
//     const { lineUserId, flexMessage } = await req.json();

//     try {
//         const response = await fetch('https://api.line.me/v2/bot/message/push', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
//             },
//             body: JSON.stringify({
//                 to: lineUserId,
//                 messages: [flexMessage]
//             }),
//         });

//         const data = await response.json();
//         return NextResponse.json({ success: true, data });
//     } catch (error) {
//         return NextResponse.json({ success: false, error: 'Failed to send line message' }, { status: 500 });
//     }
// }

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { lineUserId, flexMessage } = await req.json();

        // 1. ตรวจสอบว่ามี Token ไหม
        const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (!token) {
            return NextResponse.json({ success: false, error: 'Missing LINE Token' }, { status: 500 });
        }

        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                to: lineUserId,
                messages: [flexMessage]
            }),
        });

        const data = await response.json();

        // 2. ถ้า LINE ส่ง Error กลับมา (Status ไม่ใช่ 2xx)
        if (!response.ok) {
            console.error('LINE API Error Response:', data);
            return NextResponse.json({ success: false, error: 'LINE API Rejected', detail: data }, { status: response.status });
        }

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Server Catch Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}