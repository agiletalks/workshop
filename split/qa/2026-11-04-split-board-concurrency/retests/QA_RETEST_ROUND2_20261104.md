# SPLIT 白板並行修復 Round 2 線上複測

日期：2026-11-04（Asia/Taipei）

**結論：FAIL / 驗收受阻。新增 BOARD-05 初始化回歸；BOARD-01～04 本輪均 BLOCKED，尚不可標示 VERIFIED FIXED。**

## 測試基準

- DEV 文件：../dev-responses/DEV_RESPONSE_concurrency_fix_20261104.md。
- 本機 HEAD：`9ae6af79bf4a9f24e6ef7c5a5fc12a05b1cf69f9`；操作前 main 工作目錄乾淨。
- 按委託使用原網址：`https://agiletalks-workshop.web.app/workshop/split/board.html?class=qa-split-collab-20261104&room=qa-collab-r1&team=1`。
- Windows 桌面 Chrome 與 Edge，兩個新分頁獨立讀取、點擊新增。沒有使用實體手機。
- 正式站下載 HTML 與本機 split/public/board.html 的 SHA-256 一致：`A385E0FD01A25F1F5E876B0873E4851B0BD7DDF88AB5332C2A4D747396875A9D`。
- 本輪網址 `class` alias 已受原始碼支援。但未指定 `type`，依程式預設為 main；與首輪 `type=qa-collab-r1` 的板型不同。room 不決定 Firestore boardType。由於初始化失敗，本輪不能驗證實際訂閱成功。

## 執行結果

| 案例 | 對應問題 | 結果 | 說明 |
|---|---|---|---|
| 初始化／新增冒煙測試 | BOARD-05（新增） | FAIL / LIVE | Chrome、Edge 同一語法錯誤；點新增沒有開啟視窗，卡片數 0。 |
| TC-CONC-001 同時新增及重整 | BOARD-01 | BLOCKED | 無法新增；未進行第三讀取端數量驗證。 |
| TC-CONC-002 不同卡同時改字 | BOARD-02 | BLOCKED | 無法建立卡片及進入編輯。 |
| TC-CONC-004 拖曳時遠端不回拉 | BOARD-03 | BLOCKED | 畫布未初始化，無可拖曳卡片。 |
| TC-CONC-007 刪除後另一端移動 | BOARD-04 | BLOCKED | 無法建立或刪除測試卡。 |

原始 BOARD-03 初測分級為 P2，其餘 P1；不因委託概稱四項 P1 而改寫歷史。此輪未對四項修復正確性作通過或失敗推定。

## BOARD-05 / P1：重複 const 宣告阻止整段白板腳本執行

步驟：

1. Chrome 開啟上述原始 QA 網址。
2. 頁面保持預設標題／「學員」、卡片數 0；點擊「新增便利貼」沒有 modal。
3. Edge 開啟同址並點新增，得到同樣結果。
4. 兩端 console 均記錄 `SyntaxError: Identifier 'MY_CLIENT_ID' has already been declared`。

Chrome 錯誤時間：2026-11-04T08:19:27.822Z；Edge：2026-11-04T08:19:36.122Z。

預期：白板初始化、建立雲端訂閱且可開啟新增視窗。實際：主 script 在語法解析階段失敗，互動事件無法完成註冊；畫面「全組即時協作中」僅為靜態初始文字，不能視為連線成功。

本機及相同 SHA 的正式 HTML：

- 第 1076 行：`const MY_CLIENT_ID = CLIENT_ID;`
- 第 2470 行：再次 `const MY_CLIENT_ID = 'cli_' + ...`
- 兩者同處第 1034 行開始的主 script，造成重複詞法宣告。

另以 Node vm.Script 對下載 HTML 的各個 inline script 只做編譯、不執行，主 script 同樣得到相同 SyntaxError。見 `../evidence/round2/inline-syntax-results.json` 與 `check-inline-syntax.cjs`。

DEV 的 scripts/test-board-concurrency.cjs 僅擷取同步函式區段並注入 MY_CLIENT_ID；這種測試不能覆蓋完整 HTML script 的重複宣告問題。建議補上完整 inline script 語法檢查及部署後兩瀏覽器新增冒煙驗證，再重新執行四項並行測試。此建議不是已完成的修復。

## 佐證與後續

- `../evidence/round2/chrome-console.json`、`edge-console.json`：雙端錯誤。
- `chrome-dom.txt`、`edge-dom.txt`：點擊後仍無新增 modal。
- `chrome-blocked.jpg`、`edge-blocked.jpg`：畫面。
- `deployed-board.html`：本輪正式站下載基準；供語法檢查重跑。
- 本輪未新增或刪除雲端卡片、未改產品碼、未部署、未執行 Gen+1。
- 請 DEV 修正重複宣告並提供新部署基準；BOARD-05 解決後，仍需重新執行全部四項，不能以本輪 BLOCKED 結案。
