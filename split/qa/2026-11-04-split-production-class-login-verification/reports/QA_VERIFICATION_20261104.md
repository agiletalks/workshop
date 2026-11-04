# 📋 正式班級極簡登入與跨裝置操作驗收

- **任務編號**：TASK-SPLIT-PROD-202611
- **測試日期**：2026-11-04（Asia/Taipei）
- **負責 QA**：Codex
- **標的**：https://agiletalks-workshop.web.app/workshop/split/?c=202611-split
- **班級**：跨部門需求共識術 / 202611-split / Gen 1
- **程式碼基準**：`41ddc47f3832c56adb4ff5de996b13055343c1ef`；`git pull --ff-only` 回覆 Already up to date。此 SHA 是本機來源基準，未獨立證明正式部署 SHA。
- **設備**：本機 Windows PC，Chrome 156.0.8078.76、Edge 156.0.4314.58。硬體型號查詢遭系統拒絕，未確認。
- **手機測試性質**：桌面瀏覽器 viewport 390×844、844×390；不是 iOS / Android 真機，不涵蓋觸控鍵盤、Safari、背景分頁生命週期。
- **總結**：本輪不可簽核全數通過。登入與重整保留已驗證；組別選單與 RWD 有缺陷，筆記上傳前置條件不足，手機真機與 2 秒登入門檻待補驗。

## 🎯 驗收項目清單

| 編號 | 驗收情境 | 測試設備/瀏覽器 | 預期結果 | 實測判定 | 備註說明 / 截圖檔名 |
| :---: | :--- | :--- | :--- | :---: | :--- |
| TC-01 | 電腦版專屬連結登入 | Windows Chrome / Edge | 自動帶入鎖定班級，組別 1～6，2 秒內進班 | PARTIAL | 班級為不可編輯文字、密碼明文、第 1 組登入成功；登入前提供 12 組，見 BUG-01。Chrome 首次操作與觀測 1568ms 時仍驗證中，稍後成功，未取得精確完成時間。2 秒門檻未證實。login-pc.jpg、login-groups-dom.txt |
| TC-02 | 手機版極速登入 | Edge 390×844 模擬 | 手機無跑版、一鍵登入 | BLOCKED（真機） | 模擬登入成功，click 至功能選單 visible 的自動化端到端上界為 2655ms（包含工具往返，不能等同網站純延遲，也不能據此判定網站超時）。login-mobile-emulated.jpg |
| TC-03 | 重整防踢出 | Chrome PC、Chrome/Edge 390×844 模擬 | 第 3～5 頁重整後仍登入並停留原頁 | PASS（已測範圍） | Chrome 第 3、5 頁與兩瀏覽器手機尺寸第 5 頁均保留；使用瀏覽器 reload，未實按 F5；手機切換背景分頁後重整待真機。refresh-pc-p03.jpg、refresh-pc-p05.jpg、refresh-mobile-p05-emulated.jpg、edge-mobile-refresh-p05-emulated.jpg |
| TC-04 | 手機 RWD 與導航 | Chrome 390×844 / 844×390 模擬 | 直橫向完整、底部切換與目錄正常 | FAIL（模擬） | 直向簡報/筆記切換、目錄開合可用；橫向右側頂列遭裁切；直向功能選單底部被導航遮擋，見 BUG-02/03。真機待補驗。 |
| TC-05 | 隨堂筆記、圖片/外鏈、就地同步 | Chrome PC / 手機尺寸 | 可編輯及交付並免重整同步 | BLOCKED（筆記）；PASS（同步 UI） | 27 張目錄未出現演練頁；第 3、5 頁無學員輸入或上傳入口。附件頁顯示講師未提供附件。點 🔄 後出現「✅ 目錄已就地同步完成」，仍第 3 頁與原身分，未觀察到整頁重載；未用網路追蹤獨立證明 document 無重載，亦無新增任務可驗證同步內容。sync-pc.jpg、mobile-notes-emulated.jpg |

PARTIAL / BLOCKED 明確區別尚未完成的驗證，不以 FAIL 假稱產品失敗，也不以 PASS 代替未測真機。

