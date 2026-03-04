-- ===== Migration: เพิ่มคอลัมน์ track =====
-- Run this in Supabase SQL Editor

-- 1. เพิ่ม track ในตาราง rotations (default 'A')
ALTER TABLE rotations ADD COLUMN IF NOT EXISTS track TEXT DEFAULT 'A';

-- 2. เพิ่ม track ในตาราง students (default 'A')
ALTER TABLE students ADD COLUMN IF NOT EXISTS track TEXT DEFAULT 'A';

-- 3. อัปเดต unique constraint (ถ้ามี)
-- ⚠️ เช็คชื่อ constraint เดิมก่อน แล้วเปลี่ยนตามนี้:
-- ALTER TABLE rotations DROP CONSTRAINT IF EXISTS rotations_round_number_academic_year_key;
-- ALTER TABLE rotations ADD CONSTRAINT rotations_round_track_year_key UNIQUE (round_number, academic_year, track);
