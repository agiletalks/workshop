import { useState } from "react";
import { slides } from "../data/slides";
import type { SlideResponse } from "../data/slides";

interface OverviewGridProps {
  onSelectSlide: (slideId: string) => void;
  getResponse: (slideId: string) => SlideResponse;
}

type FilterType = "all" | "completed" | "incomplete" | "hasNote" | "core" | "comparison";

export const OverviewGrid: React.FC<OverviewGridProps> = ({ onSelectSlide, getResponse }) => {
  const [filter, setFilter] = useState<FilterType>("all");

  const getImageUrl = (imageName: string) => {
    if (!imageName) return "";
    const baseUrl = import.meta.env.BASE_URL || "/";
    return `${baseUrl}assets/${imageName}`;
  };

  const filteredSlides = slides.filter((slide) => {
    const res = getResponse(slide.id);
    const hasNote = res.personalNote.trim().length > 0;
    const isCompleted = res.completed;

    if (filter === "completed") return isCompleted;
    if (filter === "incomplete") return !isCompleted && slide.showInProgress !== false;
    if (filter === "hasNote") return hasNote;
    if (filter === "core") return slide.type === "core";
    if (filter === "comparison") return slide.type === "comparison";
    return true; // all
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 overflow-hidden select-none">
      {/* Filters Bar */}
      <div className="p-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wide">
          全覽篩選：
        </span>

        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { type: "all", label: "全部投影片" },
              { type: "completed", label: "已完成" },
              { type: "incomplete", label: "未完成" },
              { type: "hasNote", label: "有筆記" },
              { type: "core", label: "核心工具" },
              { type: "comparison", label: "比較工具" }
            ] as const
          ).map((item) => (
            <button
              key={item.type}
              onClick={() => setFilter(item.type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                filter === item.type
                  ? "bg-fubon-blue text-white border-transparent shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {item.label}
              <span className={`ml-1 text-[10px] font-mono opacity-85`}>
                (
                {
                  slides.filter((s) => {
                    const r = getResponse(s.id);
                    if (item.type === "completed") return r.completed;
                    if (item.type === "incomplete") return !r.completed && s.showInProgress !== false;
                    if (item.type === "hasNote") return r.personalNote.trim().length > 0;
                    if (item.type === "core") return s.type === "core";
                    if (item.type === "comparison") return s.type === "comparison";
                    return true;
                  }).length
                }
                )
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid Scrollable Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredSlides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-sm">
            找不到符合篩選條件的投影片
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredSlides.map((slide) => {
              const res = getResponse(slide.id);
              const isCompleted = res.completed;
              const hasNote = res.personalNote.trim().length > 0;
              const imgUrl = getImageUrl(slide.image);

              return (
                <div
                  key={slide.id}
                  onClick={() => onSelectSlide(slide.id)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] flex flex-col h-[200px] relative group"
                >
                  {/* Image / Thumbnail Section */}
                  <div className="h-32 bg-slate-900 flex items-center justify-center overflow-hidden border-b border-slate-100 relative">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={slide.title}
                        className="w-full h-full object-contain pointer-events-none group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-[10px] text-slate-500 font-mono text-center px-4 font-semibold uppercase">
                        {slide.type} 頁面
                      </div>
                    )}

                    {/* Completion Check Overlay Badge */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-fubon-green text-white p-1 rounded-full shadow-md z-10 border border-white/20">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Note indicator overlay */}
                    {hasNote && (
                      <div className="absolute bottom-2 left-2 bg-fubon-blue text-white p-1 rounded-lg shadow-md z-10 border border-white/10 text-[9px] font-mono leading-none">
                        📝 筆記
                      </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 select-none">
                        <span className="text-[9px] font-mono font-bold text-slate-400">
                          P.{slide.page.toString().padStart(2, "0")}
                        </span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-black">
                          {slide.moduleId}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-snug">
                        {slide.title}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
