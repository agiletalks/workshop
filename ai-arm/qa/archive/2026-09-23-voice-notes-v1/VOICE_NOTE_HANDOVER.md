# 講師語音重點筆記功能（MECE 手寫便利貼牆）接手開發與交接指引

本文件供另一台電腦的 AI 助理或開發者閱讀，用於快速接手 `feature/instructor-voice-notes` 分支的開發與測試工作。

---

## 📌 1. Git 分支與環境準備

本功能完全獨立開發於獨立分支，未污染 `main`。

### 步驟 A：取得分支
在另一台電腦的終端機執行：
```bash
# 進入專案目錄
cd workshop

# 獲取遠端最新分支資訊
git fetch origin

# 切換並追蹤 feature 分支
git checkout feature/instructor-voice-notes
git pull origin feature/instructor-voice-notes
```

### 步驟 B：編譯與啟動服務
```bash
# 1. 執行 build 將靜態資源打包至 dist
node scripts/build-all.js

# 2. 啟動本機測試伺服器 (預設 Port 5000)
node scripts/serve.js
```
測試網址：`http://localhost:5000/workshop/ai-arm/`

---

## 💡 2. 當前架構與已完成功能狀態

核心檔案位於：`ai-arm/index.html`（單頁式架構）。

| 功能模組 | 完成狀態 | 說明 |
| :--- | :---: | :--- |
| **ON AIR 錄音呼吸燈覆蓋層** | ✅ 已完成 | 點選 `🎙️ 錄音筆記` 後，筆記區覆蓋暗色毛玻璃 ON AIR 呼吸燈遮罩與碼錶，不干擾筆記。 |
| **長度穩健性與重啟機制** | ✅ 已完成 | 克服 Chrome Web Speech 60 秒強迫中斷限制，自動延遲 300ms 以全新實例重啟並累積逐字稿。 |
| **MECE 原則手寫便利貼牆** | ✅ 已完成 | Prompt 依金字塔原則規範 1~4 張維度互斥的便利貼；引入 Google Fonts `Klee One`，自帶立體投影與馬卡龍色系。 |
| **點字即改 (Inline Editable)** | ✅ 已完成 | 便利貼的標題與條列文字具備 `contenteditable="true"`，點擊直接修改錯字，失焦後 800ms 自動 Debounce 存回 Firestore。 |
| **自由換頁非同步處理** | ✅ 已完成 | 按下停止錄音後，AI 在背景持續呼叫 Gemini，講師可切換其他投影片，換回該頁時自動展示便利貼。 |
| **視圖切換與貼入小組筆記** | ✅ 已完成 | 提供 `[📌 講師重點便利貼]` 與 `[📝 小組手動筆記]` 切換 Tab，並提供一鍵將所有便利貼追加至 textarea 功能。 |

---

## ⚠️ 3. 待排除的最後關鍵點（卡點說明）

在最近一次測試中，錄音已正常取得數百字的逐字稿，但在停止錄音呼叫 Gemini API 時出現 Toast 報錯：
```text
Gemini API 回傳錯誤碼: 401 - Request had invalid authentication credentials.
Expected OAuth 2 access token, login cookie... ACCESS_TOKEN_TYPE_UNSUPPORTED
```

### 原因分析：
儲存在瀏覽器 `localStorage.getItem('GEMINI_API_KEY')` 的金鑰不是 Google AI Studio 原生 API Key（原生金鑰必為 **`AIzaSy...`** 開頭的 39 碼字串），之前可能誤貼成了 OAuth Access Token（如 `AQ.` 開頭）。

---

## 🧪 4. 接手後的測試與驗收步驟

請在另一台電腦打開瀏覽器測試頁：`http://localhost:5000/workshop/ai-arm/`

### 步驟 1：在瀏覽器 Console 設置身分與正確 Key
按 **F12** 打開 Console（主控台），依序貼上執行：

```javascript
// 1. 設定講師身分
sessionStorage.setItem('ai_arm_admin_auth', 'true');

// 2. 設定正確的 Google AI Studio Key (請至 https://aistudio.google.com/apikey 取得 AIzaSy... 開頭字串)
localStorage.setItem('GEMINI_API_KEY', 'AIzaSy開頭的真實Key');

// 3. 重新整理頁面生效
location.reload();
```

### 步驟 2：報到進入課程
* **班級代碼 (CLASS CODE)**：輸入現有的測試班級 `2026-test`
* **姓名**：輸入任意名稱（如 `Percy`）
* **組別**：選擇 `第 1 組`，點擊完成報到進入第 1 頁。

### 步驟 3：驗收錄音與便利貼牆
1. 點擊右上角 **`🎙️ 錄音筆記`**。
2. 看到中央大呼吸燈 **`ON AIR 錄音中`**，對麥克風講述課程內容約 10~20 秒。
3. 點擊停止錄音。
4. **預期結果**：
   * 筆記區呈現 **`✨ AI 正在依 MECE 原則萃取精華便利貼...`** 流光載入條。
   * 3~8 秒內，網格自動長出 1~3 張手寫風彩色便利貼（鵝黃、粉藍等）。
   * 直接用滑鼠點擊便利貼文字，可修改聽錯的字詞並自動存檔。
   * 點選 `貼入小組筆記`，可將便利貼內容轉錄回純文字 textarea。

---

## 📂 5. 相關文件與參考檔案
* 需求規格書：`ai-arm/VOICE_NOTE_REQUIREMENTS.md`
* QA 測試案例：`ai-arm/VOICE_NOTE_QA_CASES.md`
* 主要程式碼：`ai-arm/index.html`（搜尋 `VoiceNoteRecorder` 或 `requestAIMeceStickies` 即可定位）
