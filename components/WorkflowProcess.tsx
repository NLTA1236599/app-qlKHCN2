
import React from 'react';

const WorkflowProcess: React.FC = () => {

    const serviceData = [
        {
            section: "I. Xét chọn đề tài",
            items: [
                { stt: 1, name: "Phiếu đăng ký đề tài NCKH", code: "ĐHYD-NCKH/QT.02/BM.01" },
                { stt: 2, name: "Đề cương đề tài NCKH", code: "ĐHYD-NCKH/QT.02/BM.02" },
                { stt: 3, name: "Thuyết minh dự án SXTN cấp cơ sở", code: "ĐHYD-NCKH/QT.02/BM.03" },
                { stt: 4, name: "Lý lịch khoa học của chủ nhiệm đề tài", code: "ĐHYD-NCKH/QT.02/BM.04" },
                { stt: 5, name: "Danh sách đề tài NCKH đăng ký thực hiện do bộ môn tổ chức", code: "ĐHYD-NCKH/QT.02/BM.05" },
                { stt: 6, name: "Đề xuất hội đồng xét duyệt đề cương do bộ môn/chuyên khoa đề nghị", code: "ĐHYD-NCKH/QT.02/BM.06" },
                { stt: 7, name: "Đề xuất hội đồng xét duyệt đề cương do Khoa/đơn vị đề nghị", code: "ĐHYD-NCKH/QT.02/BM.07" },
                { stt: 8, name: "Danh sách đề tài NCKH đã được HĐ xét duyệt ở đủ điều kiện", code: "ĐHYD-NCKH/QT.02/BM.08" },
                { stt: 9, name: "Biên bản họp hội đồng xét duyệt đề cương", code: "ĐHYD-NCKH/QT.02/BM.09" },
                { stt: 10, name: "Biên bản kiểm phiếu đánh giá hồ sơ tuyển chọn đề tài", code: "ĐHYD-NCKH/QT.02/BM.10" },
                { stt: 11, name: "Phiếu chấm điểm hồ sơ đăng ký đề tài NCKH", code: "ĐHYD-NCKH/QT.02/BM.11" },
                { stt: 12, name: "Quyết định thành lập Hội đồng khoa học duyệt đề cương", code: "ĐHYD-NCKH/QT.02/BM.12" },
            ]
        },
        {
            section: "II. Nghiệm thu đề tài",
            items: [
                { stt: 1, name: "Phiếu đăng ký nghiệm thu đề tài cấp cơ sở của chủ nhiệm", code: "ĐHYD-NCKH/QT.04/BM.01" },
                { stt: 2, name: "Hướng dẫn viết báo cáo tổng hợp", code: "ĐHYDNCKH/QT.04/BM.BCTH" },
                { stt: 3, name: "Danh sách đề xuất hội đồng nghiệm thu đề tài cấp cơ sở", code: "ĐHYD-NCKH/QT.04/BM.02" },
                { stt: 4, name: "Quyết định thành lập Hội đồng nghiệm thu đề tài cấp cơ sở", code: "ĐHYD-NCKH/QT.04/BM.03" },
                { stt: 5, name: "Biên bản phiên họp HĐKH nghiệm thu", code: "ĐHYD-NCKH/QT.04/BM.04" },
                { stt: 6, name: "Biên bản kiểm phiếu đánh giá kết quả nghiệm thu", code: "ĐHYD-NCKH/QT.04/BM.05" },
                { stt: 7, name: "Bản nhận xét của thành viên HĐKH", code: "ĐHYD-NCKH/QT.04/BM.06" },
                { stt: 8, name: "Phiếu đánh giá kết quả đề tài", code: "ĐHYD-NCKH/QT.04/BM.07" },
                { stt: 9, name: "Thanh lý hợp đồng NCKH", code: "ĐHYD-NCKH/QT.04/BM.08" },
                { stt: 10, name: "Danh sách đề tài NCKH đã nghiệm thu đề nghị quyết toán", code: "ĐHYD-NCKH/QT.04/BM.09" },
                { stt: 11, name: "Giấy xác nhận đã nộp lưu chiểu", code: "ĐHYD-TV/QT.12/BM.01" },
                { stt: 12, name: "Giấy thỏa thuận về việc số hóa, công khai và khai thác", code: "ĐHYD-TV/QT.12/BM.02" },
            ]
        }
    ];

    return (
        <div className="space-y-12 animate-fadeIn pb-20">

            {/* Service & Administrative Procedures Table */}
            <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Danh mục dịch vụ công & Thủ tục hành chính</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-none">Chi tiết các biểu mẫu và thủ tục tương ứng</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest border-r border-white/10 w-16">STT</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest border-r border-white/10">Tên dịch vụ công</th>
                                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest border-r border-white/10">Thủ tục hành chính tương ứng</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest border-r border-white/10 text-center">Chi tiết</th>
                                <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-center">Thực hiện</th>
                            </tr>
                        </thead>
                        <tbody>
                            {serviceData.map((section, sIdx) => (
                                <React.Fragment key={sIdx}>
                                    <tr className="bg-blue-50/80">
                                        <td colSpan={5} className="px-8 py-4 text-sm font-black text-blue-800 uppercase tracking-wider text-center border-b border-blue-100">
                                            {section.section}
                                        </td>
                                    </tr>
                                    {section.items.map((item, iIdx) => (
                                        <tr key={`${sIdx}-${iIdx}`} className="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 font-medium text-slate-600">
                                            <td className="px-6 py-4 text-center border-r border-slate-100 font-bold text-slate-400">{item.stt}</td>
                                            <td className="px-8 py-4 border-r border-slate-100 text-slate-800 font-bold text-sm">{item.name}</td>
                                            <td className="px-8 py-4 border-r border-slate-100 text-xs font-mono text-slate-500 uppercase">{item.code}</td>
                                            <td className="px-6 py-4 border-r border-slate-100 text-center">
                                                <button className="text-blue-600 hover:text-blue-800 font-black text-[10px] uppercase tracking-widest underline underline-offset-4 decoration-2">Link</button>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">Thực hiện</button>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorkflowProcess;
