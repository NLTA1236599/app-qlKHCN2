

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ResearchProject } from "../types";

// Get API Key from Vite env
const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || "";
};

export const analyzeProjects = async (projects: ResearchProject[]): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    return "Vui lòng cấu hình VITE_GEMINI_API_KEY trong tệp .env để sử dụng tính năng này.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Dưới đây là danh sách các đề tài nghiên cứu khoa học của Trường Đại học Y Dược TPHCM:
    ${JSON.stringify(projects, null, 2)}
    
    Hãy phân tích tổng quan về tình hình nghiên cứu này. Bao gồm:
    1. Xu hướng nghiên cứu chính.
    2. Đánh giá về phân bổ ngân sách.
    3. Đề xuất 3 hướng nghiên cứu tiềm năng cho năm tới dựa trên dữ liệu này.
    
    Yêu cầu trả về bằng tiếng Việt, định dạng Markdown rõ ràng, chuyên nghiệp.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Không thể khởi tạo phân tích lúc này.";
  } catch (error) {
    console.error("AI analysis error:", error);
    return "Có lỗi xảy ra khi gọi trợ lý AI. Vui lòng kiểm tra lại cấu hình API Key.";
  }
};

export const chatWithAssistant = async (query: string, projects: ResearchProject[]): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "PLACEHOLDER_API_KEY") {
    return "Vui lòng cấu hình VITE_GEMINI_API_KEY để trò chuyện cùng trợ lý AI.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `
      Bạn là "Trợ lý ảo Nghiên cứu Khoa học UMP", chuyên gia hỗ trợ quản lý đề tài tại Trường Đại học Y Dược TPHCM.
      Bạn có quyền truy cập vào dữ liệu các đề tài nghiên cứu hiện tại của trường:
      Dữ liệu: ${JSON.stringify(projects)}

      Nhiệm vụ của bạn:
      1. Trả lời chính xác các câu hỏi về thông tin đề tài (mã hợp đồng, chủ nhiệm, trạng thái, tiến độ, ngân sách).
      2. Nếu người dùng hỏi về một mã hợp đồng cụ thể (VD: 01/2025), hãy tìm trong dữ liệu và báo cáo chi tiết về trạng thái (đã nghiệm thu, đang thực hiện, v.v.) và các mốc thời gian liên quan.
      3. Nếu không tìm thấy thông tin, hãy trả lời lịch sự là không tìm thấy đề tài đó trong hệ thống.
      4. Trả lời ngắn gọn, chuyên nghiệp, súc tích bằng tiếng Việt.
      5. Nếu được hỏi về phân tích hoặc dự báo, hãy dựa trên dữ liệu hiện có để đưa ra nhận định khách quan.
    `,
  });

  try {
    const result = await model.generateContent(query);
    const response = await result.response;
    return response.text() || "Xin lỗi, tôi không thể trả lời câu hỏi này lúc này.";
  } catch (error) {
    console.error("Assistant Chat Error:", error);
    return "Đã xảy ra lỗi khi kết nối với máy chủ AI. Vui lòng thử lại sau.";
  }
};

