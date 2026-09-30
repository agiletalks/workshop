import React from 'react';

interface HtmlPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  dataUrl: string;
}

export const HtmlPreviewModal: React.FC<HtmlPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  dataUrl
}) => {
  if (!isOpen) return null;

  const handleOpenInNewTab = () => {
    try {
      if (dataUrl.startsWith('data:text/html')) {
        // 解碼 base64 或 raw URI component
        const base64Index = dataUrl.indexOf(';base64,');
        let htmlContent = '';
        if (base64Index !== -1) {
          const base64Data = dataUrl.substring(base64Index + 8);
          htmlContent = decodeURIComponent(escape(atob(base64Data)));
        } else {
          htmlContent = decodeURIComponent(dataUrl.split(',')[1] || '');
        }
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } else {
        window.open(dataUrl, '_blank');
      }
    } catch (e) {
      window.open(dataUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10 text-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-4">
            <span className="text-lg">🌐</span>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                {title}
              </h3>
              <span className="text-[10px] text-teal-400 font-mono">
                HTML 網頁即時預覽 (Sandboxed Environment)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="px-3 py-1.5 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="在獨立新分頁開啟完整網頁"
            >
              <span>↗️</span>
              <span className="hidden sm:inline">在新分頁開啟</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Live Iframe Body */}
        <div className="flex-1 bg-white relative">
          <iframe
            src={dataUrl}
            title={title}
            sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
            className="w-full h-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
