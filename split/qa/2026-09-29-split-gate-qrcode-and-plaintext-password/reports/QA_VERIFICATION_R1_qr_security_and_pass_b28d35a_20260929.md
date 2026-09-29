# 【中央獨立 QA 驗收報告】TASK-SPLIT-10：投影畫面 QR Code 旁路直通修復與學員密碼明文輸入驗收 (R1)

> **報告編號**：`QA-VERIF-SPLIT-QR-SECURITY-PASS-b28d35a-20260929-R1`  
> **任務編號**：`TASK-SPLIT-10`（投影畫面 QR Code 旁路直通修復與學員密碼明文輸入驗收）  
> **驗收工程師**：AgileTalks 中央獨立 QA 驗收工程師團隊  
> **基準 Commit**：`b28d35a` (`feat(split): URL sanitization on instructor entry, big screen QR modal, and plaintext passcode input (TASK-SPLIT-10)`)  
> **測試分支**：`main`  
> **驗收環境**：本機端（`http://localhost:5000/workshop/split/` 與 `http://localhost:5000/workshop/admin.html`）+ Google Cloud Firestore (`marshmallow-agile-3b4b`)  
> **測試班級**：`qa-split-test-01` (Active 啟用狀態)  
> **測試工具**：Playwright E2E 多視窗自動化 (Edge Headless) + 權限探針 + 瀏覽器歷史堆疊狀態校驗  
> **驗收日期**：2026-09-29  
> **最終判定**：🟢 **驗收通過 (100% PASS - 正式結案)**

---

## 📊 驗收總覽與測試指標

| 測試場景代碼 | 驗收核心場景 | 預期指標 | 真機 E2E 實測紀錄 | 判定 |
| :---: | :--- | :--- | :--- | :---: |
| **TC-01** | **講師進班網址列即時脫敏** | 通過驗證後即刻以 `replaceState` 抹除敏感參數，網址列僅保留 `?c=班級代碼` | 進入後立即完成脫敏，`role=false`, `adm=false`, `admin=false`, `r=false`，保留 `?c=qa-split-test-01` | 🟢 PASS |
| **TC-02** | **大螢幕學生報到 QR Code 彈窗** | 頂部列點擊按鈕彈出高對比大尺寸 QR Code，展示班級代碼、進班密碼與純淨網址 | 成功生成 Base64 PNG QR Code，顯示大字體代碼與密碼 `split-2026`，學員網址絕無憑證洩漏 | 🟢 PASS |
| **TC-03** | **防直通漏洞攔截測試 (核心)** | 模擬學生手機掃描講師投影畫面網址，新無痕視窗必須被門禁強制攔截 | 無痕視窗造訪純淨網址被 PasswordGate 嚴密攔截，無講師標籤、無免密旁路通道 | 🟢 PASS |
| **TC-04** | **學員密碼明文輸入體驗** | 密碼欄位改為 `type="text"`，具備明文提示，輸入 `split-2026` 順暢登入 | 欄位呈現為 `type="text"`，等寬字體與提示就緒，明文鍵入後成功登入學生講義視圖 | 🟢 PASS |
| **TC-05** | **中央管理後台 QR Code 投影** | `admin.html` 班級卡片具備 QR Code 按鈕，點擊彈出高解析度 Canvas 投影視窗 | 成功點開班級卡片 QR Code 彈窗，Canvas 繪製正常，純淨學員專屬網址生成無誤 | 🟢 PASS |

---

## 🔍 5 大核心驗收場景詳細實測紀錄

### 🧪 場景 1 (TC-01)：講師進班網址列即時脫敏
- **測試重點**：
  1. 模擬講師點擊後台直通連結 `?c=qa-split-test-01&role=instructor&adm=agile-2026#/module/P/slide/1`。
  2. 驗證進入後講師工具列與 TopBar 正常掛載。
  3. 檢驗瀏覽器網址列是否在毫秒級自動抹除 `role`、`adm`、`admin`、`r` 參數。
- **實測紀錄**：
  - 講師身分順利驗證通過，TopBar 成功渲染出 `📱 學生報到 QR` 按鈕。
  - 網址列即時脫敏為：`http://localhost:5000/workshop/split/?c=qa-split-test-01#/module/E/slide/1`。
  - URL Query 檢查：`role: false`, `adm: false`, `admin: false`, `r: false`, `c: qa-split-test-01`。
