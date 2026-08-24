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
import { db, isFirebaseConfigured } from "./services/firebase";
import { doc, onSnapshot, setDoc, collection, deleteDoc } from "firebase/firestore";

function App() {
  // Passcode Gate state
  const [authorized, setAuthorized] = useState(() => {
    if (!appConfig.passwordEnabled || appConfig.devBypassPassword) {
      return true;
    }
    return localStorage.getItem("split_authorized") === "true";
  });

  const nickname = localStorage.getItem("split_nickname") || "學生";
  const teamId = localStorage.getItem("split_teamId") || "Team 1";

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

  // Lock state for co-editing prevention
  const [locks, setLocks] = useState<Record<string, { editor: string; updatedAt: number }>>({});
  const [now, setNow] = useState(Date.now());
  const [focusedSlideId, setFocusedSlideId] = useState<string | null>(null);

  // Slide navigation
  const activeSlideIndex = slides.findIndex((s) => s.id === workbook.activeSlideId);
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
        const matchedSlide = slides.find((s) => s.page === pageNum);
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
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [setActiveSlideId, setViewMode]);

  // Local clock to invalidate old locks
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to slide locks in the current team
  useEffect(() => {
    if (!authorized || !isFirebaseConfigured || !db) return;

    const locksCollectionRef = collection(db!, "workshops", "split", "teams", teamId, "locks");
    const unsubscribe = onSnapshot(locksCollectionRef, (snapshot) => {
      const activeLocks: Record<string, { editor: string; updatedAt: number }> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.editor && data.updatedAt) {
          activeLocks[docSnap.id] = {
            editor: data.editor,
            updatedAt: Number(data.updatedAt)
          };
        }
      });
      setLocks(activeLocks);
    });

    return () => unsubscribe();
  }, [authorized, teamId]);

  // Keep lock alive while focused
  useEffect(() => {
    if (!focusedSlideId || !isFirebaseConfigured || !db) return;

    const interval = setInterval(async () => {
      const lockDocRef = doc(db!, "workshops", "split", "teams", teamId, "locks", focusedSlideId);
      await setDoc(lockDocRef, {
        editor: nickname,
        updatedAt: Date.now()
      }).catch((err) => {
        console.warn("Failed to renew lock", err);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [focusedSlideId, teamId, nickname]);

  const handleNoteFocus = async (slideId: string) => {
    setFocusedSlideId(slideId);
    if (!isFirebaseConfigured || !db) return;
    const lockDocRef = doc(db!, "workshops", "split", "teams", teamId, "locks", slideId);
    await setDoc(lockDocRef, {
      editor: nickname,
      updatedAt: Date.now()
    }).catch((err) => {
      console.warn("Failed to set lock on focus", err);
    });
  };

  const handleNoteBlur = async (slideId: string) => {
    setFocusedSlideId(null);
    if (!isFirebaseConfigured || !db) return;
    const lockDocRef = doc(db!, "workshops", "split", "teams", teamId, "locks", slideId);
    await deleteDoc(lockDocRef).catch((err) => {
      console.warn("Failed to delete lock on blur", err);
    });
  };

  const getActiveEditorForSlide = (slideId: string) => {
    const lock = locks[slideId];
    if (!lock) return undefined;
    if (lock.editor !== nickname && now - lock.updatedAt < 8000) {
      return lock.editor;
    }
    return undefined;
  };

  // Whiteboard Storage Bridge: Upload local edits to Firestore
  const lastSyncedTimestamps = useRef<Record<string, string>>({});
  useEffect(() => {
    if (!authorized || !isFirebaseConfigured || !db) return;

    const handleLocalStorageUpdate = async (key: string, value: string | null) => {
      let toolId = "";
      if (key === "vibe-agile-board-wbs-v4") toolId = "wbs";
      else if (key === "vibe-agile-board-impact-map-v3") toolId = "impact-map";
      else if (key === "vibe-agile-board-story-map-v4") toolId = "story-map";
      else if (key === "decision_tables_standalone") toolId = "decision-table";

      if (!toolId || !value) return;

      try {
        const timestamp = new Date().toISOString();
        lastSyncedTimestamps.current[toolId] = timestamp;

        const docRef = doc(db!, "workshops", "split", "teams", teamId, "tools", toolId);
        await setDoc(docRef, { data: value, updatedAt: timestamp });
      } catch (err) {
        console.error(`Failed to upload ${toolId} to Firestore:`, err);
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key) {
        handleLocalStorageUpdate(e.key, e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageEvent);

    let prevValues: Record<string, string | null> = {
      "vibe-agile-board-wbs-v4": localStorage.getItem("vibe-agile-board-wbs-v4"),
      "vibe-agile-board-impact-map-v3": localStorage.getItem("vibe-agile-board-impact-map-v3"),
      "vibe-agile-board-story-map-v4": localStorage.getItem("vibe-agile-board-story-map-v4"),
      "decision_tables_standalone": localStorage.getItem("decision_tables_standalone")
    };

    const pollInterval = setInterval(() => {
      const keys = ["vibe-agile-board-wbs-v4", "vibe-agile-board-impact-map-v3", "vibe-agile-board-story-map-v4", "decision_tables_standalone"];
      keys.forEach((key) => {
        const current = localStorage.getItem(key);
        if (current !== prevValues[key]) {
          prevValues[key] = current;
          handleLocalStorageUpdate(key, current);
        }
      });
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageEvent);
      clearInterval(pollInterval);
    };
  }, [authorized, teamId]);

  // Whiteboard Storage Bridge: Download remote updates from Firestore
  useEffect(() => {
    if (!authorized || !isFirebaseConfigured || !db) return;

    const colRef = collection(db!, "workshops", "split", "teams", teamId, "tools");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      snapshot.forEach((changeDoc) => {
        const toolId = changeDoc.id;
        const remote = changeDoc.data();
        if (!remote || !remote.data) return;

        let key = "";
        if (toolId === "wbs") key = "vibe-agile-board-wbs-v4";
        else if (toolId === "impact-map") key = "vibe-agile-board-impact-map-v3";
        else if (toolId === "story-map") key = "vibe-agile-board-story-map-v4";
        else if (toolId === "decision-table") key = "decision_tables_standalone";

        if (!key) return;

        const localTimestamp = lastSyncedTimestamps.current[toolId];
        if (!localTimestamp || new Date(remote.updatedAt) > new Date(localTimestamp)) {
          lastSyncedTimestamps.current[toolId] = remote.updatedAt;
          const currentLocalVal = localStorage.getItem(key);
          if (currentLocalVal !== remote.data) {
            localStorage.setItem(key, remote.data);
            window.dispatchEvent(
              new StorageEvent("storage", {
                key,
                newValue: remote.data,
                storageArea: localStorage
              })
            );
          }
        }
      });
    });

    return () => unsubscribe();
  }, [authorized, teamId]);

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
    const timestamp =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "_" +
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
      const modSlides = slides.filter((s) => s.moduleId === mod.id);
      let moduleHasNotes = false;

      const modMdSections = modSlides
        .map((slide) => {
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
            slideMd += `| ` + config.headers.join(" | ") + ` |\n`;
            slideMd += `| ` + config.headers.map(() => "---").join(" | ") + ` |\n`;
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
        })
        .filter(Boolean);

      if (moduleHasNotes) {
        mdContent += `## ${mod.title}\n\n`;
        mdContent += modMdSections.join("---\n\n");
        mdContent += `\n\n`;
      }
    });

    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `SPLIT_互動講義筆記_${timestamp}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const now = new Date();
    const timestamp =
      now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      "_" +
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

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed && parsed.courseId === appConfig.courseId) {
          const confirmOverwrite = window.confirm(
            "偵測到相符的講義備份檔。這將覆蓋您目前所屬組別的雲端/本地實作資料，確認是否還原？"
          );
          if (confirmOverwrite) {
            importWorkbook(parsed);
            alert("還原成功！已讀取歷史進度。");
          }
        } else {
          alert("❌ 錯誤：不相容的 JSON 檔案格式。");
        }
      } catch (err) {
        alert("❌ 錯誤：JSON 備份檔解析失敗。");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      "⚠️ 警告：這將清空目前所屬組別的所有筆記與實作資料。確認是否重設？"
    );
    if (confirmReset) {
      resetWorkbook();
      alert("已重置資料！");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("split_authorized");
    localStorage.removeItem("split_role");
    localStorage.removeItem("split_nickname");
    localStorage.removeItem("split_teamId");
    setAuthorized(false);
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
      nickname={nickname}
      teamId={teamId}
      onLogout={handleLogout}
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
      activeEditor={getActiveEditorForSlide(activeSlide.id)}
      onNoteFocus={handleNoteFocus}
      onNoteBlur={handleNoteBlur}
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {topBar}
            <div className="flex-1 flex overflow-hidden">
              {sidebar}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
                <div className="w-full h-[38vh] min-h-[220px] max-h-[300px] md:h-full md:max-h-none md:w-[40%] lg:w-[35%] xl:w-[30%] shrink-0 overflow-hidden flex flex-col bg-slate-100 relative">
                  {slideViewer}
                </div>
                <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 bg-white h-full overflow-hidden flex flex-col">
                  {workbookPanel}
                </div>
              </div>
            </div>
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {topBar}
          <div className="flex-1 flex overflow-hidden">
            {sidebar}
            <OverviewGrid onSelectSlide={handleSelectSlide} getResponse={getResponse} />
          </div>
        </div>
      )}

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
