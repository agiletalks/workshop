# AI-ARM 模組專屬 QA 與研發協同測試工作區

本目錄為 `ai-arm` 工作坊模組的專屬測試工作區。每個 Workshop 子專案（如 `ai-arm`、`ai-align`、`marshmallow`）各自擁有獨立的 `qa/` 目錄，彼此完全隔離、互不干擾。
此外，打包腳本已將 `qa/` 列為忽略項目，保證所有測試報告與截圖絕不會被打包至正式發布版本（`dist/`）。

---

## 📂 目錄結構規範

每一次測試專案或重要功能重構，均於 `ai-arm/qa/` 下建立以「日期-功能主題」命名的獨立資料夾：

```text
ai-arm/
├── index.html                             # 產品前端頁面
├── admin.html
├── board.html
│
└── qa/                                    # 🌟 AI-ARM 專屬測試工作區（build-all 自動忽略）
    ├── README.md                          # 本規範文件
    │
    ├── 2026-09-27-instructor-voice-notes/  # 【當前進行中】隨堂講義與 MECE 便籤重構
    │   ├── reports/                       # 📌 QA 測試報告 (QA_RETEST_*.md, QA_REAL_VOICE_*.md)
    │   ├── dev-responses/                 # 🛠️ DEV 修復回覆與結案報告 (DEV_FIX_*.md, DEV_CLOSURE_*.md)
    │   ├── evidence/                      # 📸 測試佐證 (截圖 *.png, 逐字稿快照 *.txt, 數據 *.json)
    │   └── scripts/                       # 🤖 QA 自動化與隔離驗證腳本 (*.cjs, *.js)
    │
    └── archive/                           # 📦 歷史測試紀錄封存
        ├── 2026-09-22-initial-workshop/   # 初版工作坊與跟隨模式測試
        └── 2026-09-23-voice-notes-v1/     # 語音重點筆記初版驗證
```

---

## 📝 檔案放置與命名約定

### 1. QA 測試報告 (`reports/`)
- **命名規則**：`QA_<輪次/類型>_<commit/標記>_<YYYYMMDD>.md`
- **範例**：
  - `QA_RETEST_cd1cdea_20260927.md`
  - `QA_RETEST_270d007_20260927.md`
  - `QA_REAL_VOICE_20260927.md`

### 2. DEV 修復與回覆 (`dev-responses/`)
- **命名規則**：`DEV_<FIX|RESPONSE|CLOSURE>_<commit/標記>_<YYYYMMDD>.md`
- **範例**：
  - `DEV_FIX_REPORT_20260927.md`
  - `DEV_RESPONSE_270d007_20260927.md`
  - `DEV_CLOSURE_c6d6ed9_20260927.md`

### 3. 測試佐證資料 (`evidence/`)
- 所有截圖（`.png`）、控制台輸出快照（`.txt`）、測試斷言數據（`.json`）請統一放入此處，避免散落在各處。
- **範例**：
  - `QA_cd1cdea_student.png`
  - `QA_real_voice_20260927.txt`
  - `QA_c6d6ed9_fallback-evidence.json`

### 4. 驗證腳本 (`scripts/`)
- QA 自行編寫的隔離驗證腳本、單元測試請集中存放於此。
- **範例**：
  - `qa_fallback_4294a45.cjs`

---

## 🎯 核心效益
1. **零打包污染**：`npm run build` 或 `node scripts/build-all.js` 僅處理產品目錄，測試截圖與報告絕不會被打包進正式 `dist/`。
2. **脈絡完整可追溯**：同一輪測試的 QA 發現、DEV 修復、重測證據在同一主題資料夾下一目了然。
3. **歷史整潔封存**：完成之測試主題可整包歸入 `archive/`，隨時查閱。
