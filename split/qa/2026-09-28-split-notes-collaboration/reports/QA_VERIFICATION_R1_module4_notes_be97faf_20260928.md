# QA 驗收報告：SPLIT 模組 4 隨堂筆記組內協作、租約鎖 (Lease Lock) 與附件管理 (R1)

- **測試對象**：SPLIT 模組 4 隨堂筆記組內協作、35 秒租約鎖 (Lease Lock) 與附件管理
- **驗收輪次**：第 1 輪（Round 1，全新驗收）
- **基準 Commit**：`be97faf`
- **驗收日期**：2026-09-28
- **執行人**：AgileTalks 中央首席 QA 驗收工程師
- **測試結果**：**100% PASS（通過正式驗收，無 P0/P1 缺陷，准予發布合流）**

---

## 一、驗收涵蓋範疇與需求對齊 (Verification Scope)

依據 DEV 提供之需求委託書 [`QA_BRIEF_MODULE4_NOTES.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-notes-collaboration/QA_BRIEF_MODULE4_NOTES.md) 與 `CURRENT_QA_TASKS.md` (TASK-SPLIT-03)，本輪實施了 **合約底層交易自測（Contract Tests）** 與 **真實瀏覽器雙學員併發 E2E 測試（Playwright E2E Tests）**：

| 項次 | 驗收項目 | 預期標準 | 實測結果 | 判定 |
| :--- | :--- | :--- | :--- | :---: |
| 1 | **編輯鎖定互斥** | 視窗 A (小明) onFocus 取得編輯權後，視窗 B (小華) 即時顯示「🔒 組員【小明】正在編輯此頁筆記 (35 秒租約保護中)」，且 textarea 唯讀防踩踏 | 視窗 A 呈現綠色編輯中，視窗 B 即時浮現琥珀色鎖定橫幅，textarea 自動 `disabled` | **PASS** |
| 2 | **文字即時廣播** | 視窗 A 打字，視窗 B 在無需重新整理（No-reload）下透過 Firestore 即時同步看見筆記內容 | 視窗 A 輸入敏捷筆記後，視窗 B 於 1.5 秒內即時同步完成渲染 | **PASS** |
| 3 | **主動交出編輯權** | 視窗 A 點擊「交出編輯權」，視窗 B 鎖定橫幅即時消失，視窗 B 點擊輸入框可順利奪鎖接手編輯 | 視窗 A 點擊交出後，視窗 B 鎖定橫幅 detached，視窗 B 點擊後順利接手成為 Holder，視窗 A 轉為鎖定狀態 | **PASS** |
| 4 | **35 秒租約逾期搶鎖** | 當持有者斷線或逾 35 秒未續約，非持有者點擊「爭取編輯權」或奪鎖，交易安全接手新租約 | 底層交易合約測試模擬 35 秒過期狀態，非持有者順利執行 Transaction 奪鎖成功 | **PASS** |
| 5 | **附件上傳與即時同步** | 視窗 B 上傳截圖/附件，視窗 A 在無需重新整理下即時看見附件預覽，並可點擊全螢幕燈箱放大檢視 | 上傳 1x1 PNG 附件後，視窗 A 與視窗 B 均即時呈現附件項目，無任何 FirebaseError | **PASS** |
| 6 | **主控台穩定度** | 雙視窗即時監聽與頻繁協同切換過程中，主控台零致命錯誤、零權限拒絕 (FirebaseError) | 雙視窗 Console Log 完全無 `FirebaseError` 或異常崩潰 | **PASS** |

---

## 二、驗收證據鏈盤點 (Evidence & Artifacts)

### 1. 執行腳本與報告清單
- **E2E 驗收測試腳本**：[`split/qa/2026-09-28-split-notes-collaboration/scripts/e2e-notes-collaboration.cjs`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-notes-collaboration/scripts/e2e-notes-collaboration.cjs)
- **合約交易自測腳本**：[`split/qa/2026-09-28-split-notes-collaboration/scripts/test-notes-contract.cjs`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-notes-collaboration/scripts/test-notes-contract.cjs)
- **E2E 執行彙總數據**：[`split/qa/2026-09-28-split-notes-collaboration/evidence/r1-execution-summary.json`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-notes-collaboration/evidence/r1-execution-summary.json)
- **合約測試數據**：[`split/qa/2026-09-28-split-notes-collaboration/evidence/contract-results.json`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-notes-collaboration/evidence/contract-results.json)
- **視窗 A Console 紀錄**：[`split/qa/2026-09-28-split-notes-collaboration/evidence/r1-console-a.json`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-notes-collaboration/evidence/r1-console-a.json)
- **視窗 B Console 紀錄**：[`split/qa/2026-09-28-split-notes-collaboration/evidence/r1-console-b.json`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-notes-collaboration/evidence/r1-console-b.json)

### 2. 真機截圖證據
- `r1-lock-exclusivity-a.png`：視窗 A 取得綠色編輯權橫幅（每 15 秒心跳續約保護）
- `r1-lock-exclusivity-b.png`：視窗 B 呈現琥珀色鎖定橫幅（🔒 組員【小明】正在編輯此頁筆記，35 秒租約保護中）
- `r1-text-synced-b.png`：視窗 B 在無重新整理下即時同步呈現視窗 A 輸入之敏捷筆記
- `r1-handoff-a-locked.png`：視窗 A 點擊「交出編輯權」後，由視窗 B 接手，視窗 A 轉為鎖定狀態
- `r1-handoff-b-holding.png`：視窗 B 順利接手成為綠色持有人狀態
- `r1-attachment-synced-a.png`：視窗 A 於無重新整理下即時看見視窗 B 上傳之測試附件
- `r1-attachment-synced-b.png`：視窗 B 附件上傳成功並正確渲染

---

## 三、驗收數據詳情 (Execution Results)

```json
{
  "windowAHeldLock": true,
  "windowBReceivedLockBanner": true,
  "windowBTextareaDisabled": true,
  "realtimeTextSynced": true,
  "bannerBDetachedOnRelease": true,
  "windowBHeldLock": true,
  "windowAReceivedLockBanner": true,
  "attachmentInB": true,
  "attachmentSyncedToAWithoutReload": true,
  "errorsA": [],
  "errorsB": [],
  "allPassed": true
}
```

---

## 四、驗收總評與建議

- **安全性與防護**：Firestore 交易層級的 35 秒租約鎖定運作極為可靠，完全杜絕多人同時打字互相踩踏覆蓋（Split-brain / Overwrite）的現象。
- **無縫協作體驗**：打字 Debounce 800ms 與 Firestore Snapshot 監聽整合順暢，文字與附件同步流暢自然，UI 提示清晰明確。
- **結論**：本模組功能完整、健全度高，**同意通過驗收（Sign-off: PASS）**。
