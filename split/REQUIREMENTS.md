# SPLIT 互動講義 ｜ 需求規格書

> 文件用途：提供 AI Coding 工具直接讀取並開發互動式學員講義  
> 專案類型：純前端、靜態部署、無後端  
> 語言：繁體中文（zh-TW）  
> 版本：v0.4  
> 案例內容：本階段保留空白，後續以資料檔補入，不影響既有程式結構

---

## 1. 專案目標

建立一份「需求分解的技術 SPLIT」互動式 HTML 講義。
學員在課程中依照原講義卡片的順序閱讀，每張卡片旁都要有可輸入的文字方塊，讓學員記錄：
1. 個人理解與重點
2. 講師引導問題的回答
3. 小組討論結果
4. 貫穿案例的階段產出
5. 可帶回工作場域的應用想法

本講義不是將 PDF 單純轉成網頁，而是把「逐頁講義卡片、課堂筆記、六個單元導航、學習進度與成果匯出」整合為一套互動式學習介面。

---

## 2. 課程資訊架構

整天課程分為六個單元：

| 單元代碼 | 單元名稱 | 教學定位 |
|---|---|---|
| E | Essential｜敏捷需求基本概念 | 建立敏捷需求、DoD、DoR、User Story、Vertical Slice 與需求層級的共同語言 |
| S | Structure | 從結構與價值脈絡整理 Product Backlog |
| P | Process | 從流程、價值流、工作流與情境理解需求 |
| L | Learn | 透過 MVP、實驗與 Spike 降低不確定性 |
| I | Increment | 將需求安排成可逐步交付的增量 |
| T | Task | 將需求進一步轉成可執行的工作 |

### 2.1 教學順序原則
1. 知識點必須依照原始講義卡片的頁面順序出現。
2. 不得因重新分類而任意調動卡片順序。
3. 每個單元可包含多個工具，但不代表每個工具都必須操作。
4. 核心工具、概念工具與比較工具要能在資料層標記。
5. 貫穿案例的內容本階段全部保留為空白占位，不撰寫案例答案。
6. 後續補入案例時，只修改資料檔，不需改動主要元件。

---

## 3. 原始素材與資產規則

### 3.1 資產位置
本專案的講義圖片均置於：`/assets/`，程式應將其複製至編譯後的資源目錄中。

### 3.2 圖片路徑不得硬寫在元件內
所有圖片路徑與檔名必須由資料檔配置。

---

## 4. 建議技術棧

- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

### 4.1 限制
- 僅使用前端靜態網站架構，無後端，無登入。
- 學員資料完全保存在瀏覽器的 `localStorage` 中。
- 必須可編譯並部署到 GitHub Pages。

---

## 5. 頁面與單元對應

以下依原始 33 頁講義建立初始對應。

| 頁碼 | 內容 | 單元 | 頁面類型 |
|---:|---|---|---|
| 1 | 封面 | E | cover |
| 2 | 目錄 | E | overview |
| 3 | Ready & Done／INVEST | E | concept (互動: table-fill) |
| 4 | User Story／Acceptance Criteria | E | concept |
| 5 | Vertical Slice | E | concept |
| 6 | Requirement Hierarchy | E | concept |
| 7 | Structure 分隔頁 | S | divider |
| 8 | WBS 圖卡 | S | comparison (互動: sticky-board, groupId: wbs) |
| 9 | WBS 圖卡 | S | comparison (groupId: wbs) |
| 10 | Impact Map | S | core |
| 11 | Story Map | S | core (互動: sticky-board, groupId: story-map) |
| 12 | Story Map 圖卡 | S | core (groupId: story-map) |
| 13 | Process 分隔頁 | P | divider |
| 14 | Road Map | P | comparison |
| 15 | Value Stream | P | concept |
| 16 | Kanban Board | P | concept |
| 17 | Scenario | P | core |
| 18 | Learn 分隔頁 | L | divider |
| 19 | Learn 圖卡 | L | concept |
| 20 | MVP 說明 | L | core |
| 21 | Build–Measure–Learn | L | core |
| 22 | Spike | L | core |
| 23 | Increment 分隔頁 | I | divider |
| 24 | A & B | I | concept |
| 25 | Dependency | I | concept |
| 26 | Discount | I | concept |
| 27 | Decision Table | I | core (互動: table-fill) |
| 28 | Task 分隔頁 | T | divider |
| 29 | Spider | T | concept |
| 30 | Timetable | T | comparison |
| 31 | Gantt | T | comparison |
| 32 | Ready 結語 | T | conclusion |
| 33 | 下載頁 | T | resource |

---

## 6. 核心資料模型

### 6.1 Slide 型別
```ts
export interface Slide {
  id: string;
  page: number;
  moduleId: ModuleId;
  title: string;
  subtitle?: string;
  image: string;
  type: SlideType;
  keywords?: string[];
  toolName?: string;
  learningPurpose?: string;
  notePrompt?: string;
  notePlaceholder?: string;
  caseEnabled: boolean;
  casePrompt?: string;
  casePlaceholder?: string;
  artifactName?: string;
  artifactEnabled?: boolean;
  showInProgress: boolean;
  allowNote: boolean;

  // 跨頁與互動支援
  groupId?: string;
  interactionType?: string;
  interactionConfig?: any;
}
```

### 6.2 學員資料型別
```ts
export interface SlideResponse {
  slideId: string;
  personalNote: string;
  caseResponse: string;
  interactionData?: any;
  updatedAt: string;
  completed: boolean;
}
```

---

## 7. 主要功能

1. **密碼保護**：開發階段預設密碼為 `03750168`，集中於設定檔中。
2. **單頁專注模式**：一次顯示一張卡片，支援鍵盤左右方向鍵切換頁。
3. **全覽模式**：網格縮圖展示，可依完成狀態與工具屬性篩選。
4. **本機存檔**：輸入後 500ms Debounce 自動儲存至本機 `localStorage`。
5. **備份與還原**：支援下載與上傳 JSON 格式檔案還原筆記進度。
6. **筆記匯出**：一鍵下載 Markdown 格式的完整學習報告（包含實作表格的轉換）。

---

## 8. 視覺設計與色彩規範

### 8.1 卡片視覺對齊配色

為了讓講義系統的整體介面與投影片卡片設計融為一體，採用**卡片色系**做為主要品牌配色：

* **主色（Primary）**：卡片深青綠色（Card Teal, `#0e9aa0`），用於 TopBar、主要按鈕、焦點邊框與大標題用色。
* **輔助/強調色（Accent）**：卡片黃/琥珀色（Card Amber/Yellow, `#F59E0B`），用於進度圓點、完成狀態標記、導覽列高亮。
* **背景色（Background）**：採用簡潔乾淨的淡灰色 `#F8FAFC` 搭配純白卡片面板，襯托投影片的實體視覺。
* **字型**：優先載入並套用 Google Fonts 的 `Outfit` 與 `Noto Sans TC` 字型。
