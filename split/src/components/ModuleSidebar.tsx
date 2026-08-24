import { modules } from "../data/modules";
import { slides } from "../data/slides";
import type { SlideResponse } from "../data/slides";

interface ModuleSidebarProps {
  activeSlideId: string;
  onSelectSlide: (slideId: string) => void;
  getResponse: (slideId: string) => SlideResponse;
  viewMode: "focus" | "overview";
  collapsed?: boolean;
}

export const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  activeSlideId,
  onSelectSlide,
  getResponse,
  viewMode,
  collapsed = false
}) => {
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
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">
            課程單元與進度
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
            6 MODULES
          </span>
        </div>
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

                  return (
                    <button
                      key={slide.id}
                      onClick={() => onSelectSlide(slide.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-all ${
                        isActive
                          ? "bg-fubon-blue text-white font-bold shadow-md shadow-fubon-blue/15"
                          : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Slide Page Number */}
                        <span className={`font-mono text-[9px] shrink-0 ${
                          isActive ? "text-white/80" : "text-slate-500"
                        }`}>
                          P.{slide.page.toString().padStart(2, "0")}
                        </span>
                        
                        {/* Slide Title */}
                        <span className="truncate">{slide.title}</span>
                      </div>

                      {/* State Badges: Checked (Completed) / Document (Has Notes) */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Note badge */}
                        {hasNote && (
                          <svg className={`w-3.5 h-3.5 ${isActive ? "text-white/80" : "text-fubon-blue"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        )}
                        
                        {/* Completed badge */}
                        {isCompleted && (
                          <svg className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-fubon-green"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
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
