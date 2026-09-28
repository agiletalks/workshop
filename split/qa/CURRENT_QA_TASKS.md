# SPLIT 專案目前待驗收任務總覽 (Current QA Tasks)

> **最後更新**：2026-09-28  
> **維護端**：DEV 開發團隊  
> **適用對象**：AgileTalks 中央 QA 驗收工程師  

本文件彙整目前 SPLIT 講義系統已完成開發、通過 DEV 自測，並**正式交付給 QA 團隊進行獨立驗收與複測**的任務清單。
QA 工程師接單時，請直接點擊對應的「驗收需求委託書」開始執行。

---

## 📋 任務清單與狀態

| 任務編號 | 模組名稱 | 任務類型 | 當前狀態 | 需求委託書與工作目錄 | 預期產出報告路徑 |
|---|---|---|---|---|---|
| **TASK-SPLIT-01** | **模組 6：語音筆記** | 缺陷修復複測<br>(Retest) | 🟢 **複測通過 (CLOSED)**<br>(QA 驗收完成) | [`split/qa/2026-09-28-split-voice-verification/RETEST_REQUEST_VOICE.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-voice-verification/RETEST_REQUEST_VOICE.md) | [`split/qa/2026-09-28-split-voice-verification/retests/QA_RETEST_R1_voice_notes_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-voice-verification/retests/QA_RETEST_R1_voice_notes_be97faf_20260928.md) |
| **TASK-SPLIT-02** | **模組 5：課堂提問** | 缺陷修復複測<br>(R2 Retest) | 🟢 **R2 複測通過 (CLOSED)**<br>(QA 雙端驗收完成) | [`split/qa/2026-09-28-split-questions-verification/dev-responses/DEV_RESPONSE_R1_module5_questions_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/dev-responses/DEV_RESPONSE_R1_module5_questions_be97faf_20260928.md) | [`split/qa/2026-09-28-split-questions-verification/retests/QA_RETEST_R2_module5_questions_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/retests/QA_RETEST_R2_module5_questions_be97faf_20260928.md) |
| **TASK-SPLIT-03** | **模組 4：隨堂筆記協作** | 全新功能驗收<br>(New Verification) | 🟢 **驗收通過 (CLOSED)**<br>(QA 雙端驗收完成) | [`split/qa/2026-09-28-split-notes-collaboration/QA_BRIEF_MODULE4_NOTES.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-notes-collaboration/QA_BRIEF_MODULE4_NOTES.md) | [`split/qa/2026-09-28-split-notes-collaboration/reports/QA_VERIFICATION_R1_module4_notes_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-notes-collaboration/reports/QA_VERIFICATION_R1_module4_notes_be97faf_20260928.md) |
| **TASK-SPLIT-05** | **課堂錄音便籤與列印手冊** | 缺陷修復複測<br>(R2 Retest) | 🟢 **R2 複測通過 (CLOSED)**<br>(QA 雙端 E2E 驗收完成) | [`split/qa/2026-09-28-split-voice-memo-and-handbook/QA_BRIEF_MODULE_VOICE_MEMO_HANDBOOK.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-voice-memo-and-handbook/QA_BRIEF_MODULE_VOICE_MEMO_HANDBOOK.md) | [`split/qa/2026-09-28-split-voice-memo-and-handbook/retests/QA_RETEST_R2_voice_memo_handbook_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-voice-memo-and-handbook/retests/QA_RETEST_R2_voice_memo_handbook_be97faf_20260928.md) |
| **TASK-SPLIT-06** | **隨堂小編設定、講師重點/詳細內容即時同步與全域導航** | 全新功能驗收<br>(R1 Verification) | 🟢 **驗收通過 (CLOSED)**<br>(QA 雙端 E2E 驗收完成) | [`split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/QA_BRIEF_INSTRUCTOR_EDIT_AND_SYNC.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/QA_BRIEF_INSTRUCTOR_EDIT_AND_SYNC.md) | [`split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/reports/QA_VERIFICATION_R1_instructor_edit_and_sync_debb5cc_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/reports/QA_VERIFICATION_R1_instructor_edit_and_sync_debb5cc_20260928.md) |
| **TASK-SPLIT-07** | **班級門禁安全校驗與專屬網址綁定** | 全新安全性驗收<br>(R1 Verification) | 🟢 **驗收通過 (CLOSED)**<br>(QA 雙端 E2E 驗收完成) | [`split/qa/2026-09-28-split-gate-security-and-url-lock/QA_BRIEF_GATE_SECURITY_URL_LOCK.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-gate-security-and-url-lock/QA_BRIEF_GATE_SECURITY_URL_LOCK.md) | [`split/qa/2026-09-28-split-gate-security-and-url-lock/reports/QA_VERIFICATION_R1_gate_security_url_lock_d258b0d_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-gate-security-and-url-lock/reports/QA_VERIFICATION_R1_gate_security_url_lock_d258b0d_20260928.md) |
| **TASK-SPLIT-08** | **四大支柱內容架構、統一資源上傳器與全日教材專書生成** | 全新功能驗收<br>(R1 Verification) | 🟢 **驗收通過 (CLOSED)**<br>(QA 雙端 E2E 驗收完成) | [`split/qa/2026-09-28-split-textbook-and-resources/QA_BRIEF_TEXTBOOK_AND_RESOURCES.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-textbook-and-resources/QA_BRIEF_TEXTBOOK_AND_RESOURCES.md) | [`split/qa/2026-09-28-split-textbook-and-resources/reports/QA_VERIFICATION_R1_textbook_resources_18078dd_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-textbook-and-resources/reports/QA_VERIFICATION_R1_textbook_resources_18078dd_20260928.md) |
| **TASK-SPLIT-09** | **隨堂小編深度思索提煉、逐字稿修潤與一體化自動整理** | 全新功能驗收<br>(R1 Verification) | 🟢 **驗收通過 (CLOSED)**<br>(QA 雙端 E2E 驗收完成) | [`split/qa/2026-09-29-split-voice-synthesis-and-transcript/QA_BRIEF_VOICE_SYNTHESIS.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-voice-synthesis-and-transcript/QA_BRIEF_VOICE_SYNTHESIS.md) | [`split/qa/2026-09-29-split-voice-synthesis-and-transcript/reports/QA_VERIFICATION_R1_voice_synthesis_2e915bb_20260929.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-voice-synthesis-and-transcript/reports/QA_VERIFICATION_R1_voice_synthesis_2e915bb_20260929.md) |


