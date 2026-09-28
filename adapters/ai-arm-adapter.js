import { CourseAdapterInterface } from './course-adapter-interface.js';

/**
 * AiArmAdapter
 * 支援 AI-ARM 課程在中央管理介面之適配器
 * 第一階段：維持既有資料契約，提供【唯讀管理檢視】，既有寫入與清空操作保留於舊版後台
 */
export class AiArmAdapter extends CourseAdapterInterface {
  constructor(firestoreDb, baseUrl = '') {
    super();
    this.db = firestoreDb;
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? (window.location.origin + window.location.pathname.replace(/\/admin\.html$/, '')) : '');
  }

  getCourseInfo() {
    return {
      id: 'ai-arm',
      name: 'AI-ARM：AI 需求建模與敏捷 Refinement',
      description: '從 WHY 目標到 HOW 行為與 WHAT 交付物。整合 46 頁教材導讀與小組共享大白板。',
      isReadOnlyPhase: true,
      defaultTeamCount: 6,
      readOnlyNotice: '第一階段唯讀檢視：AI-ARM 維持既有資料契約，編輯班級與清空請至舊版專屬後台操作。'
    };
  }

  /**
   * 讀取 AI-ARM 班級列表
   */
  async listClasses(options = {}) {
    if (!this.db) {
      console.warn('[AiArmAdapter] Firestore not initialized');
      return [];
    }
    const snap = await this.db.collection('ai_arm_classes').get();
    const list = [];
    snap.forEach(doc => {
      const d = doc.data();
      list.push({
        id: doc.id,
        name: d.name || '未命名班級',
        teamCount: Number(d.teamCount) || 6,
        status: d.status === 'active' ? 'active' : 'inactive',
        coursePassword: String(d.coursePassword || 'agile-2026'),
        notes: d.notes || '',
        createdAt: d.createdAt || 0,
        updatedAt: d.updatedAt || 0,
        isDefault: doc.id === 'default'
      });
    });
    // 依建立時間倒序排序
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  async getClass(classId, options = {}) {
    if (!this.db) throw new Error('Firestore not initialized');
    const doc = await this.db.collection('ai_arm_classes').doc(classId).get();
    if (!doc.exists) return null;
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name,
      teamCount: Number(d.teamCount) || 6,
      status: d.status === 'active' ? 'active' : 'inactive',
      coursePassword: String(d.coursePassword || 'agile-2026'),
      notes: d.notes || '',
      createdAt: d.createdAt || 0,
      updatedAt: d.updatedAt || 0
    };
  }

  // --- 第一階段寫入防護：禁止中央後台直接異動 AI-ARM 集合 ---
  async saveClass() {
    throw new Error('【Phase 1 唯讀保護】AI-ARM 在中央後台目前僅提供唯讀檢視，若需新增或修改班級，請前往舊版專屬後台。');
  }

  async toggleClassStatus() {
    throw new Error('【Phase 1 唯讀保護】AI-ARM 在中央後台目前僅提供唯讀檢視，請前往舊版專屬後台切換狀態。');
  }

  async resetClass() {
    throw new Error('【Phase 1 唯讀保護】AI-ARM 在中央後台目前僅提供唯讀檢視，演練清空請前往舊版專屬後台操作。');
  }

  async restoreGeneration() {
    throw new Error('【Phase 1 唯讀保護】AI-ARM 不支援世代復原。');
  }

  getStudentUrl(classId) {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    return `${base}ai-arm/?c=${encodeURIComponent(classId)}`;
  }

  getBoardUrl(classId, teamId = 1) {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const t = typeof teamId === 'number' ? `team-${teamId}` : teamId;
    return `${base}ai-arm/board.html?c=${encodeURIComponent(classId)}&team=${encodeURIComponent(t)}`;
  }

  getLegacyAdminUrl() {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    return `${base}ai-arm/admin.html`;
  }
}
