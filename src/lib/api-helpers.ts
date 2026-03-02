import { NextResponse } from 'next/server'

/**
 * ดึง line_user_id จาก Request Header
 * Client ต้องส่ง Header: X-Line-User-Id
 */
export function getLineUserIdFromRequest(req: Request): string | null {
    return req.headers.get('x-line-user-id') || null
}

/**
 * ส่ง JSON response สำเร็จ
 */
export function apiSuccess(data: any, status = 200) {
    return NextResponse.json({ success: true, data }, { status })
}

/**
 * ส่ง JSON response error
 */
export function apiError(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status })
}
