export const WORKFLOW_STEPS = [
    { step: 1, label: 'Đăng ký đề tài', duration: '' },
    { step: 2, label: 'Hoàn thiện thuyết minh', duration: '' },
    { step: 3, label: 'Trình ký QĐ thành lập HĐKH duyệt đề cương', duration: '' },
    { step: 4, label: 'Ký ban hành', duration: '' },
    { step: 5, label: 'Xét duyệt đề cương', duration: '' },
    { step: 6, label: 'Điều chỉnh đề cương theo góp ý hội đồng', duration: '' },
    { step: 7, label: 'Trình ký QĐ phê duyệt đề tài', duration: '' },
    { step: 8, label: 'BGH phê duyệt', duration: '' },
    { step: 9, label: 'Lập dự trù kinh phí; Tiến hành ký kết hợp đồng NCKH; Gửi hồ sơ đề tài được cấp KP cho phòng Kế hoạch tài chính', duration: '' },
    { step: 10, label: 'Triển khai thực hiện đề tài', duration: '' },
    { step: 11, label: 'Kiểm tra, báo cáo tiến độ', duration: '' },
    { step: 12, label: 'Đăng ký nghiệm thu', duration: '' },
    { step: 13, label: 'Xem xét, đề xuất HĐ nghiệm thu', duration: '' },
    { step: 14, label: 'Soạn thảo, trình BGH ký và ban hành quyết định thành lập HĐKH nghiệm thu đề tài', duration: '' },
    { step: 15, label: 'Nghiệm thu đề tài', duration: '' },
    { step: 16, label: 'Tiếp nhận và kiểm tra hồ sơ đã được HĐKH nghiệm thu', duration: '' },
    { step: 17, label: 'Tiếp thu ý kiến góp ý, chỉnh sửa, hoàn thiện hồ sơ nghiệm thu', duration: '' },
    { step: 18, label: 'Nhận hồ sơ đã chỉnh sửa từ chủ nhiệm đề tài', duration: '' },
    { step: 19, label: 'Nộp lưu chiểu', duration: '' },
    { step: 20, label: 'Cấp giấy chứng nhận nghiệm thu', duration: '' },
    { step: 21, label: 'Thanh quyết toán đề tài', duration: '' },
    { step: 22, label: 'Lưu hồ sơ', duration: '' }
];

export const STEP_TEMPLATES: Record<number, string[]> = {
    1: [
        'ĐHYD-NCKH/QT.02/BM.01 Phiếu đăng ký đề tài NCKH',
        'ĐHYD-NCKH/QT.02/BM.02 Đề cương đề tài NCKH',
        'ĐHYD-NCKH/QT.02/BM.03 Thuyết minh dự án SXTN cấp cơ sở',
        'ĐHYD-NCKH/QT.02/BM.04 Lý lịch khoa học của chủ nhiệm đề tài',
        'ĐHYD-NCKH/QT.02/BM.05 Danh sách đề tài NCKH đăng ký thực hiện do bộ môn tổng hợp',
        'ĐHYD-NCKH/QT.02/BM.06 Đề xuất hội đồng xét duyệt đề cương do bộ môn/chuyên ngành đề xuất',
        'ĐHYD-NCKH/QT.02/BM.07 Đề xuất hội đồng xét duyệt đề cương do Khoa/đơn vị đề xuất',
        'ĐHYD-NCKH/QT.02/BM.08 Danh sách đề tài NCKH đã được HĐ xét duyệt ở đủ điều kiện thực hiện'
    ],
    5: [
        'ĐHYD-NCKH/QT.02/BM.09 Biên bản họp hội đồng xét duyệt đề cương',
        'ĐHYD-NCKH/QT.02/BM.10 Biên bản kiểm phiếu đáng giá hồ sơ tuyển chọn đề tài',
        'ĐHYD-NCKH/QT.02/BM.11 Phiếu chấm điểm hồ sơ đăng ký đề tài NCKH',
        'ĐHYD-NCKH/QT.02/BM.12 Quyết định thành lập Hội đồng khoa học duyệt đề cương'
    ]
};
