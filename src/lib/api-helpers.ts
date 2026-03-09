import { NextResponse } from 'next/server'

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
