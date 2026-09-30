import { useState, useRef } from 'react';
import type { Slide } from '../data/slides';
import type { UserSession, TeamNote, NoteAttachment } from '../services/notesService';
import { AddLinkModal } from './AddLinkModal';
import { HtmlPreviewModal } from './HtmlPreviewModal';

interface TeamTaskBriefCardProps {
  slide: Slide;
  userSession?: UserSession | null;
  activeTeamId?: number;
  isInstructor?: boolean;
  onEditTask?: (slide: Slide) => void;
  teamNote?: TeamNote | null;
  onAddAttachment?: (file: File) => Promise<void>;
  onAddLinkAttachment?: (title: string, url: string) => Promise<void>;
  onRemoveAttachment?: (attId: string) => Promise<void>;
  onImageClick?: (imageUrl: string) => void;
}

export function TeamTaskBriefCard({
  slide,
  userSession,
  activeTeamId,
  isInstructor: propIsInstructor,
  onEditTask,
  teamNote,
  onAddAttachment,
  onAddLinkAttachment,
  onRemoveAttachment,
  onImageClick
}: TeamTaskBriefCardProps) {
  const [copiedPromptIndex, setCopiedPromptIndex] = useState<number | null>(null);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const [previewHtmlData, setPreviewHtmlData] = useState<{ title: string; dataUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const task = slide.teamTask;
  const isInstructor = propIsInstructor !== undefined ? propIsInstructor : userSession?.role === 'instructor';
  const isReadOnly = userSession?.role === 'student' && activeTeamId !== userSession.teamId;

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

  const handleDownloadAttachment = (att: NoteAttachment) => {
    if (!att.dataUrl) return;
    const a = document.createElement("a");
    a.href = att.dataUrl;
    a.download = att.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAttachmentClick = (att: NoteAttachment) => {
    if (!att.dataUrl) return;
    const isLink = att.mime === 'text/x-uri' || att.dataUrl.startsWith('http://') || att.dataUrl.startsWith('https://');
    const isHtml = att.mime === 'text/html' || att.name?.toLowerCase().endsWith('.html') || att.name?.toLowerCase().endsWith('.htm');
    const isImage = att.mime?.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(att.name || '');
    const isPdf = att.mime === 'application/pdf' || att.name?.toLowerCase().endsWith('.pdf');

    if (isLink) {
      window.open(att.dataUrl, '_blank', 'noopener,noreferrer');
    } else if (isImage && onImageClick) {
      onImageClick(att.dataUrl);
    } else if (isHtml) {
      setPreviewHtmlData({ title: att.name, dataUrl: att.dataUrl });
    } else if (isPdf) {
      try {
        const win = window.open(att.dataUrl, '_blank');
        if (!win) handleDownloadAttachment(att);
      } catch {
        handleDownloadAttachment(att);
      }
    } else {
      handleDownloadAttachment(att);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAddAttachment) {
      await onAddAttachment(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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

      {/* 小組實作成果交付區 (Team Deliverables - 支援圖檔、PDF、HTML網頁、網頁外鏈) */}
      <div className="bg-slate-950/70 border border-teal-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📤</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-white">
                  第 {activeTeamId || 1} 組實作成果交付庫
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono font-bold">
                  {teamNote?.attachments?.length || 0} 項產出
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                支援圖檔截圖、PDF 報告、HTML 網頁原型與 Figma/Miro 網頁外鏈
              </p>
            </div>
          </div>

          {!isReadOnly && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {onAddAttachment && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.html,.htm,.doc,.docx"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-teal-900/30 transition-all cursor-pointer"
                    title="上傳圖片、PDF、HTML 網頁或文件"
                  >
                    <span>📁</span>
                    <span>上傳檔案</span>
                  </button>
                </div>
              )}

              {onAddLinkAttachment && (
                <button
                  type="button"
                  onClick={() => setShowAddLinkModal(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/40 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="提交 Figma、Miro、Google Docs、專案成果等網頁外鏈"
                >
                  <span>🔗</span>
                  <span>提交外鏈</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 成果列表 */}
        {teamNote?.attachments && teamNote.attachments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {teamNote.attachments.map((att) => {
              const isLink = att.mime === 'text/x-uri' || att.dataUrl?.startsWith('http://') || att.dataUrl?.startsWith('https://');
              const isHtml = att.mime === 'text/html' || att.name?.toLowerCase().endsWith('.html') || att.name?.toLowerCase().endsWith('.htm');
              const isPdf = att.mime === 'application/pdf' || att.name?.toLowerCase().endsWith('.pdf');
              const isImage = att.mime?.startsWith("image/") || /\.(png|jpe?g|webp|gif|svg)$/i.test(att.name || '');

              return (
                <div
                  key={att.id}
                  onClick={() => handleAttachmentClick(att)}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-700/80 hover:border-teal-500/50 flex items-center justify-between gap-2.5 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {isImage && att.dataUrl ? (
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-700 shrink-0"
                      />
                    ) : isHtml ? (
                      <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 text-[10px] font-black shrink-0">
                        🌐 HTML
                      </div>
                    ) : isPdf ? (
                      <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 text-[10px] font-black shrink-0">
                        📕 PDF
                      </div>
                    ) : isLink ? (
                      <div className="w-9 h-9 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 text-sm font-black shrink-0">
                        🔗
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 text-[10px] font-bold shrink-0">
                        FILE
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-100 truncate group-hover:text-teal-300 transition-colors" title={att.name}>
                        {att.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px]">
                          {isLink ? '網頁外鏈' : isHtml ? 'HTML 網頁' : isPdf ? 'PDF 文件' : '圖片檔案'}
                        </span>
                        {!isLink && <span>{(att.size / 1024).toFixed(0)} KB</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isLink ? '開啟 ↗' : isHtml ? '預覽 ↗' : isPdf ? '檢視 ↗' : '放大 🔍'}
                    </span>
                    {!isReadOnly && onRemoveAttachment && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveAttachment(att.id);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title="刪除此產出"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-5 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/40 text-xs">
            <span>第 {activeTeamId || 1} 組尚未提交成果，請點擊上方按鈕上傳圖檔、PDF、HTML 或提交網頁外鏈</span>
          </div>
        )}
      </div>

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

      {/* 彈窗：提交網頁外鏈 */}
      <AddLinkModal
        isOpen={showAddLinkModal}
        onClose={() => setShowAddLinkModal(false)}
        onAddLink={async (t, u) => {
          if (onAddLinkAttachment) {
            await onAddLinkAttachment(t, u);
          }
        }}
        teamId={activeTeamId}
      />

      {/* 彈窗：HTML 網頁即時互動預覽 */}
      <HtmlPreviewModal
        isOpen={!!previewHtmlData}
        onClose={() => setPreviewHtmlData(null)}
        title={previewHtmlData?.title || ''}
        dataUrl={previewHtmlData?.dataUrl || ''}
      />
    </div>
  );
}
