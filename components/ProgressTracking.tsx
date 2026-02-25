
import React, { useState, useMemo } from 'react';
import { ResearchProject, KanbanTask, KanbanStatus } from '../types';

interface ProgressTrackingProps {
    projects: ResearchProject[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#64748b', '#8b5cf6'];

const DEFAULT_TASKS: KanbanTask[] = [
    {
        id: 't1',
        title: 'Nghiên cứu ứng dụng AI trong chẩn đoán hình ảnh',
        status: 'review',
        priority: 'High',
        date: '2025-05-25',
        user: 'Nguyễn Văn A',
        tag: 'Khoa Y',
        note: 'Cần bổ sung phần tổng quan tài liệu.'
    },
    {
        id: 't2',
        title: 'Khảo sát tác dụng của dược liệu X',
        status: 'report',
        priority: 'Medium',
        date: '2025-05-10',
        user: 'Trần Thị B',
        tag: 'Khoa Dược',
        note: 'Lưu ý kiểm tra số liệu thống kê.'
    },
    {
        id: 't3',
        title: 'Xây dựng mô hình quản lý bệnh viện thông minh',
        status: 'pre_acceptance',
        priority: 'High',
        date: '2025-06-01',
        user: 'Lê Văn C',
        tag: 'Y Tế Công Cộng'
    },
    {
        id: 't4',
        title: 'Nộp báo cáo giám định đợt 1',
        status: 'completed',
        priority: 'Low',
        date: '2025-05-15',
        user: 'Thanh Thảo',
        tag: 'Báo cáo'
    },
];

const formatDate = (dateString?: string | number) => {
    if (!dateString) return '---';
    const str = String(dateString).trim();
    if (!str) return '---';

    if (/^\d+(\.\d+)?$/.test(str) && Number(str) > 20000 && Number(str) < 100000) {
        const excelSerial = Number(str);
        const date = new Date((excelSerial - 25569) * 86400 * 1000);
        const day = date.getUTCDate().toString().padStart(2, '0');
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const parts = str.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

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

const getTagColor = (tag: string) => {
    const colors = [
        { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
        { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
        { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
        { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
        { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
        { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200' },
    ];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const getProjectKanbanStatus = (step: number = 1): KanbanStatus => {
    if (step < 10) return 'review';
    if (step < 15) return 'report';
    if (step < 20) return 'pre_acceptance';
    return 'completed';
};

const ProgressTracking: React.FC<ProgressTrackingProps> = ({ projects }) => {
    const mappedTasks = useMemo(() => {
        return projects.map(p => ({
            id: p.id,
            title: p.title,
            status: getProjectKanbanStatus(p.workflowStep),
            priority: (p.workflowStep || 1) > 15 ? 'High' : 'Medium' as 'High' | 'Medium' | 'Low',
            date: p.endDate || p.startDate,
            startDate: p.startDate,
            endDate: p.endDate,
            categories: p.categories,
            user: p.leadAuthor,
            tag: p.department || p.subDepartment,
            note: p.progressReportNote,
            progressStatus: p.progressStatus
        }));
    }, [projects]);

    const [tasks, setTasks] = useState<KanbanTask[]>([]);
    const [viewMode, setViewMode] = useState<'kanban' | 'calendar'>('kanban');
    const [calendarDate, setCalendarDate] = useState(new Date());
    const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);

    // Sync tasks when projects change
    React.useEffect(() => {
        setTasks(mappedTasks);
    }, [mappedTasks]);

    // New task states
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskUser, setNewTaskUser] = useState('');
    const [newTaskTag, setNewTaskTag] = useState('');
    const [newTaskNote, setNewTaskNote] = useState('');
    const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
    const [addingToColumn, setAddingToColumn] = useState<KanbanStatus | null>(null);

    const onDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const onDrop = (e: React.DragEvent, status: KanbanStatus) => {
        const taskId = e.dataTransfer.getData('taskId');
        // In a real app, we would update the project's workflowStep in Firestore here
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    };

    const addTask = (status: KanbanStatus) => {
        if (!newTaskTitle.trim()) return;
        const newTask: KanbanTask = {
            id: Math.random().toString(36).substr(2, 9),
            title: newTaskTitle,
            user: newTaskUser,
            tag: newTaskTag,
            note: newTaskNote,
            status,
            priority: status === 'review' || status === 'pre_acceptance' ? 'High' : 'Medium',
            date: newTaskDate
        };
        setTasks([...tasks, newTask]);
        setNewTaskTitle('');
        setNewTaskUser('');
        setNewTaskTag('');
        setNewTaskNote('');
        setNewTaskDate(new Date().toISOString().split('T')[0]);
        setAddingToColumn(null);
    };

    const notifications = useMemo(() => {
        const now = new Date();
        const threeMonthsFromNow = new Date();
        threeMonthsFromNow.setMonth(now.getMonth() + 3);

        const dynamicAlerts = projects.flatMap(p => {
            const end = p.endDate ? new Date(p.endDate) : null;
            if (!end || (p.workflowStep || 1) >= 20) return [];

            const alerts = [];
            if (end < now) {
                alerts.push({
                    title: `Đề tài trễ hạn: ${p.title}`,
                    date: `Hạn NT: ${formatDate(p.endDate)}`,
                    tag: 'Trễ hạn',
                    type: 'danger'
                });
            } else if (end <= threeMonthsFromNow) {
                alerts.push({
                    title: `Sắp đến hạn nghiệm thu (3 tháng): ${p.title}`,
                    date: `Hạn NT: ${formatDate(p.endDate)}`,
                    tag: 'Sắp nghiệm thu',
                    type: 'warning'
                });
            }
            return alerts;
        });

        const staticNotifications = [
            { title: 'Gia hạn nộp thuyết minh đề tài cấp Trường đợt 2', date: '20 thg 5, 2024', tag: 'Thông báo', type: 'info' },
            { title: 'Hội thảo khoa học quốc tế: Chuyển đổi số trong giáo dục', date: '15 thg 6, 2024', tag: 'Sự kiện', type: 'info' },
            { title: 'Hướng dẫn thanh quyết toán kinh phí nghiên cứu', date: '12 thg 5, 2024', tag: 'Hướng dẫn', type: 'info' },
        ];

        return [...dynamicAlerts, ...staticNotifications];
    }, [projects]);

    const columns: { id: KanbanStatus; label: string; color: string; border: string; bg: string }[] = [
        { id: 'review', label: 'Xét duyệt đề cương', color: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50/50' },
        { id: 'report', label: 'Báo cáo tiến độ & giám định', color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50/50' },
        { id: 'pre_acceptance', label: 'Sắp nghiệm thu', color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50/50' },
        { id: 'completed', label: 'Hoàn thành', color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50/50' }
    ];

    const calendarDays = useMemo(() => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        const offset = firstDay === 0 ? 6 : firstDay - 1;
        for (let i = 0; i < offset; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    }, [calendarDate]);

    const goToPrevMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
    const goToNextMonth = () => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));

    const getTasksForDate = (date: Date) => {
        const dStr = date.toISOString().split('T')[0];
        return tasks.filter(t => t.date === dStr);
    };

    return (
        <div className="space-y-4 animate-fadeIn pb-20 relative">
            <div className="grid grid-cols-1 gap-6 pt-1 pb-4">
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-slate-800 text-left">Thông báo & Sự kiện</h2>
                        <button className="text-blue-600 text-[10px] font-bold hover:underline">Xem tất cả</button>
                    </div>
                    <div className="space-y-3">
                        {notifications.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-start p-3 rounded-[16px] bg-slate-50/50 hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group text-left w-full">
                                <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase mb-2 inline-block ${item.tag === 'Trễ hạn' ? 'bg-red-100 text-red-700' :
                                    item.tag === 'Sắp nghiệm thu' ? 'bg-amber-100 text-amber-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {item.tag}
                                </div>
                                <div className="w-full">
                                    <h4 className={`font-bold text-xs leading-relaxed mb-1 text-left ${item.tag === 'Trễ hạn' ? 'text-red-800' :
                                        item.tag === 'Sắp nghiệm thu' ? 'text-amber-800' :
                                            'text-slate-800 group-hover:text-blue-600'
                                        }`}>{item.title}</h4>
                                    <p className="text-[10px] text-slate-400 font-medium text-left">{item.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Tiến độ thực hiện
                </h2>

                <div className="bg-slate-200/50 p-1.5 rounded-2xl flex items-center space-x-1 self-start">
                    <button
                        onClick={() => setViewMode('kanban')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Kanban
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Lịch
                    </button>
                </div>
            </div>

            {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fadeIn">
                    {columns.map(col => (
                        <div
                            key={col.id}
                            className={`rounded-[32px] border ${col.border} ${col.bg} p-6 flex flex-col min-h-[600px] transition-all`}
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, col.id)}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className={`font-bold uppercase tracking-widest text-xs ${col.color}`}>{col.label}</h3>
                                <span className="bg-white/80 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-black text-slate-400">
                                    {tasks.filter(t => t.status === col.id).length}
                                </span>
                            </div>

                            <div className="flex-1 space-y-4">
                                {tasks.filter(t => t.status === col.id).map(task => {
                                    const tagStyle = task.tag ? getTagColor(task.tag) : null;
                                    return (
                                        <div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, task.id)}
                                            onClick={() => setSelectedTask(task)}
                                            className="bg-white p-5 rounded-[20px] shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group animate-fadeIn"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                    }`}>
                                                    {task.priority === 'High' ? 'KHẨN' : 'THƯỜNG'}
                                                </span>
                                                <div className="flex items-center text-[10px] text-slate-400 font-bold">
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {formatDate(task.endDate)}
                                                </div>
                                            </div>

                                            <p className="text-sm font-bold text-slate-800 leading-snug group-hover:text-blue-600 transition-colors mb-3">
                                                {task.title}
                                            </p>

                                            {/* Categories */}
                                            {task.categories && task.categories.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {task.categories.map(c => (
                                                        <span key={c} className="text-[9px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-bold uppercase">
                                                            {c}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-2 mb-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-slate-400 font-bold uppercase text-[9px]">Bắt đầu:</span>
                                                    <span className="text-slate-600 font-bold">{formatDate(task.startDate)}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-slate-400 font-bold uppercase text-[9px]">Kết thúc:</span>
                                                    <span className="text-slate-700 font-black">{formatDate(task.endDate)}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {task.tag && tagStyle && (
                                                    <span className={`px-2.5 py-1 ${tagStyle.bg} ${tagStyle.text} text-[10px] font-bold rounded-lg border ${tagStyle.border}`}>
                                                        {task.tag}
                                                    </span>
                                                )}
                                                {task.user && (
                                                    <span className="px-2.5 py-1 bg-white text-slate-600 text-[10px] font-bold rounded-lg flex items-center border border-slate-200 shadow-sm">
                                                        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 flex items-center justify-center text-[8px] text-white">
                                                            {task.user.charAt(0)}
                                                        </div>
                                                        {task.user}
                                                    </span>
                                                )}
                                            </div>
                                            {task.note && (
                                                <div className="text-[10px] text-slate-400 bg-white p-2.5 rounded-xl border border-slate-100 italic line-clamp-2">
                                                    "{task.note}"
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6">
                                {addingToColumn === col.id ? (
                                    <div className="space-y-4 p-5 bg-white rounded-[24px] shadow-2xl border border-blue-100 animate-slideUp">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tên đề tài *</label>
                                            <textarea
                                                autoFocus
                                                className="w-full p-3 text-sm rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none transition-all"
                                                rows={2}
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Chủ nhiệm đề tài</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 outline-none"
                                                    placeholder="Chủ nhiệm..."
                                                    value={newTaskUser}
                                                    onChange={(e) => setNewTaskUser(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Khoa/Đơn vị</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 outline-none"
                                                    placeholder="VD: Khoa Y..."
                                                    value={newTaskTag}
                                                    onChange={(e) => setNewTaskTag(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hạn hoàn thành</label>
                                            <input
                                                type="date"
                                                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:ring-4 focus:ring-blue-100 outline-none"
                                                value={newTaskDate}
                                                onChange={(e) => setNewTaskDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => addTask(col.id)}
                                                className="flex-1 bg-blue-600 text-white text-xs font-black py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition active:scale-95"
                                            >
                                                Lưu Công việc
                                            </button>
                                            <button
                                                onClick={() => setAddingToColumn(null)}
                                                className="px-4 py-3 text-slate-400 hover:bg-slate-50 rounded-xl font-bold text-xs"
                                            >
                                                Đóng
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setAddingToColumn(col.id);
                                            setNewTaskTitle('');
                                            setNewTaskUser('');
                                            setNewTaskTag('');
                                            setNewTaskNote('');
                                            setNewTaskDate(new Date().toISOString().split('T')[0]);
                                        }}
                                        className="w-full py-4 rounded-[20px] border-2 border-dashed border-slate-200 text-slate-400 text-xs font-black flex items-center justify-center hover:bg-white hover:border-blue-400 hover:text-blue-500 transition-all group"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                                        </svg>
                                        TẠO TASK MỚI
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {viewMode === 'calendar' && (
                <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
                    <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <button onClick={goToPrevMonth} className="p-3 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-slate-200 transition">
                                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                <button onClick={goToNextMonth} className="p-3 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-slate-200 transition">
                                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                                Tháng {calendarDate.getMonth() + 1} / {calendarDate.getFullYear()}
                            </h3>
                        </div>
                        <button
                            onClick={() => setCalendarDate(new Date())}
                            className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-2xl text-xs font-black hover:bg-blue-100 transition"
                        >
                            VỀ HÔM NAY
                        </button>
                    </div>

                    <div className="grid grid-cols-7 text-center border-b border-slate-100 bg-slate-50/50">
                        {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'C.Nhật'].map(d => (
                            <div key={d} className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 bg-slate-100 gap-[1px]">
                        {calendarDays.map((date, idx) => {
                            const dayTasks = date ? getTasksForDate(date) : [];
                            const isToday = date && date.toDateString() === new Date().toDateString();
                            return (
                                <div key={idx} className={`min-h-[160px] bg-white p-4 flex flex-col group relative ${!date ? 'bg-slate-50/30' : ''}`}>
                                    {date && (
                                        <>
                                            <div className={`text-sm font-black mb-3 flex items-center justify-center w-8 h-8 rounded-full transition-all ${isToday ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50'}`}>
                                                {date.getDate()}
                                            </div>
                                            <div className="space-y-1.5 overflow-y-auto max-h-[110px] no-scrollbar">
                                                {dayTasks.map(task => (
                                                    <button
                                                        key={task.id}
                                                        onClick={() => setSelectedTask(task)}
                                                        className={`w-full px-3 py-1.5 rounded-lg text-[10px] font-bold truncate border shadow-sm text-left transition hover:brightness-95 active:scale-95 ${task.status === 'review' ? 'bg-blue-500 text-white border-blue-600' :
                                                            task.status === 'report' ? 'bg-amber-400 text-white border-amber-500' :
                                                                task.status === 'pre_acceptance' ? 'bg-purple-500 text-white border-purple-600' :
                                                                    'bg-emerald-500 text-white border-emerald-600'
                                                            }`}
                                                        title={task.title}
                                                    >
                                                        {task.title.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {selectedTask && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-slideUp">
                        <div className={`p-8 ${selectedTask.status === 'review' ? 'bg-blue-600 dashed-border-b border-blue-400' :
                            selectedTask.status === 'report' ? 'bg-amber-500 dashed-border-b border-amber-400' :
                                selectedTask.status === 'pre_acceptance' ? 'bg-purple-600 dashed-border-b border-purple-400' :
                                    'bg-emerald-600 dashed-border-b border-emerald-400'
                            } text-white flex justify-between items-start`}>
                            <div>
                                <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">
                                    Chi tiết Công việc
                                </span>
                                <h3 className="text-2xl font-black leading-tight">{selectedTask.title}</h3>
                            </div>
                            <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white/10 rounded-full transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chủ nhiệm đề tài</label>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs">
                                            {selectedTask.user?.charAt(0)}
                                        </div>
                                        <span className="font-bold text-slate-700">{selectedTask.user || '---'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời hạn</label>
                                    <div className="flex items-center space-x-2 text-slate-700">
                                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="font-bold">{formatDate(selectedTask.date)}</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trạng thái</label>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block ${selectedTask.status === 'review' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        selectedTask.status === 'report' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            selectedTask.status === 'pre_acceptance' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                                'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        }`}>
                                        {selectedTask.status === 'review' ? 'XÉT DUYỆT ĐỀ CƯƠNG' :
                                            selectedTask.status === 'report' ? 'BÁO CÁO TIẾN ĐỘ & GIÁM ĐỊNH' :
                                                selectedTask.status === 'pre_acceptance' ? 'SẮP NGHIỆM THU' :
                                                    'HOÀN THÀNH'}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Khoa/Đơn vị</label>
                                    {selectedTask.tag ? (
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getTagColor(selectedTask.tag).bg} ${getTagColor(selectedTask.tag).text} ${getTagColor(selectedTask.tag).border}`}>
                                            {selectedTask.tag}
                                        </span>
                                    ) : <span className="text-slate-400 italic text-xs">Không có đơn vị</span>}
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tiến độ hạn</label>
                                    {selectedTask.progressStatus ? (
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border inline-block ${selectedTask.progressStatus === 'Trễ hạn' ? 'bg-red-50 text-red-600 border-red-100' :
                                                selectedTask.progressStatus === 'Gia hạn' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            {selectedTask.progressStatus.toUpperCase()}
                                        </span>
                                    ) : (
                                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase inline-block">
                                            ĐÚNG HẠN
                                        </span>
                                    )}
                                </div>
                            </div>

                            {selectedTask.note && (
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ghi chú</label>
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-slate-600 text-sm leading-relaxed italic">
                                        "{selectedTask.note}"
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="px-10 py-3.5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition active:scale-95"
                            >
                                ĐÓNG CHI TIẾT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProgressTracking;
