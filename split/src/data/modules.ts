export type ModuleId = "E" | "S" | "P" | "L" | "I" | "T";

export interface CourseModule {
  id: ModuleId;
  shortTitle: string;
  title: string;
  subtitle?: string;
  description?: string;
  order: number;
}

export const modules: CourseModule[] = [
  {
    id: "E",
    shortTitle: "E",
    title: "Essential｜敏捷需求基本概念",
    subtitle: "敏捷需求基本概念",
    description: "建立敏捷需求、DoD、DoR、User Story、Vertical Slice 與需求層級的共同語言",
    order: 1
  },
  {
    id: "S",
    shortTitle: "S",
    title: "Structure｜結構與價值脈絡",
    subtitle: "結構與價值脈絡",
    description: "從結構與價值脈絡整理 Product Backlog",
    order: 2
  },
  {
    id: "P",
    shortTitle: "P",
    title: "Process｜流程與價值流",
    subtitle: "流程與價值流",
    description: "從流程、價值流、工作流與情境理解需求",
    order: 3
  },
  {
    id: "L",
    shortTitle: "L",
    title: "Learn｜實驗與不確定性",
    subtitle: "實驗與不確定性",
    description: "透過 MVP、實驗與 Spike 降低不確定性",
    order: 4
  },
  {
    id: "I",
    shortTitle: "I",
    title: "Increment｜可增量交付計劃",
    subtitle: "可增量交付計劃",
    description: "將需求安排成可逐步交付的增量",
    order: 5
  },
  {
    id: "T",
    shortTitle: "T",
    title: "Task｜可執行工作拆解",
    subtitle: "可執行工作拆解",
    description: "將需求進一步轉成可執行的工作",
    order: 6
  }
];
