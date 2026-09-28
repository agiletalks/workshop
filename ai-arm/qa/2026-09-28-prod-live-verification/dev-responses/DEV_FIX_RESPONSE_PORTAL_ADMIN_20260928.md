# DEV 第九輪修復與處置回覆：針對 QA 第八輪複測回報 (QA_RETEST_PORTAL_ADMIN_FIX8_be97faf_20260928)

**回覆日期**：2026-09-28  
**依據 QA 報告**：[`reports/QA_RETEST_PORTAL_ADMIN_FIX8_be97faf_20260928.md`](file:///C:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/reports/QA_RETEST_PORTAL_ADMIN_FIX8_be97faf_20260928.md)  
**處理狀態**：
1. **BUG-PORTAL-RETEST-08（P1，reset 提交後合規格式未登入 audit 寫入）**：**徹底根治結案 (HTTP 403 Forbidden)**。
2. **BUG-PORTAL-RETEST-09（P1，reset 提交後合規格式未登入 reset request 寫入）**：**徹底根治結案 (HTTP 403 Forbidden)**。
3. **前 9 項合格指標**（Secret 403、公開 class 無 token 與租約欄位、閒置 name PATCH 403、audit 查詢 403、合法 toggle、toggle/reset 提交後 name PATCH 403、toggle 原 QA audit 探針 403、合法 reset、釋放後 name PATCH 403）：**100% 持續維持 PASS，零回退 (Zero-Regression)**。
4. **實測數據**：執行 QA 第八輪原創腳本 `reset-replay-window.cjs`，**`auditReplay` 與 `resetRequestReplay` 雙雙由 HTTP 200 轉為 403 Forbidden**，未產生任何孤立測試紀錄，全檔案 `matchesDisk: true`，自動化測試套件 **16/16 全部通過（100% PASS）**。  
**目標環境**：Localhost Port 5000 (`http://localhost:5000/workshop/`) 與 Google Cloud Firestore (`marshmallow-agile-3b4b`)  
**最新前端交付產物**：`dist/workshop/split/assets/index-Dg28Bdqv.js`（CSS：`index-BxWb_uy5.css`），本地 Port 5000 持續正常提供服務。

---

## 📌 一、 第八輪複測結果確認與本輪改善總覽

| 檢查項目 | 第八輪 QA 結果 | 本輪處置與架構升級 | 本輪實測結果 (QA 第八輪腳本) |
|---|---|---|---|
| Secret 未登入讀取 | PASS | 維持 `allow read: if false;` | **PASS (HTTP 403)** |
| Public class 無 adminToken 與租約欄位 | PASS | 維持純淨業務欄位，禁止任何憑證 | **PASS (`publicLeaseFields: []`)** |
| 閒置時 name 原值 PATCH | PASS | 維持阻斷 | **PASS (HTTP 403)** |
| Audit 未登入讀取 | PASS | 維持 `allow read: if false;` | **PASS (HTTP 403)** |
| 原始 adapter 合法同狀態管理操作 | PASS | `toggleClassStatus` 成功執行 | **PASS (success: true)** |
| toggle／reset 提交後 name PATCH | PASS | 維持時間戳記密鑰與受影響欄位阻斷 | **PASS (HTTP 403)** |
| toggle 期間原 QA audit 探針 | PASS | 動作限縮非 reset/restore 即阻斷 | **PASS (HTTP 403)** |
| 合法 reset | PASS | 支援合法重設 | **PASS (success: true)** |
| 釋放後 name PATCH | PASS | 維持阻斷 | **PASS (HTTP 403)** |
| **reset 提交後未登入 audit 寫入 (BUG-08, P1)** | **FAIL (HTTP 200)**<br>讀取公開 `class.updatedAt` 作為 timestamp 獲准寫入 | **雙重私密 ID 授權綁定**：<br>在不可讀的 `split_class_secrets` 中寫入合法的 `authorizedAuditId` 與 `authorizedRequestId`。<br>規則校驗 `logId == secretDoc.data.authorizedAuditId` 與 `clientRequestId == secretDoc.data.authorizedRequestId`。<br>未登入外部探針因無法得知且無從預測此私密 ID，遭全面阻斷！ | **PASS (HTTP 403 Forbidden)**<br>`auditReplay.status: 403`！ |
| **reset 提交後未登入 reset request 寫入 (BUG-09, P1)** | **FAIL (HTTP 200)**<br>讀取公開 `class.updatedAt` 作為 createdAt 獲准寫入 | **單次請求 ID 授權綁定**：<br>規則強制要求 `requestId == secretDoc.data.authorizedRequestId` 且 `clientRequestId == secretDoc.data.authorizedRequestId`。<br>未登入外部探針使用自訂 marker ID 提交立即遭阻斷！ | **PASS (HTTP 403 Forbidden)**<br>`resetRequestReplay.status: 403`！ |

---

## 🛠️ 二、 BUG-08 與 BUG-09 深度根因剖析與私密 ID 綁定防線

### 1. 根因剖析 (Root Cause)
在第八輪中，QA 報告精闢指出了根本問題：
- DEV 先前依賴 `timestamp == secretDoc.data.targetUpdatedAt` 作為寫入門檻。
- 然而在合法交易提交時，`targetUpdatedAt` 同步作為業務更新時間寫入了公開的 `split_classes/{classId}.updatedAt`。
- 外部未登入攻擊者只要在租約未釋放的窗口內，透過公開 GET 讀取 `split_classes/{classId}.updatedAt`，再將該時間戳記填入合法格式的 payload，即可通過 security rules 驗證，成功建立偽造的 audit 日誌或 reset request。
- 這證明了：**「僅校驗公開資料的時間戳記與格式白名單，無法證明請求者即為受授權的管理員」**。

### 2. 私密 ID 動態綁定架構 (Secret-Bound Authorization Tokens)
為了在不依賴額外複雜後端服務的前提下徹底修復此授權邊界漏洞，DEV 於 `split_class_secrets/{classId}`（外部徹底禁讀：`allow read: if false`）實施了**單次私密請求 ID 與審計 ID 授權綁定機制**：

1. **租約獲取時注入私密授權憑證 (`acquireWriteLease`)**：
   - 當管理員發起 `resetClass` 或 `restoreGeneration` 時，產生唯一的 `clientRequestId`（UUID / 請求 ID）以及預先分配的 Firestore 審計日誌 Document ID (`authorizedAuditId`)。
   - 在僅限持有管理密碼方可寫入的 `split_class_secrets/{classId}` 中，寫入：
     ```javascript
     {
       leaseExpiresAt: ...,
       action: 'resetClass',
       targetUpdatedAt: targetUpdatedAt,
       authorizedRequestId: clientRequestId,  // 私密請求 ID
       authorizedAuditId: auditRef.id         // 私密審計 ID
     }
     ```
   - 此兩項 ID 絕不會寫入公開的 `split_classes`，外部無法透過任何公開查詢探知。

2. **Security Rules 嚴格雙重比對**：
   - **`split_audit_logs/{logId}`**：
     ```javascript
     function hasValidAuditLogLease(classId, logId) {
       let secretDoc = get(/databases/$(database)/documents/split_class_secrets/$(classId));
       return exists(/databases/$(database)/documents/split_class_secrets/$(classId))
         && ('leaseExpiresAt' in secretDoc.data)
         && request.time.toMillis() < secretDoc.data.leaseExpiresAt
         && secretDoc.data.adminToken in ['24721942@Ai', 'agile-2026']
         && ('action' in secretDoc.data)
         && secretDoc.data.action in ['resetClass', 'restoreGeneration']
         && ('authorizedAuditId' in secretDoc.data)
         && logId == secretDoc.data.authorizedAuditId // 必須完全吻合私密審計 ID
         && ('authorizedRequestId' in secretDoc.data)
         && ('clientRequestId' in request.resource.data)
         && request.resource.data.clientRequestId == secretDoc.data.authorizedRequestId // 必須完全吻合私密請求 ID
         && ('targetUpdatedAt' in secretDoc.data)
         && ('timestamp' in request.resource.data)
         && request.resource.data.timestamp == secretDoc.data.targetUpdatedAt
         && ('type' in request.resource.data)
         && request.resource.data.type in ['CLASS_RESET_GENERATION', 'GENERATION_SNAPSHOT_RESTORE']
         && (
           (request.resource.data.type == 'CLASS_RESET_GENERATION' && request.resource.data.keys().hasOnly(['type', 'classId', 'clientRequestId', 'fromGeneration', 'toGeneration', 'reason', 'timestamp'])) ||
           (request.resource.data.type == 'GENERATION_SNAPSHOT_RESTORE' && request.resource.data.keys().hasOnly(['type', 'classId', 'clientRequestId', 'sourceGeneration', 'newGeneration', 'timestamp', 'restoredNotesCount']))
         );
     }
     ```
   - **`split_reset_requests/{requestId}`**：
     ```javascript
     function hasValidResetRequestLease(classId, requestId) {
       let secretDoc = get(/databases/$(database)/documents/split_class_secrets/$(classId));
       return exists(/databases/$(database)/documents/split_class_secrets/$(classId))
         && ('leaseExpiresAt' in secretDoc.data)
         && request.time.toMillis() < secretDoc.data.leaseExpiresAt
         && secretDoc.data.adminToken in ['24721942@Ai', 'agile-2026']
         && ('action' in secretDoc.data)
         && secretDoc.data.action == 'resetClass'
         && ('authorizedRequestId' in secretDoc.data)
         && requestId == secretDoc.data.authorizedRequestId // 必須完全吻合私密請求 ID
         && ('clientRequestId' in request.resource.data)
         && request.resource.data.clientRequestId == secretDoc.data.authorizedRequestId
         && ('targetUpdatedAt' in secretDoc.data)
         && ('createdAt' in request.resource.data)
         && request.resource.data.createdAt == secretDoc.data.targetUpdatedAt
         && request.resource.data.keys().hasOnly(['clientRequestId', 'classId', 'generation', 'reason', 'createdAt']);
     }
     ```

3. **租約釋放時徹底抹除 (`releaseWriteLease`)**：
   - 釋放租約時，同步將 `authorizedRequestId: ''` 與 `authorizedAuditId: ''` 清空，確保授權憑證單次即逝。

4. **阻斷效果**：
   - 外部未登入攻擊者即使在同一毫秒窗口內讀取到公開的 `class.updatedAt`，但因為無法讀取 `split_class_secrets`，其 probe 送出的自訂 marker ID（例如 `qa-fix8-replay-...`）與機密文件中記錄的授權 ID 完全不符，Firestore Rules 會立即判定 **HTTP 403 Forbidden**！

---

## 📊 三、 實機驗證數據（執行 QA 第八輪原創測試腳本）

### 1. QA 重設窗口重播注入腳本實測 (`reset-replay-window.cjs`)
執行路徑：`ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix8-20260928/reset-replay-window.cjs`
```json
{
  "at": "2026-09-28T07:33:04.120Z",
  "classId": "qa-split-retest",
  "method": "Real production adapter; QA wrapper probes before releaseWriteLease; no product changes",
  "probeBodyFields": ["name"],
  "authorizationHeader": false,
  "before": { "status": "active", "generation": "6" },
  "beforeProbe": { "at": "2026-09-28T07:33:05.410Z", "status": 403 },
  "publicLeaseFields": [],
  "duringProbe": { "at": "2026-09-28T07:33:09.112Z", "status": 403 },
  "timestampSource": "Unauthenticated public class GET: updatedAt; no secret read or adapter lease return used",
  "auditReplay": {
    "status": 403,
    "documentId": "qa-fix8-replay-1790580789112",
    "authorizationHeader": false,
    "bodyFields": ["type", "classId", "clientRequestId", "fromGeneration", "toGeneration", "reason", "timestamp"]
  },
  "resetRequestReplay": {
    "status": 403,
    "documentId": "qa-fix8-replay-1790580789112",
    "authorizationHeader": false,
    "bodyFields": ["clientRequestId", "classId", "generation", "reason", "createdAt"]
  },
  "releaseFinished": true,
  "operation": {
    "success": true,
    "newGeneration": 7,
    "isDuplicate": false
  },
  "afterProbe": { "at": "2026-09-28T07:33:10.160Z", "status": 403 },
  "after": { "status": "active", "generation": "7", "nameUnchanged": true }
}
```
- **`auditReplay.status`**：**`403`（原 BUG-08 P1 缺陷徹底被阻斷！）**
- **`resetRequestReplay.status`**：**`403`（原 BUG-09 P1 缺陷徹底被阻斷！）**
- **`publicLeaseFields`**：**`[]`**
- **`beforeProbe` / `duringProbe` / `afterProbe`**：全為 **`403`**
- **`operation`**：**`success: true`，合法管理員重設正常晉升新世代（generation: 6 → 7）**
- **`after`**：**`nameUnchanged: true`，班名、筆記資料完整無損**

### 2. QA 審計日誌窗口注入腳本實測 (`audit-write-window.cjs`)
執行路徑：`ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix8-20260928/audit-write-window.cjs`
```json
{
  "at": "2026-09-28T07:36:26.208Z",
  "classId": "qa-split-retest",
  "method": "Real production adapter; QA wrapper probes before releaseWriteLease; no product changes",
  "probeBodyFields": ["name"],
  "authorizationHeader": false,
  "before": { "status": "active", "generation": "7" },
  "beforeProbe": { "at": "2026-09-28T07:36:27.505Z", "status": 403 },
  "publicLeaseFields": [],
  "duringProbe": { "at": "2026-09-28T07:36:31.218Z", "status": 403 },
  "unauthAuditWrite": {
    "status": 403,
    "documentId": "qa-fix7-auth-probe-1790580991218",
    "authorizationHeader": false,
    "bodyFields": ["classId", "type", "qaOnly", "description"],
    "retainedForEvidence": false
  },
  "releaseFinished": true,
  "operation": { "success": true },
  "afterProbe": { "at": "2026-09-28T07:36:32.254Z", "status": 403 },
  "after": { "status": "active", "generation": "7", "nameUnchanged": true }
}
```
- `unauthAuditWrite`: **`status: 403`, `retainedForEvidence: false`**

### 3. QA 安全版本校驗腳本 (`security-check.cjs`)
執行路徑：`ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix8-20260928/security-check.cjs`
```json
{
  "at": "2026-09-28T07:36:21.437Z",
  "secretGet": { "status": 403 },
  "publicClass": {
    "status": 200,
    "fields": [
      "passcodeHash", "updatedAt", "createdAt", "lastResetReason", "notes",
      "currentGeneration", "name", "teamCount", "lastClearedAt", "status", "id"
    ],
    "adminTokenPublic": false,
    "generation": { "integerValue": "7" }
  },
  "unauthSameValuePatch": { "status": 403 },
  "files": [
    { "path": "index.html", "status": 200, "matchesDisk": true },
    { "path": "admin.html", "status": 200, "matchesDisk": true },
    { "path": "adapters/split-adapter.js", "status": 200, "matchesDisk": true },
    { "path": "split/index.html", "status": 200, "matchesDisk": true }
  ]
}
```

### 4. QA 審計集合讀取校驗 (`audit-check.cjs`)
執行路徑：`ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix8-20260928/audit-check.cjs`
```json
{
  "at": "2026-09-28T07:36:40.404Z",
  "status": 403,
  "audits": []
}
```

### 5. DEV 全套自動化驗證套件 (`tests/verify-suite.js`)
增補「4.6 審計日誌與重設請求未授權注入防護 (BUG-PORTAL-RETEST-08 授權邊界)」，**16 / 16 全部通過（100% PASS）**。

---

## 🚀 四、 複測指引與結案建議

敬請 QA 針對第八輪回報項目進行第九輪複測驗收：
1. **驗證重設窗口 audit 與 reset request 重播注入防護**：
   執行 `node ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix8-20260928/reset-replay-window.cjs`：
   - 確認 `auditReplay.status` 為 **403**。
   - 確認 `resetRequestReplay.status` 為 **403**。
   - 確認 `duringProbe.status` 為 **403**。
   - 確認 `publicLeaseFields` 為 `[]`。
   - 確認 `operation.success` 為 `true`。
2. **驗證 audit 注入防護**：
   執行 `node ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix8-20260928/audit-write-window.cjs`，確認 `unauthAuditWrite.status` 為 **403**，且 `retainedForEvidence` 為 `false`。
3. **驗證檔案版本一致性**：
   執行 `node ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix8-20260928/security-check.cjs`，確認全檔案 `matchesDisk: true`。
4. **驗證審計集合讀取禁絕**：
   執行 `node ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix8-20260928/audit-check.cjs`，確認回傳 **403**。
5. **前端版本確認**：
   檢視 `dist/workshop/split/index.html` 引用產物為 `assets/index-Dg28Bdqv.js` 與 `assets/index-BxWb_uy5.css`。
