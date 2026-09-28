# 【QA 驗收報告】SPLIT 班級門禁安全校驗與專屬網址綁定驗收 (第 1 輪驗收)

> **任務編號**：`TASK-SPLIT-07`  
> **測試輪次**：R1（第 1 輪全新安全性獨立真機 E2E 驗收）  
> **驗收日期**：2026-09-28  
> **基準 Commit**：`d258b0d`（`d258b0d7162a74a1bb5d96bd70dc904e877db6f0`）  
> **驗收環境**：本地服務 `http://localhost:5000/workshop/split/` + 真實雲端 Firestore 資料庫 `marshmallow-agile-3b4b`  
> **測試班級**：`qa-split-test-01`  
> **測試工具**：Playwright 自動化真機 E2E（Edge Engine）+ Firebase Client SDK  
> **驗收結論**：🟢 **100% 全部通過 (PASS) — 6 大核心安全性場景全數驗證合格，正式結案 (CLOSED)**

---

## 📊 一、 驗收成果總覽

| 場景編號 | 核心驗收場景 | 測試重點與驗收標準 | 實測結果 | 判定 |
| :--- | :--- | :--- | :--- | :--- |
| **TC-GATE-01** | **手動輸入「未開立班級」阻擋** | 1. 未帶參數首頁手動輸入幽靈班級。<br>2. 系統立即以紅字阻擋。<br>3. 顯示引導需由講師於後台開班之警示。<br>4. 絕對不可進入講義。 | **完全合格**：輸入 `random-ghost-class-999` 後送出，系統立即阻擋並顯示 `⚠️ 找不到班級【random-ghost-class-999】。請先由講師於管理後台開立班級，或確認班級專屬網址是否正確。`，Header 數量為 0。 | 🟢 **PASS** |
| **TC-GATE-02** | **專屬網址帶入「不存在班級」阻擋** | 1. 網址注入不存在班級 `?c=not-exist-split-course`。<br>2. 班級代碼欄位呈現鎖定標籤。<br>3. 送出後依然被嚴格阻擋。 | **完全合格**：班級代碼欄位自動呈現綠色鎖定標記與 `（專屬網址帶入）`，無法任意編輯；送出後嚴格阻擋並提示找不到班級。 | 🟢 **PASS** |
| **TC-GATE-03** | **真實班級正常進班測試** | 1. 使用有效開立班級 `qa-split-test-01`。<br>2. 輸入正確密碼 `split-2026`。<br>3. 順利進入講義畫面並呈現班級標籤。 | **完全合格**：通過驗證順利進入，頂部工具列正確顯示 `qa-split-test-01 · Gen 1`，講義教材與面板功能完整。 | 🟢 **PASS** |
| **TC-GATE-04** | **專屬網址代碼「鎖定防護」** | 1. 透過 `?c=班級代碼` 進班。<br>2. 班級代碼欄位不可為可編輯之 `<input>`。<br>3. 需為專屬網址帶入鎖定狀態。 | **完全合格**：DOM 檢查證實可編輯輸入框數量為 0，替換為專屬綠色鎖定標記容器，杜絕學員誤改。 | 🟢 **PASS** |
| **TC-GATE-05** | **密碼錯誤阻擋驗收** | 1. 真實班級輸入錯誤密碼 `wrong-pass-123`。<br>2. 系統阻擋並提示專屬驗證密碼不符。<br>3. 無法進入講義。 | **完全合格**：輸入錯誤密碼送出後，系統立即阻擋並提示 `⚠️ 驗證密碼不符，請輸入此班級專屬之驗證密碼`，Header 數量為 0。 | 🟢 **PASS** |
| **TC-GATE-06** | **在線停用即時踢退與重複登入阻擋** | 1. 學員在線狀態下，後台切換班級狀態為 `inactive`。<br>2. 學員端 1~2 秒內自動清除 session 並踢回門禁。<br>3. 嘗試重新登入停用班級，系統阻擋提示停用。 | **完全合格**：狀態變更後，學員端於 **1,521 ms** 內由 Firestore 即時監聽觸發自動踢退回門禁；再次登入被阻擋並提示 `⚠️ 班級【qa-split-test-01】目前處於停用狀態，暫停開放學員進入。`；測試完畢已安全還原班級為 `active`。 | 🟢 **PASS** |

---

## 🧪 二、 核心測試場景詳細實測紀錄

