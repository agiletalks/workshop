import { useRef } from "react";
import type { SaveStatus } from "../hooks/useWorkbook";

interface TopBarProps {
  viewMode: "focus" | "overview";
  setViewMode: (mode: "focus" | "overview") => void;
  progress: { completed: number; total: number; percentage: number };
  saveStatus: SaveStatus;
  lastSaved: string;
  onExportMarkdown: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onReset: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;

  // Collaborative additions
  nickname: string;
  teamId: string;
  onLogout: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  viewMode,
  setViewMode,
  progress,
  saveStatus,
  lastSaved,
  onExportMarkdown,
  onExportJSON,
  onImportJSON,
  onReset,
  sidebarCollapsed,
  onToggleSidebar,
  nickname,
  teamId,
  onLogout
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <header className="bg-gradient-to-r from-fubon-blue-dark to-fubon-blue text-white h-16 px-6 flex items-center justify-between shadow-md z-30 relative shrink-0">
      {/* Left Area: Title, Subtitle & Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all focus:outline-none flex items-center justify-center shrink-0"
          title={sidebarCollapsed ? "展開單元進度" : "收合單元進度"}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {sidebarCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" />
            )}
          </svg>
        </button>

        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-fubon-blue font-black text-sm shadow-sm select-none shrink-0">
          SP
        </div>
        <div className="min-w-0">
          <h1 className="text-sm md:text-base font-bold leading-tight tracking-wide flex items-center gap-2 m-0 text-white truncate">
            SPLIT 需求分解
            <span className="text-[9px] bg-fubon-green px-1.5 py-0.5 rounded-full font-semibold select-none tracking-normal text-slate-900 shrink-0">
              分組協作版
            </span>
          </h1>
          <p className="text-[9px] text-fubon-blue-light font-medium tracking-wide m-0 truncate md:block hidden">
            敏捷需求拆解、INVEST 與增量計劃實戰
          </p>
        </div>
      </div>

      {/* Middle Area: Collaborative Status */}
      <div className="flex items-center gap-3 bg-black/10 px-3 py-1.5 rounded-xl border border-white/5 shadow-inner shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-bold text-fubon-green">
          <span className="w-2 h-2 rounded-full bg-fubon-green" />
          <span>{teamId === "Team 1" ? "第一組" : teamId === "Team 2" ? "第二組" : teamId === "Team 3" ? "第三組" : teamId === "Team 4" ? "第四組" : "第五組"}</span>
          <span className="text-white/60 font-normal">({nickname})</span>
        </div>
        <div className="h-4 w-px bg-white/10" />
        <div className="text-[10px] text-white/80 font-bold hidden sm:block">
          進度: {progress.percentage}%
        </div>
      </div>

      {/* Right Area: Mode Switches & Exports */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Autosave Status */}
        <div className="text-right shrink-0 pr-2 border-r border-white/15 hidden lg:block">
          <div className="flex items-center justify-end gap-1.5 text-[10px] font-semibold">
            {saveStatus === "saved" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-fubon-green" />
                <span className="text-fubon-green">雲端已同步</span>
              </>
            )}
            {saveStatus === "saving" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-fubon-orange animate-bounce" />
                <span className="text-fubon-orange">儲存中...</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span className="text-red-400">連線失敗</span>
              </>
            )}
          </div>
          <p className="text-[8px] text-white/50 m-0">
            更新於: {formatTime(lastSaved)}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="bg-black/15 p-0.5 rounded-xl items-center border border-white/5 shadow-inner md:flex hidden">
          <button
            onClick={() => setViewMode("focus")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              viewMode === "focus" ? "bg-white text-fubon-blue shadow-sm" : "text-white/80 hover:text-white"
            }`}
          >
            單頁
          </button>
          <button
            onClick={() => setViewMode("overview")}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
              viewMode === "overview" ? "bg-white text-fubon-blue shadow-sm" : "text-white/80 hover:text-white"
            }`}
          >
            全覽
          </button>
        </div>

        {/* Tools Menu Button Group */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Export MD */}
          <button
            onClick={onExportMarkdown}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white"
            title="匯出隨堂筆記 (Markdown)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>

          {/* Backup JSON */}
          <button
            onClick={onExportJSON}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white"
            title="下載 JSON 完整備份"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
          </button>

          {/* Restore JSON */}
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <button
            onClick={handleImportClick}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/90 hover:text-white"
            title="還原 JSON 備份檔"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="p-1.5 hover:bg-red-500/20 hover:text-red-200 rounded-lg transition-colors text-white/80"
            title="重設本機與雲端快取"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <div className="h-4 w-px bg-white/15 mx-1" />

          {/* Logout */}
          <button
            onClick={onLogout}
            className="p-1.5 hover:bg-red-500/20 text-white/80 hover:text-red-200 rounded-lg transition-colors"
            title="登出 / 切換小組"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
