# 中央後台第四輪修復複測報告

- 日期：2026-09-28，14:00～14:04（Asia/Taipei）。
- 對應文件：`../dev-responses/DEV_FIX_RESPONSE_PORTAL_ADMIN_20260928.md`（DEV 第四輪回覆）。
- **結論：本輪 8 個檢查，5 PASS、3 FAIL；尚不可結案。** P0 BUG-02 仍有公開憑證問題；P1 BUG-05 的新門禁旁路修好，但舊 session 淘汰失敗；新增 P1 BUG-PORTAL-RETEST-06：正常管理員無法重設世代。
- 本期維持 AI-ARM／SPLIT；其他課程管理功能仍為範圍外。沒有修改產品程式、部署、git pull／push 或恢復監聽。

## 1. 版本與測試環境

HEAD 基準 `be97faf`，含未提交變更。測試 DEV 已建置的本機 Port 5000 服務及它連線的 `marshmallow-agile-3b4b` Firestore；SPLIT 引用 `index-DdlK0374.js`。Portal、admin、adapter served hash 與來源一致，SPLIT HTML 與 dist 一致。本次没有另行 build-all。

證據：[版本與安全檢查](../evidence/portal-admin-fix4-20260928/security-version.json)、[Git 狀態](../evidence/portal-admin-fix4-20260928/git-status.txt)。

## 2. 結果矩陣

| 檢查 | 結果 | 實測 |
|---|---|---|
| 機密文件未驗證 GET | PASS | qa-split-retest 的 secret GET 回傳 403。 |
| 公開班級移除 adminToken | PASS | 該 QA 班 public GET 為 200，沒有 adminToken 欄位。 |
| 未登入原值局部 PATCH | PASS | 同一 QA 班 name 原值、updateMask 與版本前提，無 Authorization／token，回傳 403。 |
| 公開稽核資料不洩漏管理 token | **FAIL** | 未驗證查詢該 QA 班 split_audit_logs 回傳 200，Gen 4 紀錄仍含 adminToken。 |
| 新門禁拒絕通用密碼 | PASS | qa-split-retest 輸入 split-2026，顯示密碼不符，留在門禁。 |
| 新門禁接受專屬密碼 | PASS | 同頁改輸入 split-retest，QA-Fourth-Alice 成功進入 qa-split-retest · Gen 4。 |
| 舊無效 session 主動淘汰 | **FAIL** | Edge localhost 前輪 QA-Third-Default 身分仍直接恢復；雲端同步完成後仍在教材，沒有退回門禁。 |
| 正常管理員世代重設回歸 | **FAIL** | 正常登入後對 QA 班確認 Gen 4→5，Firestore Commit permission-denied，畫面維持 Gen 4。 |

這是本輪重點檢查，不是全部 13 項重新測試。前輪已通過項目僅在本次實測範圍內更新，不擴張為全產品安全驗收。

## 3. BUG-02（P0）：班級文件清乾淨，但稽核紀錄仍公開憑證

原重現腳本的三個安全條件本輪均通過：secret GET=403、班級 adminTokenPublic=false、局部 PATCH=403。使用的 [security-check.cjs](../evidence/portal-admin-fix4-20260928/security-check.cjs) 只對專用 QA 班寫回名稱原值；本次遭拒絕，沒有改動欄位內容。

然而，未附 Authorization 對 `split_audit_logs` 依 `classId=qa-split-retest` 查詢，仍可讀到 Gen 4 紀錄，其欄位含 `adminToken`。只保存欄位名稱及布林值，未保存或引用 token 的值。

- 證據：[公開稽核欄位](../evidence/portal-admin-fix4-20260928/audit-public-fields.json)。
- 程式核對：`split-adapter.js` 的 resetClass 仍將 adminToken 寫入 auditRef 與 requestRef；`firestore.rules` 對這兩個集合仍為 `allow read: if true`。
- 實測已確認 audit 洩漏；reset request 的公開讀取為規則／程式檢查發現，未另行 REST 列舉。
- 管理 token 仍屬規則接受的授權材料，不能只因它移出 split_classes 就判定 P0 完成。

**DEV 待辦：**移除所有公開文件／日誌中的管理憑證，處理既有洩漏值，採用後端可驗證的管理身分。需同時覆蓋 class、audit、reset request 與 secret；這次沒有使用洩漏值執行冒用操作。

## 4. BUG-05（P1）：新報到已修復，舊身分淘汰未生效

### 新報到通過

