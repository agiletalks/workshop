# 【中央獨立 QA 驗收報告】SPLIT 開課前終極現場防線與交付價值驗收 (R1)

> **報告編號**：`QA-VERIF-SPLIT-PREFLIGHT-FINAL-36f9844-20260929-R1`  
> **任務編號**：`TASK-SPLIT-11`（開課前終極現場防線與交付價值驗收）  
> **驗收工程師**：AgileTalks 中央獨立 QA 驗收工程師團隊  
> **基準 Commit**：`36f9844b2569e5d7ad66cf7d825c041300958db8` (`36f9844`) on `main`  
> **驗收環境**：本機真實端（`http://localhost:5000/workshop/split/`）+ Google Cloud Firestore (`marshmallow-agile-3b4b`)  
> **測試班級**：`qa-split-test-01` (Active 啟用狀態)  
> **測試投影片**：第 10 頁 (`/module/P/slide/10`)  
> **測試工具**：Playwright E2E 雙端真機自動化 + Web Speech API 語音串流 + Google Gemini 通訊探測 + 1366x768 & 125% DPI 縮放響應式探針  
> **驗收日期**：2026-09-29  
> **最終判定**：🟢 **驗收通過 (100% PASS - 准予正式開課交付上線)**

---

## 📊 驗收總覽與測試指標

| 測試場景代碼 | 驗收核心場景 | 預期指標 | 真機 E2E 實測紀錄 | 判定 |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | **真機真實語音 AI 提煉品質驗收** | 停止錄音觸發 Google Gemini API (HTTP 200)；產出 2~4 張 MECE 便利貼；自動校正語音錯別字；零 AI/機器人字眼 | 攔截 Google Gemini `generateContent` 呼叫回傳 200 OK；產出 2 張高質感便利貼；「三酸來吃」校正為「姍姍來遲」，「無奉前見」校正為「無縫銜接」；全文語氣專業，零 AI 機器人字眼 | 🟢 PASS |
| **TC-02** | **純淨逐字稿儲存與學員端嚴格隔離** | 講師端純淨逐字稿留存；學員端完全隔離逐字稿分頁（數量為 0）；學員端新便籤免重新整理即時浮現 | 講師端逐字稿自動修潤贅詞並儲存；學員端逐字稿標籤嚴格為 0；學員「QA-小明」無刷新（No-reload）即時浮現最新重點便籤 | 🟢 PASS |
| **TC-03** | **全天全課堂專書生成與 PDF 列印排版驗收** | 課末生成 6 大章節鏈式教材專書；涵蓋四大標準小節；封面含個人化姓名、組別、日期；收錄插圖、便籤與雙附錄；PDF 列印防折斷 | 6 大章節專書秒級合成完畢（7 個章節標題，四大標準小節齊全）；封面具備結訓學員、組別與出刊日期；收錄 3 個章節便籤區塊；附錄 A (Prompts) 與附錄 B (成果與筆記) 完整渲染 | 🟢 PASS |
| **TC-04** | **筆電 1366×768 解析度與 125% DPI 縮放壓力測試** | 1366×768 視窗 + 125% DPI 縮放情境下，TopBar 頂部所有文字按鈕強制單行 (`whitespace-nowrap`)，零破格；Workbook 標籤與按鈕無重疊 | 頂部導航列所有桌面按鈕高度均勻維持在 30~37px，完全單行無折行碎裂；Workbook 四大標籤與動態操作按鈕版面整齊流暢無交疊 | 🟢 PASS |

---

## 🔍 4 大核心驗收場景詳細實測紀錄

### 🧪 場景 1 (TC-01)：真機真實語音 AI 提煉品質驗收
- **測試重點**：
  1. 講師進入第 10 頁（`/module/P/slide/10`），由 Web Speech API 串流注入真實語音文字，包含贅詞與發音錯別字：
     - *「今天我們探討本張投影片核心概念。呃，然後，三酸來吃的情況在傳統交付中非常普遍，團隊在需求拆分時應該遵循無奉前見的原則，確保 INVEST 價值獨立交付。」*
  2. 講師點擊 `[⏹ 結束講述，整理重點]`，監控網路底層通訊與 Google Generative Language API。
  3. 驗證 Google Gemini `generateContent` 呼叫取得 HTTP 200 回傳。
  4. 驗證提煉產出之重點便利貼：
     - 語音同音錯字「三酸來吃」智慧校正為「姍姍來遲」。
     - 語音同音錯字「無奉前見」智慧校正為「無縫銜接」。
     - 嚴格禁止出現任何「AI 提煉」、「機器人」、「語言模型」等字眼。
