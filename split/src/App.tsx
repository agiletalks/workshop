import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { slides } from "./data/slides";
import { useWorkbook } from "./hooks/useWorkbook";
import { TopBar } from "./components/TopBar";
import { ModuleSidebar } from "./components/ModuleSidebar";
import { SlideViewer } from "./components/SlideViewer";
import { SlideLightbox } from "./components/SlideLightbox";
import { WorkbookPanel } from "./components/WorkbookPanel";
import { OverviewGrid } from "./components/OverviewGrid";
import { PasswordGate } from "./components/PasswordGate";
import { QuestionsDrawer } from "./components/QuestionsDrawer";
import { TaskEditorModal } from "./components/TaskEditorModal";
import { PrintHandbookModal } from "./components/PrintHandbookModal";
import { AiConfigModal } from "./components/AiConfigModal";
import { getDoc } from "firebase/firestore";
import { VoiceNoteRecorder } from "./services/voiceRecorder";
import {
  type LectureRecordingState,
  compileLectureContent,
  saveLectureNote,
  getLectureNoteDocRef,
  fetchAllLectureNotes
} from "./services/lectureNoteService";
import {
  broadcastInstructorSlide,
  subscribeInstructorSlide,
  type InstructorLiveSlide
} from "./services/liveSlideService";
import {
  type TeamTaskItem,
  subscribeCustomTasks,
  saveCustomTask,
  deleteCustomTask,
  mergeSlidesWithCustomTasks
} from "./services/customTasksService";
import {
  type UserSession,
  type ClassMetadata,
  type TeamNote,
  type QuestionItem,
  subscribeClassMetadata,
  subscribeTeamNote,
  subscribeQuestions,
  acquireNoteLock,
  renewNoteLock,
  releaseNoteLock,
  saveTeamMemo,
  addNoteAttachment,
  removeNoteAttachment
} from "./services/notesService";

