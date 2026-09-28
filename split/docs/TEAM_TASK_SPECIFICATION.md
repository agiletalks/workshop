# SPLIT 模組 3：Team Task 團隊演練頁面動態插入與小組協作規格書

> **文件版本**：v1.0  
> **適用專案**：SPLIT 需求拆解工作坊 (`workshop/split/`)  
> **雙向用途**：供 DEV 開發實作與 QA 驗收測試之共同依據  

---

## 壹、功能目標與商業場景

在 SPLIT 需求拆解實戰工作坊進行過程中，講師需依據各梯次學員背景與進度，在既有的 24 頁官方教材卡片之間，**彈性插入專屬的「團隊演練 (Team Task)」頁面**。

### 核心使用者流程：
1. **講師端（In-App 動態管理）**：
   - 講師以 `role: 'instructor'` 身分登入講義。
   - 在左側章節導航或頂部導覽列，可隨時在任兩頁之間點擊「➕ 插入團隊演練」，填寫任務情境、目標、執行步驟、時限與交付標準。
   - 支援「儲存發布」、「編輯內容」、「一鍵啟用/停用」與「刪除」。
2. **學員端（即時感知與雙欄實作）**：
   - 全班學員的講義畫面**無須手動重新整理（No-reload）**，即時在指定位置動態插入該演練頁。
   - **左欄（任務指令看板）**：清楚閱讀任務背景、目標、執行步驟、產出要求，並可一鍵複製課堂 AI 提示詞。
   - **右欄（小組協作與成果庫）**：
     - **隨堂筆記區**：組內共享，**一次一人主筆（35s 租約鎖保護，防打字互踩）**，800ms 即時文字同步廣播。
     - **成果上傳區**：**同組每位學員皆可上傳**自己的白板截圖、設計稿或成果檔案，所有人即時可見、點擊縮圖打開 Lightbox 放大預覽。

---

## 貳、技術架構與資料合約

### 一、資料庫集合與路徑約定 (Firestore)
- **班級自訂演練集合**：
  `split_classes/{classId}/custom_tasks/{taskId}`
- **小組演練成果與隨堂筆記路徑（與模組 4 統一）**：
  `split_data/{classId}/generations/{generationId}/notes/{taskId}_team_{teamId}`

### 二、資料型別定義 (`TeamTaskItem`)
```ts
export interface TeamTaskItem {
  id: string;                    // 唯一任務識別碼 (如 "task_1790580001_dor")
  classId: string;               // 所屬班級代碼
  insertAfterSlideId: string;    // 插入位置：指定在某個 slideId 之後 (如 "slide-3")
  title: string;                 // 任務標題 (如 "【團隊演練 1】制定小組的 DoR 與 DoD")
  subtitle?: string;             // 副標題 (如 "Module 1 · 敏捷基本概念實戰")
  module: string;                // 所屬單元 (如 "module-1")
  durationMinutes: number;       // 演練時限 (如 15 分鐘)
  badge: string;                 // 類型標籤 (如 "小組討論 & 成果上傳")
  scenario: string;              // 任務情境背景描述
  objective: string;             // 核心挑戰目標
  steps: string[];               // 執行步驟清單 (陣列)
  deliverable: string;           // 交付成果驗收標準
  prompts: string[];             // 課堂 AI 提示詞清單 (支援一鍵複製)
  whiteboardType?: string;       // 是否連動專屬白板 ("main" | "wbs" | "story-map" | "impact-map")
  isActive: boolean;             // 是否啟用 (true: 插入顯示; false: 暫時隱藏)
  createdAt: number;             // 建立時間戳記
  updatedAt: number;             // 更新時間戳記
}
```

### 三、動態投影片清單合併演算法 (`mergeCustomTasksIntoSlides`)
前端在初始化與監聽時，將**靜態官方教材 (`slides.ts`)** 與 **班級動態任務 (`customTasks`)** 進行即時編排：
```ts
export function mergeSlidesWithTasks(staticSlides: Slide[], customTasks: TeamTaskItem[]): Slide[] {
  const result: Slide[] = [];
  const activeTasks = customTasks.filter(t => t.isActive);

  for (const slide of staticSlides) {
    result.push(slide);
    // 找出所有指定在此 slide 之後插入的 active task
    const tasksToInsert = activeTasks.filter(t => t.insertAfterSlideId === slide.id);
    for (const task of tasksToInsert) {
      result.push(convertTaskToSlide(task));
    }
  }
  return result;
}
```

---

## 參、前端 UI 與互動規格

### 一、講師端：In-App 任務管理與編輯器
- **權限控制**：僅在 `userSession.role === 'instructor'` 時顯示管理功能。
- **操作進入點**：
  1. 單元側邊欄（Sidebar）：每張投影片下方提供小巧的 `[+ 插入演練]` 按鈕。
  2. 頂部工具列（TopBar）：提供「📋 演練清單管理」快捷入口。
  3. 當前演練頁面左上方：提供「✏️ 編輯演練」與「🗑️ 停用/刪除」按鈕。
- **編輯表單控制項**：
  - 插入錨點（下拉選單選擇 `insertAfterSlideId`）。
  - 任務名稱、建議分鐘數、標籤。
  - 情境背景（多行文字）、目標（多行文字）。
  - 步驟清單（支援動態新增、刪除、拖曳上下移順序）。
  - 交付標準要求、AI 提示詞、白板連動類型切換。
  - 「立即啟用此任務」核取方塊。

