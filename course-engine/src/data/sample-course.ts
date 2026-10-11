import { Course } from '../types/course';

export const sampleCourse: Course = {
  id: 'split-modular-demo',
  title: 'SPLIT 需求分解的技術 (模組化展示課程)',
  subtitle: '從敏捷概念、故事地圖到任務拆解的互動演練手冊',
  description: '此為示範通用課程引擎所產生的範例課程，包含標準投影片講義頁與小組演練任務頁。',
  instructor: 'AgileTalks 講師群',
  version: '1.0.0',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  modules: [
    {
      id: 'M1-Essential',
      code: 'E',
      title: 'Essential 敏捷需求基本概念',
      description: '建立敏捷需求、DoD、DoR 與共同語言',
      color: 'emerald',
    },
    {
      id: 'M2-Structure',
      code: 'S',
      title: 'Structure 結構化拆解',
      description: '從結構與價值脈絡整理 Product Backlog',
      color: 'amber',
    },
    {
      id: 'M3-Task',
      code: 'T',
      title: 'Task 轉化可執行任務',
      description: '將需求進一步落實為小組可認領的實戰卡片',
      color: 'indigo',
    }
  ],
  slides: [
    {
      id: 'slide-1',
      pageNumber: 1,
      moduleId: 'M1-Essential',
      title: '課程首頁：SPLIT 敏捷需求拆解',
      subtitle: '建立跨職能團隊對價值的共同認知',
      kind: 'lecture',
      keywords: ['SPLIT', '敏捷', '需求分析'],
      lecture: {
        imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1400&q=80',
        notePrompt: '🎯 本頁反思：你目前在專案中遇到最大的需求模糊或溝通痛點是什麼？',
        notePlaceholder: '記錄你的觀察與痛點...',
        caseEnabled: false,
      }
    },
    {
      id: 'slide-2',
      pageNumber: 2,
      moduleId: 'M1-Essential',
      title: 'Ready 與 Done 的定義 (DoR vs DoD)',
      subtitle: '團隊的品質防護網與協作承諾',
      kind: 'lecture',
      keywords: ['DoR', 'DoD', 'INVEST'],
      lecture: {
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80',
        notePrompt: '💡 講師提問：團隊在沒有 DoR 的情況下開始衝刺（Sprint），通常會發生什麼代價？',
        notePlaceholder: '請寫下 1~2 個過往常見的踩坑經歷...',
        caseEnabled: true,
        casePrompt: '【案例練習】請為你的專案訂出 3 條最關鍵的 Definition of Ready (DoR)：',
        casePlaceholder: '1. 具備明確的驗收標準 (AC)\n2. UI Wireframe 已對齊\n3. 後端 API 規格確認',
      }
    },
    {
      id: 'slide-3',
      pageNumber: 3,
      moduleId: 'M2-Structure',
      title: '實戰演練：繪製用戶故事地圖 (Story Mapping)',
      subtitle: '小組協作任務',
      kind: 'task',
      keywords: ['小組實作', 'Story Map', 'MVP'],
      task: {
        taskBadge: 'TASK 01',
        durationMinutes: 25,
        scenario: '團隊正面臨新產品「外送拼單」上線壓力，功能需求過多無法在第一期全部交付。',
        objective: '梳理核心使用者的主幹路徑（User Backbone），並劃分出 MVP 釋出切線。',
        steps: [
          '步驟 1：各組推派一人開啟協作白板。',
          '步驟 2：水平展開使用者的操作時間軸（登入 -> 選擇餐廳 -> 建立拼單 -> 分帳結帳）。',
          '步驟 3：由上往下根據重要性排列功能卡片。',
          '步驟 4：畫出第一期 MVP 切線並標記理由。'
        ],
        deliverable: '小組白板上需有一條清晰的 User Journey 與至少一條標註完成的 MVP 切線。',
        whiteboardUrl: 'https://miro.com',
      }
    }
  ]
};
