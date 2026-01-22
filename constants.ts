
import { ScenarioType, StrategyStep, StrategyLogic } from './types';

export const STRATEGY_LOGIC: Record<ScenarioType, StrategyLogic> = {
  [ScenarioType.LONG]: {
    context: "Sóng tăng. High 1 -> Low 1 -> High 2 -> Low 2 -> Breakout High 2.",
    pattern: "Box [Low 2 - High 1]. Tạo đỉnh H3, hồi về L3 (Box).",
    trigger: "Giá (L3) quay lại chạm vùng Box",
    filter: "Nến kế tiếp là Entry"
  },
  [ScenarioType.SHORT]: {
    context: "Sóng giảm. Low 1 -> High 1 -> Low 2 -> High 2 -> Breakout Low 2.",
    pattern: "Box [Low 1 - High 2]. Tạo đáy L3, hồi về H3 (Box).",
    trigger: "Giá (H3) quay lại chạm vùng Box",
    filter: "Nến kế tiếp là Entry"
  }
};

export const STRATEGY_STEPS: Record<ScenarioType, StrategyStep[]> = {
  [ScenarioType.LONG]: [
    { id: 1, title: "Bước 1", description: ["Giá đang sóng tăng, tìm đỉnh gần nhất (High 1)."] },
    { id: 2, title: "Bước 2", description: ["Sau khi xác định High 1, tìm đáy gần nhất (Low 1)."] },
    { id: 3, title: "Bước 3", description: ["Xác định đỉnh gần nhất của Low 1 là High 2.", "Điều kiện: High 2 > High 1."] },
    { id: 4, title: "Bước 4", description: ["Xác định đáy gần nhất của High 2 là Low 2.", "Điều kiện: Low 2 > Low 1."] },
    { id: 5, title: "Bước 5 – Box", description: ["Xác định Box từ biên trên (High 1) và biên dưới (Low 2)."] },
    { id: 6, title: "Bước 6 – Breakout", description: ["Giá cắt qua High 2.", "Tạo đỉnh cao nhất tạm thời (High 3)."] },
    { id: 7, title: "Bước 7 – Retest", description: ["Giá hồi về Box, nến chạm Box là Low 3.", "High 3 là đỉnh cao nhất giữa Low 2 và Low 3."] },
    { id: 8, title: "Bước 8 – Entry", description: ["Nến Entry là nến kế tiếp sau khi nến chạm Box."] }
  ],
  [ScenarioType.SHORT]: [
    { id: 1, title: "Bước 1", description: ["Giá đang sóng giảm, tìm đáy gần nhất (Low 1)."] },
    { id: 2, title: "Bước 2", description: ["Sau khi xác định Low 1, tìm đỉnh gần nhất (High 1)."] },
    { id: 3, title: "Bước 3", description: ["Xác định đáy gần nhất của High 1 là Low 2.", "Điều kiện: Low 2 < Low 1."] },
    { id: 4, title: "Bước 4", description: ["Xác định đỉnh gần nhất của Low 2 là High 2.", "Điều kiện: High 2 < High 1."] },
    { id: 5, title: "Bước 5 – Box", description: ["Xác định Box từ biên trên (High 2) và biên dưới (Low 1)."] },
    { id: 6, title: "Bước 6 – Breakout", description: ["Giá cắt qua Low 2.", "Tạo đáy thấp nhất tạm thời (Low 3)."] },
    { id: 7, title: "Bước 7 – Retest", description: ["Giá hồi về Box, nến chạm Box là High 3.", "Low 3 là đáy thấp nhất giữa Low 2 và High 3."] },
    { id: 8, title: "Bước 8 – Entry", description: ["Nến Entry là nến kế tiếp sau khi nến chạm Box."] }
  ]
};

// Mock Data updated to reflect Clear ZigZag Waves with L3/H3 logic
export const MOCK_DATA_SHORT = [
  { id: 1, open: 26, close: 25, high: 26.5, low: 24.5 },
  { id: 2, open: 25, close: 22, high: 25.0, low: 21.5 },
  { id: 3, open: 22, close: 20, high: 22.5, low: 20.0, label: "Low 1" }, // Low 1
  { id: 4, open: 20, close: 22, high: 22.8, low: 19.8 },
  { id: 5, open: 22, close: 23.5, high: 24.0, low: 21.5, label: "High 1" }, // High 1
  { id: 6, open: 23.5, close: 21, high: 23.8, low: 20.5 },
  { id: 7, open: 21, close: 18, high: 21.5, low: 18.0, label: "Low 2" }, // Low 2 (< L1)
  { id: 8, open: 18, close: 20, high: 20.5, low: 17.8 },
  { id: 9, open: 20, close: 21.5, high: 22.0, low: 19.5, label: "High 2" }, // High 2 (< H1, > L1)
  { id: 10, open: 21.5, close: 17, high: 21.6, low: 16.5 }, // Breakout Low 2
  { id: 11, open: 17, close: 15, high: 17.5, low: 14.5, label: "Low 3" }, // Low 3 (Lowest after breakout)
  { id: 12, open: 15, close: 19, high: 19.5, low: 14.8 },
  { id: 13, open: 19, close: 20.5, high: 21.0, low: 18.8, isSignal: true, label: "High 3" }, // Retest Box (High 3)
  { id: 14, open: 20.5, close: 18, high: 20.6, low: 17.5, isEntry: true }, // Entry
];

export const MOCK_DATA_LONG = [
  { id: 1, open: 10, close: 12, high: 12.5, low: 9.5 },
  { id: 2, open: 12, close: 14.5, high: 15.0, low: 11.5, label: "High 1" }, // High 1
  { id: 3, open: 14.5, close: 12, high: 14.8, low: 11.0, label: "Low 1" }, // Low 1
  { id: 4, open: 12, close: 15, high: 15.5, low: 11.8 },
  { id: 5, open: 15, close: 16.5, high: 17.0, low: 14.5, label: "High 2" }, // High 2 (> H1)
  { id: 6, open: 16.5, close: 14, high: 16.6, low: 13.0, label: "Low 2" }, // Low 2 (> L1, < H1)
  { id: 7, open: 14, close: 18, high: 18.5, low: 13.8 }, // Breakout High 2
  { id: 8, open: 18, close: 19, high: 20.5, low: 18.2, label: "High 3" }, // High 3 (Highest after breakout)
  { id: 9, open: 19, close: 15, high: 19.2, low: 13.5, isSignal: true, label: "Low 3" }, // Retest Box (Low 3)
  { id: 10, open: 15, close: 17, high: 17.5, low: 13.8, isEntry: true }, // Entry
];
