import { CourseAdapterInterface } from './course-adapter-interface.js';

/**
 * AiAlignAdapter
 * 支援 AI-Align (AI 賦能敏捷) 課程在中央管理介面之適配器
 * 通用模式：固定預設班級，維護既有 aigile_boards 與簡報架構
 */
export class AiAlignAdapter extends CourseAdapterInterface {
  constructor(firestoreDb, baseUrl = '') {
    super();
    this.db = firestoreDb;
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? (window.location.origin + window.location.pathname.replace(/\/admin\.html$/, '')) : '');
  }

  getCourseInfo() {
    return {
      id: 'ai-align',
      name: 'AI 賦能敏捷：跨部門溝通萃取需求',
      description: '從 WHY 目標出發，走過 WHO 行為者、HOW 分析流程，直達 WHAT 原型對齊共識。整合 40 頁簡報導讀與即時分組 Tab 協作筆記。',
      isReadOnlyPhase: true,
      defaultTeamCount: 6,
      readOnlyNotice: '通用模式檢視：AI 賦能敏捷採用固定單一班級架構（通行密碼：agile-2026，底層集合：aigile_boards）。'
    };
  }

  /**
   * 讀取班級列表 (提供固定預設班級供後台快速連結與檢視)
   */
  async listClasses(options = {}) {
    return [{
      id: 'default',
      name: '預設敏捷需求班',
      teamCount: 6,
      status: 'active',
      coursePassword: 'agile-2026',
      notes: '固定通用班級（使用 aigile_boards 集合，支援 1~6 組白板）',
      createdAt: 1725753600000,
      updatedAt: Date.now(),
      isDefault: true
    }];
  }

  async getClass(classId, options = {}) {
    const list = await this.listClasses(options);
    return list[0];
  }

  async saveClass() {
    throw new Error('【通用模式保護】AI 賦能敏捷採固定單一班級架構，無需另行新增班級。');
  }

  async toggleClassStatus() {
    throw new Error('【通用模式保護】AI 賦能敏捷預設班級為常駐啟用狀態。');
  }

  async resetClass() {
    throw new Error('【通用模式保護】AI 賦能敏捷不支援後台演練重設，請由講義端操作。');
  }

  async restoreGeneration() {
    throw new Error('【通用模式保護】AI 賦能敏捷不支援世代復原。');
  }

  getStudentUrl(classId) {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    return `${base}ai-align/`;
  }

  getBoardUrl(classId, teamId = 1) {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const t = typeof teamId === 'number' ? `team-${teamId}` : teamId;
    return `${base}ai-align/board.html?team=${encodeURIComponent(t)}&user=%E5%AD%B8%E5%93%A1`;
  }
}
