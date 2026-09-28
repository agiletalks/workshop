# SPLIT 線上雲端白板功能初次驗收測試報告

- **測試日期**：2026-09-28
- **測試環境**：本機 (http://localhost:5000/workshop/split/)
- **測試範圍**：線上雲端白板 (board.html) 移植、世代隔離合約、組內共用與跨組觀摩唯讀模式
- **專用測試班級**：`qa-split-test-01`
- **測試結果總覽**：5 PASS, 0 FAIL, 0 PARTIAL (100% 通過)

---

## 測試案例檢驗表 (Test Cases Table)

| 測試案例 ID | 驗證項目 | 測試內容與合約規則 | 檢驗結果 | 佐證檔案 (Evidence) |
|---|---|---|:---:|---|
| **TC-BOARD-01** | 白板檔案與品牌標籤 | 檢查 `public/board.html` 是否具備 SPLIT 專屬品牌標題與 Card Teal 主題色 | **PASS** | `evidence/test-board-output.log` |
| **TC-BOARD-02** | Firestore 世代路徑合約 | 驗證是否監聽 `split_classes`，並寫入 `split_data/{classId}/generations/{generationId}/boards/{boardType}_team_{teamId}` | **PASS** | `evidence/test-board-output.log` |
| **TC-BOARD-03** | 跨組觀摩與切回我組 | 驗證白板支援 1~12 組切換，且具備 `[切回我組]` (btn-return-my-team) 按鈕 | **PASS** | `evidence/test-board-output.log` |
| **TC-BOARD-04** | 學員身分 Session 繼承 | 驗證自動讀取 `split_user_session` 並精確設定 `userAssignedTeam` 與觀摩標記 | **PASS** | `evidence/test-board-output.log` |
| **TC-BOARD-05** | 講義工作面板連動 | 驗證 `WorkbookPanel.tsx` 實作按鈕自動帶入 `c=...&team=...&type=...` 直連白板 | **PASS** | `evidence/test-board-output.log` |

---

## 缺陷與待改善項目 (Issues Table)

*本輪驗收無未解決之缺陷。*

---

## 結論
線上雲端白板模組已完整符合《SPLIT 工作坊功能規格與架構交接全指南》之模組 2 規範，權限與世代路徑驗證全數 PASS，可進入下一階段功能開發。
