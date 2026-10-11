import React from 'react';
import { CourseSlide, LearnerSlideResponse } from '../../types/course';
import { PenTool, CheckCircle, HelpCircle, Briefcase, FileText } from 'lucide-react';

interface WorkbookPanelProps {
  slide: CourseSlide;
  response?: LearnerSlideResponse;
  onUpdateResponse: (updated: Partial<LearnerSlideResponse>) => void;
}

export const WorkbookPanel: React.FC<WorkbookPanelProps> = ({
  slide,
  response,
  onUpdateResponse,
}) => {
  const personalNote = response?.personalNote || '';
  const caseResponse = response?.caseResponse || '';
  const isCompleted = response?.completed || false;

  const notePrompt = slide.kind === 'lecture'
    ? (slide.lecture?.notePrompt || '💡 記錄你的個人心得、講師提問與關鍵洞察：')
    : '📝 小組演練個人筆記與反思：';

  const notePlaceholder = slide.kind === 'lecture'
    ? (slide.lecture?.notePlaceholder || '輸入筆記內容...')
    : '記錄演練中的討論要點或你的體會...';

  const isCaseEnabled = slide.kind === 'lecture' && slide.lecture?.caseEnabled;
  const casePrompt = slide.lecture?.casePrompt || '【專題實作】請根據目前案例情境進行拆解練習：';
  const casePlaceholder = slide.lecture?.casePlaceholder || '在此輸入你的專案案例產出...';

  return (
    <div className="h-full flex flex-col bg-slate-900/90 border-l border-slate-800 p-6 overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">學員互動工作手冊</h3>
            <p className="text-[11px] text-slate-400">個人筆記與練習自動即時儲存</p>
          </div>
        </div>

        {/* Complete Toggle */}
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => onUpdateResponse({ completed: e.target.checked })}
            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-0 cursor-pointer"
          />
          <span className={`text-xs font-bold ${isCompleted ? 'text-amber-400' : 'text-slate-400'}`}>
            {isCompleted ? '已完成' : '標記完成'}
          </span>
        </label>
      </div>

      {/* Main Form Fields */}
      <div className="space-y-6 flex-1">
        {/* Personal Note Section */}
        <div className="space-y-2">
          <div className="flex items-start gap-1.5 text-xs font-bold text-amber-300">
            <FileText className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{notePrompt}</span>
          </div>

          <textarea
            rows={isCaseEnabled ? 6 : 14}
            value={personalNote}
            onChange={(e) => onUpdateResponse({ personalNote: e.target.value })}
            placeholder={notePlaceholder}
            className="w-full p-4 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors resize-none leading-relaxed"
          />

          <div className="flex justify-between items-center text-[10px] text-slate-500">
            <span>字數：{personalNote.length}</span>
            <span>{response?.updatedAt ? `最後儲存：${new Date(response.updatedAt).toLocaleTimeString()}` : '即時儲存中'}</span>
          </div>
        </div>

        {/* Case Exercise Section (if enabled) */}
        {isCaseEnabled && (
          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="flex items-start gap-1.5 text-xs font-bold text-emerald-400">
              <Briefcase className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{casePrompt}</span>
            </div>

            <textarea
              rows={8}
              value={caseResponse}
              onChange={(e) => onUpdateResponse({ caseResponse: e.target.value })}
              placeholder={casePlaceholder}
              className="w-full p-4 bg-slate-950 border border-emerald-900/40 focus:border-emerald-400 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none transition-colors resize-none leading-relaxed font-mono"
            />

            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>字數：{caseResponse.length}</span>
              <span className="text-emerald-500/80">專案貫穿實戰</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 text-slate-400">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>本地自動儲存</span>
        </span>
        <span className="font-mono text-[10px]">P.{slide.pageNumber}</span>
      </div>
    </div>
  );
};
