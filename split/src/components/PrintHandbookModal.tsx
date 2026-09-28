import React, { useState, useEffect } from 'react';
import type { Slide } from '../data/slides';
import {
  fetchAllTeamNotes,
  type UserSession,
  type ClassMetadata,
  type TeamNote
} from '../services/notesService';
import { fetchAllLectureNotes, type LectureNoteData } from '../services/lectureNoteService';

interface PrintHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  classMetadata: ClassMetadata | null;
  userSession: UserSession | null;
}

export const PrintHandbookModal: React.FC<PrintHandbookModalProps> = ({
  isOpen,
  onClose,
  slides,
  classMetadata,
  userSession
}) => {
  const [loading, setLoading] = useState(true);
  const [lectureNotesMap, setLectureNotesMap] = useState<Record<string, LectureNoteData>>({});
  const [teamNotesMap, setTeamNotesMap] = useState<Record<string, TeamNote>>({});
  const [selectedTeamId, setSelectedTeamId] = useState<number>(userSession?.teamId || 1);

  const teamCount = classMetadata?.teamCount || 6;

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const classId = classMetadata?.id || userSession?.classId || 'default-split';
    const generation = classMetadata?.currentGeneration || 1;

    Promise.all([
      fetchAllLectureNotes(classId, generation),
      fetchAllTeamNotes(classId, generation, selectedTeamId)
    ])
      .then(([lectures, teamNotes]) => {
        setLectureNotesMap(lectures);
        setTeamNotesMap(teamNotes);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, selectedTeamId, classMetadata?.id, classMetadata?.currentGeneration, userSession?.classId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const getStickyBgColor = (color: string) => {
    switch (color) {
      case 'yellow': return 'bg-amber-50 border-amber-300 text-amber-950';
      case 'green': return 'bg-emerald-50 border-emerald-300 text-emerald-950';
      case 'blue': return 'bg-sky-50 border-sky-300 text-sky-950';
      case 'pink': return 'bg-rose-50 border-rose-300 text-rose-950';
      case 'purple': return 'bg-purple-50 border-purple-300 text-purple-950';
      default: return 'bg-amber-50 border-amber-300 text-amber-950';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      {/* 預覽視窗容器 */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* 頂部操作列（列印時隱藏） */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight">全日課堂講義手冊</h2>
              <p className="text-xs text-slate-400">含 27 頁目錄索引、隨堂重點便利貼、詳細解說與小組討論成果</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* 組別切換器 */}
            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <span className="text-slate-400 font-bold">小組成果：</span>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                className="bg-slate-900 text-teal-300 font-bold rounded-lg px-2 py-0.5 border border-slate-700 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: teamCount }, (_, i) => i + 1).map((tid) => (
                  <option key={tid} value={tid}>
                    第 {tid} 組
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>立即列印 / 存為 PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 內容預覽滾動區 */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-50 print:bg-white print:p-0 print:overflow-visible">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-bold">小編正在為您彙整全日講義目錄與隨堂筆記...</span>
            </div>
          ) : (
            <div className="space-y-12 max-w-3xl mx-auto print:max-w-none">
              {/* 1. 封面區 */}
              <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-sm text-center print:border-none print:shadow-none print:break-after-page">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black tracking-wider uppercase mb-4">
                  SPLIT · 實戰工作坊
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-3">
                  需求拆解實戰 · 全日講義筆記手冊
                </h1>
                <p className="text-sm text-slate-500 mb-8">
                  收錄全天隨堂精華便利貼、詳細重點還原、小組討論成果與單元索引
                </p>
                <div className="inline-flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-600 border-t border-slate-100 pt-6">
                  <span>班級代碼：{classMetadata?.id || userSession?.classId || 'SPLIT 實戰班'}</span>
                  <span>·</span>
                  <span>小組標籤：第 {selectedTeamId} 組筆記成果</span>
                  <span>·</span>
                  <span>產出日期：{new Date().toLocaleDateString('zh-TW')}</span>
                  <span>·</span>
                  <span>全冊總頁數：{slides.length} 頁</span>
                </div>
              </div>

              {/* 2. 課程 27 頁目錄對照索引 (Table of Contents) */}
              <div className="p-6 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:break-after-page">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-slate-900 text-teal-400 font-bold text-sm">📑</span>
                    <div>
                      <h2 className="text-xl font-black text-slate-900">課程單元與投影片目錄索引</h2>
                      <p className="text-xs text-slate-500">全手冊共 {slides.length} 個單元與隨堂實作對照</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-600">
                    全 {slides.length} 頁索引
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {slides.map((s, idx) => {
                    const hasLecture = Boolean(lectureNotesMap[s.id]?.stickies?.length);
                    const hasTeamNote = Boolean(teamNotesMap[s.id]?.memo?.trim());
                    return (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-mono font-bold text-slate-400 w-6 text-right shrink-0">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <span className="font-bold text-slate-800 truncate" title={s.title}>
                            {s.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {hasLecture && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]" title="包含隨堂重點便利貼">
                              📌 重點
                            </span>
                          )}
                          {hasTeamNote && (
                            <span className="px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 font-bold text-[10px]" title="包含小組討論筆記">
                              👥 第{selectedTeamId}組
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. 逐頁內容 (隨堂便利貼 + 詳細內容 + 小組實作成果) */}
              {slides.map((slide, index) => {
                const note = lectureNotesMap[slide.id];
                const teamNote = teamNotesMap[slide.id];
                const hasStickies = note && note.stickies && note.stickies.length > 0;
                const hasArticle = note && note.textbookArticle;
                const hasTeamMemo = teamNote && teamNote.memo && teamNote.memo.trim().length > 0;

                return (
                  <div
                    key={slide.id}
                    className="p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6 print:border-b print:border-slate-300 print:rounded-none print:shadow-none print:break-inside-avoid print:p-4"
                  >
                    {/* 頁面標題 */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-mono font-black">
                          第 {index + 1} 頁
                        </span>
                        <h2 className="text-lg font-black text-slate-900">
                          {slide.title}
                        </h2>
                      </div>
                      {slide.subtitle && (
                        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                          {slide.subtitle}
                        </span>
                      )}
                    </div>

                    {/* A. 隨堂重點便利貼群 */}
                    {hasStickies ? (
                      <div>
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <span>📌 隨堂重點便利貼</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {note.stickies.map((stk) => (
                            <div
                              key={stk.id}
                              className={`p-4 rounded-2xl border shadow-xs transition-all ${getStickyBgColor(
                                stk.color
                              )}`}
                            >
                              <h4 className="font-black text-sm mb-2 pb-1 border-b border-black/10">
                                {stk.title}
                              </h4>
                              <ul className="space-y-1.5 text-xs leading-relaxed">
                                {stk.points.map((pt, pIdx) => (
                                  <li key={pIdx} className="flex items-start gap-1.5">
                                    <span className="font-bold shrink-0">•</span>
                                    <span>{pt}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-400 italic">
                        （此頁未錄製便利貼，以實體課堂練習為主）
                      </div>
                    )}

                    {/* B. 詳細解說內容 */}
                    {hasArticle && (
                      <div className="pt-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span>📖 詳細內容解說</span>
                        </h3>
                        <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
                          {note.textbookArticle}
                        </div>
                      </div>
                    )}

                    {/* C. 小組討論與實作成果 (Team Notes) */}
                    {hasTeamMemo && (
                      <div className="pt-2">
                        <h3 className="text-xs font-black text-teal-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <span>👥 第 {selectedTeamId} 組實作與討論筆記成果</span>
                        </h3>
                        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-teal-50/60 p-4 sm:p-5 rounded-2xl border border-teal-200/80">
                          {teamNote.memo}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
