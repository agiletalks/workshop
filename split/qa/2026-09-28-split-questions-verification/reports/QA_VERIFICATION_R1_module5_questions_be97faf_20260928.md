# SPLIT 模組 5：課堂提問功能獨立驗收報告

- **驗收日期**：2026-09-28（Asia/Taipei）
- **驗收模組**：SPLIT 模組 5「課堂提問」（原稱提問便利貼，現全面更名為「提問」）
- **驗收委託依據**：[`split/qa/2026-09-28-split-questions-verification/QA_BRIEF_MODULE5_QUESTIONS.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/QA_BRIEF_MODULE5_QUESTIONS.md)
- **測試環境**：Windows 本地預覽伺服器 `http://localhost:5000/workshop/split/?c=qa-split-test-01`
- **測試工具**：Playwright 雙視窗瀏覽器自動化（Microsoft Edge 1280x800）、Node.js 合約與邏輯斷言腳本
- **驗收結論**：**❌ 驗收未通過 (FAIL)。核心即時雲端同步與提問寫入受 Firestore 權限阻斷 (P0)。**

---

## 一、驗收案例總表

| 案例編號 | 驗收項目 | 判定結果 | 實測說明與證據層級 |
|---|---|---|---|
| **TC-Q01** | 學員發布提問（UI 與雲端寫入） | **FAIL (BLOCKED)** | UI 發問面板正常呈現，但點擊「送出提問」後彈出 `提問送出失敗，請確認網路連線`。控制台捕獲 `FirebaseError: Missing or insufficient permissions.`，受 BUG-SPLIT-Q-01 阻斷。 |
| **TC-Q02** | 附議防重複切換 (+1 與取消) | **PARTIAL** | 動態點擊受阻於 TC-Q01 無法寫入資料；靜態與隔離合約腳本（Q03）驗證交易更新邏輯正確，可有效防止點擊次數無限膨脹。 |
| **TC-Q03** | 雙視窗跨學員無刷新即時廣播 | **FAIL (BLOCKED)** | 視窗 A（第 1 組 · 小明）與視窗 B（第 2 組 · 小華）開啟提問抽屜時，兩端皆出現 `[subscribeQuestions] error: FirebaseError: Missing or insufficient permissions.`，無法建立 Snapshot 監聽。 |
| **TC-Q04** | 範圍過濾、狀態篩選與熱門排序 | **PASS** | UI 元件具備「全班提問 / 本頁提問」、「全部 / 待解答 / 已解答」及「最新發問 / 最多附議」切換列；合約測試（Q05, Q06）驗證資料篩選與排序邏輯無誤。 |
| **TC-Q05** | 講師回覆與狀態流轉 | **PARTIAL** | 講師身分控制項（`✍️ 立即回覆此提問`）與解答輸入框在程式碼中就緒；雲端動態寫入受 TC-Q01 權限阻斷。合約測試（Q04）驗證 `isAnswered` 標記與 `answeredAt` 時間戳記設定正確。 |
| **TC-Q06** | 介面用字合規審查（紅線審查） | **PASS** | 全面檢視 `questionService.ts`、`QuestionsDrawer.tsx`、`TopBar.tsx`、`App.tsx`，**完全無「便利貼」或「提問便利貼」字眼**，100% 遵從「提問」、「課堂提問」規格。 |

---

## 二、重大缺陷回報 (DEV 修復指引)

### 🔴 BUG-SPLIT-Q-01 — P0：Firestore 安全性規則缺少世代提問子集合授權

- **缺陷描述**：
  前端實作採班級世代隔離架構，將提問存放於：
  `split_data/{classId}/generations/{generationId}/questions/{questionId}`
  然而根目錄之 [`firestore.rules`](file:///c:/Antigravity/workshop/firestore.rules#L41-L43) 僅配置了舊版扁平路徑：
  ```
  match /split_data/{classId}/questions/{questionId} {
    allow read, write: if true;
  }
  ```
  未宣告 `generations/{genId}/questions/{questionId}` 子集合授權。
- **影響範圍**：
  導致全班所有學員、講師在呼叫 `subscribeQuestions`、`addQuestion`、`toggleUpvoteQuestion`、`answerQuestion` 時，一律遭 Firebase 後端阻絕（HTTP 403 / `FirebaseError: Missing or insufficient permissions.`），使得模組 5 的雲端協作、即時同步與發問功能完全癱瘓。
- **重現實證**：
  1. 執行 Playwright 雙視窗測試腳本 [`split/qa/2026-09-28-split-questions-verification/scripts/e2e-questions-dual-window.cjs`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/scripts/e2e-questions-dual-window.cjs)。
  2. 視窗 A 輸入問題並點擊送出，瀏覽器跳出 Dialog：`提問送出失敗，請確認網路連線`。
  3. 控制台日誌存證於 `evidence/console-a.json` 與 `evidence/console-b.json`：
     ```json
     {
       "type": "error",
       "text": "[subscribeQuestions] error: FirebaseError: Missing or insufficient permissions."
     },
     {
       "type": "error",
       "text": "[QuestionsDrawer] addQuestion error: FirebaseError: Missing or insufficient permissions."
     }
     ```
  4. 截圖存證：`evidence/questions-after-submit-a.png`、`evidence/questions-window-b.png`。
- **DEV 修復建議**：
  請 DEV 修改 [`firestore.rules`](file:///c:/Antigravity/workshop/firestore.rules)（約第 37–44 行），加入世代提問集合之讀寫權限：
  ```diff
      // 世代演練筆記與提問抽屜
      match /split_data/{classId}/generations/{genId}/notes/{noteId} {
        allow read: if true;
        allow write: if true;
      }
  +   match /split_data/{classId}/generations/{genId}/questions/{questionId} {
  +     allow read, write: if true;
  +   }
      match /split_data/{classId}/questions/{questionId} {
        allow read, write: if true;
      }
  ```
  修改完成後需透過 Firebase CLI 佈署規則：`firebase deploy --only firestore:rules`。

---

## 三、自動化合約與邏輯驗證結果

執行獨立合約審查腳本：
```bash
node split/qa/2026-09-28-split-questions-verification/scripts/test-questions-contract.cjs
```
**測試結果清單**（6 PASS / 1 FAIL）：
1. `[PASS] Q01-PATH-CONTRACT`: 資料集合路徑格式合約正確。
2. `[FAIL] Q02-SECURITY-RULE-AUDIT`: 規則審查自動抓出 `firestore.rules` 缺少世代授權（精準捕獲 BUG-SPLIT-Q-01）。
3. `[PASS] Q03-UPVOTE-DEDUPLICATION`: 附議防重複切換邏輯正確（A 點擊 ➔ 1，再點 ➔ 0，B 點 ➔ 1）。
4. `[PASS] Q04-INSTRUCTOR-REPLY`: 講師回覆狀態標記（`isAnswered: true`）與時間戳記邏輯正確。
5. `[PASS] Q05-FILTERING-LOGIC`: 本頁提問過濾與已解答/待解答狀態過濾邏輯正確。
6. `[PASS] Q06-SORTING-LOGIC`: 熱門排序（附議數降冪）與最新發問排序正確。
7. `[PASS] Q07-WORDING-COMPLIANCE`: 嚴格禁用詞審查全數通過，無任何「便利貼」或「提問便利貼」殘留。

---

## 四、驗收總結與後續建議

模組 5 的前端介面刻畫、抽屜互動、表單防呆以及用字規範均具備極高品質且完全合規。
然而，由於 **`firestore.rules` 未同步擴充世代提問集合路徑**，導致所有雲端即時互動功能在真機環境下均被拒絕存取。

請 DEV 團隊：
1. 修復 `firestore.rules` 並完成規則發布。
2. 產出 `split/qa/2026-09-28-split-questions-verification/dev-responses/DEV_RESPONSE_MODULE5_QUESTIONS.md`。
3. 通知 QA 團隊重跑 `e2e-questions-dual-window.cjs` 進行閉環複測。
