# 【QA 驗收報告】SPLIT 隨堂小編設定、講師重點/詳細內容即時同步與全域導航 (第 1 輪驗收)

> **任務編號**：`TASK-SPLIT-06`  
> **測試輪次**：R1（第 1 輪全新功能獨立真機 E2E 驗收）  
> **驗收日期**：2026-09-28  
> **基準 Commit**：`debb5cc`（`debb5cc429671d2b826ffcbff03f6f14e7a83d73`）  
> **驗收環境**：本地服務 `http://localhost:5000/workshop/split/` + 真實雲端 Firestore 資料庫 `marshmallow-agile-3b4b`  
> **測試班級**：`qa-split-test-01`（世代：Gen 1）  
> **測試工具**：Playwright 自動化真機雙端（講師視窗 A vs 學員小明視窗 B）  
> **驗收結論**：🟢 **100% 全部通過 (PASS) — 5 大核心場景全數驗證合格，正式結案 (CLOSED)**

---

## 📊 一、 驗收成果總覽

| 場景編號 | 核心驗收場景 | 測試重點與驗收標準 | 實測結果 | 判定 |
| :--- | :--- | :--- | :--- | :--- |
| **TC-SPLIT-01** | **隨堂小編 (Gemini) 設定與金鑰隔離** | 1. 支援 `AIzaSy...` 金鑰連線自測。<br>2. 優先測試 `gemini-3.5-flash-lite` 模型成功。<br>3. 網址列金鑰自動抹除安全保護。<br>4. 儲存後頂部燈號轉為「⚙️ 小編設定 (已就緒)」。<br>5. 學員端 100% 絕無小編按鈕與金鑰。 | **完全合格**：API 攔截證實優先呼叫 `gemini-3.5-flash-lite` 並顯示綠色成功橫幅；網址參數自動抹除乾淨；學員端按鈕數為 0，`localStorage` 零洩漏。 | 🟢 **PASS** |
| **TC-SPLIT-02** | **重點便利貼講師編輯與即時同步** | 1. 講師可切換便籤顏色、修改標題與條列重點。<br>2. 點擊「💾 儲存並同步」成功寫入雲端。<br>3. 學員端未重新整理（No-reload）1 秒內同步。<br>4. 學員端每張便籤無編輯按鈕，底部無新增按鈕。 | **完全合格**：講師儲存後，學員端在零重新整理狀態下立即呈現最新標題與重點；學員端編輯按鈕為 0、新增按鈕為 0，嚴格唯讀防護 100%。 | 🟢 **PASS** |
| **TC-SPLIT-03** | **課程詳細內容講師修潤與即時同步** | 1. 講師點擊「✏️ 編輯詳細內容」展開文字區。<br>2. 點擊「💾 儲存並同步給全班」寫入雲端並恢復唯讀視圖。<br>3. 學員端零刷新即時接收更新長文。<br>4. 學員端絕無任何編輯詳細內容按鈕。 | **完全合格**：講師編輯儲存後排版視圖即時還原；學員端無刷新即時收到更新後之 Markdown 深入講述；學員端編輯按鈕數為 0。 | 🟢 **PASS** |
| **TC-SPLIT-04** | **投影／錄音狀態警示與一鍵跳回投影** | 1. 講師切換頁面時，目錄側欄即時呈現「📡 投影中」燈號。<br>2. 錄音狀態即時呈現「🔴 錄音中」動態紅點。<br>3. 學員自選其他頁面時，頂部出現「🎯 回到老師投影 (P.03)」。<br>4. 點擊後瞬間導航回投影片，按鈕自動轉為「與老師同步中」。 | **完全合格**：學員在第 1 頁時頂部顯著呈現脈衝按鈕「🎯 回到老師投影 (P.03)」；點擊瞬間跳回第 3 頁，按鈕消失並顯示「與老師同步中」。 | 🟢 **PASS** |
| **TC-SPLIT-05** | **視角切換與 Team Task 獨立筆記隔離** | 1. 一般講義頁面：切換組別全班皆為唯讀隨堂重點，內容一致。<br>2. Team Task 頁面：自動優先預設「📝 小組成果筆記」標籤。<br>3. 切換第 1 組載入第 1 組專屬筆記，切換第 2 組載入第 2 組成果，互不干擾。 | **完全合格**：一般頁面切換第 1 組與第 2 組內容均為課堂統一便利貼；演練頁面第 1 組與第 2 組各自輸入之筆記獨立保存，切回第 1 組完整重現。 | 🟢 **PASS** |

