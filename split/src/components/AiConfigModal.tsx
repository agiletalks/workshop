import React, { useState, useEffect } from 'react';
import { getAvailableGeminiModels } from '../services/lectureNoteService';

interface AiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved: (key: string) => void;
}

export const AiConfigModal: React.FC<AiConfigModalProps> = ({
  isOpen,
  onClose,
  onKeySaved
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('GEMINI_API_KEY') || '';
      setApiKey(saved);
      setTestStatus('idle');
      setTestMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      setTestStatus('error');
      setTestMessage('請先填寫金鑰');
      return;
    }

    setTestStatus('testing');
    setTestMessage('正在測試 Google Gemini 連線 (查詢 ModelService)...');

    try {
      let lastError = '';
      let isSuccess = false;
      const models = await getAvailableGeminiModels(keyToTest);

      for (const model of models) {
        if (isSuccess) break;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

        if (keyToTest.startsWith('ya29.')) {
          headers['Authorization'] = `Bearer ${keyToTest}`;
        } else {
          url += `?key=${encodeURIComponent(keyToTest)}`;
          headers['x-goog-api-key'] = keyToTest;
        }

        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'ping' }] }]
          })
        });

        if (res.ok) {
          isSuccess = true;
          setTestStatus('success');
          setTestMessage(`🟢 連線成功！(${model}) Google 智囊已連線，隨堂錄音將由小編深度整理。`);
          break;
        } else {
          const errJson = await res.json().catch(() => null);
          let msg = errJson?.error?.message || `HTTP ${res.status}`;
          if (msg.toLowerCase().includes('api key not valid')) {
            msg = `${msg}（提示：請確認是否完整複製，支援 AIzaSy... 或 AQ... 開頭之金鑰）`;
          }
          lastError = msg;
        }
      }

      if (!isSuccess) {
        setTestStatus('error');
        setTestMessage(`🔴 連線失敗：${lastError}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`🔴 網路連線錯誤：${err.message || '無法連上 Google 伺服器'}`);
    }
  };

  const handleSave = () => {
    const keyToSave = apiKey.trim();
    if (keyToSave) {
      localStorage.setItem('GEMINI_API_KEY', keyToSave);
      onKeySaved(keyToSave);
    } else {
      localStorage.removeItem('GEMINI_API_KEY');
      onKeySaved('');
    }
    onClose();
  };

  const handleClear = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    setApiKey('');
    onKeySaved('');
    setTestStatus('idle');
    setTestMessage('已清除本機金鑰');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 relative text-slate-100 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-base">
              ⚙️
            </div>
            <div>
              <h3 className="text-base font-black text-white">隨堂小編 (Gemini) 設定</h3>
              <p className="text-[11px] text-slate-400">僅儲存於此筆電瀏覽器，投影時不外洩</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            ✕
          </button>
        </div>

        {/* Input Body */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestStatus('idle');
                  setTestMessage('');
                }}
                placeholder="貼上 AIzaSy... 或 AQ... 開頭之金鑰"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-emerald-500 transition-all pr-20"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all"
              >
                {showKey ? '隱藏' : '顯示'}
              </button>
            </div>
          </div>

          {/* Test Status Banner */}
          {testMessage && (
            <div className={`p-3 rounded-xl text-xs font-medium border ${
              testStatus === 'success'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                : testStatus === 'error'
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}>
              {testMessage}
            </div>
          )}

          {/* Helper Tips */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <span>💡</span>
              <span>金鑰安全與使用說明：</span>
            </div>
            <p>1. 本設定僅供講師錄音提煉時使用，<strong>學員端完全無法讀取或取得此金鑰</strong>。</p>
            <p>2. Google AI Studio 每天提供 1,500 次免費呼叫額度，隨堂錄音 0 元免綁信用卡。</p>
            <p>3. 支援以 <code>AIzaSy...</code> 或 <code>AQ...</code> 開頭的 Google AI Studio 金鑰。</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-rose-400 hover:text-rose-300 font-bold underline transition-all"
          >
            清除金鑰
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing' || !apiKey.trim()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              {testStatus === 'testing' ? '連線中...' : '🧪 測試連線'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              儲存並關閉
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
