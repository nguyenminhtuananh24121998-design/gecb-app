import React, { useState } from 'react';
import { ScenarioType } from '../types';
import { askGeminiAboutStrategy } from '../services/geminiService';

interface GeminiPanelProps {
  scenario: ScenarioType;
}

const GeminiPanel: React.FC<GeminiPanelProps> = ({ scenario }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setAnswer('');
    try {
      const result = await askGeminiAboutStrategy(scenario, question);
      setAnswer(result);
    } catch (e) {
      setAnswer("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isOpen ? 'w-96' : 'w-14'}`}>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-transform"
          title="Hỏi AI về chiến lược"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-4 flex flex-col max-h-[80vh]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
            <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Gemini Strategy Assistant</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 space-y-3 min-h-[200px]">
            {answer ? (
              <div className="prose prose-invert prose-sm bg-slate-700/50 p-3 rounded-lg">
                <div dangerouslySetInnerHTML={{ __html: answer.replace(/\n/g, '<br/>') }} />
              </div>
            ) : (
              <div className="text-slate-500 text-sm italic text-center mt-10">
                Hãy hỏi về điểm Entry, rủi ro, hoặc cách xác định High/Low...
              </div>
            )}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          <div className="relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              placeholder="Đặt câu hỏi về chiến lược này..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={handleAsk}
              disabled={isLoading}
              className="absolute right-2 top-1.5 text-blue-500 hover:text-blue-400 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          
          <div className="mt-2 flex flex-wrap gap-2">
            <button 
              onClick={() => setQuestion("Tại sao phải đợi nến đóng cửa trong Box?")}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md text-slate-300"
            >
              Tại sao chờ nến trong Box?
            </button>
            <button 
              onClick={() => setQuestion("Rủi ro lớn nhất của mẫu hình này là gì?")}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md text-slate-300"
            >
              Rủi ro là gì?
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiPanel;