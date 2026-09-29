import React, { useState, useEffect } from "react";
import QRCode from "qrcode";

interface StudentQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  className?: string;
  defaultPasscode?: string;
}

export const StudentQrCodeModal: React.FC<StudentQrCodeModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  defaultPasscode = "split-2026"
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 嚴格確保學員網址僅包含 ?c= 班級代碼，絕不攜帶任何 admin/role/直通憑證！
  const studentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?c=${encodeURIComponent(classId || '')}`
    : '';

  useEffect(() => {
    if (!isOpen || !studentUrl) return;

    QRCode.toDataURL(studentUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      },
      errorCorrectionLevel: "H"
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("[StudentQrCodeModal] QR generation error:", err);
      });
  }, [isOpen, studentUrl]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2500);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>課堂學員報到 QR Code</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                  大螢幕投影專用
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                請學員開啟手機相機掃描，並在報到頁面輸入組別、姓名與密碼
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            title="關閉視窗"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex flex-col items-center">
          
          {/* QR Code 顯示框 (白底高對比，利於投影幕遠距對焦掃描) */}
          <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-emerald-500/20 flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="學員報到 QR Code"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain select-none"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                正在生成高清晰 QR Code...
              </div>
            )}
          </div>

          {/* 班級資訊與密碼卡片 (超大字體，利於全場投影清晰看見) */}
          <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-medium">班級名稱:</span>
              <span className="font-bold text-white text-sm truncate max-w-[240px]">
                {className || classId}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">班級代碼 (Class):</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-amber-300 text-sm tracking-wider">
                  {classId}
                </span>
                <button
                  onClick={() => handleCopy(classId, 'code')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {copiedField === 'code' ? '✓ 已複製' : '複製代碼'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 font-medium">進班驗證密碼:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-emerald-400 text-sm tracking-wider">
                  {defaultPasscode}
                </span>
                <button
                  onClick={() => handleCopy(defaultPasscode, 'passcode')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {copiedField === 'passcode' ? '✓ 已複製' : '複製密碼'}
                </button>
              </div>
            </div>
          </div>

          {/* 完整網址複製列 */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>學員進班專屬連結：</span>
              <button
                onClick={() => handleCopy(studentUrl, 'url')}
                className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
              >
                {copiedField === 'url' ? '✓ 連結已複製！' : '一鍵複製完整網址'}
              </button>
            </div>
            <div className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-400 break-all select-all">
              {studentUrl}
            </div>
          </div>

          {/* 安全防護說明 */}
          <div className="w-full bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-300/90 leading-relaxed">
            <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <strong>嚴格門禁防護：</strong>此 QR Code 為學員安全專用入口，不含任何免密或講師權限代碼。學員掃描後一律需填寫組別、姓名並通過密碼校驗，杜絕旁路直通漏洞。
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            關閉投影視窗
          </button>
        </div>
      </div>
    </div>
  );
};