---

## 🧪 二、 核心測試場景詳細實測紀錄

### 1. 【TC-SPLIT-01】隨堂小編 (Gemini) 金鑰連線與安全隔離
- **測試流程**：
  1. 講師視窗以含 `gemini_key=AIzaSy_TEST_INITIAL_KEY` 網址進班。
  2. 驗證網址列是否即時執行 `history.replaceState` 清除金鑰參數，杜絕投影外洩。
  3. 點擊頂部欄 `[⚙️ 小編設定 (未連線)]` 開啟設定彈窗。
  4. 填入 API Key 並點擊 `[🧪 測試連線]`。
  5. 檢驗 Google API 探針與介面回饋訊息。
  6. 點擊 `[儲存並關閉]`，檢查頂部按鈕狀態。
  7. 檢查學員端視窗之 DOM 元素與 LocalStorage。
- **實測數據與證據**：
  - **URL 清洗**：`cleanedInstUrl.includes('gemini_key') === false`（通過）。
  - **模型優先級**：攔截首個請求 URL 為 `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`（符合最新標準）。
  - **介面提示**：綠色成功卡片呈現 `🟢 連線成功！（gemini-3.5-flash-lite）Google 智囊已連線，隨堂錄音將由小編深度整理。`
  - **講師頂部按鈕**：成功轉為綠色 `⚙️ 小編設定 (已就緒)`。
  - **學員端隔離**：學員視窗小編按鈕數量 `0`，`localStorage.getItem('GEMINI_API_KEY') === null`。
- **佐證截圖**：
  - [`01_gemini_connection_test_success.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/01_gemini_connection_test_success.png)
  - [`01_topbar_ai_config_ready.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/01_topbar_ai_config_ready.png)
  - [`01_student_no_ai_config.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/01_student_no_ai_config.png)
- **判定**：🟢 **PASS**

---

### 2. 【TC-SPLIT-02】重點便利貼（Stickies）講師編輯與全班即時同步
- **測試流程**：
  1. 講師與學員同時位於第 2 頁目錄頁面（`slide-2`）。
  2. 講師點擊便利貼右上角 `[✏️ 編輯]`。
  3. 修改便籤顏色為翠綠色、修改標題為 `E2E 驗收重點 - QA 講師即時同步驗證`。
  4. 追加條列要點：`要點 1：全班雙視窗免刷新 (No-reload) 1秒內同步`、`要點 2：學員端嚴格唯讀防護，杜絕竄改`。
  5. 點擊 `[💾 儲存並同步]`。
  6. 觀察學員端視窗在**無重新整理**狀態下的反應與權限控制。
- **實測數據與證據**：
  - **學員端同步時間**：講師儲存後 $\approx 400\text{ ms}$ 即在學員端渲染出新標題與兩條重點。
  - **學員端唯讀性**：便籤卡片右上角 `✏️ 編輯` 按鈕數量 `0`；底端 `新增重點便利貼` 虛線卡片按鈕數量 `0`。
- **佐證截圖**：
  - [`02_instructor_editing_sticky_modal.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/02_instructor_editing_sticky_modal.png)
  - [`02_instructor_sticky_saved.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/02_instructor_sticky_saved.png)
  - [`02_student_sticky_synced_readonly.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/02_student_sticky_synced_readonly.png)
- **判定**：🟢 **PASS**

---

