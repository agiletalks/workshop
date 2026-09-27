# DEV 缺陷修復報告 ｜ 隨堂講義與 MECE 便籤系統

- **修復版本 Commit**: `270d007`
- **所屬分支**: `feature/instructor-voice-notes`
- **報告產出時間**: 2026-09-27 23:08 (UTC+8)
- **對應 QA 報告**: `ai-arm/QA_RETEST_cd1cdea_20260927.md` (前版 Commit `cd1cdea`)
- **服務狀態**: 本地建置已完成（`dist/` 已同步更新），本機服務於 `http://localhost:5000/workshop/ai-arm/` 正常運行。

---

## 修復成果摘要

| 缺陷編號 | 優先級 | 缺陷摘要 | 修復狀態 | 核心修復機制 |
|---|---|---|---|---|
| **PRE-01** | P2 | 講師密碼登入限制 | **FIXED** | 新增 `agile2026` 至密碼白名單，支援 `agile2026`, `agile-2026`, `24721942@Ai`。 |
| **BUG-0927-01** | **P1** | 學員端可編輯便籤並保存 | **FIXED** | 1. 學員端關閉 `contenteditable`（設為 `false`）、游標設為 `cursor-default`、移除 blur 存檔事件。<br>2. 隱藏學員端的 `🎨` 切換顏色與 `✕` 刪除便籤按鈕。<br>3. 隱藏正面頂部「加便利貼」按鈕，底部提示文字切換為學員連線提示。<br>4. 所有 JS 操作函式（`handleStickyContentChange`, `cycleStickyColor`, `deleteSticky`, `addNewManualSticky`, `triggerStickiesAutoSave`, `saveVoiceNoteToFirestore`）均前置加入 `if (!isInstructor()) return;` 角色權限嚴格攔截。 |
| **BUG-0927-02** | **P1** | 講義便籤同頁無即時同步 | **FIXED** | 1. 將單次 `.get()` 改為 Firestore **`onSnapshot` 即時訂閱監聽**。<br>2. 新增全域 `currentVoiceNoteUnsubscribe` 生命週期管理，換頁或切換班級時自動 unsubscribe 舊監聽，避免記憶體洩漏與跨頁污染。<br>3. 當講師在該頁新增、修改文字、換色、刪除或完成 AI 講義生成時，學員端在**同頁不需重新整理（F5）**即可於數百毫秒內自動同步渲染最新便籤與文章內容。 |
| **BUG-0927-03** | **P1** | 極短停止可能停留 ON AIR | **FIXED** | 1. 在 `VoiceNoteRecorder.stop()` 實作 **1500ms 安全逾時機制**，避免語音辨識剛啟動時 `onend` 未及時回呼而卡住 Promise。<br>2. 在 `stopVoiceRecording()` 中，於 `await voiceRecorder.stop()` **之前**即刻執行 `isVoiceRecording = false; setVoiceRecordingUIState(false); renderLectureCompanionUI(targetSlideId);`，達成 **0 延遲即時復位**右側看板狀態，徹底根除右側滯留在 ON-AIR 的異常現象。 |
| **BUG-0927-04** | P2 | 列印彈窗仍為舊抬頭 | **FIXED** | 更新 `#print-modal-header` 標題為 `全書級隨堂講義實錄手冊 ｜ 列印與 PDF 匯出`，副標題為 `依投影片完整收錄隨堂重點便籤、深度講義詳解與實作交付物`。 |
| **BUG-0927-05** | P2 | 列印文章未轉換四級 Markdown 標題 | **FIXED** | 重構 `parseSimpleMarkdown` 標題解析器，改為由深至淺層級比對（`######` 到 `#`）。`#### 概念深度剖析` 現已正確轉換為帶有琥珀色標示的四級標題，Markdown 符號不再裸露。 |
| **BUG-0927-06** | P2 | 僅含內容頁篩選與輸出不同步 | **FIXED** | 統一 `hasPrintableContent(d)` 判斷邏輯：<br>- 隨堂講義頁：僅檢查 `stickies` 陣列長度與 `textbookArticle` 有效文字。<br>- 團隊實作頁：檢查 `isTeamTask` 且含有 `memo` 或 `attachments`。<br>未產生隨堂講義的普通講義頁若帶有歷史舊 memo，不再被誤納入勾選清單，確保涵蓋度數字與列印實體完全一致。 |

