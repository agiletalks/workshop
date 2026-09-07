// ai-align 課程投影片資料庫與結構定義 (WHY / WHO / HOW / WHAT)
const CHAPTERS = [
  { id: "cover", code: "INTRO", name: "課程導引", start: 1, end: 2, color: "indigo" },
  { id: "why", code: "WHY", name: "WHY 目標 (Goal)", start: 3, end: 18, color: "amber" },
  { id: "who", code: "WHO", name: "WHO 行為者 (Actor)", start: 19, end: 21, color: "blue" },
  { id: "how", code: "HOW", name: "HOW 行為 (Actions)", start: 22, end: 32, color: "emerald" },
  { id: "what", code: "WHAT", name: "WHAT 行動方案 (Deliverables)", start: 33, end: 40, color: "rose" }
];

const SLIDES_DATA = [
  {
    index: 1,
    id: "p01-cover",
    chapterId: "cover",
    chapterName: "課程導引",
    title: "AI 賦能敏捷",
    subtitle: "跨部門溝通 ｜ 萃取需求",
    image: "assets/投影片1.PNG",
    hasExercise: false,
    hasBoard: false
  },
  {
    index: 2,
    id: "p02-contents",
    chapterId: "cover",
    chapterName: "課程目錄",
    title: "CONTENTS 課程目錄",
    subtitle: "從目標出發 · 用原型對齊共識",
    image: "assets/投影片2.PNG",
    hasExercise: false,
    hasBoard: false
  },
  {
    index: 3,
    id: "p03-why-intro",
    chapterId: "why",
    chapterName: "WHY 目標",
    title: "WHY 目標 (Goal)",
    subtitle: "為何而做？明確產品願景與商業目標",
    image: "assets/投影片3.PNG",
    hasExercise: false,
    hasBoard: false
  },
  {
    index: 4,
    id: "p04-envision",
    chapterId: "why",
    chapterName: "WHY > 制定願景",
    title: "Envision 制定願景",
    subtitle: "願景盤點：釐清產品存在的核心理由",
    image: "assets/投影片4.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】產品願景陳述 (Product Vision)",
      front: "為跨部門敏捷團隊，打造一套「以原型為共同語言」的智能需求對齊協作平台。",
      back: "【背景痛點】業務、PM 與工程團隊每次開會認知皆有落差，需求變更導致 30% 重工。\n【預期效益】透過 AI 輔助即時產出視覺原型與 Given-When-Then 規格，將需求澄清週期由兩週縮短至 2 天內，大幅提升團隊交付信任感。"
    },
    cardContext: {
      frontLabel: "願景核心主張",
      backLabel: "背景脈絡 / 期望影響",
      frontPlaceholder: "例如：打造跨部門無痛協作的即時共識平台...",
      backPlaceholder: "補充目前面臨的痛點與預期達成的長期影響..."
    }
  },
  {
    index: 5,
    id: "p05-users",
    chapterId: "why",
    chapterName: "WHY > 制定願景",
    title: "Users 用戶",
    subtitle: "釐清目標客群與實際使用者群像",
    image: "assets/投影片5.PNG",
    hasExercise: true,
    hasBoard: false,
    example: {
      title: "【講師範例】目標用戶分析",
      front: "核心用戶：跨職能敏捷產品團隊成員（產品經理 PM、系統分析師 SA、第一線業務代表、前端/後端工程師）。",
      back: "【特徵畫像】日常需頻繁跨溝通，受限於傳統文字 PRD 冗長抽象，渴望有一目了然的直觀工具快速對齊驗收細節。"
    },
    cardContext: {
      frontLabel: "目標用戶群體",
      backLabel: "特徵與使用場景",
      frontPlaceholder: "例如：第一線業務人員、專案經理 (PM)...",
      backPlaceholder: "他們的使用情境、數位熟悉度與操作習慣..."
    }
  },
  {
    index: 6,
    id: "p06-users-needs",
    chapterId: "why",
    chapterName: "WHY > 制定願景",
    title: "Users' Needs 需要",
    subtitle: "挖掘深層需求，而非表面要求",
    image: "assets/投影片6.PNG",
    hasExercise: true,
    hasBoard: false,
    example: {
      title: "【講師範例】深層需求挖掘",
      front: "表面要求：需要一份更詳細的規格文件。\n深層需求：在開發開工前，能看見畫面動態與極端情境，避免交付時才被退件。",
      back: "【心理痛點】工程師害怕猜測意圖而造成返工；業務害怕承諾客戶的排程因為技術重構而跳票。"
    }
  },
  {
    index: 7,
    id: "p07-scope",
    chapterId: "why",
    chapterName: "WHY > 制定願景",
    title: "Scope 範圍",
    subtitle: "界定邊界：包含什麼？明確排除什麼？",
    image: "assets/投影片7.PNG",
    hasExercise: true,
    hasBoard: false,
    example: {
      title: "【講師範例】範圍界定 (Scope Boundary)",
      front: "【In Scope 納入】\n1. 即時線上分組卡片協作\n2. 投影片同步導航\n3. 編輯鎖定提示\n4. 獨立小組白板共編",
      back: "【Out of Scope 排除】\n1. 跨時區語音即時通話（使用外部會議軟體）\n2. 多國語系動態翻譯（首版專注繁體中文）\n3. 歷史版本分支合併（以最新共識覆蓋）"
    }
  },
  {
    index: 8,
    id: "p08-features",
    chapterId: "why",
    chapterName: "WHY > 制定願景",
    title: "Key Features 特色功能",
    subtitle: "能具體解決需求的核心功能點",
    image: "assets/投影片8.PNG",
    hasExercise: true,
    hasBoard: false,
    example: {
      title: "【講師範例】核心功能特色",
      front: "1. 雙欄同步視窗：簡報與小組筆記並行不干擾。\n2. 單一編輯防覆寫鎖定：同組一人編輯時即時反白提示。\n3. 小組獨立線上白板：各組專屬 Miro 畫布共享。",
      back: "【價值產出】零死角同步、無衝突共創，兼具教學引導結構性與白板發散自由度。"
    }
  },
  {
    index: 9,
    id: "p09-discriminator",
    chapterId: "why",
    chapterName: "WHY > 制定願景",
    title: "Discriminator 區隔點",
    subtitle: "與其他現有方案截然不同的獨特差異",
    image: "assets/投影片9.PNG",
    hasExercise: true,
    hasBoard: false,
    example: {
      title: "【講師範例】產品獨特區隔",
      front: "一般線上白板畫布太大、學生容易失焦迷航；本系統「每頁講義直接綁定小組筆記與專屬白板」，引導節奏嚴謹不失焦。",
      back: "【差異化優勢】無需事前進行繁瑣的白板模版複製，學員一鍵直達專屬小組空間，講師隨時可掌控課堂全場進度。"
    }
  },
  {
    index: 10,
    id: "p10-measurements",
    chapterId: "why",
    chapterName: "WHY > 制定願景",
    title: "Measurements 成效指標",
    subtitle: "如何衡量願景是否如期實現",
    image: "assets/投影片10.PNG",
    hasExercise: true,
    hasBoard: false,
    example: {
      title: "【講師範例】成效衡量指標",
      front: "1. 需求對齊效率：Sprint Planning 需求澄清時間由 4 小時降至 1.5 小時。\n2. 重工率降低：因驗收條件認知不一致造成的 Bug 數降低 50%。",
      back: "【質化指標】團隊跨部門溝通滿意度達 85% 以上，工程與業務對彼此意圖的信任度顯著提高。"
    }
  },
  {
    index: 11,
    id: "p11-business-objectives",
    chapterId: "why",
    chapterName: "WHY > 商務目標",
    title: "Business Objectives 7大商務目標",
    subtitle: "ABC-ED-IG：連結商務策略與價值創造",
    image: "assets/投影片11.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】7大商務目標 (ABC-ED-IG 矩陣)",
      front: "【Efficiency 效率】縮短交付週期 40%\n【Cost 成本】減少需求變更重工浪費\n【Benefit 效益】提早 3 週搶佔市場商機",
      back: "【Ability 能力】賦能全員具備 AI 萃取需求思維\n【Integrity 穩定】確保規格合規且無漏失\n【Growth 成長】擴大企業數位敏捷轉型規模"
    }
  },
  {
    index: 12,
    id: "p12-ability",
    chapterId: "why",
    chapterName: "WHY > 商務目標",
    title: "Ability 能力",
    subtitle: "賦能組織新技能或數位戰力",
    image: "assets/投影片12.PNG",
    hasExercise: true,
    hasBoard: false
  },
  {
    index: 13,
    id: "p13-benefit",
    chapterId: "why",
    chapterName: "WHY > 商務目標",
    title: "Benefit 效益",
    subtitle: "直接或間接創造的財務與策略價值",
    image: "assets/投影片13.PNG",
    hasExercise: true,
    hasBoard: false
  },
  {
    index: 14,
    id: "p14-cost",
    chapterId: "why",
    chapterName: "WHY > 商務目標",
    title: "Cost 成本",
    subtitle: "降低溝通成本、返工浪費與維護負擔",
    image: "assets/投影片14.PNG",
    hasExercise: true,
    hasBoard: false
  },
  {
    index: 15,
    id: "p15-disruption",
    chapterId: "why",
    chapterName: "WHY > 商務目標",
    title: "Disruption 擾動",
    subtitle: "顛覆現有機制、創造破壞性創新機會",
    image: "assets/投影片15.PNG",
    hasExercise: true,
    hasBoard: false
  },
  {
    index: 16,
    id: "p16-efficiency",
    chapterId: "why",
    chapterName: "WHY > 商務目標",
    title: "Efficiency 效率",
    subtitle: "大幅縮短價值交付週期（Lead Time）",
    image: "assets/投影片16.PNG",
    hasExercise: true,
    hasBoard: false
  },
  {
    index: 17,
    id: "p17-integrity",
    chapterId: "why",
    chapterName: "WHY > 商務目標",
    title: "Integrity 穩定/完整性",
    subtitle: "確保需求規格無漏洞、數據合規與高可靠",
    image: "assets/投影片17.PNG",
    hasExercise: true,
    hasBoard: false
  },
  {
    index: 18,
    id: "p18-growth",
    chapterId: "why",
    chapterName: "WHY > 商務目標",
    title: "Growth 成長",
    subtitle: "擴大市占率、用戶留存與業務規模擴張",
    image: "assets/投影片18.PNG",
    hasExercise: true,
    hasBoard: false
  },
  {
    index: 19,
    id: "p19-who-intro",
    chapterId: "who",
    chapterName: "WHO 行為者",
    title: "WHO 行為者 (Actor)",
    subtitle: "我們在服務誰？我們要改變誰？",
    image: "assets/投影片19.PNG",
    hasExercise: false,
    hasBoard: false
  },
  {
    index: 20,
    id: "p20-stakeholders",
    chapterId: "who",
    chapterName: "WHO > 利害關係人與聚焦",
    title: "Stakeholders & Focus 利害關係人與聚焦",
    subtitle: "同心圓模型：互動圈、資源圈與環境圈",
    image: "assets/投影片20.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】利害關係人同心圓分析",
      front: "【核心互動圈】門診患者、第一線掛號櫃台人員、看診醫師\n【資源支援圈】資訊部系統工程師、醫管處主管、藥劑部\n【法規環境圈】衛福部健保署、個資隱私保護官、第三方金流商",
      back: "【聚焦策略】首階段優先優化「門診患者與櫃台人員」之互動接觸點，次階段再整合醫院內部資源與外部申報流。"
    },
    cardContext: {
      frontLabel: "利害關係人 / 角色",
      backLabel: "所屬層次 (互動/資源/環境) 與核心關切",
      frontPlaceholder: "例如：第一線專櫃服務人員、法遵主管、外部稽核...",
      backPlaceholder: "屬於【互動圈】；最在乎操作介面直覺與客戶結帳等待時間..."
    }
  },
  {
    index: 21,
    id: "p21-focus",
    chapterId: "who",
    chapterName: "WHO > 利害關係人與聚焦",
    title: "Focus 聚焦關鍵角色",
    subtitle: "找出最具影響力與最優先滿足的關鍵對象",
    image: "assets/投影片21.PNG",
    hasExercise: true,
    hasBoard: false,
    example: {
      title: "【講師範例】聚焦核心角色 (Primary Persona)",
      front: "主要聚焦角色：需定期回診的慢性病患者（55-70歲長輩與代辦子女）。",
      back: "【挑選理由】佔據門診流量 45%，且因反覆看診痛苦指數最高，一旦體驗被改善，帶來的口碑與回診依賴度最強。"
    }
  },
  {
    index: 22,
    id: "p22-how-intro",
    chapterId: "how",
    chapterName: "HOW 行為",
    title: "HOW 行為 (Actions)",
    subtitle: "透過具體分析流程，定義可落地的成果",
    image: "assets/投影片22.PNG",
    hasExercise: false,
    hasBoard: false
  },
  {
    index: 23,
    id: "p23-background",
    chapterId: "how",
    chapterName: "HOW 行為",
    title: "Background 背景資訊",
    subtitle: "還原業務現場：業務流程與系統脈絡",
    image: "assets/投影片23.PNG",
    hasExercise: true,
    hasBoard: false
  },
  {
    index: 24,
    id: "p24-analyze-process",
    chapterId: "how",
    chapterName: "HOW > 分析流程",
    title: "Analyze the Process 分析流程",
    subtitle: "5大關鍵步驟：定位用戶、識別人、列實體、排順序、抓訊息",
    image: "assets/投影片24.PNG",
    hasExercise: false,
    hasBoard: false
  },
  {
    index: 25,
    id: "p25-locate-users",
    chapterId: "how",
    chapterName: "HOW > 分析流程",
    title: "定位用戶",
    subtitle: "精準框定流程中發動與參與的各方角色",
    image: "assets/投影片25.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】定位用戶角色與發動情境",
      front: "角色：行動就醫 App 註冊會員（患者本人或家屬代辦人）。\n觸發起點：身體出現症狀或慢箋用藥即將用罄時。",
      back: "【使用設備與場境】利用智慧型手機於通勤或家中進行操作，要求 3 步驟內完成初診或慢箋預約。"
    }
  },
  {
    index: 26,
    id: "p26-identify-stakeholders",
    chapterId: "how",
    chapterName: "HOW > 分析流程",
    title: "識別利害關係人",
    subtitle: "在流程背後審批、支援或受影響的人員",
    image: "assets/投影片26.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】識別流程背後利害關係人",
      front: "1. 門診護理師（負責叫號控管與跟診）\n2. 批價繳費出納員（核對自費收據與健保卡）\n3. 藥師（審核處方箋並調劑藥品）",
      back: "【跨部門權責】各角色資料需即時流轉，任何一個環節卡住（如處方未送達藥局）就會導致患者在大廳久候。"
    }
  },
  {
    index: 27,
    id: "p27-list-entities",
    chapterId: "how",
    chapterName: "HOW > 分析流程",
    title: "列舉相關實體",
    subtitle: "流轉於流程中的關鍵業務名詞與資料實體",
    image: "assets/投影片27.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】關鍵領域實體 (Domain Entities)",
      front: "【門診掛號單 (Appointment)】包含診號、就診日期、時段、科別、醫師代碼。\n【電子處方箋 (Prescription)】包含藥品代碼、劑量、頻率、天數、用藥指示。\n【繳費收據 (Invoice)】包含健保應付、自費項目、支付方式、發票號碼。",
      back: "【實體關聯】一個掛號單在診畢後生成一張處方箋與一筆待繳費單，繳費成功後解鎖處方箋前往藥局排程領藥。"
    }
  },
  {
    index: 28,
    id: "p28-sequence-events",
    chapterId: "how",
    chapterName: "HOW > 分析流程",
    title: "排列事件順序",
    subtitle: "以時間軸排列已發生的領域事件 (Past Tense)",
    image: "assets/投影片28.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】領域事件時間軸 (Domain Events Timeline)",
      front: "1. 【門診預約已完成】➔ 2. 【到院報到已刷卡】➔ 3. 【診間叫號已廣播】➔ 4. 【醫師處方已開立】➔ 5. 【帳單金額已結算】➔ 6. 【行動支付已扣款】➔ 7. 【藥物備妥已取件】",
      back: "【防呆原則】事件一律使用過去式動詞，精準定位業務狀態變更點，確保前後端開發對生命週期無歧義。"
    }
  },
  {
    index: 29,
    id: "p29-key-information",
    chapterId: "how",
    chapterName: "HOW > 分析流程",
    title: "找出關鍵訊息",
    subtitle: "跨角色溝通時必須確認的關鍵欄位與決策訊號",
    image: "assets/投影片29.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】決策關鍵訊息 (Critical Information)",
      front: "【即時候診進度訊號】前面尚有幾位等候、預估看診時間區間。\n【用藥過敏警示欄位】患者是否有抗生素過敏史（開藥時系統阻斷）。\n【自費同意確認】自費醫材價格、患者數位簽名驗證代碼。",
      back: "【業務決策】若系統未回傳「藥物無交互衝突訊號」，不允許醫師送出處方。"
    }
  },
  {
    index: 30,
    id: "p30-define-outcomes",
    chapterId: "how",
    chapterName: "HOW > 定義結果",
    title: "Define the Outcomes 定義結果",
    subtitle: "將行為轉化為可觀察、可驗證的業務結果",
    image: "assets/投影片30.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】Output vs Outcome 區別",
      front: "【Output 產出】上線一個手機繳費功能。\n【Outcome 成果】70% 患者離開診間後 3 分鐘內以手機完成付款，醫院出納櫃台排隊人潮減少 60%。",
      back: "【核心精髓】產出只是一段程式碼或介面，成果才是對使用者行為帶來的正向改變。"
    }
  },
  {
    index: 31,
    id: "p31-outcome",
    chapterId: "how",
    chapterName: "HOW > 定義結果",
    title: "Outcome 結果實踐",
    subtitle: "聚焦行為改變帶來的商業成果",
    image: "assets/投影片31.PNG",
    hasExercise: true,
    hasBoard: false
  },
  {
    index: 32,
    id: "p32-metrics",
    chapterId: "how",
    chapterName: "HOW > 定義結果",
    title: "Metrics 衡量指標",
    subtitle: "量化指標：以數據閉環驗證價值",
    image: "assets/投影片32.PNG",
    hasExercise: true,
    hasBoard: false,
    example: {
      title: "【講師範例】成果數據觀測指標",
      front: "1. 門診平均逗留時間：由 120 分鐘 ➔ 降至 75 分鐘。\n2. 慢箋預約取藥率：達 80% 以上。\n3. 行動支付採用率：達 65% 以上。",
      back: "【觀測機制】後台建立即時儀表板，每週由產品負責人檢核指標達成狀況。"
    }
  },
  {
    index: 33,
    id: "p33-what-intro",
    chapterId: "what",
    chapterName: "WHAT 行動方案",
    title: "WHAT 行動方案 (Deliverables)",
    subtitle: "將共識具體化為可交付的增量與原型",
    image: "assets/投影片33.PNG",
    hasExercise: false,
    hasBoard: false
  },
  {
    index: 34,
    id: "p34-identify-deliverables",
    chapterId: "what",
    chapterName: "WHAT > 識別交付項目",
    title: "Identify Deliverables 識別交付項目",
    subtitle: "拆解需求為具體可排程的任務增量",
    image: "assets/投影片34.PNG",
    hasExercise: true,
    hasBoard: false
  },
  {
    index: 35,
    id: "p35-requirement-hierarchy",
    chapterId: "what",
    chapterName: "WHAT > 識別交付項目",
    title: "Requirement Hierarchy 需求層級",
    subtitle: "Theme ➔ Epic ➔ Feature ➔ User Story 垂直切片",
    image: "assets/投影片35.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】需求層級垂直切片架構",
      front: "【Theme】門診零排隊智慧就醫體驗\n【Epic】自主快速結帳系統\n【Feature】APP 行動支付與電子收據管理\n【User Story】身為患者，我想以 Apple Pay 一鍵結帳，以便快速領藥回家。",
      back: "【垂直切片原則】每個 User Story 必須貫穿 UI、API 與後台資料庫，能在一個 Sprint 內獨立交付可工作的軟體增量。"
    }
  },
  {
    index: 36,
    id: "p36-user-story",
    chapterId: "what",
    chapterName: "WHAT > 識別交付項目",
    title: "User Story 用戶故事 (Vertical Slice)",
    subtitle: "3C 原則：Card, Conversation, Confirmation (AC)",
    image: "assets/投影片36.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】User Story 與 Acceptance Criteria (AC)",
      front: "【User Story 故事正面】\n身為【定期就醫的慢性病患者】\n我想要【在就診前透過 App 自動綁定信用卡並開通免排隊扣款】\n以便於【看診結束後可直接前往藥局領藥，省去大廳排隊繳費的折磨】",
      back: "【Acceptance Criteria 驗收準則反面】\nScenario 1: 扣款成功並開立收據\nGiven 患者已綁定有效之信用卡\nWhen 醫師在診間點擊「結束診療」\nThen 系統在 5 秒內完成後台授權扣款\nAnd 發送推播收據與領藥號碼牌至手機\n\nScenario 2: 信用卡扣款失敗\nGiven 信用卡額度不足或過期\nWhen 系統扣款失敗時\nThen 立即推播簡訊提醒並指引前往人工或自助機補繳"
    },
    cardContext: {
      type: "user-story",
      frontLabel: "用戶故事 (User Story)",
      backLabel: "驗收準則 (Acceptance Criteria, AC)",
      frontPlaceholder: "As a <用戶角色>\nI want to <完成動作>\nSo that <達到商業價值>",
      backPlaceholder: "Given <初始情境>\nWhen <觸發操作>\nThen <預期結果與驗收標準>"
    }
  },
  {
    index: 37,
    id: "p37-ready-done",
    chapterId: "what",
    chapterName: "WHAT > 識別交付項目",
    title: "Ready & DONE 需求完備與產出完工",
    subtitle: "明確 DoR (Definition of Ready) 與 DoD (Definition of Done)",
    image: "assets/投影片37.PNG",
    hasExercise: true,
    hasBoard: false,
    example: {
      title: "【講師範例】DoR 與 DoD 檢核標準",
      front: "【DoR 需求完備門檻】\n1. 符合 INVEST 原則\n2. 具備可自動化測試之 Given-When-Then AC\n3. 包含 UI Wireframe 與 API 欄位規格\n4. 依賴外部系統（如金流）已完成技術預研",
      back: "【DoD 產出完工標準】\n1. 程式碼已通過 Code Review\n2. 單元與整合測試覆蓋率 > 80%\n3. 部署於 Staging 測試環境通過 PO 驗收\n4. 無重大 Severity 1 & 2 Bug 殘留"
    }
  },
  {
    index: 38,
    id: "p38-prioritization",
    chapterId: "what",
    chapterName: "WHAT > 識別交付項目",
    title: "Prioritization 排序需求",
    subtitle: "價值 vs. 複雜度 / MoSCoW 矩陣決策",
    image: "assets/投影片38.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】MoSCoW 需求優先順序排序",
      front: "【Must Have 必備】掛號、看診進度推播、手機線上繳費\n【Should Have 應有】電子處方箋藥物查詢、病患家屬代辦綁定\n【Could Have 可有】停車場空位即時指引、診後滿意度問卷\n【Won't Have 本次不做】AI 診後自動問診機器人",
      back: "【決策邏輯】專注於解決就醫痛點最劇烈之流程，複雜度高且價值邊際遞減項目堅決延後至 Phase 2。"
    }
  },
  {
    index: 39,
    id: "p39-prototype-to-align",
    chapterId: "what",
    chapterName: "WHAT > 用原型對齊共識",
    title: "Prototype to Align 用原型對齊共識",
    subtitle: "做出來勝過千言萬語：快速 Prototype 消除認知落差",
    image: "assets/投影片39.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】以原型對齊共識",
      front: "利用低保真或高保真可互動原型（如 Figma / Web Demo），現場模擬 3 分鐘病患從看診到手機繳費取藥全旅程。",
      back: "【對齊成果】在實際動工撰寫程式碼之前，業務與工程團隊在 10 分鐘內揪出 4 個關鍵盲點並現場修改定案，省下數週重構時間！"
    }
  },
  {
    index: 40,
    id: "p40-contact",
    chapterId: "what",
    chapterName: "課程結語",
    title: "AI 賦能敏捷 · 跨部門溝通萃取需求",
    subtitle: "持續迭代、共創價值 ｜ agiletalks@gmail.com",
    image: "assets/投影片40.PNG",
    hasExercise: false,
    hasBoard: false
  }
];

