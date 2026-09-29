import React from "react";
import type { UserSession, ClassMetadata } from "../services/notesService";

interface TopBarProps {
  progress: { completed: number; total: number; percentage: number };
  userSession: UserSession | null;
  activeTeamId: number;
  onSwitchTeam: (teamId: number) => void;
  classMetadata: ClassMetadata | null;
  cloudSyncStatus: 'online' | 'syncing' | 'offline' | 'readonly';
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenCheckIn?: () => void;
  isInstructor?: boolean;
  onInsertTask?: () => void;
  onOpenPrintHandbook?: () => void;
  activeSlideId?: string;
  instructorLiveSlide?: {
    slideId: string;
    pageNumber: number;
    slideTitle: string;
    updatedAt: number;
  } | null;
  onJumpToInstructorSlide?: (slideId: string) => void;
  geminiKeyConfigured?: boolean;
  onOpenAiConfig?: () => void;
  onOpenStudentQr?: () => void;
  // 保留相容性可選參數
  viewMode?: "focus" | "overview";
  setViewMode?: (mode: "focus" | "overview") => void;
  saveStatus?: "saved" | "saving" | "error";
  lastSaved?: string;
  onExportMarkdown?: () => void;
  onExportJSON?: () => void;
  onImportJSON?: (file: File) => void;
  onReset?: () => void;
  onToggleQuestions?: () => void;
  questionsCount?: number;
  unansweredQuestionsCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  progress,
  userSession,
  activeTeamId,
  onSwitchTeam,
  classMetadata,
  cloudSyncStatus,
  sidebarCollapsed,
  onToggleSidebar,
  onOpenCheckIn,
  isInstructor = false,
  onInsertTask,
  onOpenPrintHandbook,
  activeSlideId,
  instructorLiveSlide,
  onJumpToInstructorSlide,
  geminiKeyConfigured = false,
  onOpenAiConfig,
  onOpenStudentQr
}) => {
  const totalTeams = classMetadata?.teamCount || 6;
  const isMyTeam = userSession ? activeTeamId === userSession.teamId : true;
  const isClassReadOnly = classMetadata?.status === 'inactive';

  const handleOpenWhiteboard = () => {
    const baseUrl = import.meta.env.BASE_URL || "/";
    const classId = classMetadata?.id || userSession?.classId || "default-split";
    const teamParam = `team-${activeTeamId || 1}`;
    const role = isInstructor ? 'instructor' : (userSession?.role || 'student');
    const userName = userSession?.name || (isInstructor ? '講師' : '學員');
    const targetUrl = `${baseUrl}board.html?c=${encodeURIComponent(classId)}&team=${teamParam}&type=main&role=${encodeURIComponent(role)}&user=${encodeURIComponent(userName)}`;
    window.open(targetUrl, "_blank");
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white h-16 px-4 sm:px-6 flex items-center justify-between shadow-lg z-30 relative shrink-0">

      {/* Left Area: Title, Sidebar toggle, and Class tag */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all focus:outline-none flex items-center justify-center shrink-0"
          title={sidebarCollapsed ? "展開單元進度" : "收合單元進度"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-sm select-none">
          SP
        </div>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-bold leading-tight tracking-wide m-0 text-white">
              SPLIT 需求拆解實戰
            </h1>
            {classMetadata && (
              <span className="text-[10px] bg-slate-800 border border-slate-700 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold">
                {classMetadata.id} · Gen {classMetadata.currentGeneration}
              </span>
            )}
            {isClassReadOnly && (
              <span className="text-[10px] bg-rose-500/20 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded-full font-bold animate-pulse">
                已停用唯讀
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 font-medium hidden sm:flex items-center gap-2">
            <span>進度: {progress.percentage}% ({progress.completed}/{progress.total}頁)</span>
          </div>
        </div>
      </div>

      {/* Middle Area: Team Switcher, Global Whiteboard & Observation Mode Indicator */}
      <div className="flex items-center gap-2.5">
        {/* 組別下拉選單 */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400">當前視角:</span>
          <select
            value={activeTeamId}
            onChange={(e) => onSwitchTeam(Number(e.target.value))}
            className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer"
          >
            {Array.from({ length: totalTeams }, (_, i) => i + 1).map((tNum) => {
              const isSelf = !isInstructor && userSession && userSession.teamId === tNum;
              return (
                <option key={tNum} value={tNum} className="bg-slate-900 text-white">
                  第 {tNum} 組 {isInstructor ? "" : isSelf ? "(我的組)" : "(觀摩)"}
                </option>
              );
            })}
          </select>
        </div>

        {/* 全域小組協作白板按鈕 (全組共用唯一白板) */}
        <button
          onClick={handleOpenWhiteboard}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
          title={`點擊在新分頁開啟【第 ${activeTeamId} 組】共用協作白板`}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <span>📋 小組白板</span>
        </button>

        {/* 觀摩模式快捷切回我組按鈕 (僅學員在觀摩模式時出現，講師不出現) */}
        {!isInstructor && !isMyTeam && userSession && (
          <button
            onClick={() => onSwitchTeam(userSession.teamId)}
            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1 shadow-md shadow-amber-500/20 cursor-pointer"
            title="點擊立即切回您所屬組別以進行編輯"
          >
            <span>切回我組 (第 {userSession.teamId} 組)</span>
          </button>
        )}

        {/* 雲端同步狀態燈 (嚴格比對伺服器 ACK) */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold">
          {cloudSyncStatus === 'online' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400">雲端同步</span>
            </>
          )}
          {cloudSyncStatus === 'syncing' && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
              <span className="text-amber-400">同步中...</span>
            </>
          )}
          {cloudSyncStatus === 'offline' && (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-slate-400">離線暫存</span>
            </>
          )}
          {cloudSyncStatus === 'readonly' && (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-rose-400">唯讀模式</span>
            </>
          )}
        </div>
      </div>

      {/* Right Area: Actions */}
      <div className="flex items-center gap-2">
        {userSession && (
          <div
            onClick={onOpenCheckIn}
            className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs cursor-pointer hover:opacity-80"
            title="點擊切換使用者或班級"
          >
            <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
              {userSession.name.charAt(0)}
            </span>
            <span className="text-slate-300 font-medium truncate max-w-[80px]" title={userSession.name}>
              {userSession.name}
            </span>
          </div>
        )}

        {/* 學員專屬：跟隨老師投影狀態與一鍵跳回按鈕 */}
        {!isInstructor && instructorLiveSlide && (
          instructorLiveSlide.slideId !== activeSlideId ? (
            <button
              onClick={() => onJumpToInstructorSlide?.(instructorLiveSlide.slideId)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 animate-pulse cursor-pointer shrink-0"
              title={`老師正在投影：第 ${instructorLiveSlide.pageNumber} 頁 · ${instructorLiveSlide.slideTitle}，點此跳回`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
              <span>🎯 回到老師投影 (P.{String(instructorLiveSlide.pageNumber).padStart(2, '0')})</span>
            </button>
          ) : (
            <div
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold shrink-0"
              title="您當前畫面與老師投影完全同步"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>與老師同步中</span>
            </div>
          )
        )}

        {/* 講師專屬：隨堂小編連線狀態燈號與設定 (學員不顯示) */}
        {isInstructor && onOpenAiConfig && (
          <button
            onClick={onOpenAiConfig}
            className={`inline-flex px-3 py-1.5 rounded-xl border text-xs font-bold items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              geminiKeyConfigured
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50 animate-pulse'
            }`}
            title={geminiKeyConfigured ? "隨堂小編已就緒 (點擊查看或更換金鑰)" : "尚未配置金鑰 (點擊設定小編金鑰)"}
          >
            <span className={`w-2 h-2 rounded-full ${geminiKeyConfigured ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
            <span>{geminiKeyConfigured ? '⚙️ 小編設定 (已就緒)' : '⚙️ 小編設定 (未連線)'}</span>
          </button>
        )}

        {/* 全日手冊列印 (學員與講師皆可用) */}
        {onOpenPrintHandbook && (
          <button
            onClick={onOpenPrintHandbook}
            className="inline-flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-all items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0"
            title="印出或匯出全天隨堂講義手冊與重點便利貼"
          >
            <span>🖨️ 列印筆記</span>
          </button>
        )}

        {/* 講師專屬：大螢幕學員報到 QR Code 投影 (防直通漏洞，純學員報到) */}
        {isInstructor && onOpenStudentQr && (
          <button
            onClick={onOpenStudentQr}
            className="inline-flex px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer shrink-0"
            title="開啟大螢幕學員報到 QR Code (純學員入口，絕不洩漏免密權限)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>📱 學生報到 QR</span>
          </button>
        )}

        {/* 講師專屬：新增小組演練任務按鈕 */}
        {isInstructor && onInsertTask && (
          <button
            onClick={onInsertTask}
            className="hidden sm:inline-flex px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 text-xs font-bold text-purple-200 hover:text-white transition-all items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            title="在當前頁面後方插入新團隊演練 (Team Task)"
          >
            <span>🎯 +演練</span>
          </button>
        )}

        {/* 講師專屬：班級管理後台 (學員絕不顯示) */}
        {isInstructor && (
          <a
            href="../admin.html?course=split"
            target="_blank"
            className="hidden sm:flex px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-400 hover:text-amber-300 transition-all items-center gap-1"
            title="開啟 SPLIT 班級管理後台"
          >
            <span>管理後台</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </header>
  );
};
