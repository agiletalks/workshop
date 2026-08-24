import React, { useEffect, useState, useRef } from "react";

interface SlideLightboxProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  slideTitle: string;
}

export const SlideLightbox: React.FC<SlideLightboxProps> = ({
  imageUrl,
  isOpen,
  onClose,
  onNext,
  onPrev,
  slideTitle
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset zoom and position when image changes or lightbox opens
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageUrl, isOpen]);

  // Global key events for lightbox (Esc to close, Left/Right arrow to navigate)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNext, onPrev]);

  if (!isOpen) return null;

  // Zoom handlers
  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 0.1 : -0.1;
    setScale(prev => Math.min(Math.max(prev + factor, 0.5), 4));
  };

  // Dragging / Panning handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale <= 1) return; // Only pan when zoomed in
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col justify-between select-none overflow-hidden"
      onMouseUp={handleMouseUp}
    >
      {/* Lightbox Header */}
      <div className="h-14 px-6 bg-black/40 flex items-center justify-between text-white border-b border-white/10 shrink-0">
        <h4 className="text-xs md:text-sm font-bold tracking-wide truncate max-w-lg">
          放大檢視：{slideTitle}
        </h4>

        {/* Action Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white/10 p-0.5 rounded-lg border border-white/5">
            <button
              onClick={zoomOut}
              className="p-1.5 hover:bg-white/10 rounded text-white/80 hover:text-white"
              title="縮小"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-[10px] font-mono px-2 text-white/70 w-12 text-center select-none font-bold">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 hover:bg-white/10 rounded text-white/80 hover:text-white"
              title="放大"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={resetZoom}
              className="p-1.5 hover:bg-white/10 rounded text-[10px] font-semibold px-2 text-white/60 hover:text-white border-l border-white/10 ml-0.5"
            >
              重置
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-red-500 hover:text-white text-white/80 rounded-full transition-colors active:scale-95"
            title="關閉 (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden relative cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      >
        {/* Navigation Arrows inside Lightbox */}
        <div className="absolute left-6 z-10">
          <button
            onClick={onPrev}
            className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 active:scale-95 transition-all"
            title="上一頁"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="absolute right-6 z-10">
          <button
            onClick={onNext}
            className="w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10 active:scale-95 transition-all"
            title="下一頁"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Zoomed Image */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt={slideTitle}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? "none" : "transform 0.15s ease-out",
            maxHeight: "85vh",
            maxWidth: "85vw"
          }}
          className="object-contain pointer-events-none select-none"
        />
      </div>

      {/* Lightbox Footer */}
      <div className="h-10 bg-black/40 text-center flex items-center justify-center text-[10px] text-white/50 shrink-0">
        <span>滾輪可縮放圖片 ｜ 放大後可按住滑鼠拖曳移動 ｜ 左右方向鍵切換頁</span>
      </div>
    </div>
  );
};
