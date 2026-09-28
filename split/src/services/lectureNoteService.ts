/**
 * 隨堂講義與講師重點服務 (Lecture Note Service)
 * 負責：
 * 1. 講師講述語音內容之小編整理（便利貼與詳細內容）
 * 2. 支援 Gemini 智能萃取與本機在地降級容錯雙引擎
 * 3. 嚴格貫徹「零 AI 字眼」規範，以口語化、小編擬人化呈現
 * 4. Firestore 雲端即時同步與全班廣播
 */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export interface SlidePromptItem {
  id: string;
  title: string;
  description?: string;
  promptText: string;
  createdAt: number;
}

export interface SlideAttachmentItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'image' | 'pdf' | 'doc' | 'other';
  createdAt: number;
}

export interface LectureSticky {
  id: string;
  title: string;
  color: 'yellow' | 'blue' | 'pink' | 'green' | 'purple';
  points: string[];
}

export interface LectureNoteData {
  slideId: string;
  slideTitle?: string;
  stickies: LectureSticky[];
  prompts?: SlidePromptItem[];
  attachments?: SlideAttachmentItem[];
  rawCleanTranscript?: string; // 老師專用：去除贅字口誤之逐字清稿與師生 Q&A 整理
  textbookArticle?: string;   // 課堂教材專書長文
  updatedAt: number;
  recordedSeconds?: number;
  instructorName?: string;
}

export interface MasterTextbookChapter {
  moduleId: string;
  moduleTitle: string;
  title: string;
  content: string; // Markdown 格式出版級專書章節
}

export interface MasterTextbookData {
  classId: string;
  generation: number;
  chapters: MasterTextbookChapter[];
  generatedAt: number;
  totalWords?: number;
  instructorName?: string;
}

export interface LectureRecordingState {
  isRecording: boolean;
  slideId: string | null;
  slideTitle: string | null;
  slidePage?: number | null;
  recordingSeconds: number;
  interimSpeech: string;
  isCompiling: boolean;
  compilingSlideId: string | null;
}

// 取得該頁隨堂重點在 Firestore 的 DocumentReference
export function getLectureNoteDocRef(classId: string, generation: number, slideId: string) {
  if (!db) return null;
  const cId = classId || 'default-split';
  const genId = String(generation || 1);
  return doc(db, 'split_data', cId, 'generations', genId, 'lecture_notes', slideId);
}

// 監聽特定頁面的隨堂重點
export function subscribeLectureNote(
  classId: string,
  generation: number,
  slideId: string,
  onUpdate: (data: LectureNoteData | null) => void
): Unsubscribe {
  const docRef = getLectureNoteDocRef(classId, generation, slideId);
  if (!docRef) {
    onUpdate(null);
    return () => {};
  }
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as LectureNoteData);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn(`[LectureNote] 訂閱異常 (${slideId}):`, err);
      onUpdate(null);
    }
  );
}

// 取得全班全課堂所有頁面的隨堂重點（供全日手冊列印）
export async function fetchAllLectureNotes(
  classId: string,
  generation: number
): Promise<Record<string, LectureNoteData>> {
  if (!db) return {};
  const cId = classId || 'default-split';
  const genId = String(generation || 1);
  const colRef = collection(db, 'split_data', cId, 'generations', genId, 'lecture_notes');

  try {
    const snap = await getDocs(colRef);
    const result: Record<string, LectureNoteData> = {};
    snap.forEach((d) => {
      result[d.id] = d.data() as LectureNoteData;
    });
    return result;
  } catch (err) {
    console.warn('[LectureNote] 讀取全班隨堂重點失敗:', err);
    return {};
  }
}

// 儲存隨堂重點至 Firestore
export async function saveLectureNote(
  classId: string,
  generation: number,
  slideId: string,
  data: Partial<Omit<LectureNoteData, 'slideId' | 'updatedAt'>>
): Promise<void> {
  const docRef = getLectureNoteDocRef(classId, generation, slideId);
  if (!docRef) return;
  const payload = {
    ...data,
    slideId,
    updatedAt: Date.now()
  };
  await setDoc(docRef, payload, { merge: true });
}

