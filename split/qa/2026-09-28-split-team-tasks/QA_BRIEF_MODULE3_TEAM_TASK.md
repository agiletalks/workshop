# 【QA 驗收需求委託書】SPLIT 模組 3：Team Task 團隊演練頁面動態插入與小組協作系統

> **交付時間**：2026-09-28  
> **交付對象**：AgileTalks 中央 QA 驗收工程師  
> **交付模組**：SPLIT 模組 3（Team Task 團隊演練頁面動態插入、講師 In-App 管理、左側任務卡與右側組內筆記/上傳協作）  
> **基準 Commit**：`be97faf`  
> **專案路徑**：`workshop/split/`  
> **測試報告預期路徑**：`split/qa/2026-09-28-split-team-tasks/reports/QA_VERIFICATION_R1_module3_team_tasks_be97faf_20260928.md`  

---

## 一、功能背景與商業價值

在 AgileTalks SPLIT 需求拆解實戰工作坊中，講師需要因應學員吸收程度，**隨時在既有的 24 頁講義之間插入團隊演練頁面（Team Task）**。
學員在插入的演練頁面上：
1. **左側 (教材/投影區)**：顯示任務說明（情境背景、挑戰目標、步驟指引、驗收成果、課堂 AI 提示詞一鍵複製、專屬雲端白板連動）。
2. **右側 (小組實作區)**：進行小組隨堂筆記（一次一人主筆，受 35 秒租約鎖保護，即時向組內廣播）與作品成果上傳（同組所有組員皆可各自上傳討論截圖與附件，人人可見）。
3. **動態插入無刷新（No-reload）**：講師一鍵儲存後，全班所有學員端立即在對應投影片後方看見該演練頁面，頁碼自動重編，無需重新整理網頁。

---

## 二、技術架構與資料合約

- **Firestore 集合路徑**：
  - 自訂演練任務定義：`split_classes/{classId}/custom_tasks/{taskId}`
  - 演練專屬筆記與成果附件：`split_data/{classId}/generations/{generationId}/notes/{taskId}_team_{teamId}`（複用模組 4 租約鎖與成果庫機制）
- **演練任務資料結構 (`TeamTaskItem`)**：
  ```ts
  export interface TeamTaskItem {
    id: string;                    // 任務 ID (如 task_1790580001_dor)
    classId: string;               // 班級代碼
    insertAfterSlideId: string;    // 插入位置錨點 (如 slide-3)
    title: string;                 // 任務標題
    subtitle?: string;             // 副標題
    moduleId: "E" | "S" | "P" | "L" | "I" | "T"; // 單元
    durationMinutes: number;       // 時限 (預設 15 分鐘)
    badge: string;                 // 標籤 (預設 "小組討論 & 成果上傳")
    scenario: string;              // 情境背景
    objective: string;             // 挑戰目標
    steps: string[];               // 執行步驟清單
    deliverable: string;           // 交付成果驗收標準
    prompts: string[];             // 課堂 AI 提示詞清單
    whiteboardType?: string;       // 連動白板 ("main" | "wbs" | "story-map" | "none")
    isActive: boolean;             // 是否啟用 (true 插入, false 隱藏)
    createdAt: number;
    updatedAt: number;
  }
  ```
