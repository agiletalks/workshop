# SPLIT 模組 5 課堂提問第 2 輪獨立複測報告 (QA Retest R2)

- **複測日期**：2026-09-28（Asia/Taipei）
- **複測對象**：SPLIT 模組 5「課堂提問」P0 權限缺陷修復後雙視窗即時廣播端到端驗收
- **基準版本**：`be97faf`
- **測試班級**：`qa-split-test-01`（世代 Gen 1）
- **關聯初測報告**：[`split/qa/2026-09-28-split-questions-verification/reports/QA_VERIFICATION_R1_module5_questions_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/reports/QA_VERIFICATION_R1_module5_questions_be97faf_20260928.md)
- **DEV 修復回應**：[`split/qa/2026-09-28-split-questions-verification/dev-responses/DEV_RESPONSE_R1_module5_questions_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/dev-responses/DEV_RESPONSE_R1_module5_questions_be97faf_20260928.md)
- **複測結論**：**✅ 全數通過 (PASS)。重大阻斷缺陷 BUG-SPLIT-Q-01 已徹底修復並閉環標記為 CLOSED。**

---

## 一、缺陷複測判定與閉環對照表

| 缺陷編號 | 初測嚴重度 | 缺陷描述 | DEV 修復對策 | R2 複測實證 | 最終判定 |
|---|---|---|---|---|---|
| **BUG-SPLIT-Q-01** | **P0** | Firestore 安全性規則缺少世代提問子集合授權，導致發問與雙端即時廣播被拒 (HTTP 403)。 | `firestore.rules` 補齊 `generations/{genId}/questions` 與 `generations/{genId}/boards` 讀寫規則，並透過 `firebase deploy --only firestore:rules` 部署生效。 | 1. 執行合約檢查腳本 `test-questions-contract.cjs`，Q02 安全性規則審查 **PASS**。<br>2. 執行 Playwright 雙視窗即時廣播 E2E 腳本，學員發問成功、無刷新廣播成功、+1 附議雙向同步成功，控制台 **0 Error**。 | **CLOSED** |

---

## 二、R2 核心驗收案例檢驗總表

| 案例編號 | 驗收項目 | R1 判定 | R2 判定 | R2 實測細節與證據 |
|---|---|:---:|:---:|---|
| **TC-Q01** | 學員發布提問（UI 與雲端寫入） | FAIL | **PASS** | 視窗 A（第 1 組 · 小明）送出提問，卡片立即呈現於抽屜頂部，狀態為「⌛ 待解答」，無彈出錯誤 Dialog。<br>• 佐證截圖：`evidence/r2-window-a-submitted.png` |
| **TC-Q02** | 附議防重複切換 (+1 與取消) | PARTIAL | **PASS** | 視窗 B（第 2 組 · 小華）點擊「👍 附議」，數值遞增為 1；再次點擊數值減回 0，無無限膨脹漏洞。<br>• 佐證截圖：`evidence/r2-window-b-upvote-clicked.png` |
| **TC-Q03** | 雙視窗無刷新即時廣播 (Real-time Sync) | FAIL | **PASS** | 視窗 A 發問後，**視窗 B 在無重新整理頁面（No-reload）狀態下即時渲染新問題**；視窗 B 點擊附議後，**視窗 A 之附議數即時跳為 1**。<br>• 佐證截圖：`evidence/r2-window-b-broadcast-received.png`、`evidence/r2-window-a-upvote-synced.png` |
| **TC-Q04** | 範圍過濾、狀態篩選與熱門排序 | PASS | **PASS** | 「全班提問 / 本頁提問」、「全部 / 待解答 / 已解答」及「最多附議 👍」過濾與排序邏輯無誤。 |
| **TC-Q05** | 講師回覆與狀態流轉 | PARTIAL | **PASS** | 講師身分控制項與資料合約 `isAnswered` 標記、`answeredAt` 時間戳記與回覆區塊渲染驗證無誤。 |
| **TC-Q06** | 介面用字合規審查（紅線審查） | PASS | **PASS** | 全模組原始碼與 DOM 結構 100% 遵從「提問／課堂提問」，**完全無「便利貼」或「提問便利貼」字眼**。 |

---

## 三、E2E 真機自動化測試紀錄

- **測試腳本**：[`split/qa/2026-09-28-split-questions-verification/scripts/e2e-questions-r2-dual-window.cjs`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/scripts/e2e-questions-r2-dual-window.cjs)
- **執行環境**：Playwright + Microsoft Edge（雙獨立 Browser Context，1280x800），本地預覽伺服器 `http://localhost:5000/workshop/split/?c=qa-split-test-01`
- **執行日誌與狀態摘要**（`evidence/r2-execution-summary.json`）：
  ```json
  {
    "qVisibleInA": true,
    "qBroadcastToBWithoutReload": true,
    "upvoteInB": true,
    "upvoteSyncedToAWithoutReload": true,
    "cancelUpvoteInB": true,
    "cancelUpvoteSyncedToA": true,
    "slideJumpSuccess": true,
    "cleanupComplete": true,
    "errorsA": [],
    "errorsB": [],
    "allPassed": true
  }
  ```
- **測試過程**：
  1. 視窗 A 登入為「小明」（第 1 組），視窗 B 登入為「小華」（第 2 組）。
  2. 兩端開啟課堂提問抽屜，驗證 Firestore 訂閱正常建立，控制台 0 錯誤。
  3. 視窗 A 發問：`QA-R2-Story-Split-<timestamp>`，卡片立即建立。
  4. 視窗 B 在無重新整理狀況下自動收到並渲染該卡片（廣播延遲 < 800ms）。
  5. 視窗 B 點擊附議，視窗 B 變為 `👍 1`，視窗 A 畫面同步更新為 `👍 1`。
  6. 視窗 B 再次點擊取消附議，視窗 B 變為 `👍 0`，視窗 A 同步變回 `👍 0`。
  7. 視窗 B 點擊「頁面: split-01」標籤，背景主畫面順暢跳轉至該投影片。
  8. 發問者（視窗 A）點擊垃圾桶刪除提問，雙端卡片即時銷毀，雲端資料庫零殘留。

---

## 四、驗收結論與結案宣告

SPLIT 模組 5「課堂提問」在經過 DEV 團隊針對 `firestore.rules` 進行精準修復並部署上線後，所有端到端協同與多視窗即時廣播功能均已達到預期品質標準。

**判定：模組 5 課堂提問正式通過驗收，予以閉環結案 (CLOSED)！**
