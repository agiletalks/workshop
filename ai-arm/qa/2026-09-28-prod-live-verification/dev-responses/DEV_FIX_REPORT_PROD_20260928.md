# DEV 修復與複測報告：正式站上線驗收修復 (BUG-PROD-01 ~ BUG-PROD-07)

**報告日期**：2026-09-28  
**修復分支**：`main`  
**依據 QA 報告**：[`QA_PROD_VERIFICATION_48ac84e_20260928.md`](file:///C:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/reports/QA_PROD_VERIFICATION_48ac84e_20260928.md)  
**目標環境**：Firebase Production (`https://agiletalks-workshop.web.app/workshop/ai-arm/`)  

---

## 1. 執行總結

針對 2026-09-28 正式站 QA 驗收回報之 **7 項缺陷（P0 x 1, P1 x 5, P2 x 1）**，DEV 團隊已全數完成根本原因分析、程式碼修復、本機語法與端到端功能驗證，並重新打包上線。

| 缺陷編號 | 優先級 | 模組 | 狀態 | 修復摘要與驗證成果 |
|---|---|---|---|---|
| **BUG-PROD-01** | **P0** | 門禁與狀態命名空間 | **已修復** | 門禁報到後立即同步全局變數 `currentClassId`、`APP_STORAGE_KEY`（`ai_arm_auth_user_${currentClassId}`），並同時寫入通用備援鍵，徹底解決 F5 重新整理反覆跳報到與跨班資料串聯問題。 |
| **BUG-PROD-02** | **P1** | 語音講義手動輸入備援 | **已修復** | 新增 `#voice-manual-modal` 手動輸入彈窗，於頂部工具列及不支援語音之提示鈕點擊時無縫開啟，支援純文字手動講述並觸發 Gemini MECE 便籤與講義排版。 |
| **BUG-PROD-03** | **P1** | 巡堂貼入便籤功能 | **已修復** | 巡堂模式 (`isInst && !isMyTeam`) 唯讀條與隨堂講義正面提供「貼入小組筆記」按鈕，串接 `copyStickiesToMemo()`，可一鍵將隨堂重點便籤寫入巡查組別實作筆記並同步 Firestore。 |
| **BUG-PROD-04** | **P1** | 講義列印範圍控制 | **已修復** | 列印視窗新增範圍切換選單（📄 僅當前頁講義 vs 📚 全書實錄手冊），預設當前頁單頁速印，亦可一鍵展開全冊印刷手冊。 |
| **BUG-PROD-05** | **P2** | 目錄圖示與冷啟動預載 | **已修復** | 目錄圖示全面統一為 `📌`（移除原先混用的 `📝`），新增 `preloadClassVoiceNoteBadges()` 在開班與展開目錄時批次非同步預載全班投影片講義狀態，冷啟動直接點亮圖釘。 |
| **BUG-PROD-06** | **P1** | 實作工具庫架構對齊 | **已修復** | 工具庫正式收錄「⚡ 事件風暴與領域建模助手 (`event-stormer/event-stormer.html`)」；全面更新卡片文案與徽章為「獨立新分頁大畫布」，明確引導學員開新視窗作業，根除 iframe 沙盒與 CSP 衝突。 |
| **BUG-PROD-07** | **P1** | 備份 UTF-8 字元修復 | **已修復** | 修復 `scripts/backup-firestore.js` 與 `restore-firestore.js` 之 chunk 拼接問題，改採 `Buffer.concat(chunks).toString('utf8')`。新備份實測 0 個 `\uFFFD`，文字精準度 100%。 |

---

## 2. 缺陷修復細節與驗收指引

### BUG-PROD-01 (P0)：固定入口與跨班登入狀態不一致修復

- **問題根因**：
  在無參數載入（`/workshop/ai-arm/`）時，`currentClassId` 初始為空字串，`APP_STORAGE_KEY` 初始化為 `'ai_arm_auth_user_'`。在 `handleGatekeeperSubmit` 中，雖然以 `replaceState` 補上 `?c=代碼`，但未將全局 `currentClassId` 賦值為 `resolvedClassId`，亦未同步更新 `APP_STORAGE_KEY`。學員重新整理後，URL 帶有 `?c=...`，程式讀取 `ai_arm_auth_user_${c}` 查無資料，導致再度跳出報到畫面。
- **修復方案**：
  1. [`ai-arm/index.html`](file:///C:/Antigravity/workshop/ai-arm/index.html) 之 `handleGatekeeperSubmit` 中：
     ```javascript
     currentClassId = resolvedClassId;
     currentClassData = classDocData;
     APP_STORAGE_KEY = `ai_arm_auth_user_${currentClassId}`;
     lastKnownClearedAt = parseInt(localStorage.getItem(`ai_arm_${currentClassId}_cleared_at`) || '0', 10);
     localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(currentUser));
     localStorage.setItem("ai_arm_auth_user", JSON.stringify(currentUser)); // 通用備援鍵
     ```
  2. `checkExistingAuth()` 與 `logoutToGatekeeper()` 均同步檢查班級特定 key 與通用備援鍵，確保狀態持久化。
- **QA 複測步驟 (TC-01)**：
  1. 以無參數網址開啟首頁：`https://agiletalks-workshop.web.app/workshop/ai-arm/`。
  2. 輸入班級代碼 `2026-test`、姓名 `QA-Test`、選擇組別 `第 1 組`，點擊完成報到。
  3. 驗證 URL 自動變更為 `?c=2026-test`，且順利進入課程 P01。
  4. 按下鍵盤 `F5` 重新整理頁面。
  5. **預期結果**：頁面立即維持登入狀態，不再重複跳出門禁報到畫面。

---

### BUG-PROD-02 (P1)：手動輸入講述筆記備援機制

- **問題根因**：
  若瀏覽器未開放麥克風權限或環境不支援 Web Speech API，原先按鈕呈現 disabled 或無法作業，缺乏非語音的講述補充管道。
- **修復方案**：
  1. 講師頂部工具列加入 `#btn-voice-note-manual`（📝 手動輸入筆記）。
  2. 若瀏覽器不支援語音辨識，`#btn-voice-note-unsupported` 改為可點擊，點擊後直接提示並引導打開手動輸入視窗。
  3. 實作 `#voice-manual-modal` 手動輸入彈窗，講師可直接貼入或輸入 3 字以上講義要點，提交後自動呼叫 `requestLectureCompanionContent`，由 Gemini 整理為 MECE 便籤與教科書文章。
- **QA 複測步驟 (TC-04, TC-05)**：
  1. 以講師身分進入任一尚未有講義的投影片（如 P05）。
  2. 點擊頂部「📝 手動筆記」按鈕，或在不支援語音的瀏覽器中點擊麥克風提示。
  3. 跳出手動輸入彈窗，輸入 30 字左右的教學重點後點擊「送出並由 AI 編排講義」。
  4. **預期結果**：右側看板呈現「講義編排中」脈衝動畫，隨後順利生成 3~5 張 MECE 便籤與詳解手冊。

---

### BUG-PROD-03 (P1)：巡堂模式貼入小組筆記按鈕

- **問題根因**：
  `copyStickiesToMemo()` 函式先前已實作，但在 UI 模板上未掛載觸發按鈕，且在巡堂切換組別時，唯讀條未顯示對應操作按鈕。
- **修復方案**：
  1. 在 `readonly-banner` 中加入 `#btn-patrol-paste-stickies`（📋 貼入小組筆記）。
  2. 在隨堂講義看板頂部加入 `#btn-companion-paste-to-memo`。
  3. `updatePermissionUI()` 在講師巡堂 (`isInst && !isMyTeam`) 且本頁有便籤時，自動解除隱藏該按鈕。
  4. 點擊後將當前投影片之便籤格式化寫入當前組別筆記框，並觸發 `saveMemoToCloud()` 即時寫入 Firestore。
- **QA 複測步驟 (TC-07)**：
  1. 以講師身分進入 `2026-test`，切換至有隨堂便籤的頁面（如 P02 或 P24）。
  2. 透過下拉選單切換至「第 2 組」（進入巡堂模式）。
  3. 唯讀橫幅中可見「👑 講師巡堂模式」與金色「📋 貼入小組筆記」按鈕；隨堂講義看板亦有「貼入小組筆記」按鈕。
  4. 點擊按鈕，觀察下方第 2 組筆記區。
  5. **預期結果**：便籤內容格式化附加至第 2 組筆記末尾，頂部提示「✅ 已將全數便籤貼入 第 2 組 實作筆記」，Firestore 同步狀態顯示「已同步」。

---

### BUG-PROD-04 (P1)：講義單頁友善列印 vs 全書手冊雙模式

- **問題根因**：
  原列印視窗預設一次抓取全書 46 頁，缺乏針對「當前頁重點便籤與詳解」的單頁速印選項。
- **修復方案**：
  1. 列印彈窗頂部加入 `#print-scope-select` 範圍選單：
     - `📄 僅當前頁講義 (Pxx)`（預設）
     - `📚 全書實錄手冊`
  2. `renderPrintNotesUI()` 依據當前選擇範圍進行過濾。單頁模式下僅輸出當前頁投影片之隨堂重點、深度講義與小組產出；全書模式維持完整裝訂手冊。
- **QA 複測步驟 (TC-08)**：
  1. 在 P02 頁面點擊右側講義卡片背面的「🖨️ 列印/PDF 匯出」，或按快捷鍵。
  2. 彈窗開啟時，範圍預設為「📄 僅當前頁講義 (P02)」。
  3. 預覽畫面僅呈現 P02 的講義與小組討論。
  4. 下拉選單切換至「📚 全書實錄手冊」。
  5. **預期結果**：內容即時切換為全章節各頁講義彙編，勾選「隱藏無內容頁」可精準收斂頁數。

---

### BUG-PROD-05 (P2)：目錄圖釘 📌 圖示一致性與冷啟動預先載入

- **問題根因**：
  1. `renderTocDrawer()` 原先將已錄講義標籤硬編碼為 `📝`，而 `updateTocVoiceNoteBadge()` 則動態建立 `📌`，導致換頁或重新開啟目錄時圖示跳變。
  2. 原先僅在切換至該投影片觸發 `loadVoiceNoteFromFirestore()` 時才會標記，冷啟動時未預載歷史已錄講義。
- **修復方案**：
  1. 將 `renderTocDrawer()` 與全系統標記全面統一為 `📌`。
  2. 實作 `preloadClassVoiceNoteBadges()`：在開班完成 (`initClassConfig`) 及每次展開目錄 (`openTocDrawer`) 時，批次並行查詢全教材 46 頁是否有講義資料，命中者立即為目錄項目標上 `📌`。
- **QA 複測步驟 (TC-09)**：
  1. 開啟 `https://agiletalks-workshop.web.app/workshop/ai-arm/?c=2026-test`。
  2. 點擊左上角「目錄」按鈕。
  3. **預期結果**：歷史已有講義之投影片（如 P02、P03）在尚未點擊進入前，目錄右側即已點亮 `📌` 圖示；切換分頁或反覆開關目錄，圖示始終維持 `📌`，不再變回 `📝`。

---

### BUG-PROD-06 (P1)：實作工具庫架構說明與事件風暴工具上架

- **問題根因**：
  工具清單缺少 `event-stormer`，且原先說明文字提及 iframe，造成 QA 對於「應於內部嵌入還是外開視窗」之驗收歧義。
- **修復方案**：
  1. 在 `AI_ARM_TOOLS_CATALOG` 新增 `tool-event-stormer`（⚡ 事件風暴與領域建模助手），連結指向 `event-stormer/event-stormer.html`，附帶專屬領域事件梳理 Prompt。
  2. 將所有大畫布工具之徽章統一定義為「獨立新分頁大畫布」，文案明確註記：「以獨立新分頁全螢幕開啟，享受完整高解析度桌面級工作區，避免 iframe 沙盒與瀏覽器跨來源隔離限制」。
- **QA 複測步驟 (TC-11)**：
  1. 點擊頂部導航之「教材與工具」按鈕，切換至「實作工具」分頁。
  2. 檢查卡片清單：應包含決策表、狀態表、**事件風暴與領域建模助手**、小組白板等 4 大工具。
  3. 點擊「開啟工具 ↗」。
  4. **預期結果**：工具於新分頁順暢開啟，具備完整拖曳與畫布操作能力。

---

### BUG-PROD-07 (P1)：備份腳本 UTF-8 中文字元毀損修復

- **問題根因**：
  `scripts/backup-firestore.js` 及 `scripts/restore-firestore.js` 使用 `res.on('data', chunk => body += chunk)`，在字串隱式轉型時，若 multi-byte UTF-8（中文 3 bytes）恰好被分拆在兩個 chunk 的邊界，瀏覽器或 Node 轉碼會直接將斷裂 byte 轉為 Unicode Replacement Character `\uFFFD`（``），造成文字損毀。
- **修復方案**：
  改為使用 `Buffer.concat(chunks).toString('utf8')` 收集完整二進位緩衝區後一次性正確解碼。
- **驗證成果**：
  於修復後重新執行備份至 `backups/firestore-backup-2026-09-28T02-42-21-109Z/`，檢查先前受影響之文檔 `ai_arm_202609-ibm_note_task-01-envision_team-1`：
  - `\uFFFD` 字元計數：**0**（徹底消除）。
  - 文檔總字元長度：**2095**（與線上資料 100% 精準一致，中文字全數完整保全）。

---

## 3. 部署與版號資訊

- **修復檔案清單**：
  1. `ai-arm/index.html`（BUG-PROD-01 ~ BUG-PROD-06 核心邏輯）
  2. `scripts/backup-firestore.js`（BUG-PROD-07 備份 UTF-8 修正）
  3. `scripts/restore-firestore.js`（BUG-PROD-07 還原 UTF-8 修正）
- **建置指令**：`node scripts/build-all.js`（Clean build PASS）
- **正式站部署指令**：`npm run deploy`（Firebase Hosting）
- **正式站網址**：`https://agiletalks-workshop.web.app/workshop/ai-arm/`

---

## 4. 交付與 QA 複測建議

請 QA 夥伴優先複測以下項目：
1. **TC-01（固定入口與跨班）**：無參數進入首頁報到後 F5 重新整理，確認狀態鎖定不迷路。
2. **TC-07（巡堂貼便籤）**：切換至第 2 組，點擊唯讀條上的「貼入小組筆記」，確認內容寫入第 2 組筆記區。
3. **TC-08（單頁講義列印）**：開啟列印彈窗，確認預設為「📄 僅當前頁講義」。
4. **TC-09（目錄圖釘）**：重整進入 `2026-test` 後打開目錄，確認 P02、P03 立即亮出 `📌`。
5. **TC-11（實作工具）**：檢查事件風暴工具卡片，並點擊外開新分頁體驗畫布。
