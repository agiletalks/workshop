const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');

(async () => {
  console.log('🚀 Starting SPLIT RWD & Student Wording Verification Test...');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  const CLASS_ID = 'qa-split-test-01';

  try {
    // -------------------------------------------------------------
    // Test 1: Mobile Viewport (390 x 844) - Student Experience
    // -------------------------------------------------------------
    console.log('\n📱 Test 1: Mobile Viewport (390x844) - Student Experience');
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
    });
    const mobilePage = await mobileContext.newPage();

    // Go to course page with valid class
    await mobilePage.goto(`http://localhost:5000/workshop/split/?c=${CLASS_ID}&team=team-1`);
    await mobilePage.waitForLoadState('networkidle');

    // Fill PasswordGate if prompted
    const passInput = mobilePage.locator('input[placeholder*="split-2026"]');
    if (await passInput.isVisible()) {
      const nameInput = mobilePage.locator('input[placeholder*="Alex"]');
      if (await nameInput.isVisible()) {
        await nameInput.fill('測試同學');
      }
      await passInput.fill('split-2026');
      await mobilePage.click('button[type="submit"]');
      await mobilePage.waitForSelector('header', { timeout: 10000 });
      await mobilePage.waitForTimeout(1000);
    }

    console.log('✓ Successfully entered course on mobile viewport.');

    console.log('Current URL:', mobilePage.url());
    const bodySnippet = (await mobilePage.textContent('body')).slice(0, 200).replace(/\n/g, ' ');
    console.log('Body snippet:', bodySnippet);

    // 1. Verify bottom navigation bar exists on mobile
    const bottomNav = mobilePage.locator('nav.md\\:hidden');
    const isNavVisible = await bottomNav.isVisible();
    console.log(`✓ Mobile bottom navigation bar visible: ${isNavVisible}`);
    if (!isNavVisible) {
      console.log('Full body:', (await mobilePage.textContent('body')).slice(0, 400));
      throw new Error('Mobile bottom nav bar is NOT visible on 390px viewport!');
    }

    const slideTabBtn = mobilePage.locator('nav.md\\:hidden button:has-text("課程簡報")');
    const notesTabBtn = mobilePage.locator('nav.md\\:hidden button:has-text("隨堂重點與筆記")');
    
    // 2. Switch to Notes on Mobile
    console.log('Switching to Notes tab via mobile bottom bar...');
    await notesTabBtn.click();
    await mobilePage.waitForTimeout(600);

    // 3. Verify student wording in notes area (NO "尚未錄製" or "等待錄製")
    const notesContent = await mobilePage.textContent('body');
    const hasForbiddenWords = /尚未錄製|等待錄製/.test(notesContent);
    console.log(`✓ Forbidden wording ("尚未錄製" / "等待錄製") in student view: ${hasForbiddenWords ? '❌ FOUND' : '✅ NONE'}`);
    if (hasForbiddenWords) {
      throw new Error('Student view still contains 尚未錄製 or 等待錄製!');
    }

    console.log('Navigating to unrecorded slide via Next button in Slide view...');
    await slideTabBtn.click();
    await mobilePage.waitForTimeout(400);

    // Click Next button 3 times to move past recorded slide 1
    for (let i = 0; i < 3; i++) {
      await mobilePage.click('button:has-text("下一頁")');
      await mobilePage.waitForTimeout(300);
    }

    console.log('Switching to Notes tab to verify unrecorded slide student wording...');
    await notesTabBtn.click();
    await mobilePage.waitForTimeout(600);

    console.log('Clicking 📌 重點便利貼 tab on WorkbookPanel...');
    await mobilePage.click('button:has-text("📌 重點便利貼")');
    await mobilePage.waitForTimeout(500);

    const hasNewEmptyStateTitle = await mobilePage.locator('text=本頁隨堂重點整理中').isVisible();
    console.log(`✓ Student-friendly empty state title ("✨ 本頁隨堂重點整理中") visible: ${hasNewEmptyStateTitle}`);
    if (!hasNewEmptyStateTitle) {
      console.log('Slide 15 notes HTML:', await mobilePage.locator('div.bg-white').first().innerHTML().catch(e => e.message));
      throw new Error('Student friendly empty state title NOT found!');
    }

    const hasNewEmptyStateDesc = await mobilePage.locator('text=課堂進行講授後，隨堂重點與精華內容將在此為大家即時呈現。').isVisible();
    console.log(`✓ Student-friendly empty state description visible: ${hasNewEmptyStateDesc}`);
    if (!hasNewEmptyStateDesc) {
      throw new Error('Student friendly empty state description NOT found!');
    }

    // 4. Test TopBar more menu / Action sheet
    console.log('Testing TopBar Action Sheet drawer on mobile...');
    const moreBtn = mobilePage.locator('header button[title="開啟功能選單"]');
    await moreBtn.click();
    await mobilePage.waitForTimeout(400);

    const isWhiteboardActionVisible = await mobilePage.locator('div.fixed.inset-0 button:has-text("小組白板")').isVisible();
    const isPrintActionVisible = await mobilePage.locator('div.fixed.inset-0 button:has-text("列印筆記")').isVisible();
    console.log(`✓ Action sheet whiteboard button visible: ${isWhiteboardActionVisible}`);
    console.log(`✓ Action sheet print notes button visible: ${isPrintActionVisible}`);
    if (!isWhiteboardActionVisible || !isPrintActionVisible) {
      throw new Error('Action sheet buttons not visible!');
    }

    // Close action sheet
    await mobilePage.click('div.fixed.inset-0 button:has-text("✕")');
    await mobilePage.waitForTimeout(300);

    // 5. Switch back to Slide Tab
    console.log('Switching back to Slide tab via mobile bottom bar...');
    await slideTabBtn.click();
    await mobilePage.waitForTimeout(600);

    // -------------------------------------------------------------
    // Test 2: Desktop Viewport (1280 x 800) - Layout Integrity
    // -------------------------------------------------------------
    console.log('\n💻 Test 2: Desktop Viewport (1280x800) - Layout Integrity');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`http://localhost:5000/workshop/split/?c=${CLASS_ID}&team=team-1`);
    await desktopPage.waitForLoadState('networkidle');

    const passInputDesktop = desktopPage.locator('input[placeholder*="split-2026"]');
    if (await passInputDesktop.isVisible()) {
      const nameInputDesktop = desktopPage.locator('input[placeholder*="Alex"]');
      if (await nameInputDesktop.isVisible()) {
        await nameInputDesktop.fill('桌機同學');
      }
      await passInputDesktop.fill('split-2026');
      await desktopPage.click('button[type="submit"]');
      await desktopPage.waitForSelector('header', { timeout: 10000 });
      await desktopPage.waitForTimeout(1000);
    }

    // Check bottom nav is hidden on desktop
    const desktopBottomNav = desktopPage.locator('nav.md\\:hidden');
    const isDesktopBottomNavVisible = await desktopBottomNav.isVisible();
    console.log(`✓ Mobile bottom nav bar hidden on desktop: ${!isDesktopBottomNavVisible}`);
    if (isDesktopBottomNavVisible) {
      throw new Error('Mobile bottom nav should be hidden on desktop view!');
    }

    // Check side-by-side layout: both slide and workbook visible simultaneously
    const slideMeta = desktopPage.locator('text=頁碼 1 /');
    const workbookTab = desktopPage.locator('button:has-text("重點便利貼")');
    const isSlideVisible = await slideMeta.isVisible();
    const isWorkbookVisible = await workbookTab.isVisible();
    console.log(`✓ Desktop side-by-side slide visible: ${isSlideVisible}, workbook visible: ${isWorkbookVisible}`);
    if (!isSlideVisible || !isWorkbookVisible) {
      throw new Error('Desktop side-by-side layout broken!');
    }

    console.log('\n🎉 ALL RWD & STUDENT WORDING TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
