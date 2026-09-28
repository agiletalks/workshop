const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

async function runVoiceRetest() {
  console.log('=== Starting E2E Voice Retest ===');
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true
  });
  const context = await browser.newContext({
    permissions: ['microphone'],
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => consoleLogs.push({ type: 'pageerror', text: err.message }));

  const evidenceDir = path.resolve(__dirname, '../evidence');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  try {
    // 1. Open SPLIT with test class
    console.log('1. Navigating to SPLIT...');
    await page.goto('http://localhost:5000/workshop/split/?c=qa-split-test-01', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check if check-in modal is shown
    const nameInput = page.locator('input[placeholder*="Alex"]');
    if (await nameInput.isVisible()) {
      console.log('Filling gatekeeper form...');
      await nameInput.fill('QA-Voice-Tester');
      const passInput = page.locator('input[type="password"]');
      if (await passInput.isVisible()) {
        await passInput.fill('split-2026');
      }
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1500);
    }

    // 2. Verify Workbook and Voice button
    console.log('2. Verifying Workbook Voice Note button...');
    const voiceBtn = page.locator('button:has-text("語音筆記")').first();
    await voiceBtn.waitFor({ state: 'visible', timeout: 5000 });
    const isVoiceBtnVisible = await voiceBtn.isVisible();
    console.log('Voice button visible:', isVoiceBtnVisible);

    const voiceBtnDisabled = await voiceBtn.isDisabled();
    console.log('Voice button disabled initially:', voiceBtnDisabled);

    await page.screenshot({ path: path.join(evidenceDir, 'retest-voice-normal.png') });

    // 3. Switch to Team 2 (Observation Mode)
    console.log('3. Testing Observation Mode (Team 2)...');
    const teamSelect = page.locator('select').first();
    if (await teamSelect.isVisible()) {
      await teamSelect.selectOption({ label: '第 2 組' }).catch(async () => {
        await teamSelect.selectOption('2');
      });
      await page.waitForTimeout(1000);
    }

    // In observation mode, voice button must be disabled
    const voiceBtnInObs = page.locator('button:has-text("語音筆記")').first();
    const isObsDisabled = await voiceBtnInObs.isDisabled();
    console.log('Voice button disabled in observation mode:', isObsDisabled);
    await page.screenshot({ path: path.join(evidenceDir, 'retest-observation-disabled.png') });

    // 4. Switch back to Team 1
    console.log('4. Switching back to Team 1...');
    if (await teamSelect.isVisible()) {
      await teamSelect.selectOption({ label: '第 1 組' }).catch(async () => {
        await teamSelect.selectOption('1');
      });
      await page.waitForTimeout(1000);
    }
    const backToNormalDisabled = await voiceBtn.isDisabled();
    console.log('Voice button disabled after switching back:', backToNormalDisabled);

    // 5. Test Slide Navigation
    console.log('5. Navigating slides (Slide 1 -> Slide 2)...');
    const nextBtn = page.locator('button:has-text("下一頁"), button[title*="下一頁"], button:has-text("→")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(800);
    }
    await page.screenshot({ path: path.join(evidenceDir, 'retest-slide-switch.png') });

    // Save console logs
    fs.writeFileSync(path.join(evidenceDir, 'retest-console.json'), JSON.stringify(consoleLogs, null, 2));

    console.log('=== E2E Voice Retest Completed Successfully ===');
    console.log(JSON.stringify({
      voiceBtnVisible: isVoiceBtnVisible,
      initialDisabled: voiceBtnDisabled,
      obsDisabled: isObsDisabled,
      backToNormalDisabled,
      consoleErrors: consoleLogs.filter(l => l.type === 'error' || l.type === 'pageerror').length
    }, null, 2));

  } finally {
    await browser.close();
  }
}

runVoiceRetest().catch(err => {
  console.error('Retest error:', err);
  process.exit(1);
});
