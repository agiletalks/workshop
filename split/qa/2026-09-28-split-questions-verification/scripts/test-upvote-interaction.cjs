const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

async function testUpvoteInteraction() {
  console.log('=== Testing Upvote Interaction Directly ===');
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true
  });

  const contextA = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageA = await contextA.newPage();
  pageA.on('dialog', async d => await d.accept());
  pageA.on('console', msg => {
    if (msg.type() === 'error') console.log('[Page A Error]:', msg.text());
  });

  const contextB = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageB = await contextB.newPage();
  pageB.on('dialog', async d => await d.accept());
  pageB.on('console', msg => {
    if (msg.type() === 'error') console.log('[Page B Error]:', msg.text());
  });

  try {
    // Login A
    await pageA.goto('http://localhost:5000/workshop/split/?c=qa-split-test-01', { waitUntil: 'networkidle' });
    await pageA.fill('input[placeholder*="Alex"]', '小明');
    await pageA.locator('select').first().selectOption('1');
    await pageA.fill('input[type="password"]', 'split-2026');
    await pageA.click('button[type="submit"]');
    await pageA.waitForTimeout(1000);

    // Login B
    await pageB.goto('http://localhost:5000/workshop/split/?c=qa-split-test-01', { waitUntil: 'networkidle' });
    await pageB.fill('input[placeholder*="Alex"]', '小華');
    await pageB.locator('select').first().selectOption('2');
    await pageB.fill('input[type="password"]', 'split-2026');
    await pageB.click('button[type="submit"]');
    await pageB.waitForTimeout(1000);

    // Open drawers
    await pageA.click('button:has-text("課堂提問")');
    await pageB.click('button:has-text("課堂提問")');
    await pageA.waitForTimeout(800);
    await pageB.waitForTimeout(800);

    // Submit question from A
    const qText = `UpvoteTest-${Date.now()}`;
    await pageA.fill('textarea[placeholder*="有任何疑問嗎"]', qText);
    await pageA.click('button:has-text("送出提問")');
    console.log('Submitted question:', qText);

    // Wait for it in B
    const cardB = pageB.locator('.group').filter({ hasText: qText });
    await cardB.waitFor({ state: 'attached', timeout: 10000 });
    console.log('Card B found attached');

    // Find upvote button in B by title
    const upvoteBtnB = cardB.locator('button[title*="附議"]').first();
    const countSpanB = upvoteBtnB.locator('span').nth(1);
    console.log('Initial count in B:', await countSpanB.innerText());

    // Click upvote in B
    await upvoteBtnB.click();
    console.log('Clicked upvote in B, waiting for count 1...');

    let countB = '';
    for (let i = 0; i < 20; i++) {
      await pageB.waitForTimeout(500);
      countB = (await countSpanB.innerText()).trim();
      if (countB === '1') break;
    }
    console.log('Count in B after click:', countB);

    // Check count in A
    const cardA = pageA.locator('.group').filter({ hasText: qText });
    const upvoteBtnA = cardA.locator('button[title*="附議"]').first();
    const countSpanA = upvoteBtnA.locator('span').nth(1);
    let countA = '';
    for (let i = 0; i < 20; i++) {
      await pageA.waitForTimeout(500);
      countA = (await countSpanA.innerText()).trim();
      if (countA === '1') break;
    }
    console.log('Count in A synced in real-time:', countA);

    // Clean up: delete in A
    await cardA.locator('button[title*="刪除"]').first().click();
    await pageA.waitForTimeout(1000);
    console.log('Cleaned up question');

    return countB === '1' && countA === '1';

  } finally {
    await browser.close();
  }
}

testUpvoteInteraction().then(ok => {
  console.log('Test result:', ok ? 'PASS' : 'FAIL');
  process.exit(ok ? 0 : 1);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
