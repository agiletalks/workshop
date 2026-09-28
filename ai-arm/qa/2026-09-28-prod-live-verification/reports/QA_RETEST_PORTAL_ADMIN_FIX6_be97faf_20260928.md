# 中央管理後台第六輪複測結果

- 日期：2026-09-28，實測 14:55–14:57（Asia/Taipei）。
- 對應 DEV 文件：`../dev-responses/DEV_FIX_RESPONSE_PORTAL_ADMIN_20260928.md`（第六輪）。
- 結論：**本輪針對性檢查 6 PASS、1 FAIL；BUG-PORTAL-RETEST-07（P0）仍未結案。**
- 範圍：SPLIT 管理授權租約與雲端規則。前輪 UI PASS 不重算為本輪 PASS；AI-Align、HOOK、棉花糖管理仍不在範圍。

## 版本與環境

- Repo HEAD：`be97fafd8a5564b8ee13b4ce6a7077d4358a7001`，工作目錄包含未提交修改與未追蹤檔案，測試對象為目前工作目錄產物，不是純 HEAD。
- 本機：`http://localhost:5000/workshop/`。
- 真實 Firestore：`marshmallow-agile-3b4b`，僅操作 `qa-split-retest`。
- HTTP 取得 portal、admin、split adapter、SPLIT index，均 200 且 SHA-256 與對應磁碟檔相符。詳見 `security-version.json`。
- 檢視 dist index 引用：`index-DKwMpJen.js`、`index-BdXLbqXd.css`；與 DEV 回覆列出的資產名稱不同。本輪沒有執行瀏覽器 UI 回歸，不能據此宣稱 UI 已載入或通過。

## 實測結果

| 檢查 | 結果 | 證據 |
|---|---|---|
| 未登入讀取測試班 secret | PASS | HTTP 403 |
| 公開 class 不包含 adminToken | PASS | HTTP 200，欄位清單不含 adminToken |
| 閒置時未登入 name 原值 PATCH | PASS | HTTP 403 |
| 未登入查詢測試班 audit | PASS | HTTP 403 |
| 原始 adapter 合法管理操作 | PASS | toggleClassStatus 維持原 active，success:true |
| 租約釋放後未登入 name 原值 PATCH | PASS | HTTP 403 |
| 管理提交完成、租約未釋放時未登入 PATCH | **FAIL / P0** | **HTTP 200**，body 只有 name，無 Authorization、無租約三欄位 |

## BUG-PORTAL-RETEST-07：局部更新繼承既有租約欄位，未登入寫入仍被允許

### 重現方法

這是 **真實雲端規則 + 原始 adapter 的受控時序整合測試**，不是瀏覽器自然時序測試，也不是模擬規則：

1. 以獨立 Node 程式載入目前 `adapters/split-adapter.js` 與已安裝的 Firebase client SDK；不使用 Admin SDK、不繞過 Security Rules。
2. 讀取 `qa-split-retest` 原狀態 active、世代 5、班名。
3. 在租約取得前，以獨立 fetch、無 Authorization，PATCH 原班名，得到 403。
4. 呼叫真實 `toggleClassStatus(classId, true)`，保持啟用狀態不變。
5. 只在 QA 測試實例包裝 `releaseWriteLease`：合法寫入完成後，先執行一次未登入探針，再於 finally 呼叫原始 release。產品檔案完全不變。
6. 探針為 `PATCH .../split_classes/qa-split-retest?updateMask.fieldPaths=name`，body 僅 `{fields:{name:原始名稱欄位}}`，**取得 HTTP 200**。
7. 原始 release 完成後，同一探針得到 403。

### 實際時間與資料保護

- 操作前：2026-09-28T06:56:36.187Z，403。
- 提交後／釋放前：2026-09-28T06:56:38.857Z，**200**。
- 釋放後：2026-09-28T06:56:39.715Z，403。
- 最後仍 active、generation=5、nameUnchanged=true；未清除筆記、白板或附件，未修改其他班級。
- 合法操作更新了 updatedAt 與公開租約欄位；原值 PATCH 更新文件版本時間。機密租約已透過原 release 清空。沒有移除公開租約欄位，以保留產品真實操作後狀態。

### 根因與 DEV 宣告更正

`firestore.rules:11–28` 比對的是 `request.resource.data`（更新後文件），不是 HTTP body 中明確提交的欄位。`updateMask=name` 會保留 class 已有的 `leaseToken`、`leaseHolder`、`leaseAction`，因此三欄位檢查仍成立。

`split-adapter.js:272` 的合法操作把同一租約三欄位寫入公開 class；在 release 前，文件中的三欄位與 secret 仍相符。即使探針完全沒有附帶三欄位，仍獲允許。實測亦確認這三欄位可公開讀取（佐證僅儲存欄位名稱，沒有保存 token 值）。

因此 DEV 所稱「body 不含 leaseToken，所以 request.resource.data 不含 leaseToken」不成立。先前四次 403 只能證明當次探針被阻擋，無法涵蓋提交成功到釋放之間的窗口。

### 建議修正與驗收

- 將管理員授權綁定可由伺服器驗證的身分，例如 Firebase Auth 管理員角色，或受信任後端管理 API；不要用公開文件中的欄位當作請求者身分。
- 前端靜態管理 token 與任意字串 sessionId 不能證明管理員身分；目前 adapter 仍含預設管理 token，需一併處理，勿只換隨機數或縮短租約。
- 修正後重跑本次「合法提交後、release 前」測試，未登入探針必須 403；另覆蓋 release 延遲／失敗，以及合法管理操作仍成功。
- 本次僅以原值寫入證明未授權寫入被接受，沒有測試篡改名稱、世代或刪除資料。

## 交付檔案與限制

佐證：`../evidence/portal-admin-fix6-20260928/`

- `security-version.json`：版本指紋、secret/class 與閒置 PATCH。
- `audit-public-fields.json`：audit 查詢 403。
- `lease-window.json`：完整時點、HTTP 狀態、操作後資料狀態。

可重現腳本：`../scripts/portal-admin-fix6-20260928/`，包含 security-check.cjs、audit-check.cjs、lease-window.cjs。脚本預設將結果寫至 `C:/VIBE/ai-arm/qa-portal-fix6-20260928/`，重跑前需確認該目錄存在。

本輪未重跑瀏覽器門禁、舊 session、學生密碼、管理員重設、reset request 去 token、原始輪詢探針或 DEV 15 項套件；均不得新增本輪 PASS。本輪已藉受控窗口重現同一 P0，足以否定「租約有效期所有未登入探針一律 403」的結案宣告。

未修改產品程式、未 pull/push、未部署、未恢復監聽，也未發訊給 DEV。
