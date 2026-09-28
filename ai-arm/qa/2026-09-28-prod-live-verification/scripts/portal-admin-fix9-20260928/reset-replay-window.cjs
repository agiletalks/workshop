const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const req = createRequire('C:/Antigravity/workshop/split/package.json');
const firebase = req('firebase/compat/app');
req('firebase/compat/firestore');

const outDir = path.resolve(__dirname, '../../evidence/portal-admin-fix9-20260928');
const out = path.join(outDir, 'reset-replay-window.json');
const root = 'https://firestore.googleapis.com/v1/projects/marshmallow-agile-3b4b/databases/(default)/documents';
const id = 'qa-split-retest';

(async () => {
  const result = {
    at: new Date().toISOString(),
    classId: id,
    method: 'Real production adapter; QA wrapper probes before releaseWriteLease; no product changes',
    probeBodyFields: ['name'],
    authorizationHeader: false
  };

  const app = firebase.initializeApp({
    projectId: 'marshmallow-agile-3b4b',
    apiKey: 'AIzaSyBRVKNOnj3DB4QY9IgCBzC4JcG09XNKVhQ'
  });
  const db = app.firestore();
  const { SplitAdapter } = await import('file:///C:/Antigravity/workshop/adapters/split-adapter.js');
  const adapter = new SplitAdapter(db);

  const before = await (await fetch(root + '/split_classes/' + id)).json();
  result.before = {
    status: before.fields.status.stringValue,
    generation: before.fields.currentGeneration.integerValue
  };

  async function probe() {
    const r = await fetch(root + '/split_classes/' + id + '?updateMask.fieldPaths=name', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { name: before.fields.name } })
    });
    await r.text();
    return { at: new Date().toISOString(), status: r.status };
  }

  result.beforeProbe = await probe();

  const originalRelease = adapter.releaseWriteLease.bind(adapter);
  adapter.releaseWriteLease = async classId => {
    try {
      const doc = await (await fetch(root + '/split_classes/' + id)).json();
      result.publicLeaseFields = ['leaseToken', 'leaseHolder', 'leaseAction'].filter(k => !!doc.fields[k]);
      result.duringProbe = await probe();

      const publicDoc = await (await fetch(root + '/split_classes/' + id)).json();
      const timestamp = publicDoc.fields.updatedAt;
      const generation = publicDoc.fields.currentGeneration;
      const marker = 'qa-fix9-replay-' + Date.now();

      async function submit(collection, fields) {
        const r = await fetch(root + '/' + collection + '/' + marker, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields })
        });
        await r.text();
        return {
          status: r.status,
          documentId: marker,
          authorizationHeader: false,
          bodyFields: Object.keys(fields)
        };
      }

      result.timestampSource = 'Unauthenticated public class GET: updatedAt; no secret read or adapter lease return used';
      result.auditReplay = await submit('split_audit_logs', {
        type: { stringValue: 'CLASS_RESET_GENERATION' },
        classId: { stringValue: id },
        clientRequestId: { stringValue: marker },
        fromGeneration: { integerValue: String(Number(generation.integerValue) - 1) },
        toGeneration: generation,
        reason: { stringValue: 'QA FIX9 authorization probe ONLY; not an additional reset' },
        timestamp
      });

      result.resetRequestReplay = await submit('split_reset_requests', {
        clientRequestId: { stringValue: marker },
        classId: { stringValue: id },
        generation,
        reason: { stringValue: 'QA FIX9 authorization probe ONLY; not an additional reset' },
        createdAt: timestamp
      });
    } finally {
      await originalRelease(classId);
      result.releaseFinished = true;
    }
  };

  try {
    result.operation = await adapter.resetClass(id, 'qa-fix9-legitimate-' + Date.now(), {
      reason: 'QA 第九輪：重設提交後授權隔離複測'
    });
  } catch (e) {
    result.error = String(e.message);
  } finally {
    result.afterProbe = await probe();
    const final = await (await fetch(root + '/split_classes/' + id)).json();
    result.after = {
      status: final.fields.status.stringValue,
      generation: final.fields.currentGeneration.integerValue,
      nameUnchanged: JSON.stringify(final.fields.name) === JSON.stringify(before.fields.name)
    };
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
    await db.terminate();
    await app.delete();
  }
})().catch(e => {
  console.error(e.message);
  process.exitCode = 1;
});
