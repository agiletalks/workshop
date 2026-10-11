/**
 * 通用課程與教材規格模型 (Universal Course Content Schema)
 */

export type PageKind = 'lecture' | 'task' | 'divider';

export interface TaskConfig {
  taskBadge?: string;             // 例如: "TASK 01"
  durationMinutes: number;        // 建議演練時間(分鐘)
  scenario: string;               // 任務情境背景
  objective: string;              // 核心挑戰與目標
  steps: string[];                // 操作步驟清單
  deliverable: string;            // 預期產出與驗收標準
  whiteboardUrl?: string;         // Miro / FigJam / Google Slides 外部白板網址
  referenceImages?: string[];     // 參考範例圖檔
}

export interface LectureConfig {
  imageUrl: string;               // 講義投影片圖片 (URL 或 Base64 預覽)
  notePrompt?: string;            // 講師給學員的提問與思考指引
  notePlaceholder?: string;       // 筆記輸入框預設文字
  caseEnabled?: boolean;          // 是否啟用案例演練輸入區
  casePrompt?: string;            // 案例情境提問
  casePlaceholder?: string;       // 案例輸入框預設文字
  referenceImages?: string[];     // 補充範例圖檔
}

export interface CourseSlide {
  id: string;
  pageNumber: number;             // 頁碼 (自動計算或自訂排序)
  moduleId: string;               // 所屬單元 ID
  title: string;                  // 頁面主標題
  subtitle?: string;              // 副標題
  kind: PageKind;                 // 頁面型態: lecture (講義頁) | task (任務頁) | divider (單元分隔頁)
  keywords?: string[];            // 關鍵字標籤
  lecture?: LectureConfig;        // 當 kind === 'lecture' 時的配置
  task?: TaskConfig;              // 當 kind === 'task' 時的配置
}

export interface CourseModule {
  id: string;                     // 單元代號，如 "M1", "M2" 或 "E", "S", "P"
  code: string;                   // 徽章代號，如 "01", "E", "S"
  title: string;                  // 單元名稱
  description?: string;           // 單元介紹與學習目標
  color?: string;                 // 單元代表色 (如 emerald, amber, indigo, sky)
}

export interface Course {
  id: string;                     // 課程唯一代號 (slug，例如: split, ai-arm, design-thinking)
  title: string;                  // 課程全名
  subtitle?: string;              // 課程副標題 / Slogan
  description?: string;           // 課程簡介
  instructor?: string;            // 講師名稱
  version: string;                // 規格版本 (如 "1.0.0")
  createdAt: string;              // 建立時間
  updatedAt: string;              // 最後更新時間
  modules: CourseModule[];        // 單元章節清單
  slides: CourseSlide[];          // 逐頁教材清單 (核心內容)
}

/**
 * 學員作答與筆記紀錄 (相容 SPLIT 原有狀態)
 */
export interface LearnerSlideResponse {
  slideId: string;
  personalNote: string;
  caseResponse: string;
  completed: boolean;
  updatedAt: string;
}

export interface LearnerState {
  courseId: string;
  activeSlideId: string;
  responses: Record<string, LearnerSlideResponse>;
  viewMode: 'split' | 'fullscreen-slide' | 'overview';
}
