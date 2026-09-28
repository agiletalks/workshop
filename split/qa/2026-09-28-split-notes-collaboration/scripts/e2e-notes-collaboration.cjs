const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

async function runNotesCollaborationE2E() {
  console.log('=== Starting Module 4 Notes Collaboration E2E Test ===');
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

  // Window B: 小華 (Team 1 - same team!)
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

    // 2. Login Window B (小華, Team 1)
    console.log('2. Logging in Window B (小華, Team 1)...');
    await pageB.goto('http://localhost:5000/workshop/split/?c=qa-split-test-01', { waitUntil: 'networkidle' });
    await pageB.waitForTimeout(1000);

    const nameInputB = pageB.locator('input[placeholder*="Alex"]');
    if (await nameInputB.isVisible()) {
      await nameInputB.fill('小華');
      const teamSelectB = pageB.locator('select').first();
      await teamSelectB.selectOption('1');
      const passB = pageB.locator('input[type="password"]');
      if (await passB.isVisible()) await passB.fill('split-2026');
      await pageB.click('button[type="submit"]');
      await pageB.waitForTimeout(1500);
    }

    // 3. Navigate both to Slide 4 (P.04: User Story)
    console.log('3. Navigating both to Slide 4 (P.04)...');
    const p4BtnA = pageA.locator('button').filter({ hasText: 'P.04' }).first();
    await p4BtnA.click();
    await pageA.waitForTimeout(500);

    const p4BtnB = pageB.locator('button').filter({ hasText: 'P.04' }).first();
    await p4BtnB.click();
    await pageB.waitForTimeout(1000);

    console.log('Page A URL:', pageA.url(), '| Page B URL:', pageB.url());

    // 4. Case 1: Lock Exclusivity & Readonly Banner
    console.log('4. Testing Case 1: Window A focuses textarea to acquire lock...');
    const textareaA = pageA.locator('textarea').first();
    await textareaA.click();
    await pageA.waitForTimeout(1500);

    // Assert Window A shows green held-by-me banner
    const heldByMeBannerA = pageA.locator('text=您正在編輯中 (組內即時同步，每 15 秒心跳續約保護)');
    await heldByMeBannerA.waitFor({ state: 'visible', timeout: 5000 });
    const isHeldenInA = await heldByMeBannerA.isVisible();
    console.log('Window A shows green held-by-me banner:', isHeldenInA);
    results.windowAHeldLock = isHeldenInA;

    // Assert Window B shows amber locked-by-other banner with 小明's name
    console.log('Asserting Window B receives amber lock banner without reload...');
    const lockedBannerB = pageB.locator('text=正在編輯此頁筆記');
    await lockedBannerB.waitFor({ state: 'visible', timeout: 10000 });
    const isLockedInB = await lockedBannerB.isVisible();
    const bannerBText = await lockedBannerB.innerText();
    console.log('Window B shows amber lock banner:', isLockedInB, '| Text:', bannerBText);
    results.windowBReceivedLockBanner = isLockedInB && bannerBText.includes('小明');

    // Assert Window B textarea is disabled
    const textareaB = pageB.locator('textarea').first();
    const isBDisabled = await textareaB.isDisabled();
    console.log('Window B textarea disabled:', isBDisabled);
    results.windowBTextareaDisabled = isBDisabled;

    await pageA.screenshot({ path: path.join(evidenceDir, 'r1-lock-exclusivity-a.png') });
    await pageB.screenshot({ path: path.join(evidenceDir, 'r1-lock-exclusivity-b.png') });

    // 5. Case 2: Typing real-time sync
    const testMemo = `DoD 是完成的定義，DoR 是準備就緒的定義。 (${Date.now()})`;
    console.log(`5. Testing Case 2: Window A types memo: "${testMemo}"...`);
    await textareaA.fill(testMemo);
    await pageA.waitForTimeout(2000); // 800ms debounce + firestore write

    console.log('Asserting Window B receives typed text in real time...');
    let textInB = '';
    for (let i = 0; i < 20; i++) {
      await pageB.waitForTimeout(500);
      textInB = await textareaB.inputValue();
      if (textInB.includes('DoD 是完成的定義')) break;
    }
    console.log('Text received in Window B (No reload):', textInB);
    results.realtimeTextSynced = textInB.includes('DoD 是完成的定義');
    await pageB.screenshot({ path: path.join(evidenceDir, 'r1-text-synced-b.png') });

    // 6. Case 3: Voluntary Release & Handoff
    console.log('6. Testing Case 3: Window A clicks "交出編輯權"...');
    const releaseBtnA = pageA.locator('button:has-text("交出編輯權")').first();
    await releaseBtnA.click();
    await pageA.waitForTimeout(1500);

    // Assert amber banner in Window B disappears
    console.log('Asserting lock banner disappears in Window B...');
    await lockedBannerB.waitFor({ state: 'detached', timeout: 5000 });
    const isBannerBDetached = (await pageB.locator('text=正在編輯此頁筆記').count()) === 0;
    console.log('Banner disappeared in Window B:', isBannerBDetached);
    results.bannerBDetachedOnRelease = isBannerBDetached;

    // Window B now clicks textarea to acquire lock
    console.log('Window B clicks textarea to acquire lock...');
    await textareaB.click();
    await pageB.waitForTimeout(1500);

    const heldByMeBannerB = pageB.locator('text=您正在編輯中 (組內即時同步，每 15 秒心跳續約保護)');
    await heldByMeBannerB.waitFor({ state: 'visible', timeout: 5000 });
    const isHeldenInB = await heldByMeBannerB.isVisible();
    console.log('Window B now holds lock:', isHeldenInB);
    results.windowBHeldLock = isHeldenInB;

    // Assert Window A now shows locked by 小華
    const lockedBannerA = pageA.locator('text=正在編輯此頁筆記');
    await lockedBannerA.waitFor({ state: 'visible', timeout: 5000 });
    const bannerAText = await lockedBannerA.innerText();
    console.log('Window A now shows lock banner:', bannerAText);
    results.windowAReceivedLockBanner = bannerAText.includes('小華');

    await pageA.screenshot({ path: path.join(evidenceDir, 'r1-handoff-a-locked.png') });
    await pageB.screenshot({ path: path.join(evidenceDir, 'r1-handoff-b-holding.png') });

    // 7. Case 5: Attachments (Upload small file in Window B)
    console.log('7. Testing Case 5: Attachment upload in Window B...');
    const fileInputB = pageB.locator('input[type="file"][accept*="image"]').first();
    
    // Create a temporary test image file
    const testFilePath = path.join(evidenceDir, 'test-qa-attachment.png');
    // Minimal 1x1 png base64
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testFilePath, pngBuffer);

    await fileInputB.setInputFiles(testFilePath);
    await pageB.waitForTimeout(2000);

    // Assert attachment appears in Window B
    const attInB = pageB.locator('text=test-qa-attachment.png');
    await attInB.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Attachment visible in Window B:', await attInB.isVisible());
    results.attachmentInB = await attInB.isVisible();

    // Assert attachment appears in Window A without reload
    console.log('Asserting attachment appears in Window A in real-time...');
    const attInA = pageA.locator('text=test-qa-attachment.png');
    await attInA.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Attachment visible in Window A (No reload):', await attInA.isVisible());
    results.attachmentSyncedToAWithoutReload = await attInA.isVisible();

    await pageA.screenshot({ path: path.join(evidenceDir, 'r1-attachment-synced-a.png') });
    await pageB.screenshot({ path: path.join(evidenceDir, 'r1-attachment-synced-b.png') });

    // Clean up attachment & lock
    console.log('8. Cleaning up attachment and releasing lock in Window B...');
    const deleteAttBtnB = pageB.locator('button[title*="刪除附件"]').first();
    if (await deleteAttBtnB.isVisible()) {
      await deleteAttBtnB.click();
      await pageB.waitForTimeout(1000);
    }
    const releaseBtnB = pageB.locator('button:has-text("交出編輯權")').first();
    if (await releaseBtnB.isVisible()) {
      await releaseBtnB.click();
      await pageB.waitForTimeout(1000);
    }

    // Check errors
    const errorsA = consoleA.filter(l => l.text.includes('FirebaseError') || l.text.includes('error') || l.type === 'error');
    const errorsB = consoleB.filter(l => l.text.includes('FirebaseError') || l.text.includes('error') || l.type === 'error');

    results.errorsA = errorsA;
    results.errorsB = errorsB;
    results.allPassed = (
      results.windowAHeldLock &&
      results.windowBReceivedLockBanner &&
      results.windowBTextareaDisabled &&
      results.realtimeTextSynced &&
      results.bannerBDetachedOnRelease &&
      results.windowBHeldLock &&
      results.windowAReceivedLockBanner &&
      results.attachmentInB &&
      results.attachmentSyncedToAWithoutReload &&
      errorsA.length === 0 &&
      errorsB.length === 0
    );

    fs.writeFileSync(path.join(evidenceDir, 'r1-console-a.json'), JSON.stringify(consoleA, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'r1-console-b.json'), JSON.stringify(consoleB, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'r1-execution-summary.json'), JSON.stringify(results, null, 2));

    console.log('=== R1 Notes Collaboration Verification Run Summary ===');
    console.log(JSON.stringify(results, null, 2));

    return results;

  } finally {
    await browser.close();
  }
}

runNotesCollaborationE2E().then(res => {
  console.log('=== All Module 4 E2E Tests Finished ===');
  process.exit(res.allPassed ? 0 : 1);
}).catch(err => {
  console.error('Module 4 E2E test execution failed:', err);
  process.exit(1);
});