// 課堂學習公約 (8 項敏捷協作心法)
const LEARNING_AGREEMENTS = [
  {
    id: "la-1",
    index: 1,
    title: "以動制靜",
    slogan: "動手做、動口說，打破沈默僵局",
    tag: "動能 Flow",
    color: "amber",
    image: "assets/以動制靜.png",
    desc: "在敏捷工作坊中化被動為自主行動。遇到卡關時動手試做、開啟對話，讓團隊保持高能量流動。"
  },
  {
    id: "la-2",
    index: 2,
    title: "以圖代文",
    slogan: "一張好圖勝過千言萬語",
    tag: "共識 Alignment",
    color: "blue",
    image: "assets/以圖代文.png",
    desc: "減少冗長文字敘述，多用草圖、線框、視覺化架構表達需求，讓跨部門溝通直觀同頻。"
  },
  {
    id: "la-3",
    index: 3,
    title: "以多勝少",
    slogan: "先發散求量、再收斂求質",
    tag: "創意 Diverge",
    color: "emerald",
    image: "assets/以多勝少.png",
    desc: "在腦力激盪初期不要過早批判，盡可能產出多元觀點與大量便利貼，豐富選項才能淘出真金。"
  },
  {
    id: "la-4",
    index: 4,
    title: "反客為主",
    slogan: "站在使用者視角，創造真正價值",
    tag: "換位 Empathy",
    color: "purple",
    image: "assets/反客為主.png",
    desc: "跳脫主觀本位主義，積極切換至利害關係人與終端用戶情境，萃取核心真實痛點。"
  },
  {
    id: "la-5",
    index: 5,
    title: "截長補短",
    slogan: "跨部門優勢互補，團隊共創",
    tag: "協作 Synergy",
    color: "indigo",
    image: "assets/截長補短.png",
    desc: "業務懂市場、PM 懂節奏、工程懂架構。尊重並結合各自專業，拼出最完整可行的產品方案。"
  },
  {
    id: "la-6",
    index: 6,
    title: "有問有答",
    slogan: "開放傾聽、積極回應、保持透明",
    tag: "溝通 Dialogue",
    color: "sky",
    image: "assets/有問有答.png",
    desc: "大膽提出心中的疑惑，誠懇給予具體回饋。在心理安全的環境中，每一次提問都是對齊的契機。"
  },
  {
    id: "la-7",
    index: 7,
    title: "聽完就說",
    slogan: "即時給予回饋，思緒不放過夜",
    tag: "節奏 Cadence",
    color: "rose",
    image: "assets/聽完就說.png",
    desc: "聽完夥伴分享後立刻交換第一手想法與感受，抓住靈感火花，維持工作坊敏捷緊湊的討論脈動。"
  },
  {
    id: "la-8",
    index: 8,
    title: "讀了要寫",
    slogan: "化吸收為產出，隨手記錄洞見",
    tag: "實踐 Action",
    color: "orange",
    image: "assets/讀了要寫.png",
    desc: "看完教材概念與範例後，立刻在隨堂筆記與線上白板具體化你的點子，學到即產出。"
  }
];

if (typeof window !== 'undefined') {
  window.CHAPTERS = CHAPTERS;
  window.SLIDES_DATA = SLIDES_DATA;
  window.LEARNING_AGREEMENTS = LEARNING_AGREEMENTS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CHAPTERS, SLIDES_DATA, LEARNING_AGREEMENTS };
}

