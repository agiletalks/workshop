# AI 賦能敏捷：跨部門溝通萃取需求 (ai-align) 系統需求規格書

## 📌 專案概述
本專案為「AI 賦能敏捷：跨部門溝通萃取需求」專屬互動講義與協作系統。透過投影片展示、分組隨堂筆記以及 Firebase Firestore 即時連線，提供學員在課程中分組討論、即時共同記錄，並防範多人同時覆寫的協同機制。

---

## 🔑 一、 登入驗證與學員身分設定 (Authentication & Identity)
1. **課程通行密碼驗證**：
   - 統一存取密碼：`agile-2026`。
   - 密碼驗證通過後方可進入系統主頁。
2. **登入資訊填寫**：
   - **學員姓名／稱呼**（必填，例如：Alex、小美）。
   - **所屬組別選擇**（必選，例如：第 1 組、第 2 組、第 3 組...）。
3. **工作階段保存 (Session Persistence)**：
   - 驗證成功後將身分資訊（組別、姓名、登入 Token）保存於瀏覽器 `localStorage` 或 `sessionStorage`，重新整理或換頁無須重複輸入。
   - 提供「登出 / 切換身分」功能，方便更換組別或重設。

---

## 🖼️ 二、 講義播放與分組筆記介面 (Slides & Group Notes Workbench)
1. **逐頁教材展示區**：
   - 展示講師提供的教材圖片／投影片。
   - 提供上一頁、下一頁、頁數跳轉選單與大綱導航。
2. **每頁對照筆記區**：
   - 每張投影片下方或右側配有專屬筆記區。
   - **Tab 組別切換**：上方提供各組別標籤（如：`第 1 組`、`第 2 組`、`第 3 組`...）。
   - **全班跨組觀摩**：任何學員皆可點擊不同組別的 Tab，查看其他組別已儲存的筆記心得。

---

## 🔒 三、 分組編輯權限與即時鎖定機制 (Permissions & Concurrency Control)
1. **分組專屬編輯權限**：
   - **僅所屬組別可編輯**：學員登入為「第 1 組」時，僅能編輯「第 1 組 Tab」下的筆記內容。
   - **跨組唯讀防護**：點選其他組別（如「第 2 組」）時，輸入框自動呈現為唯讀（Disabled/Read-only）檢視模式。
2. **同組單人獨佔編輯鎖定 (Locking Mechanism)**：
   - **獲取鎖定 (Acquire Lock)**：當組員 A 聚焦（Focus）或點擊編輯筆記時，系統向 Firebase 登記鎖定狀態。
   - **即時提示其他人**：同組的其他組員畫面上會即時反白鎖定，並明確提示：
     > `🔒 [組員 A 姓名] 正在編輯中，請稍候...`
   - **釋放鎖定 (Release Lock)**：
     - 當組員 A 點擊儲存、點選空白處失焦（Blur）、或離開當前頁面時，系統釋放鎖定。
     - **超時自動解鎖 (Heartbeat / Lease Timeout)**：設定心跳過期機制（例如失聯或閒置逾 60 秒自動釋放鎖），防止因斷線或關閉瀏覽器導致永久卡死。
     - 鎖定釋放後，同組其他組員方可取得編輯權進行輸入。

---

## ⚡ 四、 資料儲存與即時同步架構 (Firebase Architecture)
1. **即時同步引擎**：
   - 採用 **Firebase Firestore** 的 `onSnapshot()` 即時監聽機制。
   - 筆記內容與鎖定狀態一有變更，所有在線學員端毫秒級同步更新。
2. **Firestore 資料結構設計 (Schema 草案)**：
   - **集合路徑**：`workshops/ai-align/slides/{slideId}/teams/{teamId}`
     ```json
     {
       "content": "小組討論需求重點與筆記文字...",
       "updatedAt": "2026-09-07T13:45:00Z",
       "updatedBy": "小美",
       "lock": {
         "isLocked": true,
         "lockedBy": "小美",
         "lockedAt": 1788759900000,
         "leaseExpiresAt": 1788759960000
       }
     }
     ```

---

