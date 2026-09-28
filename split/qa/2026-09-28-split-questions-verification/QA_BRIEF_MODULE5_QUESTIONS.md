# 【QA 驗收需求委託書】SPLIT 模組 5：課堂提問功能驗收

> **交付時間**：2026-09-28  
> **交付對象**：AgileTalks 中央 QA 驗收工程師  
> **交付模組**：SPLIT 模組 5（課堂提問功能，原稱提問便利貼，現已全面更名為「提問」）  
> **專案路徑**：`workshop/split/`  
> **測試報告預期路徑**：`split/qa/2026-09-28-split-questions-verification/reports/QA_VERIFICATION_MODULE5_QUESTIONS.md`  

---

## 一、功能背景與商業價值

在敏捷需求拆解工作坊（SPLIT）進行過程中，各組學員在演練投影片與實作案例時隨時會產生技術與觀念疑問。
本模組提供**即時課堂提問與班級互動功能**，學員可在任一投影片頁面向全班提出問題，其他學員可附議（+1），講師可即時解答。
所有提問均與班級、世代及投影片綁定，並隨中央後台世代遞增自動隔離。

---

## 二、用字規範紅線（重要審查項目）

> [!IMPORTANT]
> **本模組用字必須全面採用「提問」或「課堂提問」，嚴禁出現「便利貼」或「提問便利貼」字眼！**  
> 請 QA 團隊在介面 UI、按鈕、提示文字、Tooltip 等各處進行嚴格文字審查。

---

## 三、技術架構與資料合約

- **資料庫路徑**：
  `split_data/{classId}/generations/{generationId}/questions/{questionId}`
- **資料結構合約 (`QuestionItem`)**：
  ```ts
  export interface QuestionItem {
    id: string;              // 唯一問題識別碼 (如 q_1790571001301_xxxx)
    classId: string;         // 班級代碼 (如 qa-split-test-01)
    generation: number;      // 課程世代 (如 1)
    slideId: string;         // 提問時所屬的投影片 ID (如 split-05)
    authorName: string;      // 發問學員姓名 (如 小明)
    authorTeam: number;      // 發問學員所屬組別 (如 1)
    authorUid?: string;      // 發問者使用者 UID
    question: string;        // 提問內容文字
    answer?: string;         // 講師解答文字
    answeredAt?: number;     // 解答時間戳記
    isAnswered: boolean;     // 是否已解答 (true/false)
    upvotes: number;         // 附議累計數
    upvotedBy: string[];     // 已附議者 UID 清單 (防止重複 +1)
    createdAt: number;       // 建立時間戳記
  }
  ```
