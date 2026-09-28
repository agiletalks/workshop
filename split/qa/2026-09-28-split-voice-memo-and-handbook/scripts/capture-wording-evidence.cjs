const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5000/workshop/split/?c=qa-split-test-01&role=instructor&adm=agile-2026', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const btn = page.locator('button:has-text("+演練")').first();
  if (await btn.isVisible()) {
    await btn.click();
    await page.waitForTimeout(1000);

    // Scroll to the bottom of the modal
    const modalScrollable = page.locator('form').first();
    await modalScrollable.evaluate(el => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(500);

    const evidencePath = path.resolve('C:/Antigravity/workshop/split/qa/2026-09-28-split-voice-memo-and-handbook/evidence/tc05-forbidden-ai-wording-editor.png');
    await page.screenshot({ path: evidencePath });
    const hasAi = await page.locator('text=課堂 AI 提示詞').isVisible();
    console.log('TaskEditorModal has "課堂 AI 提示詞" visible:', hasAi);
  }

  await browser.close();
})();
