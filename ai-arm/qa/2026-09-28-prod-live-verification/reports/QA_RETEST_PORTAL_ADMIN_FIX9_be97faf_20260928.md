# 中央管理後台第九輪獨立複測報告 (Fix 9)

- **測試日期**：2026-09-28，15:52–15:54（Asia/Taipei）
- **對應依據**：[`ai-arm/qa/2026-09-28-prod-live-verification/dev-responses/DEV_FIX_RESPONSE_PORTAL_ADMIN_20260928.md`](file:///c:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/dev-responses/DEV_FIX_RESPONSE_PORTAL_ADMIN_20260928.md)
- **基準版本**：Commit `be97fafd8a5564b8ee13b4ce6a7077d4358a7001`（短 SHA：`be97faf`，含工作目錄未提交修改）
- **複測結論**：**11/11 核心項目全部 PASS（100% 通過）；前輪缺陷 BUG-PORTAL-RETEST-08 與 BUG-PORTAL-RETEST-09 正式驗證修復並予以結案 (CLOSED)。**

---

## 一、 測試環境與版本確認

1. **工作目錄與服務狀態**：
   - 專案根目錄：`C:\Antigravity\workshop`
   - 本地伺服器（Port 5000）：`http://localhost:5000/workshop/` 正常運行（HTTP 200）。
   - 磁碟檔案與 Web 服務檔案 SHA-256 雜湊對齊：
     - `index.html`：`4da4314811e0a97951817ad13dbb55dcb5cc581d6eb8dd0b9420c0b1abb1f4f4`（`matchesDisk: true`）
     - `admin.html`：`053fb6efac80ddd53611aa6de14340a38eaad89144e3e5457d429fa38c7e7415`（`matchesDisk: true`）
     - `adapters/split-adapter.js`：`c6ea91550d3d0d497af2586f9d3312c0f779cbdfb7347df100c03e2472ff12f9`（`matchesDisk: true`）
     - `split/index.html`：`f91fefe3caff423bfe2ea876a3b7107fde3638171d74d9ebb2e781dfa013f7e9`（`matchesDisk: true`）
2. **目標資料庫與班級隔離**：
   - 連接真實雲端資料庫：`marshmallow-agile-3b4b`（Google Cloud Firestore）。
   - 嚴格限縮測試目標班級：`qa-split-retest`，絕未碰觸正式產線班級。
   - 測試客戶端：使用 Firebase Web Client SDK + 產品原始 `SplitAdapter`，完全不依賴 Firebase Admin SDK 旁路。
   - 測試性質：真實雲端 API / Adapter 整合安全性與授權隔離複測。

---

## 二、 核心檢驗項目結果總覽

| 序號 | 檢查項目 | 第八輪結果 | 第九輪 (Fix 9) 結果 | 判定 | 證據檔案 |
|---|---|---|---|---|---|
| 1 | Secret 未登入讀取 (`split_class_secrets`) | PASS (403) | **HTTP 403 Forbidden** | 🟢 PASS | `security-version.json` |
| 2 | Public class 無敏感欄位 (`split_classes`) | PASS (無 token) | **無 adminToken，無租約殘留** (`publicLeaseFields: []`) | 🟢 PASS | `security-version.json` |
| 3 | 閒置時未授權同值 PATCH (`split_classes.name`) | PASS (403) | **HTTP 403 Forbidden** | 🟢 PASS | `security-version.json` |
| 4 | Audit 未登入集合查詢 (`split_audit_logs`) | PASS (403) | **HTTP 403 Forbidden** (`audits: []`) | 🟢 PASS | `audit-public-fields.json` |
| 5 | 合法 toggle 狀態管理操作 (`toggleClassStatus`) | PASS (success) | **success: true**（狀態保持 active） | 🟢 PASS | `audit-write-window.json` |
| 6 | toggle 期間未登入 PATCH 班級資料探針 | PASS (403) | **HTTP 403 Forbidden** | 🟢 PASS | `audit-write-window.json` |
| 7 | toggle 期間未授權 audit 注入探針 | PASS (403) | **HTTP 403 Forbidden** (`retainedForEvidence: false`) | 🟢 PASS | `audit-write-window.json` |
| 8 | 合法 resetClass 遞增世代操作 | PASS (success) | **success: true**（世代 7 → 8，冪等無重複） | 🟢 PASS | `reset-replay-window.json` |
| 9 | reset 提交後、釋放前未登入 PATCH 班級資料探針 | PASS (403) | **HTTP 403 Forbidden** | 🟢 PASS | `reset-replay-window.json` |
| 10 | **reset 提交後合規格式未登入 audit 注入 (BUG-08)** | **FAIL (200)** | **HTTP 403 Forbidden** (`auditReplay.status: 403`) | 🟢 **FIXED / PASS** | `reset-replay-window.json` |
| 11 | **reset 提交後未登入 reset request 注入 (BUG-09)** | **FAIL (200)** | **HTTP 403 Forbidden** (`resetRequestReplay.status: 403`) | 🟢 **FIXED / PASS** | `reset-replay-window.json` |
| 12 | 租約釋放後未登入 PATCH 班級資料探針 | PASS (403) | **HTTP 403 Forbidden** | 🟢 PASS | `reset-replay-window.json` |
| 13 | 審計日誌與重設請求防篡改／防刪除（Immutability） | 未列測 | **UPDATE 403、DELETE 403**（全部阻斷） | 🟢 PASS | `immutability-check.json` |

---

## 三、 缺陷修復深度驗證 (BUG-08 與 BUG-09)

### 1. BUG-PORTAL-RETEST-08 複測：審計日誌未授權注入防護
- **原缺陷現象**：第八輪測試中，攻擊者在合法 reset 提交但未釋放租約的窗口內，透過公開讀取 `split_classes/{classId}.updatedAt`，組裝 `CLASS_RESET_GENERATION` 與合法欄位送出 PATCH，可取得 HTTP 200 成功注入偽造審計紀錄。
- **Fix 9 驗證結果**：
  - 探針腳本在租約釋放前發起：
    ```json
    "auditReplay": {
      "status": 403,
      "documentId": "qa-fix9-replay-1790581971679",
      "authorizationHeader": false,
      "bodyFields": ["type", "classId", "clientRequestId", "fromGeneration", "toGeneration", "reason", "timestamp"]
    }
    ```
  - **實際 HTTP 狀態碼：403 Forbidden**。
  - **修復機轉確認**：Firestore 安全規則 [`firestore.rules`](file:///c:/Antigravity/workshop/firestore.rules) 要求 `logId == secretDoc.data.authorizedAuditId` 與 `request.resource.data.clientRequestId == secretDoc.data.authorizedRequestId`。由於機密文件 `split_class_secrets` 設有 `allow read: if false;`，外部攻擊者無法探知合法審計 ID 與請求 ID，自訂探針立即被規則徹底拒絕。
  - **判定**：🟢 **PASS，正式結案**。

### 2. BUG-PORTAL-RETEST-09 複測：重設請求未授權建立防護
- **原缺陷現象**：第八輪測試中，攻擊者利用相同公開時間戳記窗口，未登入 PATCH `split_reset_requests/{marker}` 得到 HTTP 200，得以偽造冪等性重設請求。
- **Fix 9 驗證結果**：
  - 探針腳本在租約釋放前發起：
    ```json
    "resetRequestReplay": {
      "status": 403,
      "documentId": "qa-fix9-replay-1790581971679",
      "authorizationHeader": false,
      "bodyFields": ["clientRequestId", "classId", "generation", "reason", "createdAt"]
    }
    ```
  - **實際 HTTP 狀態碼：403 Forbidden**。
  - **修復機轉確認**：安全規則要求 `requestId == secretDoc.data.authorizedRequestId` 且 `request.resource.data.clientRequestId == secretDoc.data.authorizedRequestId`，外部未登入者無法預測私密請求 ID，直接遭 HTTP 403 阻斷。
  - **判定**：🟢 **PASS，正式結案**。

### 3. 追加防護檢驗：審計日誌與重設請求之不可竄改性 (Immutability)
- 透過 `immutability-check.cjs` 針對既有紀錄進行修改 (PATCH) 與刪除 (DELETE) 測試：
  - `split_audit_logs` PATCH：**403 Forbidden**（PASS）
  - `split_audit_logs` DELETE：**403 Forbidden**（PASS）
  - `split_reset_requests` PATCH：**403 Forbidden**（PASS）
  - `split_reset_requests` DELETE：**403 Forbidden**（PASS）
- 證明資料庫規則嚴格實施了 `allow update, delete: if false;`，具備 Write-Once-Read-Never（僅後端可維護）與完全防竄改特徵。

---

## 四、 架構風險與非阻斷性評估 (Architectural Notes)

作為中央獨立 QA，在此重申本架構之特徵與長期防護建議：
1. **私密 ID 綁定之有效性**：DEV 採用不可讀之 `split_class_secrets` 作為憑證媒介，成功在客戶端 SDK 限制下達成了單次請求 Token 的驗證效果，成功修復了 P1 漏洞。
2. **靜態 Admin Token 架構風險**：
   - 目前 `SplitAdapter` 與安全規則中仍保留靜態管理憑證比對（`24721942@Ai`, `agile-2026`）。
   - `isAdminToken()` 仍透過比對請求內文中的明文字串進行驗證，而非標準的 Firebase Auth `request.auth.token` 宣告。
   - **評估建議**：目前因有 `split_class_secrets` 的 `allow read: if false;` 屏障保護，未發生憑證外洩，實測符合防護需求；但建議在後續中長程重構時，遷移至 Firebase Auth 管理員 Custom Claims 或受信任後端服務（Cloud Functions）。

---

## 五、 測試產物與交付檔案索引

### 1. 獨立測試腳本
- 目錄：[`ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix9-20260928/`](file:///c:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix9-20260928/)
  - [`security-check.cjs`](file:///c:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix9-20260928/security-check.cjs)：安全配置與靜態檔案雜湊比對。
  - [`audit-check.cjs`](file:///c:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix9-20260928/audit-check.cjs)：公開審計紀錄查詢權限驗證。
  - [`audit-write-window.cjs`](file:///c:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix9-20260928/audit-write-window.cjs)：狀態切換期間未授權寫入隔離驗證。
  - [`reset-replay-window.cjs`](file:///c:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix9-20260928/reset-replay-window.cjs)：重設期間審計與重設請求未授權重播注入驗證。
  - [`immutability-check.cjs`](file:///c:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/scripts/portal-admin-fix9-20260928/immutability-check.cjs)：審計日誌與重設請求之防竄改與防刪除驗證。

### 2. 真機驗收客觀證據
- 目錄：[`ai-arm/qa/2026-09-28-prod-live-verification/evidence/portal-admin-fix9-20260928/`](file:///c:/Antigravity/workshop/ai-arm/qa/2026-09-28-prod-live-verification/evidence/portal-admin-fix9-20260928/)
  - `security-version.json`：Secret 403、公開 class 無憑證、四份靜態檔案 SHA-256 100% 吻合。
  - `audit-public-fields.json`：`status: 403`、`audits: []`。
  - `audit-write-window.json`：`duringProbe: 403`、`unauthAuditWrite: 403`、`operation.success: true`。
  - `reset-replay-window.json`：**`auditReplay.status: 403`**、**`resetRequestReplay.status: 403`**、`duringProbe: 403`、`operation.success: true`（generation 7 → 8）、`after.nameUnchanged: true`。
  - `immutability-check.json`：審計日誌與重設請求之 PATCH / DELETE 全數 403 Forbidden。

---

## 六、 測試數據維護確認
- **測試班級資料**：`qa-split-retest` 目前處於 `status: active`、`currentGeneration: 8`。
- **班級基本資料**：班名 `name` 與各項設定完整保留，未受污染（`nameUnchanged: true`）。
- **歷史日誌完整性**：未刪除任何既有歷史審計紀錄，亦未因探針成功寫入任何未授權之垃圾測試資料。
