import { useState } from 'react';
import type { Slide } from '../data/slides';
import type { UserSession } from '../services/notesService';

interface TeamTaskBriefCardProps {
  slide: Slide;
  userSession?: UserSession | null;
  activeTeamId?: number;
  isInstructor?: boolean;
  onEditTask?: (slide: Slide) => void;
}

export function TeamTaskBriefCard({
  slide,
  userSession,
  activeTeamId,
  isInstructor: propIsInstructor,
  onEditTask
}: TeamTaskBriefCardProps) {
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const task = slide.teamTask;
  const isInstructor = propIsInstructor !== undefined ? propIsInstructor : userSession?.role === 'instructor';

  if (!task) {
    return (
      <div className="p-6 text-center text-slate-400">
        此演練任務尚未配置詳細規格。
      </div>
    );
  }

  const handleCopyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPromptIndex(index);
    setTimeout(() => setCopiedPromptIndex(null), 2500);
  };

  const handleOpenWhiteboard = () => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const boardType = task.whiteboardType || "main";
    const classId = userSession?.classId || "default-split";
    const teamParam = `team-${activeTeamId || 1}`;
    const targetUrl = `${baseUrl}board.html?c=${encodeURIComponent(classId)}&team=${teamParam}&type=${boardType}`;
    window.open(targetUrl, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto p-4 sm:p-6 select-text space-y-4">
      {/* 頂部標題與狀態列 */}
      <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-[10px] font-black tracking-wider uppercase">
              🎯 {task.badge || "團隊演練"}
            </span>
            {task.durationMinutes && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 font-mono">
                <span>⏱️</span>
                <span>建議時間：{task.durationMinutes} 分鐘</span>
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-black text-white leading-tight">
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{slide.subtitle}</p>
          )}
        </div>

        {/* 講師專屬編輯按鈕 */}
        {isInstructor && onEditTask && (
          <button
            onClick={() => onEditTask(slide)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            title="編輯此團隊演練"
          >
            <span>✏️</span>
            <span>編輯演練</span>
          </button>
        )}
      </div>

      {/* 任務情境背景 (Scenario) */}
      {task.scenario && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-bold text-teal-400 flex items-center gap-1.5">
            <span>📋</span>
            <span>任務情境背景</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
            {task.scenario}
          </p>
        </div>
      )}

      {/* 核心挑戰目標 (Objective) */}
      {task.objective && (
        <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-3.5 space-y-1">
          <div className="text-[11px] font-bold text-teal-300 flex items-center gap-1.5">
            <span>🎯</span>
            <span>小組核心挑戰目標</span>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
            {task.objective}
          </p>
        </div>
      )}

      {/* 執行步驟指引 (Steps) */}
      {task.steps && task.steps.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span>🔢</span>
            <span>執行步驟指引</span>
          </div>
          <div className="space-y-2">
            {task.steps.map((step: string, idx: number) => (
              <div
                key={idx}
                className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-2.5 flex items-start gap-2.5 text-xs text-slate-200"
              >
                <span className="w-5 h-5 rounded-full bg-teal-600/30 text-teal-300 border border-teal-500/50 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed whitespace-pre-wrap flex-1">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 交付成果驗收要求 (Deliverables) */}
      {task.deliverable && (
        <div className="bg-amber-950/15 border border-amber-500/30 rounded-xl p-3 space-y-1">
          <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
            <span>📦</span>
            <span>成果交付與驗收標準</span>
          </div>
          <p className="text-xs text-amber-100/90 leading-relaxed whitespace-pre-wrap">
            {task.deliverable}
          </p>
        </div>
      )}

      {/* 工具操作區：白板連動 & AI 提示詞 */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        {/* 白板連動按鈕 */}
        {task.whiteboardType && (
          <button
            type="button"
            onClick={handleOpenWhiteboard}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
          >
            <span>🎨</span>
            <span>開啟第 {activeTeamId || 1} 組專屬協作白板進行演練</span>
          </button>
        )}

        {/* 提示詞範本一鍵複製 */}
        {task.prompts && task.prompts.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <span>💡</span>
              <span>課堂提示詞範本 (點擊一鍵複製)：</span>
            </div>
            {task.prompts.map((p: string, idx: number) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleCopyPrompt(p, idx)}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/40 text-xs text-slate-300 transition-all flex items-center justify-between gap-2 group cursor-pointer"
              >
                <span className="truncate flex-1 font-mono text-[11px] text-slate-300 group-hover:text-teal-300">
                  {p}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 transition-all ${
                  copiedPromptIndex === idx
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-700 text-slate-300 group-hover:bg-teal-600 group-hover:text-white'
                }`}>
                  {copiedPromptIndex === idx ? '✓ 已複製' : '複製'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
