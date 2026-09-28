# Workshop 門戶與中央後台複測報告

- 日期：2026-09-28（Asia/Taipei）
- 依據：`../QA_RETEST_REQUEST_PORTAL_ADMIN_20260928.md`
- 更新結論：**7 PASS、3 FAIL、3 OUT OF SCOPE；本期 10 項有效案例仍需返工修正。** 原始實測為 9 PASS、4 FAIL；本次依使用者決策調整範圍，沒有新增複測或宣告缺陷已修復。
- 基準 HEAD：`be97fafd8a5564b8ee13b4ce6a7077d4358a7001`。本次測的是包含未提交變更的工作目錄建置，**不是該 commit 的乾淨快照**；實際檔案指紋與工作目錄狀態附於證據。
- 環境：Windows、本機 Port 5000、Codex 內建瀏覽器與 Edge。沒有部署、推送或修改產品原始碼。

## 0. 給 DEV 的範圍變更通知（2026-09-28）

使用者決定先將 **AI-Align、HOOK、棉花糖挑戰** 標記為 inactive，本期不要求這三門課的課程管理功能。課程管理開發與驗收先聚焦 **AI-ARM、SPLIT**。

- AI-Align 專屬管理入口與通用管理案例（TC-PORTAL-03、TC-ALIGN-01、TC-ALIGN-02）改列 OUT OF SCOPE。已完成的原始觀察與佐證保留，不將範圍排除視為修復或 PASS。
- TC-PORTAL-04 本期僅要求 AI-ARM、SPLIT 排卡的管理入口行為；原先 AI-Align 觀察保留為歷史紀錄。
- **BUG-PORTAL-RETEST-01 暫緩，不阻擋本期驗收**，包含該課白板入口與附帶的文案問題。未來恢復該課管理功能時再納入。
- **BUG-PORTAL-RETEST-02、03、04 維持待修**，優先級分別為 P0、P1、P2。
- HOOK、棉花糖挑戰原本未列入這 13 項案例，不新增其管理功能要求。
- 本次僅更新 QA 回饋；沒有變更產品旗標，也尚未驗證 inactive 狀態已實際生效。

## 1. 版本、建置與驗證方法

重新執行 `node scripts/build-all.js` 成功（exit 0），SPLIT 產物為 `index-CrI00W6P.js`。`node tests/verify-suite.js` 實跑 11/11 通過。該套件使用 mock Firestore 與本機斷言，不代表正式 Firestore 規則、真實登入或瀏覽器操作已通過。

Portal、中央 admin 與三個 adapter 的本機 HTTP 回應皆為 200，回應內容與來源 SHA-256 相同。證據：[version.json](../evidence/portal-admin-be97faf-20260928/version.json)、[git-status.txt](../evidence/portal-admin-be97faf-20260928/git-status.txt)。

UI 驗證包含實際點擊、跨瀏覽器協作與 DOM 快照；雲端資料核對僅讀取本次專用班級。不得將本報告解讀為全產品安全認證或完整舊功能回歸。

## 2. 十三項案例結果

| 案例 | 結果 | 實測與範圍 |
|---|---|---|
| TC-PORTAL-01 | PASS | 實際點擊 AI-ARM 卡片，導向 `/workshop/admin.html?course=ai-arm`。 |
| TC-PORTAL-02 | PASS | 實際點擊 SPLIT 卡片，導向 `/workshop/admin.html?course=split`。 |
| TC-PORTAL-03 | OUT OF SCOPE | 原始 PASS：實際點擊 AI-Align 卡片，導向 `/workshop/admin.html?course=ai-align`。依新版範圍暫不要求此課管理入口。 |
| TC-PORTAL-04 | PASS | 本期限 AI-ARM、SPLIT：各為管理入口，未見直達教材的次級連結；原始 AI-Align 檢查亦通過，但不列入本期要求。 |
| TC-AIARM-01 | PASS | 橘色唯讀橫幅正確；無建立、編輯、清空／重設控制；adapter 拒絕寫入之套件斷言通過。僅證明指定 UI／adapter 防護，不代表資料庫阻擋所有外部寫入。 |
| TC-AIARM-02 | PASS | 7 班正常顯示，含 IBM、default；2026-test 顯示 2 組、QA B 顯示 8 組、QA A 顯示 3 組；未見 Firestore 報錯。 |
| TC-AIARM-03 | PASS | 舊後台新分頁正確開啟，通行驗證後正常顯示班級列表。僅為入口與載入冒煙，未重做舊後台全部 CRUD。 |
| TC-AIARM-04 | PASS | 實際複製取得 `http://localhost:5000/workshop/ai-arm/?c=2026-test`。 |
| TC-ALIGN-01 | OUT OF SCOPE | 原始 PASS：藍色通用模式橫幅、預設敏捷需求班、6 組、通行碼顯示正確，沒有建立班級按鈕。 |
| TC-ALIGN-02 | OUT OF SCOPE | 原始 FAIL：講義入口可開啟；中央後台沒有 Team 1～6 白板連結或複製按鈕。BUG-PORTAL-RETEST-01 暫緩，非已修復。 |
| TC-SPLIT-01 | FAIL | 建班、列表更新、active 狀態與公開／機密文件分離均成功；但機密文件可未驗證讀取，憑證隔離存在安全缺陷。BUG-PORTAL-RETEST-02。此 FAIL 包含實測發現的安全延伸檢查；若僅依申請單狹義的文件分開存放條件，該子項通過。 |
| TC-SPLIT-02 | FAIL | Gen 1→2、舊鎖不再阻擋、新世代空白與可重新取得編輯鎖均通過；Firestore 稽核紀錄缺少要求的重設原因。BUG-PORTAL-RETEST-04。 |
| TC-SPLIT-03 | FAIL | 從後台新班網址開啟時沿用其他班既有登入，未正確報到。改用乾淨 origin 後 Team 1 報到、雲端筆記同步、互斥鎖與跨組唯讀正常。BUG-PORTAL-RETEST-03。 |

