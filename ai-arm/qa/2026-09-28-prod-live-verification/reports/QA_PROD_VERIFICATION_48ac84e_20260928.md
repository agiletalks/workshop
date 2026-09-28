# AI-ARM 生產環境線上驗收報告

- 測試日期：2026-09-28，約 10:10–10:35（Asia/Taipei）。
- 驗收依據：本主題根目錄 `QA_HANDOVER_PROD_LIVE_20260928.md`，文件提交 `63323af`。
- 目標版本：`48ac84e`；本機 HEAD 為 `63323af`，開始時 Git 工作目錄乾淨。
- 正式站：<https://agiletalks-workshop.web.app/workshop/ai-arm/>。
- 執行環境：Windows、Edge 擴充連線、Codex 內建 Chromium 瀏覽器；兩個不同瀏覽器作為講師／學員端。未把同一瀏覽器的新分頁當成無痕隔離。
- 結論：**未通過完整上線驗收。13 案例：3 PASS、6 FAIL、4 PARTIAL。另發現備份文字毀損風險。**
- FAIL 包含功能與交接規格不一致；請 DEV 修復或與需求方正式確認規格變更，不能以「程式已存在」代替驗收。

## 版本與證據可信範圍

正式站 `index.html`、`board.html`、`admin.html` 都回傳 HTTP 200。三者與 `48ac84e` 原始檔在 CRLF 正規化成 LF 後 SHA-256 完全相同；原始位元組差異來自換行格式，**沒有據此誤判部署版本不符**。詳見 `../evidence/version-evidence.json`。

此比對確認三個入口 HTML 的內容，不代表每個靜態資源、後端設定、Firebase rules 或整個部署都已建立 provenance。未 pull、push、deploy，也未修改產品原始碼。

## 案例結果

| 案例 | 結果 | 本輪實際結果與限制 |
|---|---|---|
| TC-01 既有班級登入／重整 | **FAIL** | 直接帶 `?c=2026-test` 的學員、`?c=202609-IBM` 的歷史班學員報到並重整可保留身分。但固定入口首次輸入班碼的講師與學員路徑均發生報到後門禁再現／重整遺失身分，見 BUG-PROD-01。 |
| TC-02 歷史筆記／附件 | **PARTIAL** | IBM 第 1 組 P11 載入 2095 字元歷史筆記與 `structural mm.txt` 9.3 KB 附件清單；2026-test 第 1 組 P11 的既有 PNG 縮圖及點擊預覽成功，原圖尺寸 800×450，另見 PDF 清單。未完成所有班／組／頁與備份逐筆相等檢驗，也未於本輪驗證 PDF 内容及下載雜湊。備份抽樣本身有字元毀損，見 BUG-PROD-07。 |
| TC-03 白板歷史產出／編輯 | **PARTIAL** | IBM 第 1 組 2 張、第 2 組 19 張；第 2 組的 19 張卡片 ID 與去除空白後文字皆符合備份。2026-test 第 1 組新增 QA 卡，拖曳 x:4326→4456、y:3916→3986，重整後文字與座標保留，已清理。IBM 抽樣備份原有連線為 0，未因此宣稱非零連線與所有背景資料完整通過。 |
| TC-04 雙軌錄音／手動輸入 | **FAIL** | Edge 與內建瀏覽器可啟動 ON AIR 計時並手動停止；無有效語音時回到待講授並提示「錄音時間過短或未偵測到有效語音」。正式碼的 unsupported／error 分支不提供指南承諾的手動文字輸入路徑，見 BUG-PROD-02。真實有聲輸入與拒絕麥克風權限路徑本輪未完成。 |
| TC-05 新講義生成／CRUD | **PARTIAL** | 本輪新增、修改、刪除測試便籤成功；點擊變色後未取得足夠穩定前後證據，不列入 PASS。既有 P03 三張便籤及背面文章可讀。未取得本輪有效口述或手動輸入，因此未驗證新生成 3–5 張 MECE 便籤、文章品質及實際 AI 成功路徑。 |
| TC-06 跨端同步／學員唯讀 | **PASS（抽樣）** | Edge 講師於 2026-test P02 新增便籤，內建瀏覽器學員不重整可見。修改標題為 `QA0928-PROD 同步驗收-2`、失焦後至學員看到的自動化端到端量測約 1983 ms，包含操作成本；學員卡片 editable=0、卡片工具按鈕=0。刪除亦同步回原先 1 張。僅單次時間樣本，不是持續 SLA 或後端權限滲透驗證。 |
| TC-07 巡堂／貼入筆記 | **FAIL** | 巡堂可切第 2 組，筆記欄唯讀。但 P24 已有講義的測試班找不到「貼入小組筆記」可操作入口；全頁可見貼入按鈕數 0。見 BUG-PROD-03；追加且不覆蓋既有筆記因入口缺失未能驗證。 |
| TC-08 單頁列印／PDF | **FAIL** | 停於 P02 點頁首列印，開啟「全書級隨堂講義實錄手冊」並載入 5/46 頁，包含 P02、P03、P11、P20、P24；沒有單頁選取，與規格不符。見 BUG-PROD-04。未完成原生 Ctrl+P、PDF 落地與紙張分頁視覺驗收。 |
| TC-09 目錄圖釘 | **FAIL（P2）** | 初次 P03 資料載入後見 📌；重新開目錄後變成 📝。未訪問的已錄製頁面在初次目錄亦未全數標記。點擊已載入 P03 可到正確內容。見 BUG-PROD-05。 |
| TC-10 翻頁／全螢幕 | **PARTIAL** | 左右鍵 P02→P03→P02 成功；目錄導航與按鈕翻頁可用，教材為 46 頁。自動化點擊／Enter 全螢幕後未觀察到 document.fullscreenElement；未區分瀏覽器自動化限制與產品原因，不能列全螢幕 PASS 或確定產品 FAIL。未逐頁核對所有投影片標題與圖片。 |
| TC-11 三工具 iframe／独立頁 | **FAIL（規格差異）** | 工具庫可獨立打開決策表與狀態矩陣，表格有內容，沒有觀察到 CSP 阻擋。第三工具實為小組白板；指南所述事件風暴工具與嵌入 iframe 工作流未找到，主頁 iframe 原始碼僅見附件預覽。見 BUG-PROD-06。 |
| TC-12 提問／表情 | **PASS（抽樣）** | 2026-test P04 發布 `QA0928-PROD：驗收用提問，請忽略`，學員另一瀏覽器清單可見；測試後已刪除。❤️ 點擊後 DOM 實際出現 reaction-particle。未測每一種表情或連續高負載。 |
| TC-13 Console 健康 | **PASS（已執行範圍）** | 主頁、歷史頁、白板與兩個獨立工具的捕獲日誌未見產品 Uncaught Exception／404。存在 Tailwind CDN production 警告；Edge 另有 chrome-extension:// 的 content script 錯誤，已歸類為擴充來源。不是全站 network trace 或所有未執行路徑無錯保證。 |