### 1. 【TC-GATE-01】隨意輸入「未開立班級」阻擋測試（手動輸入）
- **測試步驟**：
  1. 以全新無 Session 瀏覽器開啟首頁：`http://localhost:5000/workshop/split/`（無 query 參數）。
  2. 檢查班級代碼輸入框為可編輯狀態，預設 placeholder 為 `請輸入講師於後台開立之班級代碼（例如：202610-split）`。
  3. 輸入幽靈班級代碼：`random-ghost-class-999`。
  4. 密碼填入：`split-2026`，點擊 `進入工作坊講義與小組筆記 →`。
- **實測數據與證據**：
  - **系統回饋**：`⚠️ 找不到班級【random-ghost-class-999】。請先由講師於管理後台開立班級，或確認班級專屬網址是否正確。`
  - **防護驗證**：講義 Header 數量 `0`，投影片內容數量 `0`，門禁嚴防未開立幽靈班級。
- **佐證截圖**：
  - [`01_ghost_class_manual_input_blocked.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-gate-security-and-url-lock/evidence/01_ghost_class_manual_input_blocked.png)
- **判定**：🟢 **PASS**

---

### 2. 【TC-GATE-02】專屬網址帶入「不存在班級」阻擋測試（URL 注入）
- **測試步驟**：
  1. 在網址列直接注入不存在之假班級：`http://localhost:5000/workshop/split/?c=not-exist-split-course`。
  2. 檢驗門禁介面班級代碼欄位型態。
  3. 輸入密碼 `split-2026` 並點擊送出。
- **實測數據與證據**：
  - **欄位鎖定**：`input[placeholder*="202610-split"]` 數量為 `0`，成功轉化為鎖定標籤並標註 `（專屬網址帶入）`。
  - **阻擋訊息**：`⚠️ 找不到班級【not-exist-split-course】。請先由講師於管理後台開立班級，或確認班級專屬網址是否正確。`
  - **防護驗證**：完全阻斷 URL 參數偽造進班路徑。
- **佐證截圖**：
  - [`02_url_injected_ghost_class_blocked.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-gate-security-and-url-lock/evidence/02_url_injected_ghost_class_blocked.png)
- **判定**：🟢 **PASS**

---

### 3. 【TC-GATE-04】專屬網址代碼「鎖定防護」驗收
- **測試步驟**：
  1. 使用專屬網址進入：`http://localhost:5000/workshop/split/?c=qa-split-test-01`。
  2. 檢視班級代碼欄位之 DOM 結構與文字樣式。
- **實測數據與證據**：
  - **DOM 屬性**：無任何可編輯 `<input>` 元素。
  - **UI 呈現**：呈現深色背景、翠綠色邊框、動態綠點與文字 `qa-split-test-01（專屬網址帶入）`。
- **佐證截圖**：
  - [`04_url_class_code_locked_badge.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-gate-security-and-url-lock/evidence/04_url_class_code_locked_badge.png)
- **判定**：🟢 **PASS**

---

### 4. 【TC-GATE-05】密碼錯誤阻擋驗收
- **測試步驟**：
  1. 針對真實班級 `qa-split-test-01`，故意輸入錯誤密碼 `wrong-pass-123`。
  2. 點擊送出。
- **實測數據與證據**：
  - **阻擋訊息**：`⚠️ 驗證密碼不符，請輸入此班級專屬之驗證密碼`。
  - **防護驗證**：密碼未通過 SHA-256 雜湊比對，阻擋於門禁外，無法取得合法 UserSession。
- **佐證截圖**：
  - [`05_wrong_password_blocked.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-gate-security-and-url-lock/evidence/05_wrong_password_blocked.png)
- **判定**：🟢 **PASS**

---

### 5. 【TC-GATE-03】後台開立之「真實班級」正常進班測試
- **測試步驟**：
  1. 訪問專屬網址 `http://localhost:5000/workshop/split/?c=qa-split-test-01`。
  2. 選擇第 1 組、輸入學員姓名 `QA-小明`、輸入正確通行密碼 `split-2026`。
  3. 點擊進入工作坊。
- **實測數據與證據**：
  - **進班結果**：成功進入講義，頂部 Header 完整顯示 `qa-split-test-01 · Gen 1`。
  - **教材加載**：28 頁（含自訂任務）教材、小組白板按鈕、隨堂筆記面板均正常渲染運作。
- **佐證截圖**：
  - [`03_valid_class_login_success.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-gate-security-and-url-lock/evidence/03_valid_class_login_success.png)
- **判定**：🟢 **PASS**

---

### 6. 【TC-GATE-06】後台停用班級（Inactive）即時防護與在線踢退測試
- **測試步驟**：
  1. 學員成功登入 `qa-split-test-01` 並停留於講義畫面。
  2. 管理員透過持有短期管理員租約（`split_class_secrets`）發起 `toggleClassStatus`，將班級 `status` 修改為 `inactive`。
  3. 監控學員瀏覽器端即時反應與被踢退時間。
  4. 驗證被踢回門禁後，Session 與 LocalStorage 快取是否已清除。
  5. 於門禁重新嘗試輸入正確密碼 `split-2026` 登入該停用班級。
  6. 測試完成後，立即將班級狀態安全還原為 `active`。
- **實測數據與證據**：
  - **在線在線踢退反應時間**：從 Firestore 寫入到學員頁面退回門禁，耗時僅 **1,521 ms**（極速響應，小於 2 秒指標）。
  - **快取清理**：`localStorage.getItem('split_user_session')` 已被強制清除，防止按上一頁旁路。
  - **停用登入阻擋**：重新嘗試登入時，系統阻擋並顯示 `⚠️ 班級【qa-split-test-01】目前處於停用狀態，暫停開放學員進入。`。
  - **環境還原**：驗證完畢後已藉由租約將班級還原為 `active`，雲端資料庫狀態乾淨如初。
- **佐證截圖**：
  - 在線正常狀態：[`06_online_before_deactivation.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-gate-security-and-url-lock/evidence/06_online_before_deactivation.png)
  - 即時踢退至門禁：[`06_kicked_out_to_gate.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-gate-security-and-url-lock/evidence/06_kicked_out_to_gate.png)
  - 停用登入被阻擋：[`06_inactive_login_blocked.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-gate-security-and-url-lock/evidence/06_inactive_login_blocked.png)
- **判定**：🟢 **PASS**

---

## 📁 三、 驗收證據清冊與資產索引

本次驗收所有自動化腳本、測試資料與真機截圖均已完整存放於工作區：

```text
split/qa/2026-09-28-split-gate-security-and-url-lock/
├── QA_BRIEF_GATE_SECURITY_URL_LOCK.md          # 需求驗收委託書
├── scripts/
│   └── e2e-gate-security.cjs                   # Playwright 自動化 E2E 測試腳本
├── evidence/
│   ├── test-summary.json                       # 測試指標總結 JSON (allPass: true)
│   ├── 01_ghost_class_manual_input_blocked.png # 測試 1：手動輸入幽靈班級阻擋截圖
│   ├── 02_url_injected_ghost_class_blocked.png # 測試 2：網址注入假班級鎖定與阻擋截圖
│   ├── 03_valid_class_login_success.png        # 測試 3：真實開立班級成功進班截圖
│   ├── 04_url_class_code_locked_badge.png      # 測試 4：專屬網址班級代碼鎖定標記截圖
│   ├── 05_wrong_password_blocked.png           # 測試 5：錯誤密碼阻擋截圖
│   ├── 06_online_before_deactivation.png       # 測試 6：學員在線正常狀態截圖
│   ├── 06_kicked_out_to_gate.png               # 測試 6：停用後 1.5 秒即時踢退回門禁截圖
│   └── 06_inactive_login_blocked.png           # 測試 6：再次登入停用班級被阻擋截圖
└── reports/
    └── QA_VERIFICATION_R1_gate_security_url_lock_d258b0d_20260928.md # 本正式驗收報告
```

---

## 🏆 四、 最終結論與結案簽核

本輪次針對 DEV 交付之【SPLIT 班級門禁安全校驗與專屬網址綁定】（`d258b0d`），經中央獨立 QA 以 Playwright 真機端到端搭配雲端 Firestore 實測：
1. **徹底杜絕幽靈班級**：無論手動輸入或 URL 參數注入，未在後台開立之班級代碼一律 100% 阻擋於門禁之外。
2. **防手滑防竄改**：專屬網址進入時代碼自動呈現綠色鎖定標記，保障現場學員不誤填或竄改。
3. **即時安全控管**：班級停用後，在線學員於 **1.5 秒內被即時踢退**並清除 session，門禁即時阻擋停用班級重新登入。

**驗收結論**：🟢 **全部通過 (PASS)**，正式簽核結案。