| 構面 | 原案例數 | PASS | FAIL | OUT OF SCOPE |
|---|---:|---:|---:|---:|
| Portal | 4 | 3 | 0 | 1 |
| AI-ARM | 4 | 4 | 0 | 0 |
| AI-Align | 2 | 0 | 0 | 2 |
| SPLIT | 3 | 0 | 3 | 0 |
| 合計 | 13 | 7 | 3 | 3 |

## 3. 缺陷處置：一項暫緩、三項待修

### BUG-PORTAL-RETEST-01：AI-Align 缺少六組白板入口（暫緩／本期範圍外，原 P1）

- 現行處置：依使用者範圍決策，本期不需修正，不阻擋驗收。以下保留原始實測；複測步驟留待未來恢復該課管理功能時使用。

- 案例：TC-ALIGN-02。
- 重現：開啟 `http://localhost:5000/workshop/admin.html?course=ai-align`，查看預設班卡片與操作列。
- 預期：能開啟／複製第 1～6 組白板連結。
- 實際：僅有學員講義網址、複製與進入；沒有白板入口。講義新分頁可正常載入至登入畫面。
- 靜態補充：AI-Align adapter 已提供 `getBoardUrl`，但中央後台未呈現對應操作。
- 次要文案問題：AI-Align 卡片仍出現「AI-ARM 演練清空與資料異動請由專屬舊版後台操作」。
- 證據：[DOM](../evidence/portal-admin-be97faf-20260928/align-dom.txt)、[截圖](../evidence/portal-admin-be97faf-20260928/align.png)。
- 複測：從後台逐組開啟 1～6 組，檢查 URL、組別與白板載入。此輪未繞過缺失 UI 自行建立通用班白板資料。

### BUG-PORTAL-RETEST-02：SPLIT 機密憑證仍可未驗證讀取（P0）

- 案例：TC-SPLIT-01；延續先前中央後台憑證存取風險。
- 重現：中央後台建立 `qa-split-retest`，再以未附身分憑證的 Firestore REST 讀取該 QA 班級公開及機密文件。
- 預期：公開資訊不含密碼；機密文件只允許具管理權限的身分存取。
- 實際：公開文件確實不含密碼，但機密文件可未驗證讀取，包含 `studentPasscode`、`adminPasswordHash`、`classId` 等欄位；測試密碼與建立值一致。中央管理介面也未要求管理員驗證即可建立／重設測試班。
- 影響：將密碼分開存放不能形成存取權限隔離。
- 證據：[遮蔽敏感值後的 REST 結果](../evidence/portal-admin-be97faf-20260928/firestore-redacted.json)。未擷取其他班機密文件，未在報告中輸出秘密值。
- 複測：補上可驗證的管理身分與後端規則；以未驗證、學員與管理員角色檢查拒絕／允許。此輪未進行通用滲透測試。

### BUG-PORTAL-RETEST-03：新班網址沿用舊班身分與世代（P1）

- 案例：TC-SPLIT-03；延續先前跨班 session 問題。
- 重現：在已有 SPLIT 登入狀態的同一瀏覽器，從中央後台點擊 `qa-split-retest` 的學員入口。
- 預期：網址指定新班時，顯示新班門禁，或只恢復與 URL 班級一致的有效 session。
- 實際：網址為 `?c=qa-split-retest`，畫面卻是 `qa-split-2026 · Gen 3`、第 2 組與舊姓名，並顯示舊班內容／停用狀態。發現後未對舊班進行寫入。
- 靜態補充：`split/src/App.tsx` 的既有 localStorage 身分恢復路徑未先核對 URL 班級，已有 session 時繞過門禁。
- 證據：[網址與 UI 快照](../evidence/portal-admin-be97faf-20260928/wrong-session.txt)。
- 複測：同瀏覽器 A 班→B 班、重新整理、停用舊班與有效新班組合；不得只用無快取視窗驗證。

### BUG-PORTAL-RETEST-04：世代重設沒有原因欄位（P2）

