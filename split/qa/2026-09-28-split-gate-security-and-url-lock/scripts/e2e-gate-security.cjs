/**
 * E2E Playwright Automation Script for TASK-SPLIT-07
 * SPLIT 班級門禁安全校驗與專屬網址綁定驗收
 * Commit: d258b0d
 * Date: 2026-09-28
 */

const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const { initializeApp } = require('C:/Antigravity/workshop/split/node_modules/firebase/app');
const { getFirestore, doc, setDoc, updateDoc, deleteDoc } = require('C:/Antigravity/workshop/split/node_modules/firebase/firestore');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/workshop/split/';
const VALID_CLASS_ID = 'qa-split-test-01';
const INACTIVE_TEST_CLASS_ID = 'qa-split-inactive-test';
const EVIDENCE_DIR = path.resolve(__dirname, '../evidence');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

// Initialize Firestore client for test management
const firebaseApp = initializeApp({ projectId: 'marshmallow-agile-3b4b' }, 'qa-gate-runner');
const db = getFirestore(firebaseApp);

function sha256Hex(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function runE2E() {
  const testResults = {
    test1_manual_ghost_class_blocked: { pass: false, details: '' },
    test2_url_injected_ghost_class_blocked: { pass: false, details: '' },
    test3_valid_class_login_success: { pass: false, details: '' },
    test4_url_class_code_locked_badge: { pass: false, details: '' },
    test5_wrong_password_blocked: { pass: false, details: '' },
    test6_inactive_class_kick_and_blocked: { pass: false, details: '' }
  };

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });

  try {
    console.log('=== [TASK-SPLIT-07] STARTING GATE SECURITY & URL LOCK E2E ACCEPTANCE TEST ===');

    // ====================================================
    // TEST 1: 手動輸入「未開立班級」阻擋測試
    // ====================================================
    console.log('\n--- TEST 1: Manual Input of Ghost Class Blocked ---');
    const context1 = await browser.newContext();
    const page1 = await context1.newPage({ viewport: { width: 1440, height: 900 } });

    await page1.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page1.waitForSelector('input[placeholder*="202610-split"]', { timeout: 8000 });

    const ghostClass1 = 'random-ghost-class-999';
    await page1.locator('input[placeholder*="202610-split"]').fill(ghostClass1);
    await page1.locator('input[type="password"]').fill('split-2026');
    await page1.locator('button[type="submit"]').click();

    // Verify error banner
    await page1.waitForSelector('.text-rose-400', { timeout: 8000 });
    const errText1 = await page1.locator('.text-rose-400').textContent();
    console.log('  - Test 1 Error received:', errText1);

    const hasExpectedError1 = errText1.includes(`找不到班級【${ghostClass1}】`) &&
      errText1.includes('請先由講師於管理後台開立班級');
    const isWorkshopOpen1 = (await page1.locator('header').count()) > 0;

    console.log('  - Error message matched:', hasExpectedError1);
    console.log('  - Workshop opened (must be false):', isWorkshopOpen1);

    await page1.screenshot({ path: path.join(EVIDENCE_DIR, '01_ghost_class_manual_input_blocked.png') });
    await context1.close();

    if (hasExpectedError1 && !isWorkshopOpen1) {
      testResults.test1_manual_ghost_class_blocked.pass = true;
      testResults.test1_manual_ghost_class_blocked.details = '隨意手動輸入未開立之幽靈班級，系統精準以紅字阻擋並提示需先於管理後台開班，無法進入講義。';
      console.log('>>> TEST 1 PASS');
    } else {
      testResults.test1_manual_ghost_class_blocked.details = 'Test 1 criteria not fully met.';
      console.log('>>> TEST 1 FAIL');
    }

    // ====================================================
    // TEST 2: 專屬網址帶入「不存在班級」阻擋測試 (URL 注入)
    // ====================================================
    console.log('\n--- TEST 2: URL Injected Non-Existent Class Blocked ---');
    const context2 = await browser.newContext();
    const page2 = await context2.newPage({ viewport: { width: 1440, height: 900 } });

    const ghostClass2 = 'not-exist-split-course';
    await page2.goto(`${BASE_URL}?c=${ghostClass2}`, { waitUntil: 'domcontentloaded' });
    await page2.waitForSelector('input[type="password"]', { timeout: 8000 });

    // Verify class code is locked badge
    const isInputPresent2 = (await page2.locator('input[placeholder*="202610-split"]').count()) > 0;
    const lockedBadgeText2 = await page2.locator('.text-emerald-400').first().textContent();
    const hasLockedBadgeLabel2 = (await page2.locator('text=（專屬網址帶入）').count()) > 0;

    console.log('  - Class code input editable (must be false):', isInputPresent2);
    console.log('  - Locked badge text:', lockedBadgeText2);
    console.log('  - Has "（專屬網址帶入）" label:', hasLockedBadgeLabel2);

    await page2.locator('input[type="password"]').fill('split-2026');
    await page2.locator('button[type="submit"]').click();

    // Verify error banner
    await page2.waitForSelector('.text-rose-400', { timeout: 8000 });
    const errText2 = await page2.locator('.text-rose-400').textContent();
    console.log('  - Test 2 Error received:', errText2);

    const hasExpectedError2 = errText2.includes(`找不到班級【${ghostClass2}】`);
    const isWorkshopOpen2 = (await page2.locator('header').count()) > 0;

    console.log('  - Error message matched:', hasExpectedError2);
    console.log('  - Workshop opened (must be false):', isWorkshopOpen2);

    await page2.screenshot({ path: path.join(EVIDENCE_DIR, '02_url_injected_ghost_class_blocked.png') });
    await context2.close();

    if (!isInputPresent2 && hasLockedBadgeLabel2 && hasExpectedError2 && !isWorkshopOpen2) {
      testResults.test2_url_injected_ghost_class_blocked.pass = true;
      testResults.test2_url_injected_ghost_class_blocked.details = '網址注入不存在之班級代碼時，欄位自動鎖定為專屬網址帶入，送出後嚴格阻擋並提示找不到班級。';
      console.log('>>> TEST 2 PASS');
    } else {
      testResults.test2_url_injected_ghost_class_blocked.details = 'Test 2 criteria not fully met.';
      console.log('>>> TEST 2 FAIL');
    }

    // ====================================================
    // TEST 4: 專屬網址代碼「鎖定防護」驗收 (先驗證 UI 鎖定形態)
    // ====================================================
    console.log('\n--- TEST 4: URL Class Code Locked Badge Verification ---');
    const context4 = await browser.newContext();
    const page4 = await context4.newPage({ viewport: { width: 1440, height: 900 } });

    await page4.goto(`${BASE_URL}?c=${VALID_CLASS_ID}`, { waitUntil: 'domcontentloaded' });
    await page4.waitForSelector('input[type="password"]', { timeout: 8000 });

    const isClassInput4 = (await page4.locator('input[placeholder*="202610-split"]').count()) > 0;
    const lockedDiv4 = page4.locator('text=（專屬網址帶入）');
    const hasLockedBadge4 = (await lockedDiv4.count()) > 0;
    const badgeContent4 = await page4.locator('.border-emerald-500\\/40').textContent();

    console.log('  - Has editable class code input (must be false):', isClassInput4);
    console.log('  - Has locked badge "（專屬網址帶入）":', hasLockedBadge4);
    console.log('  - Locked badge content:', badgeContent4);

    await page4.screenshot({ path: path.join(EVIDENCE_DIR, '04_url_class_code_locked_badge.png') });
    await context4.close();

    if (!isClassInput4 && hasLockedBadge4 && badgeContent4.includes(VALID_CLASS_ID)) {
      testResults.test4_url_class_code_locked_badge.pass = true;
      testResults.test4_url_class_code_locked_badge.details = '以專屬網址進入時，班級代碼為不可編輯之綠色鎖定標記並標註（專屬網址帶入），完全杜絕學員誤改。';
      console.log('>>> TEST 4 PASS');
    } else {
      testResults.test4_url_class_code_locked_badge.details = 'Test 4 criteria not fully met.';
      console.log('>>> TEST 4 FAIL');
    }

    // ====================================================
    // TEST 5: 密碼錯誤阻擋驗收
    // ====================================================
    console.log('\n--- TEST 5: Wrong Password Blocked ---');
    const context5 = await browser.newContext();
    const page5 = await context5.newPage({ viewport: { width: 1440, height: 900 } });

    await page5.goto(`${BASE_URL}?c=${VALID_CLASS_ID}`, { waitUntil: 'domcontentloaded' });
    await page5.waitForSelector('input[type="password"]', { timeout: 8000 });

    await page5.locator('input[type="password"]').fill('wrong-pass-123');
    await page5.locator('button[type="submit"]').click();

    await page5.waitForSelector('.text-rose-400', { timeout: 8000 });
    const errText5 = await page5.locator('.text-rose-400').textContent();
    console.log('  - Test 5 Error received:', errText5);

    const hasExpectedError5 = errText5.includes('驗證密碼不符，請輸入此班級專屬之驗證密碼');
    const isWorkshopOpen5 = (await page5.locator('header').count()) > 0;

    console.log('  - Error message matched:', hasExpectedError5);
    console.log('  - Workshop opened (must be false):', isWorkshopOpen5);

    await page5.screenshot({ path: path.join(EVIDENCE_DIR, '05_wrong_password_blocked.png') });
    await context5.close();

    if (hasExpectedError5 && !isWorkshopOpen5) {
      testResults.test5_wrong_password_blocked.pass = true;
      testResults.test5_wrong_password_blocked.details = '輸入錯誤密碼時，系統立即阻擋並提示「驗證密碼不符，請輸入此班級專屬之驗證密碼」，門禁嚴格把關。';
      console.log('>>> TEST 5 PASS');
    } else {
      testResults.test5_wrong_password_blocked.details = 'Test 5 criteria not fully met.';
      console.log('>>> TEST 5 FAIL');
    }

    // ====================================================
    // TEST 3: 後台開立之「真實班級」正常進班測試
    // ====================================================
    console.log('\n--- TEST 3: Valid Class Login Success ---');
    const context3 = await browser.newContext();
    const page3 = await context3.newPage({ viewport: { width: 1440, height: 900 } });

    await page3.goto(`${BASE_URL}?c=${VALID_CLASS_ID}`, { waitUntil: 'domcontentloaded' });
    await page3.waitForSelector('input[type="password"]', { timeout: 8000 });

    const nameInput3 = page3.locator('input[placeholder*="Alex"]');
    if (await nameInput3.count() > 0) {
      await nameInput3.fill('QA-小明');
    }
    await page3.locator('input[type="password"]').fill('split-2026');
    await page3.locator('button[type="submit"]').click();

    await page3.waitForSelector('header', { timeout: 10000 });
    const isHeaderVisible3 = (await page3.locator('header').count()) > 0;
    const hasClassTag3 = (await page3.locator(`text=${VALID_CLASS_ID}`).count()) > 0;

    console.log('  - Header visible:', isHeaderVisible3);
    console.log('  - Class tag displayed in header:', hasClassTag3);

    await page3.screenshot({ path: path.join(EVIDENCE_DIR, '03_valid_class_login_success.png') });
    await context3.close();

    if (isHeaderVisible3 && hasClassTag3) {
      testResults.test3_valid_class_login_success.pass = true;
      testResults.test3_valid_class_login_success.details = '真實存在於 Firestore 且啟用中的班級，輸入正確密碼與組別順利進班，講義教材與面板完整呈現。';
      console.log('>>> TEST 3 PASS');
    } else {
      testResults.test3_valid_class_login_success.details = 'Test 3 criteria not fully met.';
      console.log('>>> TEST 3 FAIL');
    }

    // ====================================================
    // TEST 6: 後台停用班級（Inactive）即時防護與在線踢退測試
    // ====================================================
    console.log('\n--- TEST 6: Inactive Class Online Kick-out & Login Blocked ---');
    const context6 = await browser.newContext();
    const page6 = await context6.newPage({ viewport: { width: 1440, height: 900 } });

    // Step 1: Student logs into valid active class
    console.log('  - Step 1: Logging in as student to active class:', VALID_CLASS_ID);
    await page6.goto(`${BASE_URL}?c=${VALID_CLASS_ID}`, { waitUntil: 'domcontentloaded' });
    await page6.waitForSelector('input[type="password"]', { timeout: 8000 });

    const nameInput6 = page6.locator('input[placeholder*="Alex"]');
    if (await nameInput6.count() > 0) {
      await nameInput6.fill('QA-踢退測試員');
    }
    await page6.locator('input[type="password"]').fill('split-2026');
    await page6.locator('button[type="submit"]').click();

    await page6.waitForSelector('header', { timeout: 10000 });
    console.log('  - Step 2: Student is online in workshop.');
    await page6.screenshot({ path: path.join(EVIDENCE_DIR, '06_online_before_deactivation.png') });

    // Step 3: Admin deactivates class in Firestore via authorized lease
    console.log('  - Step 3: Deactivating class in Firestore via admin lease (status -> inactive)...');
    const deactivateTime = Date.now();
    const secretDocRef = doc(db, 'split_class_secrets', VALID_CLASS_ID);
    const classDocRef = doc(db, 'split_classes', VALID_CLASS_ID);

    await setDoc(secretDocRef, {
      adminToken: '24721942@Ai',
      action: 'toggleClassStatus',
      targetUpdatedAt: deactivateTime,
      leaseExpiresAt: deactivateTime + 30000,
      updatedAt: deactivateTime
    }, { merge: true });

    await updateDoc(classDocRef, {
      status: 'inactive',
      updatedAt: deactivateTime
    });

    // Step 4: Verify student is kicked out to PasswordGate in real-time (< 3s)
    console.log('  - Step 4: Waiting for student to be kicked out in real-time...');
    await page6.waitForSelector('input[type="password"]', { timeout: 10000 });
    const kickElapsedMs = Date.now() - deactivateTime;
    console.log(`  - Student kicked out successfully in ${kickElapsedMs} ms!`);

    const isHeaderGone6 = (await page6.locator('header').count()) === 0;
    const isGateVisible6 = (await page6.locator('button[type="submit"]').count()) > 0;
    console.log('  - Header disappeared:', isHeaderGone6);
    console.log('  - PasswordGate reappeared:', isGateVisible6);

    await page6.screenshot({ path: path.join(EVIDENCE_DIR, '06_kicked_out_to_gate.png') });

    // Step 5: Attempt to log in again to inactive class
    console.log('  - Step 5: Attempting to log into inactive class again...');
    await page6.locator('input[type="password"]').fill('split-2026');
    await page6.locator('button[type="submit"]').click();

    await page6.waitForSelector('.text-rose-400', { timeout: 8000 });
    const inactiveErrText = await page6.locator('.text-rose-400').textContent();
    console.log('  - Inactive login error received:', inactiveErrText);

    const hasInactiveError = inactiveErrText.includes('目前處於停用狀態，暫停開放學員進入');
    console.log('  - Inactive error matched:', hasInactiveError);

    await page6.screenshot({ path: path.join(EVIDENCE_DIR, '06_inactive_login_blocked.png') });

    // Step 6: Restore class to active in Firestore via authorized lease
    console.log('  - Step 6: Restoring class back to active in Firestore...');
    const restoreTime = Date.now();
    await setDoc(secretDocRef, {
      adminToken: '24721942@Ai',
      action: 'toggleClassStatus',
      targetUpdatedAt: restoreTime,
      leaseExpiresAt: restoreTime + 30000,
      updatedAt: restoreTime
    }, { merge: true });

    await updateDoc(classDocRef, {
      status: 'active',
      updatedAt: restoreTime
    });
    console.log('  - Class successfully restored to active!');

    await context6.close();

    if (isHeaderGone6 && isGateVisible6 && hasInactiveError && kickElapsedMs < 5000) {
      testResults.test6_inactive_class_kick_and_blocked.pass = true;
      testResults.test6_inactive_class_kick_and_blocked.details = `在線學員於班級停用後 ${kickElapsedMs}ms 內由 Firestore 即時監聽自動踢退回門禁；再次嘗試登入被嚴格阻擋並提示處於停用狀態。測試後已安全還原班級為啟用。`;
      console.log('>>> TEST 6 PASS');
    } else {
      testResults.test6_inactive_class_kick_and_blocked.details = 'Test 6 criteria not fully met.';
      console.log('>>> TEST 6 FAIL');
    }

  } catch (err) {
    console.error('E2E Execution Error:', err);
  } finally {
    await browser.close();

    const allPass = Object.values(testResults).every(r => r.pass);
    const summaryData = {
      timestamp: new Date().toISOString(),
      commit: 'd258b0d',
      allPass,
      results: testResults
    };
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'test-summary.json'),
      JSON.stringify(summaryData, null, 2),
      'utf-8'
    );
    console.log('\n=== GATE SECURITY & URL LOCK E2E COMPLETED ===');
    console.log('Overall Status:', allPass ? 'ALL PASS (6/6)' : 'FAILURES DETECTED');
  }
}

runE2E();
