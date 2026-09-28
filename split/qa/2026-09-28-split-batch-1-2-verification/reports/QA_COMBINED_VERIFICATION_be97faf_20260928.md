# SPLIT 兩批開發成果合併驗收報告｜DEV 交付版

- 日期：2026-09-28（Asia/Taipei）。
- 範圍：第一批「模組 2 雲端白板」＋第二批「模組 6 語音筆記」。不含前一輪中央後台 11 案例。
- **總結：本輪不通過，請先修復六項缺陷再進行複測。**
- 測試基準 HEAD：be97fafd8a5564b8ee13b4ce6a7077d4358a7001；實際測的是未提交工作目錄。不能把報告視為該 commit 的完整發行認證。
- 測試班級僅 qa-split-test-01，未以正式班級做這兩批的写入驗收；未修改產品、未部署、未推送、未重啟 listening。
- 本文件整合兩批完整結果，工程師可直接依下列 Issue ID 修復；所有佐證已複製到本主題 evidence/board/ 與 evidence/voice/。

## 一、交付摘要

| 批次 | PASS | FAIL | PARTIAL | BLOCKED | 結論 |
|---|---:|---:|---:|---:|---|
| 模組 2 白板：5 個委託場景 | 0 | 3 | 1 | 1 | 主腳本無法解析；URL 子項正常不代表白板可用 |
| 模組 6 語音：7 個驗收項目 | 1 | 3 | 2 | 1 | 停止重複追加、連續句覆寫、換頁與唯讀回呼問題 |
| **合計：12 個項目** | **1** | **6** | **3** | **2** | **尚未達驗收通過條件** |

補充：語音隔離腳本 9 項為 5 PASS / 4 FAIL；白板既有字串檢查腳本為 5/5 PASS。這些是不同層級的測試，不再加進上表，也不能替代瀏覽器及真實收音驗收。

## 二、DEV 缺陷清單與修復順序

| Issue ID | 優先級 | 問題 | 證據層級 |
|---|---|---|---|
| BUG-SPLIT-BOARD-01 | P0 | 主腳本 Unexpected end of input，新增/切組函式未定義，整個白板不可用 | IAB/Edge、5173/5000 實測＋Node 語法解析 |
| BUG-SPLIT-BOARD-02 | P1 | 文件 ID wbs_team-1 與規範 wbs_team_1 不符 | 靜態精確表達式核對；實際寫入受 P0 阻斷 |
| BUG-SPLIT-BOARD-03 | P1 | roomDocRef 固定從 Gen1 建立，班級世代更新未重綁主訂閱 | 程式碼審查；Gen2 實際寫入尚待補測 |
| BUG-VOICE-01 | P1 | 手動按完成時，把已定稿句再次追加 | 實際 service/hook 隔離行為重現 |
| BUG-VOICE-02 | P1 | onFinal 捕捉舊 memo，第二句覆寫第一句 | 實際 panel 追加函式/hook 隔離重現 |
| BUG-VOICE-03 | P1 | 換頁/觀摩時录音仍持續，舊回呼與停止全文可能寫錯上下文 | 瀏覽器狀態＋隔離行為重現；未宣稱雲端越權已實測 |

建議先修白板 P0 與語音資料正確性，再驗證世代、權限與雙端同步。模組 5 的並行開發已讓本機 TypeScript/Vite 出現錯誤，請交付固定 commit 與建置產物，避免測試期間持續變動。

## 三、尚未通過的必要驗收

- 白板：組內新增/編輯/移動/連線、A/B 即時同步、觀摩禁止修改但可平移縮放、切回本組、真實 Firestore 精確路徑、Gen2 冷啟動及重設後切換。
- 語音：真人已知測試句、實體麥克風授權、靜音十秒後續講、手動停止後每句僅出現一次、第二位同組學員同步看到、換頁與失去鎖時不串頁/不越權。
- PARTIAL/BLOCKED 表示仍未完整驗證，不是 PASS，也不是認定不存在 Bug。
- 「免金鑰」「綠色同步狀態」「編譯成功」不能單獨證明隱私、安全或端到端功能正確。

## 四、版本與證據使用方式

白板來源、dist、5000、5173 的內容 hash 一致，完整紀錄在 evidence/board/syntax-and-version.json。語音三個檔案 hash 與隔離測試結果在 evidence/voice/voice-behavior-results.json。

下列兩章保留完整測試步驟與限制；文內原先 ../evidence/ 的連結已分別調整為本主題的 board/voice 子目錄。既有 DEV 的「5/5 PASS」文件未覆寫，本次以獨立實測結果提出修正要求。

---
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

佐證：`../evidence/board/edge-console.json`、`../evidence/board/iab-console.json`、`../evidence/board/dev-console.json`、`../evidence/board/syntax-and-version.json`、`../evidence/board/board-team2-dom.txt`、`../evidence/board/dev-board.png`。

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


