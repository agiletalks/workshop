// ai-align 課程投影片資料庫與結構定義 (WHY / WHO / HOW / WHAT)
const CHAPTERS = [
  { id: "cover", code: "INTRO", name: "課程導引", start: 1, end: 2, color: "indigo" },
  { id: "why", code: "WHY", name: "WHY 目標 (Goal)", start: 3, end: 20, color: "amber" },
  { id: "who", code: "WHO", name: "WHO 行為者 (Actor)", start: 21, end: 24, color: "blue" },
  { id: "how", code: "HOW", name: "HOW 行為 (Actions)", start: 25, end: 37, color: "emerald" },
  { id: "what", code: "WHAT", name: "WHAT 行動方案 (Deliverables)", start: 38, end: 46, color: "rose" }
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
      title: "【講師範例】產品願景陳述與 3 大標竿實例庫",
      front: "為跨部門敏捷團隊，打造一套「以原型為共同語言」的智能需求對齊協作平台。",
      back: "【背景痛點】業務、PM 與工程團隊每次開會認知皆有落差，需求變更導致 30% 重工。\n【預期效益】透過 AI 輔助即時產出視覺原型與 Given-When-Then 規格，將需求澄清週期由兩週縮短至 2 天內，大幅提升團隊交付信任感。",
      images: [
        {
          id: "fa-vision",
          title: "案例一：經典手寫海報 ＋ 成效指標便利貼",
          subtitle: "FA 業務管理平台 (FA Service Force Management Platform)",
          badge: "經典手寫海報",
          badgeColor: "amber",
          url: "assets/p04-vision-example-fa.jpg",
          description: "結構化願景句型＋底部 3 張關鍵成效量化指標貼紙（Hit Rate / Active Rate / Achievement Rate），是工作坊實體共創最推薦的經典產出形式。",
          keyTakeaways: [
            "結構化句型：To facilitate [目標]... [平台名稱]... equipt [對象] with [能力] to [成效]",
            "量化驗收：底部明確貼出 Hit Rate (VIP 44.2%)、Active Rate (37.1%) 與達成率",
            "現場共創：手寫大白板紙能極大化凝聚全員跨職能討論熱度"
          ],
          templateSnippet: "To facilitate more effective & efficient financial service\nFA Service Force Management Platform\nequipt FA & SFA with:\n- practical pipeline plan\n- instant consulting support\n- visualized sales performance review\n- proactive solutions\nto streamline the sales processes.\n\n【The success of our project are validated by the result of】\n- Hit Rate: VIP 44.2% / Potential 18.7%\n- Active Rate: VIP 37.1% / Potential 15.7%\n- Achievement Rate: 55.8%"
        },
        {
          id: "avms-vision",
          title: "案例二：圖文並茂 視覺化手繪海報",
          subtitle: "AVMS 自動販賣機雲端管理平台",
          badge: "視覺手繪風",
          badgeColor: "emerald",
          url: "assets/p04-vision-example-avms.jpg",
          description: "善用手繪立體字與插圖（販賣機台、手機雲端連線、錢幣金流），搭配「剩餘量」對話泡泡直戳業者最痛的痛點，跨部門非技術人員也能秒懂。",
          keyTakeaways: [
            "以圖代文：機台、手機聯網、零錢金幣視覺化呈現，一目了然",
            "一句入魂：提供販機業者可隨時追蹤販賣機狀態、飲料剩餘量、營業額的雲端平台",
            "聚焦核心痛點：特別以彩色對話泡泡突出「剩餘量」監控需求"
          ],
          templateSnippet: "AVMS 自動販賣機雲端管理平台\n\n提供 [販機業者]\n可隨時追蹤 [販賣機狀態]、[飲料剩餘量] 與 [營業額] 的 [雲端平台]"
        },
        {
          id: "points-app-vision",
          title: "案例三：高保真數位原型與生態圈架構看板",
          subtitle: "集團點數 App 願景（點數串連生活，服務走進生態圈）",
          badge: "數位原型看板",
          badgeColor: "indigo",
          url: "assets/p04-vision-example-points-app.jpg",
          description: "結合手機 App 視覺原型與完整「願景五大要素矩陣表」（為誰服務、核心需求、差異化價值、商務目標、成功指標），描繪 6 大生態圈結點，具備企業級產品最高規格。",
          keyTakeaways: [
            "五維對齊矩陣：為誰服務 ➔ 核心需求 ➔ 差異化價值 ➔ 商務目標 ➔ 成功指標",
            "原型為共同語言：中央置入 App 真實介面原型，消弭想像落差",
            "生態圈連結：清楚定義信用卡、點數兌換、集團服務、金融商品、合作夥伴等 6 大維度"
          ],
          templateSnippet: "點數串連生活，服務走進生態圈 —— 集團點數 App 願景\n\n【核心願景陳述】\n為既有卡友與臺灣一般民眾，提供簡單、便利、可信任的點數平台，讓使用者輕鬆查詢、累積與兌換點數，並連結多元金融商品與服務。\n\n【五大對齊架構】\n1. 為誰服務：既有卡友 ｜ 臺灣一般民眾\n2. 核心需求：查詢點數 ｜ 累積點數 ｜ 兌換商品 ｜ 連結金融服務\n3. 差異化價值：整合集團資源 ｜ 品牌信任 ｜ 跨子公司生態圈\n4. 商務目標：提升滿意度與推薦意願 ｜ 促進使用與金融商品轉換\n5. 成功指標：註冊與活躍人數 ｜ 點數累積與兌換量 ｜ 金融商品轉換 ｜ NPS\n\n從使用者需求出發，以點數成為進入集團服務的入口。"
        }
      ]
    },
    cardContext: {
      frontLabel: "願景重點",
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
    id: "task-01-envision",
    chapterId: "why",
    chapterName: "WHY > 實作任務",
    title: "TEAM TASK 團隊任務：Envision 制定願景",
    subtitle: "訪談主管 ➔ 生成逐字稿 ➔ 應用 Prompt 萃取願景說明書",
    image: "assets/team-task-envision.jpg",
    hasExercise: true,
    hasBoard: true,
    isTeamTask: true,
    taskInfo: {
      stepCount: 5,
      role: "訪談者 ＆ 受訪主管",
      output: "格式化逐字稿 ＆ 專案願景說明書",
      steps: [
        "1. 團隊選一個人受訪，扮演交辦專案的主管",
        "2. 團隊選一人擔任訪談者，根據本節提出的六個面向，訪談主管",
        "3. 訪談過程中，需用手機錄音，生成原始逐字稿",
        "4. 應用 Prompt，將原始逐字稿整理成格式化逐字稿",
        "5. 應用 Prompt，透過格式化逐字稿，生成容易溝通的海報"
      ]
    },
    prompts: [
      {
        id: "prompt-1-transcript",
        title: "Prompt 1：訪談逐字稿整理 Prompt",
        shortTitle: "Prompt 1：逐字稿整理",
        actionLabel: "複製 Prompt 1：整理逐字稿",
        stepBadge: "步驟 4",
        badgeColor: "amber",
        desc: "將手機錄音轉出的雜亂原始逐字稿，自動區分角色並做最低限度校正，忠於原貌。",
        content: "# 訪談逐字稿整理 Prompt\n\n你是一位專業的「訪談逐字稿編輯助手」。\n\n我接下來會提供一段由語音辨識系統產生的原始逐字稿。內容可能包含：\n\n* 沒有標點\n* 訪談者與受訪者混在一起\n* 同音字或辨識錯字\n* 重複詞、口吃、語助詞\n* 英文專有名詞辨識錯誤\n* 斷句錯誤\n* 部分語意不完整\n\n你的任務是將它整理成「容易閱讀，但忠於原始內容」的訪談逐字稿。\n\n## 一、整理規則\n\n1. 區分角色\n\n   * 將對話區分為「訪談者」與「受訪者」。\n   * 提問、追問、確認、總結前一句或切換問題者，通常為訪談者。\n   * 回答問題、描述經驗、說明專案或表達觀點者，通常為受訪者。\n   * 每次角色切換時，建立新的對話段落。\n   * 若角色不完全確定，依上下文做最合理判斷，不需詢問我。\n\n2. 做最低限度校正\n\n   * 補上標點與合理斷句。\n   * 修正明顯的同音字、錯別字與語音辨識錯誤。\n   * 修正常見英文名稱，例如 AI、ChatGPT、Google、Reporting Line。\n   * 明顯口吃或無意義重複可適度刪除，例如「這個這個這個」整理為「這個」。\n\n3. 保留口語原貌\n\n   * 保留有意義的口語詞，例如「其實、就是、然後、對、OK、好」。\n   * 不要將口語回答改寫成正式書面語。\n   * 不要讓說話者的表達比原本更完整、更漂亮或更有邏輯。\n   * 若句子沒有說完，以「……」保留未完成狀態。\n\n4. 忠於原始內容\n\n   * 不摘要。\n   * 不分析。\n   * 不補充。\n   * 不改變問答順序。\n   * 不加入原文沒有的資訊。\n   * 不自行推論或補完說話者未說出的意思。\n   * 不整理成會議紀錄、文章、結論或洞察。\n\n5. 專有名詞處理\n\n   * 若課程、證照、組織或人名無法確認正確拼法，保留原始辨識結果或最接近原音的寫法。\n   * 不要自行猜測成其他名稱。\n\n## 二、角色判斷範例\n\n原始內容：\n\n「那這個AI助教做好以後是給誰用 是給我們學員 那這個學員是參加什麼課程 參加CFB課程」\n\n整理後：\n\n訪談者：\n那這個 AI 助教做好以後，是給誰使用？\n\n受訪者：\n是給我們的學員。\n\n訪談者：\n那這些學員是參加什麼課程？\n\n受訪者：\n參加 CFB 課程。\n\n## 三、輸出格式\n\n請直接輸出「純文字內容」，不要將內容包在 Markdown 的代碼區塊（code block）中，也不要在前後加入額外的說明或引言。\n\n使用以下結構來區分說話者，並在每個說話者之間空一行：\n\n訪談者：\n[對話內容]\n\n受訪者：\n[對話內容]\n\n## 四、段落原則\n\n同一位說話者連續發言時，放在同一個段落中。\n\n若同一人的發言內容較長，可以在其段落內進行自然換行分段。\n\n只有說話者改變時，才建立新的發言區塊（空一行並加上角色標示）。\n\n## 五、開始處理\n\n以下是原始語音辨識逐字稿：\n\n【請貼上原始逐字稿】"
      },
      {
        id: "prompt-2-envisioning",
        title: "Prompt 2：專案願景制定 Prompt (Envisioning Prompt)",
        shortTitle: "Prompt 2：制定願景說明書",
        actionLabel: "複製 Prompt 2：制定願景",
        stepBadge: "步驟 5",
        badgeColor: "indigo",
        desc: "以敏捷產品經理維度深度萃取訪談逐字稿，推導出六大核心維度專案願景說明書。",
        content: "# 專案願景制定 Prompt (Envisioning Prompt)\n\n你是一位專業的「敏捷產品經理與商業分析師」。你的任務是閱讀一段「專案訪談逐字稿」，從中分析、整理並推導出該專案的「願景說明書（Envisioning Statement）」。\n\n請根據以下由敏捷專案管理定義的六大願景核心維度，對逐字稿進行深度的萃取與分析：\n\n1. **目標用戶 (Users / 幫誰的忙？)**\n   - 我們的目標使用者是誰？請具體描述其角色特徵、工作情境或生活形態。\n\n2. **用戶痛點與卡點 (Users' Needs / 他們遇到什麼困難？)**\n   - 他們在日常或工作上面臨什麼主要困難與卡點？需要我們解決什麼痛點？\n\n3. **專案範圍與定位 (Scope / 我們打算怎麼幫他們？)**\n   - 我們的產品或服務範圍是什麼？如何定位這個解決方案？（例如：一台能通勤又能運動的腳踏車，讓通勤=運動）\n\n4. **核心功能與特色 (Key Features / 我們的解決方案長什麼樣？)**\n   - 大致提供哪些具體功能、特色或成品？這些功能如何對應並解決上述痛點？\n\n5. **獨特價值與區隔點 (Discriminator / 為什麼會選擇我們？)**\n   - 我們有什麼獨特價值與優勢？相較於市面上其他做法或競爭對手，我們的區隔點是什麼？\n\n6. **成效衡量指標 (Measurements / 怎麼知道有幫上忙？)**\n   - 如果這個解決方案成功了，我們會看到什麼具體成果或行為改變？這些指標要如何衡量？\n\n---\n\n## 輸出格式規範\n請直接以繁體中文（zh-Hant）輸出結構化的純文字內容。不要使用 Markdown 的代碼區塊（code block）包裹整個輸出，直接輸出以下結構：\n\n# [專案名稱/主題] 專案願景說明書\n\n## 一、 目標用戶 (Users)\n[在此描述目標用戶]\n\n## 二、 用戶痛點與卡點 (Users' Needs)\n[在此描述痛點與卡點]\n\n## 三、 專案範圍與定位 (Scope)\n[在此描述產品或服務範圍]\n\n## 四、 核心功能與特色 (Key Features)\n[在此列出大致的功能與特色]\n\n## 五、 獨特價值與區隔點 (Discriminator)\n[在此說明區隔點與為什麼選我們]\n\n## 六、 成效衡量指標 (Measurements)\n[在此列出如何定義成功與衡量成效的指標]\n\n---\n\n## 輸入資料\n\n以下是專案訪談的原始逐字稿：\n【請在此貼上專案訪談逐字稿】"
      }
    ],
    example: {
      title: "【團隊任務指引】TEAM TASK: Envision 制定願景 五大實作步驟",
      front: "【實作五部曲】\n1. 團隊選一個人受訪，扮演交辦專案的主管。\n2. 團隊選一人擔任訪談者，根據本節提出的六個面向，訪談主管。\n3. 訪談過程中，需用手機錄音，生成原始逐字稿。\n4. 應用 Prompt 1，將原始逐字稿整理成格式化逐字稿。\n5. 應用 Prompt 2，透過格式化逐字稿，生成容易溝通的海報與願景說明書。",
      back: "【Prompt 1 用途與目標】\n將語音辨識之原始逐字稿區分訪談者與受訪者、補齊斷句標點、修正同音錯字，不摘要不補充，保留口語真實原貌。\n\n【Prompt 2 用途與目標】\n根據敏捷專案管理六大核心維度（Users, Needs, Scope, Key Features, Discriminator, Measurements）深度萃取逐字稿，產出結構化專案願景說明書。"
    },
    cardContext: {
      frontLabel: "小組實作筆記與產出",
      backLabel: "任務指引與 Prompt 說明",
      frontPlaceholder: "點擊此處記錄小組訪談重點、主管回答要點，或貼上 AI 整理後的逐字稿與願景說明書（輸入時自動取得鎖定）...",
      backPlaceholder: ""
    }
  },
  {
    index: 12,
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
    index: 13,
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
    index: 14,
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
    index: 15,
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
    index: 16,
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
    index: 17,
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
    index: 18,
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
    index: 19,
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
    index: 20,
    id: "task-02-objectives",
    chapterId: "why",
    chapterName: "WHY > 實作任務",
    title: "TEAM TASK 團隊任務：訂定商務目標",
    subtitle: "選出最多 3 個商務目標 ➔ 規劃追蹤數據 ➔ AI 輔助模擬 HTML 儀表板",
    image: "assets/team-task-objectives.jpg",
    hasExercise: true,
    hasBoard: true,
    isTeamTask: true,
    taskInfo: {
      stepCount: 3,
      role: "產品團隊 ＆ 商業分析師",
      output: "3 大商務目標、數據指標清單 ＆ HTML 模擬儀表板",
      steps: [
        "1. 團隊針對已經做好願景的專案，選出最多三個 Business Objectives",
        "2. 針對每一個 Objective，想出應該追蹤的是什麼數據",
        "3. 應用 AI 輔助，做出一個可以模擬即時數據的 HTML 儀表板"
      ]
    },
    prompts: [],
    example: {
      title: "【團隊任務指引】TEAM TASK: 訂定商務目標 三大實作步驟",
      front: "【實作三步驟】\n1. 團隊針對已經做好願景的專案，選出最多三個 Business Objectives（由 ABC-ED-IG 七大目標中挑選）。\n2. 針對每一個 Objective，想出應該追蹤的是什麼數據。\n3. 應用 AI 輔助，做出一個可以模擬即時數據的 HTML 儀表板。",
      back: "【ABC-ED-IG 七大目標維度參考】\n- Ability (能力)：組織賦能與數位戰力\n- Benefit (效益)：財務與市場營收價值\n- Cost (成本)：重工浪費與維護負擔減免\n- Efficiency (效率)：Lead Time 交付週期縮短\n- Disruption (擾動)：突破性創新與機制重塑\n- Integrity (穩定)：規格合規與可靠度提升\n- Growth (成長)：市占率、活躍度與留存率擴張"
    },
    cardContext: {
      frontLabel: "小組商務目標與指標規劃",
      backLabel: "任務指引與參考維度",
      frontPlaceholder: "點擊此處記錄小組選定的 3 個商務目標（ABC-ED-IG）、各指標追蹤定義，以及 AI 生成的 HTML 儀表板成果或連結（輸入時自動取得鎖定）...",
      backPlaceholder: ""
    }
  },
  {
    index: 21,
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
    index: 22,
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
    index: 23,
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
    index: 24,
    id: "task-03-interview-outline",
    chapterId: "who",
    chapterName: "WHO > 實作任務",
    title: "TEAM TASK 團隊任務：訂出訪綱",
    subtitle: "找出最關鍵角色 ➔ 錄下討論生成逐字稿 ➔ 應用 Prompt 產出訪談大綱",
    image: "assets/team-task-interview-outline.jpg",
    hasExercise: true,
    hasBoard: true,
    isTeamTask: true,
    taskInfo: {
      stepCount: 4,
      role: "團隊成員 ＆ 關鍵受訪角色",
      output: "關鍵角色清單、討論逐字稿 ＆ 結構化訪談大綱",
      steps: [
        "1. 找出最關鍵的角色 (例如兩個)",
        "2. 說出為什麼這些角色重要，以及如果要訪談該角色，需要釐清的是哪些事情",
        "3. 用手機錄下討論的聲音，複製出原始逐字稿",
        "4. 應用 Prompt，寫出訪談大綱"
      ]
    },
    prompts: [
      {
        id: "prompt-interview-outline",
        title: "關鍵角色訪談大綱制定 Prompt (Interview Guide Prompt)",
        shortTitle: "Prompt：訂出訪綱",
        actionLabel: "複製 Prompt：訂出訪綱",
        stepBadge: "步驟 4",
        badgeColor: "amber",
        desc: "根據小組討論之關鍵角色與核心關切，由 AI 深度萃取並推導出專業結構化訪談大綱。",
        content: "# 關鍵角色訪談大綱制定 Prompt (Interview Guide Prompt)\n\n你是一位專業的「敏捷需求分析師與使用者研究專家（User Researcher / Business Analyst）」。你的任務是閱讀一段團隊針對專案關鍵角色的「討論逐字稿或筆記」，從中萃取受訪對象的核心特質，並設計出專業、具體且能深度挖掘真實痛點的「訪談大綱（Interview Guide）」。\n\n請根據敏捷專案管理與用戶體驗研究原則，為團隊選定的關鍵角色（通常為 1~2 個主要利害關係人或目標使用者），推導出結構化訪綱：\n\n1. **避免引導性提問**：問題需採「開放式（Open-ended）」，引導受訪者描述真實經歷與行為，而非只回答「是/否」或猜測受訪者想要的答案。\n2. **聚焦真實情境而非抽象假設**：鼓勵受訪者回憶「最近一次發生的具體事件」，挖掘工作流程中的摩擦力（Friction）與痛點（Pain Points）。\n3. **貫穿 WHY / WHO / HOW 脈絡**：涵蓋受訪者日常背景、現行流程步驟、深層卡點、以及對未來解方的期望與顧慮。\n4. **提供訪談者追問提示（Probing Tips）**：在關鍵問題旁附上追問引導句（如：「當時發生了什麼事？」、「這件事造成了什麼影響？」）。\n\n---\n\n## 輸出格式規範\n請直接以繁體中文（zh-Hant）輸出結構化的純文字內容。不要使用 Markdown 的代碼區塊（code block）包裹整個輸出，直接輸出以下結構：\n\n# [專案名稱/主題] 關鍵角色深度訪談大綱\n\n## 一、 訪談基本設定\n- **專案主題**：[專案或系統名稱]\n- **核心目標**：[本次訪談預期釐清的核心目標與共識]\n- **聚焦受訪對象**：[列出選定的關鍵角色，如角色 A、角色 B]\n\n## 二、 [關鍵角色 A 名稱] 訪談大綱\n> **角色定位與目標**：[簡述該角色的日常職責與在專案中的重要性]\n\n### 1. 破冰與背景脈絡 (Background & Context)\n- [暖身問題：了解其工作型態、日常使用工具或核心責任]\n- [情境問題：了解其在組織/流程中所處的環節與上下游對象]\n\n### 2. 現行作業流程 (Current Workflow & Journey)\n- [流程探索：請對方描述平常如何執行特定任務的完整步驟]\n- [接觸點梳理：在過程中會與哪些人互動、產出哪些資料或表單]\n\n### 3. 核心痛點與卡點 (Pain Points & Obstacles)\n- [痛點挖掘：現行做法中最花時間、最繁瑣或最容易出錯的環節]\n- [具體案例追問：請對方分享最近一次遇到該痛點的實際經過]\n- 💡 *追問提示*：[給訪談者的追問提示句，如：當這件事發生時，通常如何補救？影響多大？]\n\n### 4. 期望效益與理想願景 (Desired Outcomes & Needs)\n- [價值探索：如果有一套全新解法，最希望優先幫他省下什麼或達成什麼？]\n- [驗收指標：怎樣的情況下，他會覺得這個專案真正幫了大忙？]\n\n### 5. 潛在顧慮與限制 (Concerns & Risks)\n- [抗拒點探討：對於改變現狀或導入新工具，最擔心的風險是什麼？]\n\n---\n\n## 三、 [關鍵角色 B 名稱] 訪談大綱（若討論中包含第二位角色）\n[依相同結構列出角色 B 之訪綱；若僅單一角色則此段可省略或整併]\n\n---\n\n## 四、 訪談技巧與提問備忘 (Interviewer Cheat Sheet)\n- **多問「如何、什麼」少問「為什麼」**：避免讓受訪者感到被質問或進入防衛狀態。\n- **追問具體事實**：「可以舉一個最近發生的實例嗎？」勝過「您平常大概都怎麼做？」。\n- **保持沈默與傾聽**：受訪者停頓時不急著接話，往往能挖出深層心聲。\n\n---\n\n## 輸入資料\n\n以下是小組針對關鍵角色與訪談方向的討論內容/錄音逐字稿：\n【請在此貼上小組討論逐字稿或角色說明】"
      }
    ],
    example: {
      title: "【團隊任務指引】TEAM TASK: 訂出訪綱 四大實作步驟",
      front: "【實作四部曲】\n1. 找出最關鍵的角色（例如 2 個關鍵利害關係人或用戶）。\n2. 說出為什麼這些角色重要，以及如果要訪談該角色，需要釐清的是哪些事情。\n3. 用手機錄下討論的聲音，複製出原始逐字稿。\n4. 應用 Prompt，寫出訪談大綱。",
      back: "【訪談大綱設計維度參考】\n- 受訪角色輪廓（工作場景、核心職責、日常習慣）\n- 現行作業痛點與瓶頸（卡關點、重工處、情緒不滿）\n- 期待的理想解決方案與期望效益\n- 潛在排斥與顧慮（改變成本、資安、學習曲線）"
    },
    cardContext: {
      frontLabel: "小組關鍵角色與訪綱草稿",
      backLabel: "任務指引與訪談維度",
      frontPlaceholder: "點擊此處記錄小組選定的 2 個關鍵角色、釐清事項重點，或貼上 AI 生成的訪談大綱（輸入時自動取得鎖定）...",
      backPlaceholder: ""
    }
  },
  {
    index: 25,
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
    index: 26,
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
    index: 27,
    id: "task-05-desk-research",
    chapterId: "how",
    chapterName: "HOW > 實作任務",
    title: "TEAM TASK 團隊任務：執行桌上研究",
    subtitle: "專案即將組建團隊 ➔ 與 AI 討論盤點關鍵資料 ➔ 完成啟動背景說明",
    image: "assets/team-task-desk-research.jpg",
    hasExercise: true,
    hasBoard: true,
    isTeamTask: true,
    taskInfo: {
      stepCount: 3,
      role: "專案發起人 ＆ 敏捷核心團隊",
      output: "專案啟動關鍵資料盤點清單 ＆ 背景說明摘要",
      steps: [
        "1. 假設本專案即將組建團隊，你將對團隊進行背景說明。",
        "2. 請問應該準備哪些資料，最能讓團隊啟動時掌握關鍵資訊？",
        "3. 請和 AI 討論，找出應該先找哪些資料。"
      ]
    },
    prompts: [],
    example: {
      title: "【團隊任務指引】TEAM TASK: 執行桌上研究 (Desk Research)",
      front: "【任務情境與指引】\n假設本專案即將組建團隊，你將對團隊進行背景說明。\n請問應該準備哪些資料，最能讓團隊啟動時掌握關鍵資訊？\n請和 AI 討論，找出應該先找哪些資料。",
      back: "【桌上研究盤點重點建議】\n1. 業務脈絡與現行流程圖（Domain Workflow）\n2. 涉及系統清單與架構限制（Legacy Architecture & APIs）\n3. 歷史痛點、客訴紀錄或稽核缺失報告（Historical Issues）\n4. 法規合規或安全要求（Regulations & Compliance）\n5. 市場競品或標竿案例（Benchmark Case Studies）"
    },
    cardContext: {
      frontLabel: "桌上研究與關鍵資料盤點",
      backLabel: "任務情境與建議盤點維度",
      frontPlaceholder: "點擊此處記錄小組與 AI 討論的關鍵資料清單、預計優先準備的背景文件，以及團隊啟動背景說明重點（輸入時自動取得鎖定）...",
      backPlaceholder: ""
    }
  },
  {
    index: 28,
    id: "p24-analyze-process",
    chapterId: "how",
    chapterName: "HOW > 分析流程",
    title: "Analyze the Process 分析流程",
    subtitle: "5大關鍵步驟：定位用戶、識別人、列實體、排順序、抓訊息",
    image: "assets/投影片24.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【實戰案例】債務協商與催收平台全流程分析圖",
      front: "透過 5 大關鍵步驟還原複雜金融催收與債務協商全貌：定位用戶（債務人）、識別人（理債人員、放行主管）、列實體（催收平台、卡銀主機、JCIC、協辦行庫），標註流轉傳遞物件（申請書、所得清單、財產清冊、協議書）與 ① ~ ⑱ 完整事件序號。",
      back: "【5 步驟落地對應】\n1. 定位用戶：債務人\n2. 識別人：理債人員、放行主管\n3. 列實體 (場所/系統/設施)：催收平台、卡銀主機、JCIC 聯徵中心、協辦行庫營業部\n（動作傳遞物件：申請書、所得清單、財產清冊、勞保投保資料、債權明細、還款方案、協議書）\n4. 排順序：從債務人提出申請 ① 到和客戶 Sign ⑱ 的端到端閉環\n5. 抓訊息：建案(T)、回覆本行債權(T+25)、報送申請資訊、放行、同意還款方案",
      images: [
        {
          id: "debt-settlement-process",
          title: "實戰案例：金融債務協商與催收全流程分析圖",
          subtitle: "跨機構、跨系統與多角色交互之端到端流程共創看板",
          badge: "流程分析實戰",
          badgeColor: "indigo",
          url: "assets/p24-process-example-debt-settlement.jpg",
          description: "典型的大型金融跨系統業務流程共創圖。黃色便利貼代表「人（用戶與利害關係人）」，藍色便利貼代表「系統與外部機構」，箭頭搭配序號 ①~⑱ 清晰勾勒出資料實體與訊息時序流轉。",
          keyTakeaways: [
            "色彩分群角色：黃色便利貼代表角色（債務人、理債人員、放行主管），藍色代表系統/機構（催收平台、卡銀主機、JCIC、協辦行庫）",
            "實體資料流標註：每條箭頭清楚標明流轉的實體文件（申請書、所得清單、財產清冊、協議書）",
            "完整時序數字鏈：帶圈數字 ① ~ ⑱ 貫穿全流程，並標註時間限制條件（如 T+25 回覆本行債權）",
            "關鍵審批與放行：清楚標示出放行主管的審批放行（⑩、⑪）與最終客戶簽署（⑱）"
          ],
          templateSnippet: "【流程分析 5 步驟盤點表】\n1. 定位用戶 (Users)：\n   - 核心發動者：[債務人]\n\n2. 識別人 (Stakeholders & Systems)：\n   - 內部角色：[理債人員、放行主管]\n   - 系統與外部機構：[催收平台、卡銀主機、JCIC、協辦行庫]\n\n3. 列實體 (Entities)：\n   - 流轉實體：[申請書、所得清單、財產清冊、勞保投保資料、債權明細、還款方案、協議書]\n\n4. 排順序 (Sequence ①~⑱)：\n   - ① 債務人送件 ➔ ② 平台建案 ➔ ③ 報送徵信 ➔ ④~⑦ 回覆債權 ➔ ⑧~⑨ 擬定方案 ➔ ⑩~⑪ 主管放行 ➔ ⑫~⑭ 他行同意 ➔ ⑮~⑱ 簽署協議書\n\n5. 抓訊息 (Key Signals)：\n   - 時限約束：[建案日 T、回覆債權時限 T+25]\n   - 決策訊息：[放行核可、簽章完成]"
        }
      ]
    },
    cardContext: {
      frontLabel: "核心流程角色與流轉實體",
      backLabel: "事件順序與決策關鍵訊息",
      frontPlaceholder: "列出流程中發動的用戶、參與的利害關係人，以及傳遞的關鍵文件或資料實體...",
      backPlaceholder: "依序梳理步驟順序（① ➔ ② ➔ ③），標註審批、時限或防呆決策點..."
    }
  },
  {
    index: 29,
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
    index: 30,
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
    index: 31,
    id: "p27-list-entities",
    chapterId: "how",
    chapterName: "HOW > 分析流程",
    title: "列舉相關實體",
    subtitle: "過程中，經過哪些地方（場所）、系統名稱或設施？",
    image: "assets/投影片27.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】相關實體：場所、系統名稱與設施",
      front: "【實體類型一：場所 (Places / Locations)】\n1. 門診候診區與診間（醫師與患者問診接觸場所）\n2. 批價掛號櫃台（掛號登記、出納收費與身分查核之場所）\n3. 門診藥局（藥品調劑、核方與領藥發藥之場所）\n\n【實體類型二：系統名稱 (Systems)】\n1. HIS 醫院醫療核心系統（儲存電子病歷、處方醫囑與醫事紀錄）\n2. 行動掛號繳費 App（患者手機端操作系統）\n3. 健保醫療資訊雲端查詢系統（外部跨院雲端整合系統）\n\n【實體類型三：設施 (Facilities)】\n1. 自動掛號報到繳費機台 (Kiosk)\n2. 診間多媒體叫號廣播看板",
      back: "【方法論核心釐清：實體 (Entity) vs. 物件 (Object)】\n\n★ 實體 (Entity)：\n指流程中人所處或經過的「場所」、「系統名稱」或「設施」！\n例如：門診診間、掛號櫃台、藥局、HIS 核心系統、掛號 App、自動繳費機。\n\n★ 物件 (Object)：\n指人對人、人對實體、或實體對實體在動作上「傳遞的物件」！\n例如：掛號單、健保卡、電子處方箋、繳費收據、病歷、血液試管、藥袋。\n\n💡 記憶心法：人身在「場所」裡操作「系統設施」，在動作交互中彼此傳遞傳送「物件」！"
    },
    cardContext: {
      frontLabel: "相關實體 (場所 / 系統名稱 / 設施)",
      backLabel: "傳遞物件 (在動作上流轉傳遞的物件)",
      frontPlaceholder: "列出流程中經過的場所（如：候診室、櫃台、門市）、系統名稱（如：HIS系統、App、主機）或硬體設施...",
      backPlaceholder: "列出人對人、人對實體、實體對實體在動作上傳遞的物件（如：健保卡、掛號單、處方箋、收據、藥品）..."
    }
  },
  {
    index: 32,
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
    index: 33,
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
    index: 34,
    id: "task-04-analyze-process",
    chapterId: "how",
    chapterName: "HOW > 實作任務",
    title: "TEAM TASK 團隊任務：分析流程",
    subtitle: "白報紙共創流程圖 ➔ 手機錄音解說 ➔ 應用 AI 產出流程描述文件",
    image: "assets/team-task-analyze-process.jpg",
    hasExercise: true,
    hasBoard: true,
    isTeamTask: true,
    taskInfo: {
      stepCount: 5,
      role: "敏捷跨職能團隊",
      output: "實體流程圖、語音解說逐字稿 ＆ 流程規格文件",
      steps: [
        "1. 選出一個主要流程",
        "2. 找一張白報紙，在左上角寫下流程名稱",
        "3. 用便利貼和色筆，畫出該流程",
        "4. 針對畫好的流程圖，一邊解說，一邊用手機錄下聲音，產生原始逐字稿",
        "5. 應用AI，產出描述該流程的文件"
      ]
    },
    prompts: [],
    example: {
      title: "【團隊任務指引】TEAM TASK: 分析流程 五大實作步驟",
      front: "【實作五部曲】\n1. 選出一個主要流程（例如：門診就醫流程、債務協商流程）。\n2. 找一張白報紙，在左上角寫下流程名稱。\n3. 用便利貼和色筆，畫出該流程（標註用戶、參與人、實體場所/系統設施、動作傳遞物件與事件順序）。\n4. 針對畫好的流程圖，一邊解說，一邊用手機錄下聲音，產生原始逐字稿。\n5. 應用 AI，產出描述該流程的文件。",
      back: "【流程共創四大元素心法】\n- 人（黃色便利貼）：發動的用戶、參與的利害關係人\n- 實體 (場所/系統/設施，藍色便利貼)：經過的場所（診間、分行）、系統名稱（HIS、主機）或設施\n- 動作上傳遞的物件 (Objects)：健保卡、申請書、處方箋、協議書等\n- 序號 ① ~ ⑱ 與訊息：串接清晰時間順序與關鍵規則訊號！"
    },
    cardContext: {
      frontLabel: "小組流程分析筆記與產出",
      backLabel: "任務指引與繪圖規範",
      frontPlaceholder: "點擊此處記錄小組選定的主要流程、參與人、實體場所與物件流轉要點，或貼上 AI 整理後的流程描述文件（輸入時自動取得鎖定）...",
      backPlaceholder: ""
    }
  },
  {
    index: 35,
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
    index: 36,
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
    index: 37,
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
    index: 38,
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
    index: 39,
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
    index: 40,
    id: "p35-requirement-hierarchy",
    chapterId: "what",
    chapterName: "WHAT > 識別交付項目",
    title: "Requirement Hierarchy 需求層級",
    subtitle: "Theme ➔ Epic ➔ Feature ➔ User Story 垂直切片",
    image: "assets/投影片35.PNG",
    hasExercise: true,
    hasBoard: true,
    example: {
      title: "【講師範例】需求層級垂直切片架構與經典故事地圖",
      front: "【Theme】門診零排隊智慧就醫體驗\n【Epic】自主快速結帳系統\n【Feature】APP 行動支付與電子收據管理\n【User Story】身為患者，我想以 Apple Pay 一鍵結帳，以便快速領藥回家。",
      back: "【垂直切片原則】每個 User Story 必須貫穿 UI、API 與後台資料庫，能在一個 Sprint 內獨立交付可工作的軟體增量。",
      images: [
        {
          id: "story-mapping-hierarchy",
          title: "經典實戰：User Story Mapping 故事地圖骨幹與切片圖",
          subtitle: "Steve Rogalsky 經典實戰範例 (User Story Map with Releases)",
          badge: "敏捷經典故事地圖",
          badgeColor: "rose",
          url: "assets/p35-hierarchy-example-story-map.webp",
          description: "敏捷領域最經典的用戶故事地圖範本。頂部橘色卡片為核心活動 (Theme/Activities)，橫向第二層藍色卡片為使用者任務骨幹 (Tasks/Features)，下方縱向排列具體用戶故事，並以水平線切劃出 Release 1 (MVP)、Release 2、Release 3 的增量切片。",
          keyTakeaways: [
            "雙維度結構：橫向由左至右為時間與用戶旅程（Activities ➔ Tasks），縱向由上至下為重要性優先級（Stories）",
            "水平切片 (Horizontal Slices)：透過 Release 1、Release 2、Release 3 劃分出最小可行性產品 (MVP) 與後續反覆增量",
            "狀態視覺化標籤：便利貼上帶有 WIP（進行中）、Done（已完成）標籤，即時反映迭代進展"
          ],
          templateSnippet: "【需求層級與故事地圖架構】\n\n1. 活動層級 (Theme / Activities - 頂層橘色)：\n   - [Organize Email] | [Manage Email] | [Manage Calendar] | [Manage Contacts]\n\n2. 任務骨幹 (Feature / Backbone Tasks - 藍色)：\n   - [Search] ➔ [Compose] ➔ [Read] ➔ [Delete] ...\n\n3. 故事垂直切片 (User Stories & Releases - 黃色)：\n   - 【Release 1 (MVP)】：核心基礎故事，如 Basic Email, View List of Appts\n   - 【Release 2 (增強版)】：HTML 格式支援、郵件優先級、每日行事曆\n   - 【Release 3 (進階版)】：附件搜尋、通訊錄匯入匯出、子資料夾管理"
        }
      ]
    }
  },
  {
    index: 41,
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
    index: 42,
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
    index: 43,
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
    index: 44,
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
    index: 45,
    id: "task-06-prototype-comm",
    chapterId: "what",
    chapterName: "WHAT > 實作任務",
    title: "TEAM TASK 團隊任務：用原型溝通",
    subtitle: "挑出最具代表性用戶故事 ➔ AI 生成 HTML Prototype ➔ 消除認知落差",
    image: "assets/team-task-prototype-comm.jpg",
    hasExercise: true,
    hasBoard: true,
    isTeamTask: true,
    taskInfo: {
      stepCount: 2,
      role: "敏捷跨職能團隊",
      output: "代表性用戶故事 ＆ HTML 互動原型 (Prototype)",
      steps: [
        "1. 挑出最有代表性的用戶故事",
        "2. 請 AI 生成 HTML 的 Prototype，讓你可以用來溝通需求"
      ]
    },
    prompts: [],
    example: {
      title: "【團隊任務指引】TEAM TASK: 用原型溝通 兩大實作步驟",
      front: "【實作二步驟】\n1. 挑出最有代表性的用戶故事（例如：使用者最核心的端到端操作閉環）。\n2. 請 AI 生成 HTML 的 Prototype，讓你可以用來溝通需求。",
      back: "【AI Prototype 提示心法】\n- 提供明確情境：說明使用者是誰、目標是什麼、畫面有哪些關鍵元件\n- 指定技術棧：可請 AI 使用 HTML + Tailwind CSS + 原生 JavaScript，產出單一完整、可直接在瀏覽器預覽的互動頁面\n- 用於對齊共識：拿著可點擊的原型與利害關係人討論，確認『這是不是你要的？』"
    },
    cardContext: {
      frontLabel: "代表性用戶故事與原型成果",
      backLabel: "任務指引與 Prompt 生成要點",
      frontPlaceholder: "點擊此處記錄小組選定的代表性用戶故事、AI 生成的原型 HTML 程式碼、截圖或展示連結（輸入時自動取得鎖定）...",
      backPlaceholder: ""
    }
  },
  {
    index: 46,
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

