
import React, { useMemo } from 'react';
import { CandleData, ScenarioType } from '../types';

interface CandlestickVisualizerProps {
  data: CandleData[];
  scenario: ScenarioType;
  width?: number;
  height?: number;
}

const CandlestickVisualizer: React.FC<CandlestickVisualizerProps> = ({ 
  data, 
  scenario, 
  width = 800, 
  height = 400 
}) => {
  
  // 1. Calculate Scales
  const { minPrice, maxPrice } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    data.forEach(d => {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
    });
    // Add padding
    const padding = (max - min) * 0.1;
    return { minPrice: min - padding, maxPrice: max + padding };
  }, [data]);

  const priceRange = maxPrice - minPrice;
  
  const getX = (index: number) => (width / (data.length + 1)) * (index + 1);
  const getY = (price: number) => height - ((price - minPrice) / priceRange) * height;

  // 2. Identify Box Coordinates based on Strategy Logic (8 Steps)
  const boxCoords = useMemo(() => {
    let topPrice = 0;
    let bottomPrice = 0;
    let startIdx = 0;
    let labelTop = "";
    let labelBottom = "";

    if (scenario === ScenarioType.SHORT) {
        // Short: Box = High 2 (Top) - Low 1 (Bottom)
        const high2 = data.find(c => c.label === "High 2");
        const low1 = data.find(c => c.label === "Low 1");
        
        if (!high2 || !low1) return null;
        topPrice = high2.high;
        bottomPrice = low1.low;
        startIdx = Math.min(high2.id, low1.id) - 1; // Approx index
        labelTop = "High 2";
        labelBottom = "Low 1";

    } else {
        // Long: Box = High 1 (Top) - Low 2 (Bottom)
        const high1 = data.find(c => c.label === "High 1");
        const low2 = data.find(c => c.label === "Low 2");
        
        if (!high1 || !low2) return null;
        topPrice = high1.high;
        bottomPrice = low2.low;
        startIdx = Math.min(high1.id, low2.id) - 1;
        labelTop = "High 1";
        labelBottom = "Low 2";
    }

    // Find actual index in array for xStart (using id might be unreliable if IDs aren't sequential indices)
    // We scan data to find the index matching the price/label
    const actualStartIndex = data.findIndex(c => 
        (scenario === ScenarioType.SHORT && c.label === "Low 1") || 
        (scenario === ScenarioType.LONG && c.label === "High 1")
    );
    
    const xStart = getX(actualStartIndex >= 0 ? actualStartIndex : 0);
    const yTop = getY(topPrice);
    const yBottom = getY(bottomPrice);
    
    return { yTop, yBottom, xStart, topPrice, bottomPrice, labelTop, labelBottom };
  }, [data, getY, scenario]);

  // Candle Width
  const candleWidth = (width / data.length) * 0.5;

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
        <defs>
          <linearGradient id="boxGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {[...Array(5)].map((_, i) => {
          const y = (height / 5) * i;
          return <line key={i} x1="0" y1={y} x2={width} y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />;
        })}

        {/* The Strategy Box */}
        {boxCoords && (
          <g>
            <rect
              x={boxCoords.xStart}
              y={boxCoords.yTop}
              width={width - boxCoords.xStart}
              height={Math.max(Math.abs(boxCoords.yBottom - boxCoords.yTop), 2)}
              fill="url(#boxGradient)"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeDasharray="6 6"
            />
            {/* Box Labels */}
            <text x={width - 10} y={boxCoords.yTop - 10} textAnchor="end" fill="#60a5fa" fontSize="12">
              Box Top ({boxCoords.labelTop}): {boxCoords.topPrice.toFixed(2)}
            </text>
            <text x={width - 10} y={boxCoords.yBottom + 20} textAnchor="end" fill="#60a5fa" fontSize="12">
              Box Bottom ({boxCoords.labelBottom}): {boxCoords.bottomPrice.toFixed(2)}
            </text>
          </g>
        )}

        {/* Candles */}
        {data.map((d, index) => {
          const x = getX(index);
          const yOpen = getY(d.open);
          const yClose = getY(d.close);
          const yHigh = getY(d.high);
          const yLow = getY(d.low);
          
          const isBullish = d.close >= d.open;
          const color = isBullish ? '#22c55e' : '#ef4444'; 

          return (
            <g key={d.id} className="transition-opacity duration-300 hover:opacity-80">
              {/* Wick */}
              <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="2" />
              
              {/* Body */}
              <rect 
                x={x - candleWidth / 2} 
                y={Math.min(yOpen, yClose)} 
                width={candleWidth} 
                height={Math.max(Math.abs(yOpen - yClose), 1)} 
                fill={color} 
              />

              {/* Labels (L1, H1, L2, H2) */}
              {d.label && (
                <g>
                   <text 
                    x={x} 
                    y={isBullish ? yLow + 20 : yHigh - 10} 
                    textAnchor="middle" 
                    fill="#f1f5f9" 
                    fontWeight="bold"
                    fontSize="11"
                   >
                     {d.label}
                   </text>
                   <circle cx={x} cy={d.label.includes('High') ? yHigh : yLow} r="3" fill="#f1f5f9" />
                </g>
              )}

              {/* Signal/Entry Markers */}
              {d.isSignal && (
                <text x={x} y={yHigh - 30} textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="bold">
                  ⚠️ Test
                </text>
              )}
              {d.isEntry && (
                <g>
                  <text x={x} y={yLow + 35} textAnchor="middle" fill="#a855f7" fontSize="14" fontWeight="bold">
                    🚀 ENTRY
                  </text>
                  <line x1={x} y1={yLow + 5} x2={x} y2={yLow + 25} stroke="#a855f7" strokeWidth="2" />
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default CandlestickVisualizer;
