const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

async function runR2QuestionsVerification() {
  console.log('=== Starting Module 5 R2 Dual-Window E2E Verification ===');
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true
  });

  const evidenceDir = path.resolve(__dirname, '../evidence');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  // Window A: 小明 (Team 1)
  const contextA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageA = await contextA.newPage();
  const consoleA = [];
  pageA.on('console', msg => consoleA.push({ type: msg.type(), text: msg.text() }));
  pageA.on('pageerror', err => consoleA.push({ type: 'pageerror', text: err.message }));
  pageA.on('dialog', async dialog => {
    console.log('[Page A Dialog]:', dialog.message());
    await dialog.accept();
  });

  // Window B: 小華 (Team 2)
  const contextB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageB = await contextB.newPage();
  const consoleB = [];
  pageB.on('console', msg => consoleB.push({ type: msg.type(), text: msg.text() }));
  pageB.on('pageerror', err => consoleB.push({ type: 'pageerror', text: err.message }));
  pageB.on('dialog', async dialog => {
    console.log('[Page B Dialog]:', dialog.message());
    await dialog.accept();
  });

  const results = {};

  try {
    // 1. Login Window A (小明, Team 1)
    console.log('1. Logging in Window A (小明, Team 1)...');
    await pageA.goto('http://localhost:5000/workshop/split/?c=qa-split-test-01', { waitUntil: 'networkidle' });
    await pageA.waitForTimeout(1000);

    const nameInputA = pageA.locator('input[placeholder*="Alex"]');
    if (await nameInputA.isVisible()) {
      await nameInputA.fill('小明');
      const teamSelectA = pageA.locator('select').first();
      await teamSelectA.selectOption('1');
      const passA = pageA.locator('input[type="password"]');
      if (await passA.isVisible()) await passA.fill('split-2026');
      await pageA.click('button[type="submit"]');
      await pageA.waitForTimeout(1500);
    }

    // 2. Login Window B (小華, Team 2)
    console.log('2. Logging in Window B (小華, Team 2)...');
    await pageB.goto('http://localhost:5000/workshop/split/?c=qa-split-test-01', { waitUntil: 'networkidle' });
    await pageB.waitForTimeout(1000);

    const nameInputB = pageB.locator('input[placeholder*="Alex"]');
    if (await nameInputB.isVisible()) {
      await nameInputB.fill('小華');
      const teamSelectB = pageB.locator('select').first();
      await teamSelectB.selectOption('2');
      const passB = pageB.locator('input[type="password"]');
      if (await passB.isVisible()) await passB.fill('split-2026');
      await pageB.click('button[type="submit"]');
      await pageB.waitForTimeout(1500);
    }

    // 3. Open Questions Drawer in both windows
    console.log('3. Opening Questions Drawer in Window A & B...');
    const fabA = pageA.locator('button:has-text("課堂提問")');
    await fabA.click();
    await pageA.waitForTimeout(800);

    const fabB = pageB.locator('button:has-text("課堂提問")');
    await fabB.click();
    await pageB.waitForTimeout(800);

    // 4. Window A submits a question
    const testQuestionText = `QA-R2-Story-Split-${Date.now()}`;
    console.log(`4. Window A submitting question: "${testQuestionText}"...`);

    const textareaA = pageA.locator('textarea[placeholder*="有任何疑問嗎"]');
    await textareaA.fill(testQuestionText);
    const submitBtnA = pageA.locator('button:has-text("送出提問")');
    await submitBtnA.click();
    await pageA.waitForTimeout(1500);

    // Assert Window A displays the new question
    const cardA = pageA.locator('.group').filter({ hasText: testQuestionText });
    await cardA.waitFor({ state: 'attached', timeout: 10000 });
    const qVisibleInA = await cardA.isVisible();
    console.log('Question visible in Window A:', qVisibleInA);
    results.qVisibleInA = qVisibleInA;
    await pageA.screenshot({ path: path.join(evidenceDir, 'r2-window-a-submitted.png') });

    // 5. Assert Window B receives the question WITHOUT reloading
    console.log('5. Asserting Window B receives question via real-time broadcast...');
    const cardB = pageB.locator('.group').filter({ hasText: testQuestionText });
    await cardB.waitFor({ state: 'attached', timeout: 10000 });
    const qVisibleInB = await cardB.isVisible();
    console.log('Question visible in Window B (No reload):', qVisibleInB);
    results.qBroadcastToBWithoutReload = qVisibleInB;
    await pageB.screenshot({ path: path.join(evidenceDir, 'r2-window-b-broadcast-received.png') });

    // 6. Window B clicks +1 Upvote
    console.log('6. Window B clicks +1 upvote...');
    const upvoteBtnB = cardB.locator('button[title*="附議"]').first();
    const countSpanB = upvoteBtnB.locator('span').nth(1);
    await upvoteBtnB.click();

    // Await upvote count update to 1 in Window B
    let countB = '';
    for (let i = 0; i < 20; i++) {
      await pageB.waitForTimeout(500);
      countB = (await countSpanB.innerText()).trim();
      if (countB === '1') break;
    }
    console.log('Upvote button text in Window B:', countB);
    results.upvoteInB = countB === '1';

    // 7. Assert Window A updates to 1 upvote WITHOUT reloading
    console.log('7. Asserting Window A reflects 1 upvote in real-time...');
    const upvoteBtnA = cardA.locator('button[title*="附議"]').first();
    const countSpanA = upvoteBtnA.locator('span').nth(1);
    let countA = '';
    for (let i = 0; i < 20; i++) {
      await pageA.waitForTimeout(500);
      countA = (await countSpanA.innerText()).trim();
      if (countA === '1') break;
    }
    console.log('Upvote button text in Window A (No reload):', countA);
    results.upvoteSyncedToAWithoutReload = countA === '1';

    await pageA.screenshot({ path: path.join(evidenceDir, 'r2-window-a-upvote-synced.png') });
    await pageB.screenshot({ path: path.join(evidenceDir, 'r2-window-b-upvote-clicked.png') });

    // 8. Window B cancels upvote (toggle back to 0)
    console.log('8. Window B clicks upvote again to cancel...');
    await upvoteBtnB.click();
    let countBCancel = '';
    for (let i = 0; i < 20; i++) {
      await pageB.waitForTimeout(500);
      countBCancel = (await countSpanB.innerText()).trim();
      if (countBCancel === '0') break;
    }
    console.log('Upvote button text in B after cancel:', countBCancel);
    results.cancelUpvoteInB = countBCancel === '0';

    let countACancel = '';
    for (let i = 0; i < 20; i++) {
      await pageA.waitForTimeout(500);
      countACancel = (await countSpanA.innerText()).trim();
      if (countACancel === '0') break;
    }
    console.log('Upvote button text in A after cancel sync:', countACancel);
    results.cancelUpvoteSyncedToA = countACancel === '0';

    // 9. Test Slide Jump in Window B
    console.log('9. Testing slide jump link from question card in Window B...');
    const slideLink = cardB.locator('button[title*="跳轉至該投影片"]').first();
    if (await slideLink.isVisible()) {
      await slideLink.click();
      await pageB.waitForTimeout(500);
      console.log('Slide jump clicked successfully');
      results.slideJumpSuccess = true;
    }

    // 10. Clean up: Delete the test question from Window A (Author)
    console.log('10. Cleaning up test question...');
    const deleteBtnA = cardA.locator('button[title*="刪除"]').first();
    if (await deleteBtnA.isVisible()) {
      await deleteBtnA.click();
      await cardA.waitFor({ state: 'detached', timeout: 10000 });
      await cardB.waitFor({ state: 'detached', timeout: 10000 });
      console.log('Question deleted cleanly in A and in B');
      results.cleanupComplete = true;
    }

    // Check errors
    const errorsA = consoleA.filter(l => l.text.includes('FirebaseError') || l.text.includes('error') || l.type === 'error');
    const errorsB = consoleB.filter(l => l.text.includes('FirebaseError') || l.text.includes('error') || l.type === 'error');

    results.errorsA = errorsA;
    results.errorsB = errorsB;
    results.allPassed = (
      results.qVisibleInA &&
      results.qBroadcastToBWithoutReload &&
      results.upvoteInB &&
      results.upvoteSyncedToAWithoutReload &&
      results.cancelUpvoteInB &&
      results.cancelUpvoteSyncedToA &&
      errorsA.length === 0 &&
      errorsB.length === 0
    );

    fs.writeFileSync(path.join(evidenceDir, 'r2-console-a.json'), JSON.stringify(consoleA, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'r2-console-b.json'), JSON.stringify(consoleB, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'r2-execution-summary.json'), JSON.stringify(results, null, 2));

    console.log('=== R2 Verification Run Summary ===');
    console.log(JSON.stringify(results, null, 2));

    return results;

  } finally {
    await browser.close();
  }
}

runR2QuestionsVerification().then(res => {
  console.log('=== All R2 Tests Finished ===');
  process.exit(res.allPassed ? 0 : 1);
}).catch(err => {
  console.error('R2 test execution failed:', err);
  process.exit(1);
});
