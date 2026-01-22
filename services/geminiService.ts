import { GoogleGenAI } from "@google/genai";
import { ScenarioType } from "../types";

// Safe access to process.env to prevent "process is not defined" errors in some browser contexts
const getApiKey = () => {
  try {
    // @ts-ignore
    return process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();
// Initialize the AI instance only if key exists, otherwise we handle it in the function call
const ai = apiKey ? new GoogleGenAI({ apiKey: apiKey }) : null;

export const askGeminiAboutStrategy = async (
  scenario: ScenarioType,
  userQuestion: string
): Promise<string> => {
  const modelId = "gemini-3-flash-preview";
  
  if (!ai || !apiKey) {
    return "Lỗi: Chưa cấu hình API KEY. Vui lòng kiểm tra file .env hoặc cấu hình Environment Variables trên Vercel.";
  }
  
  // Updated Context: Focused on the 8-step logic
  const context = `
    Bạn là chuyên gia phân tích kỹ thuật. Hãy trả lời về CHIẾN LƯỢC BOX 8 BƯỚC:

    TRƯỜNG HỢP SHORT (Bán):
    Bước 1: Giá đang sóng giảm, xác định đáy gần nhất (Low 1).
    Bước 2: Sau Low 1, xác định đỉnh gần nhất (High 1).
    Bước 3: Xác định đáy gần nhất của High 1 là Low 2 (Điều kiện: Low 2 < Low 1).
    Bước 4: Xác định đỉnh gần nhất của Low 2 là High 2 (Điều kiện: High 2 < High 1).
    Bước 5: Giá cắt xuống phá vỡ Low 2.
    Bước 6: Tạo Box từ biên trên (giá cao nhất High 2) đến biên dưới (giá thấp nhất Low 1).
    Bước 7: Giá quay lại test vùng Box [Low 1, High 2].
    Bước 8: Nến Entry là nến kế tiếp sau nến chạm Box.

    TRƯỜNG HỢP LONG (Mua):
    Bước 1: Giá đang sóng tăng, xác định đỉnh gần nhất (High 1).
    Bước 2: Sau High 1, xác định đáy gần nhất (Low 1).
    Bước 3: Xác định đỉnh gần nhất của Low 1 là High 2 (Điều kiện: High 2 > High 1).
    Bước 4: Xác định đáy gần nhất của High 2 là Low 2 (Điều kiện: Low 2 > Low 1).
    Bước 5: Giá cắt lên phá vỡ High 2.
    Bước 6: Tạo Box từ biên trên (giá cao nhất High 1) đến biên dưới (giá thấp nhất Low 2).
    Bước 7: Giá quay lại test vùng Box [Low 2, High 1].
    Bước 8: Nến Entry là nến kế tiếp sau nến chạm Box.

    Câu hỏi của người dùng: ${userQuestion}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        { role: 'user', parts: [{ text: `Context: ${context}\n\nQuestion: ${userQuestion}` }] }
      ]
    });
    
    return response.text || "Xin lỗi, tôi không thể tạo câu trả lời lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi khi kết nối với Gemini AI. Vui lòng kiểm tra lại API Key.";
  }
};