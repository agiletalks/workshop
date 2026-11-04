# 🛠️ 【DEV 修復回覆】BOARD-05 語法錯誤修復與 Round 2 複驗報告
- **關聯任務**：`TASK-SPLIT-BOARD-CONCURRENCY-ROUND2`
- **對應 QA 缺陷單**：`BOARD-05`（重複宣告 `MY_CLIENT_ID` 導致腳本編譯失敗）、重開 `BOARD-01`～`BOARD-04` 線上驗證
- **修復模組**：`split/public/board.html`, `scripts/build-all.js`, `scripts/test-board-concurrency.cjs`, `scripts/verify-browser-smoke.js`
- **日期**：2026-11-04
- **負責端**：DEV 開發團隊

---

## 🎯 缺陷修復概述 (BOARD-05)

### 1. 根因分析
- 在 `split/public/board.html` 中：
  - 第 1076 行：`const MY_CLIENT_ID = CLIENT_ID;`（同步引擎與交易補丁所需之唯一客戶端 ID）。
  - 第 2470 行：再次執行 `const MY_CLIENT_ID = 'cli_' + ...`（舊版在場系統未清理之局部宣告）。
- 兩者位於同一個 `<script>` 頂層作用域，造成 JavaScript 引擎在編譯解析階段拋出 `SyntaxError: Identifier 'MY_CLIENT_ID' has already been declared`，導致整段白板主腳本中止執行、DOM 事件監聽器未綁定、`openNoteModal` 未定義。

### 2. 修復方案
1. **統一 Client ID 宣告與架構**：
   - 移除第 2470 行重複宣告，全面統一使用第 1076 行由 `getOrCreateClientId()` 產生並存於 `sessionStorage.aigile_client_id` 之 `MY_CLIENT_ID`（與 `CLIENT_ID` 一致）。
   - 確保 3-Way Rebase Merge、Firestore `runTransaction` 差分寫入、卡片鎖定狀態 (`note.lock.lockedByClientId`)、在線在場心跳廣播 (`ai_arm_board_presence`) 及視角跟隨模式，全部共用同一 Client ID 體系。
