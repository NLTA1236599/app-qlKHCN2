import { useState } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const NotificationComponent = () => {
    if (!notification) return null;

    return (
      <div className="fixed top-20 right-6 z-[100] animate-slideDown">
        <div className="bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center space-x-3 border border-blue-400">
          <div className="bg-blue-500 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="max-w-xs">
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Thông báo hệ thống</p>
            <p className="text-sm font-medium">{notification}</p>
          </div>
          <button onClick={() => setNotification(null)} className="ml-4 opacity-60 hover:opacity-100">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  return { notification, showNotification, NotificationComponent };
};
