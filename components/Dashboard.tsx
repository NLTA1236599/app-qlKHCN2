
import React, { useMemo } from 'react';
import { ResearchProject, ProjectStatus, ViewType } from '../types';

interface DashboardProps {
  projects: ResearchProject[];
  onNavigate: (view: ViewType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, onNavigate }) => {
  const stats = useMemo(() => {
    const total = projects.length;
    const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const ongoing = projects.filter(p => (p.workflowStep || 0) < 20).length;
    const pending = projects.filter(p => (p.workflowStep || 0) < 10).length;

    return {
      total,
      totalBudget: (totalBudget / 1000000000).toFixed(2), // Billion VND
      ongoing,
      pending
    };
  }, [projects]);

  const modules = [
    { id: 'projects', label: 'Quản lý Dự án KHCN', description: 'Theo dõi tiến trình, kinh phí & sản phẩm đề tài', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', color: 'bg-blue-600', shadow: 'shadow-blue-200' },
    { id: 'initiatives', label: 'Quản lý Sáng kiến', description: 'Đăng ký và xét duyệt các sáng kiến cải tiến', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', color: 'bg-sky-500', shadow: 'shadow-sky-100' },
    { id: 'ethics', label: 'Quản lý Hồ sơ Y đức', description: 'Thẩm định đạo đức trong nghiên cứu y sinh', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'bg-teal-500', shadow: 'shadow-teal-100' },
    { id: 'publications', label: 'Quản lý bài báo quốc tế', description: 'Thống kê ISI/Scopus và khen thưởng công bố', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'bg-indigo-600', shadow: 'shadow-indigo-200' },
    { id: 'hours', label: 'Quản lý giờ NCKH', description: 'Theo dõi giờ định mức và thực tế của giảng viên', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-amber-500', shadow: 'shadow-amber-100' },
    { id: 'conferences', label: 'Hội nghị hội thảo', description: 'Tổ chức và quản lý sự kiện khoa học công nghệ', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'bg-rose-500', shadow: 'shadow-rose-100' },
    { id: 'stats', label: 'Thống kê dữ liệu', description: 'Báo cáo thông minh và phân tích số liệu tổng hợp', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z', color: 'bg-slate-700', shadow: 'shadow-slate-200' },
  ];

  const recentProjects = useMemo(() => {
    return projects.slice(0, 5).map(p => ({
      id: p.id,
      title: p.title,
      author: p.leadAuthor,
      progress: Math.min(Math.round((p.workflowStep || 1) * 5), 100),
      status: p.workflowStep && p.workflowStep >= 20 ? 'Hoàn thành' : 'Đang thực hiện'
    }));
  }, [projects]);

  return (
    <div className="space-y-8 animate-fadeIn pb-20">
      {/* Header Hub Section */}
      <div className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase">Hệ thống Quản lý Khoa học <span className="text-blue-600">UMP</span></h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-[0.3em]">Đại học Y Dược Thành phố Hồ Chí Minh</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-900 text-white px-6 py-4 rounded-[24px] shadow-xl">
              <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Phiên bản</span>
              <span className="text-xl font-black">ENT 2.0</span>
            </div>
          </div>
        </div>

      </div>

      {/* Module Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.id}
            onClick={() => mod.id === 'projects' && onNavigate('overview')}
            className="bg-white p-7 rounded-[40px] shadow-sm border border-slate-100 flex flex-col items-start hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group animate-fadeIn"
          >
            <div className={`${mod.color} w-14 h-14 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg ${mod.shadow} group-hover:scale-110 transition-transform duration-300`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mod.icon} />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight">{mod.label}</h3>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-8 leading-relaxed overflow-hidden line-clamp-2">{mod.description}</p>
            <div className="mt-auto w-full flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Khám phá ngay</span>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Work-in-progress Section */}
      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-8 px-2">
          <h2 className="text-xl font-black text-slate-800 flex items-center uppercase tracking-tight">
            <span className="w-1.5 h-7 bg-blue-600 rounded-full mr-3"></span>
            Tiến trình dự án hiện tại (Work-in-progress)
          </h2>
          <button className="px-5 py-2.5 bg-slate-50 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition">Xem dòng thời gian</button>
        </div>

        <div className="space-y-4">
          {recentProjects.map((proj, idx) => (
            <div key={proj.id} className="flex items-center gap-6 p-5 rounded-[32px] bg-slate-50 group hover:bg-white hover:shadow-xl hover:shadow-blue-900/5 transition-all animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 font-black text-sm shadow-sm border border-slate-100">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-slate-800 text-sm truncate uppercase tracking-tighter mb-1">{proj.title}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none shrink-0 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  Chủ nhiệm: {proj.author}
                </p>
              </div>
              <div className="w-48 hidden md:block">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Tiến độ</span>
                  <span className="text-[9px] font-black text-blue-600">{proj.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${proj.progress}%` }}></div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${proj.status === 'Hoàn thành' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                  }`}>
                  {proj.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
