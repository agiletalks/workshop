# SPLIT 同組白板共編驗收

日期：2026-11-04；結論：**FAIL，P1 共編資料完整性問題，尚不可驗收通過。**

## 基準與範圍

- 規則：同組成員可共同編輯同一板，不同便利貼的修改不可互相覆蓋。單卡協調不得阻止其他卡編輯。
- 線上：正式 Hosting 的 `/workshop/split/board.html`，使用獨立 QA 班級 `qa-split-collab-20261104`、第 1 組、板型 `qa-collab-r1`。未操作正式班級 `202611-split` 的白板。
- 資料位置（由原始碼確認）：`split_data/qa-split-collab-20261104/generations/1/boards/qa-collab-r1_team-1`。
- Windows 桌面 Chrome A（顯示名稱 QA-Retest-PC）與 Edge B（QA-20261104-MobileSim）；名稱沿用 session，不代表手機真機。本輪沒有實體手機或六位真人。
- 第三讀取頁 C 與 A 同 Chrome session，但使用新 `room` 參數隔離白板本機快取。Firestore 路徑不含 room，仍讀同一板；C 不是第三個獨立登入身分。
- Git 基準 `7ede75ed0ef25d98f93b4094e8ffd1573f2cd4ae`。下載正式站 board.html 與本機 split/public/board.html 的 SHA-256 完全相同：`D66A8F7EE22A88AFA37D5F3402A919033D0857545056FF8184E2F425E8647E7C`。
- LIVE = 瀏覽器操作正式站隔離 QA 板；LOCAL = 執行抽出的產品函式與模擬 Firestore set 語意，不代表完整雲端端到端測試。

## 案例與執行結果

完整操作步驟與預期見 TEST_CASES.md。7 項 LIVE（4 PASS、3 FAIL）、2 項 LOCAL 重現失敗、3 項 NOT RUN。基本通過僅代表本輪操作，未建立可靠度或負載保證。

| ID | 情境 | 結果／層級 | 實際觀察與證據 |
|---|---|---|---|
| WB-01 | 依序新增、跨端同步 | PASS / LIVE | A/B 基準卡兩端可見；live-baseline.json。 |
| WB-02 | 同時新增 | FAIL / LIVE | 原有 4 張，D/E 同時新增後，A/C 5 張、B 6 張；B reload 後 E 消失。concurrent-create.json、concurrent-create-after-reload-B.json 及三端 jpg。 |
| WB-03 | 不同卡同時修改 | FAIL / LIVE + LOCAL | A/B 各改自己的卡並並行點保存；A 看見 A/B 新文字，B 仍見 A 舊文字；reload 後仍不一致。concurrent-before-reload.json、concurrent-after-reload.json、A/B jpg；本機另重現整陣列覆蓋。 |
| WB-04 | 同卡編輯保護 | PASS / LIVE（基本） | A 開啟 D 卡，B 顯示 A 編輯中／鎖定，編輯按鈕數 0；B 雙擊 D 卡沒有開啟 modal。lock-observation.txt、lock-attempt.txt、same-card-lock.jpg。未驗證同時搶鎖與鎖失效恢復。 |
| WB-05 | 本人草稿與他人背景新增 | PASS / LIVE（基本） | A 未保存的「QA-20261104 A 未儲存草稿保護」保持完整；B 可新增 C，A 收到 C。draft-protection.json；未量測游標選取範圍。 |
| WB-06 | 拖曳與待處理遠端快照 | FAIL / LOCAL | 抽出 mergeRemoteNotes/doFirestoreWrite 模擬放開後合併等 timestamp 舊快照；x=500 回到 0。未完成雙瀏覽器拖曳競態端到端測試。 |
| WB-07 | 同卡文字與座標同時修改 | NOT RUN | 尚未單獨執行此競態，不由 WB-06 推定結果。 |
| WB-08 | 刪除與舊狀態保存 | FAIL / LOCAL | 新卡收到遠端空陣列後仍保留；再次保存使它回到模擬伺服器。results.json。未執行雲端刪除競態。 |
| WB-09 | 離線重連 | NOT RUN | 本輪未控制真實斷線與重連。 |
| WB-10 | 重整持久化與一致性 | FAIL / LIVE | WB-03 重整後不同端文字不一致；WB-02 Edge 重整後剛新增 E 消失。 |
| WB-11 | 跨組觀摩隔離 | PASS / LIVE（UI） | 切第 2 組顯示唯讀，只見該組 welcome；按新增未開 modal；切回第 1 組恢復原卡片。cross-team-readonly.txt、cross-team-return.txt。非後端權限安全測試。 |
| WB-12 | 六人十分鐘壓力 | NOT RUN | 僅有兩個獨立瀏覽器身分；基本 P1 已失敗，需修復後另做負載驗收。 |

