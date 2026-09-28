import React, { useState, useEffect } from 'react';
import type { Slide } from '../data/slides';
import {
  fetchAllTeamNotes,
  type UserSession,
  type ClassMetadata,
  type TeamNote
} from '../services/notesService';
import {
  fetchAllLectureNotes,
  fetchMasterTextbook,
  generateGlobalTextbook,
  type LectureNoteData,
  type MasterTextbookData,
  type SlidePromptItem
} from '../services/lectureNoteService';

interface PrintHandbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: Slide[];
  classMetadata: ClassMetadata | null;
  userSession: UserSession | null;
}

// 課堂內建官方提示詞常數
const builtinPrompts: Record<string, SlidePromptItem> = {
  'slide-3': {
    id: 'builtin-slide-3',
    title: 'DoD & DoR 概念學習網頁生成 Prompt',
    description: '產生 Definition of Done 與 Definition of Ready 完整深度比較與案例學習 HTML 頁面',
    promptText: `你是一位熟悉 Scrum、Agile 與產品開發的專業講師。請協助我研究並理解 Definition of Done（DoD）與 Definition of Ready（DoR），最後將研究結果製作成一份可以直接在瀏覽器開啟閱讀的完整 HTML 網頁。

【一、學習目標】
1. 用自己的話解釋 DoD 與 DoR。
2. 說明 DoD 與 DoR 分別要解決什麼問題。
3. 判斷一項條件屬於 DoD 或 DoR。
4. 說明 DoD 與 DoR 在 Scrum 中的正式定位。
5. 發現不恰當或過度僵化的 DoD、DoR。
6. 為一個團隊提出初步的 DoD 與 DoR 範例。`,
    createdAt: 0
  },
  'slide-4': {
    id: 'builtin-slide-4',
    title: 'User Story & AC 學習生成 Prompt',
    description: '理解 User Story、Acceptance Criteria、3C 與 INVEST 概念及案例應用',
    promptText: `你是一位熟悉 Agile、Scrum、Extreme Programming 與產品開發的專業講師。請協助我理解 User Story、Acceptance Criteria、3C 與 INVEST，並將內容製作成一份可以直接在瀏覽器開啟閱讀的完整 HTML 網頁。

【一、學習目標】
1. 解釋 User Story 與 Acceptance Criteria。
2. 說明 3C 與 INVEST 的用途。
3. 理解四個概念之間的關係。
4. 看懂一則完整的應用範例。
5. 分辨 User Story、Acceptance Criteria 與 Definition of Done。`,
    createdAt: 0
  },
  'slide-16': {
    id: 'builtin-slide-16',
    title: 'MVP 與 MMF 概念學習網頁生成 Prompt',
    description: '以同一產品案例深度釐清 Minimum Viable Product 與 Minimally Marketable Feature 核心差異',
    promptText: `你是一位熟悉 Lean Startup、敏捷產品開發與產品管理的專業講師。
請使用「同一個產品案例」解釋並比較：
1. MVP：Minimum Viable Product
2. MMF：Minimum／Minimally Marketable Feature

你的目標不是讓學習者背誦定義，而是幫助學習者看懂：
* MVP 與 MMF 分別要解決什麼問題。
* 兩者在目的、範圍、成熟度與衡量方式上的差異。
* 兩者如何出現在同一個產品的發展過程中。
* 如何判斷一個方案屬於 MVP、MMF，或同時具備兩者性質。`,
    createdAt: 0
  }
};

