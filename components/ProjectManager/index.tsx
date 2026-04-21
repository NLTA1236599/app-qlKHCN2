import React, { useState } from 'react';
import { ViewType, ResearchProject } from '../../types';
import Overview from '../2-QuanLyDeTai';
import DataTable from '../4-DulieuNghienCuu';
import Dashboard from '../1-Dashboard';
import DataEntry from '../5-NhapDuLieuMoi';
import ProjectDetail from '../ProjectDetail';
import ProgressTracking from '../ProgressTracking';
import WorkflowProcess from '../6-QuyTrinhNghienCuu';
import { dbService } from '../../services/db';

interface ProjectManagerProps {
  user: any;
  projects: ResearchProject[];
  setProjects: React.Dispatch<React.SetStateAction<ResearchProject[]>>;
  currentView: ViewType;
  setCurrentView: React.Dispatch<React.SetStateAction<ViewType>>;
  showNotification: (msg: string) => void;
  fetchProjects: () => Promise<void>;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  user,
  projects,
  setProjects,
  currentView,
  setCurrentView,
  showNotification,
  fetchProjects
}) => {
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const saveProject = async (projectData: Omit<ResearchProject, 'id' | 'history'>) => {
    setIsProcessing(true);
    const timestamp = new Date().toLocaleString('vi-VN');

    try {
      if (editingProject) {
        const updatedHistory = [
          { user: user?.username || 'unknown', action: 'Chỉnh sửa', timestamp },
          ...(editingProject.history || [])
        ];
        const projectToSave = { ...projectData, id: editingProject.id, history: updatedHistory };

        await dbService.saveProject(projectToSave);
        setProjects(prev => prev.map(p => p.id === editingProject.id ? projectToSave : p));
        showNotification(`Đã cập nhật đề tài "${projectToSave.title}".`);
        setEditingProject(null);
      } else {
        const historyEntry = { user: user?.username || 'unknown', action: 'Thêm mới', timestamp };
        const newId = Math.random().toString(36).substr(2, 9);
        const newProject = { ...projectData, id: newId, history: [historyEntry] };

        await dbService.saveProject(newProject);
        setProjects(prev => [newProject, ...prev]);
        showNotification(`Đã thêm đề tài "${newProject.title}".`);
      }
      setCurrentView('table');
    } catch (error) {
      console.error("Save error:", error);
      alert("Có lỗi khi lưu dữ liệu lên Cloud.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (project: ResearchProject) => {
    setEditingProject(project);
    setCurrentView('entry');
  };

  const deleteProject = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đề tài này?")) return;
    try {
      await dbService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      showNotification(`Đã xóa đề tài thành công.`);
    } catch (error) {
      console.error("Delete error:", error);
      alert("Lỗi khi xóa dữ liệu trên Cloud.");
    }
  };

  const deleteMultipleProjects = async (ids: string[]) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${ids.length} đề tài đã chọn?`)) return;
    setIsProcessing(true);
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
      setIsProcessing(false);
    }
  };

  const handleImportProjects = async (importedProjects: any[]) => {
    if (!importedProjects || importedProjects.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn nhập ${importedProjects.length} đề tài từ Excel không?`)) return;

    setIsProcessing(true);
    let successCount = 0;

    try {
      const timestamp = new Date().toLocaleString('vi-VN');
      for (const p of importedProjects) {
        try {
          const newId = Math.random().toString(36).substr(2, 9);
          const projectToSave = {
            ...p,
            id: newId,
            history: [{ user: user?.username || 'import', action: 'Import Excel', timestamp }]
          };
          await dbService.saveProject(projectToSave);
          successCount++;
        } catch (err) {
          console.error("Error importing row:", err);
        }
      }
      await fetchProjects();
      showNotification(`Đã nhập thành công ${successCount}/${importedProjects.length} đề tài.`);
    } catch (error) {
      console.error("Import error:", error);
      alert(`Lỗi trong quá trình nhập dữ liệu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Đang xử lý dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentView === 'overview' && <Overview projects={projects} />}
      {currentView === 'progress_tracking' && <ProgressTracking projects={projects} />}
      {currentView === 'table' && <DataTable
        projects={projects}
        onDelete={deleteProject}
        onEdit={handleEdit}
        onView={(project) => {
          setEditingProject(project);
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
            await fetchProjects();
            // Note: In a real app we'd fetch the single project to update editingProject,
            // but fetchProjects updates the parent state, avoiding a stale local copy might need more logic
            // We'll trust the parent re-render for now. Wait, editingProject is local state here.
            // But we don't have a getProjectById in dbService interface here.
            // Simple hack: clear detail view or keep it.
            setCurrentView('table'); // Simplest is to jump back to table or clear it. Let's just go back.
          }}
          onEdit={handleEdit}
        />
      )}
      {currentView === 'workflow_process' && <WorkflowProcess />}
    </>
  );
};
