import React from 'react';
import { currentServiceName } from '../services/db';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
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
    <header className="h-24 bg-white px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm border-b border-slate-200">
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-sm md:text-xl font-bold text-blue-600 tracking-tight truncate max-w-[200px] md:max-w-none">
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

      </div>
    </header>
  );
};

export default Header;
