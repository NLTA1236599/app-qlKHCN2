
import React, { useState, useEffect } from 'react';
import { ViewType, ResearchProject, ProjectStatus, User } from './types';
import Login from './components/0-Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './components/2-QuanLyDeTai';
import DataTable from './components/4-DulieuNghienCuu';
import Dashboard from './components/1-Dashboard';
import DataEntry from './components/5-NhapDuLieuMoi';
import ProjectDetail from './components/ProjectDetail';
import ProgressTracking from './components/ProgressTracking';
import WorkflowProcess from './components/6-QuyTrinhNghienCuu';

const MOCK_DATA: ResearchProject[] = [
  {
    id: '1',
    projectCode: 'ĐT-2023-01',
    contractId: 'HĐ-2023-001',
    contractDate: '2023-01-01',
    title: 'Ứng dụng AI trong chẩn đoán hình ảnh y khoa',
    leadAuthor: 'Nguyễn Văn A',
    leadAuthorBirthYear: '1980',
    leadAuthorGender: 'Nam',
    members: 'Trần Văn B, Lê Thị C',
    researchField: 'Công nghệ thông tin',
    researchType: 'Cơ bản',
    department: 'Y đa khoa',
    subDepartment: 'Bộ môn Kỹ thuật phần mềm',
    status: ProjectStatus.ONGOING,
    progressStatus: 'Đúng hạn',
    budget: 150000000,
    budgetLumpSum: 100000000,
    budgetNonLumpSum: 50000000,
    startDate: '2023-01-10',
    endDate: '2024-01-10',
    duration: '12 tháng',
    description: 'Nghiên cứu các thuật toán học sâu.',
    categories: ['Cấp cơ sở'],
    expectedProducts: [
      { type: 'Bài báo quốc tế', count: 2 },
      { type: 'Đào tạo Học viên sau đại học', count: 1 }
    ],
    actualProducts: [
      { type: 'Bài báo quốc tế', count: 1 }
    ],
    actualProductDetails: 'Đã đăng 1 bài trên tạp chí IEEE.',
    history: [
      { user: 'admin', action: 'Khởi tạo đề tài', timestamp: '2023-01-10 08:30' }
    ]
  }
];

