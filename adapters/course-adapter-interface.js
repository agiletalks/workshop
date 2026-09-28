/**
 * CourseAdapterInterface
 * 定義跨課程統一管理後台之通用 Adapter 抽象介面
 */
export class CourseAdapterInterface {
  /**
   * 取得課程基本資訊
   * @returns {{ id: string, name: string, description: string, isReadOnlyPhase: boolean, defaultTeamCount: number }}
   */
  getCourseInfo() {
    throw new Error('getCourseInfo must be implemented');
  }

  /**
   * 取得班級列表
   * @param {Object} [options]
   * @param {AbortSignal} [options.signal]
   * @returns {Promise<Array<Object>>}
   */
  async listClasses(options = {}) {
    throw new Error('listClasses must be implemented');
  }

  /**
   * 取得單一班級資訊
   * @param {string} classId
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  async getClass(classId, options = {}) {
    throw new Error('getClass must be implemented');
  }

  /**
   * 建立或更新班級
   * @param {Object} classData
   * @param {Object} [options]
   * @returns {Promise<{ success: boolean, classId: string, message?: string }>}
   */
  async saveClass(classData, options = {}) {
    throw new Error('saveClass must be implemented');
  }

  /**
   * 切換班級啟用/停用狀態
   * @param {string} classId
   * @param {boolean} shouldActive
   * @param {Object} [options]
   * @returns {Promise<{ success: boolean }>}
   */
  async toggleClassStatus(classId, shouldActive, options = {}) {
    throw new Error('toggleClassStatus must be implemented');
  }

  /**
   * 班級演練重設 (世代遞增)
   * @param {string} classId
   * @param {string} clientRequestId 冪等性 Request ID
   * @param {Object} [options]
   * @returns {Promise<{ success: boolean, newGeneration: number, isDuplicate?: boolean }>}
   */
  async resetClass(classId, clientRequestId, options = {}) {
    throw new Error('resetClass must be implemented');
  }

  /**
   * 世代快照單調遞增復原
   * @param {string} classId
   * @param {number} targetGenerationId 欲復原之歷史世代編號
   * @param {string} clientRequestId
   * @param {Object} [options]
   * @returns {Promise<{ success: boolean, newGeneration: number, restoredFromGen: number }>}
   */
  async restoreGeneration(classId, targetGenerationId, clientRequestId, options = {}) {
    throw new Error('restoreGeneration must be implemented');
  }

  /**
   * 取得學員端專屬網址
   * @param {string} classId
   * @param {Object} [options]
   * @returns {string}
   */
  getStudentUrl(classId, options = {}) {
    throw new Error('getStudentUrl must be implemented');
  }

  /**
   * 取得白板或工作表專屬網址
   * @param {string} classId
   * @param {number|string} [teamId]
   * @param {Object} [options]
   * @returns {string}
   */
  getBoardUrl(classId, teamId = 1, options = {}) {
    throw new Error('getBoardUrl must be implemented');
  }
}
