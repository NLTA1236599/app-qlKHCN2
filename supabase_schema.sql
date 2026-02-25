-- 1. Tạo bảng quản lý người dùng (users_app)
CREATE TABLE IF NOT EXISTS users_app (
    username TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'user',
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tạo bảng quản lý đề tài (projects)
-- Note: Using snake_case for columns. Frontend must map camelCase to snake_case.
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    
    -- General Info
    project_code TEXT,
    contract_id TEXT,
    contract_date DATE,
    
    title TEXT NOT NULL,
    
    -- Personnel
    lead_author TEXT NOT NULL,
    lead_author_birth_year TEXT,
    lead_author_gender TEXT,
    members TEXT,
    
    department TEXT,
    sub_department TEXT,
    
    -- Research Info
    research_field TEXT,
    research_type TEXT,
    categories JSONB DEFAULT '[]', -- JSON array of strings
    
    -- Decisions & Certs
    approval_decision TEXT,
    authorization_decision TEXT,
    certificate_result_number TEXT,
    certificate_result_date DATE,
    certificate_result_issuing_authority TEXT,
    
    -- Financials
    budget BIGINT DEFAULT 0,
    budget_lump_sum BIGINT DEFAULT 0,
    budget_non_lump_sum BIGINT DEFAULT 0,
    budget_other_sources BIGINT DEFAULT 0,
    budget_batch_1 BIGINT DEFAULT 0,
    budget_batch_2 BIGINT DEFAULT 0,
    budget_batch_3 BIGINT DEFAULT 0,
    
    -- Time & Progress
    duration TEXT,
    start_date DATE,
    end_date DATE,
    extension_date DATE,
    
    review_reporting_date DATE,
    progress_report_date_1 DATE,
    progress_report_date_2 DATE,
    progress_report_date_3 DATE,
    progress_report_date_4 DATE,
    progress_status TEXT, -- 'Đúng hạn', 'Trễ hạn', 'Gia hạn'
    progress_report_note TEXT,
    
    acceptance_meeting_date DATE,
    reminder_date DATE,
    
    -- Output & Acceptance
    output_product TEXT,
    status TEXT, -- 'Đang thực hiện', 'Quá hạn', 'Nghiệm thu', 'Thanh lý'
    acceptance_year TEXT,
    acceptance_academic_year TEXT,
    
    expected_products JSONB DEFAULT '[]',
    actual_products JSONB DEFAULT '[]',
    actual_product_details TEXT,
    
    acceptance_submission_date DATE,
    acceptance_completion_date DATE,
    settlement_completion_date DATE,
    
    -- Other
    is_transferred BOOLEAN DEFAULT FALSE,
    termination_reason TEXT,
    description TEXT,
    
    history JSONB DEFAULT '[]',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Cho phép truy cập công khai (Policy)
-- 3. Cho phép truy cập công khai (Policy)
-- LƯU Ý: Để đơn giản hóa cho phiên bản MVP, chúng ta vẫn cho phép, nhưng tách riêng Policy
-- nhằm tránh cảnh báo bảo mật gộp chung.

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Cho phép xem (SELECT) cho tất cả mọi người (Public)
CREATE POLICY "Enable read access for all users" 
ON projects FOR SELECT 
USING (true);

-- Cho phép thêm/sửa/xóa (INSERT/UPDATE/DELETE) cho tất cả (tạm thời)
-- Để bảo mật hơn, sau này hãy đổi thành: TO authenticated USING (true)
CREATE POLICY "Enable insert for all users" 
ON projects FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for all users" 
ON projects FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete for all users" 
ON projects FOR DELETE 
USING (true);


ALTER TABLE users_app ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for users_app" 
ON users_app FOR SELECT 
USING (true);

CREATE POLICY "Enable write access for users_app" 
ON users_app FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update access for users_app" 
ON users_app FOR UPDATE 
USING (true);

-- 4. Chèn tài khoản admin mặc định
INSERT INTO users_app (username, role, password) 
VALUES ('admin', 'admin', '123@abc')
ON CONFLICT (username) DO NOTHING;
