# 【DEV 移交 QA 驗收通知書】SPLIT 模組 3：Team Task 團隊演練動態插入與小組協作系統

> **發布日期**：2026-09-28  
> **發布端**：DEV 開發團隊  
> **接收端**：AgileTalks 中央獨立 QA 驗收工程師  
> **任務編號**：`TASK-SPLIT-04`  
> **基準 Commit**：`be97faf`  
> **所屬模組**：SPLIT 模組 3（團隊演練動態插入、講師 In-App 管理、左側任務卡與右側筆記租約鎖/附件協作）  
> **需求委託書**：[`split/qa/2026-09-28-split-team-tasks/QA_BRIEF_MODULE3_TEAM_TASK.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-team-tasks/QA_BRIEF_MODULE3_TEAM_TASK.md)  
> **預期產出報告**：`split/qa/2026-09-28-split-team-tasks/reports/QA_VERIFICATION_R1_module3_team_tasks_be97faf_20260928.md`  

---

## 📢 移交說明與驗收範疇

QA 工程師您好，DEV 團隊已完成【SPLIT 模組 3：Team Task 團隊演練動態插入與協作系統】的完整實作與後端自動化測試驗證，現正式移交進行第 1 輪（R1）獨立端到端（E2E）驗收。

### 🎯 核心實作亮點
1. **講師 In-App 動態插入**：講師可於講義頂部或側邊欄隨時點擊 `[🎯 + 演練]`，指定插入位置（例如在第 3 頁後），全班學員端以 Firestore `onSnapshot` **無刷新（No-reload）即時在該位置插入演練頁面**，總頁數與頁碼全域自動重編。
2. **左側任務卡規格**：情境背景、目標卡、步驟指引、成果驗收要求、AI 提示詞一鍵複製（含成功反饋）、連動所屬組別之專屬雲端白板。
3. **右側小組協作空間**：
   - 隨堂筆記：同組組員共享，受 **35 秒租約鎖（Lease Lock）與即時廣播**保護，一次一人主筆，一人打字其他組員即時呈現唯讀與爭取編輯權橫幅。
   - 成果作品庫：同組所有組員皆可各自上傳討論截圖與附件（上限 800KB），人人可見、人人可下載。
4. **極簡權限與安全防護**：
   - 學員進班畫面徹底隱形（零講師按鈕，100% 學員身分，杜絕好奇嘗試）。
   - 講師從中央後台（`admin.html`）點擊 `[👨‍🏫 講師進入]` 即可一鍵免密直通，且講師享有全域語音實錄與隨堂筆記特權（不受觀摩鎖定）。

---

## 🧪 測試環境與操作指引

- **測試伺服器**：`http://localhost:5000/workshop/split/`（或 Vite `http://localhost:5173/`）
- **中央管理後台**：`http://localhost:5000/workshop/admin.html?course=split`
- **測試班級代碼**：`qa-split-test-01`
- **推薦驗收方式**：Playwright 雙 Context 視窗模擬（視窗 A 為後台直通之講師 / 視窗 B 為第 1 組學員）。

---

## 📋 7 大核心驗收場景清單

| 情境編號 | 測試情境 | 預期驗證指標 |
|---|---|---|
| **TC-TASK-01** | 講師 In-App 建立演練任務 | 講師點擊頂部或側欄 `[🎯 + 演練]`，填寫完整欄位儲存後，自動導航至新任務頁面 |
| **TC-TASK-02** | 學員端無刷新即時同步插入 | 視窗 A (講師) 新增演練，視窗 B (學員端完全不重新整理) 在 1 秒內側邊欄與投影片自動出現新任務 (🎯 標記)，總頁數自 24 變 25 |
| **TC-TASK-03** | 頁碼動態重編與導航跳轉 | 新任務插入於 `slide-3` 後，新任務頁碼為 4，原第 4 頁順延為 5，上/下一頁導航流暢 |
| **TC-TASK-04** | 左側任務卡功能連動 | AI 提示詞點擊一鍵複製能寫入剪貼簿；點擊白板按鈕能另開帶入該組 team 參數之白板頁面 |
| **TC-TASK-05** | 右側筆記組內協同 (35s 租約鎖) | 視窗 A (學員 1) 輸入筆記取得鎖；視窗 B (學員 2) 即時被鎖定並出現「正在編輯中」橫幅與搶鎖按鈕 |
| **TC-TASK-06** | 右側成果檔案人人皆可上傳 | 視窗 A 上傳截圖 A，視窗 B 上傳截圖 B，兩端附件清單即時同步出現雙方成果並可下載 |
| **TC-TASK-07** | 講師編輯與停用/刪除任務 | 講師點擊 `[✏️ 編輯演練]` 修改時限或刪除，所有學員端即時同步變更，刪除後頁碼平滑回縮 |

---

## 📦 DEV 自測通過紀錄
- 自測指令：`node split/scratch/test-custom-tasks.cjs` ➜ **4 項核心測試 100% PASS**。
- 建置檢查：`cmd /c "npm run build"` ➜ **0 Error (Code 0)**。
- 全域打包：`node scripts/build-all.js` ➜ **0 Error (Code 0)**。

---

## 📁 驗收產出要求
驗收完成後，請依照《AgileTalks DEV-QA 協同驗收機制與目錄規範指南》產出：
1. 驗收報告：`split/qa/2026-09-28-split-team-tasks/reports/QA_VERIFICATION_R1_module3_team_tasks_be97faf_20260928.md`
2. 截圖證據：`split/qa/2026-09-28-split-team-tasks/evidence/`