- **截圖存證**：
  - 📸 [`evidence/tc01_instructor_url_sanitized.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/tc01_instructor_url_sanitized.png)

---

### 🧪 場景 2 (TC-02)：大螢幕學生報到 QR Code 彈窗
- **測試重點**：
  1. 講師點擊頂部列 `[📱 學生報到 QR]` 按鈕。
  2. 驗證大螢幕投影專用視窗彈出，具備高對比度白底 QR Code（`QRCode.toDataURL`）。
  3. 驗證展示之班級代碼、進班密碼及學員進班專屬連結。
- **實測紀錄**：
  - 視窗成功彈出，載入標頭包含「課堂學員報到 QR Code」與「大螢幕投影專用」標章。
  - QR Code 成功產出 High Error Correction（`errorCorrectionLevel: H`）之 Base64 PNG（長度 8014 字元）。
  - 投影卡片展示：班級代碼 `qa-split-test-01`（琥珀色大字）、進班密碼 `split-2026`（祖母綠大字）。
  - 學員進班專屬連結嚴格採用白名單重構：`http://localhost:5000/workshop/split/?c=qa-split-test-01`，絕無任何憑證代碼。
- **截圖存證**：
  - 📸 [`evidence/tc02_student_qr_modal_projection.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/tc02_student_qr_modal_projection.png)

---

### 🧪 場景 3 (TC-03)：防直通漏洞攔截測試（核心）
- **測試重點**：
  1. 模擬學員使用個人手機或全新無痕瀏覽器，造訪講師投影畫面上的 QR Code 或複製網址（`http://localhost:5000/workshop/split/?c=qa-split-test-01`）。
  2. 驗證是否被門禁防線強制阻斷，杜絕旁路入侵。
- **實測紀錄**：
  - 全新無痕上下文訪問後，PasswordGate 立即阻斷並呈現「SPLIT 需求拆解實戰工作坊」登入卡片。
  - 斷言檢查：學員無講師徽章（`isInstructor: false`）、無講師工具列（`hasQrBtn: false`）。
  - 未經密碼校驗前，完全無法讀取講義與後台操作。
- **截圖存證**：
  - 📸 [`evidence/tc03_bypass_interception_gate.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/tc03_bypass_interception_gate.png)

---

### 🧪 場景 4 (TC-04)：學員密碼明文輸入體驗
- **測試重點**：
  1. 檢查門禁介面中的密碼輸入框屬性（是否已由 `type="password"` 改為 `type="text"`）。
  2. 檢查是否有防誤觸輔助說明文字。
  3. 鍵入密碼並送出表單，驗證學員身分順暢進班。
- **實測紀錄**：
  - 欄位屬性確認：`type="text"`, `autoComplete="off"`, `autoCorrect="off"`, `spellCheck=false`。
  - 視覺樣式具備等寬字體與字距拉寬（`font-mono tracking-wider text-emerald-400`），並清楚標註「（明文顯示，方便確認打字）」。
  - 鍵入 `split-2026` 完整可見，點擊送出後 100% 成功驗證並載入工作坊講義，學員姓名「QA-小明」正確顯示。
- **截圖存證**：
  - 📸 [`evidence/tc04_plaintext_passcode_input.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/tc04_plaintext_passcode_input.png)

---

### 🧪 場景 5 (TC-05)：中央管理後台 QR Code 投影
- **測試重點**：
  1. 開啟中央後台 `admin.html`。
  2. 檢驗班級列表卡片之 `[QR Code]` 操作按鈕。
  3. 驗證彈窗呼叫 `QRCode.js` 繪製、班級代碼展示與複製功能。
- **實測紀錄**：
  - 點擊卡片 `[QR Code]` 按鈕後，`#qrcode-modal` 順利浮現。
  - Canvas 繪製 220x220 高解析度二維碼。
  - 顯示之學員網址純淨合規，無任何後台管理 token 殘留。
- **截圖存證**：
  - 📸 [`evidence/tc05_admin_qr_code_modal.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/tc05_admin_qr_code_modal.png)

---

## 📁 驗收資產與證據清單

1. **需求委託書**：
   - 📄 [`split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/QA_BRIEF_QR_SECURITY_AND_PASS.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/QA_BRIEF_QR_SECURITY_AND_PASS.md)
2. **真機 Playwright 測試腳本**：
   - 📜 [`split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/scripts/e2e-qr-security-and-pass.cjs`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/scripts/e2e-qr-security-and-pass.cjs)
3. **測試數據彙整摘要**：
   - 📊 [`split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/test-summary.json`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/test-summary.json)
4. **5 大核心場景截圖存證 (`evidence/`)**：
   - 📸 [`tc01_instructor_url_sanitized.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/tc01_instructor_url_sanitized.png) - TC-01: 講師網址列脫敏後之純淨網址與介面
   - 📸 [`tc02_student_qr_modal_projection.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/tc02_student_qr_modal_projection.png) - TC-02: 講師端大螢幕學員報到 QR 投影視窗
   - 📸 [`tc03_bypass_interception_gate.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/tc03_bypass_interception_gate.png) - TC-03: 無痕學員端掃描脫敏網址後被門禁強制攔截
   - 📸 [`tc04_plaintext_passcode_input.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/tc04_plaintext_passcode_input.png) - TC-04: 學員端進班門禁密碼明文輸入體驗
   - 📸 [`tc05_admin_qr_code_modal.png`](file:///c:/Antigravity/workshop/split/qa/2026-09-29-split-gate-qrcode-and-plaintext-password/evidence/tc05_admin_qr_code_modal.png) - TC-05: 中央管理後台 QR Code 投影彈窗
5. **任務看板狀態**：
   - 📋 已於 [`split/qa/CURRENT_QA_TASKS.md`](file:///c:/Antigravity/workshop/split/qa/CURRENT_QA_TASKS.md) 將 `TASK-SPLIT-10` 標記為 🟢 **驗收通過 (CLOSED)**。

---

## 🏁 結論與結案判定

本次交付之【投影畫面 QR Code 旁路直通修復與學員密碼明文輸入驗收】（Commit: `b28d35a`）經中央獨立 QA 團隊真機多視窗高標準實測，確認：
1. **網址即時脫敏機制（URL Sanitization）**精準可靠，進班瞬間立即清洗免密參數，徹底解除大螢幕投影產碼洩漏漏洞。
2. **大螢幕學生報到 QR Code 彈窗**無論在講義講師端或中央管理後台皆運作正常，投影字體清晰，網址嚴格遵循純學員白名單。
3. **安全邊界防護嚴密**，無痕學員端訪問脫敏網址百分之百被門禁攔截，無特權穿透風險。
4. **密碼明文輸入體驗**提升了現場打字正確率，降低課堂挫折感，驗證登入順暢。

**判定：🟢 驗收通過 (CLOSED - 100% PASS)**
