import React from 'react';
import { ResearchProject } from '../types';
import { workflowService } from '../services/workflowService';
import { WORKFLOW_STEPS } from '../constants/workflow';

interface WorkflowTodoListProps {
    project: ResearchProject;
    step: number;
    onUpdate: () => void;
}

const WorkflowTodoList: React.FC<WorkflowTodoListProps> = ({ project, step, onUpdate }) => {
    const stepInfo = WORKFLOW_STEPS[step - 1];
    const stepDates = project.workflowStepDates?.[step] || {};
    const isCompleted = project.workflowStep ? project.workflowStep > step : false;
    const isCurrent = project.workflowStep === step;

    // Calculate Actual Execution time
    const history = project.workflowHistory || [];
    const entryToStep = history.find(h => h.step === step);
    const entryToNext = history.find(h => h.step > step);

    const historyStart = entryToStep ? (entryToStep.updatedAt?.seconds ? new Date(entryToStep.updatedAt.seconds * 1000) : new Date(entryToStep.updatedAt)) : null;
    const historyEnd = entryToNext ? (entryToNext.updatedAt?.seconds ? new Date(entryToNext.updatedAt.seconds * 1000) : new Date(entryToNext.updatedAt)) : null;

    const formatDateForInput = (date: Date | null) => {
        if (!date || isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const handleStepDateChange = async (type: 'expectedStart' | 'expectedEnd' | 'actualStart' | 'actualEnd', value: string) => {
        try {
            await workflowService.updateStepDates(project.id, step, {
                ...stepDates,
                [type]: value
            });
            onUpdate();
        } catch (error) {
            console.error("Failed to update step dates", error);
        }
    };

    const handleToggleComplete = async () => {
        try {
            if (!isCompleted) {
                await workflowService.setWorkflowStep(project.id, step + 1, 'user');
            } else {
                await workflowService.setWorkflowStep(project.id, step, 'user');
            }
            onUpdate();
        } catch (error) {
            console.error("Failed to toggle completion", error);
        }
    };

    return (
        <div id={`todo-section-${step}`} className={`bg-white p-6 rounded-2xl shadow-sm border transition-all ${isCurrent ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-200'}`}>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1 block">BƯỚC {step}</span>
                    <h3 className="text-base font-bold text-slate-800 leading-tight">
                        {stepInfo?.label}
                    </h3>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <span className={`text-xs font-bold transition-colors ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isCompleted ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                        </span>
                        <input
                            type="checkbox"
                            checked={isCompleted}
                            onChange={() => { }}
                            onClick={(e) => { e.stopPropagation(); handleToggleComplete(); }}
                            className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer shadow-sm transition-transform group-hover:scale-110"
                        />
                    </label>
                </div>
            </div>

            <div className="space-y-6">
                {/* 2. Thời gian dự kiến */}
                <div>
                    <label className="flex items-center text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">
                        <svg className="w-3.5 h-3.5 mr-1.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Thời gian dự kiến
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                                value={stepDates.expectedStart || ''}
                                onChange={(e) => handleStepDateChange('expectedStart', e.target.value)}
                            />
                            <span className="absolute -top-2 left-2 px-1 bg-white text-[9px] text-slate-400 font-bold uppercase">Bắt đầu</span>
                        </div>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-inner"
                                value={stepDates.expectedEnd || ''}
                                onChange={(e) => handleStepDateChange('expectedEnd', e.target.value)}
                            />
                            <span className="absolute -top-2 left-2 px-1 bg-white text-[9px] text-slate-400 font-bold uppercase">Kết thúc</span>
                        </div>
                    </div>
                </div>

                {/* 3. Thời gian thực hiện thực tế */}
                <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-center text-[10px] uppercase font-bold text-amber-500 mb-2 tracking-wider">
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Thời gian thực hiện thực tế
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full bg-amber-50/30 border border-amber-100 rounded-lg px-3 py-2 text-xs font-semibold text-amber-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                value={stepDates.actualStart || formatDateForInput(historyStart)}
                                onChange={(e) => handleStepDateChange('actualStart', e.target.value)}
                            />
                            <span className="absolute -top-2 left-2 px-1 bg-white text-[9px] text-amber-400 font-bold uppercase">Bắt đầu</span>
                        </div>
                        <div className="relative">
                            <input
                                type="date"
                                className="w-full bg-amber-50/30 border border-amber-100 rounded-lg px-3 py-2 text-xs font-semibold text-amber-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                                value={stepDates.actualEnd || formatDateForInput(historyEnd)}
                                onChange={(e) => handleStepDateChange('actualEnd', e.target.value)}
                            />
                            <span className="absolute -top-2 left-2 px-1 bg-white text-[9px] text-amber-400 font-bold uppercase">Kết thúc</span>
                        </div>
                    </div>
                    {(!stepDates.actualStart && historyStart) && (
                        <p className="mt-2 text-[10px] text-amber-600 font-medium italic">* Tự động ghi nhận từ lịch sử hệ thống</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkflowTodoList;
