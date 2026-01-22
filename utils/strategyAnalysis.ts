
import { CandleData, ScenarioType } from '../types';

/**
 * Phân tích chiến lược Box 8 Bước
 * Sử dụng tìm kiếm Đỉnh/Đáy cục bộ (Local Extrema)
 */
export const analyzeStrategy = (
  candles: CandleData[],
  signalLookback: number = 30,
  targetScenario: ScenarioType
): { 
  type: ScenarioType | null; 
  annotatedData: CandleData[]; 
  boxInfo?: { top: number, bottom: number };
  structure?: { l1: number, h1: number, l2: number, h2: number, l3?: number, h3?: number };
} => {
  
  if (candles.length < 50) return { type: null, annotatedData: candles };

  const data = JSON.parse(JSON.stringify(candles));
  const len = data.length;

  const isLocalHigh = (idx: number, range: number = 3) => {
    if (idx < range || idx >= len - range) return false;
    const c = data[idx];
    for (let k = 1; k <= range; k++) {
      if (data[idx - k].high > c.high || data[idx + k].high > c.high) return false;
    }
    return true;
  };

  const isLocalLow = (idx: number, range: number = 3) => {
    if (idx < range || idx >= len - range) return false;
    const c = data[idx];
    for (let k = 1; k <= range; k++) {
      if (data[idx - k].low < c.low || data[idx + k].low < c.low) return false;
    }
    return true;
  };
  
  const startScanIndex = len - 2; 
  const endScanIndex = Math.max(50, len - 1 - signalLookback);

  for (let i = startScanIndex; i >= endScanIndex; i--) {
    const signalCandle = data[i];

    // --- LOGIC SHORT ---
    // Low 1 -> High 1 -> Low 2 -> High 2 -> Breakout Low 2 -> Low 3 -> High 3 (Signal)
    if (targetScenario === ScenarioType.SHORT) {
      
      // 1. Tìm High 2
      let high2 = { idx: -1, val: -Infinity };
      for (let j = i - 2; j > i - 30; j--) {
        if (isLocalHigh(j)) { high2 = { idx: j, val: data[j].high }; break; }
      }
      if (high2.idx === -1) continue;

      // 2. Tìm Low 2
      let low2 = { idx: -1, val: Infinity };
      for (let j = high2.idx - 1; j > high2.idx - 30; j--) {
        if (isLocalLow(j)) { low2 = { idx: j, val: data[j].low }; break; }
      }
      if (low2.idx === -1) continue;

      // 3. Tìm High 1
      let high1 = { idx: -1, val: -Infinity };
      for (let j = low2.idx - 1; j > low2.idx - 30; j--) {
        if (isLocalHigh(j)) { high1 = { idx: j, val: data[j].high }; break; }
      }
      if (high1.idx === -1) continue;

      // 4. Tìm Low 1
      let low1 = { idx: -1, val: Infinity };
      for (let j = high1.idx - 1; j > high1.idx - 30; j--) {
        if (isLocalLow(j)) { low1 = { idx: j, val: data[j].low }; break; }
      }
      if (low1.idx === -1) continue;

      // --- Kiểm tra điều kiện ---
      // Bước 3: Low 2 < Low 1
      if (low2.val >= low1.val) continue; 
      // Bước 4: High 2 < High 1
      if (high2.val >= high1.val) continue; 
      // Box Hợp lệ: High 2 phải cao hơn Low 1
      if (high2.val <= low1.val) continue; 

      // Bước 6: Breakout Low 2
      let hasBreakout = false;
      let breakoutIndex = -1;
      for (let k = high2.idx + 1; k < i; k++) {
        if (data[k].close < low2.val) {
          hasBreakout = true;
          breakoutIndex = k;
          break;
        }
      }
      if (!hasBreakout) continue;

      // Bước 5: Tạo Box [Low 1, High 2]
      const boxTop = high2.val;
      const boxBottom = low1.val;
      
      // Bước 7: Retest Box
      const touchesBox = signalCandle.high >= boxBottom && signalCandle.low <= boxTop;
      
      if (touchesBox) {
        // Tìm Low 3: Đáy thấp nhất giữa Low 2 và High 3 (Signal)
        let low3 = { idx: -1, val: Infinity };
        // Quét từ sau Low 2 đến trước nến Signal
        for (let k = low2.idx + 1; k <= i; k++) {
           if (data[k].low < low3.val) {
             low3 = { idx: k, val: data[k].low };
           }
        }

        // Gán nhãn
        data[low1.idx].label = "Low 1";
        data[high1.idx].label = "High 1";
        data[low2.idx].label = "Low 2";
        data[high2.idx].label = "High 2";
        if (low3.idx !== -1) data[low3.idx].label = "Low 3";
        data[i].label = "High 3"; // Nến chạm box được coi là High 3 (đỉnh hồi)
        
        data[i].isSignal = true;
        if (i + 1 < len) data[i+1].isEntry = true;
        
        return { 
          type: ScenarioType.SHORT, 
          annotatedData: data,
          boxInfo: { top: boxTop, bottom: boxBottom },
          structure: {
            l1: low1.val,
            h1: high1.val,
            l2: low2.val,
            h2: high2.val,
            l3: low3.val,
            h3: signalCandle.high
          }
        };
      }
    }

    // --- LOGIC LONG ---
    // High 1 -> Low 1 -> High 2 -> Low 2 -> Breakout High 2 -> High 3 -> Low 3 (Signal)
    if (targetScenario === ScenarioType.LONG) {
      
      // 1. Tìm Low 2
      let low2 = { idx: -1, val: Infinity };
      for (let j = i - 2; j > i - 30; j--) {
        if (isLocalLow(j)) { low2 = { idx: j, val: data[j].low }; break; }
      }
      if (low2.idx === -1) continue;

      // 2. Tìm High 2
      let high2 = { idx: -1, val: -Infinity };
      for (let j = low2.idx - 1; j > low2.idx - 30; j--) {
        if (isLocalHigh(j)) { high2 = { idx: j, val: data[j].high }; break; }
      }
      if (high2.idx === -1) continue;

      // 3. Tìm Low 1
      let low1 = { idx: -1, val: Infinity };
      for (let j = high2.idx - 1; j > high2.idx - 30; j--) {
        if (isLocalLow(j)) { low1 = { idx: j, val: data[j].low }; break; }
      }
      if (low1.idx === -1) continue;

      // 4. Tìm High 1
      let high1 = { idx: -1, val: -Infinity };
      for (let j = low1.idx - 1; j > low1.idx - 30; j--) {
        if (isLocalHigh(j)) { high1 = { idx: j, val: data[j].high }; break; }
      }
      if (high1.idx === -1) continue;

      // --- Kiểm tra điều kiện ---
      // Bước 3: High 2 > High 1
      if (high2.val <= high1.val) continue; 
      // Bước 4: Low 2 > Low 1
      if (low2.val <= low1.val) continue;   
      // Box Hợp lệ: High 1 phải cao hơn Low 2
      if (high1.val <= low2.val) continue;  

      // Bước 6: Breakout High 2
      let hasBreakout = false;
      for (let k = low2.idx + 1; k < i; k++) {
        if (data[k].close > high2.val) {
          hasBreakout = true;
          break;
        }
      }
      if (!hasBreakout) continue;

      // Bước 5: Tạo Box [Low 2, High 1]
      const boxTop = high1.val;
      const boxBottom = low2.val;

      // Bước 7: Retest Box
      const touchesBox = signalCandle.high >= boxBottom && signalCandle.low <= boxTop;

      if (touchesBox) {
        // Tìm High 3: Đỉnh cao nhất giữa Low 2 và Low 3 (Signal)
        let high3 = { idx: -1, val: -Infinity };
        for (let k = low2.idx + 1; k <= i; k++) {
           if (data[k].high > high3.val) {
             high3 = { idx: k, val: data[k].high };
           }
        }

        // Gán nhãn
        data[high1.idx].label = "High 1";
        data[low1.idx].label = "Low 1";
        data[high2.idx].label = "High 2";
        data[low2.idx].label = "Low 2";
        if (high3.idx !== -1) data[high3.idx].label = "High 3";
        data[i].label = "Low 3"; // Nến chạm box được coi là Low 3

        data[i].isSignal = true;
        if (i + 1 < len) data[i+1].isEntry = true;

        return { 
          type: ScenarioType.LONG, 
          annotatedData: data,
          boxInfo: { top: boxTop, bottom: boxBottom },
          structure: {
            l1: low1.val,
            h1: high1.val,
            l2: low2.val,
            h2: high2.val,
            l3: signalCandle.low,
            h3: high3.val
          }
        };
      }
    }
  }

  return { type: null, annotatedData: candles };
};