// import { dbService } from './services/supabaseClient';
// import { localDbService as dbService } from './services/localService';
import { dbService } from './services/db';
import { firebaseService } from './services/firebaseService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = firebaseService.auth.subscribe(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const role = await firebaseService.auth.getUserRole(firebaseUser.uid);
          setUser({
            username: firebaseUser.email || 'unknown',
            role: role as 'admin' | 'user',
            password: '' // Not needed locally
          });
        } catch (e) {
          console.error("Error fetching user role:", e);
          setUser({ username: firebaseUser.email || 'unknown', role: 'user' });
        }
      } else {
        setUser(null);
      }
      // Only stop loading if we aren't waiting for projects 
      // actually, better to let the project fetch handle its own loading state or combine them.
      // For now, we'll let the project fetcher turn off loading.
    });
    return () => unsubscribe();
  }, []);

  // Fetch Projects
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const fetchedProjects = await dbService.getProjects();
        if (fetchedProjects) setProjects(fetchedProjects);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        showNotification("Lỗi kết nối CSDL!");
        setProjects(MOCK_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have a user (if rules require auth) OR if we are fetching public data?
    // User requested "Secure my database", meaning rules likely mandate auth.
    // So we should only fetch if user is logged in.
    if (user) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogin = async (username: string, pass: string) => {
    try {
      await firebaseService.auth.login(username, pass);
      return true;
    } catch (error: any) {
      console.error("Login failed:", error);
      showNotification(error.message || "Đăng nhập thất bại");
      return false;
    }
  };

  const handleRegister = async (newUser: User) => {
    try {
      await firebaseService.auth.register(newUser.username, newUser.password || '', newUser.role);
      showNotification(`Đã tạo tài khoản "${newUser.username}" thành công.`);
      return true;
    } catch (error: any) {
      console.error(error);
      alert('Đăng ký thất bại: ' + error.message);
      return false;
    }
  };

  const handleLogout = () => firebaseService.auth.logout();

  const saveProject = async (projectData: Omit<ResearchProject, 'id' | 'history'>) => {
    setIsLoading(true);
    const timestamp = new Date().toLocaleString('vi-VN');

    try {
      if (editingProject) {
        // Prepare update data
        const updatedHistory = [
          { user: user?.username || 'unknown', action: 'Chỉnh sửa', timestamp },
          ...(editingProject.history || [])
        ];
        const projectToSave = { ...projectData, id: editingProject.id, history: updatedHistory };

        await dbService.saveProject(projectToSave); // Sync to DB

        setProjects(prev => prev.map(p => p.id === editingProject.id ? projectToSave : p));
        showNotification(`Đã cập nhật đề tài "${projectToSave.title}".`);
        setEditingProject(null);
      } else {
        // Create new
        const historyEntry = {
          user: user?.username || 'unknown',
          action: 'Thêm mới',
          timestamp
        };
        // Generate a random ID for now or let DB handle it? 
        // Supabase usually handles UUIDs but we can send one if we want.
        // Let's generate one here to keep UI optimistic update easy.
        const newId = Math.random().toString(36).substr(2, 9);
        const newProject = {
          ...projectData,
          id: newId,
          history: [historyEntry]
        };

        await dbService.saveProject(newProject); // Sync to DB

        setProjects(prev => [newProject, ...prev]);
        showNotification(`Đã thêm đề tài "${newProject.title}".`);
      }
      setCurrentView('table');
    } catch (error) {
      console.error("Save error:", error);
      alert("Có lỗi khi lưu dữ liệu lên Cloud.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (project: ResearchProject) => {
    setEditingProject(project);
    setCurrentView('entry');
  };

  const deleteProject = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đề tài này?")) return;
    try {
      await dbService.deleteProject(id); // Sync to DB
      setProjects(prev => prev.filter(p => p.id !== id));
      showNotification(`Đã xóa đề tài thành công.`);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Lỗi khi xóa dữ liệu trên Cloud.");
    }
  };

  const deleteMultipleProjects = async (ids: string[]) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${ids.length} đề tài đã chọn?`)) return;
    setIsLoading(true);
    let successCount = 0;
    try {
      for (const id of ids) {
        try {
          await dbService.deleteProject(id);
          successCount++;
        } catch (err) {
          console.error("Delete error:", err);
        }
      }
      setProjects(prev => prev.filter(p => !ids.includes(p.id)));
      showNotification(`Đã xóa ${successCount}/${ids.length} đề tài thành công.`);
    } catch (error) {
      console.error("Delete Multiple error:", error);
      alert("Lỗi trong quá trình xóa dữ liệu trên Cloud.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportProjects = async (importedProjects: any[]) => {
    if (!importedProjects || importedProjects.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn nhập ${importedProjects.length} đề tài từ Excel không?`)) return;

    setIsLoading(true);
    let successCount = 0;

    try {
      const timestamp = new Date().toLocaleString('vi-VN');

      // Process sequentially to avoid rate limits or overwhelming the DB
      for (const p of importedProjects) {
        try {
          const newId = Math.random().toString(36).substr(2, 9);
          const projectToSave = {
            ...p,
            id: newId,
            history: [{
              user: user?.username || 'import',
              action: 'Import Excel',
              timestamp
            }]
          };

          await dbService.saveProject(projectToSave);
          successCount++;
        } catch (err) {
          console.error("Error importing row:", err);
        }
      }

      // Fetch latest data
      const fetchedProjects = await dbService.getProjects();
      if (fetchedProjects) setProjects(fetchedProjects);

      showNotification(`Đã nhập thành công ${successCount}/${importedProjects.length} đề tài.`);
    } catch (error) {
      console.error("Import error:", error);
      console.error("Import error:", error);
      alert(`Lỗi trong quá trình nhập dữ liệu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang đồng bộ dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">
      {notification && (
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
      )}

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
          if (view !== 'entry') setEditingProject(null);
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
            {currentView === 'overview' && <Overview projects={projects} />}
            {currentView === 'progress_tracking' && <ProgressTracking projects={projects} />}
            {currentView === 'table' && <DataTable
              projects={projects}
              onDelete={deleteProject}
              onEdit={handleEdit}
              onView={(project) => {
                setEditingProject(project); // We reuse this state for holding the "active" project
                setCurrentView('detail');
              }}
              onImport={handleImportProjects}
              onDeleteMultiple={deleteMultipleProjects}
            />}
            {currentView === 'dashboard' && <Dashboard projects={projects} onNavigate={setCurrentView} />}
            {currentView === 'entry' && <DataEntry onSave={saveProject} initialData={editingProject} onCancel={() => {
              setEditingProject(null);
              setCurrentView('table');
            }} />}
            {currentView === 'detail' && editingProject && (
              <ProjectDetail
                project={editingProject}
                userEmail={user.username}
                onBack={() => {
                  setEditingProject(null);
                  setCurrentView('table');
                }}
                onUpdate={async () => {
                  // Re-fetch projects to update state
                  const updatedProjects = await dbService.getProjects();
                  if (updatedProjects) setProjects(updatedProjects);
                  // Update the currently viewed project object too
                  const updatedCurrent = updatedProjects.find(p => p.id === editingProject.id);
                  if (updatedCurrent) setEditingProject(updatedCurrent);
                }}
                onEdit={handleEdit}
              />
            )}
            {currentView === 'workflow_process' && <WorkflowProcess />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
