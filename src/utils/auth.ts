import liff from '@line/liff';

/**
 * ฟังก์ชันสำหรับดึง Line User ID โดยรองรับทั้งโหมดจริงและโหมด Debug
 */
export const getLineUserId = async (searchParams: URLSearchParams): Promise<string | null> => {
    // 1. ตรวจสอบโหมด Debug จาก URL (?debug=...)
    const debugKey = searchParams.get('debug');

    // 2. ถ้าใน URL ไม่มี ให้ไปดูใน localStorage (ความจำสำรอง)
    // if (!debugKey && typeof window !== 'undefined') {
    //     debugKey = localStorage.getItem('debug_mode');
    // }
    if (debugKey === 'clear') {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('debug_mode'); // ลบค่าที่จำไว้ในเครื่อง
            // ทำการ Reload หน้าเพื่อให้ระบบกลับไปเริ่มกระบวนการ LIFF ใหม่
            window.location.href = window.location.pathname; 
        }
        return null;
    }
    
    let activeDebugKey = debugKey;
    if (!activeDebugKey && typeof window !== 'undefined') {
        activeDebugKey = localStorage.getItem('debug_mode');
    }

    if (activeDebugKey) {
        // แมปชื่อย่อที่คุณต้องการใช้เทส เข้ากับ ID ที่คุณสร้างใน Supabase
        const mockMap: Record<string, string> = {
            'farn': 'U678862bd992a4cda7aaf972743b585ac',      // พี่เลี้ยงคนที่ 1
            'sp1': 'DEBUG_SV_01',      // พี่เลี้ยงคนที่ 1
            'sp2': 'DEBUG_SV_02',      // พี่เลี้ยงคนที่ 2
            'sp3': 'DEBUG_SV_03',      // พี่เลี้ยงคนที่ 3
            'sp4': 'DEBUG_SV_04',      // พี่เลี้ยงคนที่ 4
            'sp5': 'DEBUG_SV_05',      // พี่เลี้ยงคนที่ 5
            'sp6': 'DEBUG_SV_06',      // พี่เลี้ยงคนที่ 6
            'panis': 'U4c81677b787575d8eb15b091d37957db',      // พี่เลี้ยงคนที่ 3
            'teacher1': 'DEBUG_TEACHER_01', // อาจารย์คนที่ 1
            'teacher2': 'DEBUG_TEACHER_02', // อาจารย์คนที่ 2
            'admin': 'DEBUG_ADMIN_01'  // แอดมิน (ถ้ามี)
        };
        const userId = mockMap[activeDebugKey];
        if (userId && typeof window !== 'undefined') {
            // ✅ บันทึกไว้ในเครื่องเลย รอบหน้าเข้าหน้าอื่นไม่ต้องพิมพ์ URL แล้ว
            localStorage.setItem('debug_mode', activeDebugKey);
        }

        // return mockMap[debugKey] || null;
        return userId || null;
    }

    // 2. ถ้าไม่มี Debug Mode ให้ใช้งาน LINE LIFF จริง
    if (typeof window !== 'undefined') {
        try {
            if (!liff.id) {
                await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
            }

            if (!liff.isLoggedIn()) {
                liff.login();
                return null;
            }

            const profile = await liff.getProfile();
            return profile.userId;
        } catch (error) {
            console.error("LIFF Auth Error:", error);
            return null;
        }
    }

    return null;
};