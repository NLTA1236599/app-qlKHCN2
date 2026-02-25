
import React from 'react';
import { User } from '../types';
import { currentServiceName } from '../services/db';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, toggleSidebar }) => {
  const isLocalMode = currentServiceName.includes('Local');

  const toggleDBMode = () => {
    if (isLocalMode) {
      if (window.confirm('Chuyển sang chế độ Đồng bộ Cloud (Firebase/Sheets)?')) {
        localStorage.removeItem('FORCE_LOCAL_DB');
        window.location.reload();
      }
    } else {
      if (window.confirm('Chuyển sang chế độ Local (Dữ liệu chỉ lưu trên máy này)?')) {
        localStorage.setItem('FORCE_LOCAL_DB', 'true');
        window.location.reload();
      }
    }
  };

  return (
    <header className="h-24 bg-blue-600 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 shadow-md">
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-white p-2 rounded-lg hover:bg-blue-500 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-sm md:text-xl font-bold text-white tracking-tight truncate max-w-[200px] md:max-w-none">
          Hệ thống quản lý Dự án KHCN
        </h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-6">

        {/* DB Toggle */}
        <button
          onClick={toggleDBMode}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border ${isLocalMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'} transition-all hover:brightness-110 shadow-sm`}
          title={`Click để chuyển đổi Database. Hiện tại: ${currentServiceName}`}
        >
          <div className={`w-2 h-2 rounded-full ${isLocalMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <span className="text-[10px] font-black uppercase tracking-wider hidden md:block">
            {isLocalMode ? 'Local Mode' : 'Cloud Mode'}
          </span>
        </button>

        <div className="flex items-center space-x-2 md:space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs md:text-sm font-bold text-white leading-tight capitalize">{user.username}</p>
            <p className="text-[10px] text-blue-100 uppercase tracking-tighter">{user.role}</p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center border border-blue-400 shadow-inner">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-blue-100 hover:text-white transition-colors p-2 rounded-lg hover:bg-blue-500"
          title="Đăng xuất"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
