import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ResearchProject, ProjectStatus, ProgressStatus } from '../types';
import { chatWithAssistant } from '../services/geminiService';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

interface OverviewProps {
  projects: ResearchProject[];
}

const Overview: React.FC<OverviewProps> = ({ projects }) => {
  // Chat Assistant States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Chào bạn! Tôi là Trợ lý ảo UMP. Tôi có thể giúp gì cho bạn về các đề tài nghiên cứu?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dynamic Chart Builder State
  const [dynChartType, setDynChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [dynXAxis, setDynXAxis] = useState<string>('department');
  const [dynYAxis, setDynYAxis] = useState<'count' | 'budget'>('count');

  // Chart Actions State
  const [expandedChart, setExpandedChart] = useState<'status' | 'department' | 'product' | 'dynamic' | null>(null);
  const statusChartRef = useRef<HTMLDivElement>(null);
  const departmentChartRef = useRef<HTMLDivElement>(null);
  const productChartRef = useRef<HTMLDivElement>(null);
  const dynamicChartRef = useRef<HTMLDivElement>(null);

  const handleExportExcel = async (
    chartRef: React.RefObject<HTMLDivElement | null>,
    data: any[],
    columns: { header: string, key: string, width?: number }[],
    filename: string,
    sheetName: string
  ) => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const base64Image = canvas.toDataURL('image/png');

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      worksheet.columns = columns;
      worksheet.addRows(data);

      worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };

      const imageStartRow = data.length + 3;

      const imageId = workbook.addImage({
        base64: base64Image,
        extension: 'png',
      });

      worksheet.addImage(imageId, {
        tl: { col: 0, row: imageStartRow },
        ext: { width: canvas.width / 2, height: canvas.height / 2 }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `${filename}.xlsx`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Lỗi khi xuất dữ liệu ra Excel.");
    }
  };

  // Filter States
  const [selectedStartDate, setSelectedStartDate] = useState<string>('all');
  const [selectedResearchField, setSelectedResearchField] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  const extractYearFromDate = (dateValue: unknown): string | null => {
    if (!dateValue) return null;

    const raw = String(dateValue).trim();
    if (!raw) return null;

    if (/^\d{4}$/.test(raw)) return raw;

    const ddmmyyyyMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (ddmmyyyyMatch) return ddmmyyyyMatch[3];

    const yyyymmddMatch = raw.match(/^(\d{4})[/-](\d{1,2})(?:[/-](\d{1,2}))?$/);
    if (yyyymmddMatch) return yyyymmddMatch[1];

    const numericValue = Number(raw);
    if (!Number.isNaN(numericValue) && /^\d+(\.\d+)?$/.test(raw)) {
      // Excel serial dates are often in this range.
      if (numericValue > 20000 && numericValue < 100000) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        excelEpoch.setUTCDate(excelEpoch.getUTCDate() + Math.floor(numericValue));
        return excelEpoch.getUTCFullYear().toString();
      }
    }

    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.getFullYear().toString();
    }

    return null;
  };

  const availableStartDate = useMemo(() => {
    const years = new Set<string>();
    projects.forEach(p => {
      if ((p as any).startDate) {
        const year = extractYearFromDate((p as any).startDate);
        if (year) years.add(year);
      }
    });
    return Array.from(years).sort().reverse();
  }, [projects]);

  const availableDepartments = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.department))).filter(Boolean).sort();
  }, [projects]);

  const availableStatuses = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.status))).filter(Boolean).sort();
  }, [projects]);

  const availableResearchFields = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.researchField))).filter(Boolean).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      let matchYear = true;
      if (selectedStartDate !== 'all') {
        if ((p as any).startDate) {
          const year = extractYearFromDate((p as any).startDate);
          matchYear = year === selectedStartDate;
        } else {
          matchYear = false;
        }
      }
      const matchResearchField = selectedResearchField === 'all' || p.researchField === selectedResearchField;
      const matchStatus = selectedStatus === 'all' || p.status === selectedStatus;
      const matchDepartment = selectedDepartment === 'all' || p.department === selectedDepartment;

      return matchYear && matchStatus && matchDepartment && matchResearchField;
    });
  }, [projects, selectedStartDate, selectedStatus, selectedResearchField, selectedDepartment]);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('đang thực hiện')) return '#f59e0b'; // Cam
    if (s.includes('nghiệm thu') || s.includes('hoàn thành')) return '#10b981'; // Xanh lá
    if (s.includes('gia hạn')) return '#8b5cf6'; // Tím
    if (s.includes('trễ hạn') || s.includes('quá hạn')) return '#ef4444'; // Đỏ
    return '#3b82f6'; // Xanh dương mặc định
  };

  const statusData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredProjects.forEach(p => {
      let statusName = (p.status || 'Khác').toString().trim();
      const lower = statusName.toLowerCase();
      if (lower.includes('đang thực hiện')) statusName = 'Đang thực hiện';
      else if (lower.includes('nghiệm thu') || lower.includes('hoàn thành')) statusName = 'Đã nghiệm thu';
      else if (lower.includes('gia hạn')) statusName = 'Gia hạn';
      else if (lower.includes('trễ hạn') || lower.includes('quá hạn')) statusName = 'Trễ hạn';
      else statusName = statusName.charAt(0).toUpperCase() + statusName.slice(1);

      data[statusName] = (data[statusName] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredProjects]);

  const departmentData = useMemo(() => {
    const data: Record<string, { count: number; budget: number }> = {};
    filteredProjects.forEach(p => {
      if (!data[p.department]) data[p.department] = { count: 0, budget: 0 };
      data[p.department].count += 1;
      data[p.department].budget += p.budget;
    });
    return Object.entries(data).map(([name, stats]) => ({
      name,
      count: stats.count,
      budget: stats.budget / 1000000 // In millions
    })).sort((a, b) => b.budget - a.budget);
  }, [filteredProjects]);

  const productData = useMemo(() => {
    const expectedCounts: Record<string, number> = {};
    const actualCounts: Record<string, number> = {};

    filteredProjects.forEach(p => {
      let expected = p.expectedProducts;
      if (typeof expected === 'string') {
        try { expected = JSON.parse(expected); } catch (e) { expected = []; }
      }
      if (Array.isArray(expected)) {
        expected.forEach(prod => {
          if (prod && prod.type) {
            expectedCounts[prod.type] = (expectedCounts[prod.type] || 0) + (Number(prod.count) || 0);
          }
        });
      }

      let actual = p.actualProducts;
      if (typeof actual === 'string') {
        try { actual = JSON.parse(actual); } catch (e) { actual = []; }
      }
      if (Array.isArray(actual)) {
        actual.forEach(prod => {
          if (prod && prod.type) {
            actualCounts[prod.type] = (actualCounts[prod.type] || 0) + (Number(prod.count) || 0);
          }
        });
      }
    });

    const allKeys = Array.from(new Set([...Object.keys(expectedCounts), ...Object.keys(actualCounts)]));
    return allKeys.map(key => ({
      name: key.split(' (')[0], // Shorten name for display
      'Dự kiến': expectedCounts[key] || 0,
      'Thực tế': actualCounts[key] || 0
    }));
  }, [filteredProjects]);

  const stats = useMemo(() => {
    const totalBudget = filteredProjects.reduce((acc, curr) => acc + curr.budget, 0);
    const ongoingCount = filteredProjects.filter(p => p.status === ProjectStatus.ONGOING).length;
    const completedCount = filteredProjects.filter(p => p.status === ProjectStatus.COMPLETED).length;
    const extendedCount = filteredProjects.filter(p => p.progressStatus === ProgressStatus.EXTENDED || p.progressStatus === 'Gia hạn').length;
    const overdueCount = filteredProjects.filter(p => {
      if (p.status === ProjectStatus.OVERDUE) return true;
      const isPastEnd = p.endDate ? new Date(p.endDate) < new Date() : false;
      const isNotFinished = p.status !== ProjectStatus.COMPLETED && p.status !== ProjectStatus.LIQUIDATED;
      return isPastEnd && isNotFinished;
    }).length;

    return [
      { label: 'Tổng số đề tài', value: filteredProjects.length, color: 'bg-blue-600', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
      { label: 'Ngân sách tổng (vnđ)', value: totalBudget.toLocaleString(), color: 'bg-indigo-600', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { label: 'Đang thực hiện', value: ongoingCount, color: 'bg-amber-500', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { label: 'Đã nghiệm thu', value: completedCount, color: 'bg-emerald-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { label: 'Gia hạn', value: extendedCount, color: 'bg-purple-500', icon: 'M13 5l7 7-7 7M5 5l7 7-7 7' },
      { label: 'Trễ hạn', value: overdueCount, color: 'bg-red-500', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    ];
  }, [filteredProjects]);

  const dynXAxisOptions = [
    { value: 'department', label: 'Đơn vị' },
    { value: 'status', label: 'Trạng thái' },
    { value: 'researchField', label: 'Lĩnh vực Nghiên cứu' },
    { value: 'researchType', label: 'Loại hình Nghiên cứu' },
    { value: 'progressStatus', label: 'Tiến độ' },
    { value: 'categories', label: 'Loại đề tài' },
    { value: 'products', label: 'Sản phẩm Đề tài' },
  ];

  const dynYAxisOptions = [
    { value: 'count', label: 'Số lượng đề tài' },
    { value: 'budget', label: 'Kinh phí (Triệu VNĐ)' },
  ];

  const dynamicChartData = useMemo(() => {
    if (!dynXAxis) return [];
    const grouped: Record<string, { count: number; budget: number }> = {};

    filteredProjects.forEach(p => {
      if (dynXAxis === 'products') {
        let actual = p.actualProducts;
        let prods: any[] = [];
        if (typeof actual === 'string') {
          try { prods = JSON.parse(actual); } catch (e) { prods = []; }
        } else if (Array.isArray(actual)) {
          prods = actual;
        }

        if (prods.length === 0) {
          const keyVal = 'Chưa có sản phẩm';
          if (!grouped[keyVal]) grouped[keyVal] = { count: 0, budget: 0 };
          grouped[keyVal].count += 1; // đếm số dự án
          grouped[keyVal].budget += (Number(p.budget) || 0) / 1000000;
        } else {
          prods.forEach(prod => {
            if (prod && prod.type) {
              const keyVal = prod.type.split(' (')[0];
              if (!grouped[keyVal]) grouped[keyVal] = { count: 0, budget: 0 };
              grouped[keyVal].count += (Number(prod.count) || 1); // đếm số lượng sp
              grouped[keyVal].budget += (Number(p.budget) || 0) / 1000000; // sum budget
            }
          });
        }
        return;
      }

      let keyVal = (p as any)[dynXAxis];
      if (!keyVal) keyVal = 'Khác';
      if (Array.isArray(keyVal)) keyVal = keyVal.join(', ');

      if (!grouped[keyVal]) grouped[keyVal] = { count: 0, budget: 0 };
      grouped[keyVal].count += 1;
      grouped[keyVal].budget += (Number((p as any).budget) || 0) / 1000000;
    });

    return Object.entries(grouped)
      .map(([name, stats]) => ({
        name,
        value: dynYAxis === 'count' ? stats.count : stats.budget
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredProjects, dynXAxis, dynYAxis]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userInput.trim() || isChatLoading) return;

    const query = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: query }]);
    setIsChatLoading(true);

    const answer = await chatWithAssistant(query, projects);
    setChatMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    setIsChatLoading(false);
  };

  return (
    <div className="relative animate-fadeIn pb-20">
      <div className="flex flex-col xl:flex-row gap-8">
        <div className="flex-grow space-y-8 min-w-0">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`${stat.color} p-2.5 rounded-2xl text-white shadow-lg shadow-blue-100 flex items-center justify-center`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                    </svg>
                  </div>
                </div>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-lg font-black text-slate-800 mt-1 truncate" title={stat.value.toString()}>{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2"></span>
                  Trạng thái đề tài
                </h3>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setExpandedChart('status')} className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors" title="Phóng to">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  </button>
                  <button onClick={() => handleExportExcel(statusChartRef, statusData, [{ header: 'Trạng thái', key: 'name', width: 30 }, { header: 'Số lượng', key: 'value', width: 15 }], 'Thong_ke_trang_thai', 'Trạng thái')} className="p-1.5 text-slate-400 hover:text-green-600 bg-slate-50 hover:bg-green-50 rounded-lg transition-colors" title="Xuất Excel">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </button>
                </div>
              </div>
              <div className="h-80 bg-white" ref={statusChartRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={8}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[24px] shadow-sm border border-slate-200 relative group">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  <span className="w-1.5 h-6 bg-emerald-600 rounded-full mr-2"></span>
                  Kinh phí theo Đơn vị (Triệu VNĐ)
                </h3>
                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setExpandedChart('department')} className="p-1.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg transition-colors" title="Phóng to">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  </button>
                  <button onClick={() => handleExportExcel(departmentChartRef, departmentData, [{ header: 'Đơn vị', key: 'name', width: 40 }, { header: 'Số đề tài', key: 'count', width: 15 }, { header: 'Kinh phí (Triệu VNĐ)', key: 'budget', width: 25 }], 'Thong_ke_kinh_phi', 'Kinh phí')} className="p-1.5 text-slate-400 hover:text-green-600 bg-slate-50 hover:bg-green-50 rounded-lg transition-colors" title="Xuất Excel">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </button>
                </div>
              </div>
              <div className="h-96 bg-white" ref={departmentChartRef}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      dataKey="budget"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 13, fill: '#64748b' }}
                      tickFormatter={(val) => new Intl.NumberFormat('vi-VN').format(val)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#475569', textAnchor: 'end' }}
                      tickMargin={12}
                      width={160}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                      formatter={(value: number) => [new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' triệu VNĐ', 'Kinh phí']}
                      offset={24}
                      allowEscapeViewBox={{ x: true, y: true }}
                    />
                    <Bar dataKey="budget" radius={[0, 8, 8, 0]} name="Kinh phí">
                      {departmentData.map((entry, index) => {
                        const maxBudget = departmentData[0]?.budget || 1;
                        const intensity = Math.max(0, entry.budget / maxBudget);
                        return <Cell key={`cell-${index}`} fill={`rgba(37, 99, 235, ${0.4 + 0.6 * intensity})`} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>


          {/* Dynamic Chart Builder */}
          <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-slate-200 mt-8 relative group">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                <span className="w-1.5 h-6 bg-purple-600 rounded-full mr-2"></span>
                Biểu đồ Thống kê
              </h3>
              <div className="flex items-center space-x-1">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 mr-2">
                  <button onClick={() => setExpandedChart('dynamic')} className="p-1.5 text-slate-400 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 rounded-lg transition-colors" title="Phóng to">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  </button>
                  <button onClick={() => handleExportExcel(dynamicChartRef, dynamicChartData, [{ header: 'Tên', key: 'name', width: 40 }, { header: dynYAxis === 'count' ? 'Số lượng' : 'Kinh phí', key: 'value', width: 25 }], 'Bieu_do_thong_ke', 'Thống kê')} className="p-1.5 text-slate-400 hover:text-green-600 bg-slate-50 hover:bg-green-50 rounded-lg transition-colors" title="Xuất Excel">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Loại biểu đồ</label>
                <select value={dynChartType} onChange={e => setDynChartType(e.target.value as any)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none transition-all">
                  <option value="bar">Biểu đồ Cột (Bar)</option>
                  <option value="line">Biểu đồ Đường (Line)</option>
                  <option value="pie">Biểu đồ Tròn (Pie)</option>
                </select>
              </div>

              {dynChartType === 'pie' ? (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Yếu tố cần thống kê (Trục X)</label>
                  <select value={dynXAxis} onChange={e => setDynXAxis(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none transition-all">
                    {dynXAxisOptions.map(opt => <option key={`pie-gx-${opt.value}`} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              ) : (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trục X (Category)</label>
                  <select value={dynXAxis} onChange={e => setDynXAxis(e.target.value)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none transition-all">
                    {dynXAxisOptions.map(opt => <option key={`bar-gx-${opt.value}`} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              )}

              {dynChartType !== 'pie' ? (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Trục Y (Value)</label>
                  <select value={dynYAxis} onChange={e => setDynYAxis(e.target.value as any)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none transition-all">
                    {dynYAxisOptions.map(opt => <option key={`bar-gy-${opt.value}`} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              ) : (
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Giá trị cần thống kê (Trục Y)</label>
                  <select value={dynYAxis} onChange={e => setDynYAxis(e.target.value as any)} className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl focus:ring-purple-500 focus:border-purple-500 block p-2.5 outline-none transition-all">
                    {dynYAxisOptions.map(opt => <option key={`pie-gy-${opt.value}`} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="h-[460px] bg-white relative rounded-xl" ref={dynamicChartRef}>
              {dynamicChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {dynChartType === 'bar' ? (
                    <BarChart data={dynamicChartData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} angle={-25} textAnchor="end" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={val => dynYAxis === 'budget' ? new Intl.NumberFormat('vi-VN').format(val) : val} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(val: number) => [dynYAxis === 'budget' ? new Intl.NumberFormat('vi-VN').format(val) + ' triệu VNĐ' : val, dynYAxis === 'budget' ? 'Kinh phí' : 'Số lượng']} />
                      <Bar dataKey="value" name={dynYAxis === 'budget' ? 'Kinh phí' : 'Số lượng'} radius={[6, 6, 0, 0]}>
                        {dynamicChartData.map((entry, index) => {
                          const pieCols = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1', '#06b6d4', '#f97316'];
                          return <Cell key={`cell-${index}`} fill={pieCols[index % pieCols.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  ) : dynChartType === 'line' ? (
                    <LineChart data={dynamicChartData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} angle={-25} textAnchor="end" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={val => dynYAxis === 'budget' ? new Intl.NumberFormat('vi-VN').format(val) : val} />
                      <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(val: number) => [dynYAxis === 'budget' ? new Intl.NumberFormat('vi-VN').format(val) + ' triệu VNĐ' : val, dynYAxis === 'budget' ? 'Kinh phí' : 'Số lượng']} />
                      <Line type="monotone" dataKey="value" stroke="#9333ea" strokeWidth={3} dot={{ r: 4, fill: '#9333ea', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0, stroke: '#fff' }} name={dynYAxis === 'budget' ? 'Kinh phí' : 'Số lượng'} />
                    </LineChart>
                  ) : (
                    <PieChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <Pie
                        data={dynamicChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={150}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {dynamicChartData.map((entry, index) => {
                          const pieCols = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1', '#06b6d4', '#f97316'];
                          return <Cell key={`cell-${index}`} fill={pieCols[index % pieCols.length]} />;
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(val: number) => [dynYAxis === 'budget' ? new Intl.NumberFormat('vi-VN').format(val) + ' triệu VNĐ' : val, dynYAxis === 'budget' ? 'Kinh phí' : 'Số lượng']} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <svg className="w-12 h-12 mb-3 text-slate-300 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  <p className="text-sm font-semibold tracking-wide">Chưa có dữ liệu</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Sidebar */}
        <div className="w-full xl:w-80 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-2"></span>
                Bộ Lọc Dữ Liệu
              </h3>

            </div>

            <div className="space-y-4">
              {/* Filter Group: Năm */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Năm bắt đầu
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
                  value={selectedStartDate}
                  onChange={e => setSelectedStartDate(e.target.value)}
                >
                  <option value="all">Tất cả các năm bắt đầu({availableStartDate.length})</option>
                  {availableStartDate.map(StartDate => (
                    <option key={StartDate} value={StartDate}>{StartDate}</option>
                  ))}
                </select>
              </div>

              {/* Filter Group: Trạng thái */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Trạng thái
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  {availableStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Filter Group: Lĩnh vực */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Lĩnh vực
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
                  value={selectedResearchField}
                  onChange={e => setSelectedResearchField(e.target.value)}
                >
                  <option value="all">Tất cả lĩnh vực</option>
                  {availableResearchFields.map(field => (
                    <option key={field} value={field}>{field}</option>
                  ))}
                </select>
              </div>

              {/* Filter Group: Đơn vị */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Đơn vị
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
                  value={selectedDepartment}
                  onChange={e => setSelectedDepartment(e.target.value)}
                >
                  <option value="all">Tất cả đơn vị</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Filter Info */}
              <div className="pt-4 border-t border-slate-100">
                <div className="bg-blue-50 rounded-xl p-3 flex items-start">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-700 font-medium">
                    Đang hiển thị {filteredProjects.length}/{projects.length} đề tài.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 md:bottom-10 md:left-10 z-[70] flex flex-col items-start max-w-[calc(100%-32px)]">
        {isChatOpen && (
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl border border-slate-100 w-full md:w-[350px] mb-2 md:mb-4 flex flex-col overflow-hidden animate-slideUp">
            <div className="p-4 md:p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-xs md:text-sm uppercase tracking-wider">Trợ lý ảo UMP</h3>
                  <p className="text-[9px] md:text-[10px] font-bold text-blue-100 opacity-80">AI đang trực tuyến</p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/10 p-1.5 rounded-xl transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <div className="h-[280px] md:h-[400px] overflow-y-auto p-4 md:p-6 space-y-3 md:space-y-4 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                  <div className={`max-w-[85%] p-3 md:p-4 rounded-2xl text-[11px] md:text-xs font-medium leading-relaxed shadow-sm ${msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start animate-pulse">
                  <div className="bg-white border border-slate-100 p-3 md:p-4 rounded-2xl rounded-tl-none space-x-1 flex items-center">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 md:p-4 bg-white border-t border-slate-100 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Câu hỏi của bạn..."
                className="flex-1 bg-slate-50 border-none px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
              <button
                type="submit"
                disabled={!userInput.trim() || isChatLoading}
                className="bg-blue-600 text-white p-2.5 md:p-3 rounded-xl md:rounded-2xl hover:bg-blue-700 disabled:bg-slate-200 transition-all shadow-lg shadow-blue-100 active:scale-90"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        )}

        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`group flex items-center space-x-3 bg-gradient-to-br from-blue-600 to-indigo-800 text-white px-4 py-3 md:px-6 md:py-4 rounded-[24px] md:rounded-[32px] shadow-2xl hover:shadow-blue-200 transition-all active:scale-95 ${isChatOpen ? 'scale-0 opacity-0 pointer-events-none' : ''}`}
        >
          <div className="relative">
            <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-ping"></div>
          </div>
          <div className="text-left hidden md:block">
            <span className="block text-xs font-black uppercase tracking-widest leading-none">Trợ lý ảo UMP</span>
            <span className="text-[10px] font-bold text-blue-200">Tôi có thể giúp gì cho bạn?</span>
          </div>
          <div className="text-left md:hidden">
            <span className="block text-[10px] font-black uppercase tracking-widest leading-none">Chat AI</span>
          </div>
        </button>
      </div>

      {/* Fullscreen Chart Modal */}
      {expandedChart && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-10 animate-fadeIn" onClick={() => setExpandedChart(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                {expandedChart === 'status' && <><span className="w-2 h-8 bg-blue-600 rounded-full mr-3"></span> Trạng thái đề tài</>}
                {expandedChart === 'department' && <><span className="w-2 h-8 bg-emerald-600 rounded-full mr-3"></span> Kinh phí theo Đơn vị (Triệu VNĐ)</>}
                {expandedChart === 'product' && <><span className="w-2 h-8 bg-indigo-600 rounded-full mr-3"></span> Thống kê Sản phẩm Nghiên cứu</>}
                {expandedChart === 'dynamic' && <><span className="w-2 h-8 bg-purple-600 rounded-full mr-3"></span> Biểu đồ Thống kê</>}
              </h2>
              <button onClick={() => setExpandedChart(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors" title="Đóng">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 p-8">
              {expandedChart === 'status' && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={120} outerRadius={200} paddingAngle={8} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '14px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {expandedChart === 'department' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 14, fill: '#64748b' }} tickFormatter={(val) => new Intl.NumberFormat('vi-VN').format(val)} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 14, fill: '#475569', textAnchor: 'end' }} tickMargin={16} width={200} />
                    <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} formatter={(value: number) => [new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' triệu VNĐ', 'Kinh phí']} offset={24} allowEscapeViewBox={{ x: true, y: true }} />
                    <Bar dataKey="budget" radius={[0, 8, 8, 0]} name="Kinh phí">
                      {departmentData.map((entry, index) => {
                        const maxBudget = departmentData[0]?.budget || 1;
                        const intensity = Math.max(0, entry.budget / maxBudget);
                        return <Cell key={`cell-${index}`} fill={`rgba(37, 99, 235, ${0.4 + 0.6 * intensity})`} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
              {expandedChart === 'product' && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productData} barGap={12}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 14, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 14, fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '14px', paddingBottom: '20px' }} />
                    <Bar dataKey="Dự kiến" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="Thực tế" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {expandedChart === 'dynamic' && (
                <ResponsiveContainer width="100%" height="100%">
                  {dynChartType === 'bar' ? (
                    <BarChart data={dynamicChartData} margin={{ top: 40, right: 30, left: 10, bottom: 60 }} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b' }} angle={-25} textAnchor="end" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#64748b' }} tickFormatter={val => dynYAxis === 'budget' ? new Intl.NumberFormat('vi-VN').format(val) : val} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} formatter={(val: number) => [dynYAxis === 'budget' ? new Intl.NumberFormat('vi-VN').format(val) + ' triệu VNĐ' : val, dynYAxis === 'budget' ? 'Kinh phí' : 'Số lượng']} />
                      <Bar dataKey="value" name={dynYAxis === 'budget' ? 'Kinh phí' : 'Số lượng'} radius={[8, 8, 0, 0]}>
                        {dynamicChartData.map((entry, index) => {
                          const pieCols = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1', '#06b6d4', '#f97316'];
                          return <Cell key={`cell-${index}`} fill={pieCols[index % pieCols.length]} />;
                        })}
                      </Bar>
                    </BarChart>
                  ) : dynChartType === 'line' ? (
                    <LineChart data={dynamicChartData} margin={{ top: 40, right: 30, left: 10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#64748b' }} angle={-25} textAnchor="end" />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#64748b' }} tickFormatter={val => dynYAxis === 'budget' ? new Intl.NumberFormat('vi-VN').format(val) : val} />
                      <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} formatter={(val: number) => [dynYAxis === 'budget' ? new Intl.NumberFormat('vi-VN').format(val) + ' triệu VNĐ' : val, dynYAxis === 'budget' ? 'Kinh phí' : 'Số lượng']} />
                      <Line type="monotone" dataKey="value" stroke="#9333ea" strokeWidth={4} dot={{ r: 6, fill: '#9333ea', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0, stroke: '#fff' }} name={dynYAxis === 'budget' ? 'Kinh phí' : 'Số lượng'} />
                    </LineChart>
                  ) : (
                    <PieChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                      <Pie
                        data={dynamicChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={130}
                        outerRadius={220}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {dynamicChartData.map((entry, index) => {
                          const pieCols = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#6366f1', '#06b6d4', '#f97316'];
                          return <Cell key={`cell-${index}`} fill={pieCols[index % pieCols.length]} />;
                        })}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} formatter={(val: number) => [dynYAxis === 'budget' ? new Intl.NumberFormat('vi-VN').format(val) + ' triệu VNĐ' : val, dynYAxis === 'budget' ? 'Kinh phí' : 'Số lượng']} />
                      <Legend verticalAlign="bottom" height={40} wrapperStyle={{ fontSize: '14px' }} />
                    </PieChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Overview;
