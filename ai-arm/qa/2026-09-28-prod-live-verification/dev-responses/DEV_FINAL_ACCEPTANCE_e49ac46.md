# AI-ARM 正式站複測全數通過與結案總結 (e49ac46)

**報告日期**：2026-09-28  
**依據 QA 報告**：[`QA_RETEST_e49ac46_20260928.md`](file:///C:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/reports/QA_RETEST_e49ac46_20260928.md)  
**目標環境**：Firebase Production (`https://agiletalks-workshop.web.app/workshop/ai-arm/`)  
**最終基準 Commit**：[`e49ac46`](https://github.com/agiletalks/workshop/commit/e49ac46)  

---

## 1. 執行總結

在 `e49ac46` 二次修復版本中，QA 團隊所指定的 3 項重點複測**全數 PASS**：

| 複測項目 | 判定結果 | 實際驗證成果 |
|---|---|---|
| **BUG-RETEST-01（手動輸入頁碼）** | **PASS** | 講師進入 2026-test P05 Users 用戶，點擊手動輸入，副標題精確即時顯示「目前頁面：P05 · Users 用戶」，換頁連動正常。 |
| **BUG-RETEST-02（工具箱數量統計）** | **PASS** | 開啟「教材與工具」彈窗，「輔助工具箱」按鈕右側徽章動態正確顯示「4 工具」，卡片清單完整呈現決策表、狀態表、事件風暴、小組白板。 |
| **AUTH-REVIEW-01（跨班身分隔離政策）** | **PASS** | 講師與第 2 組學員於 `2026-test` 登入後，同一瀏覽器切換至 `?c=202609-ibm` 均正確被阻擋並呈現 IBM 門禁畫面（身分未洩漏／未自動沿用）；切回 `?c=2026-test` 則順利恢復原班身分，跨班隔離機制正式生效。 |

結合前一輪驗收結果，本次正式站上線驗收回報之 **7 項原始缺陷（BUG-PROD-01 ～ BUG-PROD-07）**、**2 項二次缺陷（BUG-RETEST-01、BUG-RETEST-02）** 及 **1 項安全政策審查（AUTH-REVIEW-01）** 已全數確認修復並成功上線。

---

## 2. QA 限制與建議事項之文件校正與政策說明

感謝 QA 團隊在報告第 28~35 行所提出的嚴謹備註，DEV 團隊在此針對三項細節正式完成技術文件校正與政策說明：

### 1. 班級身分認證之舊版向後相容與平滑遷移政策
- **實作設計考量**：
  在 `checkExistingAuth()` 中，若讀取班級特定金鑰 `ai_arm_auth_user_${currentClassId}`，且該舊資料中尚未包含 `classId` 欄位時，系統予以寬容放行。這是**刻意保留的平滑遷移設計（Graceful Migration）**，旨在防止線上正在進行演練的學員或講師因 DEV 發布版號而遭遇非預期的強制登出。
- **隔離安全保證**：
  - 一旦學員或講師重新報到，新版身分物件均全面寫入 `classId: currentClassId`。
  - 對於通用備援鍵 `ai_arm_auth_user`，則實施最嚴格判定：**僅在 `parsed.classId === currentClassId` 時才允許沿用**。若偵測到 `classId` 存在但不一致，一律拒絕自動登入並拉起門禁。此機制兼顧了「既有課堂不中斷」與「跨客戶專班零資料滲透」雙重目標。

### 2. AI 編排模型端點校正
- DEV 先前文字敘述提及 Gemini 2.5 Flash 屬筆誤；程式原始碼（[`ai-arm/index.html:9182`](file:///C:/Antigravity/workshop/ai-arm/index.html#L9182)）中，正式調用之模型端點為 **`gemini-2.0-flash`**（Google Generative Language API）。DEV 文件已同步校正。

### 3. 實作工具架構規格正式確立
- 正式規格確認：AI-ARM 之 4 大實作工具（決策表、狀態矩陣、事件風暴、小組白板）均採用 **獨立新分頁大畫布 (`_blank`)** 架構。
- 此架構決策為最終正式規格，避免了 iframe 內嵌帶來之沙盒權限限制、行動裝置視窗捲軸衝突及跨來源 CSP 阻擋，後續 QA 之畫布操作與匯出入驗收皆以獨立分頁全螢幕環境為基準。

---

## 3. 正式站狀態

- **最新正式版本**：[`e49ac46`](https://github.com/agiletalks/workshop/commit/e49ac46)
- **正式站網址**：`https://agiletalks-workshop.web.app/workshop/ai-arm/`
- **正式站狀態**：線上服務運作正常（`HTTP 200 OK`），新版程式碼已全面生效。
