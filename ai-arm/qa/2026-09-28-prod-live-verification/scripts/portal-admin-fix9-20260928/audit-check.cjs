const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../../evidence/portal-admin-fix9-20260928');
const base = 'https://firestore.googleapis.com/v1/projects/marshmallow-agile-3b4b/databases/(default)/documents';

(async () => {
  const q = await fetch(base + ':runQuery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'split_audit_logs' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'classId' },
            op: 'EQUAL',
            value: { stringValue: 'qa-split-retest' }
          }
        }
      }
    })
  });
  const rows = await q.json();
  let o = {
    at: new Date().toISOString(),
    status: q.status,
    audits: (Array.isArray(rows) ? rows : [])
      .filter(x => x.document)
      .map(x => ({
        name: x.document.name.split('/').pop(),
        fields: Object.keys(x.document.fields),
        adminTokenPublic: typeof x.document.fields.adminToken?.stringValue === 'string',
        toGeneration: x.document.fields.toGeneration
      }))
  };

  fs.writeFileSync(path.join(outDir, 'audit-public-fields.json'), JSON.stringify(o, null, 2));
  console.log(JSON.stringify(o, null, 2));
})();