## 缺陷明細與 DEV 處理方向

### BUG-PROD-01 — P0：報到後網址班級與執行中班級／登入儲存鍵未一致更新

- 案例：TC-01，固定 QR 入口主流程。
- 重現 1：Edge 開啟無參數固定入口，填 `2026-test`、`QA0928講師`、選講師並輸入既有密碼；顯示講師歡迎與 P01。重新整理後回到門禁，右上身分變成「學員」。
- 重現 2：內建瀏覽器從無參數入口填 `202609-kgi`、`QA0928固定入口`、第 1 組。顯示報到成功且 URL 變成 `?c=202609-kgi`；其後再次出現門禁，重整仍需報到。截圖 `fixed-entry-relogin.png`。
- 額外症狀：由帶 KGI 參數的門禁改輸入 `2026-test` 後，URL 更新但畫面班級仍顯示凱基銀行。沒有進行跨班內容寫入測試；資料錯投風險是由狀態不一致推論，不能宣稱已驗證資料外洩。
- 程式核對：`index.html:1901` 的 APP_STORAGE_KEY 依頁面最初 class 初始化；`handleGatekeeperSubmit` 寫入 APP_STORAGE_KEY、replaceState URL 後，未同步重綁 currentClassId 與儲存／協作命名空間。
- 建議：成功驗證班級後統一更新班級狀態、認證 key 與訂閱，或保存該班認證後導向帶班碼頁。加測無參數首次登入、帶參數登入、改填不同班碼及重整。

### BUG-PROD-02 — P1：指南承諾的手動逐字稿降級路徑未實作於正式版

- 案例：TC-04；本項含原始碼核對，**不是已實測拒絕麥克風權限**。
- 實測：錄音可進入 ON AIR、手動停止無有效語音後提示並回待講授；沒有手動貼入入口。
- 程式證據：`index.html:8522` initVoiceNote 在 unsupported 時只顯示 disabled 的不支援按鈕；`index.html:8690` 附近 onError 僅 Toast 與 UI 回復。沒有交接指南描述的手動輸入彈窗與送出編排入口。
- 請補上手動文字輸入並實際跑生成流程，或修正產品規格。不得拿「AI 生成失敗後的文字 fallback 排版」替代「麥克風失敗後的文字輸入」；兩者是不同功能。

### BUG-PROD-03 — P1：巡堂貼入功能缺少 UI 入口

- 案例：TC-07。
- 重現：2026-test 講師 → P24 → 巡堂第 2 組。筆記 placeholder 明示「可點上方『貼入小組筆記』」，實際無此按鈕。
- 程式證據：`copyStickiesToMemo()`（約 `index.html:9192`）有定義，但全文查找僅見函式定義，未見按鈕／事件接線。
- 預期：能追加便籤精華且保留原筆記；實際無法啟動。
- 證據：`patrol-test-class.png`（測試班）；`patrol-no-paste.png` 另記錄 KGI 執行狀態下相同入口缺失，不能當成 2026-test 畫面。

