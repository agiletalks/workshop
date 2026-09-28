# 【QA 驗收委託書】SPLIT 四大支柱內容架構、統一資源上傳器與全日教材專書生成系統

> **任務編號**：`TASK-SPLIT-08`  
> **基準 Commit**：`18078dd87d0ec6b1d6b054238714eb6fb6b3fc59` (`18078dd`)  
> **測試分支**：`feature/split-textbook-and-resources`  
> **驗收環境**：本機端（Localhost:5000）+ Google Cloud Firestore (`marshmallow-agile-3b4b`)  
> **測試班級**：`qa-split-test-01` (Active 啟用中班級)  
> **交付日期**：2026-09-28  

---

## 🎯 驗收背景與核心目標

本階段交付為 SPLIT 隨堂系統之重大功能升級，確立了投影片右側工作區的**「四大支柱內容架構 (4-Pillar Content Architecture)」**、提供講師即時擴充教材的**「統一資源上傳器 (UnifiedResourceModal)」**、實現以章節模組為單位的**「全日教材專書生成與快取 (Master Textbook)」**，以及支援學員專屬封面與演練組別成果的**「個人化出版級 PDF 列印手冊」**。

QA 團隊需以獨立客觀角度，透過雙視窗（講師 vs 學員）真機 E2E 自動化實測與功能審驗，確認以下 5 大核心維度：

---

## 📋 5 大核心驗證場景與驗收標準

### 1. 四大支柱內容架構（右側工作區）
- **重點便利貼 (`stickies`)**：支援講師動態編輯/新增/刪除，即時廣播至所有學員端。
- **提示詞工具 (`prompt`)**：展示該頁對應之 AI Prompt 提示詞工具卡片，學員端點擊「一鍵複製」按鈕即時寫入剪貼簿，並給予 2 秒「✓ 已複製!」按鈕視覺回饋。
- **範例與附件 (`example`)**：展示該頁之參考案例、範例圖片或外部素材，點擊圖片縮圖可觸發全螢幕燈箱（Lightbox）放大檢視。
- **逐字稿/Q&A (`transcript`)【身分絕對隔離】**：
  - **講師端**：可見 `🎙️ 逐字稿/Q&A` 分頁標籤，可直接編輯整理後的講稿或 Q&A 內容，點擊「儲存逐字稿」寫入資料庫。
  - **學員端【嚴格隔離】**：**絕對不可出現**「逐字稿/Q&A」分頁標籤，介面亦無任何未公開逐字稿或講師內部問答之痕跡。
- **小組成果筆記 (`note`)**：僅在小組演練（Team Task）頁面動態出現，一般教學頁面自動隱藏。

### 2. 統一資源上傳器模組 (`UnifiedResourceModal.tsx`)
- **講師端入口**：在工作區右上方提供 `[➕ 上傳資源]` 按鈕。
- **分頁切換**：提供 SegControl 切換「💡 AI 提示詞」與「📎 範例與附件」。
- **提示詞上傳**：輸入標題、適用情境、提示詞內容，送出後即時儲存至 Firestore `prompts` 陣列，並在「提示詞工具」分頁即時呈現。
- **範例/附件上傳**：支援外部圖片網址或本機圖片，送出後即時儲存至 Firestore `attachments` 陣列，並在「範例與附件」分頁以卡片/縮圖呈現。
- **學員端權限防護**：學員端絕對**看不到** `[➕ 上傳資源]` 按鈕，亦無上傳權限。

### 3. 全日教材專書生成與集中快取 (`MasterTextbookData`)
- **入口位置**：在頂部導航列開啟「列印筆記 (`PrintHandbookModal`)」後，講師端獨有 `[📖 生成全日專書]` 按鈕。
- **串接章節生成**：點擊後以工作坊投影片章節為單位，彙整課堂重點、提示詞與範例，產出整合型出版教材（專題文章、章節配圖 Figure 1-1, Figure 1-2 等）。
- **集中快取**：生成後持久化快取於 Firestore `textbook_cache`，學員開啟手冊時無需重複調用 API 即直接載入已生成之章節專書。
- **附錄 A**：自動彙整全日所有投影片之「AI 提示詞工具箱 (Prompt Toolbox)」。

### 4. 個人化出版級 PDF 列印手冊 (`PrintHandbookModal.tsx`)
- **動態封面注入**：手冊首頁根據當前登入學員，動態注入學員姓名（如「小明」）與所屬組別（如「第 1 組」）。
- **附錄 B 個人化小組成果**：附錄 B 自動呈現該學員所屬小組在全日所有演練環節中產出的隨堂筆記與上傳附件。若切換組別檢視，呈現內容精準動態切換。
- **列印樣式優化**：頁首、頁碼、排版符合 `@media print` 出版級規範，包含換頁斷點控制 (`page-break-after: always`)。

### 5. 跨端即時同步與健全性（雙視窗 E2E）
- 講師在視窗 A 新增資源/提示詞後，學員在視窗 B 無需重新整理（No-reload）即刻收到快照推播。
- 整個流程全站零 JavaScript 錯誤（Uncaught Exception），後端無 Firestore Permission Denied 報警。

---

## 🛠️ QA 驗收執行規範

1. **獨立執行**：QA 團隊必須獨立執行 Playwright 真機雙端 E2E 驗收測試。
2. **完整產出**：
   - 測試腳本：`split/qa/2026-09-28-split-textbook-and-resources/scripts/e2e-textbook-resources.cjs`
   - 截圖佐證：`split/qa/2026-09-28-split-textbook-and-resources/evidence/*.png`
   - 數據摘要：`split/qa/2026-09-28-split-textbook-and-resources/evidence/test-summary.json`
   - 正式驗收報告：`split/qa/2026-09-28-split-textbook-and-resources/reports/QA_VERIFICATION_R1_textbook_resources_18078dd_20260928.md`
3. **看板更新**：於 `split/qa/CURRENT_QA_TASKS.md` 登記並維護驗收進度與最終判定。
