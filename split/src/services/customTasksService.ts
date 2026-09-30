import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import type { Slide, TeamTaskConfig } from '../data/slides';

export interface TeamTaskItem {
  id: string;                    // 唯一任務識別碼 (如 "task_1790580001_dor")
  classId: string;               // 所屬班級代碼
  insertAfterSlideId: string;    // 插入位置：指定在某個 slideId 之後 (如 "slide-3")
  title: string;                 // 任務標題
  subtitle?: string;             // 副標題
  moduleId: "E" | "S" | "P" | "L" | "I" | "T"; // 所屬單元
  durationMinutes: number;       // 演練時限 (如 15 分鐘)
  badge: string;                 // 類型標籤 (如 "小組討論 & 成果上傳")
  scenario: string;              // 任務情境背景描述
  objective: string;             // 核心挑戰目標
  steps: string[];               // 執行步驟清單
  deliverable: string;           // 交付成果驗收標準
  prompts: string[];             // 課堂 AI 提示詞清單
  whiteboardType?: string;       // 是否連動專屬白板 ("main" | "wbs" | "story-map" | "impact-map")
  isActive: boolean;             // 是否啟用 (true: 插入顯示; false: 暫時隱藏)
  createdAt: number;             // 建立時間戳記
  updatedAt: number;             // 更新時間戳記
}

/**
 * 監聽指定班級的自訂演練任務清單 (自動將 classId 正規化以防止大小寫路徑不一致)
 * 路徑：split_classes/{classId}/custom_tasks
 */
export function subscribeCustomTasks(
  classId: string,
  onData: (tasks: TeamTaskItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db || !classId) return null;
  const normalizedClassId = classId.trim().toLowerCase();

  const colRef = collection(db, 'split_classes', normalizedClassId, 'custom_tasks');

  return onSnapshot(
    colRef,
    (snap) => {
      const list: TeamTaskItem[] = [];
      snap.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          classId: d.classId || normalizedClassId,
          insertAfterSlideId: d.insertAfterSlideId || '',
          title: d.title || '未命名團隊演練',
          subtitle: d.subtitle || '',
          moduleId: (d.moduleId || 'E') as "E" | "S" | "P" | "L" | "I" | "T",
          durationMinutes: Number(d.durationMinutes) || 15,
          badge: d.badge || '小組演練',
          scenario: d.scenario || '',
          objective: d.objective || '',
          steps: Array.isArray(d.steps) ? d.steps : [],
          deliverable: d.deliverable || '',
          prompts: Array.isArray(d.prompts) ? d.prompts : [],
          whiteboardType: d.whiteboardType || undefined,
          isActive: d.isActive !== false,
          createdAt: Number(d.createdAt) || Date.now(),
          updatedAt: Number(d.updatedAt) || Date.now()
        });
      });

      // 依建立時間排序
      list.sort((a, b) => a.createdAt - b.createdAt);
      onData(list);
    },
    (err) => {
      console.error('[subscribeCustomTasks] error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * 手動單次拉取自訂演練任務 (支援目錄就地「🔄 同步最新任務」按鈕，免重新整理整頁)
 */
export async function fetchCustomTasks(classId: string): Promise<TeamTaskItem[]> {
  if (!db || !classId) return [];
  const normalizedClassId = classId.trim().toLowerCase();
  const colRef = collection(db, 'split_classes', normalizedClassId, 'custom_tasks');
  const snap = await getDocs(colRef);
  const list: TeamTaskItem[] = [];
  snap.forEach((docSnap) => {
    const d = docSnap.data();
    list.push({
      id: docSnap.id,
      classId: d.classId || normalizedClassId,
      insertAfterSlideId: d.insertAfterSlideId || '',
      title: d.title || '未命名團隊演練',
      subtitle: d.subtitle || '',
      moduleId: (d.moduleId || 'E') as "E" | "S" | "P" | "L" | "I" | "T",
      durationMinutes: Number(d.durationMinutes) || 15,
      badge: d.badge || '小組演練',
      scenario: d.scenario || '',
      objective: d.objective || '',
      steps: Array.isArray(d.steps) ? d.steps : [],
      deliverable: d.deliverable || '',
      prompts: Array.isArray(d.prompts) ? d.prompts : [],
      whiteboardType: d.whiteboardType || undefined,
      isActive: d.isActive !== false,
      createdAt: Number(d.createdAt) || Date.now(),
      updatedAt: Number(d.updatedAt) || Date.now()
    });
  });
  list.sort((a, b) => a.createdAt - b.createdAt);
  return list;
}

/**
 * 儲存或更新自訂演練任務
 */
export async function saveCustomTask(
  classId: string,
  task: Omit<TeamTaskItem, 'classId' | 'updatedAt'> & { classId?: string; updatedAt?: number }
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const normalizedClassId = classId.trim().toLowerCase();
  const taskId = task.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const docRef = doc(db, 'split_classes', normalizedClassId, 'custom_tasks', taskId);

  const payload: Record<string, any> = {
    id: taskId,
    classId: normalizedClassId,
    insertAfterSlideId: task.insertAfterSlideId || 'START',
    title: task.title || '',
    subtitle: task.subtitle || '',
    moduleId: task.moduleId || 'E',
    durationMinutes: Number(task.durationMinutes) || 15,
    badge: task.badge || '小組演練',
    scenario: task.scenario || '',
    objective: task.objective || '',
    steps: Array.isArray(task.steps) ? task.steps : [],
    deliverable: task.deliverable || '',
    prompts: Array.isArray(task.prompts) ? task.prompts : [],
    isActive: task.isActive !== false,
    createdAt: task.createdAt || Date.now(),
    updatedAt: Date.now()
  };

  if (task.whiteboardType) {
    payload.whiteboardType = task.whiteboardType;
  }

  // 清除任何可能為 undefined 的屬性，確保 100% Firestore SDK 相容
  const cleanPayload: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      cleanPayload[key] = value;
    }
  }

  await setDoc(docRef, cleanPayload, { merge: true });
  return taskId;
}

