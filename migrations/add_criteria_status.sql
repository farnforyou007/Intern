-- ===== Migration: เพิ่มฟิลด์สถานะ (Active/Inactive) ในเกณฑ์ประเมิน =====
-- Run this in Supabase SQL Editor

-- 1. เพิ่มคอลัมน์ is_active สำหรับเปิด-ปิดการใช้งานกลุ่มประเมิน (Default: true)
ALTER TABLE evaluation_groups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. เพิ่มคอลัมน์ deactivation_note สำหรับใส่หมายเหตุเวลาปิดใช้งาน (เช่น ปีการศึกษาที่เริ่มปิด)
ALTER TABLE evaluation_groups ADD COLUMN IF NOT EXISTS deactivation_note TEXT;

-- หมายเหตุ: ฟิลด์เหล่านี้จะช่วยให้ครูสามารถซ่อนเกณฑ์เก่าๆ ได้โดยไม่ต้องลบทิ้ง 
-- ทำให้ข้อมูลการประเมินในอดีตยังถูกเก็บรักษาไว้ครบถ้วน
