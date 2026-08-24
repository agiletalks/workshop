export interface SlideResponse {
  slideId: string;
  personalNote: string;
  caseResponse: string;
  interactionData?: any;
  updatedAt: string;
  completed: boolean;
}

export interface LearnerWorkbook {
  courseId: string;
  version: string;
  responses: Record<string, SlideResponse>;
  activeSlideId: string;
  viewMode: "focus" | "overview";
  updatedAt: string;
}

export interface SlideExample {
  title: string;
  image: string;
  description?: string;
}

export interface Slide {
  id: string;
  page: number;
  moduleId: "E" | "S" | "P" | "L" | "I" | "T";
  title: string;
  subtitle?: string;
  image: string;
  type: "cover" | "overview" | "concept" | "core" | "comparison" | "divider" | "conclusion" | "resource";
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
  groupId?: string;
  interactionType?: string;
  interactionConfig?: any;
  examples?: SlideExample[];
}

export const slides: Slide[] = [
  {
    id: "slide-1",
    page: 1,
    moduleId: "E",
    title: "SPLIT 需求分解的技術",
    subtitle: "封面",
    image: "投影片1.PNG",
    type: "cover",
    showInProgress: false,
    allowNote: false,
    caseEnabled: false
  },
  {
    id: "slide-2",
    page: 2,
    moduleId: "E",
    title: "目錄",
    subtitle: "大綱",
    image: "投影片2.PNG",
    type: "overview",
    showInProgress: false,
    allowNote: true,
    notePrompt: "請記錄你對今天課程學習地圖的期待或筆記。",
    caseEnabled: false
  },
  {
    id: "slide-3",
    page: 3,
    moduleId: "E",
    title: "Ready & DONE",
    subtitle: "敏捷需求基本概念",
    image: "投影片3.PNG",
    type: "concept",
    keywords: ["DoR", "DoD", "INVEST", "Definition of Ready"],
    toolName: "INVEST 評估表",
    learningPurpose: "建立需求進入 Sprint 與完成交付的共同標準。",
    notePrompt: "請記錄你對 DoR、DoD 與 INVEST 的理解。",
    notePlaceholder: "講師補充、個人理解、工作上的例子……",
    caseEnabled: false,
    artifactName: "INVEST 評估表",
    artifactEnabled: true,
    showInProgress: true,
    allowNote: true,
    interactionType: "table-fill",
    interactionConfig: {
      headers: ["INVEST 準則", "說明", "目前團隊符合狀況 / 行動"],
      rows: [
        ["I - Independent (獨立性)", "故事可以單獨交付，無太多依賴", ""],
        ["N - Negotiable (可協商)", "非硬性規格，可與團隊討論細節", ""],
        ["V - Valuable (有價值)", "對用戶或客戶有明確的商業價值", ""],
        ["E - Estimatable (可估算)", "開發團隊能理解並估計所需工作量", ""],
        ["S - Small (小體量)", "能在一個 Sprint 內開發並測試完成", ""],
        ["T - Testable (可測試)", "有明確的驗收準則 (AC) 可驗證", ""]
      ]
    }
  },
  {
    id: "slide-4",
    page: 4,
    moduleId: "E",
    title: "User Story",
    subtitle: "使用者故事與驗收準則",
    image: "投影片4.PNG",
    type: "concept",
    keywords: ["User Story", "Acceptance Criteria", "3C 原則"],
    learningPurpose: "學習如何以使用者視角描述需求並訂定可驗收標準。",
    notePrompt: "記錄 User Story 的標準句型與 AC 的寫法筆記。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true,
    examples: [
      {
        title: "User Story & Acceptance Criteria 對照範例",
        image: "user_story_ac_example.png",
        description: "本範例展示了三個不同領域（內容創作者、學生、線上消費者）的 User Story 以及對應的驗收準則（Acceptance Criteria）。示範了如何以「As a... I want to... so that...」句型描述需求，並以條列式（When... then... 或品質標準）定義出明確、可測試的驗收標準。"
      }
    ]
  },
  {
    id: "slide-5",
    page: 5,
    moduleId: "E",
    title: "需求的階層",
    subtitle: "需求層級",
    image: "投影片5.PNG",
    type: "concept",
    keywords: ["Theme", "Epic", "Feature", "User Story"],
    learningPurpose: "理清敏捷需求的層級結構，從大願景逐步拆解至可執行故事。",
    notePrompt: "記錄敏捷需求層級（主題、史詩、特性、故事）的關係與定義。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-6",
    page: 6,
    moduleId: "S",
    title: "Structure",
    subtitle: "單元分隔頁",
    image: "投影片6.PNG",
    type: "divider",
    showInProgress: false,
    allowNote: false,
    caseEnabled: false
  },
  {
    id: "slide-7",
    page: 7,
    moduleId: "S",
    title: "WBS",
    subtitle: "WBS 拆解",
    image: "投影片7.PNG",
    type: "comparison",
    groupId: "wbs",
    keywords: ["WBS", "Backlog", "結構化"],
    learningPurpose: "比較傳統 WBS 與敏捷 Backlog 的結構差異，理解如何做需求結構化。",
    notePrompt: "記錄傳統 WBS 的局限，以及敏捷 Backlog 如何改善依賴關係。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true,
    interactionType: "sticky-board",
    interactionConfig: {
      title: "WBS 結構拆解畫布",
      defaultStickyNotes: [
        { id: "s-1", text: "傳統 WBS (任務導向)", color: "blue", x: 100, y: 100 },
        { id: "s-2", text: "敏捷 Backlog (價值導向)", color: "green", x: 300, y: 100 }
      ]
    },
    examples: [
      {
        title: "傳統 WBS 拆解範例 (Bicycle)",
        image: "wbs_bicycle_example.png",
        description: "本範例展示了以腳踏車（Bicycle）為專案範疇的傳統 WBS 結構分解。從第一層（Bicycle）往下拆解至第二層的主要元件（Frame, Gears, Wheel, Brakes），並進一步細分至第三層的具體工作包或組件，是任務導向的結構化拆解示範。"
      }
    ]
  },
  {
    id: "slide-8",
    page: 8,
    moduleId: "S",
    title: "Impact Map",
    subtitle: "核心工具",
    image: "投影片8.PNG",
    type: "core",
    keywords: ["Impact Map", "WHY", "WHO", "HOW", "WHAT", "Outcome"],
    toolName: "Impact Map",
    learningPurpose: "從商業目標、關鍵角色與行為改變，推導出產品的功能需求。",
    notePrompt: "記錄 Impact Map 四個層級（為什麼、是誰、如何、什麼）的對齊關係。",
    caseEnabled: false,
    artifactName: "Impact Map 產出",
    artifactEnabled: true,
    showInProgress: true,
    allowNote: true,
    examples: [
      {
        title: "Impact Map 實戰範例 (6M Active Users)",
        image: "impact_map_example_v1.png",
        description: "本範例展示了以「增加 600 萬活躍用戶」為商業目標，推導出 Existing Users, New Users, Customer Services 等關鍵角色（Actors），並擬定對應的影響手段（Impacts）與交付功能（Deliverables）。"
      }
    ]
  },
  {
    id: "slide-9",
    page: 9,
    moduleId: "S",
    title: "Story Map",
    subtitle: "核心工具",
    image: "投影片9.PNG",
    type: "core",
    groupId: "story-map",
    keywords: ["User Story Map", "Backbone", "Walking Skeleton", "Release Slice"],
    toolName: "Story Map 排序",
    learningPurpose: "學習如何以使用者旅程為骨幹，規劃出迭代交付的發布計畫。",
    notePrompt: "記錄 Story Map 的橫軸（時間軸/旅程）與縱軸（重要性/細節）的核心概念。",
    caseEnabled: false,
    artifactName: "Story Map 計畫",
    artifactEnabled: true,
    showInProgress: true,
    allowNote: true,
    interactionType: "sticky-board",
    interactionConfig: {
      title: "Story Map 排序畫布",
      defaultStickyNotes: [
        { id: "sm-1", text: "第一步：瀏覽商品", color: "yellow", x: 50, y: 80 },
        { id: "sm-2", text: "第二步：加入購物車", color: "yellow", x: 250, y: 80 },
        { id: "sm-3", text: "第三步：進行結帳", color: "yellow", x: 450, y: 80 },
        { id: "sm-release1", text: "MVP (Release 1)", color: "blue", x: 100, y: 200 }
      ]
    },
    examples: [
      {
        title: "經典 User Story Map 範例 (Email 系統)",
        image: "storymap_example.png",
        description: "本範例展示了 Steve Rogalsky 著名的電子郵件與行事曆系統 User Story Map。最上方橘色卡片代表使用者活動（Activities），第二層藍色卡片為使用者任務（Tasks），下方黃色卡片則是拆解後的 User Stories。透過兩條藍色發布線（Release Slices），清晰規劃出 Release 1 (MVP)、Release 2 與 Release 3 的增量交付範疇。"
      }
    ]
  },
  {
    id: "slide-10",
    page: 10,
    moduleId: "P",
    title: "Process",
    subtitle: "單元分隔頁",
    image: "投影片10.PNG",
    type: "divider",
    showInProgress: false,
    allowNote: false,
    caseEnabled: false
  },
  {
    id: "slide-11",
    page: 11,
    moduleId: "P",
    title: "Road Map",
    subtitle: "路線圖比較",
    image: "投影片11.PNG",
    type: "comparison",
    keywords: ["Road Map", "Gantt Chart", "Outcome-driven"],
    learningPurpose: "理解以價值產出 (Outcome) 驅動的路線圖，與傳統時程進度表的差異。",
    notePrompt: "記錄如何避免把 Road Map 寫成大甘特圖的策略。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true,
    examples: [
      {
        title: "以價值驅動的路線圖 (Theme/Outcome-driven Roadmap)",
        image: "roadmap_now_next_future.png",
        description: "本範例展示了以「現在、下一步、未來（Now, Next, Future）」時間維度與主題導向（Theme-based）規劃的路線圖。不同於具體時程，它專注於要解決的使用者問題與產品價值主題（例如整合雲端、提升電池續航、導入 AI 助理等）。"
      },
      {
        title: "傳統時程/甘特圖路線圖 (Timeline/Gantt Roadmap)",
        image: "roadmap_timeline_gantt.png",
        description: "本範例展示了傳統以時間軸與專案階段（Quarters, Milestones）驅動的路線圖。它將各模組的開發與維運任務（如 Delivery Management, Ops, Risk Management, QoS）以條狀圖排列在具體時程表上，偏向任務進度與交付時間導向。"
      }
    ]
  },
  {
    id: "slide-12",
    page: 12,
    moduleId: "P",
    title: "Value Stream",
    subtitle: "價值流對齊",
    image: "投影片12.PNG",
    type: "concept",
    keywords: ["Value Stream Map", "Lead Time", "Process Time", "Waste"],
    learningPurpose: "從使用者提出需求到拿到價值的完整流程中，找出瓶頸與浪費。",
    notePrompt: "記錄價值流分析中，如何定義及縮短 Waiting Time（等待時間）。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-13",
    page: 13,
    moduleId: "P",
    title: "Kanban Board",
    subtitle: "看板管理",
    image: "投影片13.PNG",
    type: "concept",
    keywords: ["Kanban", "WIP Limit", "Pull System", "Flow"],
    learningPurpose: "利用視覺化看板限制在製品數量 (WIP Limit)，優化需求的流動速度。",
    notePrompt: "記錄 WIP Limit 對團隊流動效率的關鍵影響與自身痛點。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-14",
    page: 14,
    moduleId: "P",
    title: "Scenario",
    subtitle: "核心工具",
    image: "投影片14.PNG",
    type: "core",
    keywords: ["Scenario", "BDD", "Given-When-Then", "Behavioral Spec"],
    toolName: "情境描述與 BDD 畫布",
    learningPurpose: "學習以 Given-When-Then 描述具體使用情境，減少業務與開發的溝通落差。",
    notePrompt: "記錄一組 Given-When-Then 的語法規則與實務練習心得。",
    caseEnabled: false,
    artifactName: "Given-When-Then 產出",
    artifactEnabled: true,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-15",
    page: 15,
    moduleId: "L",
    title: "Learn",
    subtitle: "單元分隔頁",
    image: "投影片15.PNG",
    type: "divider",
    showInProgress: false,
    allowNote: false,
    caseEnabled: false
  },
  {
    id: "slide-16",
    page: 16,
    moduleId: "L",
    title: "MVP",
    subtitle: "最小可行性產品",
    image: "投影片16.PNG",
    type: "core",
    keywords: ["MVP", "Validation", "Learning Hypothesis", "Riskest Assumption"],
    toolName: "MVP 假設定義",
    learningPurpose: "理解 MVP 的本質是「驗證假設的最小工作量」，而非最爛的系統首版。",
    notePrompt: "記錄 MVP 與原型 (Prototype) 的本質區別在於是否包含『市場/價值驗證』。",
    caseEnabled: false,
    artifactName: "MVP 核心假設定義",
    artifactEnabled: true,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-17",
    page: 17,
    moduleId: "L",
    title: "Spike",
    subtitle: "核心工具",
    image: "投影片17.PNG",
    type: "core",
    keywords: ["Spike", "Timebox", "Technical Spike", "Functional Spike"],
    toolName: "Spike 實驗設計",
    learningPurpose: "利用有時限的研究任務 (Spike)，排除未知的技術障礙或規格模糊。",
    notePrompt: "記錄 Spike 必須設定 Timebox (時間箱) 與明確研究問題的原則。",
    caseEnabled: false,
    artifactName: "Spike 研究計畫",
    artifactEnabled: true,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-18",
    page: 18,
    moduleId: "I",
    title: "Increment",
    subtitle: "單元分隔頁",
    image: "投影片18.PNG",
    type: "divider",
    showInProgress: false,
    allowNote: false,
    caseEnabled: false
  },
  {
    id: "slide-19",
    page: 19,
    moduleId: "I",
    title: "A and B",
    subtitle: "增量交付模式",
    image: "投影片19.PNG",
    type: "concept",
    keywords: ["Increment", "Iterative vs Incremental", "Big Bang"],
    learningPurpose: "對比漸進式與一次性交付的風險，掌握逐步堆疊價值的要領。",
    notePrompt: "記錄兩種交付模式在面對市場變更時，各自承受的沉沒成本差異。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-20",
    page: 20,
    moduleId: "I",
    title: "Dependency",
    subtitle: "依賴關係處理",
    image: "投影片20.PNG",
    type: "concept",
    keywords: ["Dependency", "Story Splitting", "Decoupling"],
    learningPurpose: "識別外部依賴、技術依賴與業務依賴，並透過故事解耦進行優化。",
    notePrompt: "記錄如何透過 INVEST 中的 Independent 重新切分以解除依賴。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-21",
    page: 21,
    moduleId: "I",
    title: "Discount",
    subtitle: "切分折扣",
    image: "投影片21.PNG",
    type: "concept",
    keywords: ["Scope Management", "Friction", "Good Enough"],
    learningPurpose: "學習『做夠用就好』的藝術，主動放棄低價值細節以加快上線速度。",
    notePrompt: "記錄如何向業務或客戶溝通『先做 MVP，後續再優化』的說服技巧。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-22",
    page: 22,
    moduleId: "I",
    title: "Decision Table",
    subtitle: "核心工具",
    image: "投影片22.PNG",
    type: "core",
    keywords: ["Decision Table", "Business Rules", "Rule Splitting"],
    toolName: "決策表工具",
    learningPurpose: "以二維表格系統化理清多重規則的交叉情境，以此作為需求拆分點。",
    notePrompt: "記錄如何以條件組合為基礎，將一個複雜邏輯拆成數個簡單的使用者故事。",
    caseEnabled: false,
    artifactName: "Decision Table 產出",
    artifactEnabled: true,
    showInProgress: true,
    allowNote: true,
    interactionType: "table-fill",
    interactionConfig: {
      headers: ["條件項目 / 規則組合", "Rule 1", "Rule 2", "Rule 3", "Rule 4"],
      rows: [
        ["條件 A (例如：是否為VIP)", "Y", "Y", "N", "N"],
        ["條件 B (例如：消費是否滿千)", "Y", "N", "Y", "N"],
        ["動作結果 (例如：折扣成數)", "8 折", "9 折", "95 折", "無折扣"]
      ]
    }
  },
  {
    id: "slide-23",
    page: 23,
    moduleId: "T",
    title: "Task",
    subtitle: "單元分隔頁",
    image: "投影片23.PNG",
    type: "divider",
    showInProgress: false,
    allowNote: false,
    caseEnabled: false
  },
  {
    id: "slide-24",
    page: 24,
    moduleId: "T",
    title: "Spider",
    subtitle: "工作拆解概念",
    image: "投影片24.PNG",
    type: "concept",
    keywords: ["Spider Method", "Task Breakdown", "Spaghetti Connection"],
    learningPurpose: "學習如何以視覺化蜘蛛網的方式，將故事節點發散拆解為細部 Task。",
    notePrompt: "記錄如何避免在 Sprint 規劃會議中遺漏技術任務的拆解方法。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-25",
    page: 25,
    moduleId: "T",
    title: "Timetable",
    subtitle: "時程排程比較",
    image: "投影片25.PNG",
    type: "comparison",
    keywords: ["Timetable", "Iteration Planning", "Commitment"],
    learningPurpose: "對比固定時間盒 (Timebox) 與彈性時程的優缺點，學會敏捷承諾。",
    notePrompt: "記錄在時間受限下，如何排列 Task 順序以保證 Sprint 目標不漏接。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-26",
    page: 26,
    moduleId: "T",
    title: "Gannt",
    subtitle: "甘特圖比較",
    image: "投影片26.PNG",
    type: "comparison",
    keywords: ["Gantt Chart", "Burn-down Chart", "Progress Tracking"],
    learningPurpose: "釐清敏捷燃盡圖與甘特圖的定位差異，不用甘特圖來追蹤每日微觀進度。",
    notePrompt: "記錄甘特圖適合與不適合應用的場景（如：高層報告 vs 團隊日常協作）。",
    caseEnabled: false,
    showInProgress: true,
    allowNote: true
  },
  {
    id: "slide-27",
    page: 27,
    moduleId: "T",
    title: "Are You Ready",
    subtitle: "課程總結",
    image: "投影片27.PNG",
    type: "conclusion",
    learningPurpose: "回顧整天課程的 SPLIT 技術，準備將這些工具帶回工作現場落實。",
    notePrompt: "請寫下你明天上班能立刻運用的一個需求分解觀念或工具。",
    caseEnabled: false,
    showInProgress: false,
    allowNote: true
  }
];
