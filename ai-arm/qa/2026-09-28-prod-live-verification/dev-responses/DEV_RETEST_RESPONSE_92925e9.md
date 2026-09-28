# DEV 複測回應與二次修復報告 (基於 QA_RETEST_92925e9_20260928.md)

**報告日期**：2026-09-28  
**依據 QA 報告**：[`QA_RETEST_92925e9_20260928.md`](file:///C:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/reports/QA_RETEST_92925e9_20260928.md)  
**修復分支**：`main`  
**目標環境**：Firebase Production (`https://agiletalks-workshop.web.app/workshop/ai-arm/`)  

---

## 1. 執行總結

感謝 QA 團隊對 `92925e9` 進行深入且精準的複測。針對本輪回報之 **2 個新缺陷（P2 x 2）** 以及 **1 項跨班身分政策釐清（AUTH-REVIEW-01）**，DEV 團隊已全數完成方針確認、程式碼修復與本機端對端驗證：

| 項目代號 | 優先級 | 類型 | 處理狀態 | 處置摘要 |
|---|---|---|---|---|
| **BUG-RETEST-01** | **P2** | 缺陷 | **已修復** | 修正手動輸入彈窗在尋找標題 DOM 節點時的 ID 不一致問題（HTML 原為 `voice-manual-slide-hint`，JS 原查找 `voice-manual-target-slide`）。現已統一綁定，切換投影片（如 P05）彈窗即時精確顯示「目前頁面：P05 · Users 用戶」。 |
| **BUG-RETEST-02** | **P2** | 缺陷 | **已修復** | 移除輔助工具箱標籤寫死之「3 工具」，改以 `AI_ARM_TOOLS_CATALOG.length` 進行動態計算與綁定，目前精確顯示「4 工具」（決策表、狀態表、事件風暴、小組白板）。 |
| **AUTH-REVIEW-01** | **Policy** | 安全政策 | **已實施** | **確立跨班嚴格隔離政策**：在 `currentUser` 物件中強制記錄 `classId`；`checkExistingAuth()` 嚴格限定僅允許恢復 `classId === currentClassId` 之身分。若以 A 班已登入之瀏覽器開啟 B 班 URL（如 `?c=202609-ibm`），系統強制顯示門禁報到畫面，要求通過 B 班密碼與選組驗證，徹底防杜身分與權限跨班串聯。 |
| **BUG-PROD-02 (AI 編排說明)** | **Note** | 技術說明 | **規格釐清** | QA 所觀察到之便籤標題符合模板，係因 QA 測試瀏覽器中未配置 `GEMINI_API_KEY`，系統自動無縫降級至「離線/無金鑰 Graceful Degradation 本地排版引擎」。此為設計預期行為，確保在無外部 API 或斷網時教學不受阻；當環境配有有效金鑰時，系統即自動切換至 Gemini 2.5 Flash 深度語意排版。 |
| **BUG-PROD-06 (外開架構確認)** | **Note** | 架構確認 | **規格確認** | 再次確認 4 大實作工具（決策表、狀態矩陣、事件風暴、小組白板）均採用 **獨立新分頁大畫布 (`_blank`)** 架構。此決策旨在提供桌面級無邊界拖曳與建模畫布空間，避免 iframe 內嵌造成之沙盒限制、行動端捲軸衝突與 CSP 跨來源阻擋。 |

---

## 2. 缺陷修復與政策實施細節

### BUG-RETEST-01 (P2)：手動輸入彈窗頁碼即時同步

- **根本原因**：
  [`ai-arm/index.html`](file:///C:/Antigravity/workshop/ai-arm/index.html) 中，彈窗 HTML 標題副標標籤 ID 為 `voice-manual-slide-hint`，但 JS 函式 `openVoiceManualInputModal()` 查找之元素 ID 為 `voice-manual-target-slide`，造成查詢回傳 `null`，彈窗副標題停留在預設之「目前頁面：P01」。
- **修復方案**：
  於 `openVoiceManualInputModal()` 中相容查找 `voice-manual-slide-hint` 與 `voice-manual-target-slide`：
  ```javascript
  const targetEl = document.getElementById('voice-manual-slide-hint') || document.getElementById('voice-manual-target-slide');
  if (targetEl) targetEl.textContent = `目前頁面：${targetSlideId} · ${slideTitle}`;
  ```
- **QA 複測指引**：
  1. 講師開啟 `2026-test`，自目錄切換至 P05（或任一非 P01 投影片）。
  2. 點擊頂部「📝 手動筆記」按鈕。
  3. **預期結果**：彈窗副標題精確顯示「目前頁面：P05 · Users 用戶」。

---

### BUG-RETEST-02 (P2)：工具箱數量動態統計

- **根本原因**：
  教材與工具彈窗的 Tab 標籤中，副標籤被靜態寫死為 `<span ...>3 工具</span>`。在上一輪納入「事件風暴」後，卡片總數為 4，但標籤未動態反映。
- **修復方案**：
  1. 在 HTML 中為標籤賦予專屬 ID `#assets-tools-count-badge`。
  2. 在 `openAssetsModal()` 中呼叫動態賦值：
     ```javascript
     const toolsBadge = document.getElementById('assets-tools-count-badge');
     if (toolsBadge) toolsBadge.textContent = `${AI_ARM_TOOLS_CATALOG.length} 工具`;
     ```
- **QA 複測指引**：
  1. 點擊頂部「教材與工具」按鈕。
  2. 觀察「輔助工具箱」按鈕右側徽章。
  3. **預期結果**：徽章動態且正確顯示「4 工具」。

---

### AUTH-REVIEW-01：跨班身分隔離政策（Cross-Class Identity Isolation Policy）

- **政策背景**：
  AI-ARM 作為企業級內訓與公開工作坊核心工具，不同班級代碼（如企業內訓專班 `202609-ibm`、`202609-kgi` 與測試班 `2026-test`）所屬組織與資安情境完全不同。即使同一位講師在同一台電腦授課，各班之學員名單、討論組數與班級授權密碼均獨立存在。
- **政策條款**：
  1. **班級特定命名空間強制綁定**：各班級之驗證身分僅保存在 `ai_arm_auth_user_${currentClassId}` 中。
  2. **身分物件攜帶所屬班級**：`currentUser` 物件無論是學員或講師，於登入時均寫入所屬之 `classId: currentClassId`。
  3. **禁止非匹配身分之自動沿用**：`checkExistingAuth()` 在讀取本機快取時，若發現身分物件之 `classId` 與當前 URL 所請求之 `currentClassId` 不一致（例如持有 `2026-test` 身分卻進入 `?c=202609-ibm`），**強制拒絕自動登入**，頁面將立即拉起門禁報到畫面，要求使用者輸入該班專屬密碼並重新選組。
  4. **多班並存不互相覆蓋**：因為各班使用獨立之 Storage Key，講師在多班切換時，各班身分各自保留，不發生互相覆蓋或冒領情事。
- **程式碼實作**：
  ```javascript
  APP_STORAGE_KEY = `ai_arm_auth_user_${currentClassId}`;
  let saved = localStorage.getItem(APP_STORAGE_KEY);
  if (!saved) {
    const fallback = localStorage.getItem('ai_arm_auth_user');
    if (fallback) {
      try {
        const parsedFallback = JSON.parse(fallback);
        if (parsedFallback && parsedFallback.classId === currentClassId) {
          saved = fallback;
        }
      } catch(e) {}
    }
  }
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.classId && parsed.classId !== currentClassId) {
        return false; // 跨班身分嚴格拒絕自動登入
      }
      currentUser = parsed;
      // ...
    } catch(e) {}
  }
  ```
- **QA 複測指引**：
  1. 在瀏覽器登入 `2026-test` 為講師或學員。
  2. 於同一分頁或新分頁輸入其他班級網址：`https://agiletalks-workshop.web.app/workshop/ai-arm/?c=202609-ibm`。
  3. **預期結果**：頁面正確拉起 IBM 專班之門禁報到畫面，身分未自動跨班沿用；輸入正確密碼報到後，進入 IBM 專班。再度切回 `?c=2026-test`，原本在測試班的身分依然維持，兩班各自獨立。

---

## 3. 部署與複測指引

- **修改檔案**：[`ai-arm/index.html`](file:///C:/Antigravity/workshop/ai-arm/index.html)
- **建置狀態**：`node scripts/build-all.js`（PASS）
- **正式站更新**：`npm run deploy`（Firebase Hosting 重新發布完成）
- **正式站網址**：`https://agiletalks-workshop.web.app/workshop/ai-arm/`
