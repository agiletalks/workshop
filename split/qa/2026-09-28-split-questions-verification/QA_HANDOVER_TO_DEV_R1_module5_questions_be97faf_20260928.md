# 【QA 驗收回饋與修復委託書】模組 5：課堂提問功能

> **發布日期**：2026-09-28  
> **發布端**：AgileTalks 中央 QA 驗收工程師  
> **接收端**：SPLIT DEV 開發團隊  
> **關聯驗收報告**：[`split/qa/2026-09-28-split-questions-verification/reports/QA_VERIFICATION_R1_module5_questions_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/reports/QA_VERIFICATION_R1_module5_questions_be97faf_20260928.md)  
> **驗收結論**：**🔴 FAIL（受 P0 阻斷缺陷影響，待修復後複測）**  

---

## 尊敬的 DEV 團隊：

感謝您交付 SPLIT 模組 5「課堂提問」功能。
QA 團隊已完成多視窗 E2E 瀏覽器真機實測（Playwright + Edge）與合約邏輯驗證。

### 👍 優秀成果肯定
1. **紅線用字審查 100% PASS**：介面、按鈕、提示與原始碼全面遵從「提問／課堂提問」，**完全無「便利貼」或「提問便利貼」字眼**。
2. **元件架構完整**：`QuestionsDrawer` 抽屜面板、表單防呆、篩選過濾、排序與講師回覆等前端互動設計嚴謹。

---

## 🔴 關鍵阻斷缺陷與修復要求

### 【BUG-SPLIT-Q-01】P0：Firestore 安全性規則缺少世代提問子集合授權

- **缺陷現象**：
  學員於介面送出提問時彈出 `提問送出失敗，請確認網路連線`；控制台出現 `FirebaseError: Missing or insufficient permissions.`，雙視窗即時廣播與 Snapshot 訂閱完全癱瘓。
- **根因分析**：
  前端實作採班級世代隔離架構，路徑為：
  `split_data/{classId}/generations/{generationId}/questions/{questionId}`
  但根目錄 [`firestore.rules`](file:///c:/Antigravity/workshop/firestore.rules) 僅配置舊版扁平路徑：
  `match /split_data/{classId}/questions/{questionId}`
  **缺少 `generations/{genId}/questions/{questionId}` 子集合授權**。
- **修復指引**：
  請在 [`firestore.rules`](file:///c:/Antigravity/workshop/firestore.rules) 約第 37–44 行加入世代提問集合授權：
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
  完成修改後請透過 Firebase CLI 部署安全性規則：
  ```bash
  firebase deploy --only firestore:rules
  ```

---

## 📋 協同複測指引 (DEV-QA 閉環)

修復完成並部署後，請 DEV 團隊依規範回覆：
1. 產出修復回應報告：
   `split/qa/2026-09-28-split-questions-verification/dev-responses/DEV_RESPONSE_R1_module5_questions_be97faf_20260928.md`
2. 自測通過後交付 QA。
3. QA 將立即重新執行已備妥之雙視窗 E2E 驗收腳本：
   ```bash
   node split/qa/2026-09-28-split-questions-verification/scripts/e2e-questions-dual-window.cjs
   ```
   驗證無刷新即時同步與 +1 附議，完成結案。