## DEV 缺陷單

### BOARD-01 / P1：同時新增造成卡片遺失（LIVE）

1. 同組兩瀏覽器先同步到相同 4 張卡。
2. 兩端開新增視窗，分別填 `QA-20261104 D 同時新增`、`QA-20261104 E 同時新增`。
3. 並行點擊儲存（工具並行送出，不保證毫秒級同時）。
4. 待畫面顯示全組即時協作中，A 只有 5 張；B 6 張。新 room 快取的讀取頁 C 也只有 5 張。
5. B reload 後剩 5 張，E 不在板上。

預期：6 張且三端一致。實際：E（`note-tfnlxm8ct-mw1pk3oj`）遺失；D（`note-3m98xl45c-mw1pk3up`）留下。證據時間 2026-11-04T06:01:06.111Z，見 concurrent-create.json。

### BOARD-02 / P1：不同卡文字並行保存後兩端不一致（LIVE）

卡 A `note-gynnkf6ry-mw1pdr7d`、卡 B `note-tn3m2y2bm-mw1pdxw4` 原文字分別為 A/B 基準卡。兩端各開不同卡，改成 A/B 並行更新 R1，再並行保存。Chrome 保留兩筆更新，Edge 的 A 卡仍是基準文字。兩端 reload、顯示同步中以外的正常協作狀態後仍不一致。後續再操作 A 編輯鎖／新增後，內容曾收斂；這不代表先前保存具一致性保證。此案例未直接讀 Firestore API，不能僅據兩端 DOM 斷言 A 的文字已永久從伺服器遺失。

### BOARD-03 / P2：拖曳放開後座標回跳（LOCAL）

指定時序：拖曳把 x 改為 500、保存，再合併同 timestamp 的舊遠端 x=0，結果 x=0。需 DEV 修復後補真實拖曳與背景保存雙端重測。

### BOARD-04 / P1：已刪新卡可能被舊端重新寫回（LOCAL）

指定時序：本機有建立未滿 15 秒的新卡，遠端已刪除，mergeRemoteNotes([]) 仍保留它，下一次 doFirestoreWrite 重新送出該卡。這是模擬指定順序的可靠重現，非本輪雲端刪除證據。

## 原始碼分析（修復方向，非已完成修復）

split/public/board.html 中 doFirestoreWrite（約 1883 行）以 set(data, {merge:true}) 寫入完整 notes/lines 陣列；merge 不會逐個卡片合併陣列元素。不同使用者的舊整板內容可能覆蓋另一人的更新。

mergeRemoteNotes（約 1680 行）以整卡 updatedAt 選取版本、相同時間遠端優先；拖曳流程（約 5150/5192 行）未更新單卡 timestamp，且放開時先保存、再套待處理快照。新卡缺少刪除版本資訊，15 秒保留邏輯無法區分尚未送達與已刪除。renderNotes（約 4873 行）整批重建 DOM，需另檢查拖曳／焦點在遠端更新時的穩定性。

請優先改為按卡／欄位提交變更，對刪除和版本衝突明確建模；不可用整板只准一人編輯來規避問題。單卡衝突可以鎖定或明確協調，但不同卡須可同時操作。上述技術方向仍需 DEV 評估及實作驗證。

## 交付與限制

- 本輪不修改產品程式碼、不部署、不執行 Gen+1。QA 板上的測試卡保留供 DEV 重現；所有本輪編輯視窗已取消並釋放鎖。
- same-card-lock-dom.txt 是早期重疊卡誤點到 C 的無效嘗試，不能作為鎖繞過或鎖通過證據；有效證據以 lock-observation/lock-attempt 為準。
- 本機腳本 reproduce.cjs 的 assertion 通過代表「缺陷重現成功」，不是產品 PASS。results.json 保留三個重現輸出。
- 修復後至少重測 WB-02/03/06/08/10，再補 WB-07/09/12；實體手機另列驗收，不可宣稱本輪全數通過。
