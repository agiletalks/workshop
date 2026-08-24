import { useEffect, useState } from "react";
import { slides } from "../data/slides";
import type { Slide } from "../data/slides";

interface SlideViewerProps {
  slide: Slide;
  onNext: () => void;
  onPrev: () => void;
  onImageClick: (imageUrl: string) => void;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({
  slide,
  onNext,
  onPrev,
  onImageClick
}) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reset image status when slide changes
  useEffect(() => {
    setImageError(false);
    setLoading(true);
  }, [slide]);

  // Construct image path safely using base URL
  const getImageUrl = (imageName: string) => {
    if (!imageName) return "";
    const baseUrl = import.meta.env.BASE_URL || "/";
    return `${baseUrl}assets/${imageName}`;
  };

  const imageUrl = getImageUrl(slide.image);

  // Listen to keyboard navigation globally
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user is focused on an input or textarea, don't trigger page switches!
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          (activeEl instanceof HTMLElement && activeEl.isContentEditable))
      ) {
        return;
      }

      if (e.key === "ArrowRight" || e.key === "Right") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft" || e.key === "Left") {
        e.preventDefault();
        onPrev();
      } else if (e.key === "Home") {
        e.preventDefault();
        const first = slides[0];
        if (first && first.id !== slide.id) {
          // Trigger click logic by changing state elsewhere
          const btn = document.getElementById("nav-first-btn");
          btn?.click();
        }
      } else if (e.key === "End") {
        e.preventDefault();
        const last = slides[slides.length - 1];
        if (last && last.id !== slide.id) {
          const btn = document.getElementById("nav-last-btn");
          btn?.click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slide, onNext, onPrev]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative p-4 md:p-6 justify-between select-none">
      {/* Top Slide Meta Bar */}
      <div className="flex items-center justify-between mb-4 bg-white/70 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-200/50 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-fubon-blue text-white font-mono font-black text-xs flex items-center justify-center">
            {slide.moduleId}
          </span>
          <span className="text-xs font-bold text-slate-700">
            {slide.title}
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          頁碼 {slide.page} / {slides.length}
        </span>
      </div>

      {/* Main Slide Content Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-slate-950/5 rounded-3xl border border-slate-200/20 relative group">
        {imageUrl ? (
          imageError ? (
            /* Error display */
            <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-slate-800 font-bold mb-1">投影片載入失敗</h4>
              <p className="text-slate-500 text-xs mb-3">
                無法在指定路徑讀取講義圖檔：<br />
                <code className="bg-slate-100 p-1 rounded font-mono text-[10px] select-all break-all">{slide.image}</code>
              </p>
              <button
                onClick={() => { setImageError(false); setLoading(true); }}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95"
              >
                重新載入
              </button>
            </div>
          ) : (
            /* Slide image with loading screen and Lightbox trigger */
            <>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80">
                  <div className="w-8 h-8 border-4 border-fubon-blue border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <img
                src={imageUrl}
                alt={`第 ${slide.page} 頁：${slide.title}`}
                onLoad={() => setLoading(false)}
                onError={() => { setLoading(false); setImageError(true); }}
                onClick={() => !loading && onImageClick(imageUrl)}
                className={`max-w-full max-h-full object-contain cursor-zoom-in transition-all duration-300 hover:brightness-[1.01] ${
                  loading ? "opacity-0" : "opacity-100"
                }`}
              />
              {/* Floating zoom indicator on hover */}
              {!loading && (
                <div className="absolute bottom-4 right-4 bg-slate-900/60 text-white text-[10px] px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 backdrop-blur-sm pointer-events-none">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                  點擊放大
                </div>
              )}
            </>
          )
        ) : (
          /* Visual placeholder if no image exists (e.g. page 28-33) */
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-20 h-20 rounded-2xl bg-fubon-blue-light flex items-center justify-center text-fubon-blue mb-6">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">跨頁實作與筆記單元</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              此單元無獨立講義圖片。請利用右側面板記錄您的筆記，或配合講師說明進行相關小組實作。
            </p>
            <div className="text-[10px] bg-slate-100 text-slate-500 font-mono px-3 py-1.5 rounded-lg border border-slate-200">
              模組: {slide.moduleId} ｜ 類型: {slide.type.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Floating navigation helpers */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity hidden md:block">
        <button
          onClick={onPrev}
          className="w-12 h-12 bg-white/90 hover:bg-white text-slate-700 rounded-full flex items-center justify-center shadow-lg border border-slate-200 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-fubon-blue"
          title="上一頁 (左方向鍵)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity hidden md:block">
        <button
          onClick={onNext}
          className="w-12 h-12 bg-white/90 hover:bg-white text-slate-700 rounded-full flex items-center justify-center shadow-lg border border-slate-200 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-fubon-blue"
          title="下一頁 (右方向鍵)"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Bottom Control Bar */}
      <div className="flex items-center justify-between mt-4 bg-white/50 px-4 py-2 rounded-2xl shrink-0">
        <button
          id="nav-first-btn"
          onClick={() => {
            const first = slides[0];
            if (first) onImageClick(getImageUrl(first.image)); // Dummy call just to trigger first logic
          }}
          className="hidden" // Invisible anchor for keyboard End/Home events
        />
        <button
          id="nav-last-btn"
          className="hidden" // Invisible anchor
        />

        <button
          onClick={onPrev}
          disabled={slide.page === 1}
          className="px-4 py-2 border border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:hover:border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-[0.98] select-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          上一頁
        </button>

        <span className="text-[11px] font-mono text-slate-500 font-bold">
          SLIDE {slide.page} / {slides.length}
        </span>

        <button
          onClick={onNext}
          disabled={slide.page === slides.length}
          className="px-4 py-2 border border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:hover:border-slate-200 bg-white text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all active:scale-[0.98] select-none"
        >
          下一頁
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};
