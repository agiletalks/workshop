import { CourseAdapterInterface } from './course-adapter-interface.js';

/**
 * 輕量快速 SHA-256 同步雜湊算法
 */
function sha256Sync(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i, j, result = '';
  const words = [];
  const asciiBitLength = ascii.length * 8;
  const hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while (ascii.length % 64 !== 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = [...hash];
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

let fbDeleteField = null;
async function getDeleteField(db) {
  if (fbDeleteField) return fbDeleteField;
  if (typeof globalThis !== 'undefined' && globalThis.firebase?.firestore?.FieldValue?.delete) {
    return globalThis.firebase.firestore.FieldValue.delete();
  }
  if (typeof window !== 'undefined' && window.firebase?.firestore?.FieldValue?.delete) {
    return window.firebase.firestore.FieldValue.delete();
  }
  try {
    const { createRequire } = await import('node:module');
    const req = createRequire(import.meta.url || 'C:/Antigravity/workshop/package.json');
    const fb = req('C:/Antigravity/workshop/split/node_modules/firebase/compat/app');
    req('C:/Antigravity/workshop/split/node_modules/firebase/compat/firestore');
    if (fb?.firestore?.FieldValue?.delete) {
      fbDeleteField = fb.firestore.FieldValue.delete();
      return fbDeleteField;
    }
  } catch (e) {}
  return undefined;
}

/**
 * SplitAdapter
 * 支援 SPLIT 需求拆解工作坊之適配器
 * 具備獨立集合隔離 (split_classes, split_class_secrets, split_data)
 * 支援世代邏輯遞增、單調遞增快照復原與冪等性防護
 */
export class SplitAdapter extends CourseAdapterInterface {
  constructor(firestoreDb, baseUrl = '') {
    super();
    this.db = firestoreDb;
    this.baseUrl = baseUrl || (typeof window !== 'undefined' ? (window.location.origin + window.location.pathname.replace(/\/admin\.html$/, '')) : '');
    this.adminToken = '24721942@Ai';
    this.sessionId = 'admin_sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  setAdminToken(token) {
    if (token) this.adminToken = token;
  }

  getCourseInfo() {
    return {
      id: 'split',
      name: 'SPLIT：需求拆解與用戶故事實戰工作坊',
      description: '從問題本質、用戶旅程到故事切分與驗收條件。完全比照 AI-ARM 筆記體驗與獨立世代資料隔離。',
      isReadOnlyPhase: false,
      defaultTeamCount: 6,
      readOnlyNotice: ''
    };
  }

  /**
   * 取得 SPLIT 班級列表
   */
  async listClasses(options = {}) {
    if (!this.db) {
      console.warn('[SplitAdapter] Firestore not initialized');
      return [];
    }
    const snap = await this.db.collection('split_classes').get();
    const list = [];
    snap.forEach(doc => {
      const d = doc.data();
      list.push({
        id: doc.id,
        name: d.name || '未命名班級',
        teamCount: Number(d.teamCount) || 6,
        status: d.status === 'active' ? 'active' : 'inactive',
        currentGeneration: Number(d.currentGeneration) || 1,
        notes: d.notes || '',
        createdAt: d.createdAt ? (d.createdAt.toMillis ? d.createdAt.toMillis() : d.createdAt) : 0,
        updatedAt: d.updatedAt ? (d.updatedAt.toMillis ? d.updatedAt.toMillis() : d.updatedAt) : 0,
        lastClearedAt: d.lastClearedAt ? (d.lastClearedAt.toMillis ? d.lastClearedAt.toMillis() : d.lastClearedAt) : null
      });
    });
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  async getClass(classId, options = {}) {
    if (!this.db) throw new Error('Firestore not initialized');
    const doc = await this.db.collection('split_classes').doc(classId).get();
    if (!doc.exists) return null;
    const d = doc.data();
    return {
      id: doc.id,
      name: d.name,
      teamCount: Number(d.teamCount) || 6,
      status: d.status === 'active' ? 'active' : 'inactive',
      currentGeneration: Number(d.currentGeneration) || 1,
      notes: d.notes || '',
      createdAt: d.createdAt ? (d.createdAt.toMillis ? d.createdAt.toMillis() : d.createdAt) : 0,
      updatedAt: d.updatedAt ? (d.updatedAt.toMillis ? d.updatedAt.toMillis() : d.updatedAt) : 0,
      lastClearedAt: d.lastClearedAt ? (d.lastClearedAt.toMillis ? d.lastClearedAt.toMillis() : d.lastClearedAt) : null
    };
  }

  /**
   * 取得管理員短期寫入租約 (有效期限 30 秒，綁定特定操作、時間戳記與授權請求識別碼)
   */
  async acquireWriteLease(classId, action = 'saveClass', targetUpdatedAt = Date.now(), extraParams = {}) {
    if (!this.db) throw new Error('Firestore not initialized');
    const now = Date.now();
    const secretRef = this.db.collection('split_class_secrets').doc(classId);
    const leaseData = {
      adminToken: this.adminToken,
      action: action,
      targetUpdatedAt: targetUpdatedAt,
      authorizedRequestId: extraParams.authorizedRequestId || '',
      authorizedAuditId: extraParams.authorizedAuditId || '',
      leaseExpiresAt: now + 30000,
      updatedAt: now
    };
    await secretRef.set(leaseData, { merge: true });
    return leaseData;
  }

  /**
   * 釋放管理員寫入租約
   */
  async releaseWriteLease(classId) {
    if (!this.db) return;
    try {
      const secretRef = this.db.collection('split_class_secrets').doc(classId);
      await secretRef.set({
        adminToken: this.adminToken,
        action: '',
        targetUpdatedAt: 0,
        authorizedRequestId: '',
        authorizedAuditId: '',
        leaseExpiresAt: 0,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      // 租約會自動超時失效，釋放失敗不中斷主流程
    }
  }

  /**
   * 建立或編輯班級
   */
  async saveClass(classData, options = {}) {
    if (!this.db) throw new Error('Firestore not initialized');
    const rawId = (classData.id || '').trim();
    const classId = rawId.toLowerCase();
    if (!classId) throw new Error('班級代碼不能為空');
    if (!classData.name) throw new Error('班級名稱不能為空');

    const teamCount = Math.max(1, Math.min(12, Number(classData.teamCount) || 6));
    const isEdit = Boolean(classData.isEdit);
    const now = Date.now();

    const classRef = this.db.collection('split_classes').doc(classId);
    const secretRef = this.db.collection('split_class_secrets').doc(classId);

    const docSnap = await classRef.get();
    if (!isEdit && docSnap.exists) {
      throw new Error(`班級代碼【${classId}】已存在，請使用不同代碼。`);
    }

    const studentPasscode = (classData.studentPasscode || 'split-2026').trim();
    const passcodeHash = sha256Sync(studentPasscode);

    await this.acquireWriteLease(classId, 'saveClass', now);

    // 1. 機密憑證與管理授權令牌儲存於獨立集合 (絕對禁止客戶端讀取)
    if (!isEdit || classData.studentPasscode || classData.adminPassword) {
      const secretPayload = {
        classId: classId,
        studentPasscode: studentPasscode,
        adminPasswordHash: classData.adminPassword ? btoa(classData.adminPassword) : '',
        adminToken: this.adminToken,
        action: 'saveClass',
        targetUpdatedAt: now,
        leaseExpiresAt: now + 30000,
        updatedAt: now
      };
      await secretRef.set(secretPayload, { merge: true });
    }

    try {
      // 2. 公開班級資料 (絕不包含 adminToken 或任何租約令牌)
      const payload = {
        id: classId,
        name: classData.name.trim(),
        teamCount: teamCount,
        status: classData.status === 'inactive' ? 'inactive' : 'active',
        passcodeHash: passcodeHash,
        notes: classData.notes ? classData.notes.trim() : '',
        updatedAt: now
      };

      if (!isEdit) {
        payload.createdAt = now;
        payload.currentGeneration = 1;
        payload.lastClearedAt = null;
        await classRef.set(payload);
      } else {
        if (classData.studentPasscode) {
          payload.passcodeHash = sha256Sync(classData.studentPasscode.trim());
        }
        await classRef.set(payload, { merge: true });
      }

      return { success: true, classId: classId };
    } finally {
      await this.releaseWriteLease(classId);
    }
  }

  /**
   * 切換啟用/停用
   */
  async toggleClassStatus(classId, shouldActive, options = {}) {
    if (!this.db) throw new Error('Firestore not initialized');
    const now = Date.now();
    await this.acquireWriteLease(classId, 'toggleClassStatus', now);
    try {
      // 公開班級資料絕不寫入 adminToken 或租約令牌
      const updateData = {
        status: shouldActive ? 'active' : 'inactive',
        updatedAt: now
      };

      // 清理歷史殘留公開租約欄位
      const delField = await getDeleteField(this.db);
      if (delField) {
        const docSnap = await this.db.collection('split_classes').doc(classId).get();
        if (docSnap.exists) {
          const d = docSnap.data();
          if (d.leaseToken !== undefined) updateData.leaseToken = delField;
          if (d.leaseHolder !== undefined) updateData.leaseHolder = delField;
          if (d.leaseAction !== undefined) updateData.leaseAction = delField;
        }
      }

      await this.db.collection('split_classes').doc(classId).update(updateData);
      return { success: true };
    } finally {
      await this.releaseWriteLease(classId);
    }
  }

  /**
   * 世代邏輯重設 (原子交易 + 冪等性 Request ID)
   */
  async resetClass(classId, clientRequestId, options = {}) {
    if (!this.db) throw new Error('Firestore not initialized');
    if (!clientRequestId) throw new Error('重設必須提供 clientRequestId 以保障冪等性');

    const classRef = this.db.collection('split_classes').doc(classId);
    const requestRef = this.db.collection('split_reset_requests').doc(clientRequestId);
    const auditRef = this.db.collection('split_audit_logs').doc();

    const now = Date.now();
    await this.acquireWriteLease(classId, 'resetClass', now, {
      authorizedRequestId: clientRequestId,
      authorizedAuditId: auditRef.id
    });
    try {
      return await this.db.runTransaction(async (transaction) => {
        // 1. 檢查冪等性請求紀錄
        const reqDoc = await transaction.get(requestRef);
        if (reqDoc.exists) {
          const d = reqDoc.data();
          return {
            success: true,
            newGeneration: d.generation,
            isDuplicate: true,
            message: '重複的重設請求，已安全略過重複遞增。'
          };
        }

        // 2. 檢查班級存在與狀態
        const classDoc = await transaction.get(classRef);
        if (!classDoc.exists) {
          throw new Error(`找不到班級【${classId}】`);
        }
        const cData = classDoc.data();
        if (cData.status !== 'active') {
          throw new Error(`班級【${classId}】目前處於停用狀態，禁止重設。`);
        }

        const currentGen = Number(cData.currentGeneration) || 1;
        const nextGen = currentGen + 1;
        const resetReason = options.reason || '實戰演練進度切換';

        // 3. 提交遞增與審計日誌 (絕不寫入 adminToken 或租約令牌)
        transaction.set(requestRef, {
          clientRequestId: clientRequestId,
          classId: classId,
          generation: nextGen,
          reason: resetReason,
          createdAt: now
        });

        // 公開班級文件更新 (絕不寫入 adminToken 或租約令牌)
        const updateData = {
          currentGeneration: nextGen,
          lastClearedAt: now,
          lastResetReason: resetReason,
          updatedAt: now
        };
        const delField = await getDeleteField(this.db);
        if (delField && (cData.leaseToken !== undefined || cData.leaseHolder !== undefined || cData.leaseAction !== undefined)) {
          if (cData.leaseToken !== undefined) updateData.leaseToken = delField;
          if (cData.leaseHolder !== undefined) updateData.leaseHolder = delField;
          if (cData.leaseAction !== undefined) updateData.leaseAction = delField;
        }
        transaction.update(classRef, updateData);

        transaction.set(auditRef, {
          type: 'CLASS_RESET_GENERATION',
          classId: classId,
          clientRequestId: clientRequestId,
          fromGeneration: currentGen,
          toGeneration: nextGen,
          reason: resetReason,
          timestamp: now
        });

        return {
          success: true,
          newGeneration: nextGen,
          isDuplicate: false
        };
      });
    } finally {
      await this.releaseWriteLease(classId);
    }
  }

  /**
   * 世代單調遞增快照復原 (Monotonic Snapshot Restore)
   * 嚴格禁止調回舊世代編號，建立 newGen = currentGen + 1，複製 targetGen 之內容
   */
  async restoreGeneration(classId, targetGenerationId, clientRequestId, options = {}) {
    if (!this.db) throw new Error('Firestore not initialized');
    const classRef = this.db.collection('split_classes').doc(classId);
    const classSnap = await classRef.get();
    if (!classSnap.exists) throw new Error(`找不到班級【${classId}】`);

    const cData = classSnap.data();
    const currentGen = Number(cData.currentGeneration) || 1;
    const targetGen = Number(targetGenerationId);

    if (targetGen < 1 || targetGen >= currentGen) {
      throw new Error(`目標復原世代 (${targetGen}) 必須小於目前世代 (${currentGen})`);
    }

    const nextGen = currentGen + 1; // 單調遞增，絕不倒退！
    const now = Date.now();

    // 讀取歷史世代之筆記
    const targetNotesCol = this.db.collection('split_data')
      .doc(classId)
      .collection('generations')
      .doc(String(targetGen))
      .collection('notes');
    
    const snap = await targetNotesCol.get();

    // 建立新世代路徑並複製
    const newNotesCol = this.db.collection('split_data')
      .doc(classId)
      .collection('generations')
      .doc(String(nextGen))
      .collection('notes');

    const auditRef = this.db.collection('split_audit_logs').doc();
    await this.acquireWriteLease(classId, 'restoreGeneration', now, {
      authorizedRequestId: clientRequestId,
      authorizedAuditId: auditRef.id
    });
    try {
      const batch = this.db.batch();
      snap.forEach(doc => {
        const data = doc.data();
        const newRef = newNotesCol.doc(doc.id);
        batch.set(newRef, {
          ...data,
          generation: nextGen,
          lock: { isLocked: false, holderUid: '', sessionId: '', holderName: '', leasedAt: 0, expiresAt: 0 },
          updatedAt: now,
          restoredFromGen: targetGen,
          restoredAt: now
        });
      });

      // 原子切換當前班級世代為 nextGen (絕不寫入 adminToken 或租約令牌)
      const updateData = {
        currentGeneration: nextGen,
        updatedAt: now,
        lastRestoredAt: now,
        restoredFromGeneration: targetGen
      };
      const delField = await getDeleteField(this.db);
      if (delField && (cData.leaseToken !== undefined || cData.leaseHolder !== undefined || cData.leaseAction !== undefined)) {
        if (cData.leaseToken !== undefined) updateData.leaseToken = delField;
        if (cData.leaseHolder !== undefined) updateData.leaseHolder = delField;
        if (cData.leaseAction !== undefined) updateData.leaseAction = delField;
      }
      batch.update(classRef, updateData);

      // 審計記錄 (絕不寫入 adminToken 或租約令牌)
      batch.set(auditRef, {
        type: 'GENERATION_SNAPSHOT_RESTORE',
        classId: classId,
        clientRequestId: clientRequestId,
        sourceGeneration: targetGen,
        newGeneration: nextGen,
        timestamp: now,
        restoredNotesCount: snap.size
      });

      await batch.commit();

      return {
        success: true,
        newGeneration: nextGen,
        restoredFromGen: targetGen,
        clonedNotesCount: snap.size
      };
    } finally {
      await this.releaseWriteLease(classId);
    }
  }

  getStudentUrl(classId) {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    return `${base}split/?c=${encodeURIComponent(classId)}`;
  }

  getInstructorUrl(classId) {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const token = (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('agiletalks_admin_token')) || 'agile-2026';
    return `${base}split/?c=${encodeURIComponent(classId)}&role=instructor&adm=${encodeURIComponent(token)}`;
  }

  getBoardUrl(classId, teamId = 1) {
    const base = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    const t = typeof teamId === 'number' ? `team-${teamId}` : teamId;
    return `${base}split/?c=${encodeURIComponent(classId)}&team=${encodeURIComponent(t)}`;
  }
}
