const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

async function runQuestionsVerification() {
  console.log('=== Starting E2E Module 5 Questions Verification ===');
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

    // 3. Inspect UI elements on Window A
    console.log('3. Inspecting UI elements on Window A...');
    const topBarQuestionBtn = pageA.locator('button:has-text("💬 提問")');
    const fabQuestionBtn = pageA.locator('button:has-text("課堂提問")');

    const topBarBtnVisible = await topBarQuestionBtn.isVisible();
    const fabBtnVisible = await fabQuestionBtn.isVisible();
    console.log('TopBar Question Button Visible:', topBarBtnVisible);
    console.log('FAB Question Button Visible:', fabBtnVisible);

    // Open Questions Drawer via FAB
    await fabQuestionBtn.click();
    await pageA.waitForTimeout(800);

    // Wording inspection in QuestionsDrawer
    const drawerText = await pageA.innerText('.fixed.inset-0.z-50');
    const hasForbiddenWord = drawerText.includes('便利貼');
    console.log('Forbidden word "便利貼" present in drawer:', hasForbiddenWord);

    await pageA.screenshot({ path: path.join(evidenceDir, 'questions-drawer-initial.png') });

    // 4. Try posting a question in Window A
    console.log('4. Posting a question in Window A...');
    const textarea = pageA.locator('textarea[placeholder*="有任何疑問嗎"]');
    await textarea.fill('如何辨識過度拆解的 User Story？');

    const submitBtn = pageA.locator('button:has-text("送出提問")');
    await submitBtn.click();
    await pageA.waitForTimeout(2000);

    await pageA.screenshot({ path: path.join(evidenceDir, 'questions-after-submit-a.png') });

    // Check Window B
    console.log('5. Checking Window B for broadcast...');
    const fabBtnB = pageB.locator('button:has-text("課堂提問")');
    await fabBtnB.click();
    await pageB.waitForTimeout(1000);
    await pageB.screenshot({ path: path.join(evidenceDir, 'questions-window-b.png') });

    // Check console errors
    const errorsA = consoleA.filter(l => l.text.includes('FirebaseError') || l.text.includes('error') || l.type === 'error');
    const errorsB = consoleB.filter(l => l.text.includes('FirebaseError') || l.text.includes('error') || l.type === 'error');

    console.log('Console Errors A:', errorsA);
    console.log('Console Errors B:', errorsB);

    fs.writeFileSync(path.join(evidenceDir, 'console-a.json'), JSON.stringify(consoleA, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'console-b.json'), JSON.stringify(consoleB, null, 2));

    return {
      topBarBtnVisible,
      fabBtnVisible,
      hasForbiddenWord,
      errorsA,
      errorsB
    };

  } finally {
    await browser.close();
  }
}

runQuestionsVerification().then(res => {
  console.log('=== Questions Verification Run Finished ===');
  console.log(JSON.stringify(res, null, 2));
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
