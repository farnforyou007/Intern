// src/app/api/line/push/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { lineUserId, flexMessage } = await req.json();

    try {
        const response = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            },
            body: JSON.stringify({
                to: lineUserId,
                messages: [flexMessage]
            }),
        });

        const data = await response.json();
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to send line message' }, { status: 500 });
    }
}