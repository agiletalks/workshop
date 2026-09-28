# AI-ARM / Workshop 門戶與管理後台整合複測申請單 (QA Retest Request)

**文件編號**：QA-RETEST-REQ-20260928-PORTAL  
**申請日期**：2026-09-28  
**申請團隊**：DEV 開發團隊  
**受理團隊**：AI-ARM / Workshop QA 測試團隊  
**測試環境**：Localhost 本機環境 (`http://localhost:5000/workshop/`)  
**自動化測試覆蓋**：[`tests/verify-suite.js`](file:///C:/Antigravity/workshop/tests/verify-suite.js)（11/11 全數 PASS）

---

## 📌 一、 複測背景與問題說明 (Defect Context)

在上一輪本地發布操作驗收中，使用者與測試回報：
> **「我們在 /workshop 看到的清單畫面，上面的排卡點擊就應該帶到該課程的管理後台，不應該對排卡點出教材了。」**

### 原有設計之缺陷與風險：
1. **點擊排卡直接開出教材**：門戶首頁排卡若直接超連結到教材（如 `./ai-align/` 或帶有 `(學員講義 ↗)` 的直連），學員或講師會繞過班級管理，在缺少 `?c={classId}` 參數的情況下進入講義，破壞多班級隔離機制。
2. **管理入口不明確**：講師進入 `/workshop/` 的主要目的是「管理班級、指派組別、複製專屬網址、重設世代」，排卡應直達該課程之專屬後台。

---

## 🛠️ 二、 本次修復內容與架構調整 (Fixes Implemented)

### 1. `/workshop/index.html` 課程排卡行為全面修正
* **排卡一律進入管理後台**：
  * **Card 1 (AI-Align)**：點擊直接導向 `./admin.html?course=ai-align`，按鈕文字調整為「進入 AI-Align 管理後台 →」。
  * **Card 2 (AI-ARM)**：點擊直接導向 `./admin.html?course=ai-arm`，按鈕文字調整為「進入 AI-ARM 管理後台 →」。
  * **Card 3 (SPLIT)**：點擊直接導向 `./admin.html?course=split`，按鈕文字調整為「進入 SPLIT 管理後台 →」。
* **徹底移除教材直連按鈕**：
  * 卡片上原有的 `(學員講義 ↗)` 獨立外開連結**全數拔除**。
  * 卡片任一區域點擊均直達管理後台，杜絕「點排卡跳出教材」的非預期行為。
* **學員教材與白板連結標準化**：
  * 所有學員講義與分組白板連結，統一由中央管理後台（`admin.html`）的班級卡片中讀取與複製，強制附帶 `?c={classId}&team={teamId}` 參數。

### 2. AI-Align 納入中央管理後台通用模式適配器 (`adapters/ai-align-adapter.js`)
* 實作 `CourseAdapterInterface` 介面，將 AI-Align 與 AI-ARM、SPLIT 並列納入中央後台管理。
* 提供「通用模式」班級資訊（預設班級、通行密碼 `agile-2026`、白板集合 `aigile_boards` 提示）。
* 支援後台一鍵開啟／複製 AI-Align 講義與 1~6 組即時白板連結。

### 3. 中央管理後台 (`admin.html`) 動態多課程切換
* 下拉選單整合：
  1. `SPLIT：需求拆解與用戶故事實戰工作坊 (完整管理)`
  2. `AI-ARM：AI 需求建模與敏捷 Refinement (唯讀檢視)`
  3. `AI-Align：AI 賦能敏捷跨部門溝通 (通用模式)`
* 具備 `AbortController` 請求中斷防串音，切換課程時動態呈現專屬提示橫幅、資料庫隔離標籤與控制按鈕。

---

## 🌐 三、 QA 測試環境與啟動方式

若本機伺服器尚未啟動，請執行下列指令：
```powershell
# 1. 執行全套建置（確保 dist 產物最新）
node scripts/build-all.js

# 2. 執行自動化測試套件（11 項測試必須為 100% PASS）
node tests/verify-suite.js

# 3. 啟動本機伺服器（預設 Port 5000）
node scripts/serve.js
```

### 驗證入口清單：
* **工作坊入口門戶 (Portal)**：[http://localhost:5000/workshop/](http://localhost:5000/workshop/)
* **中央管理後台 (Central Admin)**：[http://localhost:5000/workshop/admin.html](http://localhost:5000/workshop/admin.html)
  * AI-ARM 檢視：[http://localhost:5000/workshop/admin.html?course=ai-arm](http://localhost:5000/workshop/admin.html?course=ai-arm)
  * SPLIT 管理：[http://localhost:5000/workshop/admin.html?course=split](http://localhost:5000/workshop/admin.html?course=split)
  * AI-Align 檢視：[http://localhost:5000/workshop/admin.html?course=ai-align](http://localhost:5000/workshop/admin.html?course=ai-align)

---

## 📋 四、 QA 複測案例矩陣 (Retest Cases)

請 QA 測試工程師依據下列案例逐一驗收並記錄結果：

### 構面一：工作坊門戶排卡點擊行為 (Portal Card Navigation) [優先級: P0]

| 案例編號 | 測試項目 | 測試步驟 | 預期結果 | 通過標準 (PASS Criteria) |
|---|---|---|---|---|
| **TC-PORTAL-01** | AI-ARM 卡片點擊導航 | 1. 瀏覽 `http://localhost:5000/workshop/`<br>2. 點擊「AI-ARM：AI 需求建模與敏捷 Refinement」排卡任意位置 | 瀏覽器網址跳轉至 `./admin.html?course=ai-arm`，進入 AI-ARM 管理後台 | **絕對不可開啟講義教材**；進入管理頁面。 |
| **TC-PORTAL-02** | SPLIT 卡片點擊導航 | 1. 瀏覽 `http://localhost:5000/workshop/`<br>2. 點擊「SPLIT：需求拆解與用戶故事實戰」排卡任意位置 | 瀏覽器網址跳轉至 `./admin.html?course=split`，進入 SPLIT 管理後台 | **絕對不可開啟講義教材**；進入管理頁面。 |
| **TC-PORTAL-03** | AI-Align 卡片點擊導航 | 1. 瀏覽 `http://localhost:5000/workshop/`<br>2. 點擊「AI-Align：跨部門溝通萃取需求」排卡任意位置 | 瀏覽器網址跳轉至 `./admin.html?course=ai-align`，進入 AI-Align 通用後台 | **絕對不可開啟講義教材**；進入管理頁面。 |
| **TC-PORTAL-04** | 檢查卡片直連超連結 | 檢視 `/workshop/` 上三張課程排卡底部與內容 | 卡片上無 `(學員講義 ↗)` 或任何直達教材的次級連結按鈕 | 排卡只保留單一動作：「進入 XX 管理後台 →」。 |

---

### 構面二：AI-ARM 管理後台唯讀安全與舊相容回歸 (AI-ARM Regression) [優先級: P0]

| 案例編號 | 測試項目 | 測試步驟 | 預期結果 | 通過標準 (PASS Criteria) |
|---|---|---|---|---|
| **TC-AIARM-01** | AI-ARM 唯讀橫幅與寫入防護 | 1. 進入 `admin.html?course=ai-arm`<br>2. 檢視畫面上方提示與操作列 | 1. 橘色橫幅顯示「【AI-ARM 第一階段：唯讀管理檢視】」。<br>2. 「＋建立新班級」按鈕自動隱藏。<br>3. 班級卡片上無「演練清空」或編輯按鈕。 | 無法從中央後台發起對 `ai_arm_classes` 的寫入或重設。 |
| **TC-AIARM-02** | 班級清單讀取正確性 | 檢視 AI-ARM 班級列表 | 正常列出線上班級（如 `202609-ibm`、`default`），組數與狀態正確顯示 | 資料讀取正常，無 Firestore 報錯。 |
| **TC-AIARM-03** | 舊版後台入口連結有效性 | 點擊橫幅右側「開啟舊版 AI-ARM 後台」按鈕 | 於新分頁開啟 `./ai-arm/admin.html` | 舊版後台正常開啟運作，100% 舊相容。 |
| **TC-AIARM-04** | 後台專屬講義網址帶參驗證 | 於任一班級卡片點擊「學員講義連結」的複製或開啟按鈕 | 開啟之網址為 `./ai-arm/?c={classId}`（例如 `?c=202609-ibm`） | 正確帶有班級參數，非裸網址。 |

---

### 構面三：AI-Align 通用模式檢視 (AI-Align Mode) [優先級: P1]

| 案例編號 | 測試項目 | 測試步驟 | 預期結果 | 通過標準 (PASS Criteria) |
|---|---|---|---|---|
| **TC-ALIGN-01** | AI-Align 通用模式呈現 | 進入 `admin.html?course=ai-align` | 1. 藍色橫幅顯示「【AI-Align 通用模式檢視】」。<br>2. 呈現預設敏捷需求班（通行碼：`agile-2026`）。<br>3. 「＋建立新班級」按鈕隱藏。 | 介面清楚提示通用單一班級架構。 |
| **TC-ALIGN-02** | 白板與講義連結有效性 | 點擊講義或 Team 1~6 白板複製／開啟 | 講義導向 `./ai-align/`，白板導向 `./ai-align/board.html?team=team-{n}` | 連結完整可用，白板正常載入。 |

---

### 構面四：SPLIT 課程管理完整功能驗收 (SPLIT Mode) [優先級: P0]

| 案例編號 | 測試項目 | 測試步驟 | 預期結果 | 通過標準 (PASS Criteria) |
|---|---|---|---|---|
| **TC-SPLIT-01** | 開班建立與憑證隔離 | 1. 切換至 SPLIT 課程<br>2. 點擊「＋建立新班級」，輸入 Class ID `qa-split-retest`、密碼 `split-retest` 並儲存 | 班級建立成功，Firestore 公開資訊在 `split_classes`，密碼在 `split_class_secrets` | 列表即時更新，班級狀態為啟用。 |
| **TC-SPLIT-02** | 世代遞增演練重設 (Gen+1) | 點擊卡片「世代重設」並確認 | generation 由 1 遞增為 2，重設原因記錄於 Firestore | 世代單調遞增，舊鎖定自動失效。 |
| **TC-SPLIT-03** | 學員端報到與筆記協作 | 點擊後台學員連結開啟講義，登入 Team 1 填寫筆記 | 筆記儲存於 `split_data/.../notes`，右上角呈現綠色打勾同步狀態 | 編輯鎖定、跨組觀摩唯讀均正常運作。 |

---

## 📝 五、 QA 複測驗收簽核表 (Sign-off Template)

請 QA 驗收完成後於下方填寫判定結果：

| 測試構面 | 測試案例數 | PASS 數 | FAIL 數 | 判定結果 (PASS / FAIL) | 測試工程師 | 驗收日期 |
|---|---|---|---|---|---|---|
| 構面一：工作坊門戶排卡點擊行為 | 4 | | | | | |
| 構面二：AI-ARM 管理後台唯讀安全回歸 | 4 | | | | | |
| 構面三：AI-Align 通用模式檢視 | 2 | | | | | |
| 構面四：SPLIT 課程管理完整功能 | 3 | | | | | |
| **總結判定** | **13** | | | **[ ] 准予上線部署  [ ] 需返工修正** | | |

> **備註 / 缺陷反饋**：若測試過程中發現任何非預期行為，請將截圖附於 `ai-arm/qa/2026-09-28-prod-live-verification/evidence/` 並於本表反饋。