2. **建置防護網升級（CI/CD 與測試攔截）**：
   - 在 [`scripts/test-board-concurrency.cjs`](file:///c:/Antigravity/workshop/scripts/test-board-concurrency.cjs) 注入「Pre-flight 0」檢查：以 Node.js `vm.Script` 完整編譯驗證 `split/public/board.html` 所有 inline script，確保語法錯誤第一時間中斷測試。
   - 在 [`scripts/build-all.js`](file:///c:/Antigravity/workshop/scripts/build-all.js) 增加 Step 7 語法自動檢驗：打包 `dist` 時自動對 `split/public/board.html`、`dist/workshop/split/board.html` 及 `dist/workshop/ai-arm/board.html` 的所有 inline `<script>` 進行語法編譯檢查，杜絕語法問題打包發布。
3. **新增 Headless 跨瀏覽器冒煙自動化驗證**：
   - 建立 [`scripts/verify-browser-smoke.js`](file:///c:/Antigravity/workshop/scripts/verify-browser-smoke.js)，以 Chrome 與 Edge 之 Headless 模式實際啟動並透過 Chrome DevTools Protocol (CDP) 連線：
     - 驗證頁面加載 0 Exception / 0 SyntaxError。
     - 驗證 `MY_CLIENT_ID`、`CLIENT_ID`、`openNoteModal`、`#btn-add-note` 正確初始化。
     - 模擬點擊「新增便利貼」，驗證彈出視窗成功開啟 (`activeModalMode: 'create'`)。
     - 模擬輸入文字並呼叫 `saveNoteModal()`，驗證成功建立卡片。

---

## 🧪 DEV 驗證結果

### 1. 跨瀏覽器自動化驗證 (Chrome + Edge CDP)
執行 `node scripts/verify-browser-smoke.js`，雙瀏覽器實測結果如下：
```text
========================================
Testing with Google Chrome: C:\Program Files\Google\Chrome\Application\chrome.exe
========================================
✓ Connected to Google Chrome CDP
Navigating to: http://localhost:8899/workshop/split/board.html?class=qa-split-collab-20261104&type=qa-collab-r1&team=1
Captured 0 exceptions:
Initialization Check Result: {
  "myClientIdDefined": "cli_01i4t92_1793780724242",
  "clientIdDefined": "cli_01i4t92_1793780724242",
  "openNoteModalExists": true,
  "btnAddNoteExists": true,
  "roomDocRefExists": true,
  "isBoardReadOnly": false,
  "boardStateNotesCount": 5
}
✓ Google Chrome script initialized successfully.
Testing "新增便利貼" click and modal opening...
Modal Click Result: { "modalOpened": true, "activeModalMode": "create" }
Testing saving a new note via saveNoteModal()...
Note Creation Result: { "modalClosed": true, "noteAdded": true, "notesCount": 6 }
✓ Google Chrome successfully created note! Total notes: 6
✓ Google Chrome passed with 0 SyntaxError exceptions.

========================================
Testing with Microsoft Edge: C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
========================================
✓ Connected to Microsoft Edge CDP
Navigating to: http://localhost:8899/workshop/split/board.html?class=qa-split-collab-20261104&type=qa-collab-r1&team=1
Captured 0 exceptions:
Initialization Check Result: {
  "myClientIdDefined": "cli_t8yu6i9_1793780729008",
  "clientIdDefined": "cli_t8yu6i9_1793780729008",
  "openNoteModalExists": true,
  "btnAddNoteExists": true,
  "roomDocRefExists": true,
  "isBoardReadOnly": false,
  "boardStateNotesCount": 5
}
✓ Microsoft Edge script initialized successfully.
Testing "新增便利貼" click and modal opening...
Modal Click Result: { "modalOpened": true, "activeModalMode": "create" }
Testing saving a new note via saveNoteModal()...
Note Creation Result: { "modalClosed": true, "noteAdded": true, "notesCount": 6 }
✓ Microsoft Edge successfully created note! Total notes: 6
✓ Microsoft Edge passed with 0 SyntaxError exceptions.

🎉 ALL BROWSER SMOKE TESTS PASSED (Chrome + Edge)!
```

### 2. 併發同步單元測試
執行 `node scripts/test-board-concurrency.cjs`：
```text
🧪 Testing SPLIT Board Concurrency Fixes...
🔍 Checking inline scripts syntax in split/public/board.html...
  ✓ Script #1 syntax OK
  ✓ Script #2 syntax OK
  ✓ Script #3 syntax OK

--- Scenario 1: Concurrent Card Additions (BOARD-01 / WB-02) ---
✅ Scenario 1 PASS: Concurrent creations merged without losing cards!

--- Scenario 2: Concurrent Edits on Different Cards (BOARD-02 / WB-03) ---
✅ Scenario 2 PASS: Concurrent edits on different cards both retained on server!

--- Scenario 3: Remote Deletion Resurrect Prevention (BOARD-04 / WB-08) ---
✅ Scenario 3 PASS: Remote deletions respected, no zombie resurrection!

--- Scenario 4: Dragging Position Preservation (BOARD-03 / WB-06) ---
✅ Scenario 4 PASS: Dragged coordinates preserved, no bounce-back!

🎉 ALL CONCURRENCY UNIT & INTEGRATION TESTS PASSED (100% SUCCESS)!
```

---

## 📋 板型與 QA 測試網址澄清

感謝 QA 團隊細心指出：
1. **板型對應**：Firestore 文件路徑為 `split_data/{classId}/generations/{genId}/boards/{boardType}_{teamId}`。
   - 若未傳入 `type`，系統預設為 `main`（需求分解綜合共創），讀取之文件為 `main_team-1`。
   - 首輪測試 QA 所指定之板型為 `type=qa-collab-r1`，對應之文件為 `qa-collab-r1_team-1`。
   - `room` 參數主要供 Presence 房間廣播使用，並不會覆寫 `boardType`。
2. **Round 3 複測正確網址**（明確帶入 `type=qa-collab-r1`）：
   ```text
   https://agiletalks-workshop.web.app/workshop/split/board.html?class=qa-split-collab-20261104&type=qa-collab-r1&team=1
   ```
