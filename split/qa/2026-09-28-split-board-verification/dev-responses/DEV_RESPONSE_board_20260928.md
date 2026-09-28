# DEV 修復說明與複測指引 (線上雲端白板)

- **對應 QA 報告**：`reports/QA_VERIFICATION_board_20260928.md`
- **模組名稱**：模組 2 線上雲端白板 (Shared Whiteboard)
- **開發團隊**：SPLIT 開發團隊

---

## 一、本次實作重點說明

1. **白板檔案落成**：
   - 檔案位置：[`split/public/board.html`](file:///c:/Antigravity/workshop/split/public/board.html)
   - 以 AI-ARM 成熟 8000px 無限畫布、便利貼、連線錨點為基礎，調整為 SPLIT 的 Card Teal 深青綠風格。
2. **資料庫合約與世代隔離**：
   - 監聽班級中繼：`split_classes/{classId}`（取得 `currentGeneration` 與 `status`）。
   - 白板文檔路徑：`split_data/{classId}/generations/{generationId}/boards/{boardType}_team_{teamId}`。
3. **組內共用與跨組觀摩**：
   - 學員進入時優先讀取 `split_user_session`，綁定所屬真實組別 `userAssignedTeam`。
   - 當切換觀摩其他組別時（`viewingTeam !== userAssignedTeam`），自動啟動唯讀觀摩模式：
     - 顯示「👀 正在觀摩第 X 組白板（您所屬第 Y 組）」標籤。
     - 浮現高對比「[↩️ 切回我組]」按鈕，點擊立即返回。
     - 鎖定所有便利貼不可拖曳、不可雙擊修改、隱藏新增工具列。
4. **講義按鈕全面串接**：
   - 修改 [`split/src/components/WorkbookPanel.tsx`](file:///c:/Antigravity/workshop/split/src/components/WorkbookPanel.tsx)，各工具頁面直連雲端白板並帶入對應 `boardType`。

---

## 二、QA 複驗步驟 (Step-by-step Reproduction)

1. **啟動本機伺服器**：`npm run dev`（[http://localhost:5173/](http://localhost:5173/)）。
2. **驗證白板獨立開啟與組別切換**：
   - 開啟 `http://localhost:5173/board.html?c=qa-split-test-01&team=team-1&type=wbs`。
   - 確認頂部顯示「第 1 組專屬【WBS 工作分解】白板」，為可編輯狀態。
3. **驗證跨組唯讀觀摩**：
   - 從組別下拉選單切換至「第 2 組白板」。
   - 確認頂部浮現「唯讀觀摩中 (您所屬第 1 組)」與「切回第 1 組」按鈕。
   - 嘗試雙擊畫布或拖曳卡片，確認編輯已鎖定。
   - 點擊「切回第 1 組」，確認立即切回可編輯狀態。