/**
 * 刪除自訂演練任務
 */
export async function deleteCustomTask(
  classId: string,
  taskId: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const normalizedClassId = classId.trim().toLowerCase();
  const docRef = doc(db, 'split_classes', normalizedClassId, 'custom_tasks', taskId);
  await deleteDoc(docRef);
}

/**
 * 將單一自訂任務轉換為相容的 Slide 物件
 */
export function convertCustomTaskToSlide(task: TeamTaskItem): Slide {
  const teamTaskConfig: TeamTaskConfig = {
    durationMinutes: task.durationMinutes,
    badge: task.badge,
    scenario: task.scenario,
    objective: task.objective,
    steps: task.steps,
    deliverable: task.deliverable,
    prompts: task.prompts,
    whiteboardType: task.whiteboardType
  };

  return {
    id: task.id,
    page: 0, // 動態編號，合併時重新計算
    moduleId: task.moduleId,
    title: task.title,
    subtitle: task.subtitle || `⏱️ 建議時間：${task.durationMinutes} 分鐘`,
    image: '', // Task 使用專屬 TeamTaskBriefCard 渲染，不依賴靜態圖片
    type: 'core',
    slideKind: 'task',
    teamTask: teamTaskConfig,
    toolName: '團隊演練',
    learningPurpose: task.objective,
    notePrompt: task.deliverable,
    notePlaceholder: '請在此記錄小組討論結論與共識，全員皆可於下方上傳成果……',
    caseEnabled: false,
    showInProgress: true,
    allowNote: true
  };
}

/**
 * 將官方靜態投影片與自訂演練任務動態合併
 * 依據 insertAfterSlideId 依序插入，並動態賦予 page 序號
 */
export function mergeSlidesWithCustomTasks(
  staticSlides: Slide[],
  customTasks: TeamTaskItem[]
): Slide[] {
  const result: Slide[] = [];
  const activeTasks = customTasks.filter((t) => t.isActive);
  const insertedTaskIds = new Set<string>();

  // 整理以 slideId 為 key 的插入映射表
  const tasksMap = new Map<string, TeamTaskItem[]>();
  for (const task of activeTasks) {
    const rawKey = (task.insertAfterSlideId || 'START').trim();
    if (!tasksMap.has(rawKey)) {
      tasksMap.set(rawKey, []);
    }
    tasksMap.get(rawKey)!.push(task);
  }

  // 1. 若有指定插入在開頭的任務 (START, start, 0, slide-0)
  const startKeys = ['START', 'start', '0', 'slide-0', 'slide-00'];
  for (const k of startKeys) {
    if (tasksMap.has(k)) {
      for (const task of tasksMap.get(k)!) {
        if (!insertedTaskIds.has(task.id)) {
          result.push(convertCustomTaskToSlide(task));
          insertedTaskIds.add(task.id);
        }
      }
    }
  }

  // 2. 遍歷靜態投影片並按順序插入
  for (const slide of staticSlides) {
    result.push(slide);

    // 比對此 slide.id 的所有可能鍵 (例如 slide-1, slide-01, 1 等)
    const possibleKeys = [
      slide.id,
      slide.id.toLowerCase(),
      slide.id.replace('slide-0', 'slide-'),
      slide.id.replace('slide-', ''),
      String(slide.page)
    ];

    for (const key of possibleKeys) {
      if (tasksMap.has(key)) {
        for (const task of tasksMap.get(key)!) {
          if (!insertedTaskIds.has(task.id)) {
            result.push(convertCustomTaskToSlide(task));
            insertedTaskIds.add(task.id);
          }
        }
      }
    }
  }

  // 3. 防呆兜底：若有尚未插入的有效任務（例如所指定的錨點投影片找不到），依單元追加在該單元結尾或教材末尾，絕不遺失！
  for (const task of activeTasks) {
    if (!insertedTaskIds.has(task.id)) {
      const lastModIndex = result.map(s => s.moduleId).lastIndexOf(task.moduleId);
      if (lastModIndex !== -1) {
        result.splice(lastModIndex + 1, 0, convertCustomTaskToSlide(task));
      } else {
        result.push(convertCustomTaskToSlide(task));
      }
      insertedTaskIds.add(task.id);
    }
  }

  // 4. 重新編排整體 page 頁碼 (保持 1-indexed)
  return result.map((s, index) => ({
    ...s,
    page: index + 1
  }));
}

