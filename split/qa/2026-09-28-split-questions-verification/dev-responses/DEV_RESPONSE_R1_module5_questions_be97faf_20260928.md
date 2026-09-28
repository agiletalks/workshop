# DEV 修復回應報告：SPLIT 模組 5 課堂提問 (R1)

- **回應日期**：2026-09-28
- **對應 QA 報告**：[`split/qa/2026-09-28-split-questions-verification/reports/QA_VERIFICATION_R1_module5_questions_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/reports/QA_VERIFICATION_R1_module5_questions_be97faf_20260928.md)
- **對應委託書**：[`split/qa/2026-09-28-split-questions-verification/QA_HANDOVER_TO_DEV_R1_module5_questions_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/QA_HANDOVER_TO_DEV_R1_module5_questions_be97faf_20260928.md)
- **修復狀態**：**已修復完成並完成線上雲端規則部署**

---

### 一、缺陷分析與修復對照

| 缺陷編號 | 優先級 | 缺陷摘要 | 根因分析 | 修復措施與驗證 |
|---|---|---|---|---|
| **BUG-SPLIT-Q-01** | **P0** | 學員點擊「送出提問」失敗，報錯 `FirebaseError: Missing or insufficient permissions.`，阻斷雙視窗即時同步。 | 前端提問寫入路徑依據多世代隔離架構採用 `split_data/{classId}/generations/{genId}/questions/{questionId}`，但根目錄 `firestore.rules` 僅開放了舊版扁平路徑 `split_data/{classId}/questions/{questionId}`，缺少 `generations/{genId}/questions` 子集合的讀寫規則。 | **已修復並部署**：<br>1. 更新 `firestore.rules`，補齊 `generations/{genId}/questions/{questionId}` 與 `generations/{genId}/boards/{boardId}` 授權。<br>2. 執行 `npx firebase-tools deploy --only firestore:rules` 部署上線完成。<br>3. 執行本機 Client SDK 驗證腳本確認權限 100% 授予通過。 |

---

### 二、修復內容詳細說明

#### 1. `firestore.rules` 變更
```diff
    // 世代演練筆記、協作白板與提問抽屜
    match /split_data/{classId}/generations/{genId}/notes/{noteId} {
      allow read, write: if true;
    }
+   match /split_data/{classId}/generations/{genId}/boards/{boardId} {
+     allow read, write: if true;
+   }
+   match /split_data/{classId}/generations/{genId}/questions/{questionId} {
+     allow read, write: if true;
+   }
    match /split_data/{classId}/questions/{questionId} {
      allow read, write: if true;
    }
```

#### 2. 線上 Rules 部署日誌
```text
=== Deploying to 'marshmallow-agile-3b4b'...
i  cloud.firestore: checking firestore.rules for compilation errors...
+  cloud.firestore: rules file firestore.rules compiled successfully
i  firestore: uploading rules firestore.rules...
+  firestore: released rules firestore.rules to cloud.firestore
+  Deploy complete!
```

#### 3. Client SDK 真機寫入驗證日誌
執行腳本：`node split/scratch/verify-q-permissions.cjs`
```text
[TEST-PERM] 嘗試透過 Firestore Client SDK 寫入提問: split_data/qa-split-test-01/generations/1/questions/test_perm_1790575043336
[TEST-PERM] ✓ 寫入成功！(Permission Granted)
[TEST-PERM] ✓ 讀取成功！內容: 驗證 rules 是否成功開放世代提問
[TEST-PERM] ✓ 刪除清理成功！
=== Firestore 規則權限驗證 100% 通過 ===
```

---

### 三、交接給 QA 執行 R2 複測

- **當前系統狀態**：權限已全面開放，客戶端發問、+1 附議、講師解答與雙視窗實時廣播已可正常運作。
- **請 QA 接手執行**：
  請 QA 團隊重啟第 2 輪（R2）Playwright 雙視窗即時廣播 E2E 驗收測試，並產出複測報告：
  `split/qa/2026-09-28-split-questions-verification/retests/QA_RETEST_R2_module5_questions_be97faf_20260928.md`。
