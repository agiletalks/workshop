# AI-ARM 規格與文件目錄 (Documentation & Specifications)

本目錄彙整 AI-ARM 工作坊的所有設計規格、核心架構說明以及歷史資料歸檔。

---

## 📁 目錄結構

```text
ai-arm/docs/
├── README.md                                    # 本說明文件
├── specs/                                       # 當前核心規格與課程設計
│   ├── REQUIREMENTS.md                          # AI-ARM 產品與功能需求規格書
│   ├── BOARD_COLLABORATION_SPEC.md              # 團隊協同白板 (board.html) 規格書
│   ├── AI-ARM_課程設計與交付物協作工作檔.md        # 課程架構設計與 14 大 Prompt 規格一覽表
│   └── collaborative-modeling-teaching-framework.md # 協同建模教學框架與引導原則
└── archive/                                     # 歷史版本歸檔 (Legacy Drafts & Outlines)
    ├── 20260726_從訪談到原型與需求分解實戰工作坊_大綱.html # 2026/07 早期大綱 HTML
    ├── 20260726_從訪談到原型與需求分解實戰工作坊_大綱.pdf  # 2026/07 早期大綱 PDF
    ├── checklist.md                                 # 早期工作坊準備檢核清單
    ├── transcript.txt                               # 早期訪談整理逐字稿範例草稿
    └── vision_prompt.txt                            # 早期願景提示詞範例草稿
```

---

## 📌 檔案分類與職責說明

### 1. 核心規格 (`specs/`)
* **[`REQUIREMENTS.md`](specs/REQUIREMENTS.md)**: AI-ARM 工作坊系統整體規格需求。
* **[`BOARD_COLLABORATION_SPEC.md`](specs/BOARD_COLLABORATION_SPEC.md)**: 多人協同白板互動架構、資料同步、角色權限與元件規格。
* **[`AI-ARM_課程設計與交付物協作工作檔.md`](specs/AI-ARM_課程設計與交付物協作工作檔.md)**: 完整的 6 階段流程、14 大專屬 Prompt 清單與核心交付物定義。
* **[`collaborative-modeling-teaching-framework.md`](specs/collaborative-modeling-teaching-framework.md)**: 協同建模核心心法與四大模型（Process、Decision、Data、State）教學框架。

### 2. 歷史歸檔 (`archive/`)
* 存放 2026 年 7~8 月早期實體工作坊之籌備草稿、檢核清單與參考逐字稿。
* 僅供歷史參照與課綱演進溯源，不直接參與應用程式運行。

---

## 📦 無關檔案移築說明 (Relocated Files)

* **`36份卡片_敏捷專案管理.pdf` (12 MB)**：
  - 原置於 `ai-arm/` 根目錄，此為敏捷專案管理實體卡牌遊戲之參考材料，與本系統網頁程式碼無直接依賴。
  - 已自 `ai-arm/` 根目錄移出，安全典藏於根目錄封存區：`workshop/ai-arm-archive/36份卡片_敏捷專案管理.pdf`。
  - 避免將龐大靜態 PDF 混入應用程式目錄，確保模組純粹輕量。
