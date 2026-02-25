import React, { useMemo, useRef, useEffect } from 'react';
import { WORKFLOW_STEPS } from '../constants/workflow';
import { ResearchProject } from '../types';

interface WorkflowTimelineProps {
    project: ResearchProject;
    currentStep: number;
    history?: { step: number; updatedBy: string; updatedAt: any }[];
    projectTodos?: ResearchProject['workflowTodos'];
    projectStartDate?: string;
    projectEndDate?: string;
    onStepClick?: (step: number) => void;
}

const parseDate = (dateString?: string | number): Date => {
    if (!dateString) return new Date();
    const str = String(dateString).trim();
    if (!str) return new Date();

    // Handle Excel serial numbers (e.g. 45000)
    if (/^\d+(\.\d+)?$/.test(str) && Number(str) > 20000 && Number(str) < 100000) {
        const excelSerial = Number(str);
        return new Date((excelSerial - 25569) * 86400 * 1000);
    }

    // Handle DD/MM/YYYY
    if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})/.test(str)) {
        const parts = str.split('/');
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }

    // Handle YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const parts = str.split('-');
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }

    const date = new Date(str);
    return isNaN(date.getTime()) ? new Date(0) : date; // Use epoch for invalid dates
};

const formatDateSimple = (date: Date) => {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({ project, currentStep, history, projectTodos, projectStartDate, projectEndDate, onStepClick }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Initialize Dates
    const { startDate, endDate, totalDays } = useMemo(() => {
        const start = parseDate(projectStartDate);
        const end = projectEndDate ? parseDate(projectEndDate) : new Date(start.getTime() + 365 * 24 * 60 * 60 * 1000); // Default 1 year

        // Add 1 month buffer
        const viewStart = new Date(start);
        viewStart.setMonth(viewStart.getMonth() - 1);
        const viewEnd = new Date(end);
        viewEnd.setMonth(viewEnd.getMonth() + 1);

        const diffTime = Math.abs(viewEnd.getTime() - viewStart.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { startDate: viewStart, endDate: viewEnd, totalDays: days || 365 };
    }, [projectStartDate, projectEndDate]);

    // Calculate Step Positions
    const stepsWithDates = useMemo(() => {
        let lastDate = startDate;
        const today = new Date();

        return WORKFLOW_STEPS.map((step) => {
            const stepIndex = step.step;
            const historyEntry = history?.slice().reverse().find(h => h.step === stepIndex);

            const stepDates = project.workflowStepDates?.[stepIndex];
            const todosForStep = projectTodos?.filter(t => t.step === stepIndex) || [];

            // Priority: Step level dates > Todo dates > Fallback
            let stepStart = stepDates?.expectedStart ? parseDate(stepDates.expectedStart) :
                (todosForStep.length > 0 ? new Date(Math.min(...todosForStep.map(t => parseDate(t.startDate || projectStartDate).getTime()))) : lastDate);

            let stepEnd = stepDates?.expectedEnd ? parseDate(stepDates.expectedEnd) :
                (todosForStep.length > 0 ? new Date(Math.max(...todosForStep.map(t => parseDate(t.endDate || projectEndDate).getTime()))) : lastDate);

            // Calculate Actual Dates from History
            let actualStart: Date | null = null;
            let actualEnd: Date | null = null;

            // Actual Start: When the step was transitioned TO
            const entryToStep = history?.find(h => h.step === stepIndex);
            if (entryToStep) {
                actualStart = new Date(entryToStep.updatedAt?.seconds ? entryToStep.updatedAt.seconds * 1000 : entryToStep.updatedAt);
            }

            // Actual End: When the step was transitioned AWAY FROM (to a later step)
            const entryToNext = history?.find(h => h.step > stepIndex);
            if (entryToNext) {
                actualEnd = new Date(entryToNext.updatedAt?.seconds ? entryToNext.updatedAt.seconds * 1000 : entryToNext.updatedAt);
            }

            let status: 'completed' | 'current' | 'upcoming' = 'upcoming';

            if (stepIndex < currentStep) {
                status = 'completed';
            } else if (stepIndex === currentStep) {
                status = 'current';
            } else {
                status = 'upcoming';
            }

            // Fallback for duration if no dates found
            if (stepEnd <= stepStart) stepEnd = new Date(stepStart.getTime() + 15 * 24 * 60 * 60 * 1000);

            // Update lastDate for next step
            lastDate = stepEnd;

            // Calculate Position %
            const startOffset = Math.max(0, stepStart.getTime() - startDate.getTime());
            const duration = Math.max(0, stepEnd.getTime() - stepStart.getTime());

            const totalMs = totalDays * 24 * 60 * 60 * 1000;
            const left = (startOffset / totalMs) * 100;
            const width = Math.max(0.5, (duration / totalMs) * 100); // Min 0.5% visibility

            return {
                ...step,
                status,
                left,
                width,
                startDate: stepStart,
                endDate: stepEnd,
                historyEntry
            };
        });
    }, [startDate, totalDays, history, currentStep, projectTodos, project.workflowStepDates]);

    // Generate Month Headers
    const monthHeaders = useMemo(() => {
        const months = [];
        const current = new Date(startDate);
        current.setDate(1); // Start of month

        while (current <= endDate) {
            const left = ((current.getTime() - startDate.getTime()) / (totalDays * 24 * 60 * 60 * 1000)) * 100;
            if (left >= 0 && left <= 100) {
                months.push({
                    label: current.toLocaleString('vi-VN', { month: 'short', year: '2-digit' }),
                    left
                });
            }
            current.setMonth(current.getMonth() + 1);
        }
        return months;
    }, [startDate, endDate, totalDays]);

    // Current Date Marker
    const todayLeft = useMemo(() => {
        const today = new Date();
        if (today < startDate || today > endDate) return -1;
        return ((today.getTime() - startDate.getTime()) / (totalDays * 24 * 60 * 60 * 1000)) * 100;
    }, [startDate, endDate, totalDays]);

    // Scroll to current step on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            // Center roughly around today
            const scrollWidth = scrollContainerRef.current.scrollWidth;
            const clientWidth = scrollContainerRef.current.clientWidth;
            if (todayLeft > 0) {
                const scrollPos = (todayLeft / 100) * scrollWidth - clientWidth / 2;
                scrollContainerRef.current.scrollLeft = scrollPos;
            }
        }
    }, [todayLeft]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col min-h-[600px] w-[100%]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">Tiến độ thực hiện (Gantt Chart)</h3>
                <div className="flex gap-4 text-xs font-semibold">
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span> Đã hoàn thành</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span> Đang thực hiện</div>
                    <div className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200"></span> Dự kiến</div>
                </div>
            </div>

            <div className="flex flex-1 w-[100%] relative">
                {/* Fixed Sidebar */}
                <div className="w-[300px] flex-shrink-0 border-r border-slate-100 bg-white z-20 hidden md:block relative">
                    <div className="sticky top-0 bg-slate-50 border-b border-slate-100 h-10 flex items-center px-4 font-bold text-xs text-slate-500 uppercase tracking-wider z-10">
                        Nhiệm vụ
                    </div>
                    <div className="relative">
                        {stepsWithDates.map((step) => (
                            <div
                                key={step.step}
                                onClick={() => onStepClick && onStepClick(step.step)}
                                className="h-12 border-b border-slate-50 flex items-center px-4 hover:bg-slate-50 group transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3 w-full">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0
                                    ${step.status === 'completed' ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                                            step.status === 'current' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                        {step.status === 'completed' ? '✓' : step.step}
                                    </div>
                                    <span className={`text-sm truncate font-medium flex-1 ${step.status === 'upcoming' ? 'text-slate-400' : 'text-slate-700'}`} title={step.label}>
                                        {step.label}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scrollable Timeline */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50/30 relative" ref={scrollContainerRef}>
                    <div className="min-w-[800px] h-full relative" style={{ width: '200%' }}> {/* Force horizontal scroll */}

                        {/* Timeline Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 h-10 z-10 w-full relative">
                            {monthHeaders.map((m, i) => (
                                <div key={i} className="absolute top-0 bottom-0 border-l border-slate-100 px-2 text-[10px] font-bold text-slate-400 flex items-center" style={{ left: `${m.left}%` }}>
                                    {/* Month label removed per user request */}
                                </div>
                            ))}
                        </div>

                        {/* Grid Lines (Vertical) */}
                        <div className="absolute top-10 bottom-0 left-0 right-0 pointer-events-none">
                            {monthHeaders.map((m, i) => (
                                <div key={i} className="absolute top-0 bottom-0 border-l border-dashed border-slate-200" style={{ left: `${m.left}%` }}></div>
                            ))}
                            {/* Today Marker */}
                            {todayLeft >= 0 && (
                                <div className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-30" style={{ left: `${todayLeft}%` }}>
                                    <div className="absolute -top-1 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-bold px-1 rounded">Hôm nay</div>
                                </div>
                            )}
                        </div>

                        {/* Bars Rows */}
                        <div className="relative pt-0"> {/* Adjusted padding */}
                            {stepsWithDates.map((step) => (
                                <div
                                    key={step.step}
                                    onClick={() => onStepClick && onStepClick(step.step)}
                                    className="h-12 border-b border-slate-100/50 flex items-center relative group hover:bg-white/50 transition-colors cursor-pointer"
                                >
                                    {/* Bar Wrapper */}
                                    <div className="absolute top-2 bottom-2 bg-slate-100/0 rounded w-full h-8 group/bar">
                                        <div
                                            className={`h-4 mt-2 rounded-full absolute shadow-sm transition-all duration-500
                                                    ${step.status === 'completed' ? 'bg-emerald-500' :
                                                    step.status === 'current' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300 opacity-60'}`}
                                            style={{ left: `${step.left}%`, width: `${step.width}%` }}
                                            title={step.label}
                                        >
                                            {/* Hover info - time removed per user request */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none transition-opacity">
                                                {step.label}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkflowTimeline;
