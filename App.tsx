
import React, { useState } from 'react';
import { ScenarioType, ScannerResult, CandleData, Timeframe } from './types';
import { STRATEGY_LOGIC, MOCK_DATA_LONG, MOCK_DATA_SHORT } from './constants';
import CandlestickVisualizer from './components/CandlestickVisualizer';
import GeminiPanel from './components/GeminiPanel';
import { fetchUSDTPairs, fetchCandles, BinanceTicker } from './services/binanceService';
import { analyzeStrategy } from './utils/strategyAnalysis';

const TIMEFRAMES: Timeframe[] = ['15m', '30m', '1h', '4h', '1d'];

const App: React.FC = () => {
  // Configuration State
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(ScenarioType.SHORT);
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [lookback, setLookback] = useState(5);

  // Chart/Scanner State
  const [chartData, setChartData] = useState<CandleData[]>(MOCK_DATA_SHORT);
  const [chartSymbol, setChartSymbol] = useState<string>("MÔ PHỎNG");
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScannerResult[]>([]);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [showChartModal, setShowChartModal] = useState(false);

  // Styling Helpers
  const isShort = activeScenario === ScenarioType.SHORT;
  const accentColor = isShort ? 'text-[#F23645]' : 'text-[#089981]';
  const accentBg = isShort ? 'bg-[#F23645]' : 'bg-[#089981]';
  const accentBorder = isShort ? 'border-[#F23645]' : 'border-[#089981]';
  const shadowColor = isShort ? 'shadow-red-900/20' : 'shadow-green-900/20';
  
  const strategyInfo = STRATEGY_LOGIC[activeScenario];

  const handleScenarioChange = (type: ScenarioType) => {
    setActiveScenario(type);
    // Reset to mock data suitable for the scenario
    setChartSymbol(type === ScenarioType.LONG ? "MÔ PHỎNG (LONG)" : "MÔ PHỎNG (SHORT)");
    setChartData(type === ScenarioType.LONG ? MOCK_DATA_LONG : MOCK_DATA_SHORT);
  };

  const runScanner = async () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanResults([]);
    setProgress({ processed: 0, total: 0 });

    try {
      const tickers = await fetchUSDTPairs();
      const totalTickers = tickers.length;
      setProgress({ processed: 0, total: totalTickers });

      const BATCH_SIZE = 10;
      const DELAY_MS = 100;

      const processTicker = async (ticker: BinanceTicker): Promise<ScannerResult | null> => {
        // Fetch more candles (1000) to ensure we have enough history for the lookback window + structure formation
        const candles = await fetchCandles(ticker.symbol, timeframe, 1000);
        const analysis = analyzeStrategy(candles, lookback, activeScenario);
        
        // Only return if it matches our active scenario
        if (analysis.type === activeScenario) {
          // Calculate bars ago
          const signalIndex = analysis.annotatedData.findIndex(c => c.isSignal);
          const barsAgo = signalIndex !== -1 ? analysis.annotatedData.length - 1 - signalIndex : 0;

          return {
            symbol: ticker.symbol,
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent),
            scenario: analysis.type,
            timestamp: Date.now(),
            barsAgo: barsAgo,
            boxTop: analysis.boxInfo?.top,
            boxBottom: analysis.boxInfo?.bottom,
            structure: analysis.structure
          };
        }
        return null;
      };

      for (let i = 0; i < totalTickers; i += BATCH_SIZE) {
        const batch = tickers.slice(i, i + BATCH_SIZE);
        const batchPromises = batch.map(t => processTicker(t));
        const results = await Promise.all(batchPromises);
        
        const validResults = results.filter((r): r is ScannerResult => r !== null);
        setScanResults(prev => [...prev, ...validResults]);

        setProgress(prev => ({ 
            ...prev, 
            processed: Math.min(i + BATCH_SIZE, totalTickers) 
        }));

        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }

    } catch (error) {
      console.error("Scan failed", error);
    } finally {
      setIsScanning(false);
    }
  };

  const loadCoinData = async (symbol: string) => {
    setChartSymbol(`${symbol} (${timeframe})`);
    setShowChartModal(true);
    // Fetch 1000 candles for chart visualization
    const candles = await fetchCandles(symbol, timeframe, 1000);
    const { annotatedData } = analyzeStrategy(candles, lookback, activeScenario);
    setChartData(annotatedData);
  };

  const progressPercent = progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0B1217] text-[#E2E8F0] font-sans selection:bg-blue-500/30">
      
      {/* Top Bar Label */}
      <div className="px-6 py-2 flex items-center space-x-2">
         <span className="font-bold text-lg bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">SMC Scanner</span>
         <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">v2.1</span>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Main Card */}
        <div className="bg-[#111927] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
          
          {/* Card Header */}
          <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800/50">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className={`p-2 rounded-lg bg-slate-800 text-slate-200`}>
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-white">Market Scanner</h1>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className={`font-bold ${accentColor} uppercase`}>{activeScenario} STRATEGY</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{activeScenario === ScenarioType.LONG ? 'Rising Structure Breakout' : 'Falling Channel Breakout'}</span>
              </div>
            </div>

            {/* Scenario Toggle */}
            <div className="flex bg-[#0B1217] p-1 rounded-lg border border-slate-800 mt-4 md:mt-0">
              <button
                onClick={() => handleScenarioChange(ScenarioType.LONG)}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                  activeScenario === ScenarioType.LONG
                    ? 'bg-[#089981] text-white shadow-[0_0_15px_rgba(8,153,129,0.3)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                LONG
              </button>
              <button
                onClick={() => handleScenarioChange(ScenarioType.SHORT)}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all duration-200 ${
                  activeScenario === ScenarioType.SHORT
                    ? 'bg-[#F23645] text-white shadow-[0_0_15px_rgba(242,54,69,0.3)]'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                SHORT
              </button>
            </div>
          </div>

          {/* Controls & Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 md:p-8">
            
            {/* Left Column: Controls */}
            <div className="space-y-8">
              
              {/* Timeframe */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  Timeframe
                </label>
                <div className="flex gap-2">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${
                        timeframe === tf
                          ? `${accentBg} text-white border-transparent shadow-lg`
                          : 'bg-[#0B1217] border-slate-800 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lookback Slider */}
               <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                    </svg>
                    Scan Lookback (Entry Window)
                  </label>
                  <span className={`text-xs font-bold ${accentColor}`}>
                    {lookback} bars
                  </span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={lookback} 
                  onChange={(e) => setLookback(parseInt(e.target.value))}
                   className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:${accentBg}`}
                />
              </div>

            </div>

            {/* Right Column: Strategy Logic */}
            <div className="bg-[#0B1217] rounded-xl border border-slate-800 p-6 relative overflow-hidden">
               {/* Decorative background glow */}
               <div className={`absolute top-0 right-0 w-32 h-32 ${activeScenario === ScenarioType.SHORT ? 'bg-red-500/5' : 'bg-green-500/5'} rounded-full blur-3xl -mr-10 -mt-10`}></div>

               <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-400">
                    <path fillRule="evenodd" d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0zm1.5 0v.002c0 .019 1.849.002 1.849.002V13.5zm0 0h.002V13.5H3.75zm0 0v.002V13.5h-.002zm0 0h.002v.002H3.75V13.5zm0 0h.002v.002H3.75V13.5zm13.5 1.5a6.75 6.75 0 00-6-6.703v5.203h6.703a6.75 6.75 0 00-.703 1.5z" clipRule="evenodd" />
                  </svg>
                 {activeScenario} Strategy Logic
               </h3>

               <div className="space-y-4">
                  <div className="flex items-start gap-3 text-sm">
                     <span className="text-slate-500 font-semibold min-w-[60px]">Context:</span>
                     <span className="text-slate-300">{strategyInfo.context}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                     <span className="text-slate-500 font-semibold min-w-[60px]">Pattern:</span>
                     <span className="text-slate-300">{strategyInfo.pattern}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                     <span className="text-slate-500 font-semibold min-w-[60px]">Trigger:</span>
                     <span className="text-slate-300">{strategyInfo.trigger}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                     <span className="text-slate-500 font-semibold min-w-[60px]">Filter:</span>
                     <span className="text-slate-300">{strategyInfo.filter}</span>
                  </div>
               </div>
            </div>

          </div>

          {/* Action Button */}
          <div className="p-6 md:p-8 pt-0">
             <button
                onClick={runScanner}
                disabled={isScanning}
                className={`w-full py-4 rounded-lg font-bold text-lg tracking-wide uppercase transition-all duration-300 flex justify-center items-center gap-3
                  ${isScanning 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : `${accentBg} text-white hover:brightness-110 shadow-lg ${shadowColor}`
                  }
                `}
             >
                {isScanning ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scanning Market...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    SCAN FOR {activeScenario} SETUPS
                  </>
                )}
             </button>

             {/* Progress Bar */}
             {isScanning && (
                <div className="mt-4">
                   <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Processing {progress.processed} of {progress.total} pairs</span>
                      <span>{progressPercent}%</span>
                   </div>
                   <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                         className={`${accentBg} h-full transition-all duration-200`} 
                         style={{ width: `${progressPercent}%` }}
                      ></div>
                   </div>
                </div>
             )}
          </div>
        </div>

        {/* Results Section */}
        <div className="mt-8 space-y-4">
           {scanResults.length > 0 && (
             <h2 className="text-xl font-bold text-white pl-2 border-l-4 border-blue-500">Scan Results ({scanResults.length})</h2>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {scanResults.map((result) => (
                <div 
                  key={result.symbol}
                  onClick={() => loadCoinData(result.symbol)}
                  className="bg-[#111927] border border-slate-800 p-4 rounded-lg hover:border-slate-600 cursor-pointer transition-all hover:translate-y-[-2px] hover:shadow-xl group"
                >
                   <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{result.symbol}</h3>
                      <span className={`text-xs font-bold px-2 py-1 rounded bg-opacity-20 ${isShort ? 'bg-red-500 text-red-400' : 'bg-green-500 text-green-400'}`}>
                        {result.scenario}
                      </span>
                   </div>
                   <div className="flex justify-between items-end mb-3">
                      <div className="text-2xl font-mono text-slate-300">${result.price}</div>
                      <div className={`font-mono font-bold ${result.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                         {result.change24h > 0 ? '+' : ''}{result.change24h}%
                      </div>
                   </div>
                   
                   {/* Box Info Display */}
                   {(result.boxTop !== undefined && result.boxBottom !== undefined) && (
                     <div className="mb-3 px-3 py-2 bg-slate-800/50 rounded border border-slate-700/50">
                        <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Entry Box Range</div>
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-red-400" title="Box Bottom (Stop/Low)">{result.boxBottom}</span>
                          <span className="text-slate-600">-</span>
                          <span className="text-green-400" title="Box Top (High)">{result.boxTop}</span>
                        </div>
                     </div>
                   )}

                   {/* Structure Points Grid */}
                   {result.structure && (
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] bg-slate-900/40 p-2 rounded mb-3 border border-slate-800">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Low 1:</span>
                          <span className="text-slate-300 font-mono">{result.structure.l1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">High 1:</span>
                          <span className="text-slate-300 font-mono">{result.structure.h1}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Low 2:</span>
                          <span className="text-slate-300 font-mono">{result.structure.l2}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">High 2:</span>
                          <span className="text-slate-300 font-mono">{result.structure.h2}</span>
                        </div>
                        
                        {/* New L3/H3 Display */}
                        {result.structure.l3 !== undefined && (
                           <div className="flex justify-between border-t border-slate-700/50 pt-1 mt-1 col-span-2">
                            <span className="text-slate-500">Low 3:</span>
                            <span className="text-slate-300 font-mono">{result.structure.l3}</span>
                           </div>
                        )}
                        {result.structure.h3 !== undefined && (
                           <div className="flex justify-between col-span-2">
                            <span className="text-slate-500">High 3:</span>
                            <span className="text-slate-300 font-mono">{result.structure.h3}</span>
                           </div>
                        )}
                      </div>
                   )}

                   <div className="pt-2 border-t border-slate-800 text-xs text-slate-500 flex justify-between">
                      <span>Timeframe: {timeframe}</span>
                      <span className="font-semibold text-slate-400">
                        {result.barsAgo === 0 ? "Just now" : `${result.barsAgo} bars ago`}
                      </span>
                   </div>
                </div>
             ))}
           </div>
           
           {!isScanning && scanResults.length === 0 && (
              <div className="text-center py-12 text-slate-600">
                 <p>No results found or scan not started.</p>
                 <p className="text-sm mt-2">Adjust parameters and click Scan to begin.</p>
              </div>
           )}
        </div>

      </main>

      {/* Chart Modal */}
      {showChartModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-[#111927] border border-slate-700 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up">
              <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-[#0B1217]">
                 <h2 className="font-bold text-white flex items-center gap-3">
                    {chartSymbol}
                    <span className={`text-xs px-2 py-0.5 rounded border ${accentBorder} ${accentColor} bg-opacity-10`}>
                      {activeScenario} SETUP
                    </span>
                 </h2>
                 <button onClick={() => setShowChartModal(false)} className="text-slate-400 hover:text-white p-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                 </button>
              </div>
              <div className="p-1 bg-[#0B1217]">
                 <div className="h-[500px] w-full">
                    <CandlestickVisualizer data={chartData} scenario={activeScenario} />
                 </div>
              </div>
              <div className="p-4 bg-[#111927] border-t border-slate-800 flex justify-end">
                  <div className="mr-auto flex items-center gap-2">
                    <GeminiPanel scenario={activeScenario} />
                  </div>
                  <button onClick={() => setShowChartModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm">
                    Close Chart
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