- **實測紀錄**：
  - 成功攔截 1 次 `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=...`，通訊狀態碼 `200 OK`。
  - 產出 2 張重點便利貼：
    - 📌 **重點 1【敏捷拆解心法】**（黃色）：
      - `遵循 INVEST 核心原則確保獨立交付價值`
      - `杜絕過早規格僵化造成大量無效重工`
    - 📌 **重點 2【無縫銜接策略】**（綠色）：
      - `克服傳統瀑布流姍姍來遲的交付瓶頸`
      - `維持跨職能平順且持續的價值流動`
  - 發音錯別字校正率 100%，全文無任何機械式生硬語句。
- **證據截圖**：
  - 📸 [`evidence-01-gemini-200-and-stickies.png`](../evidence/evidence-01-gemini-200-and-stickies.png)

---

### 🧪 場景 2 (TC-02)：純淨逐字稿儲存與學員端嚴格隔離
- **測試重點**：
  1. 講師切換至 `🎙️ 逐字稿/Q&A` 分頁，檢查文字框內的整理逐字稿。
  2. 驗證口頭贅詞「呃，然後」已乾淨剔除，錯字已完成自動校正。
  3. 學員端（第一組小明）視窗檢查右側工作區分頁標籤，驗證逐字稿分頁完全不可見。
  4. 驗證學員端在**不重新載入網頁（No Page Refresh）**的狀態下，即時接收到講師端提煉發布的便利貼。
- **實測紀錄**：
  - 講師端逐字稿文字框顯示純淨修潤稿：
    *「今天我們探討本張投影片核心概念。姍姍來遲的情況在傳統交付中非常普遍，團隊在需求拆分時應該遵循無縫銜接的原則，確保 INVEST 價值獨立交付。」*
  - 學員端右側面板標籤清單中，逐字稿分頁數量嚴格為 `0`（學員端僅能看到「重點便利貼」、「提示詞工具」、「範例與附件」）。
  - 學員端便利貼列表無延遲即時呈現【敏捷拆解心法】與【無縫銜接策略】兩張便利貼。
- **證據截圖**：
  - 📸 [`evidence-02-transcript-clean-and-isolated.png`](../evidence/evidence-02-transcript-clean-and-isolated.png)

---

### 🧪 場景 3 (TC-03)：全天全課堂專書生成與 PDF 列印排版驗收
- **測試重點**：
  1. 講師在頂部功能列點擊 `🖨️ 列印筆記`，彈出【全日隨堂教材專書與成果手冊】全螢幕預覽彈窗。
  2. 講師點擊 `[📖 生成全日專書]`（或 `[🔄 重鑄專書]`），確認開始編撰。
  3. 驗證專書編撰管線依序處理 6 大模組章節（E, S, P, L, I, T），並快取至雲端 Firestore。
  4. 驗證專書出版級結構：
     - 個人化封面：顯示結訓學員姓名、組別編號（第 1 組）與出刊日期。
     - 章節長文排版：包含四大標準小節（`本章核心課題解析`、`拆解原則與實戰操作指南`、`實務場景與案例深度拆剖`、`課堂問答精選與避坑心法`）。
     - 投影片插圖對照 (Figures) 與隨堂重點便籤精選 (Key Highlights) 正常嵌入。
     - 雙附錄完整度：附錄 A 課堂提示詞工具箱 (Prompts) + 附錄 B 小組實戰演練成果與個人筆記 (Deliverables & Notes)。
     - 列印防折斷：關鍵區塊具備 `print:break-inside-avoid` 樣式。
- **實測紀錄**：
  - 專書編撰管線順暢執行，呼叫 6 次章節深度編撰，完成全書發布並寫入班級快取。
  - 專書章節標題數達 7 個，四大標準小節出現次數各為 6 次，結構完整度 100%。
  - 封面個人化標籤（結訓學員、組別、日期）正確顯示。
  - 隨堂重點便籤區塊精準嵌入章節末尾。
  - 附錄 A 與附錄 B 內容齊全，版面工整無文字截斷。
- **證據截圖**：
  - 📸 [`evidence-03-pdf-print-preview-layout.png`](../evidence/evidence-03-pdf-print-preview-layout.png)

---