## 📸 測試跡證與日誌

所有檔案在 `../evidence/`；瀏覽器原生截圖為 JPEG，保留 `.jpg`，未改副檔名冒充 PNG。

- `login-pc.jpg`：Edge 首次登入頁。
- `login-groups-dom.txt`：首次登入選項第 1～12 組。
- `login-mobile-emulated.jpg`：390×844 明文密碼與班級登入頁（含本次委託提供的班級密碼）。
- `refresh-pc-p03.jpg`、`refresh-pc-p05.jpg`：電腦重整成功。
- `refresh-mobile-p05-emulated.jpg`、`edge-mobile-refresh-p05-emulated.jpg`：手機尺寸重整成功。
- `edge-mobile-refresh-dom.txt`：重整後第 5 頁及組別 DOM。
- `mobile-portrait-emulated.jpg`、`mobile-notes-emulated.jpg`：直向簡報及筆記。
- `mobile-landscape-emulated.jpg`：844×390 頂列裁切。
- `mobile-menu-clipped-emulated.jpg`：390×844 功能選單底部受遮擋。
- `sync-pc.jpg`：就地同步狀態截圖；完成文字另由實測 DOM 觀測確認。

## 📝 缺陷與受阻項目

### BUG-01 / P2：登入前組別選單不符合正式班級 6 組設定

1. 未登入的 Chrome / Edge 打開專屬連結。
2. 班級固定為 202611-split，但組別包含第 1～12 組。
3. 第 1 組登入成功後，頂列只剩第 1～6 組。

預期登入前即只提供 1～6 組。兩瀏覽器皆重現。未提交第 7～12 組，不能宣稱後端接受未開放組別。

### BUG-02 / P2：橫向 844×390 顯示桌面頂列，右側功能超出視窗

Chrome 登入後將 viewport 從 390×844 切為 844×390，頂列切為桌面布局，右側列印等控制項被裁切。參見 mobile-landscape-emulated.jpg。需 DEV 確認中間寬度斷點及頂列最小寬度。

### BUG-03 / P2：直向功能選單底部受底部導覽遮擋

Chrome 390×844 第 5 頁 → 開啟功能選單。畫面只完整露出小組白板及列印按鈕，重新報到項目未完整可見。依 DOM 按下「切換登入身分 / 重新報到」後仍留原登入狀態，底層筆記分頁反而切換。截圖與行為支持遮擋問題；點擊投遞原因尚未確定，請 DEV 複核疊層與 safe-area。

### BLOCK-01：正式班級缺少可供驗證的團隊演練頁

就地同步前後目錄均為 27 張一般投影片，未發現團隊演練頁。第 3、5 頁無筆記輸入或成果上傳入口；本機 WorkbookPanel.tsx 的「小組成果筆記」頁籤受 `isTask` 條件控制，與 UI 現象一致（來源碼只作診斷線索）。需講師/DEV 提供已發布演練頁後，補驗文字儲存、圖片與外鏈交付、跨端同步及重整持久化。本輪未擅自新增教學任務或修改班級設定。

## 清理與後續驗收

- 測試暱稱：`QA-20261104-PC`、`QA-20261104-MobileSim`，均第 1 組。
- 未提交雲端筆記、圖片或外鏈；登入可能產生連線/報到資料，未查驗其儲存範圍。
- 未執行 Gen+1 或刪除任何班級資料。依委託由講師安排清理。
- Chrome / Edge 的 viewport override 已還原。
- 待 DEV 回覆 BUG-01～03、提供演練頁，再寫入 retests/ 複測報告；另補 iOS Safari / Android Chrome 真機型號、系統版本、鍵盤/旋轉/背景分頁操作與精確登入計時。

## 流程與版本控制

依 `split/qa/README.md` 採 reports/evidence 分工。本次使用正式班級是依委託明示的特定授權，覆蓋該 README 的一般測試班級規則。`scripts/build-all.js:18` 確認排除 qa 目錄。

僅提交本次驗收目錄；不修改產品程式、不部署。提交訊息：`docs(qa): record production login verification report for 202611-split`。