// 輕量級高質感教科書 Markdown 排版元件
const MarkdownTextbookChapter: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  const formatInline = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-800">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-mono border border-slate-200">$1</code>');
  };

  const flushList = (key: string) => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={key} className="space-y-1.5 my-3 pl-5 list-disc text-slate-700 text-xs sm:text-sm leading-relaxed">
          {currentList.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const flushBlockquote = (key: string) => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <div key={key} className="my-4 p-4 rounded-2xl bg-indigo-50/80 border-l-4 border-indigo-600 text-indigo-950 text-xs sm:text-sm italic leading-relaxed">
          {blockquoteLines.map((line, idx) => (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
          ))}
        </div>
      );
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (line.startsWith('>')) {
      flushList(`list-before-quote-${index}`);
      inBlockquote = true;
      blockquoteLines.push(line.replace(/^>\s?/, ''));
      return;
    } else if (inBlockquote) {
      flushBlockquote(`quote-${index}`);
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      currentList.push(line.substring(2));
      return;
    } else {
      flushList(`list-${index}`);
    }

    if (!line) {
      return;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h2 key={index} className="text-xl sm:text-2xl font-black text-slate-900 mt-6 mb-3 pb-2 border-b-2 border-slate-200">
          {line.substring(2)}
        </h2>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h3 key={index} className="text-base sm:text-lg font-black text-indigo-950 mt-5 mb-2">
          {line.substring(3)}
        </h3>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h4 key={index} className="text-sm sm:text-base font-bold text-slate-800 mt-4 mb-2">
          {line.substring(4)}
        </h4>
      );
    } else {
      elements.push(
        <p key={index} className="my-2 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      );
    }
  });

  flushList('final-list');
  flushBlockquote('final-quote');

  return <div className="space-y-1">{elements}</div>;
};

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
  const [masterTextbook, setMasterTextbook] = useState<MasterTextbookData | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(userSession?.teamId || 1);

  // 講師專書編撰狀態
  const [isCompilingBook, setIsCompilingBook] = useState(false);
  const [compileProgress, setCompileProgress] = useState<{ message: string; percent: number } | null>(null);

  const isInstructor = userSession?.role === 'instructor';
  const teamCount = classMetadata?.teamCount || 6;
  const classId = classMetadata?.id || userSession?.classId || 'default-split';
  const generation = classMetadata?.currentGeneration || 1;

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    Promise.all([
      fetchAllLectureNotes(classId, generation),
      fetchAllTeamNotes(classId, generation, selectedTeamId),
      fetchMasterTextbook(classId, generation)
    ])
      .then(([lectures, teamNotes, textbook]) => {
        setLectureNotesMap(lectures);
        setTeamNotesMap(teamNotes);
        setMasterTextbook(textbook);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, selectedTeamId, classId, generation]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateTextbook = async () => {
    if (!window.confirm("即將為全班編撰「全日教材專書」，將依照各章節脈絡滾動合成出版級課本，並快取給全體學員。是否開始？")) return;
    setIsCompilingBook(true);
    setCompileProgress({ message: '正在初始化全日專書編撰管線...', percent: 5 });

    try {
      const generated = await generateGlobalTextbook(
        classId,
        generation,
        slides,
        (msg, pct) => {
          setCompileProgress({ message: msg, percent: pct });
        }
      );
      setMasterTextbook(generated);
      alert("🎉 全日教材專書編撰發布成功！全班學員已可隨時印出最新手冊。");
    } catch (err: any) {
      alert("專書生成失敗：" + (err?.message || "請檢查網路連線或金鑰"));
    } finally {
      setIsCompilingBook(false);
      setCompileProgress(null);
    }
  };

  const getImageUrl = (imageName: string) => {
    if (!imageName) return "";
    const baseUrl = import.meta.env.BASE_URL || "/";
    return `${baseUrl}assets/${imageName}`;
  };

  // 彙整全課堂所有提示詞 (附錄一)
  const allToolboxPrompts: SlidePromptItem[] = [];
  slides.forEach((s) => {
    if (builtinPrompts[s.id]) {
      allToolboxPrompts.push(builtinPrompts[s.id]);
    }
    const cloudPrompts = lectureNotesMap[s.id]?.prompts || [];
    cloudPrompts.forEach((p) => {
      allToolboxPrompts.push(p);
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      {/* 預覽視窗容器 */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* 頂部操作列（列印時完全隱藏） */}
        <div className="p-4 sm:px-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </span>
            <div>
              <h2 className="text-base font-bold leading-tight">全日教材專書與成果手冊</h2>
              <p className="text-xs text-slate-400">
                {masterTextbook
                  ? `已載入出版級專書 (${masterTextbook.chapters.length} 個章節長文 + 投影片插圖 + 第 ${selectedTeamId} 組實戰成果)`
                  : '目前展示投影片插圖與小組實戰成果'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
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

            {/* 講師專屬：生成/重鑄專書按鈕 */}
            {isInstructor && (
              <button
                type="button"
                disabled={isCompilingBook}
                onClick={handleGenerateTextbook}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                title="按章節滾動串接生成出版級教材專書"
              >
                <span>{masterTextbook ? "🔄 重鑄專書" : "📖 生成全日專書"}</span>
              </button>
            )}

            {/* 列印按鈕 */}
            <button
              onClick={handlePrint}
              disabled={loading || isCompilingBook}
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

        {/* 專書編撰進度條 (生成中時顯示) */}
        {isCompilingBook && compileProgress && (
          <div className="bg-indigo-950 text-white p-4 border-b border-indigo-800/80 animate-in fade-in shrink-0">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="flex items-center gap-2 text-indigo-300">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                <span>{compileProgress.message}</span>
              </span>
              <span className="font-mono text-indigo-200">{compileProgress.percent}%</span>
            </div>
            <div className="w-full h-2 bg-indigo-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-300"
                style={{ width: `${compileProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* 內容預覽滾動區 (列印時展開為 A4 紙張) */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-50 print:bg-white print:p-0 print:overflow-visible font-sans">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <span className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-bold">小編正在為您彙整全日專書與個人成果手冊...</span>
            </div>
          ) : (
            <div className="space-y-12 max-w-3xl mx-auto print:max-w-none">
              
              {/* ==================================================== */}
              {/* 1. 封面區 (個人化：學員姓名、所屬組別、班級期別) */}
              {/* ==================================================== */}
              <div className="p-10 sm:p-14 bg-white rounded-3xl border border-slate-200 shadow-sm text-center print:border-none print:shadow-none print:break-after-page print:min-h-screen print:flex print:flex-col print:justify-between">
                <div>
                  <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black tracking-wider uppercase mb-6">
                    SPLIT · 實戰工作坊出版級專書手冊
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4 leading-tight">
                    需求拆解實戰
                  </h1>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-600 mb-8">
                    全日教材專書與小組演練成果報告
                  </h2>
                </div>

                <div className="max-w-md mx-auto my-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-400 font-bold">結訓學員：</span>
                    <span className="font-black text-slate-900 text-sm">{userSession?.name || "課堂學員"}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-400 font-bold">小組身分：</span>
                    <span className="font-bold text-teal-800">第 {selectedTeamId} 組成員</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                    <span className="text-slate-400 font-bold">班級代碼：</span>
                    <span className="font-mono font-bold text-slate-800">{classId} · Gen {generation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">出刊日期：</span>
                    <span className="font-mono text-slate-600">{new Date().toLocaleDateString('zh-TW')}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 border-t border-slate-100 pt-6">
                  <span>收錄全日專書深度長文 · 投影片插圖 · 實戰提示詞工具箱 · 第 {selectedTeamId} 組實戰演練專題</span>
                </div>
              </div>

              {/* ==================================================== */}
              {/* 2. 課程目錄索引 (Table of Contents) */}
              {/* ==================================================== */}
              <div className="p-8 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:break-after-page">
                <div className="border-b border-slate-200 pb-4 mb-6">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>📑</span>
                    <span>全書目錄索引 (Table of Contents)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    涵蓋 6 大核心章節、投影片高清插圖與實戰工具箱附錄
                  </p>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  {masterTextbook?.chapters ? (
                    masterTextbook.chapters.map((ch, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <span className="font-mono text-indigo-600 w-6">0{idx + 1}.</span>
                          <span>{ch.moduleTitle}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">{ch.title}</span>
                      </div>
                    ))
                  ) : (
                    slides.slice(0, 8).map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70">
                        <span className="font-bold text-slate-800">{s.title}</span>
                        <span className="text-[11px] font-mono text-slate-400">P.{s.page}</span>
                      </div>
                    ))
                  )}

                  <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 mt-4">
                    <span className="font-black text-indigo-900">附錄 A：AI 敏捷提示詞工具箱 (Prompts Toolbox)</span>
                    <span className="text-[11px] font-bold text-indigo-600">{allToolboxPrompts.length} 則範本</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-teal-100 bg-teal-50/50">
                    <span className="font-black text-teal-900">附錄 B：第 {selectedTeamId} 組實戰演練專案成果 (Team Task Report)</span>
                    <span className="text-[11px] font-bold text-teal-600">專屬實作成果</span>
                  </div>
                </div>
              </div>

              {/* ==================================================== */}
              {/* 3. 教材專書全文 (按章節模組展示，投影片作為插圖) */}
              {/* ==================================================== */}
              {masterTextbook?.chapters && masterTextbook.chapters.length > 0 ? (
                masterTextbook.chapters.map((chapter, cIdx) => {
                  const modSlides = slides.filter((s) => s.moduleId === chapter.moduleId);

                  return (
                    <div
                      key={cIdx}
                      className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-8 print:border-none print:shadow-none print:p-0 print:break-before-page"
                    >
                      {/* 章節標題 Banner */}
                      <div className="border-b-2 border-slate-900 pb-4">
                        <span className="text-xs font-mono font-black text-indigo-600 uppercase tracking-wider block mb-1">
                          CHAPTER 0{cIdx + 1}
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                          {chapter.moduleTitle}
                        </h2>
                      </div>

                      {/* 專書 Markdown 長文 (無便利貼，純粹高質感專書排版) */}
                      <div className="prose prose-slate max-w-none text-justify">
                        <MarkdownTextbookChapter content={chapter.content} />
                      </div>

                      {/* 投影片高清插圖區 (Figures) */}
                      {modSlides.length > 0 && (
                        <div className="pt-8 border-t border-slate-200 print:break-inside-avoid">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                            <span>🖼️ 本章投影片插圖對照 (Figures)</span>
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {modSlides.map((ms, sIdx) => {
                              const sUrl = getImageUrl(ms.image);
                              return (
                                <div
                                  key={ms.id}
                                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 print:border-slate-300 print:p-2"
                                >
                                  {sUrl && (
                                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                                      <img
                                        src={sUrl}
                                        alt={ms.title}
                                        className="w-full object-contain max-h-[220px]"
                                      />
                                    </div>
                                  )}
                                  <div className="text-center">
                                    <span className="text-[11px] font-bold text-slate-700">
                                      圖 {cIdx + 1}-{sIdx + 1}：{ms.title}
                                    </span>
                                    {ms.subtitle && (
                                      <span className="text-[10px] text-slate-400 block font-normal">
                                        {ms.subtitle}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                /* 尚未生成專書時的友好導引與投影片插圖展示 */
                <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 print:border-none print:shadow-none">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                    📖
                  </div>
                  <h3 className="text-lg font-black text-slate-900">尚未生成全日教材專書</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    {isInstructor
                      ? "講師可在上方點擊「📖 生成全日專書」，系統將依課堂所有單元講述清稿滾動串接，生成出版級深度專書並發布給全班學員。"
                      : "講師尚未正式發布全日教材專書，待課堂結束前講師發布後即可在此檢視出版級專書長文。"}
                  </p>
                </div>
              )}

              {/* ==================================================== */}
              {/* 4. 附錄一：實戰提示詞工具箱 (Prompts Toolbox) */}
              {/* ==================================================== */}
              <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-before-page">
                <div className="border-b-2 border-indigo-900 pb-3">
                  <span className="text-xs font-mono font-black text-indigo-600 uppercase tracking-wider block mb-1">
                    APPENDIX A
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    AI 敏捷實戰提示詞工具箱 (Prompts Toolbox)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    收錄工作坊中涵蓋之核心 AI 提示詞範本，供學員課後直接應用於日常產品開發
                  </p>
                </div>

                <div className="space-y-4">
                  {allToolboxPrompts.map((p, pIdx) => (
                    <div
                      key={p.id || pIdx}
                      className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 print:border-slate-300 print:break-inside-avoid"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-black text-sm text-slate-900 flex items-center gap-2">
                          <span className="text-indigo-600">💡</span>
                          <span>{p.title}</span>
                        </h4>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          PROMPT #{pIdx + 1}
                        </span>
                      </div>
                      {p.description && (
                        <p className="text-xs text-slate-500 font-medium">
                          {p.description}
                        </p>
                      )}
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {p.promptText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ==================================================== */}
              {/* 5. 附錄二：小組實戰演練專題報告 (Team Task Deliverables) */}
              {/* ==================================================== */}
              <div className="p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0 print:break-before-page">
                <div className="border-b-2 border-teal-800 pb-3">
                  <span className="text-xs font-mono font-black text-teal-600 uppercase tracking-wider block mb-1">
                    APPENDIX B
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    第 {selectedTeamId} 組實戰演練專案成果 (Team Deliverables)
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    學員專屬演練成果紀錄，收錄小組討論筆記與成果附件截圖
                  </p>
                </div>

                <div className="space-y-6">
                  {slides
                    .filter((s) => s.slideKind === 'task' || s.teamTask)
                    .map((ts, tIdx) => {
                      const note = teamNotesMap[ts.id];
                      const hasNote = Boolean(note?.memo?.trim());
                      const atts = note?.attachments || [];

                      return (
                        <div
                          key={ts.id}
                          className="p-5 rounded-2xl bg-teal-50/40 border border-teal-200 space-y-3 print:border-slate-300 print:break-inside-avoid"
                        >
                          <div className="flex items-center justify-between border-b border-teal-200/80 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-teal-700 text-white rounded text-[10px] font-black">
                                演練任務 {tIdx + 1}
                              </span>
                              <h4 className="font-black text-sm text-teal-950">
                                {ts.title}
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono text-teal-700 font-bold">
                              P.{ts.page}
                            </span>
                          </div>

                          {ts.teamTask?.objective && (
                            <p className="text-xs text-teal-800 font-medium">
                              🎯 任務目標：{ts.teamTask.objective}
                            </p>
                          )}

                          <div className="bg-white p-4 rounded-xl border border-teal-200/80 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                            {hasNote ? note.memo : '（此演練任務未填寫成果筆記）'}
                          </div>

                          {atts.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[11px] font-bold text-teal-900 block mb-2">
                                📎 實作產出附件與截圖 ({atts.length})：
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {atts.map((att) => (
                                  <div key={att.id} className="p-2 bg-white rounded-xl border border-teal-100 space-y-1">
                                    {att.dataUrl && att.mime?.startsWith('image/') ? (
                                      <img
                                        src={att.dataUrl}
                                        alt={att.name}
                                        className="w-full object-contain max-h-[160px] rounded-lg"
                                      />
                                    ) : null}
                                    <div className="text-[10px] font-bold text-slate-700 truncate">
                                      {att.name}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* ==================================================== */}
              {/* 6. 封底 (Colophon) */}
              {/* ==================================================== */}
              <div className="p-10 bg-slate-900 text-white rounded-3xl text-center space-y-3 print:border-none print:shadow-none print:break-before-page print:min-h-screen print:flex print:flex-col print:justify-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-base mx-auto">
                  SP
                </div>
                <h3 className="text-base font-black tracking-wide">
                  SPLIT 需求拆解的技術 · 實戰工作坊
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  本手冊專供課堂學員研習與內部敏捷實踐使用。版權所有，尊重智慧財產。
                </p>
                <div className="pt-4 text-[10px] font-mono text-slate-500">
                  © 2026 SPLIT Agile Workshop. All rights reserved.
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