- 案例：TC-SPLIT-02。
- 重現：對 `qa-split-retest` 執行世代重設，檢查確認 UI 與該班 Firestore 稽核紀錄。
- 預期：除世代變化外，記錄申請單指定的「重設原因」。
- 實際：確認操作無原因輸入；紀錄只有 `type=CLASS_RESET_GENERATION`、`classId`、`fromGeneration=1`、`toGeneration=2`、`timestamp`。動作類型無法說明重設原因。
- 證據：[稽核欄位快照](../evidence/portal-admin-be97faf-20260928/firestore-redacted.json)。
- 複測：填寫原因後重設，確認原因持久化且與世代事件一致。若產品只要求動作類型，需同步修訂驗收合約後再判定。

## 4. 已通過的 SPLIT 協作子流程與保留資料

為避免清除原瀏覽器身分及誤寫舊班，另以同一本機服務的 `http://127.0.0.1:5000/workshop/split/?c=qa-split-retest` 作為乾淨 origin。此替代入口僅用於分離驗證協作功能，**不抵銷 localhost 跨班登入缺陷**。

1. Edge：QA-Portal-Alice、第 1 組；內建瀏覽器：QA-Portal-Bob、第 1 組。兩端均經新班門禁進入 Gen 1。
2. Alice 寫入「QA Portal 20260928 Gen1 原始筆記」；Bob 看見相同文字與 Alice 持鎖，輸入框禁用。
3. Alice 持鎖時重設班級至 Gen 2；兩端無需 F5 即切換，Gen 2 筆記為空，Bob 可取得新的編輯鎖。
4. Bob 寫入「QA Portal 20260928 Gen2 同步驗證」，Alice 看見相同文字與 Bob 持鎖；Bob 釋放後切換第 2 組，觀摩模式不可編輯，再切回本組。
5. UI 顯示綠色「雲端同步」；REST 確認實際筆記文件為 `split_data/qa-split-retest/generations/2/notes/slide-1_team_1`，memo 與測試文字一致。

證據：[Gen1 Alice](../evidence/portal-admin-be97faf-20260928/gen1-alice.txt)、[Gen1 Bob 鎖定](../evidence/portal-admin-be97faf-20260928/gen1-bob-locked.txt)、[Gen2](../evidence/portal-admin-be97faf-20260928/gen2-alice.txt)、[觀摩唯讀](../evidence/portal-admin-be97faf-20260928/split-observe.txt)、[同步完成截圖](../evidence/portal-admin-be97faf-20260928/gen2-saved.png)。

測試班保留為 **active、6 組、Gen 2**，兩世代測試資料保留供 DEV 查驗；未清除其他班資料。舊鎖是由世代命名空間切換而失去對新世代的影響，不宣稱舊文件被刪除或已證明離線舊客戶端寫入會被後端拒絕。

## 5. 其他佐證與限制

- [Portal 連結](../evidence/portal-admin-be97faf-20260928/portal-links.json)、[AI-ARM 中央後台](../evidence/portal-admin-be97faf-20260928/aiarm-admin-dom.txt)、[舊後台](../evidence/portal-admin-be97faf-20260928/old-admin-dom.txt)。
- 快速依序切換 SPLIT→AI-Align→AI-ARM，最後畫面只有 AI-ARM 班級；[快照](../evidence/portal-admin-be97faf-20260928/rapid-switch-final.txt)。這不是所有非同步競態的證明。
- [Console](../evidence/portal-admin-be97faf-20260928/console.json)：觀察到 Tailwind CDN 使用警告及 Edge extension 訊息；此次收集未見中央後台 Firestore 錯誤。不等同全站所有流程零錯誤。
- 未測正式站部署、實機手機、AI-ARM 完整 CRUD／錄音／附件、AI-Align 六組白板實際協作、SPLIT 所有離線競態或後端權限矩陣。
- 此輪報告獨立於先前 SPLIT 白板與語音兩批測試；本次 build 成功不撤銷先前不同工作目錄快照的失敗紀錄。

## 6. 可轉交 DEV 的摘要

> DEV 您好，使用者已調整本期範圍：AI-Align、HOOK、棉花糖挑戰將先標記 inactive，暫不要求其課程管理功能；開發與驗收聚焦 AI-ARM、SPLIT。AI-Align 的 BUG-PORTAL-RETEST-01 改為暫緩、不阻擋驗收，無須在本期補做六組白板入口。原始實測與佐證保留，未改列修復通過。
>
> 更新後為 7 PASS、3 FAIL、3 OUT OF SCOPE。請處理 SPLIT 三项：**P0 BUG-PORTAL-RETEST-02 機密憑證未驗證可讀、P1 BUG-PORTAL-RETEST-03 新班 URL 沿用舊班 session、P2 BUG-PORTAL-RETEST-04 重設原因未記錄**。乾淨 origin 下的報到、Gen 1→2、筆記同步、互斥鎖與跨組唯讀已通過。本次只調整驗收範圍，尚未驗證 inactive 旗標實作；修復後請提供版本與建置資訊供複測。