- **核心原始碼檔案**：
  - 服務層：[`split/src/services/questionService.ts`](file:///c:/Antigravity/workshop/split/src/services/questionService.ts)
  - 抽屜元件：[`split/src/components/QuestionsDrawer.tsx`](file:///c:/Antigravity/workshop/split/src/components/QuestionsDrawer.tsx)
  - 介面整合：[`split/src/App.tsx`](file:///c:/Antigravity/workshop/split/src/App.tsx) 與 [`split/src/components/TopBar.tsx`](file:///c:/Antigravity/workshop/split/src/components/TopBar.tsx)

---

## 四、核心驗收案例與檢查要點

### 測試環境與準備
- 本地測試伺服器：`http://localhost:5000/workshop/split/`（或 Vite `http://localhost:5173/`）
- 測試專用班級代碼：`qa-split-test-01`
- 驗證工具建議：Playwright / Puppeteer 雙 Context 瀏覽器模擬

---

### 【案例 1】學員發布提問（UI 與資料寫入）
1. 學員進入系統（班級：`qa-split-test-01`，第 1 組，姓名：`小明`）。
2. 切換至任一投影片（例如 `split-05`）。
3. 點擊頂部「💬 提問」按鈕或右下角常駐浮動按鈕（FAB），開啟右側提問抽屜。
4. **檢查點**：
   - 底部身分提示正確顯示：「📝 以 第 1 組 · 小明 發問，標記於本頁: split-05」。
   - 輸入空白問題時無法送出（防呆）。
   - 輸入問題文字（如「如何辨識過度拆解的 User Story？」）並點擊送出。
   - 提問卡片立即呈現於列表頂部，預設標記為「⌛ 待解答」，附議數為 0。
   - 頂部與右下角按鈕之待解答黃色徽章數字即時 +1。

---

### 【案例 2】附議防重複切換 (+1 與取消)
1. 在同一提問卡片上，點擊「👍 0 附議」按鈕。
2. **檢查點**：
   - 附議數遞增為「👍 1」，按鈕呈現 Teal 高亮啟用狀態。
   - 資料庫中 `upvotedBy` 陣列包含目前學員 UID。
3. 再次點擊該按鈕。
4. **檢查點**：
   - 附議取消，數值減回「👍 0」，按鈕回復一般未點擊狀態。
   - 不會發生點擊多次導致數值無限膨脹的漏洞。

---

### 【案例 3】多視窗跨學員即時無刷新廣播 (Real-time Sync)
> **強烈建議使用 Playwright 啟動 2 個獨立 Context 執行 E2E 模擬**
1. 視窗 A：登入為「第 1 組 · 小明」。
2. 視窗 B：登入為「第 2 組 · 小華」。
3. 兩者均打開提問抽屜。
4. 視窗 A 送出新提問。
5. **檢查點**：
   - 視窗 B 在**未重新整理頁面**的情況下，即時收到並渲染視窗 A 的新提問。
6. 視窗 B 在該提問點擊 👍 附議。
7. **檢查點**：
   - 視窗 A 畫面上的附議計數即時跳為 1。
   - 擷取雙視窗同步截圖留存於 `evidence/`。

---

### 【案例 4】範圍過濾、狀態篩選與熱門排序
1. 建立屬於不同投影片（例如 `split-03` 與 `split-05`）的提問。
2. 切換「全班提問」vs「本頁提問」：
   - 驗證本頁提問僅展示與當前投影片 ID 相符之問題。
3. 點擊問題卡片上的「頁面: split-XX」標籤：
   - 驗證背景主畫面是否順暢跳轉至該投影片。
4. 切換「全部」、「待解答」、「已解答」狀態標籤：
   - 驗證已解答/未解答清單過濾正確。
5. 切換排序為「最多附議 👍」：
   - 驗證被多數人 +1 的問題自動排在最上方。

---

### 【案例 5】講師解答與狀態流轉
1. 以講師身分（`userSession.role === 'instructor'`）登入，或在問題卡片下方點擊「✍️ 立即回覆此提問」。
2. 輸入解答文字（如「建議透過 INVEST 原則檢視...」）並送出。
3. **檢查點**：
   - 問題狀態由「⌛ 待解答」即時變為「✓ 已解答」。
   - 卡片下方展開「💡 講師回覆」區塊。
   - 待解答計數徽章相應減 1。

---

### 【案例 6】介面用字合規審查
1. 檢查抽屜標題、按鈕文字、Placeholder、狀態標籤。
2. **檢查點**：
   - 全面使用「提問」、「課堂提問」、「新增提問」、「送出提問」。
   - **完全無**「便利貼」、「提問便利貼」字眼。

---

## 五、預期交付物

請 QA 驗收工程師完成測試後，於本目錄產出：
1. **驗收報告**：`split/qa/2026-09-28-split-questions-verification/reports/QA_VERIFICATION_MODULE5_QUESTIONS.md`
2. **測試證據**：放置於 `split/qa/2026-09-28-split-questions-verification/evidence/`（包含雙視窗即時同步截圖、發問截圖、控制台日誌）。
3. **自動化腳本**（若有撰寫）：放置於 `split/qa/2026-09-28-split-questions-verification/scripts/`。