## 📦 五、 待提供與後續實施清單
- [x] 講師已提供 40 張教材圖片素材至 `assets/`。
- [ ] 講師後續更新/調整預留頁圖檔（P2, P24-P29, P39）。
- [ ] 確認組別數量（預設建議開闢 6 組，可彈性擴充）。
- [ ] 實作登入頁面 Modal / Gatekeeper（密碼 `agile-2026` + 姓名 + 組別）。
- [ ] 實作講義主框架、大綱側欄、Tab 切換與 Firebase 連線與鎖定邏輯。

---

## 📑 六、 完整 40 頁投影片目錄對應表

| 頁碼 | 模組層級 | 標題 / 單元名稱 | 狀態說明 |
| :--- | :--- | :--- | :--- |
| **P01** | 封面 | AI賦能敏捷：跨部門溝通萃取需求 | 正式圖檔 |
| **P02** | 目錄 | 課程二級目錄導航大綱 | 待後續調整 |
| **P03** | WHY | WHY 目標 Goal | 正式圖檔 |
| **P04** | WHY > Envision | Envision 制定願景 | 正式圖檔 |
| **P05** | WHY > Envision | Users 用戶 | 正式圖檔 |
| **P06** | WHY > Envision | Users' Needs 需要 | 正式圖檔 |
| **P07** | WHY > Envision | Scope 範圍 | 正式圖檔 |
| **P08** | WHY > Envision | Key Features 特色 | 正式圖檔 |
| **P09** | WHY > Envision | Discriminator 區隔點 | 正式圖檔 |
| **P10** | WHY > Envision | Measurements 成效指標 | 正式圖檔 |
| **P11** | WHY > Biz Objectives | Business Objectives 7大商務目標 | 正式圖檔 |
| **P12** | WHY > Biz Objectives | Ability 能力 | 正式圖檔 |
| **P13** | WHY > Biz Objectives | Benefit 效益 | 正式圖檔 |
| **P14** | WHY > Biz Objectives | Cost 成本 | 正式圖檔 |
| **P15** | WHY > Biz Objectives | Disruption 擾動 | 正式圖檔 |
| **P16** | WHY > Biz Objectives | Efficiency 效率 | 正式圖檔 |
| **P17** | WHY > Biz Objectives | Integrity 穩定/完整性 | 正式圖檔 |
| **P18** | WHY > Biz Objectives | Growth 成長 | 正式圖檔 |
| **P19** | WHO | WHO 行為者 Actor | 正式圖檔 |
| **P20** | WHO | Stakeholders 利害關係人 | 正式圖檔 |
| **P21** | WHO | Focus 聚焦 | 正式圖檔 |
| **P22** | HOW | HOW 行為 Actions | 正式圖檔 |
| **P23** | HOW | Background 背景資訊 | 正式圖檔 |
| **P24** | HOW > Process | Analyze the Process 分析流程 | 待後續調整 |
| **P25** | HOW > Process | 定位用戶 | 占位圖檔（待補） |
| **P26** | HOW > Process | 識別利害關係人 | 占位圖檔（待補） |
| **P27** | HOW > Process | 列舉相關實體 | 占位圖檔（待補） |
| **P28** | HOW > Process | 排列事件順序 | 占位圖檔（待補） |
| **P29** | HOW > Process | 找出關鍵訊息 | 占位圖檔（待補） |
| **P30** | HOW > Outcomes | Define the Outcomes 定義結果 | 正式圖檔 |
| **P31** | HOW > Outcomes | Outcome 結果 | 正式圖檔 |
| **P32** | HOW > Outcomes | Metrics 衡量指標 | 正式圖檔 |
| **P33** | WHAT | WHAT 行動方案 Deliverables | 正式圖檔 |
| **P34** | WHAT > Deliverables | Identify Deliverables 識別交付項目 | 正式圖檔 |
| **P35** | WHAT > Deliverables | Requirement Hierarchy 需求層級 | 正式圖檔 |
| **P36** | WHAT > Deliverables | User Story 用戶故事 (Vertical Slice) | 正式圖檔 |
| **P37** | WHAT > Deliverables | Ready & DONE 需求完備與產出完工 | 正式圖檔 |
| **P38** | WHAT > Deliverables | Prioritization 排序需求 | 正式圖檔 |
| **P39** | WHAT > Prototype | Prototype to Align 用原型對齊共識 | 待後續調整 |
| **P40** | 封底 | 聯絡資訊 (agiletalks@gmail.com) | 正式圖檔 |

