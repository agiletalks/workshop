import type { ModuleId } from "./modules";

export interface CaseStudy {
  enabled: boolean;
  title: string;
  brief: string;
  background: string;
  businessGoal: string;
  roles: string[];
  constraints: string[];
  modulePrompts: Partial<Record<ModuleId, string[]>>;
}

export const caseStudy: CaseStudy = {
  enabled: false,
  title: "",
  brief: "",
  background: "",
  businessGoal: "",
  roles: [],
  constraints: [],
  modulePrompts: {}
};
