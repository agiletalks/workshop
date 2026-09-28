# 【QA 驗收需求委託書】SPLIT 模組 4：隨堂筆記多人協同、租約鎖 (Lease Lock) 與附件管理

> **交付時間**：2026-09-28  
> **交付對象**：AgileTalks 中央 QA 驗收工程師  
> **交付模組**：SPLIT 模組 4（隨堂筆記組內多人雲端協作、35 秒租約鎖、心跳續租、搶鎖與附件管理）  
> **專案路徑**：`workshop/split/`  
> **測試報告預期路徑**：`split/qa/2026-09-28-split-notes-collaboration/reports/QA_VERIFICATION_R1_module4_notes_be97faf_20260928.md`  

---

## 一、功能背景與商業價值

在小組進行需求拆解演練時，組內多位學員會同時檢視該頁的隨堂筆記。
為**防止多人同時打字造成資料覆寫踩踏（Race Condition）**，系統導入**分散式租約鎖（Lease-based Lock 35s）與心跳機制**：
1. 一位學員獲取編輯鎖後，同組其他學員立即呈現唯讀保護與持鎖提示橫幅。
2. 持鎖學員每 15 秒心跳自動續約；離開或 35 秒無動作則自動過期釋放。
3. 提供主動「交出編輯權」與其他組員「🙋 爭取編輯權（搶鎖）」機制。
4. 支援組內附檔（圖片、截圖、文件）雲端即時共享與下載。

---

## 二、技術架構與資料合約

- **資料庫路徑**：
  `split_data/{classId}/generations/{generationId}/notes/{slideId}_team_{teamId}`
- **資料結構合約 (`TeamNote` & `NoteLock`)**：
  ```ts
  export interface NoteLock {
    isLocked: boolean;       // 是否鎖定中
    holderUid: string;       // 持有者 UID
    sessionId: string;       // Session ID
    holderName: string;      // 持有者姓名 (如 小明)
    leasedAt: number;        // 取得鎖時間戳
    expiresAt: number;       // 租約到期時間戳 (leasedAt + 35000)
  }

  export interface TeamNote {
    slideId: string;         // 投影片 ID
    teamId: number;          // 組別
    generation: number;      // 班級世代
    memo: string;            // 筆記文字
    lock: NoteLock;          // 租約鎖物件
    attachments: NoteAttachment[]; // 附件清單
    updatedAt: number;
    updatedBy?: string;
  }
  ```
- **核心原始碼檔案**：
  - 服務層：[`split/src/services/notesService.ts`](file:///c:/Antigravity/workshop/split/src/services/notesService.ts)（`acquireNoteLock`, `renewNoteLock`, `releaseNoteLock`, `saveTeamMemo`, `addNoteAttachment`）
  - 面板元件：[`split/src/components/WorkbookPanel.tsx`](file:///c:/Antigravity/workshop/split/src/components/WorkbookPanel.tsx)
  - 狀態管理：[`split/src/App.tsx`](file:///c:/Antigravity/workshop/split/src/App.tsx)

---

## 三、核心驗收案例與檢查要點

### 測試環境與準備
- 本地測試伺服器：`http://localhost:5000/workshop/split/`（或 Vite `http://localhost:5173/`）
- 測試班級代碼：`qa-split-test-01`
- 驗證工具建議：Playwright 雙 Context 瀏覽器模擬（**同組不同學員：視窗 A 為第 1 組小明，視窗 B 為第 1 組小華**）

---

### 【案例 1】取鎖互斥防護（同組並行編輯阻擋）
1. 視窗 A：第 1 組 · 小明，進入 `split-04`，點擊隨堂筆記輸入框（觸發 `onFocus` 取鎖）。
2. **視窗 A 預期**：
   - 頂部浮現綠色持鎖提示：「✍️ 您正在編輯中 (組內即時同步，每 15 秒心跳續約保護)」，附帶「交出編輯權」按鈕。
3. 視窗 B：第 1 組 · 小華，同時開啟 `split-04`。
4. **視窗 B 預期**：
   - 輸入框呈唯讀狀態（disabled）。
   - 上方浮現醒目琥珀色鎖定橫幅：「🔒 組員【小明】正在編輯此頁筆記 (35 秒租約保護中)」，附帶「🙋 爭取編輯權」按鈕。
   - 點擊視窗 B 的輸入框或按鈕，提示鎖定保護中，無法編輯，防踩踏成功。

---

### 【案例 2】即時內容打字同步（雲端即時廣播）
1. 視窗 A 在輸入框中輸入文字：「DoD 是完成的定義，DoR 是準備就緒的定義。」
2. **預期結果**：
   - 視窗 A 輸入時，頂部狀態燈為「同步中...」，800ms debounce 後變為「雲端同步」。
   - **視窗 B 在無重新整理（No-reload）狀態下，即時看到視窗 A 輸入的筆記文字更新**。

---

### 【案例 3】主動交出編輯權與無縫接手
1. 視窗 A 點擊上方「交出編輯權」按鈕（或切換投影片、離開頁面）。
2. **預期結果**：
   - 視窗 A 釋放鎖定。
   - 視窗 B 上方的鎖定橫幅即時消失。
   - 視窗 B 點擊輸入框，自動成功取得編輯權，由小華接手編輯。

---

### 【案例 4】租約逾期自動釋放與搶鎖驗證 (Lease Timeout)
1. 視窗 A 取得鎖後，模擬視窗 A 關閉或網路斷線，靜置 35 秒以上（租約到期）。
2. 視窗 B 點擊「🙋 爭取編輯權」。
3. **預期結果**：
   - 系統判定租約已過期，視窗 B 成功奪得編輯權，彈出「🎉 取得成功！您已可開始編輯隨堂筆記。」。
   - 絕不會因前一位學員斷線導致整組筆記永久卡死。

---

### 【案例 5】小組附檔管理（上傳、預覽與下載）
1. 視窗 A 點擊「+ 上傳附件」，選擇一張小於 800KB 的圖片上傳。
2. **預期結果**：
   - 視窗 A 列表即時浮現圖片縮圖。
   - 視窗 B 即時同步顯示該附件。
   - 點擊圖片縮圖可打開 Lightbox 放大預覽。
3. 測試非圖片檔案（如 `.txt` 或 `.pdf`）：
   - 點擊 FILE 圖示可觸發瀏覽器下載。
4. 測試防呆：
   - 選擇大於 800KB 之檔案，系統彈出警告攔截。

---

## 四、預期交付物

請 QA 驗收工程師完成測試後，於本目錄產出：
1. **驗收報告**：`split/qa/2026-09-28-split-notes-collaboration/reports/QA_VERIFICATION_R1_module4_notes_be97faf_20260928.md`
2. **測試證據**：放置於 `evidence/`（包含雙視窗鎖定橫幅對照截圖、即時文字廣播截圖）。
3. **自動化腳本**（若有）：放置於 `scripts/`。
