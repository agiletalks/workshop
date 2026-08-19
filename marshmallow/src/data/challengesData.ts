import type { Challenge } from '../types';

export const challengesData: Challenge[] = [
  {
    id: 'challenge_1',
    challengeSetId: 'marshmallow_agile_10',
    sequence: 1,
    title: 'Challenge 1 — Make It Work',
    description: '我們需要第一個真正可以使用的產品。請做出一個可以自行站立的結構，並將完整的棉花糖放在結構頂端。',
    acceptanceCriteria: [
      '結構可以自行站立。',
      '棉花糖完整位於結構頂端。',
      '放手後至少維持 5 秒。'
    ],
    learningIntent: '建立 MVP / Working Product 的概念。第一個目標不是做到最高，而是盡快從「沒有產品」進入「已經有可用產品」的狀態。',
    isActive: true
  },
  {
    id: 'challenge_2',
    challengeSetId: 'marshmallow_agile_10',
    sequence: 2,
    title: 'Challenge 2 — Make It Taller',
    description: '產品可以用了，但客戶希望它更高。在 Version 1 的基礎上，提高產品高度。',
    acceptanceCriteria: [
      '持續符合 Challenge 1 的所有條件。',
      '高度必須高於上一版本。',
      '記錄目前高度。'
    ],
    learningIntent: '體驗 Incremental Development：保留已經創造的價值，再增加新的價值。',
    isActive: true
  },
  {
    id: 'challenge_3',
    challengeSetId: 'marshmallow_agile_10',
    sequence: 3,
    title: 'Challenge 3 — Make It Stable',
    description: '高度增加了，但客戶開始在意產品的穩定性。提升結構的穩定性。',
    acceptanceCriteria: [
      '持續符合前一版本所有必要條件。',
      '桌面受到輕微擾動後，結構仍可自行站立。',
      '棉花糖不可掉落。'
    ],
    learningIntent: '新需求不一定只是增加功能，也可能來自品質、可靠性與非功能需求。',
    isActive: true
  },
  {
    id: 'challenge_4',
    challengeSetId: 'marshmallow_agile_10',
    sequence: 4,
    title: 'Challenge 4 — Change the Footprint',
    description: '客戶放置產品的空間有限。縮小產品占用的桌面空間。',
    acceptanceCriteria: [
      '持續符合既有產品條件。',
      '底座占用範圍必須比上一版本更小。',
      '結構仍可自行站立。'
    ],
    learningIntent: '體驗 Constraint Change。市場的新限制可能迫使團隊重新思考原有設計，而不是單純往既有方案增加功能。',
    isActive: true
  },
  {
    id: 'challenge_5',
    challengeSetId: 'marshmallow_agile_10',
    sequence: 5,
    title: 'Challenge 5 — Make It Lean',
    description: '產品可以運作，但成本太高。在維持目前功能的前提下，移除不必要的材料。',
    acceptanceCriteria: [
      '持續符合 Challenge 4 完成時的產品要求。',
      '至少移除一項目前正在使用的材料或材料片段。',
      '移除後產品仍符合 Done 條件。',
      '記錄目前使用的義大利麵數量。'
    ],
    learningIntent: '體驗 Lean Thinking：價值不等於投入更多資源；團隊需要辨識真正必要的部分並減少浪費。',
    isActive: true
  },
  {
    id: 'challenge_6',
    challengeSetId: 'marshmallow_agile_10',
    sequence: 6,
    title: 'Challenge 6 — Respond to Change',
    description: '市場需求改變了：客戶再次把「高度」列為重要競爭條件。在不恢復 Challenge 5 已移除材料的前提下，再次提高產品高度。',
    acceptanceCriteria: [
      '高度高於 Version 5。',
      '不得把 Version 5 已移除的材料重新加入。',
      '產品仍可自行站立，棉花糖仍位於頂端。'
    ],
    learningIntent: '體驗 Responding to Change。真正的能力不是保護原計畫，而是在既有限制下快速回應新的市場要求。',
    isActive: true
  },
  {
    id: 'challenge_7',
    challengeSetId: 'marshmallow_agile_10',
    sequence: 7,
    title: 'Challenge 7 — Recover Fast',
    description: '客戶開始重視產品故障後的恢復能力。產品必須能在拆除一個指定連接點後快速恢復。',
    acceptanceCriteria: [
      '由團隊先指定一個非核心連接點。',
      '拆除該連接後重新修復。',
      '修復完成後重新符合可站立與棉花糖置頂條件。',
      '系統記錄恢復所需時間。'
    ],
    learningIntent: '讓團隊體驗 Resilience、可維護性與快速恢復能力；好的產品設計不只考慮正常運作，也考慮變化與故障。',
    isActive: true
  },
  {
    id: 'challenge_8',
    challengeSetId: 'marshmallow_agile_10',
    sequence: 8,
    title: 'Challenge 8 — New Customer Need',
    description: '新的客戶族群出現了，他們希望產品除了高度之外，還能承載額外物件。請向講師索取「指定物件」，並在結構上增加一個可承載該物件的位置。',
    acceptanceCriteria: [
      '原有結構仍可自行站立。',
      '棉花糖仍完整位於最高點。',
      '向講師索取的指定物件可以穩固放置於結構上至少 5 秒。',
      '不得由人扶持。'
    ],
    learningIntent: '模擬新客群帶來的新需求，體驗 Customer Collaboration 與需求演化。',
    isActive: true
  },
  {
    id: 'challenge_9',
    challengeSetId: 'marshmallow_agile_10',
    sequence: 9,
    title: 'Challenge 9 — Team Signature on Second Marshmallow',
    description: '客戶對個人化與團隊協作提出新要求。請向講師索取第二個棉花糖，所有團隊成員必須在第二個棉花糖上簽名，並將其穩固放置於結構上。',
    acceptanceCriteria: [
      '每個小組成員皆已在第二個棉花糖上簽名。',
      '第二個棉花糖穩固放置於結構上，放手後維持至少 5 秒。',
      '結構仍可自行站立，且第一個棉花糖仍位於最頂端。'
    ],
    learningIntent: '體驗額外負載與團隊協作。在不破壞既有 Working Product 的基礎下，以敏捷精神安全融入全新突發的市場需求。',
    isActive: true
  },
  {
    id: 'challenge_10',
    challengeSetId: 'marshmallow_agile_10',
    sequence: 10,
    title: 'Challenge 10 — Release Ready',
    description: '市場準備正式驗收最終產品。交付目前最佳、可以立即展示給客戶的版本，並完成全組團隊大合照。',
    acceptanceCriteria: [
      '結構可以自行站立。',
      '棉花糖完整位於最高點。',
      '維持站立至少 10 秒。',
      '完成最終高度測量。',
      '完成剩餘材料盤點。',
      '團隊與最終產品完成一張大合照。',
      '完成最終 Version Record。'
    ],
    learningIntent: '體驗 Definition of Done 與 Potentially Releasable Increment。最後一刻不是第一次測試產品是否能用；團隊一路上每個版本都應該是 Done，而最後一版只是目前為止最新、最完整的 Increment。',
    isActive: true
  }
];
