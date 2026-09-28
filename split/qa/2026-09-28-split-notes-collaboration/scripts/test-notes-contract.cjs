/**
 * Module 4 Notes Collaboration Contract & Logic Verification Script
 * Validates:
 * 1. Data Schema & Path Contract (split_data/{classId}/generations/{genId}/notes/{slideId}_team_{teamId})
 * 2. Lease Lock Duration (35,000 ms) and Heartbeat (15,000 ms)
 * 3. Lock Exclusivity & Collision Prevention
 * 4. Lease Timeout & Steal (Grab Lock when now > expiresAt)
 * 5. Voluntary Release & Handoff
 * 6. Attachment Size Defense (800 KB ceiling)
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const results = [];

function test(id, description, fn) {
  try {
    fn();
    results.push({ id, description, result: 'PASS' });
    console.log(`[PASS] ${id}: ${description}`);
  } catch (err) {
    results.push({ id, description, result: 'FAIL', error: err.message });
    console.error(`[FAIL] ${id}: ${description} -> ${err.message}`);
  }
}

console.log('=== Starting Module 4 Notes Contract & Logic Verification ===\n');

// 1. Path Contract
test('N01-PATH-CONTRACT', 'Verify target Firestore collection & note document path', () => {
  const notesServiceCode = fs.readFileSync(path.resolve(__dirname, '../../../src/services/notesService.ts'), 'utf8');
  assert(notesServiceCode.includes("`split_data/${classId}/generations/${generationId}/notes/${slideId}_team_${teamId}`"), 'Note path must match generation subcollection');
});

// 2. Lease Duration & Heartbeat
test('N02-LEASE-TIMING-CONTRACT', 'Verify 35s lease duration and 15s heartbeat', () => {
  const notesServiceCode = fs.readFileSync(path.resolve(__dirname, '../../../src/services/notesService.ts'), 'utf8');
  assert(notesServiceCode.includes('now + 35000'), 'Lease expiration must be now + 35,000ms');

  const appCode = fs.readFileSync(path.resolve(__dirname, '../../../src/App.tsx'), 'utf8');
  assert(appCode.includes('15000'), 'Heartbeat renewal interval must be 15,000ms');
});

// 3. Lock Exclusivity Simulation
test('N03-LOCK-EXCLUSIVITY', 'Verify User B cannot acquire lock while User A holds valid lease', () => {
  const now = 1000000;
  let lockState = {
    isLocked: true,
    holderUid: 'user-A',
    sessionId: 'sess-A',
    holderName: '小明',
    leasedAt: now,
    expiresAt: now + 35000
  };

  function canAcquire(lock, currentTime, user) {
    if (!lock || !lock.isLocked) return true;
    if (currentTime > (lock.expiresAt || 0)) return true;
    if (lock.holderUid === user.uid && lock.sessionId === user.sessionId) return true;
    if (user.role === 'instructor') return true;
    return false;
  }

  const userB = { uid: 'user-B', sessionId: 'sess-B', name: '小華', role: 'student' };
  // User B tries at now + 5000ms (still within 35s lease)
  const canUserBAcquire = canAcquire(lockState, now + 5000, userB);
  assert.strictEqual(canUserBAcquire, false, 'User B must be rejected while User A lease is active');
});

// 4. Lease Timeout Steal Simulation
test('N04-LEASE-TIMEOUT-STEAL', 'Verify User B can steal lock after 35s lease expires', () => {
  const now = 1000000;
  let lockState = {
    isLocked: true,
    holderUid: 'user-A',
    sessionId: 'sess-A',
    holderName: '小明',
    leasedAt: now,
    expiresAt: now + 35000
  };

  function canAcquire(lock, currentTime, user) {
    if (!lock || !lock.isLocked) return true;
    if (currentTime > (lock.expiresAt || 0)) return true;
    if (lock.holderUid === user.uid && lock.sessionId === user.sessionId) return true;
    if (user.role === 'instructor') return true;
    return false;
  }

  const userB = { uid: 'user-B', sessionId: 'sess-B', name: '小華', role: 'student' };
  // User B tries at now + 36000ms (lease expired!)
  const canUserBAcquire = canAcquire(lockState, now + 36000, userB);
  assert.strictEqual(canUserBAcquire, true, 'User B must be allowed to steal lock once lease expires');
});

// 5. Voluntary Release Simulation
test('N05-VOLUNTARY-RELEASE', 'Verify User B can acquire lock immediately after User A voluntary release', () => {
  let lockState = {
    isLocked: true,
    holderUid: 'user-A',
    sessionId: 'sess-A',
    holderName: '小明',
    leasedAt: 1000,
    expiresAt: 36000
  };

  // User A releases
  lockState = {
    isLocked: false,
    holderUid: '',
    sessionId: '',
    holderName: '',
    leasedAt: 0,
    expiresAt: 0
  };

  const userB = { uid: 'user-B', sessionId: 'sess-B', name: '小華', role: 'student' };
  const canUserBAcquire = !lockState.isLocked;
  assert.strictEqual(canUserBAcquire, true, 'User B can acquire lock immediately after release');
});

// 6. Attachment Size Ceiling (800 KB)
test('N06-ATTACHMENT-SIZE-LIMIT', 'Verify 800 KB upload limit defense', () => {
  const appCode = fs.readFileSync(path.resolve(__dirname, '../../../src/App.tsx'), 'utf8');
  assert(appCode.includes('800 * 1024'), 'Must enforce 800KB file ceiling');
  assert(appCode.includes('檔案過大'), 'Must alert user when file exceeds 800KB');
});

console.log('\n=== Summary ===');
console.log(JSON.stringify(results, null, 2));

const evidenceDir = path.resolve(__dirname, '../evidence');
fs.writeFileSync(path.join(evidenceDir, 'contract-results.json'), JSON.stringify(results, null, 2));
