import React from "react";
import { modules } from "../data/modules";
import type { Slide, SlideResponse } from "../data/slides";

interface ModuleSidebarProps {
  activeSlideId: string;
  slides: Slide[];
  onSelectSlide: (slideId: string) => void;
  getResponse: (slideId: string) => SlideResponse;
  viewMode: "focus" | "overview";
  collapsed?: boolean;
  isInstructor?: boolean;
  onOpenTaskEditor?: (insertAfterSlideId?: string) => void;
  recordingSlideId?: string | null;
  recordingSeconds?: number;
  instructorLiveSlideId?: string;
}

export const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  activeSlideId,
  slides,
  onSelectSlide,
  getResponse,
  viewMode,
  collapsed = false,
  isInstructor = false,
  onOpenTaskEditor,
  recordingSlideId,
  recordingSeconds = 0,
  instructorLiveSlideId
}) => {
  const formatTimer = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };
  // Group slides by moduleId
  const getSlidesByModule = (moduleId: string) => {
    return slides.filter(s => s.moduleId === moduleId);
  };

  // Calculate completion percentage for a module
  const getModuleProgress = (moduleId: string) => {
    const moduleSlides = getSlidesByModule(moduleId).filter(s => s.showInProgress !== false);
    if (moduleSlides.length === 0) return 0;
    const completed = moduleSlides.filter(s => getResponse(s.id).completed).length;
    return Math.round((completed / moduleSlides.length) * 100);
  };

  return (
    <aside className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 h-full select-none transition-all duration-300 ${collapsed ? "w-0 opacity-0 overflow-hidden border-r-0 pointer-events-none" : "w-64 border-r border-slate-800"}`}>
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
            課程單元與進度
          </span>
          <div className="text-[10px] text-slate-500 font-mono">
            {slides.length} SLIDES
          </div>
        </div>

        {/* 講師專屬新增演練捷徑 */}
        {isInstructor && onOpenTaskEditor && (
          <button
            onClick={() => onOpenTaskEditor(activeSlideId)}
            className="px-2 py-1 bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm"
            title="在此位置插入新團隊演練"
          >
            <span>+ 演練</span>
          </button>
        )}
      </div>

      {/* Module List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {modules.map((mod) => {
          const moduleSlides = getSlidesByModule(mod.id);
          const progress = getModuleProgress(mod.id);

          return (
            <div key={mod.id} className="space-y-1.5">
              {/* Module Header Card */}
              <div className="p-2.5 rounded-xl bg-slate-950/20 border border-slate-800/40">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-white truncate flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-fubon-blue/20 text-fubon-blue flex items-center justify-center font-mono shrink-0">
                        {mod.id}
                      </span>
                      {mod.title.split("｜")[1] || mod.title}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-black shrink-0 px-1.5 py-0.5 rounded ${
                    progress === 100
                      ? "bg-fubon-green/20 text-fubon-green"
                      : "bg-slate-800 text-slate-400"
                  }`}>
                    {progress}%
                  </span>
                </div>

                {/* Progress bar inside module card */}
                <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-fubon-green h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Module Slides List */}
              <div className="space-y-0.5 pl-1">
                {moduleSlides.map((slide) => {
                  const res = getResponse(slide.id);
                  const isActive = slide.id === activeSlideId && viewMode === "focus";
                  const hasNote = res.personalNote.trim().length > 0;
                  const isCompleted = res.completed;
                  const isTask = slide.slideKind === 'task';

                  return (
                    <div key={slide.id} className="relative group">
                      <button
                        onClick={() => onSelectSlide(slide.id)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                          isActive
                            ? isTask
                              ? "bg-teal-600 text-slate-950 font-black shadow-md shadow-teal-500/20"
                              : "bg-fubon-blue text-white font-bold shadow-md shadow-fubon-blue/15"
                            : isTask
                            ? "bg-teal-950/30 hover:bg-teal-900/40 text-teal-300 border border-teal-500/20"
                            : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Slide Page Number or Task Icon */}
                          {isTask ? (
                            <span className="shrink-0 text-xs">🎯</span>
                          ) : (
                            <span className={`font-mono text-[9px] shrink-0 ${
                              isActive ? "text-white/80" : "text-slate-500"
                            }`}>
                              P.{slide.page.toString().padStart(2, "0")}
                            </span>
                          )}
                          
                          {/* Slide Title */}
                          <span className="truncate">{slide.title}</span>
                        </div>

                        {/* State Badges: Checked (Completed) / Document (Has Notes) / Task Badge / Recording Badge */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* 正在錄音中 (ON AIR 動態呼吸燈與碼錶) */}
                          {slide.id === recordingSlideId && (
                            <span
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-rose-500/25 text-rose-300 font-mono text-[9px] font-black border border-rose-500/50 shadow-xs animate-pulse"
                              title="講師正在此頁講課錄音中"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                              <span>{formatTimer(recordingSeconds)}</span>
                            </span>
                          )}

                          {/* 老師與學員皆可見：當前投影此頁 */}
                          {instructorLiveSlideId === slide.id && (
                            <span
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold border border-amber-500/40 shadow-xs animate-pulse"
                              title={isInstructor ? "您大螢幕正在投影此頁" : "老師大螢幕正在投影此頁"}
                            >
                              <span>📡 投影中</span>
                            </span>
                          )}

                          {isTask && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                              isActive ? "bg-slate-900 text-teal-200" : "bg-teal-500/20 text-teal-300"
                            }`}>
                              演練
                            </span>
                          )}

                          {/* Note badge */}
                          {hasNote && !isTask && (
                            <svg className={`w-3.5 h-3.5 ${isActive ? "text-white/80" : "text-fubon-blue"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          )}
                          
                          {/* Completed badge */}
                          {isCompleted && (
                            <svg className={`w-3.5 h-3.5 ${isActive ? "text-slate-950" : "text-fubon-green"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </button>

                      {/* 講師快捷插入按鈕 (懸停時出現在下方) */}
                      {isInstructor && onOpenTaskEditor && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end pr-2 -mt-1 relative z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenTaskEditor(slide.id);
                            }}
                            className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-teal-600 hover:text-slate-950 text-slate-400 rounded border border-slate-700 transition-colors shadow-xs"
                            title={`在 P.${slide.page} 之後插入演練`}
                          >
                            + 插入演練
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
