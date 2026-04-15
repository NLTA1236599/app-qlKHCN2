
import React, { useState } from 'react';
import { ContractTemplateBuilder } from './6-3-HopdongDetai';

const WorkflowProcess: React.FC = () => {
    const [showContractBuilder, setShowContractBuilder] = useState(false);

    const serviceData = [
        {
            section: "I. Dành cho chủ nhiệm đề tài",
            items: [
                { stt: 1, name: "Biểu mẫu đăng ký đề tài cấp cơ sở", url: "https://ump.edu.vn/nghien-cuu-khoa-hoc/de-tai-nghien-cuu/cap-co-so" },
                { stt: 2, name: "Biểu mẫu phục vụ Hội đồng xét duyệt hồ sơ đăng ký đề tài cấp cơ sở", url: "https://ump.edu.vn/nghien-cuu-khoa-hoc/de-tai-nghien-cuu/cap-co-so" },
                { stt: 3, name: "Biểu mẫu báo cáo tiến độ đề tài cấp cơ sở", url: "https://ump.edu.vn/nghien-cuu-khoa-hoc/de-tai-nghien-cuu/cap-co-so" },
                { stt: 4, name: "Biểu mẫu nộp đăng ký nghiệm thu đề tài cấp cơ sở", url: "https://ump.edu.vn/nghien-cuu-khoa-hoc/de-tai-nghien-cuu/cap-co-so" },
                { stt: 5, name: "Biểu mẫu Hội đồng nghiệm thu đề tài cấp cơ sở", url: "https://ump.edu.vn/nghien-cuu-khoa-hoc/de-tai-nghien-cuu/cap-co-so" },
                { stt: 6, name: "Biểu mẫu nộp lưu chiểu kết quả nghiên cứu về Thư viện", url: "https://ump.edu.vn/nghien-cuu-khoa-hoc/de-tai-nghien-cuu/cap-co-so" },
                { stt: 7, name: "Biểu mẫu thanh lý đề tài", url: "https://ump.edu.vn/nghien-cuu-khoa-hoc/de-tai-nghien-cuu/cap-co-so" },
                { stt: 8, name: "SOPs xét chọn đề tài cấp cơ sở - Phiên bản 2.0", url: "https://admin.ump.edu.vn/uploads/ckeditor/files/Truong/NghienCuuKhoaHoc/2020_QUI%20TRINH%20XET%20CHON%20DE%20TAI%20NCKH_ver2_final.pdf" },
                { stt: 9, name: "SOPs nghiệm thu đề tài cấp cơ sở - Phiên bản 1.0", url: "https://admin.ump.edu.vn/uploads/ckeditor/files/0503_QUI%20TRINH%20NGHIEM%20THU%20DE%20TAI%20NCKH_ver1_web.pdf" },
            ]
        },
        {
            section: "II. Dành cho chuyên viên",
            items: [
                { stt: 1, name: "SOPs quản lý đề tài nghiên cứu khoa học cấp cơ sở - Phiên bản 1.0", url: "https://admin.ump.edu.vn/uploads/ckeditor/files/Truong/NghienCuuKhoaHoc/Bieu%20mau%20Quan%20ly%20de%20tai%20cap%20co%20so/0503_QUI%20TRINH%20QUAN%20LY%20DE%20TAI%20NCKH_ver1_web.pdf" },
                { stt: 2, name: "Quyết định thành lập Hội đồng xét duyệt" },
                { stt: 3, name: "Quyết định phê duyệt đề tài" },
                { stt: 4, name: "Hợp đồng đề tài" },
                { stt: 5, name: "Phụ lục hợp đồng" },
                { stt: 6, name: "Quyết định thành lập Hội đồng Giám định" },
                { stt: 7, name: "Quyết định thành lập Hội đồng Nghiệm thu" },
                { stt: 8, name: "Biên bản thanh lý" },
                { stt: 9, name: "Giấy chứng nhận" },
            ]
        }
    ];

    return (
        <div className="space-y-12 animate-fadeIn pb-20">

            {/* Service & Administrative Procedures Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Danh mục các thủ tục hành chính</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-none">Chi tiết các biểu mẫu và thủ tục tương ứng</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-blue-600 text-white">
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest border-r border-white/10 w-16 text-center">STT</th>
                                <th className="px-8 py-5 text-xs font-black uppercase tracking-widest border-r border-white/10">Danh mục</th>
                                <th className="px-6 py-5 text-xs font-black uppercase tracking-widest border-r border-white/10 text-center">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {serviceData.map((section, sIdx) => (
                                <React.Fragment key={sIdx}>
                                    <tr className="bg-blue-50/80">
                                        <td colSpan={3} className="px-8 py-5 text-[15px] font-black text-blue-800 uppercase tracking-wider text-center border-b border-blue-100">
                                            {section.section}
                                        </td>
                                    </tr>
                                    {section.items.map((item, iIdx) => (
                                        <tr key={`${sIdx}-${iIdx}`} className="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 font-medium text-slate-600">
                                            <td className="px-6 py-5 text-center border-r border-slate-100 font-black text-slate-400 text-base">{item.stt}</td>
                                            <td className="px-8 py-5 border-r border-slate-100 text-slate-800 font-bold text-[15px]">
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onDoubleClick={() => {
                                                        if (item.name === "Hợp đồng đề tài") {
                                                            setShowContractBuilder(true);
                                                        } else if ((item as any).url) {
                                                            window.open((item as any).url, '_blank');
                                                        }
                                                    }}
                                                    className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm select-none"
                                                >
                                                    Thực hiện
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showContractBuilder && <ContractTemplateBuilder onClose={() => setShowContractBuilder(false)} />}
        </div>
    );
};

export default WorkflowProcess;
