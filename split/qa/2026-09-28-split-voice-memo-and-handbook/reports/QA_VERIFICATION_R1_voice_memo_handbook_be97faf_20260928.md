# 【QA 驗收報告】SPLIT 課堂錄音即時便籤、翻面詳細內容與全日列印手冊功能 (第 1 輪)

> **任務編號**：`TASK-SPLIT-05`  
> **測試輪次**：R1（第 1 輪全新功能驗收）  
> **驗收日期**：2026-09-28  
> **基準 Commit**：`be97fafd8a5564b8ee13b4ce6a7077d4358a7001`（短 SHA：`be97faf`）  
> **驗收環境**：本地服務 `http://localhost:5000/workshop/split/` + 真實雲端 Firestore 資料庫 `marshmallow-agile-3b4b`  
> **測試班級**：`qa-split-test-01`  
> **測試工具**：Playwright 自動化真機雙端（講師直通視窗 A vs 學員小明視窗 B）  
> **整體驗收結論**：🔴 **未通過 (FAIL) — 發現 1 項 P0 阻斷性缺陷、1 項 P1 嚴重邏輯缺陷、2 項 P2 規格與文案缺陷**

---

## 📊 一、 5 大重點驗收場景實測結果總覽

| 場景編號 | 測試場景與驗收標準 | 實測狀態 | 判定 | 關聯缺陷 / 說明 |
|---|---|---|---|---|
| **場景 1** | **講師開始與結束錄音（ON-AIR 看板體驗）**<br>• 深色 ON-AIR 看板、呼吸紅燈、碼錶計時、動態波形。<br>• 即時語音逐字反饋。<br>• 結束講述進入「小編工作中...」狀態。 | **部分通過**<br>ON-AIR 動態看板與計時聲波體驗優良；但點擊結束後存檔失敗。 | 🟡 阻斷 | 受 **BUG-SPLIT-VOICE-01 (P0)** 阻斷，存檔時拋出 Firestore 403 錯誤。 |
| **場景 2** | **重點便利貼（正面）與詳細內容（反面）呈現**<br>• 彩色便籤精簡點題，支援「📋 貼入小組筆記」。<br>• 「📖 看詳細內容」翻轉為 Markdown 長文；「📌 翻回重點便利貼」切回。<br>• 學員端免重整即時連線同步。 | **未通過** | 🔴 阻斷 | 因 Firestore 規則未開放，資料無法寫入亦無法讀取，便利貼與反面長文無法呈現。 |
| **場景 3** | **錄音中換頁與加錄情境**<br>• <8 秒換頁：自動取消防誤觸。<br>• >=8 秒換頁：自動收尾並存入原頁面。<br>• 補充錄音 vs 重新錄這頁模式選擇。 | **未通過** | 🔴 FAIL | 發現 **BUG-SPLIT-VOICE-02 (P1)**：換頁時 `slide.id` 狀態競爭，筆記錯存至下一頁！ |
| **場景 4** | **全域【🖨️ 印出今天筆記】功能**<br>• 頂部欄開啟全螢幕預覽。<br>• 封面、班級、日期、27 頁目錄索引、各頁便籤與小組筆記。<br>• 瀏覽器列印分頁保護。 | **部分通過** | 🟡 FAIL | 預覽視窗與封面正常；但發現 **BUG-SPLIT-PRINT-01 (P2)**：缺少 27 頁目錄索引與小組筆記成果。 |
| **場景 5** | **全站「零 AI 字樣」純潔度查核**<br>• 絕無「AI提煉」、「AI分析」、「課堂 AI 提示詞」、「AI助手」等字詞。<br>• 統一採用「小編工作中...」、「課堂重點」等平易近人擬人化用語。 | **未通過** | 🔴 FAIL | 發現 **BUG-SPLIT-WORDING-01 (P2)**：演練任務中顯著殘留「課堂 AI 提示詞」字樣。 |

---

## 🚨 二、 缺陷清單與深度剖析

### 1. 【P0 阻斷】BUG-SPLIT-VOICE-01：Firestore 安全規則遺漏 `lecture_notes` 集合權限，造成重點便籤無法讀寫
- **影響範圍**：場景 1、場景 2、場景 3、場景 4
- **現象說明**：
  - 講師點擊「⏹️ 錄好了，整理重點」時，彈出「小編整理筆記時遇到問題，請稍候重試。」
  - 學員端載入時 Console 即報錯：
    ```
    [LectureNote] 訂閱異常 (slide-1): FirebaseError: Missing or insufficient permissions.
    [LectureRecord] 小編整理失敗: FirebaseError: Missing or insufficient permissions.
    ```
  - 列印手冊呼叫 `fetchAllLectureNotes` 同步失敗：
    ```
    [LectureNote] 讀取全班隨堂重點失敗: FirebaseError: Missing or insufficient permissions.
    ```
