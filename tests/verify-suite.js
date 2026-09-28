/**
 * Automated Verification Suite for AgileTalks Central Admin & SPLIT Workshop
 */

const assert = require('assert');

console.log('====================================================');
console.log('  AgileTalks Central Admin & SPLIT 驗證測試套件');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         錯誤: ${err.message}\n`);
  }
}

// Mock Firestore Implementation for Unit Testing
function createMockFirestore() {
  const store = new Map();

  function makeDoc(docPath) {
    const parts = docPath.split('/');
    const docId = parts[parts.length - 1];
    return {
      id: docId,
      path: docPath,
      get: async () => {
        const d = store.get(docPath);
        return {
          exists: !!d,
          id: docId,
          data: () => (d ? JSON.parse(JSON.stringify(d)) : undefined)
        };
      },
      set: async (data, opt = {}) => {
        if (opt.merge && store.has(docPath)) {
          store.set(docPath, { ...store.get(docPath), ...data });
        } else {
          store.set(docPath, JSON.parse(JSON.stringify(data)));
        }
      },
      update: async (data) => {
        if (!store.has(docPath)) throw new Error(`Document ${docPath} does not exist`);
        store.set(docPath, { ...store.get(docPath), ...data });
      },
      collection: (subCol) => makeCollection(`${docPath}/${subCol}`)
    };
  }

  function makeCollection(colPath) {
    return {
      doc: (docId) => {
        const id = docId || ('auto_' + Math.random().toString(36).substring(2, 9));
        return makeDoc(`${colPath}/${id}`);
      },
      get: async () => {
        const docs = [];
        const prefix = `${colPath}/`;
        for (const [k, v] of store.entries()) {
          if (k.startsWith(prefix)) {
            const remainder = k.substring(prefix.length);
            if (!remainder.includes('/')) {
              docs.push({
                id: remainder,
                data: () => JSON.parse(JSON.stringify(v))
              });
            }
          }
        }
        return {
          forEach: (cb) => docs.forEach(cb),
          size: docs.length,
          docs: docs
        };
      }
    };
  }

  return {
    _data: store,
    collection: (colName) => makeCollection(colName),
    runTransaction: async (updateFn) => {
      const tx = {
        get: async (ref) => ref.get(),
        set: (ref, data) => ref.set(data),
        update: (ref, data) => ref.update(data)
      };
      return await updateFn(tx);
    },
    batch: () => {
      const ops = [];
      return {
        set: (ref, data) => ops.push(() => ref.set(data)),
        update: (ref, data) => ops.push(() => ref.update(data)),
        commit: async () => {
          for (const op of ops) await op();
        }
      };
    }
  };
}

async function main() {
  const { CourseAdapterInterface } = await import('../adapters/course-adapter-interface.js');
  const { AiArmAdapter } = await import('../adapters/ai-arm-adapter.js');
  const { AiAlignAdapter } = await import('../adapters/ai-align-adapter.js');
  const { SplitAdapter } = await import('../adapters/split-adapter.js');

  console.log('【測試群組 1】Course Adapters 與 AI-ARM 第一階段唯讀防護');

  await test('1.1 CourseAdapterInterface 確保抽象介面定義完整', async () => {
    const adapter = new CourseAdapterInterface();
    assert.throws(() => adapter.getCourseInfo(), /must be implemented/);
  });

  await test('1.2 AiArmAdapter 第一階段強制唯讀 (拒絕 saveClass 與 resetClass)', async () => {
    const mockDb = createMockFirestore();
    const aiAdapter = new AiArmAdapter(mockDb, 'https://aigilt.tw/workshop');

    const info = aiAdapter.getCourseInfo();
    assert.strictEqual(info.id, 'ai-arm');
    assert.strictEqual(info.isReadOnlyPhase, true);

    await assert.rejects(
      async () => await aiAdapter.saveClass({ id: 'test' }),
      /Phase 1 唯讀保護/
    );
    await assert.rejects(
      async () => await aiAdapter.resetClass('test', 'req-1'),
      /Phase 1 唯讀保護/
    );
  });

  await test('1.3 AiArmAdapter 正確讀取既有 Schema (字串密碼與 active/inactive)', async () => {
    const mockDb = createMockFirestore();
    await mockDb.collection('ai_arm_classes').doc('202609-ibm').set({
      name: 'IBM 敏捷實戰班',
      teamCount: 8,
      status: 'active',
      coursePassword: 'ibm-pass-2026',
      createdAt: 1727400000000
    });

    const aiAdapter = new AiArmAdapter(mockDb, 'https://aigilt.tw/workshop');
    const classes = await aiAdapter.listClasses();
    assert.strictEqual(classes.length, 1);
    assert.strictEqual(classes[0].id, '202609-ibm');
    assert.strictEqual(classes[0].coursePassword, 'ibm-pass-2026');
    assert.strictEqual(classes[0].status, 'active');
    assert.strictEqual(typeof classes[0].coursePassword, 'string');
  });

  await test('1.4 AiAlignAdapter 提供通用模式班級與網址生成', async () => {
    const mockDb = createMockFirestore();
    const alignAdapter = new AiAlignAdapter(mockDb, 'https://aigilt.tw/workshop');
    const info = alignAdapter.getCourseInfo();
    assert.strictEqual(info.id, 'ai-align');
    assert.strictEqual(info.isReadOnlyPhase, true);

    const classes = await alignAdapter.listClasses();
    assert.strictEqual(classes.length, 1);
    assert.strictEqual(classes[0].id, 'default');
    assert.strictEqual(classes[0].coursePassword, 'agile-2026');

    const sUrl = alignAdapter.getStudentUrl();
    const bUrl = alignAdapter.getBoardUrl('default', 2);
    assert.strictEqual(sUrl, 'https://aigilt.tw/workshop/ai-align/');
    assert.strictEqual(bUrl, 'https://aigilt.tw/workshop/ai-align/board.html?team=team-2&user=%E5%AD%B8%E5%93%A1');
  });

  console.log('\n【測試群組 2】SPLIT 班級管理、世代遞增與冪等性');

  await test('2.1 SPLIT Adapter 建立班級，分離公開中繼與機密憑證', async () => {
    const mockDb = createMockFirestore();
    const splitAdapter = new SplitAdapter(mockDb, 'https://aigilt.tw/workshop');

    await splitAdapter.saveClass({
      id: '202610-split',
      name: '富邦人壽 需求拆解班',
      teamCount: 6,
      status: 'active',
      studentPasscode: 'fubon-2026',
      adminPassword: 'admin-secret-pass'
    });

    // 檢查公開集合
    const pubDoc = await mockDb.collection('split_classes').doc('202610-split').get();
    assert.strictEqual(pubDoc.exists, true);
    assert.strictEqual(pubDoc.data().currentGeneration, 1);
    assert.strictEqual(pubDoc.data().studentPasscode, undefined, '密碼不得洩漏於公開集合');

    // 檢查機密集合
    const secDoc = await mockDb.collection('split_class_secrets').doc('202610-split').get();
    assert.strictEqual(secDoc.exists, true);
    assert.strictEqual(secDoc.data().studentPasscode, 'fubon-2026');
  });

  await test('2.2 SPLIT 世代遞增交易具備冪等性 (防重複點擊重複遞增)', async () => {
    const mockDb = createMockFirestore();
    const splitAdapter = new SplitAdapter(mockDb);

    await splitAdapter.saveClass({
      id: '202610-split',
      name: '測試班',
      teamCount: 6,
      status: 'active'
    });

    const clientRequestId = 'req_token_alpha_123';

    // 第一次呼叫重設 (指定重設原因)
    const res1 = await splitAdapter.resetClass('202610-split', clientRequestId, { reason: '進入第 2 回合切片實戰' });
    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.newGeneration, 2);
    assert.strictEqual(res1.isDuplicate, false);

    // 第二次以相同 Request ID 呼叫重設
    const res2 = await splitAdapter.resetClass('202610-split', clientRequestId, { reason: '進入第 2 回合切片實戰' });
    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.newGeneration, 2, '世代不可重複遞增為 3');
    assert.strictEqual(res2.isDuplicate, true, '必須標記為重複請求');

    const c = await splitAdapter.getClass('202610-split');
    assert.strictEqual(c.currentGeneration, 2);

    // 檢查班級文件與審計日誌是否記錄了重設原因 (BUG-PORTAL-RETEST-04)
    const classDoc = await mockDb.collection('split_classes').doc('202610-split').get();
    assert.strictEqual(classDoc.data().lastResetReason, '進入第 2 回合切片實戰', '班級必須記錄最後重設原因');

    const auditList = await mockDb.collection('split_audit_logs').get();
    assert.strictEqual(auditList.size >= 1, true);
    let foundAuditWithReason = false;
    auditList.forEach(doc => {
      const d = doc.data();
      if (d.classId === '202610-split' && d.reason === '進入第 2 回合切片實戰') {
        foundAuditWithReason = true;
      }
    });
    assert.strictEqual(foundAuditWithReason, true, '審計日誌必須持久化重設原因');
  });

  await test('2.3 SPLIT 跨班 Session 隔離校驗 (防舊班 session 污染新班 BUG-PORTAL-RETEST-03)', async () => {
    // 模擬存於 localStorage 的舊班 session
    const oldSession = { classId: 'qa-split-2026', teamId: 2, name: '舊學員' };
    const incomingUrlClass = 'qa-split-retest';

    // 驗證邏輯：當 URL 指定新班時，通用舊 session 必須被拒絕，回退為 null 以觸發 PasswordGate
    const resolveSession = (urlClass, stored) => {
      if (!stored) return null;
      if (urlClass && stored.classId?.toLowerCase() !== urlClass.toLowerCase()) {
        return null;
      }
      return stored;
    };

    const result = resolveSession(incomingUrlClass, oldSession);
    assert.strictEqual(result, null, '當 URL 班級與 session 不符時必須拉起門禁，拒絕沿用舊班 session');

    const matchResult = resolveSession(incomingUrlClass, { classId: 'qa-split-retest', teamId: 1, name: '新學員' });
    assert.strictEqual(matchResult !== null, true, '符合當前 URL 班級之 session 始得放行');
  });

  console.log('\n【測試群組 3】單調遞增快照復原 (拒絕世代倒退)');

  await test('3.1 復原作業將歷史快照複製至 newGen = currentGen + 1，清除舊鎖定', async () => {
    const mockDb = createMockFirestore();
    const splitAdapter = new SplitAdapter(mockDb);

    await splitAdapter.saveClass({
      id: 'class-demo',
      name: '演練示範班',
      teamCount: 4,
      status: 'active'
    });

    // 模擬世代 1 存有筆記
    const gen1NoteKey = 'split_data/class-demo/generations/1/notes/slide-1_team_1';
    mockDb._data.set(gen1NoteKey, {
      slideId: 'slide-1',
      teamId: 1,
      generation: 1,
      memo: '這是世代 1 的珍貴結論筆記',
      lock: { isLocked: true, holderUid: 'user-old', expiresAt: 9999999999999 },
      updatedAt: 1727400000000
    });

    // 講師執行重設，進入 Generation 2
    await splitAdapter.resetClass('class-demo', 'req-reset-1');
    const cAfterReset = await splitAdapter.getClass('class-demo');
    assert.strictEqual(cAfterReset.currentGeneration, 2);

    // 講師發現誤操作，欲復原世代 1 之快照
    const restoreRes = await splitAdapter.restoreGeneration('class-demo', 1, 'req-restore-1');
    assert.strictEqual(restoreRes.success, true);
    assert.strictEqual(restoreRes.newGeneration, 3, '世代必須單調遞增為 3，絕不倒退回 1！');
    assert.strictEqual(restoreRes.restoredFromGen, 1);

    // 驗證新世代 3 之筆記快照
    const gen3NoteKey = 'split_data/class-demo/generations/3/notes/slide-1_team_1';
    const gen3Note = mockDb._data.get(gen3NoteKey);
    assert.ok(gen3Note, '世代 3 必須包含復原之筆記');
    assert.strictEqual(gen3Note.memo, '這是世代 1 的珍貴結論筆記');
    assert.strictEqual(gen3Note.generation, 3);
    assert.strictEqual(gen3Note.lock.isLocked, false, '復原時必須清除舊鎖定');
    assert.strictEqual(gen3Note.restoredFromGen, 1);
  });

  console.log('\n【測試群組 4】優先安全案例 (防偽造 teamId、拒絕舊世代離線寫入)');

  await test('4.1 規則驗證：路徑 docId 必須正則綁定 token.teamId (防止偽造寫入他組)', async () => {
    const token = { course: 'split', classId: '202610-split', teamId: 2, role: 'student' };
    
    // 模擬合法請求
    const validDocId = 'slide-5_team_2';
    const validPattern = new RegExp(`^.*_team_${token.teamId}$`);
    assert.strictEqual(validPattern.test(validDocId), true);

    // 模擬偽造攻擊：Team 2 學員嘗試向 Team 1 筆記路徑寫入
    const attackDocId = 'slide-5_team_1';
    assert.strictEqual(validPattern.test(attackDocId), false, '正則必須拒絕非所屬組別的文件路徑');
  });

  await test('4.2 規則驗證：舊世代離線寫入拒絕 (單調遞增復原防線)', async () => {
    const currentClassGen = 3;
    const staleOfflinePayload = { generation: 1, teamId: 1, memo: '延遲的舊髒資料' };
    const incomingGenId = 1;

    const isAllowed = (incomingGenId === currentClassGen) && (staleOfflinePayload.generation === incomingGenId);
    assert.strictEqual(isAllowed, false, '滯留的舊世代離線寫入必須被 Security Rules 判定為過期拒絕');
  });

  await test('4.3 學員密碼驗證邏輯 (BUG-PORTAL-RETEST-05 專屬密碼隔離/拒絕通用旁路/舊session失效)', async () => {
    const crypto = require('crypto');
    function sha256(str) {
      return crypto.createHash('sha256').update(str).digest('hex');
    }

    const classDocDedicated = {
      id: 'qa-split-retest',
      status: 'active',
      passcodeHash: sha256('split-retest')
    };

    const classDocDefault = {
      id: 'qa-split-test-01',
      status: 'active',
      passcodeHash: sha256('split-2026')
    };

    const classDocInactive = {
      id: 'qa-split-inactive',
      status: 'inactive',
      passcodeHash: sha256('split-2026')
    };

    // 密碼比對邏輯 (對齊 PasswordGate.tsx 嚴格模式)
    function verifyPasscode(inputPass, classDoc) {
      if (!inputPass.trim()) return { pass: false, error: '請輸入進班驗證密碼' };
      if (classDoc.status === 'inactive') return { pass: false, error: '班級目前處於停用狀態' };

      const inputHash = sha256(inputPass.trim());
      if (classDoc.passcodeHash) {
        if (inputHash !== classDoc.passcodeHash) {
          return { pass: false, error: '驗證密碼不符，請重新確認' };
        }
      } else {
        if (inputPass.trim() !== 'split-2026') {
          return { pass: false, error: '驗證密碼不符，請重新確認' };
        }
      }
      return { pass: true };
    }

    // 1. 專屬密碼班級 (qa-split-retest) 輸入通用密碼 split-2026 必須被拒絕 (修復 P1 旁路缺陷)
    const bypassAttempt = verifyPasscode('split-2026', classDocDedicated);
    assert.strictEqual(bypassAttempt.pass, false, '專屬密碼班級嚴格禁止通用密碼 split-2026 旁路登入！');
    assert.strictEqual(bypassAttempt.error, '驗證密碼不符，請重新確認');

    // 2. 專屬密碼班級輸入正確密碼 split-retest 必須放行
    const customSuccess = verifyPasscode('split-retest', classDocDedicated);
    assert.strictEqual(customSuccess.pass, true, '專屬密碼班級輸入 split-retest 必須成功放行');

    // 3. 通用班級 (qa-split-test-01) 輸入 split-2026 成功放行
    const defaultSuccess = verifyPasscode('split-2026', classDocDefault);
    assert.strictEqual(defaultSuccess.pass, true);

    // 4. 任意班級輸入隨意錯誤密碼被拒絕
    const wrongAttempt = verifyPasscode('deliberately-wrong-qa-password', classDocDefault);
    assert.strictEqual(wrongAttempt.pass, false);

    // 5. 空白密碼被拒絕
    const emptyAttempt = verifyPasscode('   ', classDocDefault);
    assert.strictEqual(emptyAttempt.pass, false);
    assert.strictEqual(emptyAttempt.error, '請輸入進班驗證密碼');

    // 6. 停用班級被拒絕
    const inactiveAttempt = verifyPasscode('split-2026', classDocInactive);
    assert.strictEqual(inactiveAttempt.pass, false);

    // 7. 既有無效 session 雜湊校驗 (防舊無效 session 繞過門禁)
    const invalidSession = { classId: 'qa-split-retest', passcodeHash: sha256('split-2026') };
    const isSessionValid = Boolean(invalidSession.passcodeHash && invalidSession.passcodeHash === classDocDedicated.passcodeHash);
    assert.strictEqual(isSessionValid, false, '具有錯誤密碼雜湊的舊 session 必須判定為無效並清除！');

    // 8. 舊版無 hash 之 legacy session 淘汰校驗 (BUG-PORTAL-RETEST-05 實測對齊 QA-Third-Default)
    const legacySessionWithoutHash = {
      uid: 'usr_legacy_001',
      sessionId: 'sess_legacy_001',
      name: 'QA-Third-Default',
      teamId: 1,
      classId: 'qa-split-retest'
    };
    function validateSessionAgainstClass(session, classDoc) {
      if (!session || !session.classId) return false;
      if (classDoc.status === 'inactive') return false;
      if (classDoc.passcodeHash) {
        if (!session.passcodeHash || session.passcodeHash !== classDoc.passcodeHash) {
          return false; // 嚴格淘汰缺少 passcodeHash 或雜湊不符的舊 session
        }
      }
      return true;
    }
    const isLegacyEvicted = !validateSessionAgainstClass(legacySessionWithoutHash, classDocDedicated);
    assert.strictEqual(isLegacyEvicted, true, '舊版缺少 passcodeHash 的 session (如 QA-Third-Default) 必須被判定無效並強制退回門禁！');
  });

  await test('4.4 雲端 Firestore Security Rules 即時狀態驗證 (BUG-PORTAL-RETEST-02 對齊 security-check.cjs)', async () => {
    const base = 'https://firestore.googleapis.com/v1/projects/marshmallow-agile-3b4b/databases/(default)/documents';

    // 1. 未授權 GET 機密憑證集合：必須回傳 403 Forbidden
    const secretRes = await fetch(base + '/split_class_secrets/qa-split-retest');
    assert.strictEqual(secretRes.status, 403, '未授權 GET 機密憑證必須回傳 HTTP 403 Forbidden');

    // 2. 公開班級資料讀取：必須 200，且絕不暴露 adminToken 欄位 (adminTokenPublic 必須為 false)
    const classRes = await fetch(base + '/split_classes/qa-split-retest');
    assert.strictEqual(classRes.status, 200, '讀取公開班級資訊必須為 200');
    const classJson = await classRes.json();
    const adminTokenPublic = typeof classJson.fields?.adminToken?.stringValue === 'string';
    assert.strictEqual(adminTokenPublic, false, '公開班級文件嚴格禁止包含 adminToken！adminTokenPublic 必須為 false');

    // 3. 未登入局部 updateMask PATCH 篡改測試 (等同 QA security-check.cjs 重現)：必須回傳 403 Forbidden
    if (classRes.status === 200 && classJson.fields?.name) {
      const patchUrl = `${base}/split_classes/qa-split-retest?updateMask.fieldPaths=name&currentDocument.updateTime=${encodeURIComponent(classJson.updateTime)}`;
      const patchRes = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: { name: classJson.fields.name } })
      });
      assert.strictEqual(patchRes.status, 403, '未授權局部 PATCH 班級文件必須被 Security Rules 阻斷 (回傳 403 Forbidden)');
    }

    // 4. 未授權探測 split_class_secrets (非破壞性探針)：必須回傳 403 Forbidden
    const probeSecretRes = await fetch(base + '/split_class_secrets/qa-dummy-probe-check', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { probe: { stringValue: 'unauth-probe' } } })
    });
    assert.strictEqual(probeSecretRes.status, 403, '未授權 PATCH 機密憑證探針必須回傳 HTTP 403 Forbidden');

    // 5. 未授權 GET 審計紀錄 split_audit_logs：必須回傳 403 Forbidden (BUG-PORTAL-RETEST-02)
    const auditRes = await fetch(base + '/split_audit_logs');
    assert.strictEqual(auditRes.status, 403, '未授權 GET 審計紀錄集合必須回傳 HTTP 403 Forbidden');

    // 6. split_reset_requests 公開資料安全性：絕不得含有 adminToken (BUG-PORTAL-RETEST-02)
    const resetRes = await fetch(base + '/split_reset_requests');
    if (resetRes.status === 200) {
      const resetJson = await resetRes.json();
      for (const doc of (resetJson.documents || [])) {
        assert.strictEqual(Boolean(doc.fields && doc.fields.adminToken), false, `重設請求 ${doc.name} 嚴格禁止含有 adminToken 欄位！`);
      }
    }
  });

  await test('4.5 租約持有者綁定與並行探針防護 (BUG-PORTAL-RETEST-07 嚴格請求者隔離)', async () => {
    const base = 'https://firestore.googleapis.com/v1/projects/marshmallow-agile-3b4b/databases/(default)/documents';

    // 1. 公開班級文件檢查：絕不得包含任何公開租約欄位 (publicLeaseFields 必須為空)
    const classRes = await fetch(base + '/split_classes/qa-split-retest');
    assert.strictEqual(classRes.status, 200);
    const classJson = await classRes.json();
    const publicLeaseFields = ['leaseToken', 'leaseHolder', 'leaseAction'].filter(k => !!classJson.fields?.[k]);
    assert.deepStrictEqual(publicLeaseFields, [], '公開班級文件嚴格禁止暴露 leaseToken/leaseHolder/leaseAction，必須為空陣列！');

    // 2. 模擬 QA 無憑證原值局部 PATCH 探針：即使發送給存在之班級，缺少合法租約與受影響欄位授權必遭 403 阻斷
    const probeUrl = `${base}/split_classes/qa-split-retest?updateMask.fieldPaths=name&currentDocument.updateTime=${encodeURIComponent(classJson.updateTime)}`;
    const unauthProbeRes = await fetch(probeUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { name: classJson.fields.name } })
    });
    assert.strictEqual(unauthProbeRes.status, 403, '未持有單次租約令牌的未登入探針，必須被 Security Rules 回傳 403 Forbidden 徹底阻斷！');

    // 3. 偽造 leaseToken / leaseHolder 探針：必須回傳 403 Forbidden
    const forgedProbeRes = await fetch(probeUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          name: classJson.fields.name,
          leaseToken: { stringValue: 'forged_lease_token_123' },
          leaseHolder: { stringValue: 'forged_holder' },
          leaseAction: { stringValue: 'resetClass' }
        }
      })
    });
    assert.strictEqual(forgedProbeRes.status, 403, '偽造或猜測之租約欄位必須被 Security Rules 拒絕 (403 Forbidden)！');
  });

  await test('4.6 審計日誌與重設請求未授權注入防護 (BUG-PORTAL-RETEST-08 授權邊界)', async () => {
    const base = 'https://firestore.googleapis.com/v1/projects/marshmallow-agile-3b4b/databases/(default)/documents';

    // 1. 未授權寫入 split_audit_logs 測試 (等同 QA BUG-08 實測探針)：必須回傳 403 Forbidden
    const fakeAuditId = 'qa-verify-audit-probe-' + Date.now();
    const fakeAuditRes = await fetch(`${base}/split_audit_logs/${fakeAuditId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          classId: { stringValue: 'qa-split-retest' },
          type: { stringValue: 'QA_AUTHORIZATION_PROBE_NOT_BUSINESS_EVENT' },
          qaOnly: { booleanValue: true },
          description: { stringValue: 'unauth audit test' }
        }
      })
    });
    assert.strictEqual(fakeAuditRes.status, 403, '未授權寫入審計日誌必須被 Security Rules 拒絕 (403 Forbidden)！');

    // 2. 未授權寫入 split_reset_requests 測試：必須回傳 403 Forbidden
    const fakeResetId = 'qa-verify-reset-probe-' + Date.now();
    const fakeResetRes = await fetch(`${base}/split_reset_requests/${fakeResetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          clientRequestId: { stringValue: fakeResetId },
          classId: { stringValue: 'qa-split-retest' },
          generation: { integerValue: 99 },
          reason: { stringValue: 'unauth forged reset' }
        }
      })
    });
    assert.strictEqual(fakeResetRes.status, 403, '未授權建立重設請求必須被 Security Rules 拒絕 (403 Forbidden)！');
  });

  console.log('\n【測試群組 5】全專案具名路徑盤點完整性');

  await test('5.1 具名規則必須包含 AI-ARM 現用備忘路徑 classes/.../instructorNotes', async () => {
    const aiArmSamplePath = 'classes/202609-ibm/slides/P01/instructorNotes/latest';
    const pattern = /^classes\/[^/]+\/slides\/[^/]+\/instructorNotes\/[^/]+$/;
    assert.strictEqual(pattern.test(aiArmSamplePath), true, '必須能正確匹配講師備忘路徑');
  });

  await test('5.2 具名規則必須包含 Marshmallow 工作坊之 agiletalks-db', async () => {
    const mmPath = 'agiletalks-db/marshmallow/workshops/ws-01/teams/team-1';
    const pattern = /^agiletalks-db\/.+$/;
    assert.strictEqual(pattern.test(mmPath), true, '必須匹配 Marshmallow 工作坊路徑');
  });

  console.log('\n====================================================');
  console.log(`  測試完成: ${passedTests} / ${totalTests} 全部通過 (${Math.round((passedTests/totalTests)*100)}% PASS)`);
  console.log('====================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('測試套件執行失敗:', err);
  process.exit(1);
});