---

# SPLIT 模組 6 語音筆記：獨立 QA 報告

- 日期：2026-09-28，約 12:46–12:51（Asia/Taipei）。
- 結論：**不通過；已重現文字重複、連續句覆寫、換頁/唯讀時沿用舊回呼等問題。**
- Git 基準：be97fafd8a5564b8ee13b4ce6a7077d4358a7001；實際測試未提交工作目錄，不能將結果等同該 commit 成品。
- 瀏覽器：Windows / Codex in-app Chromium；`http://localhost:5173/?c=qa-split-test-01`，第 1 組、QA-Board-Alice；P03/P04。
- 隔離測試：Node 執行實際 TypeScript service、hook，以及從 WorkbookPanel 擷取的實際追加函式。SpeechRecognition 及 Hook lifecycle 使用最小替身；不是實體麥克風、完整 React DOM 或雲端整合測試。
- 語音 service SHA256：`51b29de8ba3e140609d17677e8d87130971d7f5af1547fc6f5bbfb92149665f2`。
- hook SHA256：`2d9c5e861cfb72983d8d24dc080b12e17dafdc62ad95cf002efd7206876b685e`。
- WorkbookPanel SHA256：`8816523cfa82cc1c895c0107502cf759e9e64b567d833de9d668e4b48b521945`。
- 僅使用 QA 班；未修改產品程式、未部署、未推送、未恢復 listening。

## 驗收總表

主驗收項目：**1 PASS、3 FAIL、2 PARTIAL、1 BLOCKED**。獨立回歸腳本：**5 PASS、4 FAIL**（兩種統計範圍不同，勿相加）。

| 項目 | 判定 | 依據與限制 |
|---|---|---|
| QA-V01 按鈕及初始唯讀 | PASS | P03 出現語音筆記按鈕，本組可按；切第 2 組觀摩後語音鈕與文字框 disabled。 |
| QA-V02 啟動/手動完成 | PARTIAL | 瀏覽器按下後顯示「正在聆聽...」、粉紅串流區與「完成」；按完成後回復語音筆記鈕。未觀察到麥克風授權彈窗，無有效逐字稿，不能證實已成功取得實體音源。 |
| QA-V03 已定稿句停止後只追加一次 | FAIL | 實際 hook/service 隔離測試：定稿一次再停止，同句觸發兩次 append。BUG-VOICE-01。 |
| QA-V04 連續兩句不遺失 | FAIL | 擷取的 panel 追加函式與 hook 測試：第二次 final 使用開始錄音時的舊 memo，覆寫第一句。BUG-VOICE-02。 |
| QA-V05 換頁及權限生命週期 | FAIL | 瀏覽器錄音狀態從 P03 延續到 P04，再轉第 2 組觀摩仍顯示聆聽；隔離測試確認舊 callback 仍被呼叫、stop 將舊頁全文交給新頁 callback。BUG-VOICE-03。 |
| QA-V06 靜音後自動重啟/卸載 | PARTIAL | 假事件與假計時器驗證 onend、no-speech/audio-capture/network 重啟，stop 取消、unmount 呼叫停止，5 個相關基礎案例通過；沒有實際 10 秒以上靜音、恢復講話後成功辨識的完整證據。 |
| QA-V07 真實朗讀→雲端→另一位學員 | BLOCKED / 待補 | 本輪沒有已知真人測試句及成功 final transcript；未驗辨識準確度、實體音源、A/B 語音文字同步。不以模擬辨識事件代替真實收音驗收。 |

5000 打包站的語音 UI 尚未另跑完整流程。本輪沒有執行語音文字的 Firestore 越權寫入測試。

## BUG-VOICE-01 — P1：按停止會重複追加已定稿文字

**證據層級：實際 service + hook 的隔離行為重現；尚非真人收音重現。**

1. startRecording。
2. SpeechRecognition 發出一筆 final：「敏捷需求分解」。
3. Hook onFinal 已呼叫 onAppendText。
4. UI 重新渲染後呼叫 stopRecording。

預期 append 呼叫：`["敏捷需求分解"]`。
實際 append 呼叫：`["敏捷需求分解", "敏捷需求分解"]`。

根因：useVoiceNote.handleStart 的 onFinal 即時追加；VoiceNoteRecorder.stop 又回傳累積 _finalText；handleStop 再把全文追加一次。不是要使用者說「念完了」才能停止；**正常手動按完成也會走到這個路徑**。

建議：明確區分已提交 final 與未提交 interim；每個辨識 chunk 只能提交一次，並處理 stop 後延遲到達的 final 事件。複測需包含至少兩個 final、interim→停止、停止後 final、立即重新錄音。

## BUG-VOICE-02 — P1：長時間錄音沿用舊 memo，第二句覆寫第一句

**證據層級：實際 panel 函式與 hook 的隔離重現。**