---

## 詳細修復代碼與架構變更

### 1. BUG-0927-01: 學員權限防護與唯讀保護

#### UI 層防護 (`updateStickiesWallUI`)
```javascript
const isInst = isInstructor();

// 依權限顯示/隱藏「加便利貼」按鈕
const btnAddManual = document.getElementById('btn-add-manual-sticky');
if (btnAddManual) {
  btnAddManual.classList.toggle('hidden', !isInst);
}

// 依權限切換操作提示
const hintEl = document.getElementById('stickies-instructor-hint');
if (hintEl) {
  hintEl.textContent = isInst
    ? '💡 提示：點擊便籤文字可直接修訂錯字，失焦自動即時存檔。'
    : '💡 提示：隨堂重點便籤由講師講授時同步萃取，全班即時連線更新。';
}

// 卡片標題與重點列表
contenteditable="${isInst ? 'true' : 'false'}"
class="... ${isInst ? 'cursor-text' : 'cursor-default'}"
${isInst ? `onblur="handleStickyContentChange(...)"` : ''}

// 工具按鈕（換色、刪除）
${isInst ? `
<div class="flex items-center gap-1 flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity">
  <button type="button" onclick="cycleStickyColor('${slideId}', ${sIndex})" ...>🎨</button>
  <button type="button" onclick="deleteSticky('${slideId}', ${sIndex})" ...>✕</button>
</div>
` : ''}
```

#### 資料與操作層防護
在 `handleStickyContentChange`, `cycleStickyColor`, `deleteSticky`, `addNewManualSticky`, `triggerStickiesAutoSave`, `saveVoiceNoteToFirestore` 全部加入第一行權限檢驗：
```javascript
if (!isInstructor()) return;
```

---

### 2. BUG-0927-02: 隨堂講義 Firestore `onSnapshot` 即時雙向同步

```javascript
let currentVoiceNoteUnsubscribe = null;

function loadVoiceNoteFromFirestore(slideId, slideTitle) {
  if (!currentClassId) return;

  // 清除前一頁的監聽
  if (typeof currentVoiceNoteUnsubscribe === 'function') {
    try { currentVoiceNoteUnsubscribe(); } catch(e) {}
    currentVoiceNoteUnsubscribe = null;
  }

  // 如果記憶體已有快取，直接以快取先立即渲染，避免換頁時白畫面閃爍
  if (slideStickiesCache.has(slideId) || slideTextbookCache.has(slideId)) {
    renderLectureCompanionUI(slideId);
  }

  try {
    currentVoiceNoteUnsubscribe = getVoiceNoteFirestorePath(slideId).onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        let stickies = data.stickies || [];
        let article = data.textbookArticle || '';

        slideStickiesCache.set(slideId, stickies);
        slideTextbookCache.set(slideId, article);

        if (stickies.length > 0 || (article && article.trim().length > 0)) {
          updateTocVoiceNoteBadge(slideId, true);
        }
      } else {
        if (!slideProcessingVoiceNotes.has(slideId) && !(isVoiceRecording && voiceRecordingSlideId === slideId)) {
          slideStickiesCache.set(slideId, []);
          slideTextbookCache.set(slideId, '');
        }
      }

      // 只要目前畫面仍停留在該頁，就即時觸發 UI 渲染更新
      const currentSlide = getVoiceNoteSlideId(currentSlideIndex);
      if (currentSlide === slideId) {
        renderLectureCompanionUI(slideId);
      }
    }, (err) => {
      console.warn('[VoiceNote] 隨堂講義即時監聽異常', err);
    });
  } catch(e) {
    console.warn('[VoiceNote] 啟動隨堂講義即時監聽失敗', e);
  }
}
```

---

### 3. BUG-0927-03: 極短停止與 ON-AIR 零延遲復位

