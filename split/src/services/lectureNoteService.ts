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
  getDocs,
  setDoc,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

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
  textbookArticle: string;
  updatedAt: number;
  recordedSeconds?: number;
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
  data: Omit<LectureNoteData, 'slideId' | 'updatedAt'>
): Promise<void> {
  const docRef = getLectureNoteDocRef(classId, generation, slideId);
  if (!docRef) return;
  const payload: LectureNoteData = {
    ...data,
    slideId,
    updatedAt: Date.now()
  };
  await setDoc(docRef, payload, { merge: true });
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
): Promise<{ stickies: LectureSticky[]; textbookArticle: string }> {
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
4. 【資產二：詳細解說內容 (textbookArticle)】：
   - 詳細還原上課過程，文字約 400~800 字。
   - 以 Markdown 格式輸出（使用 ###, ####, 條列項目, **粗體強調**, > 重點提醒）。
   - 結構完整包含：Why (核心意圖與為什麼這樣做) + What & How (關鍵概念、步驟作法與實務案例) + 常見誤區與避坑心法。
   - 語氣生動、務實且具啟發性，嚴禁使用任何「AI」、「人工智慧」、「機器人」等詞彙，宛如隨堂小編親自記錄的精彩課堂手冊。

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
    textbookArticle: parsedData.textbookArticle || ''
  };
}
