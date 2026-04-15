
import React, { useState } from 'react';
import { ViewType, User } from '../types';

interface SidebarProps {
  currentView: ViewType;
  setView: (view: ViewType) => void;
  isOpen?: boolean;
  userRole?: string;
  user?: User;
  onLogout?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  children?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, userRole, user, onLogout }) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['progress_tracking']);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Tổng quan', icon: 'M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z' },
    { id: 'overview', label: 'Quản lý đề tài', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    {
      id: 'progress_tracking',
      label: 'Tiến độ thực hiện',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
    },

    { id: 'table', label: 'Dữ liệu nghiên cứu', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { id: 'entry', label: 'Nhập dữ liệu mới', icon: 'M12 4v16m8-8H4' },
    { id: 'workflow_process', label: 'Quy trình thực hiện', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M12 11l2 2-2 2m-2-2l2-2' },
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (userRole === 'admin') return true;
    if (userRole === 'leader') {
      return ['dashboard', 'overview'].includes(item.id);
    }
    if (userRole === 'specialist') {
      return ['overview', 'progress_tracking', 'table', 'entry', 'workflow_process'].includes(item.id);
    }
    if (userRole === 'author') {
      return ['entry', 'workflow_process'].includes(item.id);
    }
    return true; // Default
  });

  return (
    <aside className={`fixed inset-y-0 left-0 lg:static w-72 bg-white text-slate-700 border-r border-slate-200 flex flex-col h-screen z-50 transition-transform duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
      <div className="p-6 flex items-center space-x-3 bg-white text-blue-600 mb-4 border-b border-slate-100">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <span className="font-bold text-2xl tracking-tight">UMP-RMS</span>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          // Check if any child is active to highlight parent
          const isActive = item.id === currentView || item.children?.some(c => c.id === currentView);
          const isExpanded = expandedGroups.includes(item.id);

          if (item.children) {
            return (
              <div key={item.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'text-blue-600' : 'hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <div className="flex items-center space-x-3">
                    <svg className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                    </svg>
                    <span className="font-medium text-sm md:text-base">{item.label}</span>
                  </div>
                  <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="pl-4 space-y-1">
                    {item.children.map(child => (
                      <button
                        key={child.id}
                        onClick={() => setView(child.id as ViewType)}
                        className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-sm ${currentView === child.id
                          ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 border border-blue-100'
                          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                      >
                        <svg className="w-4 h-4 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={child.icon} />
                        </svg>
                        <span>{child.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewType)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${currentView === item.id
                ? 'bg-white text-blue-600 shadow-md shadow-blue-500/20 border border-blue-100'
                : 'hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
              </svg>
              <span className="font-medium text-sm md:text-base">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {user && (
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm group transition-all hover:bg-slate-100">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="w-10 h-10 bg-white rounded-full flex flex-shrink-0 items-center justify-center border border-blue-200 shadow-sm">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left overflow-hidden">
                <p className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[120px]" title={user.username}>{user.username}</p>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{user.role}</p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-slate-500 hover:text-red-600 transition-colors p-2.5 rounded-lg hover:bg-red-50 flex-shrink-0 group-hover:scale-105"
                title="Đăng xuất"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
