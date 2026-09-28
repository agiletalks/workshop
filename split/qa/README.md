# SPLIT 模組專屬 DEV-QA 協同驗收工作區

本目錄為 `split` 需求分解工作坊模組的專屬測試工作區。
嚴格遵守《AgileTalks DEV-QA 協同驗收機制與目錄規範指南》。

---

## 📂 目錄結構規範

每一次測試專案或重要功能重構，均於 `split/qa/` 下建立以「日期-功能主題」命名的獨立資料夾：

```text
split/
└── qa/
    ├── README.md                          # 本規範文件
    │
    ├── YYYY-MM-DD-<topic>/                # 【當前進行中測試專案】
    │   ├── reports/                       # 📌 QA 測試報告 (QA_VERIFICATION_*.md)
    │   ├── dev-responses/                 # 🛠️ DEV 修復回覆與結案報告 (DEV_RESPONSE_*.md)
    │   ├── evidence/                      # 📸 測試佐證 (截圖 *.png, Log *.log, 數據 *.json)
    │   └── retests/                       # 🔄 QA 複測報告 (QA_RETEST_*.md)
    │
    └── archive/                           # 📦 歷史測試紀錄封存
```

---

## 🚦 DEV-QA 協同四部曲

1. **階段 1：QA 初測報告**
   - 建立測試目錄與專用測試班級（如 `qa-split-test-01`，**嚴禁使用正式班級**）。
   - 於 `evidence/` 存放跡證，於 `reports/` 產出初測報告。
2. **階段 2：DEV 修復問題**
   - 研讀報告，依 Bug ID 逐項本機修復。
   - 於 `dev-responses/` 產出修復說明與 Git Commit SHA。
3. **階段 3：QA 複測驗收**
   - 依據 `dev-responses/` 進行複測，於 `retests/` 產出複測報告確認全數 PASS。
4. **階段 4：封存與發布**
   - 打包腳本 `scripts/build-all.js` 已自動忽略 `qa/` 目錄，保證跡證文件保留在 Git 版控中且絕不外洩至生產環境。