### BUG-PROD-04 — P1：單頁列印需求與全書列印實作不符

- 案例：TC-08。
- 重現：2026-test P02 → 頁首列印。預览為全書級，載入多個投影片與小組成果。
- 預期：僅本頁講義／便籤；實際無單頁範圍選項，只有組別與是否排除空頁。
- 證據：`print-all-course.png`。`index.html:132` 起列印 CSS 使用全書 print-modal；本輪未以實體列印／PDF 佐證紙面結果。

### BUG-PROD-05 — P2：目錄徽章重開後由 📌 變成 📝，冷載入標記不完整

- 案例：TC-09。
- 重現：載入 P03 既有講義 → 首次資料回傳見 📌 → 重開目錄變 📝。
- 原始碼：`renderTocDrawer` 約 5225–5232 行寫入 📝；`updateTocVoiceNoteBadge` 約 9313–9329 行寫入 📌。標記來源依已載入頁面快取，不能保證冷開目錄全班所有已錄頁都顯示。
- 證據：`toc-wrong-badge.png`；修正後測冷開目錄與反覆開關、已錄與未錄頁。

### BUG-PROD-06 — P1：三工具與 iframe 驗收規格不符

- 案例：TC-11。
- 實測工具箱三項：決策表、狀態轉換矩陣、小組白板。前兩者連結 target 新頁且成功載入。
- 未找到指南列出的事件風暴工具及一般工具 iframe 嵌入操作。主頁 iframe 原始碼僅見 attachment-html-frame、attachment-pdf-frame。
- 證據：`tools-catalog.png`；請確認應恢復功能還是改寫驗收指南。本項不把未測到的 iframe 宣稱為 CSP 錯誤。

### BUG-PROD-07 — P1：上線前備份的中文筆記已有 U+FFFD 替代字元

- 額外風險發現；不計入 13 案例 FAIL 數。
- 備份資料夾：`backups/firestore-backup-2026-09-28T02-04-22-591Z/`。
- 文件：`ai_arm_202609-ibm_note_task-01-envision_team-1`，memo 欄位。
- 正式站 P11 DOM 筆記長度 2095，U+FFFD=0；decoded 備份長度 2100，U+FFFD=8，raw 備份同欄位也有 8。
- 第一處差異 index 356：備份為 `受訪者��`，正式站為 `受訪者：`。**這是備份與畫面不一致，沒有證據顯示正式站資料遭本次部署刪失。**
- `scripts/backup-firestore.js:28` 使用 `res.on('data', chunk => body += chunk)`；Buffer 分段直接轉字串可能破壞跨 chunk UTF-8 字元，是待 DEV 修正及回歸的根因候選。
- 建議以 Buffer.concat 或 UTF-8 stream decoder 正確解碼，再重新備份與抽樣比對；完成受控還原演練前，不宜宣稱這份備份能無損還原。QA 未執行任何還原。

## 尚待補測與結案條件

1. BUG-PROD-01 與手動輸入／巡堂貼入功能優先修復；將修復 commit 與新建置／正式站內容明確交接。
2. 使用講師真實麥克風說話，手動按停止，驗證原始辨識、AI 成功編排與內容品質。使用者不用口述「念完了」。本轮仅无有效语音的启动／停止，不借用上一輪本機結果。
3. 補驗瀏覽器權限拒絕、不支援語音的手動輸入、單頁 PDF 視覺結果，以及普通人工點擊全螢幕。
4. 所有歷史資料完整性需有可用備份基準及抽樣／全量比對方案；本輪 UI 抽查不能宣稱「全部完全無損」。
5. 三工具、列印、圖釘的規格差異需由需求方與 DEV 明確決定；變更規格後才可按新版驗收，不追溯改成 PASS。

## 測試資料與清理

- 只在測試班 2026-test 寫入 QA 便籤、QA 白板卡與 QA 提問；上述三項已透過 UI 刪除，且確認講義回到原先 1 張卡、白板 QA 卡不存在、提問清單回空。
- 原先 P02/P03/P24 講義、歷史 IBM/KGI 筆記附件與白板內容未編修。
- 真實歷史班未進行拖曳或刪卡；拖曳只用本輪新增 QA 卡。
- 登入會產生一般身分／在線紀錄，未清除其他人的 session 或雲端資料。
- 錄音皆已停止；無有效語音測試未生成新講義。
- 不重啟任何舊 listening、timer、file watcher 或自動複測流程。

## 佐證檔案

`../evidence/`：version-evidence.json、console-logs.json、backup-sample-evidence.json、fixed-entry-relogin.png、attachment-preview.png、student-sync.png、print-all-course.png、tools-catalog.png、voice-no-input.png、patrol-test-class.png、patrol-no-paste.png、toc-wrong-badge.png、question-sync.png、board-persist.png。

版本核對腳本：`../scripts/verify-version.cjs`。腳本只 GET 公開入口 HTML、讀取本機 Git，將結果寫至 evidence，不寫正式站。
