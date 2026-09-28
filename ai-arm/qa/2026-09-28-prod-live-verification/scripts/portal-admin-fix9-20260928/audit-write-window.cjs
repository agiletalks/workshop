const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
const req = createRequire('C:/Antigravity/workshop/split/package.json');
const firebase = req('firebase/compat/app');
req('firebase/compat/firestore');

const outDir = path.resolve(__dirname, '../../evidence/portal-admin-fix9-20260928');
const out = path.join(outDir, 'audit-write-window.json');
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

      const auditId = 'qa-fix9-auth-probe-' + Date.now();
      const auditPayload = {
        fields: {
          classId: { stringValue: id },
          type: { stringValue: 'QA_AUTHORIZATION_PROBE_NOT_BUSINESS_EVENT' },
          qaOnly: { booleanValue: true },
          description: { stringValue: 'QA FIX9 unauthenticated audit write test; not a class reset' }
        }
      };
      const auditResponse = await fetch(root + '/split_audit_logs/' + auditId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auditPayload)
      });
      await auditResponse.text();
      result.unauthAuditWrite = {
        status: auditResponse.status,
        documentId: auditId,
        authorizationHeader: false,
        bodyFields: Object.keys(auditPayload.fields),
        retainedForEvidence: auditResponse.status === 200
      };
    } finally {
      await originalRelease(classId);
      result.releaseFinished = true;
    }
  };

  try {
    result.operation = await adapter.toggleClassStatus(id, result.before.status === 'active');
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