- **根本原因**：
  - 檢視根目錄 [`firestore.rules`](file:///c:/Antigravity/workshop/firestore.rules)，在 `split_data/{classId}/generations/{genId}/` 下僅開放了 `notes`、`boards` 與 `questions`：
    ```javascript
    match /split_data/{classId}/generations/{genId}/notes/{noteId} { allow read, write: if true; }
    match /split_data/{classId}/generations/{genId}/boards/{boardId} { allow read, write: if true; }
    match /split_data/{classId}/generations/{genId}/questions/{questionId} { allow read, write: if true; }
    ```
  - **完全遺漏了全新功能所使用的 `lecture_notes` 集合**：
    `match /split_data/{classId}/generations/{genId}/lecture_notes/{slideId}`。
- **修復建議**：
  在 `firestore.rules` 補上規則並重新執行 `firebase deploy --only firestore:rules`：
  ```javascript
  match /split_data/{classId}/generations/{genId}/lecture_notes/{slideId} {
    allow read, write: if true;
  }
  ```

---

### 2. 【P1 嚴重】BUG-SPLIT-VOICE-02：錄音換頁 >= 8 秒時，筆記被錯存至「換頁後的下一頁」
- **影響範圍**：場景 3（換頁自動收尾功能）
- **現象說明**：
  - 講師在第 1 頁（`slide-1`）錄音講課超過 8 秒，此時直接切換至第 2 頁（`slide-2`）。
  - 系統雖然觸發了收尾與小編整理，但整理產出的重點便利貼與詳細內容卻**寫入到了第 2 頁，而第 1 頁仍然呈現「尚未錄製本頁重點」**！
- **根本原因**：
  - 檢視 [`split/src/components/WorkbookPanel.tsx`](file:///c:/Antigravity/workshop/split/src/components/WorkbookPanel.tsx#L1032-L1039)：
    ```typescript
    // 換頁時狀態重置與保護
    useEffect(() => {
      recordingSlideIdRef.current = slide.id; // ⚠️ 此處先將 ref 覆寫為新頁面的 slide.id！
      if (isLectureRecording) {
        handleStopLectureRecord({ isNavigating: true }); // ⚠️ 此時才呼叫停止並儲存！
      }
      setLectureView("stickies");
    }, [slide.id]);
    ```
  - 在 `handleStopLectureRecord` 內部（L1112）：
    ```typescript
    const targetSlideId = recordingSlideIdRef.current; // 讀到的是已經變為新頁面的 ID！
    ```
  - 同時傳入 `compileLectureContent` 的 `slide.title` 也是新頁面的標題！導致講第 1 頁的課，產出的標題與存放位置全被嫁接到第 2 頁。
- **修復建議**：
  在 `useEffect` 中保留當前錄音頁面之 ID，或是將正在錄音的投影片 ID 直接作為參數傳遞：
  ```typescript
  const prevSlideIdRef = useRef(slide.id);
  useEffect(() => {
    if (isLectureRecording) {
      handleStopLectureRecord({ isNavigating: true, targetSlideId: prevSlideIdRef.current });
    }
    prevSlideIdRef.current = slide.id;
    recordingSlideIdRef.current = slide.id;
    setLectureView("stickies");
  }, [slide.id]);
  ```

---

### 3. 【P2 次要】BUG-SPLIT-PRINT-01：【🖨️ 印出今天筆記】手冊缺少委託書要求之「27 頁目錄索引」與「小組筆記成果」
- **影響範圍**：場景 4（全日列印手冊）
- **現象說明**：
  - 依據委託書要求，預覽視窗應「包含封面、班級名稱、產出日期、27 頁目錄索引與各頁完整內容（重點便籤、詳細文章、小組筆記成果）」。
  - 實際檢查 [`PrintHandbookModal.tsx`](file:///c:/Antigravity/workshop/split/src/components/PrintHandbookModal.tsx)：
    1. 封面下方直接接續各頁清單，缺少專屬的「27 頁目錄索引 (Table of Contents)」導覽。
    2. 逐頁卡片中僅呈現 `stickies` 與 `textbookArticle`，**完全未呈現學員在該頁討論產出的小組筆記成果（teamNote / personalNote）**。
- **修復建議**：
  1. 在封面後、各頁前增加目錄索引清單（呈現各單元與頁碼對照）。
  2. 整合學員當前小組的隨堂筆記，讓整本手冊成為兼具「講師隨堂重點」與「小組討論成果」的完整紀念冊。

---

### 4. 【P2 次要】BUG-SPLIT-WORDING-01：全站零 AI 字樣查核未過，任務編輯器與任務卡殘留「課堂 AI 提示詞」
- **影響範圍**：場景 5（全站純潔度）
- **現象說明**：
  - 依據委託書標準：「絕無『AI提煉』、『AI分析』、『課堂 AI 提示詞』、『AI助手』等字詞。統一使用『小編工作中...』、『課堂重點』、『課堂提示詞範本』等平易近人、擬人化文案。」
  - 實機截圖與代碼查核證實：
    1. [`split/src/components/TaskEditorModal.tsx`](file:///c:/Antigravity/workshop/split/src/components/TaskEditorModal.tsx#L406)：
       標籤文案為：`🤖 課堂 AI 提示詞 (供學員一鍵複製)：`
    2. [`split/src/components/TeamTaskBriefCard.tsx`](file:///c:/Antigravity/workshop/split/src/components/TeamTaskBriefCard.tsx#L165)：
       標籤文案為：`課堂 AI 提示詞 (點擊一鍵複製)：`
- **修復建議**：
  修改文案為：`課堂提示詞範本 (點擊一鍵複製)：` 或 `隨堂小編提示詞範本：`，並將機器人圖示替換為 💡 或 📝。

---

## 📷 三、 客觀測試截圖與日誌存證

所有證據檔案均存放於：[`split/qa/2026-09-28-split-voice-memo-and-handbook/evidence/`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-voice-memo-and-handbook/evidence/)

1. **場景 1 ON-AIR 錄音看板體驗**：
   - 截圖：[`evidence/tc01-onair-recording.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-voice-memo-and-handbook/evidence/tc01-onair-recording.png)
   - 證實：深色 ON-AIR 廣播介面、● 錄音中紅燈、00:01 碼錶、動態聲波條與即時逐字辨識串流呈現完整。
2. **場景 4 全日手冊列印預覽視窗**：
   - 截圖：[`evidence/tc04-print-handbook-modal.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-voice-memo-and-handbook/evidence/tc04-print-handbook-modal.png)
   - 證實：手冊彈窗可正常開啟、封面與版面整齊；但頁面內容皆為空白提示（因 P0 權限阻斷），且缺少目錄索引。
3. **場景 5 零 AI 字樣違規存證**：
   - 截圖：[`evidence/tc05-forbidden-ai-wording-editor.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-voice-memo-and-handbook/evidence/tc05-forbidden-ai-wording-editor.png)
   - 證實：任務編輯器顯眼出現「🤖 課堂 AI 提示詞 (供學員一鍵複製)：」。
4. **瀏覽器 Console 權限報錯日誌**：
   - 講師端：[`evidence/console-a.json`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-voice-memo-and-handbook/evidence/console-a.json)（記錄 `[LectureRecord] 小編整理失敗: FirebaseError: Missing or insufficient permissions.`）
   - 學員端：[`evidence/console-b.json`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-voice-memo-and-handbook/evidence/console-b.json)（記錄 `[LectureNote] 訂閱異常 (slide-1): FirebaseError: Missing or insufficient permissions.`）

---

## 📋 四、 驗收判定與後續處理建議

- **整體判定**：🔴 **FAIL (不予通過)**
- **主要阻塞項**：
  1. 請 DEV 團隊立即修正 [`firestore.rules`](file:///c:/Antigravity/workshop/firestore.rules) 補齊 `lecture_notes` 集合之讀寫規則並部署上線。
  2. 修正 `WorkbookPanel.tsx` 換頁收尾之 `slide.id` 覆寫競態問題（BUG-SPLIT-VOICE-02）。
  3. 修正全站「零 AI 字樣」文案違規（BUG-SPLIT-WORDING-01）。
  4. 評估補齊列印手冊目錄索引與小組筆記成果區塊（BUG-SPLIT-PRINT-01）。
- 待 DEV 團隊完成修復並重新發布移交通知後，QA 團隊將立即排入第 2 輪（R2）複測。
