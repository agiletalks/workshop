const fs = require('fs');
const path = require('path');

const outDir = path.resolve(__dirname, '../../evidence/portal-admin-fix9-20260928');
const base = 'https://firestore.googleapis.com/v1/projects/marshmallow-agile-3b4b/databases/(default)/documents';

(async () => {
  const result = {
    at: new Date().toISOString(),
    tests: []
  };

  // Test 1: Update on arbitrary audit log
  const auditDocId = 'qa-fix8-replay-1790580576777'; // A known probe doc ID from Fix 8
  const auditPatchRes = await fetch(`${base}/split_audit_logs/${auditDocId}?updateMask.fieldPaths=reason`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { reason: { stringValue: 'tampered-reason' } } })
  });
  result.tests.push({
    target: 'split_audit_logs',
    operation: 'UPDATE (PATCH)',
    status: auditPatchRes.status,
    expectedStatus: 403,
    pass: auditPatchRes.status === 403
  });

  // Test 2: Delete on arbitrary audit log
  const auditDeleteRes = await fetch(`${base}/split_audit_logs/${auditDocId}`, {
    method: 'DELETE'
  });
  result.tests.push({
    target: 'split_audit_logs',
    operation: 'DELETE',
    status: auditDeleteRes.status,
    expectedStatus: 403,
    pass: auditDeleteRes.status === 403
  });

  // Test 3: Update on arbitrary reset request
  const resetDocId = 'qa-fix8-replay-1790580576777';
  const resetPatchRes = await fetch(`${base}/split_reset_requests/${resetDocId}?updateMask.fieldPaths=reason`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { reason: { stringValue: 'tampered-reason' } } })
  });
  result.tests.push({
    target: 'split_reset_requests',
    operation: 'UPDATE (PATCH)',
    status: resetPatchRes.status,
    expectedStatus: 403,
    pass: resetPatchRes.status === 403
  });

  // Test 4: Delete on arbitrary reset request
  const resetDeleteRes = await fetch(`${base}/split_reset_requests/${resetDocId}`, {
    method: 'DELETE'
  });
  result.tests.push({
    target: 'split_reset_requests',
    operation: 'DELETE',
    status: resetDeleteRes.status,
    expectedStatus: 403,
    pass: resetDeleteRes.status === 403
  });

  fs.writeFileSync(path.join(outDir, 'immutability-check.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
})();
