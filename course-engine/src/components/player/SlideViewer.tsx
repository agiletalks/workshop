import React, { useState, useEffect } from 'react';
import { CourseSlide } from '../../types/course';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  CheckSquare,
  ListOrdered,
  Target,
  FileQuestion,
  Maximize2
} from 'lucide-react';

interface SlideViewerProps {
  slide: CourseSlide;
}

export const SlideViewer: React.FC<SlideViewerProps> = ({ slide }) => {
  // Timer state for task
  const initialSeconds = (slide.task?.durationMinutes || 15) * 60;
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState<boolean>(false);

  // Reset timer if slide changes
  useEffect(() => {
    if (slide.kind === 'task') {
      const secs = (slide.task?.durationMinutes || 15) * 60;
      setTimeLeft(secs);
      setIsRunning(false);
    }
  }, [slide.id, slide.kind, slide.task?.durationMinutes]);

  // Countdown effect
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. 投影片講義模式 (Lecture View)
  if (slide.kind === 'lecture') {
    return (
      <div className="h-full flex flex-col justify-between p-6">
        {/* Top Info */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                P.{slide.pageNumber}
              </span>
              {slide.keywords?.map((kw, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                  #{kw}
                </span>
              ))}
            </div>
            <h2 className="text-xl font-bold text-white tracking-wide">{slide.title}</h2>
            {slide.subtitle && <p className="text-xs text-slate-400 mt-0.5">{slide.subtitle}</p>}
          </div>

          {slide.lecture?.imageUrl && (
            <button
              onClick={() => setIsImageFullscreen(true)}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700 text-xs flex items-center gap-1"
              title="放大檢視圖片"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">放大</span>
            </button>
          )}
        </div>

        {/* Main Slide Image Box */}
        <div className="flex-1 min-h-[360px] bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden flex items-center justify-center p-3 relative group">
          {slide.lecture?.imageUrl ? (
            <img
              src={slide.lecture.imageUrl}
              alt={slide.title}
              className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-200"
            />
          ) : (
            <div className="text-center p-8 text-slate-500">
              <p className="text-sm">此頁面尚未上傳投影片圖片</p>
            </div>
          )}
        </div>

        {/* Fullscreen Image Lightbox Modal */}
        {isImageFullscreen && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6 backdrop-blur-md cursor-zoom-out"
            onClick={() => setIsImageFullscreen(false)}
          >
            <img
              src={slide.lecture?.imageUrl}
              alt={slide.title}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
          </div>
        )}
      </div>
    );
  }

  // 2. 小組實作任務卡模式 (Team Task View)
  return (
    <div className="h-full flex flex-col justify-between p-6 space-y-5 overflow-y-auto">
      {/* Task Header & Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950">
              {slide.task?.taskBadge || 'TEAM TASK'}
            </span>
            <span className="text-xs text-emerald-400 font-bold">小組實戰演練</span>
          </div>
          <h2 className="text-2xl font-black text-white">{slide.title}</h2>
          {slide.subtitle && <p className="text-xs text-slate-300 mt-1">{slide.subtitle}</p>}
        </div>

        {/* Timer Box */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-emerald-500/40 px-4 py-2.5 rounded-xl shadow-inner">
          <Clock className={`w-5 h-5 ${isRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <span className="text-2xl font-mono font-black text-white tracking-widest">
            {formatTimer(timeLeft)}
          </span>
          <div className="flex items-center gap-1 ml-2 border-l border-slate-800 pl-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg transition-colors"
              title={isRunning ? '暫停' : '開始倒數'}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-slate-950" />}
            </button>
            <button
              onClick={() => {
                setIsRunning(false);
                setTimeLeft(initialSeconds);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="重設時間"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Task Content Grid */}
      <div className="space-y-4 flex-1">
        {/* Scenario & Objective */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
              <FileQuestion className="w-4 h-4" />
              <span>任務情境 (Scenario)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {slide.task?.scenario || '依據課堂情境說明進行團隊演練。'}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-2">
              <Target className="w-4 h-4" />
              <span>演練目標 (Objective)</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
              {slide.task?.objective || '請團隊於時間內凝聚共識並產出交付成果。'}
            </p>
          </div>
        </div>

        {/* Steps */}
        {slide.task?.steps && slide.task.steps.length > 0 && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-3">
              <ListOrdered className="w-4 h-4 text-emerald-400" />
              <span>操作步驟與引導</span>
            </div>
            <div className="space-y-2">
              {slide.task.steps.map((st, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-mono text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{st}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deliverable & Whiteboard Link */}
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <span className="text-xs font-bold text-white">交付產出物：</span>
              <span className="text-xs text-slate-300 ml-1.5">
                {slide.task?.deliverable || '各小組依指導於指定看板記錄成果'}
              </span>
            </div>
          </div>

          {slide.task?.whiteboardUrl && (
            <a
              href={slide.task.whiteboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
            >
              <span>開啟小組線上白板</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
