# SPLIT 模組 2 雲端白板：獨立瀏覽器驗收

- 日期：2026-09-28，約 12:38–12:44（Asia/Taipei）。
- 結論：**不通過；核心白板受 JavaScript 語法錯誤阻斷，不可宣告跨組唯讀或雲端協作已驗收。**
- 五個委託場景：**3 FAIL、1 PARTIAL、1 BLOCKED、0 PASS**。拆分後的「教材四個按鈕 URL」子項通過，不等於白板端到端通過。
- Git HEAD：`be97fafd8a5564b8ee13b4ce6a7077d4358a7001`。**本輪測的是未提交工作目錄**：`split/public/board.html` 為 untracked，`WorkbookPanel.tsx` 已修改；檔名中的 commit 僅為基準 HEAD。
- 來源、dist、localhost:5000 回應及 localhost:5173 回應的白板內容完全一致。SHA-256：`e9a22396067338e3c7636c3fcffada5426b82a59e00365c5278e80482d0b2b1c`。
- 瀏覽器：Windows 上 Codex in-app Chromium 與 Microsoft Edge；兩者均重現產品語法錯誤。未固定瀏覽器版本，未做其他瀏覽器相容認證。
- 專用班級：`qa-split-test-01`，本輪透過中央後台建立，6 組、啟用、Gen 1；教材以 `QA-Board-Alice`、第 1 組登入。未使用正式班級做本輪寫入測試。
- 無產品程式修改、無 git push/pull、無部署。班級保留供 DEV 複現；白板因初始化失敗，未完成卡片寫入，不宣稱雲端零副作用已全面稽核。

## 場景結果

| 場景 | 結果 | 實際結果與限制 |
|---|---|---|
| 1 組內可編輯協作 | **FAIL** | 5000、5173 都載入後即 SyntaxError。標題停在「第 1 組專屬【需求分解】線上白板」，沒有 WBS 名稱。新增無反應，`openNoteModal is not defined`。卡片數 0，無法續測拖曳、文字編輯、錨點連線及雙端協作。 |
| 2 跨組唯讀觀摩 | **FAIL** | 選單可選第 2 組，但觸發 `switchTeamBoard is not defined`；網址、標題仍為第 1 組，未出現唯讀標籤及切回按鈕，新增工具仍在。不能把「所有按鈕都壞了」判定為唯讀防護成功。卡片拖曳禁用、雙擊禁用、Space 平移與滾輪缩放受阻，未驗收。 |
| 3 切回本組 | **BLOCKED** | 場景 2 無法進入有效觀摩狀態，切回按鈕未顯示；不能完成該流程。 |
| 4 教材連動 | **PARTIAL** | 在 5173 教材 P07/P08/P09/P22 實際點擊，均開新分頁，帶 `c=qa-split-test-01&team=team-1`，type 依序為 `wbs`、`impact-map`、`story-map`、`decision-table`。URL 子項 PASS；白板標題與可操作性被語法錯誤阻斷。5000 教材按鈕未另跑一遍。 |
| 5 Firestore 路徑合約 | **FAIL（靜態合約）；動態寫入 BLOCKED** | 原始碼有 `split_classes` 及 `split_data/.../generations/.../boards`，且未含 `aigile_boards` 字串，但實際 ID 表達式產出 `wbs_team-1`，與指定 `wbs_team_1` 不同。沒有成功寫入佐證，不宣稱已證明所有 Network 寫入隔離。 |

## BUG-SPLIT-BOARD-01 — P0：主腳本無法解析，整個白板不可用

**實測缺陷。**

1. 開啟 `http://localhost:5000/workshop/split/board.html?c=qa-split-test-01&team=team-1&type=wbs`。
2. Console 立即出現 `SyntaxError: Unexpected end of input`。
3. 按「新增便利貼」（亦用 Enter 驗證），Console 出現 `ReferenceError: openNoteModal is not defined`，未開編輯視窗。
4. 選「第 2 組白板」，Console 出現 `ReferenceError: switchTeamBoard is not defined`（HTML onchange 第 304 行）。
5. 5173 開發頁與 Edge 重現。班級建立成功後再次 reload，錯誤仍在，排除班級不存在造成的假象。

預期：主腳本完成初始化，顯示 WBS 標題並可操作。實際：整段主腳本未執行，靜態「全組即時協作中」仍可能顯示，不能視為連線成功。

