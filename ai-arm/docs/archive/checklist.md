# AI-ARM 實作輔助平台開發追蹤清單 (Checklist)

本清單用於追蹤「AI-ARM 需求建模與敏捷 Refinement 實作輔助平台」的開發進度。我們將以**方案 2（企業差旅申請與費用報支系統）**為案例，逐一討論並實現各個階段的內容。

---

## 🛠️ 開發進度

- [x] **階段 0：平台基礎架構與即時協作建立 (Base Architecture & Collaboration)**
  - [x] 升級 `index.html` 基礎版面：支援左側/頂部 6 大階段導航與響應式 UI
  - [x] 整合密碼保護功能（預設 `agile-2026`）
  - [x] 整合 **Firebase Firestore**，建立即時資料庫連線
  - [x] 開發「小組身分選擇與命名機制」（如第一組、第二組），以識別不同協作者
  - [x] 設計通用的 Prompt 一鍵複製組件與範本折疊樣式

- [ ] **階段 1：Frame (範圍與角色框定) 協作開發**
  - [ ] 確定「差旅申請與報支系統」原始訪談逐字稿（含口語、錯別字）
  - [ ] 整合訪談逐字稿整理 Prompt 與願景制定 Prompt
  - [ ] **開發即時共享看板**：各組可提交整理後的「願景說明書（Envisioning Statement）」，全班可即時看見並對照各組產出
  - [ ] 建立範例展示：Context Model（系統邊界圖）與 Stakeholder Model（角色權限表）

- [ ] **階段 2：Understand (需求建模) 協作開發**
  - [ ] **開發即時模型共享專區**：各組可輸入並上傳其負責建模（Process/Decision/Data/State Model）的 Markdown 或 Mermaid 圖表，全班實時同步共享
  - [ ] 建立 Process Model（流程建模）實作引導與差旅報支主流程範例
  - [ ] 建立 Decision Model（決策建模）實作引導與差旅額度/超額加簽規則範例
  - [ ] 建立 Data Model（資料建模）實作引導與差旅單/報銷單資料字典範例
  - [ ] 建立 State Model（狀態建模）實作引導與報銷案件狀態遷移範例

- [ ] **階段 3：Translate (規格轉譯) 協作開發**
  - [ ] **開發 UI 規格即時提交區**：供各組提交其分配畫面的 Screen Flow 與 Interaction Spec，拼湊出完整系統地圖
  - [ ] 建立 Screen Flow（畫面流）實作引導與系統畫面流動範例
  - [ ] 建立 Interaction Specification（互動規格）實作引導與 UI 互動檢核規則範例

- [ ] **階段 4：Prototype (原型驗證) 協作開發**
  - [ ] 建立 Prototype Brief（原型設定）實作引導與範例
  - [ ] **開發 Prototype 連結分享牆**：各組可用 AI Vibe Coding 生成各自畫面的 Clickable Prototype（如 CodePen/JSFiddle 或直接貼上 HTML 代碼網頁），並在此分享連結，供全班互相測試與體驗

- [ ] **階段 5：Refine (需求精煉) 協作開發**
  - [ ] **開發 Ready Story 協同清單**：各組在切片（A&B、Decision、Discount、Dependency）後，將符合 INVEST 的 User Story 與 AC 提交到系統中，共同組成整個專案的 Product Backlog
  - [ ] 建立符合 INVEST 標準的 Ready User Story 撰寫引導與範例

- [ ] **階段 6：Task (任務拆解) 協作開發**
  - [ ] 建立 Task List 實作引導（將 User Story 拆為 UI, Logic, Data, Test 任務）
  - [ ] **開發「全班實時同步 Task Board (Kanban)」**：串接 Firestore，使多個小組可以同時建立 Task、拖拽卡片變更狀態（待辦 -> 進行中 -> 完成），模擬團隊真實分工協作開發

- [ ] **階段 7：平台整合與總體測試**
  - [ ] 整體網頁流程與 UI/UX 調優
  - [ ] 部署與發布確認

