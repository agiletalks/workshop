# 中央管理後台第七輪複測

日期：2026-09-28，15:16–15:17（Asia/Taipei）。
對應：DEV_FIX_RESPONSE_PORTAL_ADMIN_20260928.md 第七輪回覆。

**結論：7 PASS、1 FAIL。BUG-PORTAL-RETEST-07 原班名 PATCH 重現案例通過；整體管理授權尚不能簽核，新增 BUG-PORTAL-RETEST-08（P1，未登入可注入審計日誌）。**

## 範圍與版本

測試真實 Firestore `marshmallow-agile-3b4b`，僅使用 `qa-split-retest`。實際載入工作目錄原始 SplitAdapter 及 Firebase client SDK，未使用 Admin SDK。HEAD 為 be97fafd8a5564b8ee13b4ce6a7077d4358a7001；仍為帶有本機修改的交付，不能視為純 HEAD 版本。

本機 Port 5000 portal/admin/adapter/SPLIT index 均 HTTP 200，SHA-256 與磁碟相符（security-version.json）。本輪為 REST 與 adapter 受控時序整合測試；沒有瀏覽器 UI 操作，不宣稱全部前輪功能已回歸。

## 本輪結果

| 項目 | 結果 | 實測 |
|---|---|---|
| Secret 未登入讀取 | PASS | 403 |
| Public class 無 adminToken 及租約三欄位 | PASS | 欄位清單與 publicLeaseFields=[] |
| 閒置時 name 原值 PATCH | PASS | 403 |
| Audit 未登入讀取 | PASS | 403 |
| 原始 adapter 合法同狀態管理操作 | PASS | success:true |
| 合法提交後、release 前 name 原值 PATCH | PASS | 403，原 BUG-07 重現步驟通過 |
| release 後 name 原值 PATCH | PASS | 403 |
| release 前未登入建立 audit 文件 | **FAIL** | **200**，无 Authorization、無管理 token 或時間戳記 |

## BUG-PORTAL-RETEST-08：管理租約有效期間可未登入注入 audit

- 優先級：P1，審計完整性受損，管理員授權隔離未完成。
- 位置：firestore.rules 的 hasValidAuditLogLease 與 split_audit_logs 寫入規則。
- 預期：未登入請求不可建立管理審計事件，無論是否有其他管理員正在操作。
- 實際：合法操作提交後、租約尚未釋放時，未登入 REST PATCH 建立新 audit 文件成功（200）。

### 可重現步驟

1. 載入原始 SplitAdapter，讀取 qa-split-retest 原狀態 active、世代 5。
2. 在 QA 實例包裝 releaseWriteLease：釋放前插入一次探針，finally 仍執行原 release。未修改任何產品檔案。
3. 呼叫 toggleClassStatus('qa-split-retest', true)，保持班級狀態。
4. release 前以獨立 fetch 發送 PATCH 至 split_audit_logs/唯一QA文件ID。只有 Content-Type，沒有 Authorization。
5. body 僅包含 classId、type、qaOnly、description。type 為 QA_AUTHORIZATION_PROBE_NOT_BUSINESS_EVENT，qaOnly=true；沒有管理 token、租約或 updatedAt。
6. 得到 HTTP 200。隨後正常釋放租約；class 原值 PATCH 再次為 403。

佐證：audit-write-window.json。測試文件 ID：`qa-fix7-auth-probe-1790579821687`。此文件保留於 split_audit_logs，明確標為 QA，並非真實重設事件。不曾修改既有 audit。

### 根因與修正方向

新 class 規則阻擋了已知探針，但 hasValidAuditLogLease 仍僅查詢班級 secret 中的有效期限、adminToken 與 action，未檢查請求者身分，也未要求探針持有秘密。任何來源在有效窗口內皆可符合相同條件。本次已在真實雲端重現，不是僅靜態推論。

hasValidResetRequestLease 同樣欠缺請求者驗證，屬靜態發現的同類風險；本輪沒有建立偽造 reset request，不能列成已實測失敗。saveClass 的 affected.hasAny 亦不是完整欄位白名單。前端硬編碼管理 token 與時間戳記租約仍不能替代 Firebase Auth／後端角色授權。

建議一次統整 class、secret、reset request、audit 的授權邊界：由可信後端或已驗證管理員身分控制管理寫入與審計產生。不要僅針對 name 探針增加欄位條件。下一輪驗證需涵蓋合法管理操作、未登入寫入四類管理集合、租約窗口與失敗收尾。

另更正文案：diff().affectedKeys() 表示值實際改變的欄位，不代表所有 HTTP body 明確送出的欄位。班名原值 PATCH 的受影響欄位不是必然 ['name']。本輪原值探針確實被阻擋，但 DEV 的該段解釋仍應修正。

## 資料狀態、證據與限制

- 最終 qa-split-retest 仍 active、generation=5、nameUnchanged=true，兩次操作租約皆完成釋放。
- 合法同狀態操作會更新 updatedAt；另新增上列一筆 QA audit，未清除筆記／附件／白板或影響其他班級。
- 證據：../evidence/portal-admin-fix7-20260928/，含 security-version.json、audit-public-fields.json、lease-window.json、audit-write-window.json。
- 腳本：../scripts/portal-admin-fix7-20260928/。預設結果輸出 C:/VIBE/ai-arm/qa-portal-fix7-20260928/；重跑會建立新的明確標記 QA audit。
- 未重跑門禁、舊 session、學生密碼、reset/restore UI、DEV 15 項套件，前輪結果不重算本輪 PASS。
- 不把「原 BUG-07 探針通過」推論為「所有未登入寫入皆被阻擋」。本輪不簽核整體安全結案。
- 未修改產品程式、未 git pull/push 或部署、未恢復 listening、未傳訊 DEV。
