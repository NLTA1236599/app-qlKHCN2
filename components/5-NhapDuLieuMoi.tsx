
import React, { useState, useEffect } from 'react';
import { ProjectStatus, ResearchProject, ProgressStatus } from '../types';

interface DataEntryProps {
  onSave: (project: Omit<ResearchProject, 'id' | 'history'>) => void;
  initialData?: ResearchProject | null;
  onCancel: () => void;
}

const PRODUCT_TYPES = [
  'Bài báo quốc tế',
  'Bài báo trong nước',
  'Sản phẩm dạng 2 (Mô hình/Quy trình)',
  'Đào tạo sinh viên',
  'Đào tạo Học viên sau đại học',
  'Đào tạo Nghiên cứu sinh',
  'Sách/Giáo trình',
  'Đăng ký sở hữu trí tuệ'
];

const CATEGORY_OPTIONS = ['Loại A', 'Loại B', 'Loại C', 'Loại D', 'Sinh viên', 'Tự túc kinh phí', 'Khác'];

const DataEntry: React.FC<DataEntryProps> = ({ onSave, initialData, onCancel }) => {
  const [formData, setFormData] = useState<Omit<ResearchProject, 'id' | 'history'>>({
    projectCode: '',
    contractId: '',
    contractDate: '',
    title: '',
    leadAuthor: '',
    leadAuthorBirthYear: '',
    leadAuthorGender: 'Nam',
    members: '',
    researchField: '',
    researchType: '',
    department: '',
    subDepartment: '',
    status: ProjectStatus.ONGOING,
    progressStatus: ProgressStatus.ON_TIME,
    budget: 0,
    budgetLumpSum: 0,
    budgetNonLumpSum: 0,
    budgetOtherSources: 0,
    budgetBatch1: 0,
    budgetBatch2: 0,
    budgetBatch3: 0,
    duration: '',
    startDate: '',
    endDate: '',
    extensionDate: '',
    reviewReportingDate: '',
    progressReportDate1: '',
    progressReportDate2: '',
    progressReportDate3: '',
    progressReportDate4: '',
    progressReportNote: '',
    acceptanceMeetingDate: '',
    reminderDate: '',
    outputProduct: '',
    categories: [],
    expectedProducts: [],
    actualProducts: [],
    actualProductDetails: '',
    certificateResultNumber: '',
    certificateResultDate: '',
    certificateResultIssuingAuthority: '',
    approvalDecision: '',
    authorizationDecision: '',
    acceptanceYear: '',
    acceptanceAcademicYear: '',
    acceptanceCompletionDate: '',
    isTransferred: false,
    terminationReason: '',
    description: ''
  });

  const [otherCategory, setOtherCategory] = useState('');

  // Helper to convert DD/MM/YYYY or other formats to YYYY-MM-DD for input[type="date"]
  const toInputDate = (str?: string) => {
    if (!str) return '';
    // If already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    // If DD/MM/YYYY
    if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(str)) {
      const parts = str.split('/'); // simple split is safer than regex match indexing
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    // Try Date parse (handle ISO strings or other parsable formats)
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return '';
  };

  useEffect(() => {
    if (initialData) {
      const { id, history, ...rest } = initialData;

      // Handle 'Khác' category extraction
      let loadedCategories = rest.categories || [];
      let loadedOtherText = '';

      // Find if there's a category starting with 'Khác: '
      const otherItem = loadedCategories.find(c => c.startsWith('Khác: '));
      if (otherItem) {
        loadedOtherText = otherItem.replace('Khác: ', '');
        // Replace the detailed string with just 'Khác' for the UI selection state
        loadedCategories = loadedCategories.map(c => c.startsWith('Khác: ') ? 'Khác' : c);
      }

      setOtherCategory(loadedOtherText);

      setFormData({
        ...rest,
        // Use the normalized categories for UI
        categories: loadedCategories,
        // Ensure controlled components don't warn about inputs changing from untroled to controlled
        projectCode: rest.projectCode || '',

        // Date Fields Conversion
        contractDate: toInputDate(rest.contractDate),
        certificateResultDate: toInputDate(rest.certificateResultDate),

        leadAuthorBirthYear: rest.leadAuthorBirthYear || '',
        leadAuthorGender: rest.leadAuthorGender || 'Nam',
        members: rest.members || '',
        researchField: rest.researchField || '',
        researchType: rest.researchType || '',
        budgetLumpSum: rest.budgetLumpSum || 0,
        budgetNonLumpSum: rest.budgetNonLumpSum || 0,
        budgetOtherSources: rest.budgetOtherSources || 0,
        budgetBatch1: rest.budgetBatch1 || 0,
        budgetBatch2: rest.budgetBatch2 || 0,
        budgetBatch3: rest.budgetBatch3 || 0,

        duration: rest.duration || '',

        startDate: toInputDate(rest.startDate),
        endDate: toInputDate(rest.endDate),
        extensionDate: toInputDate(rest.extensionDate),

        progressStatus: rest.progressStatus || ProgressStatus.ON_TIME,
        progressReportNote: rest.progressReportNote || '',

        reviewReportingDate: toInputDate(rest.reviewReportingDate),
        progressReportDate1: toInputDate(rest.progressReportDate1),
        progressReportDate2: toInputDate(rest.progressReportDate2),
        progressReportDate3: toInputDate(rest.progressReportDate3),
        progressReportDate4: toInputDate(rest.progressReportDate4),
        acceptanceMeetingDate: toInputDate(rest.acceptanceMeetingDate),
        reminderDate: toInputDate(rest.reminderDate),
        acceptanceCompletionDate: toInputDate(rest.acceptanceCompletionDate),

        outputProduct: rest.outputProduct || '',
        actualProductDetails: rest.actualProductDetails || '',
        certificateResultNumber: rest.certificateResultNumber || '',
        certificateResultIssuingAuthority: rest.certificateResultIssuingAuthority || '',
        approvalDecision: rest.approvalDecision || '',
        authorizationDecision: rest.authorizationDecision || '',
        acceptanceYear: rest.acceptanceYear || '',
        acceptanceAcademicYear: rest.acceptanceAcademicYear || '',
        terminationReason: rest.terminationReason || '',
        isTransferred: rest.isTransferred || false,
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Custom Validation
    if (!formData.contractId) { alert('Vui lòng nhập Số Hợp đồng'); return; }
    if (!formData.title) { alert('Vui lòng nhập Tên đề tài'); return; }
    if (!formData.leadAuthor) { alert('Vui lòng nhập Chủ nhiệm đề tài'); return; }
    if (!formData.department) { alert('Vui lòng nhập Khoa / Đơn vị'); return; }
    if (formData.categories.length === 0) { alert('Vui lòng chọn ít nhất một Loại đề tài'); return; }

    // Process categories to include custom "Khác" text
    const processedCategories = formData.categories.map(cat => {
      if (cat === 'Khác' && otherCategory.trim()) {
        return `Khác: ${otherCategory.trim()}`;
      }
      return cat;
    });

    onSave({
      ...formData,
      categories: processedCategories
    });
  };

  const updateProductCount = (field: 'expectedProducts' | 'actualProducts', type: string, count: number) => {
    setFormData(prev => {
      const currentList = [...(prev[field] || [])];
      const index = currentList.findIndex(p => p.type === type);

      if (count <= 0) {
        const newList = currentList.filter(p => p.type !== type);
        return { ...prev, [field]: newList };
      }

      if (index > -1) {
        currentList[index] = { ...currentList[index], count };
      } else {
        currentList.push({ type, count });
      }
      return { ...prev, [field]: currentList };
    });
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => {
      const newCats = prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: newCats };
    });
  };

  const getProductCount = (field: 'expectedProducts' | 'actualProducts', type: string) => {
    return formData[field]?.find(p => p.type === type)?.count || 0;
  };

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center sticky top-0 z-30">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? `Chỉnh sửa: ${formData.title}` : 'Thêm mới Đề tài Nghiên cứu'}
          </h2>
          <div className="flex space-x-3">
            <button onClick={onCancel} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-lg">Hủy</button>
            <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200">LƯU THAY ĐỔI</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-10">
          {/* SECTION 1: CONTRACT (Excel 1-2) */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">1. Hợp đồng & Giấy chứng nhận</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Số Hợp đồng <span className="text-red-500">*</span></label>
                <input type="text" placeholder="51/2023/HĐ-ĐHYD ký ngày 20/3/2023" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.contractId} onChange={e => setFormData({ ...formData, contractId: e.target.value })} required />
                <div className="mt-1">
                  <label className="text-[10px] uppercase text-slate-400 font-bold mr-2">Ngày ký:</label>
                  <input type="date" className="p-1 border rounded text-xs" value={formData.contractDate} onChange={e => setFormData({ ...formData, contractDate: e.target.value })} />
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <div className="col-span-3 text-[10px] font-bold text-slate-500 uppercase mb-1">Giấy chứng nhận đăng ký kết quả</div>
                <div className="col-span-1">
                  <input type="text" placeholder="Số GCN" className="w-full p-1.5 border rounded text-sm" value={formData.certificateResultNumber} onChange={e => setFormData({ ...formData, certificateResultNumber: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <input type="date" className="w-full p-1.5 border rounded text-sm" value={formData.certificateResultDate} onChange={e => setFormData({ ...formData, certificateResultDate: e.target.value })} />
                </div>
                <div className="col-span-1">
                  <input type="text" placeholder="Nơi cấp" className="w-full p-1.5 border rounded text-sm" value={formData.certificateResultIssuingAuthority} onChange={e => setFormData({ ...formData, certificateResultIssuingAuthority: e.target.value })} />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: GENERAL INFO (Excel 3-11) */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">2. Thông tin Chung & Nhân sự</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-4 md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên đề tài <span className="text-red-500">*</span></label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Chủ nhiệm đề tài <span className="text-red-500">*</span></label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.leadAuthor} onChange={e => setFormData({ ...formData, leadAuthor: e.target.value })} required />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Năm sinh</label>
                <input type="number" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center" value={formData.leadAuthorBirthYear} onChange={e => setFormData({ ...formData, leadAuthorBirthYear: e.target.value })} />
              </div>

              <div className="col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Thành viên tham gia</label>
                <textarea rows={2} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Liệt kê tên các thành viên..." value={formData.members} onChange={e => setFormData({ ...formData, members: e.target.value })} />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Lĩnh vực NC</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.researchField} onChange={e => setFormData({ ...formData, researchField: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Loại hình NC</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.researchType} onChange={e => setFormData({ ...formData, researchType: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-2">Loại đề tài (Tags) <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`px-2 py-0.5 text-[10px] rounded-full border font-bold transition-all ${formData.categories.includes(cat) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500'}`}>{cat}</button>
                  ))}
                </div>
                {formData.categories.includes('Khác') && (
                  <input type="text" placeholder="Ghi rõ..." className="mt-1 w-full p-1 border rounded text-xs bg-blue-50" value={otherCategory} onChange={(e) => setOtherCategory(e.target.value)} />
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Bộ môn</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.subDepartment} onChange={e => setFormData({ ...formData, subDepartment: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Khoa / Đơn vị <span className="text-red-500">*</span></label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required />
              </div>
            </div>
          </section>

          {/* SECTION 3: DECISIONS (Excel 12-13) */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">3. Quyết định</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">QĐ Xét duyệt</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.approvalDecision} onChange={e => setFormData({ ...formData, approvalDecision: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">QĐ Phê duyệt</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.authorizationDecision} onChange={e => setFormData({ ...formData, authorizationDecision: e.target.value })} />
              </div>
            </div>
          </section>

          {/* SECTION 4: BUDGET (Excel 14-18) */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">4. Kinh phí (VNĐ)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Tổng Kinh phí</label>
                <input type="number" className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-700" value={formData.budget} onChange={e => setFormData({ ...formData, budget: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Kinh phí khoán</label>
                <input type="number" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.budgetLumpSum} onChange={e => setFormData({ ...formData, budgetLumpSum: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">KP Không khoán</label>
                <input type="number" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.budgetNonLumpSum} onChange={e => setFormData({ ...formData, budgetNonLumpSum: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nguồn khác</label>
                <input type="number" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.budgetOtherSources} onChange={e => setFormData({ ...formData, budgetOtherSources: parseInt(e.target.value) || 0 })} />
              </div>

              <div className="col-span-1 md:col-start-2 border-t pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Cấp Đợt 1</label>
                <input type="number" className="w-full p-2 border rounded-lg outline-none text-sm" value={formData.budgetBatch1} onChange={e => setFormData({ ...formData, budgetBatch1: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="col-span-1 border-t pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Cấp Đợt 2</label>
                <input type="number" className="w-full p-2 border rounded-lg outline-none text-sm" value={formData.budgetBatch2} onChange={e => setFormData({ ...formData, budgetBatch2: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="col-span-1 border-t pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Cấp Đợt 3</label>
                <input type="number" className="w-full p-2 border rounded-lg outline-none text-sm" value={formData.budgetBatch3} onChange={e => setFormData({ ...formData, budgetBatch3: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </section>

          {/* SECTION 5: TIME & PROGRESS (Excel 19-27) */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">5. Thời gian & Tiến độ</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Thời gian TH (chữ)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Bắt đầu</label>
                <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Kết thúc</label>
                <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Gia hạn</label>
                <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.extensionDate} onChange={e => setFormData({ ...formData, extensionDate: e.target.value })} />
              </div>

              <div className="col-span-1 bg-blue-50 p-2 rounded">
                <label className="block text-xs font-bold text-blue-700 mb-1">BC Giám định</label>
                <input type="date" className="w-full p-1 border rounded text-sm" value={formData.reviewReportingDate} onChange={e => setFormData({ ...formData, reviewReportingDate: e.target.value })} />
              </div>
              <div className="col-span-3 grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded">
                <div className="col-span-4 text-[10px] font-bold text-slate-500 uppercase">Thời gian Báo cáo Tiến độ (1-4)</div>
                <input type="date" className="p-1 border rounded text-xs" value={formData.progressReportDate1} onChange={e => setFormData({ ...formData, progressReportDate1: e.target.value })} />
                <input type="date" className="p-1 border rounded text-xs" value={formData.progressReportDate2} onChange={e => setFormData({ ...formData, progressReportDate2: e.target.value })} />
                <input type="date" className="p-1 border rounded text-xs" value={formData.progressReportDate3} onChange={e => setFormData({ ...formData, progressReportDate3: e.target.value })} />
                <input type="date" className="p-1 border rounded text-xs" value={formData.progressReportDate4} onChange={e => setFormData({ ...formData, progressReportDate4: e.target.value })} />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Tiến độ thực hiện</label>
                <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.progressStatus} onChange={e => setFormData({ ...formData, progressStatus: e.target.value as ProgressStatus })}>
                  {Object.values(ProgressStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú về nộp BC</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.progressReportNote} onChange={e => setFormData({ ...formData, progressReportNote: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngày họp NT</label>
                <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.acceptanceMeetingDate} onChange={e => setFormData({ ...formData, acceptanceMeetingDate: e.target.value })} />
              </div>
            </div>
          </section>

          {/* SECTION 6: OUTCOMES & STATUS (Excel 28-31) */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">6. Kết quả & Tình trạng</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-4 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Sản phẩm đầu ra (Tóm tắt)</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.outputProduct} onChange={e => setFormData({ ...formData, outputProduct: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Tình trạng *</label>
                <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as ProjectStatus })}>
                  {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-1 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Năm NT</label>
                  <input type="text" className="w-full p-2 border rounded-lg text-center" value={formData.acceptanceYear} onChange={e => setFormData({ ...formData, acceptanceYear: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Năm học</label>
                  <input type="text" className="w-full p-2 border rounded-lg text-center" value={formData.acceptanceAcademicYear} onChange={e => setFormData({ ...formData, acceptanceAcademicYear: e.target.value })} />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 7: DETAILED PRODUCTS (Excel 32-33) */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">7. Sản phẩm chi tiết</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Sản phẩm Cam kết</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {PRODUCT_TYPES.map(type => (
                    <div key={`expect-${type}`} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-xs text-slate-600">{type}</span>
                      <input type="number" min="0" className="w-16 px-2 py-1 border rounded text-center text-sm font-bold" value={getProductCount('expectedProducts', type)} onChange={(e) => updateProductCount('expectedProducts', type, parseInt(e.target.value) || 0)} />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700 mb-3">Sản phẩm Thực tế</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {PRODUCT_TYPES.map(type => (
                    <div key={`actual-${type}`} className="flex justify-between items-center p-2 bg-emerald-50 rounded border border-emerald-100">
                      <span className="text-xs text-slate-600">{type}</span>
                      <input type="number" min="0" className="w-16 px-2 py-1 border border-emerald-300 rounded text-center text-sm font-bold text-emerald-700" value={getProductCount('actualProducts', type)} onChange={(e) => updateProductCount('actualProducts', type, parseInt(e.target.value) || 0)} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Chi tiết Sản phẩm thực tế (Tên bài báo, số hiệu, ...)</label>
                <textarea rows={3} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700" value={formData.actualProductDetails} onChange={e => setFormData({ ...formData, actualProductDetails: e.target.value })} placeholder="Vui lòng ghi rõ chi tiết sản phẩm..."></textarea>
              </div>
            </div>
          </section>

          {/* SECTION 8: OTHER INFO (Excel 34-39) */}
          <section className="space-y-4">
            <h3 className="text-sm font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-2">8. Thông tin khác</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Thời điểm nhắc</label>
                <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.reminderDate} onChange={e => setFormData({ ...formData, reminderDate: e.target.value })} />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Thời điểm NT (Hoàn tất)</label>
                <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.acceptanceCompletionDate} onChange={e => setFormData({ ...formData, acceptanceCompletionDate: e.target.value })} />
              </div>
              <div className="col-span-2">
                {/* Project Code here as per Excel order near end */}
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã số ĐT</label>
                <input
                  type="text"
                  placeholder="ĐT-2023-..."
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                  value={formData.projectCode}
                  onChange={e => setFormData({ ...formData, projectCode: e.target.value })}
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính Chủ nhiệm</label>
                <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.leadAuthorGender} onChange={e => setFormData({ ...formData, leadAuthorGender: e.target.value })}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              <div className="col-span-1 flex items-center pt-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.isTransferred} onChange={e => setFormData({ ...formData, isTransferred: e.target.checked })} />
                  <span className="text-sm font-bold text-slate-700">Chuyển tiếp</span>
                </label>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Lý do thanh lý</label>
                <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-red-600" value={formData.terminationReason} onChange={e => setFormData({ ...formData, terminationReason: e.target.value })} />
              </div>

              <div className="col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả/Ghi chú chung</label>
                <textarea rows={2} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
          </section>

        </form>
      </div>
    </div>
  );
};

export default DataEntry;
