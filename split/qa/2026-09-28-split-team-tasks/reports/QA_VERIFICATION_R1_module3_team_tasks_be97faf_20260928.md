# QA 驗收報告：SPLIT 模組 3 Team Task 團隊演練動態插入與協作系統 (R1)

- **測試對象**：SPLIT 模組 3（團隊演練動態插入、講師 In-App 管理、左側任務卡與右側組內筆記租約鎖/附件協作）
- **驗收輪次**：第 1 輪（Round 1，全新驗收）
- **基準 Commit**：`be97faf`
- **驗收日期**：2026-09-28
- **執行人**：AgileTalks 中央首席 QA 驗收工程師
- **測試結果**：**100% PASS（通過正式驗收，准予發布合流）**
- **體驗建議 (P3 UX)**：刪除演練任務時存在雙重 `window.confirm` 連續彈窗（`TaskEditorModal.tsx` 與 `App.tsx` 各觸發一次），建議 DEV 未來版本收斂為單一確認提示。

---

## 一、驗收涵蓋範疇與 7 大場景實測結果 (Verification Scope & Results)

依據 DEV 提供之需求委託書 [`QA_BRIEF_MODULE3_TEAM_TASK.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-team-tasks/QA_BRIEF_MODULE3_TEAM_TASK.md) 與 `CURRENT_QA_TASKS.md` (TASK-SPLIT-04)，本輪以 **Playwright 雙 Context 真機視窗併發模擬**（視窗 A：後台免密直通講師 / 視窗 B：第 1 組學員小明）完整實測 7 大場景：

| 場景編號 | 測試場景與驗證重點 | 預期指標 | 實測結果 | 判定 |
| :--- | :--- | :--- | :--- | :---: |
| **TC-TASK-01** | **講師 In-App 建立演練任務** | 講師進入系統點擊 `[🎯 +演練]`，填寫完整欄位儲存後自動導航至新任務頁面 | 講師端填寫【實戰演練】INVEST 原則驗證與拆解，點擊儲存後成功關閉彈窗並自動導航至新任務卡 | **PASS** |
| **TC-TASK-02** | **學員端零刷新（No-reload）即時插入** | 視窗 A 新增演練，視窗 B (學員端無重整) 側邊欄與投影片自動出現新任務 (🎯 標記)，總頁數增加 | 視窗 B 在無任何頁面刷新下，側邊欄即時浮現 `🎯 演練` 項目，總頁數由 27 頁平滑遞增為 28 頁 | **PASS** |
| **TC-TASK-03** | **頁碼動態重編與導航跳轉** | 新任務插入於 `slide-3` 後，新任務動態重編為頁碼 4，原第 4 頁順延為 5，上/下一頁流暢銜接 | 任務頁頂部與底部正確顯示 `頁碼 4 / 28`，點擊下一頁正確切換至 `User Story` (頁碼 5 / 28)，返回頁碼 4 正常 | **PASS** |
| **TC-TASK-04** | **左側任務卡規格與工具連動** | 情境背景、目標、步驟清單完整呈現；AI 提示詞一鍵複製寫入剪貼簿；連動專屬白板按鈕 | 任務卡四個區塊完整渲染；AI 提示詞按鈕點擊即時呈現反饋；白板連動按鈕正確帶入 `team-1` 參數 | **PASS** |
| **TC-TASK-05** | **右側隨堂筆記 35s 租約鎖與即時同步** | 學員端在演練頁面點擊輸入筆記取得 35 秒租約鎖；打字即時同步至講師端 | 學員 B 順利取得綠色編輯權橫幅（每 15 秒心跳續約保護）；打字後經 debounce 800ms，講師端於 1.5 秒內即時同步接收內容 | **PASS** |
| **TC-TASK-06** | **成果作品庫檔案上傳與雙向同步** | 學員端上傳討論截圖附件，講師端即時看見成果檔案預覽並可下載 | 學員 B 上傳 1x1 PNG 成果截圖，視窗 B 與視窗 A 均在無刷新下即時呈現該成果附件 | **PASS** |
| **TC-TASK-07** | **講師編輯時限與刪除回縮頁面** | 講師修改時限為 25 分鐘即時反映至學員端；刪除任務後教材自動回縮至 27 頁，頁碼重新重編 | 講師修改時限即時反映；點擊刪除後學員端側邊欄演練項目平滑消失，總頁數精準恢復為 27 頁 | **PASS** |

---

## 二、驗收證據鏈盤點 (Evidence & Artifacts)

### 1. 執行腳本與報告清單
- **E2E 獨立自動化測試腳本**：[`split/qa/2026-09-28-split-team-tasks/scripts/e2e-team-tasks.cjs`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-team-tasks/scripts/e2e-team-tasks.cjs)
- **E2E 執行彙總數據**：[`split/qa/2026-09-28-split-team-tasks/evidence/r1-execution-summary.json`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-team-tasks/evidence/r1-execution-summary.json)
- **講師端 Console 紀錄**：[`split/qa/2026-09-28-split-team-tasks/evidence/r1-console-a.json`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-team-tasks/evidence/r1-console-a.json)（0 Error）
- **學員端 Console 紀錄**：[`split/qa/2026-09-28-split-team-tasks/evidence/r1-console-b.json`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-team-tasks/evidence/r1-console-b.json)（0 Error）

### 2. 真機截圖證據
- `tc01-02-instructor-insert-a.png`：講師端建立演練任務並導航至任務頁面
- `tc01-02-student-synced-b.png`：學員端無刷新狀態下，側邊欄即時浮現 `🎯 【實戰演練】... 演練`
- `tc03-reindexing-navigation-b.png`：學員端驗證新任務編號為 `頁碼 4 / 28`，接續原第 4 頁平滑推移至 `頁碼 5 / 28`
- `tc04-mission-card-and-prompt-b.png`：左側任務卡完整呈現背景、目標、步驟指引與 AI 提示詞一鍵複製
- `tc05-06-notes-attachment-b.png`：學員端取得 35 秒租約鎖輸入小組共識筆記，並上傳成果附件
- `tc05-06-notes-attachment-a.png`：講師端無刷新狀態下即時同步接收該小組筆記與成果截圖
- `tc07-task-deleted-a.png`：講師端執行刪除演練任務
- `tc07-task-deleted-b.png`：學員端無刷新狀態下演練任務平滑移除，講義頁數回縮為 27 頁

---

## 三、驗收數據彙總 (Execution Summary)

```json
{
  "instructorBypass": true,
  "studentLogin": true,
  "initialStudentPages": 27,
  "taskCreatedByInstructor": true,
  "studentReceivedTaskNoReload": true,
  "postInsertStudentPages": 28,
  "reindexingVerified": true,
  "missionCardVerified": true,
  "aiPromptCopied": true,
  "whiteboardLinkCorrect": true,
  "notesLeaseLockAcquired": true,
  "notesRealtimeSynced": true,
  "attachmentUploadedAndSynced": true,
  "taskEditedAndSynced": true,
  "taskDeletedAndPagesReverted": true,
  "finalStudentPages": 27,
  "errorsA": [],
  "errorsB": [],
  "allPassed": true
}
```

---

## 四、發現事項與改善建議 (Findings & Suggestions)

### 1. 【P3 體驗優化】刪除演練任務存在雙重確認彈窗
- **現象**：講師點擊「🗑️ 刪除此演練」時，會先彈出 `TaskEditorModal.tsx` 的 `window.confirm("確定要刪除演練【...】嗎？")`，點擊確定後，又接著彈出 `App.tsx` 的 `window.confirm("確定要刪除此團隊演練任務嗎？\n組員已寫的筆記與上傳成果仍會保留在雲端...")`。
- **影響**：功能完全正常運作，但講師需連續點擊兩次「確定」，體驗略微繁瑣。
- **建議**：建議保留 `App.tsx` 具備安全說明（保留雲端筆記成果）之確認提示，移除 `TaskEditorModal.tsx` 內部 redundant 的第一道 confirm。

---

## 五、驗收結論

SPLIT 模組 3 之「團隊演練動態插入、頁碼動態重編、左側任務卡與右側筆記租約鎖/作品庫協同」技術架構扎實、即時響應表現優異，全流程通過 E2E 真機高強度驗收。

**正式判定：🟢 100% PASS（准予發布合流）**
