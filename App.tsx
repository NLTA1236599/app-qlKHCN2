import React, { useState } from 'react';
import { ViewType } from './types';
import Login from './components/0-Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { ProjectManager } from './components/ProjectManager';
import { useAuth } from './hooks/useAuth';
import { useProjects } from './hooks/useProjects';
import { useNotification } from './hooks/useNotification';

const App: React.FC = () => {
  const { user, isAuthLoading, handleLogin, handleRegister, handleLogout } = useAuth();
  const { projects, setProjects, isProjectsLoading, fetchProjects } = useProjects(user);
  const { showNotification, NotificationComponent } = useNotification();
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isLoading = isAuthLoading || (user && isProjectsLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={async (u, p) => {
          try {
            await handleLogin(u, p);
            return true;
          } catch (e: any) {
            showNotification(e.message || "Đăng nhập thất bại");
            return false;
          }
        }}
        onRegister={async (newUser) => {
          try {
            await handleRegister(newUser);
            showNotification(`Đã tạo tài khoản "${newUser.username}" thành công.`);
            return true;
          } catch (e: any) {
            alert('Đăng ký thất bại: ' + e.message);
            return false;
          }
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">
      <NotificationComponent />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        currentView={currentView}
        setView={(view) => {
          setCurrentView(view);
          setIsSidebarOpen(false); // Close on selection on mobile
        }}
        isOpen={isSidebarOpen}
        userRole={user?.role}
        user={user}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-[1600px] mx-auto">
            <ProjectManager
              user={user}
              projects={projects}
              setProjects={setProjects}
              currentView={currentView}
              setCurrentView={setCurrentView}
              showNotification={showNotification}
              fetchProjects={fetchProjects}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
