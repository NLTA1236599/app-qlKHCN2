
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (username: string, pass: string) => Promise<boolean>;
  onRegister: (user: User) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<User['role']>('author');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegisterMode) {
        if (!username || !password) {
          setError('Vui lòng nhập đầy đủ thông tin.');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp.');
          setIsLoading(false);
          return;
        }
        // Force role selection to user if not specified? defaulted to user.
        const success = await onRegister({ username, role, password });
        if (success) {
          setIsRegisterMode(false);
          setUsername('');
          setPassword('');
          setConfirmPassword('');
          alert('Vui lòng đăng nhập với tài khoản vừa tạo.');
        }
      } else {
        const success = await onLogin(username, password);
        if (!success) {
          // Error set by parent via alert or notification usually, but we can set local error too if needed.
          // App.tsx handleLogin returns false on error.
          // Ideally App.tsx sets notification. We can just stop loading.
        }
      }
    } catch (err) {
      setError('Đã có lỗi xảy ra.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-white px-4 relative overflow-hidden"
      style={{
        backgroundImage: `url('/bg-login.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background Overlay for better form readability */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]"></div>

      <div className="w-full max-w-sm md:max-w-md animate-fadeIn z-10">
        <div className="bg-white/95 backdrop-blur-xl p-5 md:p-10 rounded-[28px] md:rounded-[40px] shadow-[0_32px_64px_-16px_rgba(37,99,235,0.15)] border-2 border-blue-500/80 flex flex-col items-center">
          <div className="w-16 h-16 md:w-24 md:h-24 flex items-center justify-center mb-3 md:mb-6 drop-shadow-sm">
            <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
          </div>

          <h2 className="text-xl md:text-4xl font-black text-slate-800 tracking-tight mb-1 md:mb-2">
            {isRegisterMode ? 'Đăng ký' : 'UMP-RMS'}
          </h2>
          <p className="text-slate-400 font-bold mb-5 md:mb-10 text-center uppercase tracking-widest text-[9px] md:text-[11px]">Hệ thống Quản lý Dự án KHCN UMP</p>

          {error && (
            <div className="w-full mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] md:text-sm rounded-xl md:rounded-2xl font-bold flex items-center animate-shake">
              <svg className="w-3 h-3 md:w-4 md:h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-3 md:space-y-6">
            <div className="space-y-1 md:space-y-2">
              <label className="block text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 md:px-5 md:py-4 rounded-xl md:rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 font-bold placeholder:text-slate-300 text-xs md:text-base"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin@ump.edu.vn"
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <label className="block text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mật khẩu</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 md:px-5 md:py-4 rounded-xl md:rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 font-bold placeholder:text-slate-300 text-xs md:text-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <label className="block text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Phân quyền</label>
              <select
                className="w-full px-4 py-2.5 md:px-5 md:py-4 rounded-xl md:rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 font-bold bg-white text-xs md:text-base appearance-none shadow-sm cursor-pointer"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  backgroundSize: '1.2em'
                }}
              >
                <option value="author">Chủ nhiệm đề tài</option>
                <option value="leader">Lãnh đạo</option>
                <option value="admin">Admin</option>
                <option value="specialist">Chuyên viên</option>
              </select>
            </div>

            {isRegisterMode && (
              <>
                <div className="space-y-1 md:space-y-2">
                  <label className="block text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2.5 md:px-5 md:py-4 rounded-xl md:rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-800 font-bold placeholder:text-slate-300 text-xs md:text-base"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2563EB] hover:bg-blue-700 disabled:bg-slate-300 text-white font-black py-2.5 md:py-4 rounded-xl md:rounded-2xl shadow-xl md:shadow-2xl shadow-blue-200 transition-all text-xs md:text-lg active:scale-[0.98] mt-1 relative"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                isRegisterMode ? 'TẠO TÀI KHOẢN' : 'ĐĂNG NHẬP'
              )}
            </button>
          </form>

          <div className="mt-5 md:mt-8 flex items-center space-x-2 text-[10px] md:text-sm font-bold">
            <span className="text-slate-400">
              {isRegisterMode ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            </span>
            <button
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setError(null);
                setUsername('');
                setPassword('');
              }}
              className="text-blue-600 font-black hover:underline underline-offset-4"
            >
              {isRegisterMode ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
            </button>
          </div>
        </div>

        <div className="mt-6 md:mt-12 text-center space-y-1 md:space-y-2 group">
          <p className="text-[9px] md:text-[11px] font-black text-slate-600 uppercase tracking-widest group-hover:text-blue-600 transition-colors">
            @2026 - Trường Đại học Y Dược TPHCM
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
