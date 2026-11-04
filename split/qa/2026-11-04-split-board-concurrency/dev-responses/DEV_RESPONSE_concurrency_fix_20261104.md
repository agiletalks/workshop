# 🛠️ 【DEV 修復回覆】SPLIT 白板同組多端共編併發修復報告
- **關聯任務**：`TASK-SPLIT-BOARD-CONCURRENCY`
- **對應 QA 缺陷單**：`BOARD-01`, `BOARD-02`, `BOARD-03`, `BOARD-04`
- **修復模組**：`split/public/board.html`
- **日期**：2026-11-04
- **負責端**：DEV 開發團隊

---

## 🎯 缺陷修復概述

本輪針對 QA 團隊在 `QA_VERIFICATION_20261104.md` 所揭露之 P1 等級資料完整性問題，進行了核心同步引擎的徹底架構升級。

### 1. BOARD-01（同時新增卡片遺失）& BOARD-02（不同卡修改不一致）
* **根因**：原 `doFirestoreWrite` 採用 `set(data, { merge: true })` 對 `notes: [...]` 陣列進行全量覆蓋。Firestore 頂層 merge 無法對陣列元素進行差分融合，造成最後寫入者強行覆蓋前者剛建立之卡片或修改。
* **修復方案**：
  1. 導入 **`computeLocalDelta`**：僅計算本機相對於前次同步基準之 `upserts`（增/改欄位）與 `deletes`（刪除 ID）。
  2. 導入 **Firestore `db.runTransaction` 原子交易寫入**：在伺服器端讀取最新 `serverNotes`，透過 `applyDeltaOntoNotes` 執行欄位級精確 Patch，兩端並行提交時 Firestore 自動序列化與重試，100% 確保雙方新增之卡片全部持久化保留，不同卡片之修改互不衝撞。

### 2. BOARD-04（已刪卡片復活）
* **根因**：原先使用 `age < 15000` 暫存防禦，在收到遠端刪除廣播時，將被刪卡誤判為本機新卡保留並回寫。
* **修復方案**：淘汰 15 秒盲猜機制，以 `computeLocalDelta` 建立明確的刪除事件建模。遠端一旦刪除，`applyDeltaOntoNotes` 絕不再將已刪卡片加入 `serverNotes`，徹底阻絕殭屍卡片復活。

### 3. BOARD-03（拖曳放開座標回跳）
* **根因**：
  1. 拖曳放開時未對移動之卡片打上新的 `updatedAt` 與 `posUpdatedAt`。
  2. 拖曳結束時先執行了 `saveState(true)`，後才合併暫存之舊 Snapshot，導致相等 timestamp 判定下被遠端舊座標（x=0）否決。
* **修復方案**：
  1. 拖曳放開時為所有選中卡片更新 `posUpdatedAt`、`updatedAt` 及 `updatedBy: MY_CLIENT_ID`。
  2. 調整時序：放開時先將拖曳期間暫存之快照進行三向合併，確保最新移動座標優先勝出後，再送出儲存。

---

## 🧪 DEV 本機驗證結果

執行專用雙客戶端併發模擬測試腳本 [`scripts/test-board-concurrency.cjs`](file:///c:/Antigravity/workshop/scripts/test-board-concurrency.cjs)：

```text
🧪 Testing SPLIT Board Concurrency Fixes...

--- Scenario 1: Concurrent Card Additions (BOARD-01 / WB-02) ---
Server notes count: 6
Server notes IDs: [ 'c1', 'c2', 'c3', 'c4', 'card-D', 'card-E' ]
✅ Scenario 1 PASS: Concurrent creations merged without losing cards!

--- Scenario 2: Concurrent Edits on Different Cards (BOARD-02 / WB-03) ---
✅ Scenario 2 PASS: Concurrent edits on different cards both retained on server!

--- Scenario 3: Remote Deletion Resurrect Prevention (BOARD-04 / WB-08) ---
Card D is deleted and not resurrected by client C
✅ Scenario 3 PASS: Remote deletions respected, no zombie resurrection!

--- Scenario 4: Dragging Position Preservation (BOARD-03 / WB-06) ---
✅ Scenario 4 PASS: Dragged coordinates preserved, no bounce-back!

🎉 ALL CONCURRENCY UNIT & INTEGRATION TESTS PASSED (100% SUCCESS)!
```

---

## 📦 異動檔案清單
1. `split/public/board.html`（三向重整合併引擎、差分計算、Firestore Transaction 原子提交）
2. `scripts/test-board-concurrency.cjs`（DEV 併發自動化測試腳本）
3. `dist/workshop/split/board.html`（已執行 `npm run build` 打包同步至 dist）

請 QA 團隊協助於正式環境部署後進行 WB-02、WB-03、WB-06、WB-08 及 WB-10 複測！