為保留舊 session 供獨立驗證，新報到使用同一本機服務的乾淨 origin：

`http://127.0.0.3:5000/workshop/split/?c=qa-split-retest`

姓名 QA-Fourth-Alice、第 1 組，先輸入 split-2026 得到密碼不符；再輸入 split-retest 成功登入。證據：[拒絕通用密碼](../evidence/portal-admin-fix4-20260928/default-rejected.txt)、[接受專屬密碼](../evidence/portal-admin-fix4-20260928/custom-accepted.txt)。本項僅為正常 UI 密碼比對，不代表無法偽造前端 session 或具有後端學員權限驗證。

### 舊 session 仍失敗

Edge 的 localhost 保存前輪使用通用密碼旁路登入的 QA-Third-Default。新版開啟同班連結後，初始畫面及雲端同步完成畫面均直接顯示此姓名與 qa-split-retest · Gen 4，沒有退回門禁。

證據：[舊身分仍恢復](../evidence/portal-admin-fix4-20260928/old-session-still-valid.txt)。沒有清除或手動注入 browser storage。

靜態核對可解釋這個結果：

1. `App.tsx` 初始化仍直接回傳 classId 相符的 session，讓 PasswordGate 的掛載校驗不執行。
2. `subscribeClassMetadata()` 雖然型別新增 passcodeHash，實際 onUpdate 物件仍未傳出該欄位。
3. App 的失效條件還要求 `meta.passcodeHash && userSession.passcodeHash` 同時存在；舊版沒有 hash 的 session 不會符合此失效判斷。

**DEV 待辦：**先驗證既有 session 再開放教材／協作，確實傳遞 metadata hash，將缺少 hash 的舊 session 視為待重新報到；補上真實舊版資料遷移測試，而非只測兩個模擬 hash 不相等。

## 5. 新 BUG-PORTAL-RETEST-06（P1）：合法管理員無法重設世代

- 環境：`http://localhost:5000/workshop/admin.html?course=split`。
- 重現：正常管理密碼登入→搜尋 qa-split-retest→重設演練→原因填「QA 第四輪：授權後世代重設回歸」→確認一次。
- 預期：Gen 4→5，原因與 requestId 原子寫入。
- 實際：Firestore Commit 回傳 `permission-denied`，彈窗恢復可操作、班卡仍 Gen 4，沒有成功重設。
- 證據：[結果畫面](../evidence/portal-admin-fix4-20260928/reset-result.txt)、[遮蔽 token 後的 Console](../evidence/portal-admin-fix4-20260928/reset-console.json)。

程式排查線索：adapter 在同一 transaction 中更新 secret.updatedAt 與 class.updatedAt；規則比對使用 `get(secret).data.updatedAt`。請 DEV 檢查交易中的跨文件讀取究竟取得何時的值，確保授權條件支援合法原子操作。此處是根據實作的排查方向；QA 不把推測當作已修復或已唯一確定的根因。

**DEV 待辦：**在實際生效規則下跑成功路徑，不只驗證拒絕未授權 PATCH；至少覆蓋建立、啟用／停用、reset 與 restore。保留原子性及防重複遞增保障，不以放寬公開寫入解決。

## 6. 測試限制與收尾

- DEV 宣告的 14/14 本輪未直接重跑：原套件仍含可能整份替換 QA secret 的 hacked payload。QA 使用原值局部 PATCH 及實際 UI 等效驗證，不將 DEV 套件結果當成獨立 PASS。
- 未更動其他班級；本次 reset 遭拒絕，qa-split-retest 仍為 Gen 4。未輸入筆記或改變密碼、班級狀態。管理 UI 已取消彈窗並登出。
- 未重新驗證本輪未觸及的完整 AI-ARM 功能、其他課程、所有停用／改密碼即時撤權組合。

## 7. 可轉交 DEV 摘要

> 第四輪：原局部 PATCH、班級 token 移除與新門禁專屬密碼比對通過，但整體仍未結案。P0：split_audit_logs 仍未登入可讀 adminToken，不能只清 split_classes。P1：舊 QA-Third-Default session 仍恢復，metadata 回呼未傳 passcodeHash，且缺 hash 的 session 未被撤銷。另新增 BUG-PORTAL-RETEST-06：正常管理員重設 QA 班 Gen 4→5 被 Firestore permission-denied 拒絕。請修正上述三項，並補實際規則下的合法管理交易與舊 session 測試。詳見本報告及 evidence/portal-admin-fix4-20260928/。