---

## 📌 任務詳細指引速查

### 1. 【TASK-SPLIT-01】模組 6 語音筆記複測
- **核心目標**：驗證初測發現的 3 項 P1 缺陷（重複追加、閉包覆寫第一句、跨頁洩漏）是否已徹底解決。
- **DEV 已備證據**：`split/qa/2026-09-28-split-voice-verification/scripts/test-voice-independent.cjs` 已執行通過（9 PASS / 0 FAIL）。
- **DEV 修復說明**：請詳閱同目錄之 `dev-responses/DEV_RESPONSE_VOICE_20260928.md`。

### 2. 【TASK-SPLIT-02】模組 5 課堂提問全新驗收
- **核心目標**：驗證即時提問、+1 附議切換、雙視窗無刷新即時廣播、投影片跳轉、講師回覆，以及**介面用字審查（全面使用「提問」，嚴禁出現「便利貼」字眼）**。
- **資料路徑**：`split_data/{classId}/generations/{generationId}/questions/{questionId}`。
- **測試重點**：請以 Playwright / Puppeteer 模擬雙視窗即時廣播，並截圖存證至 `evidence/`。

---

## 📂 歷史驗收資產與參考目錄
- 模組 2 線上雲端白板：`split/qa/2026-09-28-split-board-verification/`
- 中央後台與免密碼進班：`split/qa/2026-09-28-central-admin-verification/`
- 第 1~2 批次合併報告：`split/qa/2026-09-28-split-batch-1-2-verification/`
