import React, { useState, useMemo, useRef } from 'react';
import { ResearchProject, ProjectStatus, ProgressStatus } from '../types';
import * as XLSX from 'xlsx';

interface DataTableProps {
  projects: ResearchProject[];
  onDelete: (id: string) => void;
  onEdit: (project: ResearchProject) => void;
  onView: (project: ResearchProject) => void;
  onImport?: (data: any[]) => void;
  onDeleteMultiple?: (ids: string[]) => void;
}

interface ColumnFilters {
  [key: string]: string;
}

const DataTable: React.FC<DataTableProps> = ({ projects, onDelete, onEdit, onView, onImport, onDeleteMultiple }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [selectedProject, setSelectedProject] = useState<ResearchProject | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());



  // Calculate Age
  const getAge = (birthYear?: string) => {
    if (!birthYear) return '';
    const year = parseInt(birthYear);
    if (isNaN(year)) return '';
    return new Date().getFullYear() - year;
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      // Global Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(searchLower) ||
        p.leadAuthor.toLowerCase().includes(searchLower) ||
        p.contractId.toLowerCase().includes(searchLower) ||
        p.projectCode.toLowerCase().includes(searchLower);

      // Status Filter
      const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;

      // Column Filters
      const matchesColumns = Object.keys(columnFilters).every(key => {
        const filterVal = columnFilters[key].toLowerCase();
        if (!filterVal) return true;

        // Handle specific nested or calculated fields if necessary
        const val = (p as any)[key];
        if (val === undefined || val === null) return false;

        // Custom handling for complex types
        if (Array.isArray(val)) {
          // For strings (categories)
          if (val.length > 0 && typeof val[0] === 'string') {
            return val.join(' ').toLowerCase().includes(filterVal);
          }
          // For objects (products)
          if (val.length > 0 && typeof val[0] === 'object') {
            return JSON.stringify(val).toLowerCase().includes(filterVal);
          }
        }

        return String(val).toLowerCase().includes(filterVal);
      });

      return matchesSearch && matchesStatus && matchesColumns;
    });
  }, [projects, searchTerm, statusFilter, columnFilters]);

  // Handle Selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredProjects.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = () => {
    if (!onDeleteMultiple) return;
    onDeleteMultiple(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const styles: Record<string, string> = {
      [ProjectStatus.ONGOING]: 'bg-blue-100 text-blue-700 border-blue-200',
      [ProjectStatus.OVERDUE]: 'bg-red-100 text-red-700 border-red-200',
      [ProjectStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      [ProjectStatus.LIQUIDATED]: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return <span className={`px-2 py-1 rounded border text-[10px] font-bold whitespace-nowrap ${styles[status] || 'bg-gray-100'}`}>{status}</span>;
  };

  const getProgressBadge = (status?: string | ProgressStatus) => {
    if (!status) return null;
    const styles: Record<string, string> = {
      'Đúng hạn': 'text-emerald-600 bg-emerald-50 border-emerald-100',
      'Trễ hạn': 'text-red-600 bg-red-50 border-red-100',
      'Gia hạn': 'text-amber-600 bg-amber-50 border-amber-100',
    };
    return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${styles[status] || 'text-slate-600 bg-slate-50'}`}>{status}</span>
  }

  const formatDate = (dateString?: string | number) => {
    if (!dateString) return '';
    const str = String(dateString).trim();

    // Handle Excel serial numbers (e.g. 45000)
    // 25569 is the offset for 1970-01-01
    if (/^\d+(\.\d+)?$/.test(str) && Number(str) > 20000 && Number(str) < 100000) {
      const excelSerial = Number(str);
      const date = new Date((excelSerial - 25569) * 86400 * 1000);
      // Use UTC parts to avoid timezone shifting
      const day = date.getUTCDate().toString().padStart(2, '0');
      const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }

    // Fix: Handle YYYY-MM-DD manually to avoid Timezone offset issues (e.g. previous day)
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const parts = str.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    // If already looks like DD/MM/YYYY, leave it alone
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

  const handleFilterChange = (col: string, val: string) => {
    setColumnFilters(prev => ({ ...prev, [col]: val }));
  };

  const toggleFilter = (col: string) => {
    setActiveFilterColumn(activeFilterColumn === col ? null : col);
  };

  const FilterableHeader = ({ label, colId, minWidth = '150px', className = '' }: { label: string, colId: string, minWidth?: string, className?: string }) => (
    <th className={`px-4 py-3 border-b border-slate-200 bg-slate-50 text-left relative group/header whitespace-nowrap sticky top-0 z-20 shadow-sm ${className}`} style={{ minWidth }}>
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">{label}</span>
        <button
          onClick={() => toggleFilter(colId)}
          className={`p-1 rounded transition-colors ${columnFilters[colId] ? 'text-blue-600' : 'text-slate-300 hover:text-slate-500'}`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
        </button>
      </div>
      {activeFilterColumn === colId && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white shadow-xl rounded-lg border border-slate-200 p-2 z-50">
          <input
            autoFocus
            type="text"
            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded focus:border-blue-500 outline-none"
            placeholder={`Lọc ${label}...`}
            value={columnFilters[colId] || ''}
            onChange={(e) => handleFilterChange(colId, e.target.value)}
          />
        </div>
      )}
    </th>
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Basic mapping from Excel columns (User friendly names) to Code keys
      // Assumes row 0 is header
      if (data.length < 2) return;

      const headers = data[0] as string[];
      const rows = data.slice(1);

      const mappedProjects = rows.map((row: any) => {
        const p: any = {};
        headers.forEach((h, index) => {
          // Robust fuzzy matching (case-insensitive)
          const header = h.toLowerCase();
          const val = row[index];
          if (val === undefined) return;

          if (header.includes('số hợp đồng')) p.contractId = val ? String(val) : '';
          else if (header.includes('ngày ký')) p.contractDate = val ? String(val) : '';
          else if (header.includes('tên đề tài')) p.title = val ? String(val) : '';
          else if (header.includes('chủ nhiệm')) p.leadAuthor = val ? String(val) : '';
          else if (header.includes('năm sinh')) p.leadAuthorBirthYear = val ? String(val) : '';
          else if (header.includes('thành viên')) p.members = val ? String(val) : '';
          else if (header.includes('lĩnh vực')) p.researchField = val ? String(val) : '';
          else if (header.includes('loại hình')) p.researchType = val ? String(val) : '';
          else if (header.includes('loại đề tài')) p.categories = val ? String(val).split(',').map(s => s.trim()) : [];
          else if (header.includes('bộ môn')) p.subDepartment = val ? String(val) : '';
          else if (header.includes('đơn vị')) p.department = val ? String(val) : '';
          else if (header.includes('qđ xét duyệt')) p.approvalDecision = val ? String(val) : '';
          else if (header.includes('qđ phê duyệt')) p.authorizationDecision = val ? String(val) : '';
          else if (header.includes('kinh phí thực hiện')) p.budget = Number(val) || 0;
          else if (header.includes('thời gian th')) p.duration = val ? String(val) : '';
          else if (header.includes('bắt đầu')) p.startDate = val ? String(val) : '';
          else if (header.includes('kết thúc')) p.endDate = val ? String(val) : '';
          else if (header === 'tiến độ' || header === 'tiến độ thực hiện' || (header.includes('tiến độ') && !header.includes('1') && !header.includes('2') && !header.includes('3') && !header.includes('4') && !header.includes('báo cáo') && !header.includes('ghi chú'))) p.progressStatus = val ? String(val) : '';
          else if (header.includes('mã số đt')) p.projectCode = val ? String(val) : '';
          else if (header.includes('tình trạng')) p.status = val ? String(val) : '';

          // ADDED MAPPINGS
          else if (header.includes('giấy chứng nhận')) {
            // Simple mapping to number field if it looks like a number, else put in description? 
            // Since export combines fields, importing perfectly is hard. 
            // We'll map to certificateResultNumber if simpler, or leave blank/parse if needed.
            // Let's assume input might be the number.
            p.certificateResultNumber = val ? String(val) : '';
          }
          else if (header.includes('khoán') && !header.includes('không')) p.budgetLumpSum = Number(val) || 0;
          else if (header.includes('không khoán')) p.budgetNonLumpSum = Number(val) || 0;
          else if (header.includes('nguồn khác')) p.budgetOtherSources = Number(val) || 0;

          else if (header.includes('đợt 1')) p.budgetBatch1 = Number(val) || 0;
          else if (header.includes('đợt 2')) p.budgetBatch2 = Number(val) || 0;
          else if (header.includes('đợt 3')) p.budgetBatch3 = Number(val) || 0;

          else if (header.includes('gia hạn')) p.extensionDate = val ? String(val) : '';

          else if (header.includes('giám định')) p.reviewReportingDate = val ? String(val) : '';
          else if (header.includes('tiến độ 1')) p.progressReportDate1 = val ? String(val) : '';
          else if (header.includes('tiến độ 2')) p.progressReportDate2 = val ? String(val) : '';
          else if (header.includes('tiến độ 3')) p.progressReportDate3 = val ? String(val) : '';
          else if (header.includes('tiến độ 4')) p.progressReportDate4 = val ? String(val) : '';

          else if (header.includes('đầu ra')) p.outputProduct = val ? String(val) : '';
          else if (header.includes('năm nt') || header.includes('năm nghiệm thu')) p.acceptanceYear = val ? String(val) : '';
          else if (header.includes('năm học')) p.acceptanceAcademicYear = val ? String(val) : '';

          else if (header.includes('sản phẩm thực tế')) p.actualProductDetails = val ? String(val) : '';

          else if (header.includes('ngày họp nt') || header.includes('ngày họp nghiệm thu') || (header.includes('họp') && header.includes('nghiệm thu'))) p.acceptanceMeetingDate = val ? formatDate(val) : '';

          else if (header.includes('ngày nhắc') || header.includes('thời điểm nhắc')) p.reminderDate = val ? String(val) : '';
          else if (header.includes('thời điểm nt') || header.includes('thời điểm nghiệm thu')) p.acceptanceCompletionDate = val ? String(val) : '';

          else if (header.includes('giới tính')) p.leadAuthorGender = val ? String(val) : 'Nam';
          else if (header.includes('chuyển tiếp')) p.isTransferred = val ? String(val).toLowerCase().includes('có') || String(val).toLowerCase() === 'true' : false;
          else if (header.includes('thanh lý')) p.terminationReason = val ? String(val) : '';
        });

        // Defaults if missing
        return {
          ...p,
          // Ensure required fields
          title: p.title || 'Untitled Project',
          leadAuthor: p.leadAuthor || 'Unknown',
          status: p.status || ProjectStatus.ONGOING,
          budget: p.budget || 0,
          startDate: p.startDate || new Date().toISOString().split('T')[0],
          endDate: p.endDate || new Date().toISOString().split('T')[0]
        };
      });

      if (onImport) onImport(mappedProjects);
    };
    reader.readAsBinaryString(file);
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const exportExcel = () => {
    // Define columns with header names, correct order, and data mapping
    const columns = [
      { header: "Số thứ tự", ml: 5, value: (_: ResearchProject, i: number) => i + 1 },
      {
        header: "Số hợp đồng",
        ml: 20,
        value: (p: ResearchProject) => p.contractId ? String(p.contractId) : ''
      },

      {
        header: "Giấy chứng nhận đăng ký kết quả",
        ml: 30,
        value: (p: ResearchProject) => {
          const parts = [];
          if (p.certificateResultNumber) parts.push(`Số: ${p.certificateResultNumber}`);
          if (p.certificateResultDate) parts.push(`Ngày: ${formatDate(p.certificateResultDate)}`);
          if (p.certificateResultIssuingAuthority) parts.push(`Nơi cấp: ${p.certificateResultIssuingAuthority}`);
          return parts.join('\n');
        }
      },

      { header: "Tên đề tài", ml: 40, value: (p: ResearchProject) => p.title },
      { header: "Chủ nhiệm đề tài", ml: 20, value: (p: ResearchProject) => p.leadAuthor },
      { header: "Năm sinh", ml: 10, value: (p: ResearchProject) => p.leadAuthorBirthYear || '' },
      { header: "Tuổi", ml: 8, value: (p: ResearchProject) => getAge(p.leadAuthorBirthYear) },
      { header: "Thành viên NC", ml: 30, value: (p: ResearchProject) => p.members || '' },
      { header: "Lĩnh vực NC", ml: 15, value: (p: ResearchProject) => p.researchField || '' },
      { header: "Loại hình nghiên cứu", ml: 15, value: (p: ResearchProject) => p.researchType || '' },
      { header: "Loại đề tài", ml: 20, value: (p: ResearchProject) => (p.categories || []).join(', ') },
      { header: "Bộ môn", ml: 15, value: (p: ResearchProject) => p.subDepartment || '' },
      { header: "Khoa/Đơn vị", ml: 15, value: (p: ResearchProject) => p.department || '' },

      { header: "Quyết định xét duyệt", ml: 15, value: (p: ResearchProject) => p.approvalDecision || '' },
      { header: "Quyết định phê duyệt", ml: 15, value: (p: ResearchProject) => p.authorizationDecision || '' },

      { header: "Kinh phí thực hiện", ml: 15, value: (p: ResearchProject) => p.budget },
      { header: "Kinh phí khoán", ml: 15, value: (p: ResearchProject) => p.budgetLumpSum || 0 },
      { header: "Kinh phí không khoán", ml: 15, value: (p: ResearchProject) => p.budgetNonLumpSum || 0 },
      { header: "Nguồn khác", ml: 15, value: (p: ResearchProject) => p.budgetOtherSources || 0 },
      { header: "Kinh phí Cấp đợt 1", ml: 12, value: (p: ResearchProject) => p.budgetBatch1 || 0 },
      { header: "Kinh phí Cấp đợt 2", ml: 12, value: (p: ResearchProject) => p.budgetBatch2 || 0 },
      { header: "Kinh phí Cấp đợt 3", ml: 12, value: (p: ResearchProject) => p.budgetBatch3 || 0 },

      { header: "Thời gian thực hiện", ml: 12, value: (p: ResearchProject) => p.duration || '' },
      { header: "Thời gian Bắt đầu", ml: 12, value: (p: ResearchProject) => formatDate(p.startDate) },
      { header: "Thời gian Kết thúc", ml: 12, value: (p: ResearchProject) => formatDate(p.endDate) },
      { header: "Thời gian Gia hạn", ml: 12, value: (p: ResearchProject) => formatDate(p.extensionDate) },

      { header: "Thời gian Báo cáo Giám định", ml: 20, value: (p: ResearchProject) => formatDate(p.reviewReportingDate) },
      { header: "Thời gian Báo cáo tiến độ 1", ml: 20, value: (p: ResearchProject) => formatDate(p.progressReportDate1) },
      { header: "Thời gian Báo cáo tiến độ 2", ml: 20, value: (p: ResearchProject) => formatDate(p.progressReportDate2) },
      { header: "Thời gian Báo cáo tiến độ 3", ml: 20, value: (p: ResearchProject) => formatDate(p.progressReportDate3) },
      { header: "Thời gian Báo cáo tiến độ 4", ml: 20, value: (p: ResearchProject) => formatDate(p.progressReportDate4) },
      { header: "Tiến độ thực hiện", ml: 15, value: (p: ResearchProject) => p.progressStatus || '' },
      { header: "Ghi chú về nộp báo cáo tiến độ", ml: 25, value: (p: ResearchProject) => p.progressReportNote || '' },
      { header: "Ngày họp nghiệm thu", ml: 12, value: (p: ResearchProject) => formatDate(p.acceptanceMeetingDate) },

      { header: "Đầu ra", ml: 20, value: (p: ResearchProject) => p.outputProduct || '' },
      { header: "Tình trạng", ml: 15, value: (p: ResearchProject) => p.status },
      { header: "Năm nghiệm thu", ml: 10, value: (p: ResearchProject) => p.acceptanceYear || '' },
      { header: "Năm học nghiệm thu", ml: 12, value: (p: ResearchProject) => p.acceptanceAcademicYear || '' },

      { header: "Sản phẩm NC cam kết", ml: 25, value: (p: ResearchProject) => (p.expectedProducts || []).map(x => `${x.type}(${x.count})`).join('; ') },
      {
        header: "Sản phẩm thực tế đạt được", ml: 30, value: (p: ResearchProject) => {
          const summary = (p.actualProducts || []).map(x => `${x.type}(${x.count})`).join('; ');
          return p.actualProductDetails ? `${summary}\n${p.actualProductDetails}` : summary;
        }
      },

      { header: "Thời điểm nhắc", ml: 15, value: (p: ResearchProject) => formatDate(p.reminderDate) },
      { header: "Thời điểm nghiệm thu", ml: 15, value: (p: ResearchProject) => formatDate(p.acceptanceCompletionDate) },

      { header: "Mã số ĐT", ml: 15, value: (p: ResearchProject) => p.projectCode },
      { header: "Giới tính", ml: 8, value: (p: ResearchProject) => p.leadAuthorGender || '' },
      { header: "Chuyển tiếp", ml: 10, value: (p: ResearchProject) => p.isTransferred ? 'Có' : 'Không' },
      { header: "Lý do thanh lý", ml: 20, value: (p: ResearchProject) => p.terminationReason || '' },

      {
        header: "Lịch sử edit", ml: 30, value: (p: ResearchProject) => {
          return (p.history || []).map(h => `${formatDate(h.timestamp)} - ${h.user}: ${h.action}`).join('\n');
        }
      }
    ];

    const TABLE_HEAD = columns.map(c => c.header);
    const TABLE_DATA = filteredProjects.map((p, i) => columns.map(c => c.value(p, i)));

    const ws = XLSX.utils.aoa_to_sheet([TABLE_HEAD, ...TABLE_DATA]);

    // Set column widths
    ws['!cols'] = columns.map(c => ({ wch: c.ml }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách đề tài");

    XLSX.writeFile(wb, `Data_DeTai_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="flex-1 h-screen space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between p-4 gap-4">
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls, .csv" />
        <div className="flex-1 w-full md:w-auto relative">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text"
            placeholder="Tìm kiếm nhanh..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          {onImport && (
            <button onClick={triggerImport} className="flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-100">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
              NHẬP EXCEL
            </button>
          )}
          <button type="button" onClick={exportExcel} className="flex items-center px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition shadow-lg shadow-emerald-100">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            XUẤT EXCEL
          </button>
          {(searchTerm || Object.keys(columnFilters).length > 0) && (
            <button onClick={() => { setSearchTerm(''); setColumnFilters({}); }} className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100 transition">
              RESET
            </button>
          )}
          {selectedIds.size > 0 && onDeleteMultiple && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-100"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              XÓA ĐÃ CHỌN ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
        <div className="overflow-auto w-full max-h-[calc(100vh-200px)] scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 relative">
          <table className="w-auto min-w-full text-left border-collapse table-auto relative">
            <thead className="bg-slate-50 sticky top-0 z-30">
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
                <th className="px-4 py-3 border-b border-slate-200 min-w-[50px] sticky left-0 top-0 bg-slate-50 z-40 w-[50px] shadow-sm text-center">
                  <input
                    type="checkbox"
                    checked={filteredProjects.length > 0 && selectedIds.size === filteredProjects.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 border-b border-slate-200 min-w-[50px] sticky left-[50px] top-0 bg-slate-50 z-30 w-[50px] shadow-sm">TT</th>

                <FilterableHeader label="Số Hợp Đồng" colId="contractId" minWidth="220px" />
                <FilterableHeader label="Giấy chứng nhận (Số)" colId="certificateResultNumber" minWidth="200px" />

                <FilterableHeader label="Tên Đề Tài" colId="title" minWidth="300px" />
                <FilterableHeader label="Chủ nhiệm" colId="leadAuthor" minWidth="150px" />
                <FilterableHeader label="Năm sinh" colId="leadAuthorBirthYear" minWidth="80px" />
                <th className="px-4 py-3 border-b border-slate-200 min-w-[60px] sticky top-0 z-20 bg-slate-50 shadow-sm">Tuổi</th>

                <FilterableHeader label="Thành viên" colId="members" minWidth="300px" />
                <FilterableHeader label="Lĩnh vực" colId="researchField" minWidth="150px" />
                <FilterableHeader label="Loại hình" colId="researchType" minWidth="120px" />
                <FilterableHeader label="Loại đề tài" colId="categories" minWidth="120px" />

                <FilterableHeader label="Bộ môn" colId="subDepartment" minWidth="150px" />
                <FilterableHeader label="Đơn vị" colId="department" minWidth="150px" />

                <FilterableHeader label="QĐ Xét duyệt" colId="approvalDecision" minWidth="120px" />
                <FilterableHeader label="QĐ Phê duyệt" colId="authorizationDecision" minWidth="120px" />

                <FilterableHeader label="Kinh phí TH" colId="budget" minWidth="120px" className="text-right" />
                <FilterableHeader label="Khoán" colId="budgetLumpSum" minWidth="120px" className="text-right" />
                <FilterableHeader label="Không khoán" colId="budgetNonLumpSum" minWidth="120px" className="text-right" />
                <FilterableHeader label="Nguồn khác" colId="budgetOtherSources" minWidth="120px" className="text-right" />
                <FilterableHeader label="Đợt 1" colId="budgetBatch1" minWidth="100px" className="text-right" />
                <FilterableHeader label="Đợt 2" colId="budgetBatch2" minWidth="100px" className="text-right" />
                <FilterableHeader label="Đợt 3" colId="budgetBatch3" minWidth="100px" className="text-right" />

                <FilterableHeader label="Thời gian TH" colId="duration" minWidth="100px" />
                <FilterableHeader label="Bắt đầu" colId="startDate" minWidth="100px" />
                <FilterableHeader label="Kết thúc" colId="endDate" minWidth="100px" />
                <FilterableHeader label="Gia hạn" colId="extensionDate" minWidth="100px" />

                <FilterableHeader label="TG Báo cáo Giám định" colId="reviewReportingDate" minWidth="150px" />
                <FilterableHeader label="TG BC Tiến độ 1" colId="progressReportDate1" minWidth="150px" />
                <FilterableHeader label="TG BC Tiến độ 2" colId="progressReportDate2" minWidth="150px" />
                <FilterableHeader label="TG BC Tiến độ 3" colId="progressReportDate3" minWidth="150px" />
                <FilterableHeader label="TG BC Tiến độ 4" colId="progressReportDate4" minWidth="150px" />
                <FilterableHeader label="Tiến độ" colId="progressStatus" minWidth="100px" />
                <FilterableHeader label="Ghi chú BC" colId="progressReportNote" minWidth="150px" />
                <FilterableHeader label="Ngày họp NT" colId="acceptanceMeetingDate" minWidth="300px" />

                <FilterableHeader label="SP Đầu ra" colId="outputProduct" minWidth="300px" />
                <FilterableHeader label="Tình trạng" colId="status" minWidth="120px" />

                <FilterableHeader label="Năm NT" colId="acceptanceYear" minWidth="80px" />
                <FilterableHeader label="Năm học NT" colId="acceptanceAcademicYear" minWidth="80px" />

                <FilterableHeader label="SP Cam kết" colId="expectedProducts" minWidth="150px" />
                <FilterableHeader label="Sản phẩm thực tế đạt được" colId="actualProducts" minWidth="200px" />

                <FilterableHeader label="Ngày nhắc" colId="reminderDate" minWidth="100px" />
                <FilterableHeader label="Thời điểm NT" colId="acceptanceCompletionDate" minWidth="100px" />
                <FilterableHeader label="Mã số ĐT" colId="projectCode" minWidth="100px" />
                <FilterableHeader label="Giới tính" colId="leadAuthorGender" minWidth="80px" />
                <FilterableHeader label="Chuyển tiếp" colId="isTransferred" minWidth="80px" />
                <FilterableHeader label="Lý do thanh lý" colId="terminationReason" minWidth="150px" />
                <th className="px-4 py-3 border-b border-slate-200 sticky right-[150px] top-0 bg-slate-50 z-30 min-w-[100px] shadow-sm">Thao tác</th>
                <FilterableHeader label="Lịch sử" colId="history" minWidth="150px" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredProjects.map((p, idx) => (
                <tr key={p.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-4 py-3 text-center border-b border-slate-100 sticky left-0 bg-white z-20 group-hover:bg-blue-50/50 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => handleSelectOne(p.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500 font-mono sticky left-[50px] bg-white group-hover:bg-blue-50/50 align-top">{idx + 1}</td>


                  <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold align-top">{p.contractId}</td>
                  <td className="px-4 py-3 text-xs align-top">
                    {p.certificateResultNumber && <div><span className="text-slate-500">Số:</span> {p.certificateResultNumber}</div>}
                    {p.certificateResultDate && <div><span className="text-slate-500">Ngày:</span> {formatDate(p.certificateResultDate)}</div>}
                    {p.certificateResultIssuingAuthority && <div><span className="text-slate-500">Nơi:</span> {p.certificateResultIssuingAuthority}</div>}
                  </td>

                  <td className="px-4 py-3 font-bold text-slate-800 min-w-[400px] whitespace-normal break-words align-top cursor-pointer hover:text-blue-700 transition-colors" title="Nhấp đúp để xem chi tiết" onDoubleClick={() => onView(p)}>{p.title}</td>
                  <td className="px-4 py-3 font-semibold text-blue-700 align-top">{p.leadAuthor}</td>
                  <td className="px-4 py-3 text-center align-top">{p.leadAuthorBirthYear}</td>
                  <td className="px-4 py-3 text-center align-top">{getAge(p.leadAuthorBirthYear)}</td>

                  <td className="px-4 py-3 whitespace-normal break-words max-w-[200px] align-top" title={p.members}>{p.members}</td>
                  <td className="px-4 py-3 align-top">{p.researchField}</td>
                  <td className="px-4 py-3 align-top">{p.researchType}</td>
                  <td className="px-4 py-3 flex flex-wrap gap-1 align-top">
                    {p.categories?.map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 border text-slate-600">{c}</span>)}
                  </td>

                  <td className="px-4 py-3 whitespace-normal break-words max-w-[150px] align-top" title={p.subDepartment}>{p.subDepartment}</td>
                  <td className="px-4 py-3 whitespace-normal break-words max-w-[150px] align-top" title={p.department}>{p.department}</td>

                  <td className="px-4 py-3 align-top">{p.approvalDecision}</td>
                  <td className="px-4 py-3 align-top">{p.authorizationDecision}</td>

                  <td className="px-4 py-3 text-right font-mono font-bold align-top">{p.budget?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 align-top">{p.budgetLumpSum?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 align-top">{p.budgetNonLumpSum?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 align-top">{p.budgetOtherSources?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs align-top">{p.budgetBatch1?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs align-top">{p.budgetBatch2?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs align-top">{p.budgetBatch3?.toLocaleString()}</td>

                  <td className="px-4 py-3 align-top">{p.duration}</td>
                  <td className="px-4 py-3 text-slate-600 align-top">{formatDate(p.startDate)}</td>
                  <td className="px-4 py-3 text-slate-600 align-top">{formatDate(p.endDate)}</td>
                  <td className="px-4 py-3 text-amber-600 font-medium align-top">{formatDate(p.extensionDate)}</td>

                  <td className="px-4 py-3 align-top">{formatDate(p.reviewReportingDate)}</td>
                  <td className="px-4 py-3 align-top">{formatDate(p.progressReportDate1)}</td>
                  <td className="px-4 py-3 align-top">{formatDate(p.progressReportDate2)}</td>
                  <td className="px-4 py-3 align-top">{formatDate(p.progressReportDate3)}</td>
                  <td className="px-4 py-3 align-top">{formatDate(p.progressReportDate4)}</td>
                  <td className="px-4 py-3 align-top">{getProgressBadge(p.progressStatus)}</td>
                  <td className="px-4 py-3 whitespace-normal break-words max-w-[200px] align-top" title={p.progressReportNote}>{p.progressReportNote}</td>
                  <td className="px-4 py-3 overflow-y-auto align-top">{formatDate(p.acceptanceMeetingDate)}</td>

                  <td className="px-4 py-3 whitespace-normal break-words max-w-[200px] align-top" title={p.outputProduct}>{p.outputProduct}</td>
                  <td className="px-4 py-3 align-top">{getStatusBadge(p.status)}</td>

                  <td className="px-4 py-3 text-center align-top">{p.acceptanceYear}</td>
                  <td className="px-4 py-3 text-center align-top">{p.acceptanceAcademicYear}</td>

                  <td className="px-4 py-3 text-xs align-top">{(p.expectedProducts || []).reduce((a, b) => a + b.count, 0)} sản phẩm</td>
                  <td className="px-4 py-3 text-xs align-top">
                    <div className="flex flex-col gap-1">
                      <span className="font-bold">{(p.actualProducts || []).map(x => `${x.type}(${x.count})`).join('; ')}</span>
                      {p.actualProductDetails && <span className="text-[10px] text-slate-500 max-w-[200px] truncate" title={p.actualProductDetails}>{p.actualProductDetails}</span>}
                    </div>
                  </td>

                  <td className="px-4 py-3">{formatDate(p.reminderDate)}</td>
                  <td className="px-4 py-3">{formatDate(p.acceptanceCompletionDate)}</td>
                  <td className="px-4 py-3 font-mono">{p.projectCode}</td>
                  <td className="px-4 py-3">{p.leadAuthorGender}</td>
                  <td className="px-4 py-3 text-center">{p.isTransferred ? '☑' : ''}</td>
                  <td className="px-4 py-3 text-red-600">{p.terminationReason}</td>
                  <td className="px-4 py-3 flex items-center gap-1 bg-white">
                    <button onClick={() => onView(p)} className="p-1 text-slate-400 hover:text-blue-600 rounded bg-slate-50 border border-slate-100" title="Xem chi tiết">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button onClick={() => onEdit(p)} className="p-1 text-slate-400 hover:text-amber-600 rounded bg-slate-50 border border-slate-100" title="Chỉnh sửa"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2.5 2.5 0 113.536 3.536L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                    <button onClick={() => onDelete(p.id)} className="p-1 text-slate-400 hover:text-red-600 rounded bg-slate-50 border border-slate-100" title="Xóa"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {p.history?.[0] ? (
                      <div className="flex flex-col">
                        <span className="font-bold">@{p.history[0].user}</span>
                        <span>{p.history[0].timestamp}</span>
                      </div>
                    ) : '---'}
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr><td colSpan={100} className="text-center py-20 text-slate-400 uppercase tracking-widest font-bold text-xs">Không có dữ liệu</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