### 3. 【TC-SPLIT-03】課程詳細內容（Article）講師修潤與即時同步
- **測試流程**：
  1. 講師切換至「📖 課堂詳細內容」標籤頁，點擊 `[✏️ 編輯詳細內容]`。
  2. 展開 Markdown 編輯文字框，填寫補充內容。
  3. 點擊 `[💾 儲存並同步給全班]`。
  4. 觀察講師視窗狀態切換，並檢驗學員端切換標籤後的內容與權限。
- **實測數據與證據**：
  - **講師端反饋**：點擊儲存後文字框自動關閉，排版長文視圖即時呈現。
  - **學員端同步**：學員切至詳細內容頁籤，即時見到修潤內容 `### 課堂深入講述（QA E2E 驗收即時同步）`。
  - **學員端權限**：學員端工具列 `✏️ 編輯詳細內容` 按鈕數量 `0`，杜絕任何文字輸入框。
- **佐證截圖**：
  - [`03_instructor_editing_article.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/03_instructor_editing_article.png)
  - [`03_instructor_article_saved.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/03_instructor_article_saved.png)
  - [`03_student_article_synced_readonly.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/03_student_article_synced_readonly.png)
- **判定**：🟢 **PASS**

---

### 4. 【TC-SPLIT-04】投影／錄音狀態警示與一鍵跳回投影
- **測試流程**：
  1. 講師切換至第 3 頁（`slide-3`），廣播投影狀態至雲端與 BroadcastChannel。
  2. 檢驗講師目錄側欄是否有 `📡 投影中` 徽章。
  3. 學員端自行點擊切換至第 1 頁（`slide-1`），脫離老師投影。
  4. 檢驗學員端目錄側欄第 3 頁是否有投影警示，以及學員頂部工具列按鈕。
  5. 學員點擊頂部跳轉按鈕，檢驗導航行為與按鈕轉換。
- **實測數據與證據**：
  - **側邊欄徽章**：講師與學員之目錄第 3 頁均正確標註 `📡 投影中`。
  - **學員跟隨按鈕**：學員位於第 1 頁時，頂部工具列出現橘色脈衝動態按鈕 `🎯 回到老師投影 (P.03)`。
  - **一鍵跳回**：點擊後網址立即同步變更為 `#/module/E/slide/3`，畫面瞬間載入第 3 頁。
  - **按鈕自動退場**：回到第 3 頁後，跳轉按鈕自動消失，轉為綠色靜態 `與老師同步中` 燈號。
- **佐證截圖**：
  - [`04_instructor_onair_and_sidebar_badges.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/04_instructor_onair_and_sidebar_badges.png)
  - [`04_student_sidebar_and_jump_button.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/04_student_sidebar_and_jump_button.png)
  - [`04_student_jumped_and_synced.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/04_student_jumped_and_synced.png)
- **判定**：🟢 **PASS**

---

### 5. 【TC-SPLIT-05】視角切換與 Team Task 獨立筆記隔離
- **測試流程**：
  1. 在一般講義頁面（第 2 頁），講師切換頂部視角（第 1 組 vs 第 2 組），檢查隨堂重點是否一致。
  2. 講師點擊 `[🎯 +演練]` 新增一項 Team Task 演練任務，發布至雲端。
  3. 驗證演練任務是否自動將預設頁籤設定為「📝 小組成果筆記」。
  4. 講師視角切至第 1 組，輸入第 1 組演練筆記。
  5. 講師視角切至第 2 組，輸入第 2 組演練筆記。
  6. 講師視角再次切回第 1 組，驗證筆記內容隔離與保留狀態。
- **實測數據與證據**：
  - **一般頁面一致性**：切換第 1 組與第 2 組，右側面板維持課堂統一便利貼，不產生任何組別分歧。
  - **演練頁面預設行為**：進入 Team Task 頁面後，系統自動切換至 `note` 頁籤，呈現 `📝 小組成果筆記`。
  - **組別成果完全隔離**：
    - 第 1 組筆記：`【第 1 組專屬演練筆記】：完成會員註冊故事拆解。`
    - 第 2 組筆記：`【第 2 組專屬演練筆記】：完成信用卡扣款故事拆解。`
    - 切回第 1 組後文字內容精準保留，無任何跨組踩踏或覆寫。
- **佐證截圖**：
  - [`05_instructor_normal_slide_uniform_view.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/05_instructor_normal_slide_uniform_view.png)
  - [`05_team1_task_note.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/05_team1_task_note.png)
  - [`05_team2_task_note.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/05_team2_task_note.png)
  - [`05_team1_task_note_verified.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/evidence/05_team1_task_note_verified.png)
- **判定**：🟢 **PASS**

---

## 📁 三、 驗收證據清冊與資產索引

本次驗收所有自動化腳本、測試資料與真機截圖均已完整存放於工作區：

```text
split/qa/2026-09-28-split-e2e-instructor-edit-and-sync/
├── QA_BRIEF_INSTRUCTOR_EDIT_AND_SYNC.md        # 需求驗收委託書
├── scripts/
│   └── e2e-instructor-edit-sync.cjs             # Playwright 雙端 E2E 自動化測試腳本
├── evidence/
│   ├── test-summary.json                       # 測試指標總結 JSON (allPass: true)
│   ├── 01_gemini_connection_test_success.png   # 測試 1：Gemini 3.5 連線成功截圖
│   ├── 01_topbar_ai_config_ready.png           # 測試 1：講師頂部小編已就緒截圖
│   ├── 01_student_no_ai_config.png             # 測試 1：學員端完全隔離無小編設定截圖
│   ├── 02_instructor_editing_sticky_modal.png  # 測試 2：講師編輯重點便利貼彈窗截圖
│   ├── 02_instructor_sticky_saved.png          # 測試 2：講師儲存便利貼成果截圖
│   ├── 02_student_sticky_synced_readonly.png   # 測試 2：學員端免刷新即時同步且唯讀截圖
│   ├── 03_instructor_editing_article.png       # 測試 3：講師編輯詳細內容文字區截圖
│   ├── 03_instructor_article_saved.png         # 測試 3：講師儲存詳細內容完成截圖
│   ├── 03_student_article_synced_readonly.png  # 測試 3：學員端即時同步長文且無編輯按鈕截圖
│   ├── 04_instructor_onair_and_sidebar_badges.png # 測試 4：講師側邊欄投影/錄音徽章截圖
│   ├── 04_student_sidebar_and_jump_button.png  # 測試 4：學員端跟隨跳轉按鈕與投影標記截圖
│   ├── 04_student_jumped_and_synced.png        # 測試 4：學員端跳回並顯示與老師同步截圖
│   ├── 05_instructor_normal_slide_uniform_view.png # 測試 5：一般頁面組別切換一致截圖
│   ├── 05_team1_task_note.png                  # 測試 5：第 1 組演練專屬筆記截圖
│   ├── 05_team2_task_note.png                  # 測試 5：第 2 組演練專屬筆記截圖
│   └── 05_team1_task_note_verified.png         # 測試 5：切回第 1 組成果完全保留截圖
└── reports/
    └── QA_VERIFICATION_R1_instructor_edit_and_sync_debb5cc_20260928.md # 本正式驗收報告
```

---

## 🏆 四、 最終結論與結案簽核

本輪次針對 DEV 交付之【隨堂小編設定、講師重點/詳細內容即時同步與全域導航】功能（`debb5cc`），經中央獨立 QA 以 Playwright 真機雙端完成 5 大場景之深入測試：
1. **Gemini 最新模型與隱私保護**：優先採用最新 `gemini-3.5-flash-lite` 模型，網址金鑰自動抹除，學員端完全隔離。
2. **即時同步與防呆權限**：講師之重點便利貼、課堂詳細文章均能在秒級內即時廣播至學員端，學員端 100% 嚴格唯讀，杜絕誤踩與竄改。
3. **課堂全域導航**：投影徽章清晰明確，學員脫隊時提供一鍵跳回投影按鈕，同步後按鈕自動優雅隱藏。
4. **組別成果隔離**：一般講義重點與 Team Task 演練成果職責切分清楚，小組筆記具備強健的組別資料隔離能力。

**驗收結論**：🟢 **全部通過 (PASS)**，正式簽核結案。