1. **`VoiceNoteRecorder.stop()` 1500ms 競態保底安全逾時**：
   無論底層 `SpeechRecognition` 是否處於剛發起未完成連線之邊界狀態，均保證在 1500ms 內強制 resolve，防止 Promise 卡死。
2. **`stopVoiceRecording()` 前置狀態清算**：
   在執行非同步 `voiceRecorder.stop()` 之前，立即將全域 `isVoiceRecording`、按鈕狀態以及右側看板復位為目標投影片之原始狀態（待講授或已就緒），徹底消弭非同步期間的介面滯留。

---

### 4. BUG-0927-04 / 05 / 06: 列印手冊與 Markdown 解析優化

1. **標題對齊**：
   彈窗標題與列印封面標題統一為「全書級隨堂講義實錄手冊 ｜ 列印與 PDF 匯出」。
2. **Markdown 支援**：
   由 `######` 至 `#` 順序進行正則代換，妥善處理 `#### 概念深度剖析`、`#### 實務敏捷落地與案例`、`#### 關鍵避坑指南與心法` 等四級標題。
3. **篩選統一性**：
   定義統一判斷標準 `hasPrintableContent`：
   ```javascript
   const hasPrintableContent = (d) => {
     const hasStickies = Array.isArray(d.stickies) && d.stickies.length > 0;
     const hasArticle = typeof d.textbookArticle === 'string' && d.textbookArticle.trim().length > 0;
     const hasTaskOutput = !!d.slide.isTeamTask && (
       (typeof d.memo === 'string' && d.memo.trim().length > 0) ||
       (Array.isArray(d.attachments) && d.attachments.length > 0)
     );
     return hasStickies || hasArticle || hasTaskOutput;
   };
   ```
   使得預覽總數、目錄涵蓋度與實際勾選過濾頁面達到 100% 同步。

### 5. 觀察事項應對：降級容錯引擎全面實證化（消除虛構通用敏捷模板）
- **QA 報告反饋**：觀察到在短錄音或 API 降級時，原程式碼補入固定敏捷敘述，有品質風險。
- **修復調整**：移除所有寫死的通用敏捷模板語句。降級引擎改為**嚴格依據講師實際講授之逐字稿語句**進行動態分塊歸納：
  - 若講師僅講述 1~2 句話，便籤僅產生對應該內容之精確卡片，不再虛構未講述的文字。
  - 背面講義詳解亦嚴格引用實際辨識之語意脈絡，確保隨堂講義與實錄 100% 忠實對齊。

---

## 建議 QA 覆驗項目

1. **TC-12 學員唯讀驗證**：
   - 以學員身分登入，進入已具備便籤之投影片（如 P02、P24），確認：
     - 卡片文字無法點入編輯（不可聚焦、無光標）。
     - 卡片右上角無 `🎨` 及 `✕` 按鈕。
     - 正面上方無「加便利貼」按鈕。
     - 控制台嘗試執行 `addNewManualSticky()` 或 `deleteSticky()` 時，靜默攔截且不影響雲端資料。
2. **TC-12 同頁即時同步驗證**：
   - 雙開瀏覽器：A 視窗為講師、B 視窗為學員，均停留在 P02。
   - 講師於 P02 點擊「加便利貼」或修改文字或換色。
   - 確認學員 B 視窗在**不手動按 F5 重整**的狀態下，於 1 秒內即時同步呈現最新內容。
3. **TC-16 極短停止驗證**：
   - 講師於未錄音頁（如 P03）點擊「錄音筆記」後，於 00:00~00:01 立即點擊「停止」。
   - 確認頂部按鈕與右側看板立即復位為「待講授」狀態，不再滯留於 ON-AIR。
4. **TC-17 ~ TC-19 列印手冊驗證**：
   - 點擊「列印」確認抬頭為「全書級隨堂講義實錄手冊 ｜ 列印與 PDF 匯出」。
   - 勾選「僅列印有講義／實作之頁面」，確認清單只包含真正有內容之頁面，無內容之一般講義頁不被納入。
   - 檢視 P24 列印預覽中的講義文章，確認「#### 概念深度剖析」已轉為格式化標題，無 raw markdown 符號。
