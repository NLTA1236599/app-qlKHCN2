-- COPY TOÀN BỘ ĐOẠN CODE BÊN DƯỚI VÀO PHẦN "SQL EDITOR" TRÊN SUPABASE ĐỂ CHẠY --
-- ĐÂY LÀ LỆNH ĐỂ THÊM CỘT MỚI VÀO BẢNG projects ĐÃ CÓ --

-- 1. Thêm các cột thông tin mới
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS project_code TEXT,
ADD COLUMN IF NOT EXISTS contract_date DATE,
ADD COLUMN IF NOT EXISTS lead_author_birth_year TEXT,
ADD COLUMN IF NOT EXISTS lead_author_gender TEXT,
ADD COLUMN IF NOT EXISTS members TEXT,
ADD COLUMN IF NOT EXISTS research_field TEXT,
ADD COLUMN IF NOT EXISTS research_type TEXT,
ADD COLUMN IF NOT EXISTS approval_decision TEXT,
ADD COLUMN IF NOT EXISTS authorization_decision TEXT,
ADD COLUMN IF NOT EXISTS certificate_result_number TEXT,
ADD COLUMN IF NOT EXISTS certificate_result_date DATE,
ADD COLUMN IF NOT EXISTS certificate_result_issuing_authority TEXT,
ADD COLUMN IF NOT EXISTS budget_lump_sum BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_non_lump_sum BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_other_sources BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_batch_1 BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_batch_2 BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_batch_3 BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS extension_date DATE,
ADD COLUMN IF NOT EXISTS progress_status TEXT,
ADD COLUMN IF NOT EXISTS progress_report_note TEXT,
ADD COLUMN IF NOT EXISTS acceptance_meeting_date DATE,
ADD COLUMN IF NOT EXISTS reminder_date DATE,
ADD COLUMN IF NOT EXISTS output_product TEXT,
ADD COLUMN IF NOT EXISTS acceptance_year TEXT,
ADD COLUMN IF NOT EXISTS acceptance_academic_year TEXT,
ADD COLUMN IF NOT EXISTS actual_product_details TEXT,
ADD COLUMN IF NOT EXISTS is_transferred BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS termination_reason TEXT;

-- 2. Kiểm tra lại bảng sau khi thêm
SELECT * FROM projects LIMIT 1;
