import React, { useState, useEffect } from 'react';
import { Course, CourseSlide, LearnerSlideResponse } from '../../types/course';
import { SlideViewer } from './SlideViewer';
import { WorkbookPanel } from './WorkbookPanel';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  Layers
} from 'lucide-react';

interface PlayerViewProps {
  course: Course;
  onBackToBuilder: () => void;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  course,
  onBackToBuilder,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<string, LearnerSlideResponse>>(() => {
    // Load local storage if available
    try {
      const saved = localStorage.getItem(`course_learner_${course.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [showOverviewModal, setShowOverviewModal] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`course_learner_${course.id}`, JSON.stringify(responses));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [responses, course.id]);

  const currentSlide: CourseSlide = course.slides[currentIndex] || course.slides[0];
  const currentModule = course.modules.find((m) => m.id === currentSlide?.moduleId);

  const completedCount = Object.values(responses).filter((r) => r.completed).length;
  const progressPercent = course.slides.length > 0
    ? Math.round((completedCount / course.slides.length) * 100)
    : 0;

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < course.slides.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handleUpdateResponse = (updated: Partial<LearnerSlideResponse>) => {
    if (!currentSlide) return;
    setResponses((prev) => {
      const existing = prev[currentSlide.id] || {
        slideId: currentSlide.id,
        personalNote: '',
        caseResponse: '',
        completed: false,
        updatedAt: new Date().toISOString(),
      };
      return {
        ...prev,
        [currentSlide.id]: {
          ...existing,
          ...updated,
          updatedAt: new Date().toISOString(),
        },
      };
    });
  };

  if (!currentSlide) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <p className="text-sm text-slate-400 mb-4">此課程目前尚未建立任何頁面</p>
        <button
          onClick={onBackToBuilder}
          className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-bold text-xs"
        >
          返回編輯器新增頁面
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
      {/* TopBar Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between flex-shrink-0 z-20">
        {/* Left: Back to Builder & Course Info */}
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToBuilder}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回編輯器</span>
          </button>

          <div className="hidden md:block">
            <h1 className="text-sm font-bold text-white tracking-wide truncate max-w-sm">
              {course.title}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              {currentModule && (
                <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  {currentModule.code} - {currentModule.title}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Module Switcher Pills */}
        <div className="hidden lg:flex items-center gap-1.5">
          {course.modules.map((m) => {
            const isCurrentModule = m.id === currentSlide.moduleId;
            return (
              <button
                key={m.id}
                onClick={() => {
                  const firstSlideOfModule = course.slides.findIndex((s) => s.moduleId === m.id);
                  if (firstSlideOfModule >= 0) setCurrentIndex(firstSlideOfModule);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  isCurrentModule
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                [{m.code}] {m.title.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {/* Right: Progress & Slide Navigation */}
        <div className="flex items-center gap-4">
          {/* Progress Pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>進度</span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono text-white text-[11px] font-bold">{progressPercent}%</span>
          </div>

          {/* Overview Grid Button */}
          <button
            onClick={() => setShowOverviewModal(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            title="全部頁面預覽"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Prev / Next Arrows */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              disabled={currentIndex === 0}
              onClick={handlePrev}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 rounded-lg transition-colors"
              title="上一頁"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-white px-2">
              {currentIndex + 1} / {course.slides.length}
            </span>
            <button
              disabled={currentIndex === course.slides.length - 1}
              onClick={handleNext}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-20 disabled:hover:text-slate-400 rounded-lg transition-colors"
              title="下一頁"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Two-Column Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Slide / Task Viewer (approx 62%) */}
        <div className="flex-[62] h-full overflow-hidden bg-slate-950/60 flex flex-col">
          <SlideViewer slide={currentSlide} />
        </div>

        {/* Right: Interactive Workbook Panel (approx 38%) */}
        <div className="flex-[38] h-full overflow-hidden bg-slate-900/90 shadow-2xl">
          <WorkbookPanel
            slide={currentSlide}
            response={responses[currentSlide.id]}
            onUpdateResponse={handleUpdateResponse}
          />
        </div>
      </div>

      {/* Overview Modal */}
      {showOverviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-white">課程章節目錄 (共 {course.slides.length} 頁)</h3>
              <button
                onClick={() => setShowOverviewModal(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
              >
                關閉
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto p-2">
              {course.slides.map((s, idx) => {
                const isSelected = idx === currentIndex;
                const isComp = responses[s.id]?.completed;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowOverviewModal(false);
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg'
                        : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400">P.{s.pageNumber}</span>
                      {isComp && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-xs font-bold truncate">{s.title}</div>
                    <span className="text-[10px] text-slate-500 mt-1">
                      {s.kind === 'task' ? '⚡ 任務演練' : '📖 講義'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
