# 需求文件：講師語音重點筆記功能

**版本**：v0.1 (草稿)  
**分支**：`feature/instructor-voice-notes`  
**建立日期**：2026-09-23  

---

## 1. 功能目標

讓**講師**在 AI-ARM 教材系統中，針對**每一張投影片**：

1. 啟動麥克風錄音（語音辨識）
2. 在講解過程中累積即時逐字稿
3. 停止錄音後，AI 自動整理成**結構化重點摘要**
4. 摘要結果寫入該投影片的**講師備注欄**，並可選擇性推送至學員可見的筆記區

---

## 2. 使用者故事

### US-01：啟動錄音
**As a** 講師  
**I want to** 在任意一張投影片上點擊錄音按鈕，讓系統開始辨識我的語音  
**So that** 我不需要手動打字，就能記錄我對這張投影片的講解重點

**驗收標準（AC）**：
- AC-01-1：講師登入狀態下，每張投影片右側工具列出現 🎙️ 錄音按鈕
- AC-01-2：學員身分看不到錄音按鈕
- AC-01-3：點擊後瀏覽器請求麥克風權限（若未授權）
- AC-01-4：授權後立即開始錄音，按鈕變為紅色閃爍狀態並顯示計時器
- AC-01-5：瀏覽器不支援 Web Speech API 時，按鈕顯示 disabled 並提示「請使用 Chrome 或 Edge」

### US-02：即時逐字稿預覽
**As a** 講師  
**I want to** 在錄音過程中看到即時辨識出來的文字  
**So that** 我可以確認語音辨識是否正常運作

**驗收標準（AC）**：
- AC-02-1：錄音中，逐字稿即時顯示在工具列下方的浮動小視窗
- AC-02-2：辨識中（interim）文字以灰色顯示，確認（final）文字以深色顯示
- AC-02-3：逐字稿視窗最多顯示 3 行，超出時往上捲動

### US-03：停止錄音並產生摘要
**As a** 講師  
**I want to** 點擊停止按鈕後，系統自動幫我整理成重點摘要  
**So that** 我不需要再自行編輯，即可快速留下這頁的教學紀錄

**驗收標準（AC）**：
- AC-03-1：停止按鈕點擊後，顯示「AI 整理中...」loading 狀態
- AC-03-2：最長等待 15 秒；超時則顯示錯誤提示並保留原始逐字稿
- AC-03-3：成功後，在右側筆記區頂部顯示摘要卡片（含：整體摘要句、核心重點列表）
- AC-03-4：卡片有「✅ 套用到筆記區」按鈕，點擊後將摘要追加至 team-memo-input
- AC-03-5：卡片有「✏️ 重新整理」按鈕（重新呼叫 AI，保留原始逐字稿）
- AC-03-6：卡片有「✕ 關閉」按鈕（關閉但不刪除已存資料）
- AC-03-7：逐字稿為空（錄音不足 3 秒或無辨識結果）時，顯示提示「未偵測到語音，請重新錄音」

### US-04：跨頁保留摘要
**As a** 講師  
**I want to** 在切換投影片後，先前已產生的摘要仍然保存  
**So that** 課後我可以回顧每一頁的講解重點

**驗收標準（AC）**：
- AC-04-1：每頁的摘要以 instructorNote 欄位獨立儲存在 Firestore（key: slideId）
- AC-04-2：切換回該頁時，若已有摘要，自動還原顯示摘要卡片（預設摺疊）
- AC-04-3：「有摘要」的投影片在目錄列表旁顯示 📝 小標記

### US-05：防止錄音跨頁洩漏
**As a** 講師  
**I want to** 在錄音中切換投影片時，收到警告  
**So that** 我不會誤將 A 頁的錄音內容整理進 B 頁

**驗收標準（AC）**：
- AC-05-1：錄音中執行換頁操作，顯示 Modal 確認
- AC-05-2：選「停止並整理」→ 停止錄音、觸發 AI 摘要、再換頁
- AC-05-3：選「直接換頁」→ 丟棄本次錄音資料後換頁
- AC-05-4：選「取消」→ 維持在目前頁面繼續錄音

---

## 3. Out of Scope（MVP 不包含）

- 儲存實際音訊檔案
- 多語言支援（MVP 僅 zh-TW）
- 學員端錄音功能
- 語音指令（Wake Word）觸發
- 即時推播摘要給學員

---

## 4. 技術規格

### 4.1 前端模組（Vanilla JS）

```javascript
class VoiceNoteRecorder {
  isSupported()           // 檢查 Web Speech API 支援
  start(slideId)          // 啟動辨識，綁定 slideId
  stop()                  // 返回 Promise<string>（累積逐字稿）
  getInterimText()        // 即時辨識中的文字
  destroy()               // 清理資源
}
```

### 4.2 AI 摘要 Prompt

```
你是一個專業的課程講解重點整理引擎。
以下是講師針對投影片「{slideTitle}」的即時講解逐字稿：

=== 逐字稿 ===
{rawTranscript}

請整理成：
1. overviewSummary：2句話的整體摘要
2. takeaways：3~5個核心學習重點（條列式）

規則：
- 去除口語贅字（呃、那個、就是說）
- 保留關鍵術語
- 使用繁體中文（台灣商務用語）
- 輸出純 JSON：{ "overviewSummary": "...", "takeaways": ["...", "..."] }
```

### 4.3 API Key 策略（MVP 階段）

MVP 採用前端直接呼叫 Gemini REST API；API Key 由講師透過 `localStorage.setItem('GEMINI_API_KEY', '...')` 或 URL 參數設定。

> ⚠️ 此為本機測試設計，正式上線前改為 Firebase Cloud Function。

### 4.4 Firestore 資料結構

```
/classes/{classId}/slides/{slideId}/instructorNotes/latest
  ├── slideId: string
  ├── slideTitle: string
  ├── rawTranscript: string
  ├── overviewSummary: string
  ├── takeaways: string[]
  ├── appliedToTeamMemo: boolean
  ├── createdAt: timestamp
  └── updatedAt: timestamp
```