### 🧪 場景 4 (TC-04)：筆電 1366×768 解析度與 125% DPI 縮放壓力測試
- **測試重點**：
  1. 將 Playwright 視窗設定為常見小尺寸筆電標準解析度：`1366 × 768`。
  2. 在瀏覽器注入 CSS `document.body.style.zoom = '1.25'`，模擬 Windows 系統常見的 125% DPI 放大顯示。
  3. 巡檢頂部導航列（TopBar）所有功能按鈕文字，檢驗是否嚴格維持單行（`whitespace-nowrap shrink-0`），杜絕文字折行破格。
  4. 檢驗 WorkbookPanel 講義面板四大標籤（重點便利貼、提示詞工具、範例與附件、逐字稿）與右側動態按鈕（新增便籤、開始錄音）是否流暢排列無重疊。
- **實測紀錄**：
  - 頂部導航列所有桌面按鈕高度均勻穩定在 30~37px，完全單行展示，無任何文字破行或重疊折損。
  - 巡檢結果：
    - `📋 小組白板`: whitespace-nowrap = true, height = 35px
    - `⚙️ 小編設定`: whitespace-nowrap = true, height = 37px
    - `🖨️ 列印筆記`: whitespace-nowrap = true, height = 37px
    - `📱 學生報到 QR`: whitespace-nowrap = true, height = 35px
    - `🎯 +演練`: whitespace-nowrap = true, height = 37px
    - `管理後台`: whitespace-nowrap = true, height = 37px
  - Workbook 面板 4 個分頁標籤與右側 2 個動態操作按鈕排版平整，未發生任何重疊破格現象。
- **證據截圖**：
  - 📸 [`evidence-04-dpi-125-zoom-1366x768.png`](../evidence/evidence-04-dpi-125-zoom-1366x768.png)

---

## 📁 驗收產出物與證據清單

工作區路徑：`C:\Antigravity\workshop\split\qa\2026-09-29-split-preflight-final-verification\`

1. **驗收工作指引**：
   - [`QA_BRIEF_PREFLIGHT_FINAL.md`](../QA_BRIEF_PREFLIGHT_FINAL.md)
2. **自動化驗證腳本**：
   - [`scripts/e2e-preflight-final.cjs`](../scripts/e2e-preflight-final.cjs)
3. **驗收存證截圖**：
   - 📸 [`evidence/evidence-01-gemini-200-and-stickies.png`](../evidence/evidence-01-gemini-200-and-stickies.png) (TC-01: 真實語音 AI 提煉與錯別字修復)
   - 📸 [`evidence/evidence-02-transcript-clean-and-isolated.png`](../evidence/evidence-02-transcript-clean-and-isolated.png) (TC-02: 純淨逐字稿與學員端嚴格隔離)
   - 📸 [`evidence/evidence-03-pdf-print-preview-layout.png`](../evidence/evidence-03-pdf-print-preview-layout.png) (TC-03: 全日專書生成與 PDF 列印預覽)
   - 📸 [`evidence/evidence-04-dpi-125-zoom-1366x768.png`](../evidence/evidence-04-dpi-125-zoom-1366x768.png) (TC-04: 1366×768 解析度與 125% DPI 縮放防線)
4. **測試結果摘要 JSON**：
   - [`evidence/test-summary.json`](../evidence/test-summary.json)

---

## 🎯 系統全迴歸與建置健康度

1. **單元與整合回歸測試套件**：
   - 指令：`node tests/verify-suite.js`
   - 結果：`20 / 20 全部通過 (100% PASS)`
2. **雙層全站建置編譯**：
   - 指令：`node scripts/build-all.js`
   - 結果：`Marshmallow`、`SPLIT`、`AI-ARM`、`Central Admin` 全專案打包編譯 100% 成功，零語法或型別錯誤。

---

## 🏁 結論與交付判定

本輪驗收方針對開課前的**核心教學品質保證（Quality of Delivery）**與**課後結尾學員交付價值（Tangible Takeaway）**兩大現場關鍵進行徹底實機壓測。

實測證實：
1. **語音 AI 隨堂提煉**：具備高精準度同音錯字修正能力，完全杜絕生硬粗暴切句與機器人字眼，產出高價值 MECE 便利貼。
2. **資料安全隔離**：學員端嚴格無法接觸講師逐字稿，且便利貼免刷新即時上架。
3. **成果專書手冊**：章節結構嚴謹、圖文並茂，兼具個人化榮譽感與完整實戰成果記錄。
4. **低解析度與 DPI 縮放容錯**：TopBar 頂部所有控制項均已加上 `whitespace-nowrap shrink-0` 防護，在 1366×768 筆電與 125% 縮放環境下表現平穩不破格。

**中央獨立 QA 驗收團隊正式判定：🟢 100% PASS，准予正式開課交付上線！**
