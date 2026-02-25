import React, { useState } from 'react';
import { ResearchProject } from '../types';
import WorkflowTimeline from './WorkflowTimeline';
import { workflowService } from '../services/workflowService';
import { WORKFLOW_STEPS } from '../constants/workflow';
import { dbService } from '../services/db';
import WorkflowTodoList from './WorkflowTodoList';

// Utility to format dates (handles Excel serials and ISO strings)
const formatDate = (dateString?: string | number) => {
    if (!dateString) return '---';
    const str = String(dateString).trim();
    if (!str) return '---';

    // Handle Excel serial numbers (e.g. 45000)
    // 25569 is the offset for 1970-01-01
    if (/^\d+(\.\d+)?$/.test(str) && Number(str) > 20000 && Number(str) < 100000) {
        const excelSerial = Number(str);
        const date = new Date((excelSerial - 25569) * 86400 * 1000);
        // Use UTC parts to avoid timezone shifting
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }

    // Fix: Handle YYYY-MM-DD manually to avoid Timezone offset issues
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const parts = str.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // If already looks like DD/MM/YYYY, leave it alone
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
        return str;
    }

    const date = new Date(str);
    if (isNaN(date.getTime())) return str;

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

interface ProjectDetailProps {
    project: ResearchProject;
    userEmail: string;
    onBack: () => void;
    onUpdate: () => void; // Refresh data
    onEdit: (p: ResearchProject) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, userEmail, onBack, onUpdate, onEdit }) => {
    const currentStep = project.workflowStep || 1;
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStepClick = async (stepIndex: number) => {
        // If clicking a different step, scroll to its todo list
        const todoElement = document.getElementById(`todo-section-${stepIndex}`);
        if (todoElement) {
            todoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (stepIndex === currentStep) return;

        // Determine direction
        const isRevert = stepIndex < currentStep;
        const action = isRevert ? 'quay lại' : 'chuyển đến';

        if (!window.confirm(`Bạn có chắc chắn muốn ${action} bước: "${WORKFLOW_STEPS[stepIndex - 1]?.label}"?`)) {
            return;
        }

        setIsUpdating(true);
        try {
            await workflowService.setWorkflowStep(project.id, stepIndex, userEmail, isRevert);
            onUpdate();
        } catch (error) {
            console.error("Workflow update failed", error);
            alert("Cập nhật quy trình thất bại. Vui lòng thử lại.");
        } finally {
            setIsUpdating(false);
        }
    };

    // Summary Editing Logic
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<ResearchProject>>({});

    const handleEditSummary = () => {
        setEditData({ ...project });
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditData({});
    };

    const handleSaveSummary = async () => {
        if (!editData) return;
        setIsUpdating(true);
        try {
            const updatedProject = { ...project, ...editData } as ResearchProject;
            await dbService.saveProject(updatedProject);
            onUpdate();
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save summary:", error);
            alert("Lưu thông tin thất bại.");
        } finally {
            setIsUpdating(false);
        }
    };

    // Helper to handle input changes
    const handleInputChange = (field: keyof ResearchProject, value: any) => {
        setEditData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-slate-800 break-words">{project.title}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{project.projectCode || 'Chưa có mã'}</span>
                            <span>•</span>
                            <span className="font-semibold text-blue-600">{project.leadAuthor}</span>
                            {project.contractId && (
                                <>
                                    <span>•</span>
                                    <span className="font-mono">{project.contractId}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Navigation buttons removed. Use timeline click interaction instead. */}
                    <span className="text-xs text-slate-400 italic">Nhấp vào nhiệm vụ trong biểu đồ để chuyển bước</span>
                    {currentStep >= WORKFLOW_STEPS.length && (
                        <span className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-lg border border-emerald-200">
                            Đã hoàn thành quy trình
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="w-full space-y-6">
                    {/* Main Workflow Timeline */}
                    <div className="w-full space-y-6">
                        <WorkflowTimeline
                            project={project}
                            currentStep={currentStep}
                            history={project.workflowHistory}
                            projectTodos={project.workflowTodos || []}
                            projectStartDate={project.startDate}
                            projectEndDate={project.endDate}
                            onStepClick={handleStepClick}
                        />

                        {/* Detailed Project Info Summary */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Thông tin chi tiết đề tài
                                </h3>
                                <div>
                                    <button
                                        onClick={() => onEdit(project)}
                                        className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        Chỉnh sửa thông tin
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                {/* I. Thông tin chung */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-l-4 border-blue-500 pl-2">I. Thông tin chung</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        <div className="md:col-span-3 lg:col-span-4 flex items-center justify-between">
                                            <InfoField label="Tên đề tài" isEditing={isEditing} value={isEditing ? editData.title : project.title} onChange={v => handleInputChange('title', v)} className="flex-1" />
                                            {!isEditing && (
                                                <div className="ml-4 text-right">
                                                    <span className="block text-slate-500 mb-1 text-[11px] font-bold uppercase tracking-tight">Trạng thái đề tài</span>
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${currentStep < 10 ? 'text-blue-600 bg-blue-50 border-blue-100' :
                                                        currentStep < 15 ? 'text-amber-600 bg-amber-50 border-amber-100' :
                                                            currentStep < 20 ? 'text-purple-600 bg-purple-50 border-purple-100' :
                                                                'text-emerald-600 bg-emerald-50 border-emerald-100'
                                                        }`}>
                                                        {currentStep < 10 ? 'Xét duyệt đề cương' :
                                                            currentStep < 15 ? 'Báo cáo tiến độ & giám định' :
                                                                currentStep < 20 ? 'Sắp nghiệm thu' : 'Hoàn thành'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <InfoField label="Chủ nhiệm" isEditing={isEditing} value={isEditing ? editData.leadAuthor : project.leadAuthor} onChange={v => handleInputChange('leadAuthor', v)} />
                                        <InfoField label="Giới tính" isEditing={isEditing} value={isEditing ? editData.leadAuthorGender : project.leadAuthorGender} onChange={v => handleInputChange('leadAuthorGender', v)} />
                                        <InfoField label="Năm sinh" isEditing={isEditing} value={isEditing ? editData.leadAuthorBirthYear : project.leadAuthorBirthYear} onChange={v => handleInputChange('leadAuthorBirthYear', v)} />
                                        <InfoField label="Khoa/Đơn vị" isEditing={isEditing} value={isEditing ? editData.department : project.department} onChange={v => handleInputChange('department', v)} />
                                        <InfoField label="Bộ môn" isEditing={isEditing} value={isEditing ? editData.subDepartment : project.subDepartment} onChange={v => handleInputChange('subDepartment', v)} />
                                        <InfoField label="Lĩnh vực NC" isEditing={isEditing} value={isEditing ? editData.researchField : project.researchField} onChange={v => handleInputChange('researchField', v)} />
                                        <InfoField label="Loại hình NC" isEditing={isEditing} value={isEditing ? editData.researchType : project.researchType} onChange={v => handleInputChange('researchType', v)} />
                                        <div className="md:col-span-1 lg:col-span-1">
                                            <span className="block text-slate-500 mb-1 text-[11px] font-bold uppercase tracking-tight">Loại đề tài</span>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    placeholder="Cách nhau bởi dấu phẩy"
                                                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={editData.categories?.join(', ') || ''}
                                                    onChange={e => handleInputChange('categories', e.target.value.split(',').map(s => s.trim()))}
                                                />
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {project.categories?.map(c => <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 border text-slate-600 font-medium">{c}</span>)}
                                                    {(!project.categories || project.categories.length === 0) && <span className="text-slate-400 italic text-xs">---</span>}
                                                </div>
                                            )}
                                        </div>
                                        <InfoField label="Thành viên NC" isEditing={isEditing} value={isEditing ? editData.members : project.members} onChange={v => handleInputChange('members', v)} className="md:col-span-2 lg:col-span-3" />
                                    </div>
                                </div>

                                {/* II. Hợp đồng & Quyết định */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-l-4 border-emerald-500 pl-2">II. Hợp đồng & Quyết định</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <InfoField label="Số Hợp đồng" isEditing={isEditing} value={isEditing ? editData.contractId : project.contractId} onChange={v => handleInputChange('contractId', v)} />
                                        <InfoField label="Ngày ký HĐ" isEditing={isEditing} type="date" value={isEditing ? editData.contractDate : project.contractDate} onChange={v => handleInputChange('contractDate', v)} />
                                        <InfoField label="QĐ Xét duyệt" isEditing={isEditing} value={isEditing ? editData.approvalDecision : project.approvalDecision} onChange={v => handleInputChange('approvalDecision', v)} />
                                        <InfoField label="QĐ Phê duyệt" isEditing={isEditing} value={isEditing ? editData.authorizationDecision : project.authorizationDecision} onChange={v => handleInputChange('authorizationDecision', v)} />
                                        <InfoField label="Số GCN kết quả" isEditing={isEditing} value={isEditing ? editData.certificateResultNumber : project.certificateResultNumber} onChange={v => handleInputChange('certificateResultNumber', v)} />
                                        <InfoField label="Ngày cấp GCN" isEditing={isEditing} type="date" value={isEditing ? editData.certificateResultDate : project.certificateResultDate} onChange={v => handleInputChange('certificateResultDate', v)} />
                                        <InfoField label="Cơ quan cấp GCN" isEditing={isEditing} value={isEditing ? editData.certificateResultIssuingAuthority : project.certificateResultIssuingAuthority} onChange={v => handleInputChange('certificateResultIssuingAuthority', v)} className="md:col-span-2" />
                                    </div>
                                </div>

                                {/* III. Kinh phí & Phân bổ */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-l-4 border-amber-500 pl-2">III. Kinh phí & Phân bổ (VNĐ)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <InfoField label="Tổng kinh phí" isEditing={isEditing} type="number" value={isEditing ? editData.budget : project.budget} onChange={v => handleInputChange('budget', Number(v))} className="font-bold text-blue-700" isCurrency />
                                        <InfoField label="Kinh phí khoán" isEditing={isEditing} type="number" value={isEditing ? editData.budgetLumpSum : project.budgetLumpSum} onChange={v => handleInputChange('budgetLumpSum', Number(v))} isCurrency />
                                        <InfoField label="Kinh phí không khoán" isEditing={isEditing} type="number" value={isEditing ? editData.budgetNonLumpSum : project.budgetNonLumpSum} onChange={v => handleInputChange('budgetNonLumpSum', Number(v))} isCurrency />
                                        <InfoField label="Nguồn khác" isEditing={isEditing} type="number" value={isEditing ? editData.budgetOtherSources : project.budgetOtherSources} onChange={v => handleInputChange('budgetOtherSources', Number(v))} isCurrency />
                                        <InfoField label="Cấp đợt 1" isEditing={isEditing} type="number" value={isEditing ? editData.budgetBatch1 : project.budgetBatch1} onChange={v => handleInputChange('budgetBatch1', Number(v))} isCurrency />
                                        <InfoField label="Cấp đợt 2" isEditing={isEditing} type="number" value={isEditing ? editData.budgetBatch2 : project.budgetBatch2} onChange={v => handleInputChange('budgetBatch2', Number(v))} isCurrency />
                                        <InfoField label="Cấp đợt 3" isEditing={isEditing} type="number" value={isEditing ? editData.budgetBatch3 : project.budgetBatch3} onChange={v => handleInputChange('budgetBatch3', Number(v))} isCurrency />
                                    </div>
                                </div>

                                {/* IV. Thời gian & Tiến độ */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-l-4 border-purple-500 pl-2">IV. Thời gian & Tiến độ</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        <InfoField label="Thời gian thực hiện" isEditing={isEditing} value={isEditing ? editData.duration : project.duration} onChange={v => handleInputChange('duration', v)} />
                                        <InfoField label="Bắt đầu" isEditing={isEditing} type="date" value={isEditing ? editData.startDate : project.startDate} onChange={v => handleInputChange('startDate', v)} />
                                        <InfoField label="Kết thúc" isEditing={isEditing} type="date" value={isEditing ? editData.endDate : project.endDate} onChange={v => handleInputChange('endDate', v)} />
                                        <InfoField label="Gia hạn" isEditing={isEditing} type="date" value={isEditing ? editData.extensionDate : project.extensionDate} onChange={v => handleInputChange('extensionDate', v)} className="text-amber-600" />
                                        <InfoField label="Tiến độ thực hiện" isEditing={isEditing} value={isEditing ? editData.progressStatus : project.progressStatus} onChange={v => handleInputChange('progressStatus', v)} />
                                        <InfoField label="Báo cáo Giám định" isEditing={isEditing} type="date" value={isEditing ? editData.reviewReportingDate : project.reviewReportingDate} onChange={v => handleInputChange('reviewReportingDate', v)} />
                                        <InfoField label="BC Tiến độ 1" isEditing={isEditing} type="date" value={isEditing ? editData.progressReportDate1 : project.progressReportDate1} onChange={v => handleInputChange('progressReportDate1', v)} />
                                        <InfoField label="BC Tiến độ 2" isEditing={isEditing} type="date" value={isEditing ? editData.progressReportDate2 : project.progressReportDate2} onChange={v => handleInputChange('progressReportDate2', v)} />
                                        <InfoField label="BC Tiến độ 3" isEditing={isEditing} type="date" value={isEditing ? editData.progressReportDate3 : project.progressReportDate3} onChange={v => handleInputChange('progressReportDate3', v)} />
                                        <InfoField label="BC Tiến độ 4" isEditing={isEditing} type="date" value={isEditing ? editData.progressReportDate4 : project.progressReportDate4} onChange={v => handleInputChange('progressReportDate4', v)} />
                                        <InfoField label="Ngày nhắc" isEditing={isEditing} type="date" value={isEditing ? editData.reminderDate : project.reminderDate} onChange={v => handleInputChange('reminderDate', v)} />
                                        <InfoField label="Ghi chú báo cáo" isEditing={isEditing} value={isEditing ? editData.progressReportNote : project.progressReportNote} onChange={v => handleInputChange('progressReportNote', v)} className="md:col-span-2 lg:col-span-3" />
                                    </div>
                                </div>

                                {/* V. Nghiệm thu & Sản phẩm */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-l-4 border-rose-500 pl-2">V. Nghiệm thu & Sản phẩm</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        <InfoField label="Ngày họp NT" isEditing={isEditing} type="date" value={isEditing ? editData.acceptanceMeetingDate : project.acceptanceMeetingDate} onChange={v => handleInputChange('acceptanceMeetingDate', v)} />
                                        <InfoField label="Thời điểm NT" isEditing={isEditing} type="date" value={isEditing ? editData.acceptanceCompletionDate : project.acceptanceCompletionDate} onChange={v => handleInputChange('acceptanceCompletionDate', v)} />
                                        <InfoField label="Năm nghiệm thu" isEditing={isEditing} value={isEditing ? editData.acceptanceYear : project.acceptanceYear} onChange={v => handleInputChange('acceptanceYear', v)} />
                                        <InfoField label="Năm học NT" isEditing={isEditing} value={isEditing ? editData.acceptanceAcademicYear : project.acceptanceAcademicYear} onChange={v => handleInputChange('acceptanceAcademicYear', v)} />
                                        <InfoField label="Sản phẩm đầu ra" isEditing={isEditing} value={isEditing ? editData.outputProduct : project.outputProduct} onChange={v => handleInputChange('outputProduct', v)} className="md:col-span-2 lg:col-span-2" />
                                        <InfoField label="Chi tiết SP thực tế" isEditing={isEditing} value={isEditing ? editData.actualProductDetails : project.actualProductDetails} onChange={v => handleInputChange('actualProductDetails', v)} className="md:col-span-2 lg:col-span-2" />
                                        <div className="md:col-span-2">
                                            <span className="block text-slate-500 mb-1 text-[11px] font-bold uppercase tracking-tight">Sản phẩm cam kết</span>
                                            <div className="flex flex-wrap gap-2">
                                                {project.expectedProducts?.map((p, i) => (
                                                    <span key={i} className="text-xs font-semibold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">{p.type}: {p.count}</span>
                                                ))}
                                                {(!project.expectedProducts || project.expectedProducts.length === 0) && <span className="text-slate-400 italic text-xs">---</span>}
                                            </div>
                                        </div>
                                        <div className="md:col-span-2">
                                            <span className="block text-slate-500 mb-1 text-[11px] font-bold uppercase tracking-tight">Sản phẩm thực tế đạt được</span>
                                            <div className="flex flex-wrap gap-2">
                                                {project.actualProducts?.map((p, i) => (
                                                    <span key={i} className="text-xs font-semibold px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{p.type}: {p.count}</span>
                                                ))}
                                                {(!project.actualProducts || project.actualProducts.length === 0) && <span className="text-slate-400 italic text-xs">---</span>}
                                            </div>
                                        </div>
                                        <InfoField label="Lý do thanh lý" isEditing={isEditing} value={isEditing ? editData.terminationReason : project.terminationReason} onChange={v => handleInputChange('terminationReason', v)} className="md:col-span-2 lg:col-span-2" />
                                        <div className="flex items-center space-x-2 pt-6">
                                            <input
                                                type="checkbox"
                                                id="isTransferred"
                                                checked={isEditing ? !!editData.isTransferred : !!project.isTransferred}
                                                disabled={!isEditing}
                                                onChange={e => handleInputChange('isTransferred', e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="isTransferred" className="text-sm font-bold text-slate-700">Đề tài chuyển tiếp</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* New Section: Task Management (Kanban) - Moved to bottom or full width if needed, 
                    but for now sticking to layout or creating a new row? 
                    The screenshot implies a large area. 
                    Let's move TodoList OUT of the side column and into a full width section below?
                    Or keep the current 2/1 split but put Kanban below?
                */}

            <div className="px-8 pb-8 space-y-8">
                <h2 className="text-xl font-bold text-slate-800 flex items-center px-2">
                    <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    Quản lý nhiệm vụ theo từng bước
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {WORKFLOW_STEPS.map(s => (
                        <WorkflowTodoList
                            key={s.step}
                            project={project}
                            step={s.step}
                            onUpdate={onUpdate}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

// Helper Component for Info Fields
const InfoField: React.FC<{
    label: string,
    value: any,
    isEditing?: boolean,
    type?: string,
    onChange?: (val: any) => void,
    className?: string,
    isCurrency?: boolean,
    isDate?: boolean
}> = ({ label, value, isEditing, type = 'text', onChange, className = '', isCurrency, isDate }) => {
    const displayValue = isCurrency ? (Number(value) || 0).toLocaleString() :
        (type === 'date' || isDate) ? formatDate(value) : (value || '---');

    return (
        <div className={`${className}`}>
            <span className="block text-slate-500 mb-1 text-[11px] font-bold uppercase tracking-tight">{label}</span>
            {isEditing ? (
                <input
                    type={type}
                    className="w-full p-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    value={type === 'date' && value ? new Date(value).toISOString().split('T')[0] : (value || '')}
                    onChange={(e) => onChange?.(e.target.value)}
                />
            ) : (
                <span className={`block font-semibold text-slate-700 break-words ${isCurrency ? 'font-mono text-blue-600' : ''}`}>
                    {displayValue}
                    {isCurrency && value ? ' VNĐ' : ''}
                </span>
            )}
        </div>
    );
};

export default ProjectDetail;