- 初始 memo：「原筆記」。
- 第一次 final：「第一句」→ 更新為 `原筆記\n第一句`。
- 模擬筆記同步並重新渲染，第二次 final：「第二句」。
- 實際更新為 `原筆記\n第二句`；第一句消失。

useVoiceNote.handleStart 建立的 onFinal 閉包固定捕捉該次 onAppendText；後续 render 雖產生新的 handleAppendVoiceText，辨識器中的回呼未更新。WorkbookPanel 使用 closure 中的 teamNote.memo / response.personalNote 計算完整新字串，所以會以舊基底覆寫。

建議以最新內容的函數式追加或明確同步的 ref 實作，避免每次結果使用錄音開始時的 memo；也應保留录音途中使用者打字與同組遠端更新。

## BUG-VOICE-03 — P1：換頁及轉為唯讀後，錄音工作階段未綁定原上下文

**瀏覽器已觀察到錄音狀態延續；文字錯頁/權限回呼以隔離測試重現，未宣稱實際雲端越權寫入。**

瀏覽器步驟：P03 開始語音 → 點 P04 →「正在聆聽...」與完成按鈕仍在 → 切第 2 組觀摩 → 上方聆聽鈕 disabled，但串流狀態與完成按鈕仍在。最後已按完成停止。

隔離結果：在 page3 收到「第三頁講述」，render 換為 page4 callback 後按 stop，產生：

```json
[{"page":3,"text":"第三頁講述"},{"page":4,"text":"第三頁講述"}]
```

換成 readonly callback 後，辨識器仍呼叫開始錄音時的 editable callback。舊 callback 也可能攜帶舊班級、組別、世代與可編輯狀態。App 的 handleUpdateMemo 使用閉包內身分/班級狀態，不能僅依目前按鈕 disabled 判定安全。

另，語音啟動直接呼叫 toggleRecording，未先 await onAcquireLock；筆記 textarea 的 onFocus 才有取得鎖的流程。此為源碼風險，尚未做兩位使用者同時語音寫入的實測。

建議：每段錄音明確鎖定 class/generation/team/slide；換上下文、停用、觀摩或失去鎖時先結束/取消，再切換。追加時重新檢查當前授權与鎖；先取得鎖才允許開始，處理競爭失敗。若產品決定允許背景錄音，必須明確保證內容只寫回原頁，不能把 stop 全文寫到新頁。

## 建置與並行開發限制

本輪實際執行：

`node split/node_modules/typescript/bin/tsc --noEmit --incremental false -p split/tsconfig.app.json`

Exit Code **2**。當時工作目錄已出現提問模組新增碼，錯誤包含 QuestionsDrawer.tsx 匯入不存在的 UserSession、找不到 ../types，以及 App.tsx 未使用的提問變數。Vite Console 同時有 App.tsx HMR reload failure。

這些是**驗收時工作目錄不穩定的建置阻礙**，不直接歸因於語音三個檔案。DEV 先前 build PASS 與目前狀態不同；本輪沒有重新 build-all 或把正在變動的版本視為固定發行包。語音行為測試所用三個檔案 hash 已記錄，可獨立重現。

## 其他待驗宣告

- 不支援瀏覽器的禁用提示、拒絕麥克風授權、持續失敗的重試上限、背景分頁與長課程資源釋放，尚未完整驗證。
- hook 回傳 errorMessage，但 WorkbookPanel 沒有呈現該錯誤，可能只見按鈕停止而不知道原因；列為程式碼審查待驗。
- 「免應用程式 API key」不等於已完成隱私稽核。本輪未稽核辨識供應商、流量、資料留存，因此不能認可「零成本、無外洩風險」等絕對宣告。

## 證據與複測

- `../evidence/voice/voice-behavior-results.json`：9 項行為測試，5 PASS / 4 FAIL。
- `../scripts/test-voice-independent.cjs`：獨立可重跑腳本，不操作瀏覽器、不錄音、不寫 Firestore。執行時可傳輸出 JSON 路徑；預設 repository root 為 C:/Antigravity/workshop，可用 WORKSHOP_ROOT 調整。
- `../evidence/voice/recording-after-page-change.txt`、`recording-after-readonly.txt`：真實瀏覽器狀態。
- `../evidence/voice/observer-dom.txt`、`recording-dom.txt`、`stopped-dom.txt`、`recording.png`：按鈕、串流區、手動停止證據。
- `../evidence/voice/typecheck.log`、`browser-console.json`：建置與 HMR 限制。

建議先修正三項資料與生命週期缺陷，再用真人朗讀至少两句、靜音 10 秒、續講、手動按完成，確認每句僅出現一次；再開第二位同組學員核對雲端結果。模組 5 如持續開發，請交付可固定的 commit 或隔離工作目錄，避免驗收與 HMR 同時變動。

