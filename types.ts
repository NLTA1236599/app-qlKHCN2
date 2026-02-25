
export enum ProjectStatus {
  ONGOING = 'Đang thực hiện',
  OVERDUE = 'Quá hạn',
  COMPLETED = 'Nghiệm thu',
  LIQUIDATED = 'Thanh lý'
}

export enum ProgressStatus {
  ON_TIME = 'Đúng hạn',
  LATE = 'Trễ hạn',
  EXTENDED = 'Gia hạn'
}

export interface ProjectProduct {
  type: string;
  count: number;
}

export interface HistoryEntry {
  user: string;
  action: string;
  timestamp: string;
}

export interface ResearchProject {
  id: string; // Internal ID

  // 1-13 基本 Info
  projectCode: string; // Mã số ĐT
  contractId: string; // Số HĐ
  contractDate: string; // Ngày ký HĐ

  certificateResultNumber?: string; // Số giấy chứng nhận KQ
  certificateResultDate?: string; // Ngày cấp GCN
  certificateResultIssuingAuthority?: string; // Cơ quan cấp GCN

  title: string; // Tên đề tài
  leadAuthor: string; // Chủ nhiệm
  leadAuthorBirthYear?: string; // Năm sinh
  leadAuthorGender?: string; // Giới tính

  members: string; // Thành viên NC
  researchField: string; // Lĩnh vực NC
  researchType: string; // Loại hình NC
  categories: string[]; // Loại đề tài

  subDepartment: string; // Bộ môn
  department: string; // Khoa/Đơn vị

  // 14-15 Decisions
  approvalDecision?: string; // Quyết định xét duyệt
  authorizationDecision?: string; // Quyết định phê duyệt

  // 16-22 Financials
  budget: number; // Kinh phí thực hiện
  budgetLumpSum?: number; // Kinh phí khoán
  budgetNonLumpSum?: number; // Kinh phí không khoán
  budgetOtherSources?: number; // Kinh phí nguồn khác
  budgetBatch1?: number;
  budgetBatch2?: number;
  budgetBatch3?: number;

  // 23-30 Time & Progress
  duration?: string; // Thời gian thực hiện (text)
  startDate: string; // Bắt đầu
  endDate: string; // Kết thúc
  extensionDate?: string; // Thời gian gia hạn

  reviewReportingDate?: string; // Báo cáo giám định
  progressReportDate1?: string; // Báo cáo tiến độ 1
  progressReportDate2?: string; // Báo cáo tiến độ 2
  progressReportDate3?: string; // Báo cáo tiến độ 3
  progressReportDate4?: string; // Báo cáo tiến độ 4
  progressStatus?: ProgressStatus | string; // Tiến độ thực hiện (đúng hạn/trễ/gia)
  progressReportNote?: string; // Ghi chú về nộp báo cáo
  acceptanceMeetingDate?: string; // Ngày họp nghiệm thu
  reminderDate?: string; // Thời điểm nhắc

  // 31-36 Products & Acceptance
  outputProduct?: string; // Sản phẩm đầu ra (Summary Text)
  status: ProjectStatus; // Tình trạng
  acceptanceYear?: string; // Năm nghiệm thu
  acceptanceAcademicYear?: string; // Năm học nghiệm thu

  expectedProducts: ProjectProduct[]; // SP cam kết
  actualProducts: ProjectProduct[]; // SP thực tế (counts)
  actualProductDetails?: string; // SP thực tế chi tiết (text)

  acceptanceSubmissionDate?: string; // Nộp NT (Legacy?) -> Keep if needed or map to 'acceptanceMeetingDate'?
  acceptanceCompletionDate?: string; // Hoàn tất NT -> 'Thời điểm nghiệm thu'
  settlementCompletionDate?: string; // Quyết toán (Legacy?) -> Keep?

  // 41-43 Other
  isTransferred?: boolean; // Chuyển tiếp
  terminationReason?: string; // Lý do thanh lý

  // Workflow
  workflowStep?: number;
  workflowStatus?: string;
  workflowHistory?: {
    step: number;
    updatedBy: string;
    updatedAt: any; // Firestore Timestamp
  }[];
  workflowTodos?: {
    id: string;
    step: number;
    text: string;
    completed: boolean;
    createdAt: any;
  }[];
  workflowStepDates?: {
    [key: number]: {
      expectedStart?: string;
      expectedEnd?: string;
      actualStart?: string;
      actualEnd?: string;
    }
  };

  description: string; // Ghi chú general
  history: HistoryEntry[];
}

export type KanbanStatus = 'review' | 'report' | 'pre_acceptance' | 'completed';

export interface KanbanTask {
  id: string;
  title: string;
  status: KanbanStatus;
  priority: 'High' | 'Medium' | 'Low';
  date: string;
  startDate?: string;
  endDate?: string;
  categories?: string[];
  user?: string;
  tag?: string;
  note?: string;
  progressStatus?: string;
}

export type ViewType = 'overview' | 'progress_tracking' | 'table' | 'dashboard' | 'entry' | 'detail' | 'workflow_process';

export interface User {
  username: string;
  role: 'leader' | 'admin' | 'specialist' | 'author' | 'user';
  password?: string;
}