function App() {
  // 1. 學員進班 Session 狀態 (初始為 null，由 PasswordGate 嚴格非同步校驗後放行，防止舊過期 session 繞過)
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  // 2. 班級中繼資料 (偵測世代遞增與啟用狀態)
  const [classMetadata, setClassMetadata] = useState<ClassMetadata | null>(null);

  // 3. 目前視角組別 (預設為學員所屬組別，可切換至其他組進行唯讀觀摩)
  const [activeTeamId, setActiveTeamId] = useState<number>(() => {
    return userSession ? userSession.teamId : 1;
  });
  const [isPrintHandbookOpen, setIsPrintHandbookOpen] = useState(false);

  // 當 userSession 變更時同步更新 activeTeamId
  useEffect(() => {
    if (userSession) {
      setActiveTeamId(userSession.teamId);
    }
  }, [userSession]);

  // 跨班 URL 守衛：若 URL 的 ?c= 班級代碼與當前 session 不符，強制拉起門禁
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlClassId = (params.get("c") || params.get("class"))?.trim().toLowerCase();
    if (urlClassId && userSession && userSession.classId?.toLowerCase() !== urlClassId) {
      const classKey = `split_user_session_${urlClassId}`;
      const saved = localStorage.getItem(classKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as UserSession;
          if (parsed.classId?.toLowerCase() === urlClassId) {
            setUserSession(parsed);
            return;
          }
        } catch (e) {}
      }
      setUserSession(null);
    }
  }, [userSession]);

  // 4. 當前頁面之小組雲端筆記資料
  const [teamNote, setTeamNote] = useState<TeamNote | null>(null);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'online' | 'syncing' | 'offline' | 'readonly'>('online');

  // 5. 課堂提問列表與抽屜展開狀態
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);

  // 6. 自訂團隊演練任務清單 (模組 3)
  const [customTasks, setCustomTasks] = useState<TeamTaskItem[]>([]);
  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TeamTaskItem | null>(null);
  const [taskInsertAnchor, setTaskInsertAnchor] = useState<string>("slide-01");

  // 7. 隨堂小編 (Gemini) 設定與金鑰狀態
  const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);
  const [geminiKeyConfigured, setGeminiKeyConfigured] = useState(false);

  // 8. 講師即時投影投影片廣播與學員端跟隨
  const [instructorLiveSlide, setInstructorLiveSlide] = useState<InstructorLiveSlide | null>(null);

  // 立即安全抹除網址列中的 gemini_key 參數，防止投影大螢幕洩漏
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const key = params.get('gemini_key');
    if (key) {
      try {
        localStorage.setItem('GEMINI_API_KEY', key);
        params.delete('gemini_key');
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        const newUrl = `${window.location.pathname}${newSearch}${window.location.hash || ''}`;
        window.history.replaceState({}, '', newUrl);
      } catch (_) {}
    }
    setGeminiKeyConfigured(Boolean(localStorage.getItem('GEMINI_API_KEY')));
  }, []);

  // 本地 Workbook 狀態管理 (保留既有進度與草稿)
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

  // 根據 Firestore 自訂任務動態插入既有教材並重新計算頁碼
  const mergedSlides = useMemo(() => {
    return mergeSlidesWithCustomTasks(slides, customTasks);
  }, [customTasks]);

  // Slide navigation (基於動態合併後的投影片清單)
  const activeSlideIndex = mergedSlides.findIndex(s => s.id === workbook.activeSlideId);
  const activeSlide = mergedSlides[activeSlideIndex] || mergedSlides[0];

  // Store latest state in refs
  const activeSlideIdRef = useRef(workbook.activeSlideId);
  const viewModeRef = useRef(workbook.viewMode);

  useEffect(() => {
    activeSlideIdRef.current = workbook.activeSlideId;
    viewModeRef.current = workbook.viewMode;
  }, [workbook.activeSlideId, workbook.viewMode]);

  // 監聽班級中繼資料與世代切換
  useEffect(() => {
    if (!userSession?.classId) return;

    const unsub = subscribeClassMetadata(userSession.classId, (meta) => {
      if (!meta) {
        // 班級在雲端資料庫中不存在或已被刪除：清除 session 快取並強制退回門禁
        console.warn('[App] Class does not exist in Firestore, evicting session');
        localStorage.removeItem('split_user_session');
        localStorage.removeItem(`split_user_session_${userSession.classId.toLowerCase()}`);
        sessionStorage.removeItem("split_courseware_authorized");
        setUserSession(null);
        return;
      }
      setClassMetadata(meta);
      if (meta.status === 'inactive') {
        // 班級已被講師停用：清除 session 快取並強制退回門禁
        localStorage.removeItem('split_user_session');
        localStorage.removeItem(`split_user_session_${userSession.classId.toLowerCase()}`);
        sessionStorage.removeItem("split_courseware_authorized");
        setUserSession(null);
        return;
      }
      if (userSession.role !== 'instructor' && meta.passcodeHash && (!userSession.passcodeHash || userSession.passcodeHash !== meta.passcodeHash)) {
        // 班級專屬密碼變更或不符：清除 session 快取並強制退回門禁
        console.warn('[App] Passcode hash mismatch or missing, evicting session');
        localStorage.removeItem('split_user_session');
        localStorage.removeItem(`split_user_session_${userSession.classId.toLowerCase()}`);
        sessionStorage.removeItem("split_courseware_authorized");
        setUserSession(null);
        return;
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [userSession?.classId]);

  // 講師即時廣播當前投影之投影片
  useEffect(() => {
    if (userSession?.role !== 'instructor' || !userSession.classId || !activeSlide) return;
    const slideInfo = {
      slideId: activeSlide.id,
      pageNumber: activeSlideIndex + 1,
      slideTitle: activeSlide.title,
      updatedAt: Date.now()
    };
    broadcastInstructorSlide(userSession.classId, slideInfo);
    setInstructorLiveSlide(slideInfo);
  }, [userSession?.role, userSession?.classId, activeSlide?.id, activeSlideIndex]);

  // 學員即時訂閱講師當前投影頁碼
  useEffect(() => {
    if (!userSession?.classId) return;
    const unsub = subscribeInstructorSlide(userSession.classId, (info) => {
      setInstructorLiveSlide(info);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [userSession?.classId]);

  // 監聽課堂提問列表 (依照世代隔離)
  useEffect(() => {
    if (!userSession?.classId) return;
    const currentGen = classMetadata?.currentGeneration || 1;

    const unsub = subscribeQuestions(
      userSession.classId,
      currentGen,
      (list) => {
        setQuestions(list);
      },
      (err) => {
        console.warn('[App] Firestore questions sync failed:', err);
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, [userSession?.classId, classMetadata?.currentGeneration]);

  // 監聽班級自訂演練任務清單 (模組 3: Team Task 動態插入)
  useEffect(() => {
    if (!userSession?.classId) return;

    const unsub = subscribeCustomTasks(
      userSession.classId,
      (tasks) => {
        setCustomTasks(tasks);
      },
      (err) => {
        console.warn('[App] Firestore custom tasks sync failed:', err);
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, [userSession?.classId]);

  // 監聽特定頁面與組別的隨堂筆記
  useEffect(() => {
    if (!userSession?.classId || !activeSlide?.id) return;
    const currentGen = classMetadata?.currentGeneration || 1;

    setCloudSyncStatus('syncing');
    const unsub = subscribeTeamNote(
      userSession.classId,
      currentGen,
      activeSlide.id,
      activeTeamId,
      (note) => {
        setTeamNote(note);
        if (classMetadata?.status === 'inactive') {
          setCloudSyncStatus('readonly');
        } else {
          setCloudSyncStatus('online');
        }
      },
      (err) => {
        console.warn('[App] Firestore note sync failed, using offline fallback:', err);
        setCloudSyncStatus('offline');
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, [userSession?.classId, classMetadata?.currentGeneration, activeSlide?.id, activeTeamId, classMetadata?.status]);

  // 心跳續約編輯鎖定 (每 15 秒檢查一次)
  useEffect(() => {
    if (!userSession || !teamNote?.lock?.isLocked || teamNote.lock.holderUid !== userSession.uid) {
      return;
    }

    const timer = setInterval(async () => {
      const currentGen = classMetadata?.currentGeneration || 1;
      await renewNoteLock(userSession.classId, currentGen, activeSlide.id, activeTeamId, userSession);
    }, 15000);

    return () => clearInterval(timer);
  }, [userSession, teamNote?.lock?.isLocked, teamNote?.lock?.holderUid, classMetadata?.currentGeneration, activeSlide?.id, activeTeamId]);

  // 處理筆記輸入與 Debounce 雲端儲存 (伺服器 ACK 確認)
  const saveDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpdateMemo = useCallback((slideId: string, newMemo: string) => {
    // 1. 先更新本地響應狀態
    updateNote(slideId, newMemo);

    if (!userSession) return;
    const currentGen = classMetadata?.currentGeneration || 1;
    const isObservation = userSession.role !== 'instructor' && activeTeamId !== userSession.teamId;
    const isClassReadOnly = classMetadata?.status === 'inactive';

    if (isObservation || isClassReadOnly) return;

    // 2. 標記同步中
    setCloudSyncStatus('syncing');

    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current);
    }

    // 3. 800ms debounce 送出雲端並等待伺服器 ACK
    saveDebounceTimer.current = setTimeout(async () => {
      try {
        await saveTeamMemo(userSession.classId, currentGen, slideId, activeTeamId, newMemo, userSession);
        setCloudSyncStatus('online'); // 取得伺服器 ACK 後才標記同步成功
      } catch (err) {
        console.error('[App] Failed to save memo to cloud:', err);
        setCloudSyncStatus('offline');
      }
    }, 800);
  }, [userSession, classMetadata?.currentGeneration, activeTeamId, classMetadata?.status, updateNote]);

  // 爭取編輯鎖定
  const handleAcquireLock = async (): Promise<boolean> => {
    if (!userSession) return false;
    const currentGen = classMetadata?.currentGeneration || 1;
    return await acquireNoteLock(userSession.classId, currentGen, activeSlide.id, activeTeamId, userSession);
  };

  // 釋放編輯鎖定
  const handleReleaseLock = async () => {
    if (!userSession) return;
    const currentGen = classMetadata?.currentGeneration || 1;
    await releaseNoteLock(userSession.classId, currentGen, activeSlide.id, activeTeamId, userSession);
  };

  // 上傳附件檔案 (轉換為 DataURL，防呆限制 800KB)
  const handleAddAttachment = async (file: File) => {
    if (!userSession) return;
    if (file.size > 800 * 1024) {
      alert("⚠️ 檔案過大：為確保雲端同步效能與文檔容量，請上傳小於 800KB 的圖片或檔案。");
      return;
    }
    const currentGen = classMetadata?.currentGeneration || 1;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      const attId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      await addNoteAttachment(userSession.classId, currentGen, activeSlide.id, activeTeamId, {
        id: attId,
        name: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        createdAt: Date.now(),
        dataUrl: dataUrl
      }, userSession);
    };
    reader.readAsDataURL(file);
  };

  // 刪除附件檔案
  const handleRemoveAttachment = async (attId: string) => {
    if (!userSession) return;
    const currentGen = classMetadata?.currentGeneration || 1;
    await removeNoteAttachment(userSession.classId, currentGen, activeSlide.id, activeTeamId, attId, userSession);
  };

  // 切換組別 (支援觀摩與切回我組)
  const handleSwitchTeam = (newTeamId: number) => {
    // 切換前若持有鎖則釋放
    if (userSession && teamNote?.lock?.isLocked && teamNote.lock.holderUid === userSession.uid) {
      handleReleaseLock();
    }
    setActiveTeamId(newTeamId);
  };

  // 初始載入時解析 Hash 投影片深層連結 (僅執行一次)
  const initialHashParsedRef = useRef(false);
  useEffect(() => {
    if (initialHashParsedRef.current || mergedSlides.length === 0) return;
    initialHashParsedRef.current = true;
    const hash = window.location.hash;
    if (!hash) return;
    if (hash === '#/overview') {
      setViewMode('overview');
      return;
    }
    const match = hash.match(/#\/module\/([^/]+)\/slide\/(\d+)/);
    if (match) {
      const modId = match[1];
      const pageNum = parseInt(match[2], 10);
      const target = mergedSlides.find(s => s.moduleId === modId && s.page === pageNum);
      if (target && target.id !== activeSlideIdRef.current) {
        setActiveSlideId(target.id);
      }
    }
  }, [mergedSlides]);

  // 監聽網址 Hash 變更以同步當前投影片 (使用者點上一頁/下一頁瀏覽器導航時觸發)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (!hash) return;
      if (hash === '#/overview') {
        if (viewModeRef.current !== 'overview') setViewMode('overview');
        return;
      }
      const match = hash.match(/#\/module\/([^/]+)\/slide\/(\d+)/);
      if (match) {
        const modId = match[1];
        const pageNum = parseInt(match[2], 10);
        const target = mergedSlides.find(s => s.moduleId === modId && s.page === pageNum);
        if (target && target.id !== activeSlideIdRef.current) {
          setActiveSlideId(target.id);
          if (viewModeRef.current !== 'focus') setViewMode('focus');
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [mergedSlides]);

  // 當 activeSlide 改變時，更新網址列 Hash (單向同步，不觸發重複渲染)
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
  }, [workbook.viewMode, activeSlide?.moduleId, activeSlide?.page]);

  const handleNext = () => {
    if (activeSlideIndex < mergedSlides.length - 1) {
      setActiveSlideId(mergedSlides[activeSlideIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideId(mergedSlides[activeSlideIndex - 1].id);
    }
  };

  // 講師 In-App 團隊演練管理對話框處理常式
  const handleOpenCreateTask = (insertAfterSlideId?: string) => {
    setEditingTask(null);
    setTaskInsertAnchor(insertAfterSlideId || activeSlide?.id || slides[0].id);
    setIsTaskEditorOpen(true);
  };

  const handleOpenEditTask = (task: TeamTaskItem) => {
    setEditingTask(task);
    setTaskInsertAnchor(task.insertAfterSlideId);
    setIsTaskEditorOpen(true);
  };

  const handleSaveTask = async (taskData: Omit<TeamTaskItem, "classId" | "updatedAt">) => {
    if (!userSession?.classId) return;
    const taskId = await saveCustomTask(userSession.classId, taskData);
    setIsTaskEditorOpen(false);
    setEditingTask(null);
    setActiveSlideId(taskId);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!userSession?.classId) return;
    if (!window.confirm("確定要刪除此團隊演練任務嗎？\n組員已寫的筆記與上傳成果仍會保留在雲端，但教材投影片中將不再出現此任務。")) return;
    await deleteCustomTask(userSession.classId, taskId);
    setIsTaskEditorOpen(false);
    setEditingTask(null);
    if (workbook.activeSlideId === taskId) {
      setActiveSlideId(slides[0].id);
    }
  };

  const handleSelectSlide = (slideId: string) => {
    setActiveSlideId(slideId);
    if (workbook.viewMode === "overview") {
      setViewMode("focus");
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setLightboxUrl(imageUrl);
    setLightboxOpen(true);
  };

  const handleExportMarkdown = () => {
    // 匯出 Markdown 邏輯
    let md = `# SPLIT 需求拆解工作坊 - 隨堂實作手冊\n\n`;
    slides.forEach((s) => {
      const r = getResponse(s.id);
      if (r.personalNote) {
        md += `## ${s.title}\n${r.personalNote}\n\n`;
      }
    });
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SPLIT_實作筆記_${userSession?.classId || 'export'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(workbook, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `split_workbook_${userSession?.classId || 'backup'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        importWorkbook(parsed);
        alert("還原成功！已讀取您的歷史筆記。");
      } catch (err) {
        alert("❌ 錯誤：JSON 備份檔解析失敗。");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (window.confirm("確定要重設本機暫存筆記嗎？")) {
      resetWorkbook();
      alert("已重設本機筆記！");
    }
  };

  // 全域課堂講述錄音狀態 (支援跨頁持續錄音、目錄即時紅點與快速跳回)
  const [lectureRecording, setLectureRecording] = useState<LectureRecordingState>({
    isRecording: false,
    slideId: null,
    slideTitle: null,
    slidePage: null,
    recordingSeconds: 0,
    interimSpeech: "",
    isCompiling: false,
    compilingSlideId: null
  });
  const lectureRecorderRef = useRef<VoiceNoteRecorder | null>(null);
  const lectureTimerRef = useRef<any>(null);
  const lectureRecordModeRef = useRef<'fresh' | 'augment'>('fresh');

  const handleStartLectureRecord = (
    targetSlideId: string,
    targetSlideTitle: string,
    targetSlidePage?: number,
    mode: 'fresh' | 'augment' = 'fresh'
  ) => {
    if (lectureRecording.isRecording) return;
    const recorder = new VoiceNoteRecorder();
    if (!recorder.isSupported()) {
      alert("您的瀏覽器暫不支援語音辨識，建議使用 Google Chrome 或 Microsoft Edge 進行錄音。");
      return;
    }

    lectureRecordModeRef.current = mode;
    lectureRecorderRef.current = recorder;

    const started = recorder.start({
      onInterim: (interim) => {
        setLectureRecording((prev) => ({ ...prev, interimSpeech: interim }));
      },
      onError: (err) => {
        console.warn('[LectureRecord] 語音收音異常:', err);
        if (lectureTimerRef.current) clearInterval(lectureTimerRef.current);
        setLectureRecording((prev) => ({ ...prev, isRecording: false, interimSpeech: "" }));
      }
    });

    if (started) {
      setLectureRecording({
        isRecording: true,
        slideId: targetSlideId,
        slideTitle: targetSlideTitle,
        slidePage: targetSlidePage,
        recordingSeconds: 0,
        interimSpeech: "",
        isCompiling: false,
        compilingSlideId: null
      });

      lectureTimerRef.current = setInterval(() => {
        setLectureRecording((prev) => ({ ...prev, recordingSeconds: prev.recordingSeconds + 1 }));
      }, 1000);
    }
  };

  const handleStopLectureRecord = async () => {
    if (!lectureRecorderRef.current) return;
    const recordedSec = lectureRecording.recordingSeconds;
    const targetSlideId = lectureRecording.slideId;
    const targetSlideTitle = lectureRecording.slideTitle || '';
    const mode = lectureRecordModeRef.current;

    if (lectureTimerRef.current) {
      clearInterval(lectureTimerRef.current);
      lectureTimerRef.current = null;
    }

    const transcript = lectureRecorderRef.current.stop();
    lectureRecorderRef.current = null;

    if (!targetSlideId || !transcript || transcript.trim().length < 3) {
      alert("錄音時間過短或未偵測到有效聲音，請再試一次。");
      setLectureRecording((prev) => ({
        ...prev,
        isRecording: false,
        interimSpeech: ""
      }));
      return;
    }

    setLectureRecording((prev) => ({
      ...prev,
      isRecording: false,
      isCompiling: true,
      compilingSlideId: targetSlideId,
      interimSpeech: ""
    }));

    try {
      const classId = classMetadata?.id || userSession?.classId || 'default-split';
      const genId = classMetadata?.currentGeneration || 1;

      let existingData: any = null;
      if (mode === 'augment') {
        const docRef = getLectureNoteDocRef(classId, genId, targetSlideId);
        if (docRef) {
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            existingData = snap.data();
          }
        }
      }

      // 收集前情提要（前 1~3 頁之主題與隨堂重點便籤摘要）
      const targetIdx = mergedSlides.findIndex(s => s.id === targetSlideId);
      let previousNotesSummary = '';
      if (targetIdx > 0) {
        try {
          const allNotes = await fetchAllLectureNotes(classId, genId);
          const prevSlides = mergedSlides.slice(Math.max(0, targetIdx - 3), targetIdx);
          const parts: string[] = [];
          for (const ps of prevSlides) {
            const pn = allNotes[ps.id];
            if (pn && pn.stickies && pn.stickies.length > 0) {
              const stickiesText = pn.stickies.map(stk => `  * [${stk.title}] ${stk.points.join('；')}`).join('\n');
              parts.push(`【第 ${ps.page} 頁：${ps.title}】\n${stickiesText}`);
            } else {
              parts.push(`【第 ${ps.page} 頁：${ps.title}】`);
            }
          }
          previousNotesSummary = parts.join('\n\n');
        } catch (e) {
          console.warn('[LectureRecord] 取得前情提要失敗:', e);
        }
      }

      const targetSlide = mergedSlides[targetIdx];

      const compiled = await compileLectureContent({
        transcript,
        slideTitle: targetSlideTitle,
        slideId: targetSlideId,
        moduleTitle: targetSlide?.moduleId || 'SPLIT 需求拆解實戰',
        pageNumber: targetSlide?.page || (targetIdx + 1),
        previousNotesSummary,
        isAugment: mode === 'augment',
        existingData
      });

      await saveLectureNote(classId, genId, targetSlideId, {
        stickies: compiled.stickies,
        textbookArticle: compiled.textbookArticle,
        rawCleanTranscript: compiled.rawCleanTranscript || transcript,
        recordedSeconds: recordedSec,
        instructorName: userSession?.name || '講師'
      });

      if (compiled.error) {
        alert(`隨堂錄音逐字稿已妥善保存至「🎙️ 逐字稿/Q&A」分頁！\n\n小編提示：AI 深度思索提煉未完成（${compiled.error}）。\n請至右上角『小編設定』檢查 Gemini 金鑰與連線狀態。`);
      }
    } catch (err: any) {
      console.error('[LectureRecord] 小編整理失敗:', err);
      alert(`小編整理筆記時遇到問題（${err?.message || '請稍候重試'}），原始逐字稿已保留。`);
    } finally {
      setLectureRecording((prev) => ({
        ...prev,
        isCompiling: false,
        compilingSlideId: null
      }));
    }
  };

  // 若尚未報到登入，顯示進班門禁
  if (!userSession) {
    return <PasswordGate onAuthorized={(session) => {
      setUserSession(session);
      setActiveTeamId(session.teamId);
    }} />;
  }

  const unansweredCount = questions.filter((q) => !q.isAnswered).length;

  const handleJumpToInstructorSlide = (sId: string) => {
    setActiveSlideId(sId);
  };

  const topBar = (
    <TopBar
      viewMode={workbook.viewMode}
      setViewMode={setViewMode}
      progress={{
        ...getProgress(),
        total: mergedSlides.length
      }}
      saveStatus={saveStatus}
      lastSaved={lastSaved}
      userSession={userSession}
      activeTeamId={activeTeamId}
      onSwitchTeam={handleSwitchTeam}
      classMetadata={classMetadata}
      cloudSyncStatus={cloudSyncStatus}
      onExportMarkdown={handleExportMarkdown}
      onExportJSON={handleExportJSON}
      onImportJSON={handleImportJSON}
      onReset={handleReset}
      sidebarCollapsed={sidebarCollapsed}
      onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      onToggleQuestions={() => setIsQuestionsOpen(!isQuestionsOpen)}
      questionsCount={questions.length}
      unansweredQuestionsCount={unansweredCount}
      isInstructor={userSession?.role === 'instructor'}
      onOpenCheckIn={() => setUserSession(null)}
      onInsertTask={() => handleOpenCreateTask(activeSlide?.id)}
      onOpenPrintHandbook={() => setIsPrintHandbookOpen(true)}
      activeSlideId={workbook.activeSlideId}
      instructorLiveSlide={instructorLiveSlide}
      onJumpToInstructorSlide={handleJumpToInstructorSlide}
      geminiKeyConfigured={geminiKeyConfigured}
      onOpenAiConfig={() => setIsAiConfigOpen(true)}
    />
  );

  const sidebar = (
    <ModuleSidebar
      activeSlideId={workbook.activeSlideId}
      slides={mergedSlides}
      onSelectSlide={handleSelectSlide}
      getResponse={getResponse}
      viewMode={workbook.viewMode}
      collapsed={sidebarCollapsed}
      isInstructor={userSession?.role === 'instructor'}
      onOpenTaskEditor={(sId) => handleOpenCreateTask(sId)}
      recordingSlideId={lectureRecording.isRecording ? lectureRecording.slideId : null}
      recordingSeconds={lectureRecording.recordingSeconds}
      instructorLiveSlideId={instructorLiveSlide?.slideId}
    />
  );

  const workbookPanel = (
    <WorkbookPanel
      slide={activeSlide}
      getResponse={getResponse}
      updateNote={handleUpdateMemo}
      updateInteractionData={updateInteractionData}
      toggleCompleted={toggleCompleted}
      onImageClick={handleImageClick}
      activeTeamId={activeTeamId}
      userSession={userSession}
      teamNote={teamNote}
      isClassReadOnly={classMetadata?.status === 'inactive'}
      onAcquireLock={handleAcquireLock}
      onReleaseLock={handleReleaseLock}
      onAddAttachment={handleAddAttachment}
      onRemoveAttachment={handleRemoveAttachment}
      onSwitchToMyTeam={() => handleSwitchTeam(userSession.teamId)}
      classMetadata={classMetadata}
      recordingState={lectureRecording}
      onStartLectureRecord={handleStartLectureRecord}
      onStopLectureRecord={handleStopLectureRecord}
      onNavigateToSlide={handleSelectSlide}
    />
  );

  const slideViewer = (
    <SlideViewer
      slide={activeSlide}
      totalSlides={mergedSlides.length}
      onNext={handleNext}
      onPrev={handlePrev}
      onImageClick={handleImageClick}
      isInstructor={userSession?.role === 'instructor'}
      userSession={userSession}
      activeTeamId={activeTeamId}
      onEditCustomTask={(taskId) => {
        const task = customTasks.find((t) => t.id === taskId);
        if (task) handleOpenEditTask(task);
      }}
    />
  );

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 relative">
      {workbook.viewMode === "focus" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {topBar}
          <div className="flex-1 flex overflow-hidden">
            {sidebar}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden h-full">
              <div className="w-full h-[38vh] min-h-[220px] max-h-[300px] md:h-full md:max-h-none md:w-[40%] lg:w-[35%] xl:w-[30%] shrink-0 overflow-hidden flex flex-col bg-slate-900 border-r border-slate-800 relative">
                {slideViewer}
              </div>
              <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-800 bg-white h-full overflow-hidden flex flex-col">
                {workbookPanel}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {topBar}
          <div className="flex-1 flex overflow-hidden">
            {sidebar}
            <OverviewGrid slides={mergedSlides} onSelectSlide={handleSelectSlide} getResponse={getResponse} />
          </div>
        </div>
      )}

      {/* 右下角常駐浮動提問按鈕 (Floating Action Button) */}
      <button
        onClick={() => setIsQuestionsOpen(true)}
        className="fixed bottom-6 right-6 z-40 px-3.5 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold text-xs shadow-2xl flex items-center gap-2 border border-teal-400/30 transition-all hover:shadow-teal-500/20 group cursor-pointer"
        title="開啟課堂提問"
      >
        <span className="text-base group-hover:scale-110 transition-transform">💬</span>
        <span>課堂提問</span>
        {questions.length > 0 && (
          <span className="bg-teal-900/80 text-teal-200 text-[10px] px-1.5 py-0.5 rounded-full border border-teal-500/40">
            {questions.length}
          </span>
        )}
        {unansweredCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow animate-bounce">
            {unansweredCount}
          </span>
        )}
      </button>

      {/* 課堂提問滑出抽屜 */}
      <QuestionsDrawer
        isOpen={isQuestionsOpen}
        onClose={() => setIsQuestionsOpen(false)}
        userSession={userSession}
        currentGeneration={classMetadata?.currentGeneration || 1}
        activeSlide={activeSlide}
        questions={questions}
        onNavigateToSlide={(sId) => handleSelectSlide(sId)}
      />

      {/* 講師 In-App 團隊演練設定對話框 (模組 3: Team Task) */}
      <TaskEditorModal
        isOpen={isTaskEditorOpen}
        onClose={() => {
          setIsTaskEditorOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : undefined}
        staticSlides={slides}
        targetInsertAfterSlideId={taskInsertAnchor}
        initialTask={editingTask}
      />

      <SlideLightbox
        imageUrl={lightboxUrl}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNext={handleNext}
        onPrev={handlePrev}
        slideTitle={activeSlide.title}
      />

      {/* 全日隨堂講義手冊列印視窗 */}
      <PrintHandbookModal
        isOpen={isPrintHandbookOpen}
        onClose={() => setIsPrintHandbookOpen(false)}
        slides={mergedSlides}
        classMetadata={classMetadata}
        userSession={userSession}
      />

      {/* 隨堂小編 (Gemini) 設定視窗 */}
      <AiConfigModal
        isOpen={isAiConfigOpen}
        onClose={() => setIsAiConfigOpen(false)}
        onKeySaved={(k) => setGeminiKeyConfigured(Boolean(k))}
      />
    </div>
  );
}

export default App;