- **核心實作原始碼清單**：
  - 資料型別：[`split/src/data/slides.ts`](file:///c:/Antigravity/workshop/split/src/data/slides.ts)（`TeamTaskConfig`, `slideKind?: "lecture" | "task"`）
  - 服務層與動態合併演算法：[`split/src/services/customTasksService.ts`](file:///c:/Antigravity/workshop/split/src/services/customTasksService.ts)（`subscribeCustomTasks`, `saveCustomTask`, `deleteCustomTask`, `mergeSlidesWithCustomTasks`）
  - 左側任務卡片：[`split/src/components/TeamTaskBriefCard.tsx`](file:///c:/Antigravity/workshop/split/src/components/TeamTaskBriefCard.tsx)
  - 講師 In-App 編輯器：[`split/src/components/TaskEditorModal.tsx`](file:///c:/Antigravity/workshop/split/src/components/TaskEditorModal.tsx)
  - 講義檢視器整合：[`split/src/components/SlideViewer.tsx`](file:///c:/Antigravity/workshop/split/src/components/SlideViewer.tsx)
  - 單元側邊欄導航：[`split/src/components/ModuleSidebar.tsx`](file:///c:/Antigravity/workshop/split/src/components/ModuleSidebar.tsx)
  - 頂端導航條：[`split/src/components/TopBar.tsx`](file:///c:/Antigravity/workshop/split/src/components/TopBar.tsx)
  - 總覽頁面：[`split/src/components/OverviewGrid.tsx`](file:///c:/Antigravity/workshop/split/src/components/OverviewGrid.tsx)
  - 整合入口：[`split/src/App.tsx`](file:///c:/Antigravity/workshop/split/src/App.tsx)

---

## 三、7 大測試情境矩陣 (QA 驗收依據)

請 QA 工程師參照詳細規格書 [`split/docs/TEAM_TASK_SPECIFICATION.md`](file:///c:/Antigravity/workshop/split/docs/TEAM_TASK_SPECIFICATION.md) 與下列 7 大場景進行雙視窗 E2E 驗收：

| 情境編號 | 測試情境 | 驗收核心驗證點 | 預期結果 |
|---|---|---|---|
| **TC-TASK-01** | 講師 In-App 建立演練任務 | 講師角色進入系統，點擊頂部或側欄 `[🎯 + 演練]`，填寫完整欄位並儲存 | 儲存後 modal 關閉，自動切換至新任務頁面，左側顯示 TeamTaskBriefCard |
| **TC-TASK-02** | 學員端無刷新（No-reload）即時同步插入 | 開啟雙視窗：視窗 A 為講師新增演練；視窗 B 為學員端（不動、無刷新） | 視窗 B 在 1 秒內側邊欄與頁面自動出現新演練項目（🎯 標記），總頁數從 24 變 25 |
| **TC-TASK-03** | 頁碼動態重編與導航跳轉 | 插入於 `slide-3` 後，檢查該任務頁碼與後續既有頁面頁碼 | 新任務頁碼為 4；原本的頁碼 4 順延為 5；上一頁/下一頁流暢銜接無跳錯 |
| **TC-TASK-04** | 左側任務卡功能（AI提示詞複製 & 白板連動） | 點擊「一鍵複製」AI 提示詞按鈕；點擊「開啟本組演練白板」按鈕 | 提示詞成功寫入剪貼簿（顯示勾勾回饋）；白板另開新分頁且帶入正確 `team` 參數 |
| **TC-TASK-05** | 右側隨堂筆記組內協同（35s 租約鎖保護） | 視窗 A (第 1 組小明) 在演練頁面點擊輸入筆記；視窗 B (第 1 組小華) 同時檢視 | 視窗 A 取得編輯鎖；視窗 B 即時被鎖定並顯示「小明 正在編輯中...」與爭取編輯權按鈕 |
| **TC-TASK-06** | 右側成果檔案人人皆可上傳 | 視窗 A (小明) 上傳截圖 A；視窗 B (小華) 上傳截圖 B | 兩端附件清單即時同步出現截圖 A 與截圖 B，兩人皆可點擊下載或預覽 |
| **TC-TASK-07** | 講師編輯與停用/刪除演練任務 | 講師點擊「編輯演練任務」，修改時限為 25 分鐘或刪除該任務 | 修改即時反映至所有學員端；刪除後教材自動回縮為 24 頁，已寫筆記安全保留於後端 |

---

## 四、DEV 自測通過證據

- **自動化測試指令**：
  `node split/scratch/test-custom-tasks.cjs`
- **執行結果摘要**：
  - ✔ 測試 1 PASS: 自訂演練寫入成功，Firestore Rules 權限驗證通過！
  - ✔ 測試 2 PASS: 成功讀取演練任務「【實戰演練】INVEST 原則驗證與拆解」，時限 20 分鐘，步驟數 3
  - ✔ 測試 3 PASS: 動態插入在 slide-3 之後成功！頁碼分佈: 1:slide-1 -> 2:slide-2 -> 3:slide-3 -> 4:task_test_invest_01 -> 5:slide-4
  - ✔ 測試 4 PASS: 演練頁面成功連動隨堂筆記與附件，附件數: 1
  - 🎉 **4 項核心自測驗證全數通過 (ALL PASS)**。
- **建置驗證**：
  - `split/` 前端建置：`cmd /c "npm run build"` -> 0 Error (Code 0)
  - 全域打包：`node scripts/build-all.js` -> 0 Error (Code 0)

---

## 五、QA 報告格式規範

請 QA 驗收工程師依據《AgileTalks DEV-QA 協同驗收機制與目錄規範指南》產出標準初次驗收報告：
- 報告路徑：`split/qa/2026-09-28-split-team-tasks/reports/QA_VERIFICATION_R1_module3_team_tasks_be97faf_20260928.md`
- 截圖佐證請存於：`split/qa/2026-09-28-split-team-tasks/evidence/`
