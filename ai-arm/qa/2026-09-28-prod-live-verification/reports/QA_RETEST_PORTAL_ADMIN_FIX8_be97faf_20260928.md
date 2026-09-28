# 中央管理後台第八輪複測

- 日期：2026-09-28，15:28–15:30（Asia/Taipei）。
- 對應：DEV_FIX_RESPONSE_PORTAL_ADMIN_20260928.md 第八輪回覆。
- **結果：9 PASS、2 FAIL；整體管理授權不能結案。**
- BUG-07 原班名探針維持通過。BUG-08 原 toggle 探針通過，但 reset 情境仍可未登入注入 audit，維持 OPEN。另新增 BUG-PORTAL-RETEST-09（P1）：未登入可注入 reset request。

## 環境與版本

Repo HEAD：be97fafd8a5564b8ee13b4ce6a7077d4358a7001，測試目前帶本機修改的工作目錄，不是純 HEAD。Localhost Port 5000 的 portal、admin、adapter、SPLIT index 均 HTTP 200，SHA-256 與磁碟相符（security-version.json）。

使用真正 Firestore `marshmallow-agile-3b4b`，僅操作 `qa-split-retest`。使用 Firebase client SDK 與原始 SplitAdapter，沒有 Admin SDK。這是 API／adapter 整合複測，不是瀏覽器 UI 回歸。

## 檢查結果

| 項目 | 結果 | 證據 |
|---|---|---|
| Secret 未登入讀取 | PASS | 403 |
| Public class 無 adminToken／租約三欄位 | PASS | 欄位清單、publicLeaseFields=[] |
| 閒置原班名 PATCH | PASS | 403 |
| Audit 未登入查詢 | PASS | 403 |
| 合法原狀態 toggle | PASS | success:true，仍 active |
| toggle／reset 提交後的原班名 PATCH | PASS | 均 403 |
| toggle 期間原 QA audit 探針 | PASS | 403，未建立文件 |
| 合法 reset | PASS | generation 5→6，success:true |
| 釋放後原班名 PATCH | PASS | 403 |
| reset 提交後未登入 audit 寫入（合規格式） | **FAIL / BUG-08** | **200** |
| reset 提交後未登入 reset request 寫入 | **FAIL / BUG-09** | **200** |

## BUG-08 未完整修復：公開時間戳記可用於 audit 寫入

- 優先級 P1：審計紀錄可被未授權來源注入。
- 原 toggle、非業務 type 探針確實已被阻擋，但這不等同 audit 的請求者授權已完成。
- 新測試在 resetClass 合法交易提交後、releaseWriteLease 前，以未登入 GET 讀取公開 `split_classes/qa-split-retest.updatedAt`。
- 把該值作為 audit 的 timestamp，使用規則允許的 CLASS_RESET_GENERATION 與七個合法欄位，再以無 Authorization 的 REST PATCH 建立 QA 文件。
- 實際 HTTP 200；探針沒有取得 secret，也沒有使用 acquireWriteLease 回傳值或擷取管理 SDK 請求。時間戳記完全來自公開班級文件。

## BUG-09：未登入者可建立冪等性重設請求

- 優先級 P1：重設請求紀錄可被未授權來源建立，削弱冪等性紀錄可信度。
- 同一窗口，以公开 updatedAt 作為 createdAt；指定一致的文件 ID 與 clientRequestId，附帶 classId、generation、reason 五個合法欄位。
- 未登入 PATCH `split_reset_requests/<QA ID>` 得到 HTTP 200。
- 本輪僅證明可建立偽造紀錄，未測試碰撞既有 requestId、篡改其他紀錄或誘發管理員後續錯誤。

## 重現流程與根因

可直接執行 scripts/portal-admin-fix8-20260928/reset-replay-window.cjs（會再執行一次專用 QA 班合法重設並留下明確標記的 QA 探針）。

1. 讀取 qa-split-retest 班名、狀態與原世代。
2. 在獨立 QA adapter 實例包裝 releaseWriteLease：先執行探針，再於 finally 執行原 release；產品程式不變。
3. 呼叫原 resetClass，使用唯一 QA requestId 與 QA 原因。
4. release 前以獨立未登入 fetch 讀取公開 class.updatedAt 和 currentGeneration。
5. 分別提交上述合法格式的 audit 與 reset request；兩者均 HTTP 200。
6. finally 釋放租約，驗證原班名 PATCH 回到 403。

**根因**：targetUpdatedAt 在 secret 雖不可讀，但合法提交會把相同值存入公開 class.updatedAt。新規則只是驗證公開資料值與格式，沒有驗證請求者。白名單可以限制格式，無法證明來源是管理員。與 DEV 所稱「外部未登入者無法得知未公開時間戳記」不符。

這是受控延後 release 的真實雲端測試，不聲稱自然 UI 競速的成功率；測試重現合法提交後尚未釋放的有效窗口，沒有修改或替代 Security Rules。

## 修正要求

請將管理授權改為受信任的身分驗證與角色授權（如 Firebase Auth 的管理員權限，或受信任後端 API）。審計由可信服務產生，重設請求需綁定已授權管理員與操作，而非用公開時間戳記作為通行條件。

本輪仍可在 adapter 看到預設靜態管理 token；secret write 的 isAdminToken 仍檢查提交資料中的 token，非 request.auth。這是此前已提示的架構風險，本輪沒有新增 secret 寫入攻擊測試，不列為本轮額外實測 FAIL。建議修復時統一處理，而非只增加 type 或欄位條件。

## 資料與交付

- 合法重設原因：QA 第八輪：重設提交後授權隔離複測。
- 最終 active、generation=6、nameUnchanged=true，租約已釋放，未刪除歷史筆記、白板、附件。
- 未授權測試各保留一筆於 split_audit_logs 和 split_reset_requests，文件 ID 同為 `qa-fix8-replay-1790580576777`，reason 明確寫明 QA authorization probe ONLY; not an additional reset。不代表發生第二次重設。
- 原 toggle 探針 403，沒有新增其測試文件。先前輪次證據／測試文件未刪除。
- 證據：../evidence/portal-admin-fix8-20260928/，包含 security-version.json、audit-public-fields.json、audit-write-window.json、reset-replay-window.json。
- 腳本：../scripts/portal-admin-fix8-20260928/；預設输出 C:/VIBE/ai-arm/qa-portal-fix8-20260928/。
- 未重跑瀏覽器門禁、session、學生密碼、restore、16 項 DEV 套件；不列入本輪 PASS。釋放後僅重測 class 原值 PATCH，未宣稱兩個 replay payload 均做了釋放後測試。
- 未修改產品原始碼、未 pull/push、未部署、未恢復監聽、未發訊 DEV。
