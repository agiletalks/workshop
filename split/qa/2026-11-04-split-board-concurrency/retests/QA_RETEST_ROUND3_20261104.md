# SPLIT 白板 Round 3 線上複測

日期：2026-11-04；結論：**本輪五項指定情境 PASS，BOARD-01～05 在本輪覆蓋範圍 VERIFIED FIXED。**

## 基準與環境

- 依 DEV_RESPONSE_round2_fix_20261104.md，修復 Commit 為 092dbb7。
- 測試時本機 HEAD 為 43c2b5fce1ee2a4c56bd1d873fb24356d1550ef1，後續 commit 僅調整冒煙腳本；git diff 092dbb7 HEAD -- split/public/board.html 為空。
- 正式下載 board.html 與本機 SHA-256 一致：BEC2F4D19334DBD12D82DE4680CA2BAE0CD30DB55F64171AC6D40ABD68CD53FD。
- 正式網址：https://agiletalks-workshop.web.app/workshop/split/board.html?class=qa-split-collab-20261104&type=qa-collab-r1&team=1
- Windows 桌面 Chrome A（QA-Retest-PC）、Edge B（QA-20261104-MobileSim）。兩者為獨立瀏覽器 session，名稱不代表手機真機。
- C 為 Chrome 第三讀取頁，加 room=qa-r3-reader 以隔離白板本機快取，讀取相同班級／板型／組別；沒有在 C 編輯內容。C 與 A 共用登入身分，並非第三位獨立使用者或後端強制唯讀角色。
- 測試時間約 16:33～16:37（Asia/Taipei）。起始基準 5 張：welcome 加首輪 A/B/C/D 卡；本輪未修改這些舊卡。

## 結果

| 案例 | 結果 | 執行與證據 |
|---|---|---|
| BOARD-05 冒煙 | PASS / LIVE | A/B 點新增均開啟 modal，採集 error log 為空；smoke.json。最終三端 errors.json 亦無錯誤。 |
| TC-CONC-001 / BOARD-01 | PASS / LIVE | A/B 分別輸入 QA-R3 A 同時新增、QA-R3 B 同時新增，並行送出保存。三端皆從 5 張成為 7 張，兩個 ID 完整；A/B reload 後仍 7 張。created.json、created-after-reload.json。 |
| TC-CONC-002 / BOARD-02 | PASS / LIVE | A/B 同時開啟不同卡，確認 modal 分別對應 A/B；改為 QA-R3 A 並行改字成功、QA-R3 B 並行改字成功，並行保存。三端兩筆新文字皆保留；A/B reload 後亦保留。edited.json、edited-after-reload.json。 |
| TC-CONC-004 / BOARD-03 | PASS / LIVE（本次時序） | Chrome 拖曳本輪 B 卡，同時 Edge 保存本輪 A 卡文字。B 卡從 (4030,4030) 移至 (3600,3905)，三端收斂一致，reload 後保持；A 卡背景更新也保留。drag-settled.json、drag-after-reload.json。 |
| TC-CONC-007 / BOARD-04 | PASS / LIVE（本次時序） | Chrome 開啟本輪 A 卡、點刪除並按確認執行；Edge 再移動 B 卡。三端 reload 後均 6 張，A ID 不存在，B 最終 (3620,3865)，其他舊卡保留。delete-move-immediate.json、final-after-reload.json。 |

## 操作細節與限制

- A 卡 DOM ID：note-note-7vmtn06lq-mw1v0hzw；B 卡：note-note-0sp71n82z-mw1v0i46。
- 同時新增／改字透過兩端 UI 操作 Promise.all 並行送出，不宣稱毫秒級同時或每種網路競態皆被覆蓋。
- 拖曳使用實際指標操作，與另一端保存並行發出。放開後、同步完成後及 reload 後座標皆核對；未錄製逐幀影片或量測每一瞬間位移，因此結果不等同證明所有快照交錯皆無暫態跳動。
- 刪除第一次按鈕先開啟自訂確認框；確認前曾移動 B 一次，僅作準備操作。正式有效步驟從「確認執行」完成後開始，再移動 B，最終核對刪除持久化。沒有將確認前操作算成刪除通過。
- 本輪各指定情境執行一輪，未執行六人十分鐘壓力、離線重連、同卡同時搶鎖、真機手機測試；不宣稱完整產品驗收或 100% 無競態。
- BOARD-03 首輪列 P2，本輪不改寫歷史分級。

## 證據與收尾

佐證位於 ../evidence/round3/：各階段三端 DOM 摘要 JSON、最終 chrome/edge/reader 截圖、Console error logs、正式部署 HTML。

測試後僅保留本輪 B 卡供 DEV 查驗；本輪 A 卡因刪除測項已刪除。既有五張卡保留，總數 6。無未儲存 modal，未執行 Gen+1、未修改產品碼、未部署。本輪結果可關閉五項缺陷在指定驗收情境的複測，其他未執行項目仍依原測試案例待驗。