// 儲存/更新單則提示詞
export async function saveSlidePrompt(
  classId: string,
  generation: number,
  slideId: string,
  prompt: SlidePromptItem,
  existingPrompts: SlidePromptItem[] = []
): Promise<void> {
  const idx = existingPrompts.findIndex((p) => p.id === prompt.id);
  const updated = idx >= 0
    ? existingPrompts.map((p) => (p.id === prompt.id ? prompt : p))
    : [...existingPrompts, prompt];
  await saveLectureNote(classId, generation, slideId, { prompts: updated });
}

// 刪除單則提示詞
export async function deleteSlidePrompt(
  classId: string,
  generation: number,
  slideId: string,
  promptId: string,
  existingPrompts: SlidePromptItem[] = []
): Promise<void> {
  const updated = existingPrompts.filter((p) => p.id !== promptId);
  await saveLectureNote(classId, generation, slideId, { prompts: updated });
}

// 儲存/更新單則附件/範例
export async function saveSlideAttachment(
  classId: string,
  generation: number,
  slideId: string,
  attachment: SlideAttachmentItem,
  existingAttachments: SlideAttachmentItem[] = []
): Promise<void> {
  const idx = existingAttachments.findIndex((a) => a.id === attachment.id);
  const updated = idx >= 0
    ? existingAttachments.map((a) => (a.id === attachment.id ? attachment : a))
    : [...existingAttachments, attachment];
  await saveLectureNote(classId, generation, slideId, { attachments: updated });
}

// 刪除單則附件/範例
export async function deleteSlideAttachment(
  classId: string,
  generation: number,
  slideId: string,
  attachmentId: string,
  existingAttachments: SlideAttachmentItem[] = []
): Promise<void> {
  const updated = existingAttachments.filter((a) => a.id !== attachmentId);
  await saveLectureNote(classId, generation, slideId, { attachments: updated });
}

// 全日教材專書 (Master Textbook) Firestore 參照
export function getMasterTextbookDocRef(classId: string, generation: number) {
  if (!db) return null;
  const cId = classId || 'default-split';
  const genId = String(generation || 1);
  return doc(db, 'split_data', cId, 'generations', genId, 'handbook', 'master_textbook');
}

// 儲存全日教材專書至 Firestore
export async function saveMasterTextbook(
  classId: string,
  generation: number,
  textbook: MasterTextbookData
): Promise<void> {
  const docRef = getMasterTextbookDocRef(classId, generation);
  if (!docRef) return;
  await setDoc(docRef, { ...textbook, generatedAt: Date.now() }, { merge: true });
}

// 訂閱全日教材專書
export function subscribeMasterTextbook(
  classId: string,
  generation: number,
  onUpdate: (data: MasterTextbookData | null) => void
): Unsubscribe {
  const docRef = getMasterTextbookDocRef(classId, generation);
  if (!docRef) {
    onUpdate(null);
    return () => {};
  }
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as MasterTextbookData);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('[MasterTextbook] 訂閱異常:', err);
      onUpdate(null);
    }
  );
}

// 讀取全日教材專書
export async function fetchMasterTextbook(
  classId: string,
  generation: number
): Promise<MasterTextbookData | null> {
  const docRef = getMasterTextbookDocRef(classId, generation);
  if (!docRef) return null;
  try {
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as MasterTextbookData) : null;
  } catch (err) {
    console.warn('[MasterTextbook] 讀取專書失敗:', err);
    return null;
  }
}

export interface CompileLectureOptions {
  transcript: string;
  slideTitle: string;
  slideId?: string;
  moduleTitle?: string;
  pageNumber?: number;
  previousNotesSummary?: string;
  isAugment?: boolean;
  existingData?: LectureNoteData | null;
}

