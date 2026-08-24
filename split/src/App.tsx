import { useState, useEffect, useRef } from "react";
import { appConfig } from "./data/app-config";
import { slides } from "./data/slides";
import { useWorkbook } from "./hooks/useWorkbook";
import { PasswordGate } from "./components/PasswordGate";
import { TopBar } from "./components/TopBar";
import { ModuleSidebar } from "./components/ModuleSidebar";
import { SlideViewer } from "./components/SlideViewer";
import { SlideLightbox } from "./components/SlideLightbox";
import { WorkbookPanel } from "./components/WorkbookPanel";
import { OverviewGrid } from "./components/OverviewGrid";
import { modules } from "./data/modules";

function App() {
  // Passcode Gate state
  const [authorized, setAuthorized] = useState(() => {
    if (!appConfig.passwordEnabled || appConfig.devBypassPassword) {
      return true;
    }
    return sessionStorage.getItem("split_courseware_authorized") === "true";
  });

  // State management from custom hook
  const {
    workbook,
    saveStatus,
    lastSaved,
    getResponse,
    updateNote,
    updateInteractionData,
    toggleCompleted,
    setActiveSlideId,
    setViewMode,
    resetWorkbook,
    importWorkbook,
    getProgress
  } = useWorkbook();

  // Lightbox overlay state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState("");

  // Sidebar collapsible state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Slide navigation
  const activeSlideIndex = slides.findIndex(s => s.id === workbook.activeSlideId);
  const activeSlide = slides[activeSlideIndex] || slides[0];

  // Store latest state in refs so the window event listener can read it without triggering re-registration
  const activeSlideIdRef = useRef(workbook.activeSlideId);
  const viewModeRef = useRef(workbook.viewMode);

  useEffect(() => {
    activeSlideIdRef.current = workbook.activeSlideId;
    viewModeRef.current = workbook.viewMode;
  }, [workbook.activeSlideId, workbook.viewMode]);

  // Sync state to hash route
  useEffect(() => {
    if (workbook.viewMode === "overview") {
      if (window.location.hash !== "#/overview") {
        window.location.hash = "#/overview";
      }
    } else if (activeSlide) {
      const targetHash = `#/module/${activeSlide.moduleId}/slide/${activeSlide.page}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }, [workbook.activeSlideId, workbook.viewMode, activeSlide]);

  // Handle browser back/forward buttons or direct hash edits
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const match = hash.match(/\/module\/([E|S|P|L|I|T])\/slide\/(\d+)/);
      if (match) {
        const pageNum = parseInt(match[2], 10);
        const matchedSlide = slides.find(s => s.page === pageNum);
        if (matchedSlide && matchedSlide.id !== activeSlideIdRef.current) {
          setActiveSlideId(matchedSlide.id);
          if (viewModeRef.current !== "focus") {
            setViewMode("focus");
          }
        }
      } else if (hash === "#/overview" && viewModeRef.current !== "overview") {
        setViewMode("overview");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    // Trigger initially to handle deep links
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [setActiveSlideId, setViewMode]);

  const handleNext = () => {
    if (activeSlideIndex < slides.length - 1) {
      const nextSlide = slides[activeSlideIndex + 1];
      setActiveSlideId(nextSlide.id);
      setViewMode("focus");
    }
  };

  const handlePrev = () => {
    if (activeSlideIndex > 0) {
      const prevSlide = slides[activeSlideIndex - 1];
      setActiveSlideId(prevSlide.id);
      setViewMode("focus");
    }
  };

  const handleSelectSlide = (slideId: string) => {
    setActiveSlideId(slideId);
    setViewMode("focus");
  };

  const handleImageClick = (url: string) => {
    setLightboxUrl(url);
    setLightboxOpen(true);
  };

  // Export Markdown Notes file
  const handleExportMarkdown = () => {
    const now = new Date();
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") + "_" +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0");

    let mdContent = `# SPLIT 需求分解的技術 ｜ 學習實作與隨堂筆記\n\n`;
    mdContent += `> 課程識別: ${appConfig.courseId} (v${appConfig.courseVersion})\n`;
    mdContent += `> 筆記匯出時間: ${now.toLocaleString("zh-TW")}\n\n`;

    mdContent += `## 📊 學習總體進度報告\n`;
    const progress = getProgress();
    mdContent += `* **完成進度**: ${progress.percentage}%\n`;
    mdContent += `* **已完成頁數**: ${progress.completed} / ${progress.total} 頁\n\n---\n\n`;

    // Group notes by modules
    modules.forEach((mod) => {
      const modSlides = slides.filter(s => s.moduleId === mod.id);
      let moduleHasNotes = false;

      // Check if module contains any note/interaction responses
      const modMdSections = modSlides.map((slide) => {
        const res = getResponse(slide.id);
        const hasNote = res.personalNote.trim().length > 0;
        const hasInteraction = res.interactionData != null;

        if (!hasNote && !hasInteraction) return "";

        moduleHasNotes = true;
        let slideMd = `### Page ${slide.page.toString().padStart(2, "0")} ｜ ${slide.title}\n`;
        if (slide.toolName) {
          slideMd += `* **使用工具**: ${slide.toolName}\n`;
        }
        slideMd += `* **完成狀態**: ${res.completed ? "✅ 已完成" : "⏳ 學習中"}\n\n`;

        if (hasNote) {
          slideMd += `#### 📝 個人隨堂筆記\n\`\`\`text\n${res.personalNote}\n\`\`\`\n\n`;
        }

        if (hasInteraction && slide.interactionType === "table-fill" && slide.interactionConfig) {
          slideMd += `#### 📅 實作表格填寫 (${slide.toolName})\n\n`;
          const config = slide.interactionConfig;
          const data = res.interactionData;
          // Build md table headers
          slideMd += `| ` + config.headers.join(" | ") + ` |\n`;
          slideMd += `| ` + config.headers.map(() => "---").join(" | ") + ` |\n`;
          // Rows
          config.rows.forEach((row: string[], rowIndex: number) => {
            const cells = row.map((cellText, colIndex) => {
              if (colIndex === 0) return cellText;
              return data[`${rowIndex}-${colIndex}`] || "";
            });
            slideMd += `| ` + cells.join(" | ") + ` |\n`;
          });
          slideMd += `\n`;
        }

        if (hasInteraction && slide.interactionType === "sticky-board" && slide.interactionConfig) {
          slideMd += `#### 📌 便利貼實作看板\n\n`;
          const stickyNotes = res.interactionData as any[];
          if (Array.isArray(stickyNotes) && stickyNotes.length > 0) {
            stickyNotes.forEach((n) => {
              slideMd += `* [${n.color.toUpperCase()}] (${Math.round(n.x)}, ${Math.round(n.y)}): ${n.text}\n`;
            });
          } else {
            slideMd += `* (無新增便利貼項目)\n`;
          }
          slideMd += `\n`;
        }

        return slideMd;
      }).filter(Boolean);

      if (moduleHasNotes) {
        mdContent += `## ${mod.title}\n\n`;
        mdContent += modMdSections.join("---\n\n");
        mdContent += `\n\n`;
      }
    });

    // Create file trigger download
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `SPLIT_互動講義筆記_${timestamp}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Backup file
  const handleExportJSON = () => {
    const now = new Date();
    const timestamp = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") + "_" +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0");

    const dataStr = JSON.stringify(workbook, null, 2);
    const blob = new Blob([dataStr], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `SPLIT_講義備份_${timestamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON Backup file
  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        // Verify key structure matches courseId
        if (parsed && parsed.courseId === appConfig.courseId) {
          const confirmOverwrite = window.confirm(
            "偵測到相符的講義備份檔。這將覆蓋您本機目前的筆記與實作資料，確認是否還原？"
          );
          if (confirmOverwrite) {
            importWorkbook(parsed);
            alert("還原成功！已讀取您的歷史筆記與進度。");
          }
        } else {
          alert("❌ 錯誤：不相容的 JSON 檔案格式，其儲存庫 ID 與本課程不匹配。");
        }
      } catch (err) {
        alert("❌ 錯誤：JSON 備份檔解析失敗，請確認檔案是否損毀。");
      }
    };
    reader.readAsText(file);
  };

  // Reset all workbook data
  const handleReset = () => {
    const confirmReset = window.confirm(
      "⚠️ 警告：這將永久刪除您保存在本機瀏覽器中的所有筆記與便利貼實作資料。建議您在此之前先下載備份，確認是否清除？"
    );
    if (confirmReset) {
      resetWorkbook();
      alert("已重置所有隨堂筆記！");
    }
  };

  // If passcode enabled and not authorized, render PasswordGate screen
  if (!authorized) {
    return <PasswordGate onAuthorized={() => setAuthorized(true)} />;
  }

  const topBar = (
    <TopBar
      viewMode={workbook.viewMode}
      setViewMode={setViewMode}
      progress={getProgress()}
      saveStatus={saveStatus}
      lastSaved={lastSaved}
      onExportMarkdown={handleExportMarkdown}
      onExportJSON={handleExportJSON}
      onImportJSON={handleImportJSON}
      onReset={handleReset}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
    />
  );

  const sidebar = (
    <ModuleSidebar
      activeSlideId={workbook.activeSlideId}
      onSelectSlide={handleSelectSlide}
      getResponse={getResponse}
      viewMode={workbook.viewMode}
      collapsed={sidebarCollapsed}
    />
  );

  const workbookPanel = (
    <WorkbookPanel
      slide={activeSlide}
      getResponse={getResponse}
      updateNote={updateNote}
      updateInteractionData={updateInteractionData}
      toggleCompleted={toggleCompleted}
      onImageClick={handleImageClick}
    />
  );

  const slideViewer = (
    <SlideViewer
      slide={activeSlide}
      onNext={handleNext}
      onPrev={handlePrev}
      onImageClick={handleImageClick}
    />
  );

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-50">
      {workbook.viewMode === "focus" ? (
        <div className="flex-1 flex overflow-hidden">
          {/* 3-Column main App Shell */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {topBar}
            <div className="flex-1 flex overflow-hidden">
              {sidebar}
              {/* Responsive Layout: Vertical split on mobile, Horizontal split on desktop */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
                {/* SlideViewer: Fixed/Percentage height on mobile, full height on desktop */}
                <div className="w-full h-[38vh] min-h-[220px] max-h-[300px] md:h-full md:max-h-none md:w-[40%] lg:w-[35%] xl:w-[30%] shrink-0 overflow-hidden flex flex-col bg-slate-100 relative">
                  {slideViewer}
                </div>
                {/* WorkbookPanel: Takes remaining space, scrolls internally */}
                <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 bg-white h-full overflow-hidden flex flex-col">
                  {workbookPanel}
                </div>
              </div>
            </div>
            {/* Mobile note/slide bottom navbar fallback */}
            <div className="md:hidden flex h-14 bg-white border-t border-slate-200 items-center justify-around z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] shrink-0">
              <button
                onClick={() => setViewMode("focus")}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-fubon-blue font-bold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
                </svg>
                <span className="text-[10px]">課程講義</span>
              </button>
              <button
                onClick={() => setViewMode("overview")}
                className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-slate-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-[10px]">全覽地圖</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Overview Mode layout */
        <div className="flex-1 flex flex-col overflow-hidden">
          {topBar}
          <div className="flex-1 flex overflow-hidden">
            {sidebar}
            <OverviewGrid onSelectSlide={handleSelectSlide} getResponse={getResponse} />
          </div>
        </div>
      )}

      {/* Lightbox full screen modal */}
      <SlideLightbox
        imageUrl={lightboxUrl}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        slideTitle={activeSlide.title}
      />
    </div>
  );
}

export default App;
