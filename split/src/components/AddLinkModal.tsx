import React, { useState } from 'react';

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLink: (title: string, url: string) => Promise<void>;
  teamId?: number;
}

export const AddLinkModal: React.FC<AddLinkModalProps> = ({
  isOpen,
  onClose,
  onAddLink,
  teamId
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      setError('請輸入網頁連結網址 (URL)');
      return;
    }

    // 自動補齊 https://
    let formattedUrl = cleanUrl;
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }

    try {
      setIsSubmitting(true);
      setError('');
      const linkTitle = title.trim() || formattedUrl;
      await onAddLink(linkTitle, formattedUrl);
      setTitle('');
      setUrl('');
      onClose();
    } catch (err: any) {
      console.error('[AddLinkModal] save error:', err);
      setError('提交失敗，請檢查網路連線');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-100 animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔗</span>
            <h3 className="text-sm font-bold text-white">
              提交小組成果網頁連結 {teamId ? `(第 ${teamId} 組)` : ''}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-bold mb-1">
              🏷️ 成果連結名稱 / 說明：
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：Figma 設計原型、Miro 成果看板、前端展示頁..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">
              🌐 網頁連結網址 (URL) <span className="text-rose-400">*</span>：
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="例如：https://www.figma.com/file/... 或 https://..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-teal-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              支援 Figma、Miro、Google Docs、GitHub、Vercel 等任何成果網址
            </p>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isSubmitting ? '提交中...' : '✓ 確認提交連結'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