// 呼叫小編整理服務（整合 Gemini 深度前後文提煉與在地純文字容錯引擎）
export async function compileLectureContent(
  optionsOrTranscript: string | CompileLectureOptions,
  slideTitleArg = '',
  _slideId?: string,
  isAugmentArg = false,
  existingDataArg: LectureNoteData | null = null
): Promise<{ stickies: LectureSticky[]; textbookArticle: string; rawCleanTranscript?: string }> {
  let transcript = '';
  let slideTitle = '';
  let moduleTitle = '';
  let pageNumber = 1;
  let previousNotesSummary = '';
  let isAugment = false;
  let existingData: LectureNoteData | null = null;

  if (typeof optionsOrTranscript === 'object') {
    transcript = optionsOrTranscript.transcript;
    slideTitle = optionsOrTranscript.slideTitle;
    moduleTitle = optionsOrTranscript.moduleTitle || '';
    pageNumber = optionsOrTranscript.pageNumber || 1;
    previousNotesSummary = optionsOrTranscript.previousNotesSummary || '';
    isAugment = Boolean(optionsOrTranscript.isAugment);
    existingData = optionsOrTranscript.existingData || null;
  } else {
    transcript = optionsOrTranscript;
    slideTitle = slideTitleArg;
    isAugment = isAugmentArg;
    existingData = existingDataArg;
  }

  const safeTranscript = transcript.length > 5000 ? transcript.slice(-5000) : transcript;
  
  // 檢查是否有 Gemini 金鑰（支援 localStorage 與網址列參數，自動安全抹除）
  let apiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
  if (typeof window !== 'undefined') {
    const urlKey = new URLSearchParams(window.location.search).get('gemini_key');
    if (urlKey) {
      apiKey = urlKey;
      try {
        localStorage.setItem('GEMINI_API_KEY', urlKey);
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('gemini_key');
        const cleanQuery = urlParams.toString() ? `?${urlParams.toString()}` : '';
        const newUrl = `${window.location.pathname}${cleanQuery}${window.location.hash || ''}`;
        window.history.replaceState({}, '', newUrl);
      } catch (_) {}
    }
  }

  // 提示詞建置（前後文脈絡鏈 + 語音錯字智慧校正 + 嚴禁出現任何 AI / 機器人字眼）
  let prompt = '';
  if (isAugment && existingData && (existingData.stickies.length > 0 || existingData.textbookArticle)) {
    prompt = `你是一位專業的敏捷實戰教練與隨堂速記小編。
【課程單元】：${moduleTitle || 'SPLIT 需求拆解實戰'} (第 ${pageNumber} 頁)
【投影片主題】：「${slideTitle}」。

${previousNotesSummary ? `【前情脈絡（前面章節已提煉之重點便籤）】：\n${previousNotesSummary}\n\n` : ''}
這是講師在課堂中補充講授的最新語音紀錄：
=== 補充口語講述內容 ===
${safeTranscript}

【目前已有重點便利貼】：
${JSON.stringify(existingData.stickies, null, 2)}

【目前已有詳細解說內容】：
${existingData.textbookArticle}

【整理指引】：
1. 口語辨識逐字稿可能包含同音錯別字或雜訊（例如語音辨識誤植、贅詞口頭禪等），請依據敏捷開發、需求拆解專業語境智慧修復，絕不照抄荒謬錯字。
2. 請將新增的講述重點與既有內容進行有機融合：
   - 整理或增修重點便利貼（維持 2~5 張精華便利貼，模擬學員手寫筆記重點）。
   - 擴充並豐富詳細解說內容（textbookArticle），將補充的案例、故事、細節或澄清說明編入其中，保持條理分明、親切易讀。
3. 嚴禁使用「AI提煉」、「AI分析」、「機器人整理」等任何冰冷技術字眼。

【輸出格式】：
純 JSON 物件，不要加入 markdown 程式碼標籤：
{
  "stickies": [
    {
      "title": "4~8字主題標題",
      "color": "yellow|blue|pink|green|purple",
      "points": ["15~25字核心重點1", "核心重點2"]
    }
  ],
  "textbookArticle": "### 章節重點：...\\n\\n#### 核心概念解析\\n...\\n\\n#### 實務案例與小組落地\\n...\\n\\n#### 關鍵提醒與避坑心得\\n..."
}`;
  } else {
    prompt = `你是一位專業的敏捷實戰教練與隨堂速記小編，專精於整理實體工作坊手寫便利貼與隨堂手冊。
【課程單元】：${moduleTitle || 'SPLIT 需求拆解實戰'} (第 ${pageNumber} 頁)
【投影片主題】：「${slideTitle}」。

${previousNotesSummary ? `【前情脈絡（前面章節已提煉之重點便籤）】：\n${previousNotesSummary}\n\n` : ''}
以下是講師針對這張投影片的口語講述逐字稿：

=== 講師口語講述內容 ===
${safeTranscript}

【整理指引與專業要求】：
1. 【前後文理解與脈絡承接】：請結合前情脈絡與本頁最新講授，理清因果邏輯與觀念承先啟後。
2. 【智慧錯字校正】：口語辨識逐字稿可能出現同音錯別字（例如「and硬手術」可能是軟硬體術語或口誤；口頭禪、語病等），請基於敏捷需求拆解（SPLIT、User Story、Impact Mapping 等）的專業知識進行語意修正與潤飾，嚴禁照抄不合理的錯字。
3. 【資產一：重點便利貼 (stickies)】：
   - 整理出 2 到 4 張代表不同維度且彼此獨立 (MECE) 的重點便利貼（如：現況痛點、核心觀念、實務操作手法、關鍵避坑點）。
   - 每張標題 (title) 4~8 字清楚點題；重點清單 (points) 2~3 點，每點 15~25 字以內，文字精煉，模擬課堂上手寫便利貼的重點。
   - 推薦色彩 (color): yellow, blue, pink, green, purple。
4. 【資產二：純淨修潤逐字稿與問答 (rawCleanTranscript)】：
   - 請去除贅字、口頭禪、重複結巴，修正專業術語錯別字。
   - 若講授中有師生問答或課堂互動，請標明：
     【課堂互動 Q&A】
     Q: 學員問題...
     A: 講師答覆...
   - 若無問答，則整理為一段語意連貫、通暢的口語講述清稿。
5. 【資產三：詳細解說內容 (textbookArticle)】：
   - 詳細還原上課過程，文字約 400~800 字。
   - 以 Markdown 格式輸出（使用 ###, ####, 條列項目, **粗體強調**, > 重點提醒）。
   - 結構完整包含：Why (核心意圖與為什麼這樣做) + What & How (關鍵概念、步驟作法與實務案例) + 常見誤區與避坑心法。
   - 語氣生動、務實且具啟發性，嚴禁使用任何「AI」、「人工智慧」、「機器人」等詞彙。

【輸出格式】：
純 JSON 物件，不要包覆外層 markdown 標籤：
{
  "stickies": [
    {
      "title": "主題名稱",
      "color": "yellow",
      "points": ["重點一", "重點二"]
    }
  ],
  "rawCleanTranscript": "純淨修潤之逐字稿全文與問答整理...",
  "textbookArticle": "### 核心要點：...\\n\\n#### 概念深入解析\\n...\\n\\n#### 實務落地與常見誤區\\n...\\n\\n#### 課堂金句與心法\\n..."
}`;
  }

  let parsedData: any = null;

  if (apiKey) {
    // 優先採用 gemini-3.5-flash-lite / 3.1-flash-lite 等最新架構，向下相容舊版模型
    const models = [
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ];
    for (const model of models) {
      if (parsedData) break;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      if (apiKey.startsWith('ya29.')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers['x-goog-api-key'] = apiKey;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 28000);

        const resp = await fetch(url, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
          })
        });

        clearTimeout(timeoutId);
        if (resp.ok) {
          const resJson = await resp.json();
          const rawText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
            break;
          }
        } else {
          const errRes = await resp.json().catch(() => null);
          console.warn(`[LectureNote] Gemini ${model} returned status ${resp.status}:`, errRes?.error?.message);
        }
      } catch (apiErr) {
        console.warn(`[LectureNote] Gemini ${model} fetch failed:`, apiErr);
      }
    }
  }

  // 本機在地小編備援（僅在未設定金鑰或網路斷線時啟動）
  if (!parsedData || !Array.isArray(parsedData.stickies) || parsedData.stickies.length === 0) {
    const sentences = safeTranscript
      .split(/[\n。！？!?；;]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 2);

    const colors: ('yellow' | 'blue' | 'pink' | 'green' | 'purple')[] = ['yellow', 'green', 'blue', 'pink', 'purple'];
    const generatedStickies: LectureSticky[] = [];

    if (sentences.length > 0) {
      const titles = ['課堂核心觀念', '實務拆解心法', '常見盲點提醒', '小組落地行動'];
      const chunkSize = Math.max(1, Math.ceil(sentences.length / 3));

      for (let i = 0; i < sentences.length && generatedStickies.length < 4; i += chunkSize) {
        const chunk = sentences.slice(i, i + chunkSize);
        const idx = generatedStickies.length;
        generatedStickies.push({
          id: `sticky_${Date.now()}_${idx}`,
          title: titles[idx] || `核心重點 ${idx + 1}`,
          color: colors[idx % colors.length],
          points: chunk.slice(0, 3)
        });
      }
    } else {
      generatedStickies.push({
        id: `sticky_${Date.now()}_0`,
        title: '課堂隨堂筆記',
        color: 'yellow',
        points: [safeTranscript.slice(0, 35) || '隨堂講述重點記錄']
      });
    }

    const defaultArticle = `### 課堂主旨：${slideTitle}

#### 講述內容重點整理
${sentences.map((s) => `- ${s}`).join('\n')}

#### 實務落地建議
在實務需求拆解過程中，請依照課堂討論之原則，與小組成員共同對齊標準並釐清邊界條件。

> 💡 隨堂提醒：可將重點便利貼作為小組討論與撰寫 User Story 時的實體參考對照。`;

    return {
      stickies: generatedStickies,
      rawCleanTranscript: safeTranscript,
      textbookArticle: defaultArticle
    };
  }

  const validatedStickies: LectureSticky[] = parsedData.stickies.map((s: any, idx: number) => ({
    id: s.id || `sticky_${Date.now()}_${idx}`,
    title: s.title || `重點 ${idx + 1}`,
    color: ['yellow', 'blue', 'pink', 'green', 'purple'].includes(s.color) ? s.color : 'yellow',
    points: Array.isArray(s.points) ? s.points : [String(s.points || '')]
  }));

  return {
    stickies: validatedStickies,
    rawCleanTranscript: parsedData.rawCleanTranscript || parsedData.textbookArticle || safeTranscript,
    textbookArticle: parsedData.textbookArticle || parsedData.rawCleanTranscript || ''
  };
}

