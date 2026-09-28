# 中央後台暨 SPLIT 第一階段驗收紀錄

- 2026-09-28；本機 localhost:5000；Git HEAD be97fafd8a5564b8ee13b4ce6a7077d4358a7001，含未提交的中央後台、adapter 與 SPLIT 修改，非純 commit 成品。
- 這是前一輪已取得證據的階段報告。使用者於測試中交辦模組 2 白板新任務；未完整覆蓋項目明列 PARTIAL，不當作已全部結案。
- 結果：**3 PASS、2 FAIL、6 PARTIAL**。重大權限問題未解決，不建議發布。
- 已執行 build-all，Exit 0；SPLIT bundle 為 index-BiBJTL7i.js。verify-suite.js 為 10/10，但使用 mock Firestore；後四項安全斷言並非部署規則/模擬器測試。
- IAB 為 Tester-Alice，Edge 為 Tester-Bob；隔離班 qa-split-2026、第 2 組。僅修改本輪 QA 班及 AI-ARM 既有測試班 2026-test 的新 QA 便箋，未修改正式班級。

| 案例 | 判定 | 已取得結果與限制 |
|---|---|---|
| TC-01 中央入口 | PASS | Portal AI-ARM、SPLIT、中央管理導航可到達對應頁。 |
| TC-02 AI-ARM 唯讀管理 | PASS（UI 範圍） | 切 AI-ARM 顯示唯讀標籤、無新增/停用/重設操作；舊後台連結正確。不是後端授權認證。 |
| TC-03 開班與機密隔離 | FAIL | qa-split-2026 建立為 6 組、Gen1，重複建立未覆寫原名稱。但未登入即可開班，且測試班 secrets 文件能無憑證讀取，HTTP 200。 |
| TC-04 報到綁定 | FAIL | Alice/Bob 姓名、team-2、班級 Gen1 正常；改另一班 URL 後卻沿用舊班 session。門禁固定顯示 12 組、進班後僅 6 組，組數負向防線尚未驗收。 |
| TC-05 鎖與 ACK | PARTIAL | Alice 編輯，Bob 即時看到相同內容且 disabled、顯示 Alice 持鎖；Alice 按釋放後 Bob 可輸入。未精測 15 秒心跳、35 秒異常離線租約與 1 秒 ACK 時限。 |
| TC-06 跨組观摩 | PARTIAL | Alice 選第 1 組後 readonly、禁用輸入、無上傳；切下拉回第 2 組正常。兩個同名切回按鈕的點擊測試未完成，不能以選單替代驗收該按鈕。 |
| TC-07 附件 | PARTIAL | A 上傳 qa-upload.png，B 不需 F5 即看到縮圖、檔名、5 KB；點開 Lightbox，圖片實際 640×360 且完整顯示；刪除後 B 附件變 0。尚未以「他組已有附件」測刪除鈕隱藏。圖片跨端開啟子項 PASS；不涵蓋 PDF、Office、下載雜湊。 |
| TC-08 世代重設 | PARTIAL | 快速雙擊确认，Gen1 只遞增為 Gen2，A/B 不刷新都空白。最初約 511ms 仍 Gen1，後續確認 Gen2；未連續量測，不能宣告小於 1 秒。未做網路重送/兩管理員併發冪等。 |
| TC-09 快照復原 | PASS（順序主流程） | Gen2 寫入新字；選 Gen1 快照建立 Gen3，雙端恢復 Gen1 文字；Bob 可重新取得編輯鎖。未覆蓋併發復原與離線髒寫。 |
| TC-10 停用唯讀 | PARTIAL | 停用後 A/B 即時顯示 Gen3、已停用唯讀、紅字提醒，textarea disabled、上傳隱藏。沒有執行後端拒寫負向測試；不能宣告完整防寫成立。 |
| TC-11 AI-ARM 回歸 | PARTIAL | 2026-test 教材 P01→P02、46 頁目錄、投影片載入、計時器 10:00→09:49 後暫停正常；舊後台登入後載入 7 班。白板 100%→115%，新增 QA 卡、拖曳、重載保留座標。第二瀏覽器白板同步尚未確認，未覆蓋所有功能或完成 Console 全量稽核。 |

## BUG-CENTRAL-01 — P0：中央後台與機密文件無有效存取隔離

重現：開 localhost:5000/workshop/admin.html，未要求管理員登入即可建立 QA 班。另以不含 Authorization 的 REST GET 讀取 **僅本輪自建** `split_class_secrets/qa-split-2026`，得到 HTTP 200，包含 studentPasscode、adminPasswordHash 欄位。

密碼值沒有寫入證據；見 `../evidence/secret-access-redacted.json`。repo firestore.rules 為 allow read, write: if true；未嘗試更改他班或刪除資料。DEV 必須配置真正管理員/學員認證及後端規則；獨立 secrets 集合不是讀取保護。

## BUG-CENTRAL-02 — P1：跨班 URL 沿用舊 SPLIT 身分

重現：已在 qa-split-2026 登入 Alice，第 2 組；新頁開 `http://localhost:5000/workshop/split/?c=qa-split-login-check`。仍顯示 qa-split-2026 · Gen3、Tester-Alice、第 2 組，而非新班門禁。未在新班寫入資料。

`App.tsx:27` 初始化直接解析 split_user_session，未核對 URL 班級；PasswordGate 內的 classId 檢查沒有機會執行。佐證 `../evidence/cross-class-session.txt`。

## 額外待驗風險

- app-config.ts 的 passwordEnabled=false；PasswordGate 也未使用班級 secrets 驗證，而是共用條件。尚未以錯誤密碼完成獨立負向實測，不宣告已證實錯密碼登入。
- restoreGeneration 的 currentGeneration 讀取與 batch 寫入不是同一交易，clientRequestId 未用於復原去重；需要補併發測試。
- UI 名稱仍是「個人隨堂筆記」，遠端收到筆記時字數可能仍 0，屬待整理 UI 一致性項。

## 保留資料與後續

- qa-split-2026 留在 **inactive、Gen3**；Gen1/Gen2 歷史筆記保留，測試 PNG 已正常由產品刪除。
- AI-ARM 2026-test/team-1 新增 `QA SPLIT中央整合回歸 20260928 可刪除`，卡片 ID `note-h48q6hese-mukr9ekm`；拖曳重載後位置 left=3929.13px, top=4016.09px。未移動或刪除原卡片；該 QA 卡留作證據。
- 未修改產品原始碼、未 push/pull、未部署；沒有恢復 listening。
- 本輪待驗項需在修復版本再補測；附件 PNG 跨端預覽有獨立成功截圖 `../evidence/bob-preview.png`。
