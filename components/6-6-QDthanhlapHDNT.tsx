import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import * as mammoth from 'mammoth';

interface Schedule {
    id: string;
    content: string;
    timebox: string;
    results: string;
}

interface Deliverable {
    id: string;
    productName: string;
    quantity: string;
    quality: string;
}

export const ContractTemplateBuilder: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [contractNo, setContractNo] = useState('');
    const [date, setDate] = useState('');
    const [repA, setRepA] = useState('ĐẠI HỌC Y DƯỢC TP.HCM');
    const [repB, setRepB] = useState('');

    const [projectName, setProjectName] = useState('');
    const [projectCode, setProjectCode] = useState('');
    const [executionTime, setExecutionTime] = useState('');
    const [totalBudget, setTotalBudget] = useState('');

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [deliverables, setDeliverables] = useState<Deliverable[]>([]);

    const [toast, setToast] = useState<{ message: string, type: 'success' | 'err' } | null>(null);
    const [importedHtml, setImportedHtml] = useState<string>('');

    const docRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportWord = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                if (arrayBuffer) {
                    try {
                        const options = {
                            ignoreEmptyParagraphs: false,
                            styleMap: [
                                "p[style-name='Heading 1'] => h1:fresh",
                                "p[style-name='Heading 2'] => h2:fresh",
                                "p[style-name='Heading 3'] => h3:fresh",
                                "p[style-name='Heading 4'] => h4:fresh",
                                "p[style-name='Heading 5'] => h5:fresh",
                                "p[style-name='Heading 6'] => h6:fresh",
                            ]
                        };
                        const result = await mammoth.convertToHtml({ arrayBuffer }, options);
                        setImportedHtml(result.value);
                        handleAddTemplate(); // Retain mock data logic for exports
                        showToast(`Đã phân tích và import thành công: ${file.name}`, 'success');
                    } catch (error) {
                        showToast('Lỗi khi đọc file Word. Vui lòng thử file .docx hợp lệ!', 'err');
                    }
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    // Load from Draft
    useEffect(() => {
        const draft = localStorage.getItem('contractDraft');
        if (draft) {
            try {
                const data = JSON.parse(draft);
                setContractNo(data.contractNo || '');
                setDate(data.date || '');
                setRepA(data.repA || 'ĐẠI HỌC Y DƯỢC TP.HCM');
                setRepB(data.repB || '');
                setProjectName(data.projectName || '');
                setProjectCode(data.projectCode || '');
                setExecutionTime(data.executionTime || '');
                setTotalBudget(data.totalBudget || '');
                setSchedules(data.schedules || []);
                setDeliverables(data.deliverables || []);
            } catch (e) {
                console.error("Failed to parse draft");
            }
        }
    }, []);

    const handleAddTemplate = () => {
        setContractNo('256/HĐ-UMP');
        setDate('2026-05-15');
        setRepA('ĐẠI HỌC Y DƯỢC TP.HCM');
        setRepB('PGS.TS. Trần Văn B');
        setProjectName('Nghiên cứu ứng dụng công nghệ thực tế ảo trong đào tạo mô phỏng lâm sàng y khoa');
        setProjectCode('ĐHYD-2026-001');
        setExecutionTime('18 tháng');
        setTotalBudget('850000000');
        setTimeout(() => showToast('Đã điền tự động dữ liệu mẫu hợp đồng!'), 100);
    };

    const showToast = (message: string, type: 'success' | 'err' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSaveDraft = () => {
        const payload = { contractNo, date, repA, repB, projectName, projectCode, executionTime, totalBudget, schedules, deliverables };
        localStorage.setItem('contractDraft', JSON.stringify(payload));
        showToast('Đã lưu nháp vào Local Storage!');
    };

    const handleVerification = () => {
        if (!contractNo || !projectName || !totalBudget) {
            showToast('Lỗi: Cần nhập Số hợp đồng, Tên đề tài, Tổng kinh phí!', 'err');
            return false;
        }
        if (isNaN(Number(totalBudget.replace(/\D/g, '')))) {
            showToast('Lỗi: Tổng kinh phí phải là số!', 'err');
            return false;
        }
        return true;
    };

    const handleSaveDB = () => {
        if (!handleVerification()) return;
        showToast('Lưu hệ thống thành công (Mock Firebase Sync)!');
    };

    const handleExportPDF = async () => {
        if (!handleVerification()) return;
        if (!docRef.current) return;

        try {
            const canvas = await html2canvas(docRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`HopDong_${projectCode || 'Draft'}.pdf`);
            showToast('Đã xuất PDF!');
        } catch (e) {
            showToast('Xuất PDF thất bại', 'err');
        }
    };

    const handleExportDOCX = async () => {
        if (!handleVerification()) return;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM",
                        heading: HeadingLevel.HEADING_2,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 }
                    }),
                    new Paragraph({
                        text: "Độc lập - Tự do - Hạnh phúc",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        text: "HỢP ĐỒNG THỰC HIỆN ĐỀ TÀI",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({ text: `Số: ${contractNo}` }),
                    new Paragraph({ text: `Ngày: ${date}` }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: `Bên A (Chủ quản): ${repA}`, bullet: { level: 0 } }),
                    new Paragraph({ text: `Bên B (Chủ nhiệm): ${repB}`, bullet: { level: 0 } }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "ĐIỀU 1: NỘI DUNG VÀ THỜI GIAN THỰC HIỆN", heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: `Tên đề tài: ${projectName}` }),
                    new Paragraph({ text: `Mã số: ${projectCode}` }),
                    new Paragraph({ text: `Thời gian thực hiện: ${executionTime}` }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "ĐIỀU 2: KINH PHÍ ĐỀ TÀI", heading: HeadingLevel.HEADING_3 }),
                    new Paragraph({ text: `Tổng kinh phí: ${new Intl.NumberFormat('vi-VN').format(Number(totalBudget))} VNĐ` }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `HopDong_${projectCode || 'Draft'}.docx`);
        showToast('Đã xuất DOCX!');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm p-4 md:p-8 flex flex-col justify-center items-center animate-fadeIn overflow-hidden">
            <div className="bg-slate-50 w-full max-w-6xl h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header Actions */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-10 shrink-0">
                    <div className="flex items-center space-x-3">
                        <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                        <h2 className="text-xl font-black uppercase tracking-wider text-slate-800">Biểu mẫu Quyết định thành lập Hội đồng nghiệm thu</h2>
                    </div>
                    <div className="flex space-x-2">
                        <input type="file" ref={fileInputRef} onChange={handleImportWord} className="hidden" accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
                        <button onClick={handleAddTemplate} onDoubleClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm select-none">Thêm mẫu</button>
                        <div className="w-px h-8 bg-slate-200 mx-1 border-none"></div>
                        <button onClick={handleSaveDraft} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all">Lưu tạm</button>
                        <button onClick={handleSaveDB} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md">Lưu</button>
                        <div className="w-px h-8 bg-slate-200 mx-1 border-none"></div>
                        <button onClick={handleExportDOCX} className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center"><svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Tải DOCX</button>
                        <button onClick={handleExportPDF} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center"><svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Tải PDF</button>
                        <button onClick={onClose} className="p-2 ml-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                </div>

                {toast && (
                    <div className={`absolute top-20 right-8 px-6 py-3 rounded-xl shadow-xl font-bold text-sm z-50 animate-fadeIn flex items-center ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                        {toast.type === 'success' ? <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> : <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        {toast.message}
                    </div>
                )}

                {/* Form Body */}
                <div className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-slate-200">
                    <div ref={docRef} className="max-w-4xl mx-auto bg-white p-10 rounded-[20px] shadow-sm border border-slate-100 min-h-[500px]">
                        {importedHtml ? (
                            <div
                                className="w-full min-h-[500px] outline-none 
                                    focus:ring-2 focus:ring-blue-100 p-6 rounded-xl transition-all 
                                    text-[15px] leading-relaxed text-slate-900 focus:bg-slate-50/50 
                                    font-serif"
                                contentEditable={true}
                                suppressContentEditableWarning={true}
                                onBlur={(e) => setImportedHtml(e.currentTarget.innerHTML)}
                                dangerouslySetInnerHTML={{ __html: importedHtml }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full space-y-4 text-slate-400 mt-20">
                                <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                <p className="text-sm font-semibold uppercase tracking-wider">Chưa có dữ liệu Hợp đồng</p>
                                <p className="text-xs">Nhấp đúp nút 'Thêm mẫu' phía trên để tải lên file .docx</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