### 二、學員端：左側【TeamTaskBriefPanel 任務指令卡】
- 取代傳統靜態圖片，渲染沉浸式任務看板：
  - **頂部 Header**：🎯 任務標籤、演練建議時間徽章（`⏱️ 15 分鐘`）、標題與副標題。
  - **情境卡片 (Scenario)**：藍灰色背景，呈現該題的業務背景脈絡。
  - **目標卡片 (Objective)**：強調文字，明確告知小組本次討論要達成什麼共識。
  - **步驟清單 (Steps)**：帶圓圈號碼（1, 2, 3...）的排版，清楚導引討論流程。
  - **產出標準 (Deliverable)**：醒目提示「請於右側記錄共識，並上傳作品截圖」。
  - **工具列按鈕**：
    - 「🤖 一鍵複製 AI 提示詞」
    - 「🎨 開啟專屬小組協作白板」（若有設定 `whiteboardType`）

### 三、學員端：右側【WorkbookPanel 演練成果面板】
- **小組隨堂筆記（一次一人主筆）**：
  - 採用模組 4 租約鎖：學員獲得焦點時爭取鎖（Lease 35s），心跳 15s 續約。
  - 同組其他學員呈現唯讀鎖定條：`🔒 組員【小明】正在編輯中 (35 秒租約保護中)`，點擊 `[🙋 爭取編輯權]` 可接手。
  - 打字即時雲端廣播（800ms debounce），同組學員無刷新看見文字。
- **小組成果上傳庫（每位成員皆可上傳）**：
  - 同組學員均可點擊 `[+ 上傳附件]`，上傳截圖或文件（小於 800KB 防呆）。
  - 作品列表即時同步呈現給全組。
  - 點擊圖片縮圖立即打開 Lightbox 全螢幕放大檢視；點擊檔案圖示觸發下載。
  - 觀摩他組（`activeTeamId !== userSession.teamId`）自動切為唯讀，只能觀摩他組成果，無法篡改。

---

## 肆、DEV 與 QA 驗收測試情境矩陣 (Test Scenarios Matrix)

| 案例編號 | 測試場景 | 操作步驟 | 預期結果 |
|---|---|---|---|
| **TC-TT-01** | **講師端 In-App 建立任務** | 講師身分登入，於 `slide-3` 點擊「+ 插入演練」，填寫 DoR/DoD 演練規格並儲存。 | 1. 成功寫入 `split_classes/{classId}/custom_tasks/{taskId}`。<br>2. 講師畫面側邊欄與投影片順序立即在 `slide-3` 後面出現該任務頁面。<br>3. 控制台 0 錯誤。 |
| **TC-TT-02** | **全班多學員即時無刷新感知 (No-reload Sync)** | 視窗 A 為學員（小明），停留在普通投影片。講師於視窗 B 發布新演練。 | 1. 視窗 A 的側邊欄與頁面清單**在未手動重新整理的狀況下，即時多出該演練頁面**。<br>2. 點擊該單元可順暢進入。 |
| **TC-TT-03** | **左側任務看板完整呈現** | 進入該 Team Task 頁面。 | 1. 左側完整呈現情境、目標、步驟 1~3、時限徽章與交付要求。<br>2. 點擊「一鍵複製 AI 提示詞」，剪貼簿成功取得該提示詞文字並提示成功。 |
| **TC-TT-04** | **右側隨堂筆記主筆租約鎖定** | 視窗 A（第 1 組 · 小明）點擊右側筆記輸入框打字。視窗 B（第 1 組 · 小華）同時檢視該頁。 | 1. 視窗 A 獲得編輯鎖，頂部顯示心跳續約中。<br>2. 視窗 B 輸入框變為唯讀，上方浮現「🔒 組員【小明】正在編輯中 (35 秒租約保護中)」。<br>3. 視窗 A 打字，視窗 B 即時同步顯示文字。 |
| **TC-TT-05** | **右側小組成果多人各自上傳** | 視窗 A 上傳「小明白板截圖.png」；視窗 B 同時上傳「小華驗收標準.pdf」。 | 1. 兩端作品列表即時出現這兩份檔案。<br>2. 視窗 B 點擊小明的截圖，Lightbox 成功彈出放大。<br>3. 視窗 A 點擊小華的 PDF，觸發檔案下載。 |
| **TC-TT-06** | **跨組觀摩唯讀防護** | 視窗 C（第 2 組學員）將組別選單切換至「第 1 組 (觀摩)」。 | 1. 視窗 C 進入唯讀觀摩模式。<br>2. 視窗 C 可看見第 1 組的筆記與上傳成果，但輸入框與上傳按鈕皆禁用，無法篡改他組作品。 |
| **TC-TT-07** | **講師編輯與一鍵停用 (Toggle Active)** | 講師打開演練編輯器，將「啟用狀態」勾選取消並儲存。 | 1. 全班所有學員畫面上的該演練頁面即時隱藏。<br>2. 原本前後投影片順序無縫自動銜接，無殘留空白頁或報錯。 |

---

## 伍、結案交付成果清單

完成此模組後，應具備以下交付成果：
1. **原始碼**：
   - 服務層：`split/src/services/customTasksService.ts`
   - 管理元件：`split/src/components/TaskEditorModal.tsx`
   - 任務看板：`split/src/components/TeamTaskBriefCard.tsx`
   - 整合模組：`App.tsx`、`SlideViewer.tsx`、`WorkbookPanel.tsx`、`ModuleSidebar.tsx`
2. **QA 交付**：
   - 依協同機制產出 `QA_BRIEF_MODULE3_TEAM_TASK.md` 移交 QA 執行雙視窗 E2E 驗收。