// 課末全日教材專書生成器 (Chained Chapter Textbook Pipeline)
// 老師課末單鍵觸發，按章節模組滾動串接，生成出版級深度教科書並快取於 Firestore
export async function generateGlobalTextbook(
  classId: string,
  generation: number,
  slides: any[],
  onProgress?: (message: string, percent: number) => void
): Promise<MasterTextbookData> {
  const cId = classId || 'default-split';
  const genId = generation || 1;

  onProgress?.('正在載入全班各單元講述紀錄與逐字稿...', 10);
  const notesMap = await fetchAllLectureNotes(cId, genId);

  // 章節模組分組定義
  const moduleDefs: { id: string; title: string; defaultName: string }[] = [
    { id: 'E', title: '第一章：敏捷需求心法與基礎概念', defaultName: '敏捷基本精神、DoD、DoR 與 User Story' },
    { id: 'S', title: '第二章：S - Spike 概念探究與脈絡釐清', defaultName: '探索未知技術與業務邊界' },
    { id: 'P', title: '第三章：P - Path 關鍵路徑與使用者旅程', defaultName: '拆解 Happy Path 與例外路徑' },
    { id: 'L', title: '第四章：L - Logic 業務規則與邏輯拆分', defaultName: '複雜規則化繁為簡的策略' },
    { id: 'I', title: '第五章：I - Interface 資料與介面分離', defaultName: '前後端、UI 與資料流的切分心法' },
    { id: 'T', title: '第六章：T - Test & Timebox 測試驗收與時限', defaultName: '驗收準則、測試自動化與小步快跑' }
  ];

  // 檢查 Gemini API Key
  let apiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('GEMINI_API_KEY') : null;
  if (!apiKey && typeof window !== 'undefined') {
    const urlKey = new URLSearchParams(window.location.search).get('gemini_key');
    if (urlKey) apiKey = urlKey;
  }

  const chapters: MasterTextbookChapter[] = [];
  let previousChapterSummary = '';
  const totalModules = moduleDefs.length;

  for (let i = 0; i < totalModules; i++) {
    const mod = moduleDefs[i];
    const modSlides = slides.filter((s) => s.moduleId === mod.id);
    const modPageMin = modSlides.length ? Math.min(...modSlides.map((s) => s.page)) : 1;
    const modPageMax = modSlides.length ? Math.max(...modSlides.map((s) => s.page)) : 1;

    const progressPercent = Math.round(15 + (i / totalModules) * 75);
    onProgress?.(`正在編撰【${mod.title}】(P.${modPageMin}~P.${modPageMax})...`, progressPercent);

    // 彙整該模組中所有投影片的講述內容
    const slideMaterials = modSlides.map((s) => {
      const n = notesMap[s.id];
      const stickiesText = n?.stickies?.length
        ? n.stickies.map((stk) => `[${stk.title}]: ${stk.points.join('；')}`).join('\n')
        : '';
      const transcript = n?.rawCleanTranscript || n?.textbookArticle || '';
      return {
        slideId: s.id,
        page: s.page,
        title: s.title,
        subtitle: s.subtitle || '',
        transcript,
        stickiesText
      };
    });

    const combinedRaw = slideMaterials
      .map((sm) => `### 第 ${sm.page} 頁：${sm.title} (${sm.subtitle})\n${sm.transcript ? `【課堂講授與 Q&A 紀錄】：\n${sm.transcript}` : '（講師以實體投影片討論為主）'}\n${sm.stickiesText ? `【隨堂精華便利貼】：\n${sm.stickiesText}` : ''}`)
      .join('\n\n');

    let chapterMarkdown = '';

    if (apiKey) {
      const prompt = `你是一位享譽國際的敏捷軟體工程與產品開發權威專家，同時也是頂尖技術圖書出版社（如 O'Reilly、Addison-Wesley）的主筆作家。
現在正在為一門極受歡迎的【SPLIT 需求拆解實戰工作坊】撰寫出版級專屬專書教材。

【當前章節】：${mod.title}
【涵蓋頁碼】：第 ${modPageMin} 頁 至 第 ${modPageMax} 頁
${previousChapterSummary ? `【承前脈絡（上一章核心總結）】：\n${previousChapterSummary}\n\n` : ''}

【本章各頁課堂講述清稿、隨堂重點便利貼與師生 Q&A 原料】：
${combinedRaw.slice(0, 10000)}

【寫作與出版標準要求】：
1. 【教科書級出版品質】：
   - 請將口語逐字稿與條列式便籤徹底昇華，寫成深入淺出、前後呼應、架構嚴謹的專書文章（文字量約 1000~2000 字）。
   - 語氣專業務實、生動親切，具啟發性，避免死板背誦定義。
2. 【結構規格 (請一律使用標準 Markdown)】：
   - 使用 # 章節標題
   - 使用 ## 本章核心課題解析 (Why & Context)
   - 使用 ## 拆解原則與實戰操作指南 (How & Principles)
   - 使用 ## 實務場景與案例深度拆剖 (Real-World Case Study)
   - 使用 ## 課堂問答精選與避坑心法 (Q&A & Pitfalls)
   - 適當穿插引用句（> 重點心法）與粗體強調關鍵字。
3. 【嚴格合規】：
   - 嚴格禁止出現任何「AI」、「人工智慧」、「Gemini」、「機器人」等詞彙，全文表現為講師親筆撰述之精品著作。
4. 【章末反思與前瞻】：
   - 在章節末尾提供 2~3 個引導學員反思的工作實務問題，並簡短提示下一章的承接主題。

請直接輸出章節 Markdown 內容，不要包含多餘的對話或外層程式碼標籤。`;

      const models = [
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
      ];
      for (const model of models) {
        if (chapterMarkdown) break;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        if (apiKey.startsWith('ya29.')) {
          headers['Authorization'] = `Bearer ${apiKey}`;
        } else {
          headers['x-goog-api-key'] = apiKey;
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 35000);
          const resp = await fetch(url, {
            method: 'POST',
            headers,
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.35, maxOutputTokens: 3500 }
            })
          });
          clearTimeout(timeoutId);
          if (resp.ok) {
            const resJson = await resp.json();
            const text = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text.trim().length > 100) {
              chapterMarkdown = text.trim();
              break;
            }
          }
        } catch (err) {
          console.warn(`[MasterTextbook] Model ${model} generation failed:`, err);
        }
      }
    }

    // 若無 API Key 或連線異常，採用專業在地化專書模板合成
    if (!chapterMarkdown) {
      chapterMarkdown = `# ${mod.title}\n\n## 1. 核心意圖與本章課題\n本章聚焦於需求拆解的核心精髓，探討如何將龐大模糊的商業命題轉化為可落地、可驗收的獨立交付單元。\n\n## 2. 課堂講授核心觀念整理\n${slideMaterials.map((sm) => `### ${sm.title}\n${sm.transcript || '講師透過實體情境引導學員建立敏捷共識，強調小步快跑與跨職能協同價值。'}\n${sm.stickiesText ? `\n> 📌 **隨堂要點**：\n${sm.stickiesText}` : ''}`).join('\n\n')}\n\n## 3. 實務避坑與落地實踐建議\n在日常敏捷開發中，團隊常面臨規格過早固化或驗收界線模糊的挑戰。遵循本章原則，能確保故事具備價值獨立性 (INVEST)，杜絕無效重工。`;
    }

    // 提煉本章摘要作為下一章 Memory Hook
    previousChapterSummary = `${mod.title} 核心焦點：${mod.defaultName}。已探討本章所涵蓋之需求拆分核心方法論與常見誤區。`;

    chapters.push({
      moduleId: mod.id,
      moduleTitle: mod.title,
      title: mod.defaultName,
      content: chapterMarkdown
    });
  }

  onProgress?.('全書編撰完成，正在存檔至班級快取...', 95);

  const masterData: MasterTextbookData = {
    classId: cId,
    generation: genId,
    chapters,
    generatedAt: Date.now(),
    totalWords: chapters.reduce((acc, c) => acc + c.content.length, 0)
  };

  await saveMasterTextbook(cId, genId, masterData);
  onProgress?.('專書發布成功！全班學員已可隨時列印專屬手冊。', 100);

  return masterData;
}