程式定位：主 inline script 開始於 `split/public/board.html:1034`，Node `vm.Script` 在檔案末尾（約 6511）回報同樣的 Unexpected end of input。`dismissBoardInactiveOverlay`（2070–2100）區塊結構疑似缺結尾括號；此外 `readOnlyBadge`、`isClassInactive` 在該區段使用卻沒有找到宣告。**後兩項是靜態觀察，修復語法後仍須實測，不能假定只補括號即可結案。**

佐證：`../evidence/edge-console.json`、`../evidence/iab-console.json`、`../evidence/dev-console.json`、`../evidence/syntax-and-version.json`、`../evidence/board-team2-dom.txt`、`../evidence/dev-board.png`。

## BUG-SPLIT-BOARD-02 — P1：白板文件 ID 與規範不一致

**靜態可確定的合約缺陷；雲端實際寫入尚受 BUG-01 阻斷。**

- 規範：`split_data/qa-split-test-01/generations/1/boards/wbs_team_1`。
- `getTeamInfo` 正規化組別為 `team-1`；1767–1773 行 `getSplitBoardRef` 使用 `${TEAM_INFO.boardType}_${TEAM_INFO.teamId}`。
- 因此組成 `.../boards/wbs_team-1`，不是 `.../boards/wbs_team_1`。
- 1969 行跨組卡片數查詢也使用同樣的連字號 ID。
- DEV 應統一路徑編碼，並用實際 Firestore/模擬器寫入斷言精確完整路徑，不能只檢查集合名稱字串存在。

## BUG-SPLIT-BOARD-03 — P1：白板訂閱/寫入參考未跟隨班級世代

**程式碼審查發現，尚未做 Gen 2 雲端重設實驗。**

- 1766 行區域變數 `currentGen = 1`，1775 行立即建立 `roomDocRef = getSplitBoardRef(currentGen)`，並訂閱該 ref。
- 班級監聽在 2003 行只更新另一個全域變數 `currentGeneration`；未看到重新建立 roomDocRef、取消舊訂閱、訂閱新世代的流程。
- 風險：班級世代已遞增，主白板仍對 Gen 1 讀寫；卡片數查詢卻可能改查 currentGeneration，畫面與資料路徑不一致。
- 修復後至少驗證：Gen 2 冷啟動、開啟期間 1→2 切換、斷線重連；舊資料保留而新世代空白，所有讀寫路徑一致。

## 安全性待補驗（不列為已通過）

`getTeamInfo` 會讀取 `split_user_session`，但未比對 session.classId 與 URL 班級；且仍包含名稱含「講師/老師/Percy」或 `ai_arm_admin_auth` 即取得講師豁免的邏輯。直接入口未報到時 `userAssignedTeam` 可能為空。修復主腳本後，應補驗無 session、不同班 session、名稱/URL 偽裝與後端拒寫。這些沒有在本輪以越權寫入方式實測，不宣稱已發生資料篡改，也不宣稱前端隱藏按鈕等於後端授權。

## 為何現有 5/5 PASS 不能作為本輪結案依據

已閱讀並執行現有 `scripts/test-board-contract.cjs`，仍回報 5/5 PASS。它使用 `content.includes(...)` 檢查標籤、集合名稱與函式字串，沒有解析主 JavaScript、操作瀏覽器、驗證精確 doc ID 或實際權限。

因此既有 `QA_VERIFICATION_board_20260928.md` 的「100% 通過／可進入下一階段」**未被本輪獨立實測支持**。保留原文件以免覆寫他人工作，本報告供 DEV 以實測證據修正結論。

Console 內另有 Tailwind CDN 警告、IAB Electron 與 Edge 擴充套件訊息；不將這些環境訊息當作產品缺陷。上列 SyntaxError 與 onchange ReferenceError 均來自 SPLIT 白板頁。

## DEV 複測交接

1. 先修主腳本，對每個 inline script 做語法檢查，並提供修復 commit、建置與服務檔 hash。
2. 修正文件 ID 與世代切換，再執行五個原始場景。
3. 至少準備兩位第 1 組學員與一位第 2 組學員；驗證同組新增/編輯/移動/連線即時同步，以及觀摩者只能平移縮放。
4. 後端授權需另外實測；讀到班级設定或畫面顯示綠灯不等於安全與同步通過。

本報告沒有修改产品、沒有部署，亦未恢復任何 listening 自動監聽。
