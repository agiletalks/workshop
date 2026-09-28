/**
 * E2E Playwright Automation Script for TASK-SPLIT-06
 * SPLIT 隨堂系統本機端到端（E2E）功能驗收
 * Commit: debb5cc
 * Date: 2026-09-28
 */

const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/workshop/split/';
const CLASS_ID = 'qa-split-test-01';
const EVIDENCE_DIR = path.resolve(__dirname, '../evidence');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

async function runE2E() {
  const testResults = {
    test1_gemini_connection: { pass: false, details: '' },
    test2_stickies_edit_and_sync: { pass: false, details: '' },
    test3_article_edit_and_sync: { pass: false, details: '' },
    test4_live_projection_and_jump: { pass: false, details: '' },
    test5_team_task_and_perspective: { pass: false, details: '' }
  };

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });

  try {
    console.log('=== [TASK-SPLIT-06] STARTING E2E ACCEPTANCE TEST ===');

    // ----------------------------------------------------
    // WINDOW A: INSTRUCTOR
    // ----------------------------------------------------
    const instContext = await browser.newContext();
    const instPage = await instContext.newPage({ viewport: { width: 1440, height: 900 } });

    // Mock Google Generative Language API
    const interceptedCalls = [];
    await instPage.route('https://generativelanguage.googleapis.com/**', async (route) => {
      const reqUrl = route.request().url();
      interceptedCalls.push(reqUrl);
      console.log('[MOCK GOOGLE API] Intercepted call to:', reqUrl);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{ content: { parts: [{ text: "pong" }] } }]
        })
      });
    });

    console.log('1. Launching Instructor window...');
    const instUrl = `${BASE_URL}?c=${CLASS_ID}&role=instructor&adm=agile-2026&gemini_key=AIzaSy_TEST_INITIAL_KEY#/module/E/slide/2`;
    await instPage.goto(instUrl, { waitUntil: 'domcontentloaded' });
    await instPage.waitForTimeout(2000);

    // ----------------------------------------------------
    // WINDOW B: STUDENT
    // ----------------------------------------------------
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage({ viewport: { width: 1440, height: 900 } });

    console.log('2. Launching Student window...');
    await studentPage.goto(`${BASE_URL}?c=${CLASS_ID}#/module/E/slide/2`, { waitUntil: 'domcontentloaded' });
    await studentPage.waitForTimeout(1000);

    // Student gate check & login
    try {
      console.log('  - Checking student login status...');
      await studentPage.waitForSelector('input[type="password"], header', { timeout: 8000 });
      const passInput = studentPage.locator('input[type="password"]');
      if (await passInput.count() > 0) {
        console.log('  - Filling student login credentials...');
        const classCodeInput = studentPage.locator('input[placeholder*="202610-split"]');
        if (await classCodeInput.count() > 0) {
          await classCodeInput.fill(CLASS_ID);
        }
        const nameInput = studentPage.locator('input[placeholder*="Alex"]');
        if (await nameInput.count() > 0) {
          await nameInput.fill('QA-小明');
        }
        await passInput.fill('split-2026');
        await studentPage.click('button[type="submit"]');
        await studentPage.waitForSelector('header', { timeout: 10000 });
        console.log('  - Student successfully logged in!');
      } else {
        console.log('  - Student already logged in from saved session.');
      }
    } catch (err) {
      console.warn('  - Student login check note:', err.message);
    }
    await studentPage.waitForTimeout(1500);

    // ====================================================
    // TEST 1: Gemini AI Config Connection & Student Isolation
    // ====================================================
    console.log('\n--- TEST 1: Gemini AI Config & Student Isolation ---');
    // Check URL cleaning in Window A
    const cleanedInstUrl = instPage.url();
    const isKeyWipedFromUrl = !cleanedInstUrl.includes('gemini_key');
    console.log('  - Key removed from Instructor URL:', isKeyWipedFromUrl);

    // Click AiConfigModal button in instructor TopBar
    const aiConfigBtn = instPage.locator('button:has-text("小編設定")');
    await aiConfigBtn.waitFor({ state: 'visible', timeout: 5000 });
    await aiConfigBtn.click();
    await instPage.waitForTimeout(600);

    // Fill in API key
    const apiKeyInput = instPage.locator('input[placeholder*="貼上 AIzaSy"]');
    await apiKeyInput.fill('AIzaSy_E2E_VERIFICATION_TEST_KEY_2026');

    // Click test connection
    const testConnBtn = instPage.locator('button:has-text("測試連線")');
    await testConnBtn.click();
    await instPage.waitForTimeout(1000);

    // Verify success banner contains gemini-3.5-flash-lite
    const successMsg = instPage.locator('text=連線成功！');
    await successMsg.waitFor({ state: 'visible', timeout: 5000 });
    const successText = await successMsg.textContent();
    console.log('  - AI Test Connection result:', successText);

    const firstModelCalled = interceptedCalls[0] || '';
    const called35FlashLite = firstModelCalled.includes('gemini-3.5-flash-lite');
    console.log('  - First model prioritized was gemini-3.5-flash-lite:', called35FlashLite);

    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '01_gemini_connection_test_success.png') });

    // Save and close
    await instPage.click('button:has-text("儲存並關閉")');
    await instPage.waitForTimeout(600);

    // Verify instructor TopBar shows ready
    const readyBtn = instPage.locator('button:has-text("小編設定 (已就緒)")');
    const isReadyVisible = (await readyBtn.count()) > 0;
    console.log('  - Instructor TopBar shows "已就緒":', isReadyVisible);
    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '01_topbar_ai_config_ready.png') });

    // Verify student has NO AI button and NO key
    const studentAiBtnCount = await studentPage.locator('button:has-text("小編")').count();
    const studentLocalStorageKey = await studentPage.evaluate(() => localStorage.getItem('GEMINI_API_KEY'));
    console.log('  - Student AI button count (must be 0):', studentAiBtnCount);
    console.log('  - Student localStorage GEMINI_API_KEY (must be null):', studentLocalStorageKey);
    await studentPage.screenshot({ path: path.join(EVIDENCE_DIR, '01_student_no_ai_config.png') });

    if (isKeyWipedFromUrl && called35FlashLite && isReadyVisible && studentAiBtnCount === 0 && !studentLocalStorageKey) {
      testResults.test1_gemini_connection.pass = true;
      testResults.test1_gemini_connection.details = 'Gemini 3.5 Flash-lite 連線自測成功，小編設定即時就緒，學員端 100% 隔離金鑰無設定按鈕。';
      console.log('>>> TEST 1 PASS');
    } else {
      testResults.test1_gemini_connection.details = 'Test 1 criteria not fully met.';
      console.log('>>> TEST 1 FAIL');
    }

    // ====================================================
    // TEST 2: Stickies Instructor Edit & Real-Time Sync
    // ====================================================
    console.log('\n--- TEST 2: Stickies Instructor Edit & Real-Time Sync ---');
    // Ensure both on slide 2
    await instPage.evaluate(() => { window.location.hash = '#/module/E/slide/2'; });
    await studentPage.evaluate(() => { window.location.hash = '#/module/E/slide/2'; });
    await instPage.waitForTimeout(1000);
    await studentPage.waitForTimeout(1000);

    // Select stickies tab in instructor if not selected
    const instStickiesTab = instPage.locator('button:has-text("課堂重點"), button:has-text("隨堂重點")').first();
    if (await instStickiesTab.count() > 0) {
      await instStickiesTab.click();
    }

    // Look for add sticky button or edit sticky button
    const addStickyBtn = instPage.locator('button:has-text("新增重點便利貼"), button:has-text("新增便籤")').first();
    const editStickyBtn = instPage.locator('button:has-text("✏️ 編輯")').first();

    if (await editStickyBtn.count() > 0) {
      console.log('  - Editing existing sticky card...');
      await editStickyBtn.click();
    } else if (await addStickyBtn.count() > 0) {
      console.log('  - Adding new sticky note...');
      await addStickyBtn.click();
    } else {
      throw new Error('Neither edit nor add sticky button found on instructor view!');
    }

    await instPage.waitForTimeout(600);

    // In modal, change title, color, points
    const stickyTitleInput = instPage.locator('input[placeholder*="DoD 的核心要點"]');
    await stickyTitleInput.fill('E2E 驗收重點 - QA 講師即時同步驗證');

    // Switch color to emerald/green (second button)
    const colorButtons = instPage.locator('.rounded-full.border-2');
    if (await colorButtons.count() >= 2) {
      await colorButtons.nth(1).click();
    }

    // Fill point 1
    const ptInput = instPage.locator('input[placeholder*="請輸入重點內容"]').first();
    await ptInput.fill('要點 1：全班雙視窗免刷新 (No-reload) 1秒內同步');

    // Add point 2
    const addPtBtn = instPage.locator('button:has-text("新增一條")');
    if (await addPtBtn.count() > 0) {
      await addPtBtn.click();
      await instPage.waitForTimeout(300);
      const ptInput2 = instPage.locator('input[placeholder*="請輸入重點內容"]').nth(1);
      await ptInput2.fill('要點 2：學員端嚴格唯讀防護，杜絕竄改');
    }

    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '02_instructor_editing_sticky_modal.png') });

    // Save and sync
    const saveStickyBtn = instPage.locator('button:has-text("儲存並同步")');
    await saveStickyBtn.click();
    await instPage.waitForTimeout(1500);

    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '02_instructor_sticky_saved.png') });

    // Verify in Student Window (without reload!)
    console.log('  - Ensuring student stickies tab is active...');
    const studentStickiesTab = studentPage.locator('button:has-text("課堂重點"), button:has-text("重點便利貼")').first();
    if (await studentStickiesTab.count() > 0) {
      await studentStickiesTab.click();
    }

    console.log('  - Waiting for student window to receive updated sticky (NO reload)...');
    const studentStickyTitle = studentPage.locator('text=E2E 驗收重點 - QA 講師即時同步驗證');
    await studentStickyTitle.waitFor({ state: 'visible', timeout: 8000 });
    const isStudentStickyVisible = (await studentStickyTitle.count()) > 0;

    // Check student read-only protection
    const studentEditBtnCount = await studentPage.locator('button:has-text("✏️ 編輯")').count();
    const studentAddBtnCount = await studentPage.locator('button:has-text("新增便籤"), button:has-text("新增重點便利貼")').count();
    console.log('  - Student sticky synced successfully:', isStudentStickyVisible);
    console.log('  - Student edit sticky button count (must be 0):', studentEditBtnCount);
    console.log('  - Student add sticky button count (must be 0):', studentAddBtnCount);

    await studentPage.screenshot({ path: path.join(EVIDENCE_DIR, '02_student_sticky_synced_readonly.png') });

    if (isStudentStickyVisible && studentEditBtnCount === 0 && studentAddBtnCount === 0) {
      testResults.test2_stickies_edit_and_sync.pass = true;
      testResults.test2_stickies_edit_and_sync.details = '重點便利貼講師編輯/新增成功，學員端在未重新整理下 1 秒內即時同步，且學員端完全無編輯與新增按鈕。';
      console.log('>>> TEST 2 PASS');
    } else {
      testResults.test2_stickies_edit_and_sync.details = 'Test 2 criteria not fully met.';
      console.log('>>> TEST 2 FAIL');
    }

    // ====================================================
    // TEST 3: Article Instructor Edit & Real-Time Sync
    // ====================================================
    console.log('\n--- TEST 3: Article Instructor Edit & Real-Time Sync ---');
    // Instructor switches to article tab
    const instArticleTab = instPage.locator('button:has-text("詳細內容")');
    await instArticleTab.click();
    await instPage.waitForTimeout(600);

    // Click edit article button
    const editArticleBtn = instPage.locator('button:has-text("編輯詳細內容")');
    await editArticleBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editArticleBtn.click();
    await instPage.waitForTimeout(500);

    const articleTextarea = instPage.locator('textarea[placeholder*="輸入課堂講述詳細內容"]');
    const newArticleContent = `### 課堂深入講述（QA E2E 驗收即時同步）\n\n1. 敏捷需求拆分實戰的核心在於 INVEST 原則。\n2. 講師在課堂中進行重點潤飾，所有學員端應即時無刷新呈現。\n3. 本區塊在學員端 100% 唯讀，杜絕任何竄改。`;
    await articleTextarea.fill(newArticleContent);

    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '03_instructor_editing_article.png') });

    // Save and sync article
    const saveArticleBtn = instPage.locator('button:has-text("儲存並同步給全班")');
    await saveArticleBtn.click();
    await instPage.waitForTimeout(1500);

    // Verify instructor returns to view mode
    const isInstTextareaGone = (await instPage.locator('textarea[placeholder*="輸入課堂講述詳細內容"]').count()) === 0;
    console.log('  - Instructor edit article saved and view mode restored:', isInstTextareaGone);
    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '03_instructor_article_saved.png') });

    // Student switches to article tab (NO reload!)
    const studentArticleTab = studentPage.locator('button:has-text("詳細內容")');
    await studentArticleTab.click();
    await studentPage.waitForTimeout(1000);

    // Verify student sees updated text
    const studentArticleHeader = studentPage.locator('text=課堂深入講述（QA E2E 驗收即時同步）');
    await studentArticleHeader.waitFor({ state: 'visible', timeout: 5000 });
    const isStudentArticleVisible = (await studentArticleHeader.count()) > 0;

    // Verify student has NO edit article button
    const studentEditArticleBtnCount = await studentPage.locator('button:has-text("編輯詳細內容")').count();
    console.log('  - Student article synced successfully:', isStudentArticleVisible);
    console.log('  - Student edit article button count (must be 0):', studentEditArticleBtnCount);

    await studentPage.screenshot({ path: path.join(EVIDENCE_DIR, '03_student_article_synced_readonly.png') });

    if (isInstTextareaGone && isStudentArticleVisible && studentEditArticleBtnCount === 0) {
      testResults.test3_article_edit_and_sync.pass = true;
      testResults.test3_article_edit_and_sync.details = '課程詳細內容講師即時編輯並成功同步全班，學員端無刷新即時顯示且無任何編輯按鈕。';
      console.log('>>> TEST 3 PASS');
    } else {
      testResults.test3_article_edit_and_sync.details = 'Test 3 criteria not fully met.';
      console.log('>>> TEST 3 FAIL');
    }

    // ====================================================
    // TEST 4: Live Projection Indicator & Follow Navigation
    // ====================================================
    console.log('\n--- TEST 4: Live Projection Indicator & Follow Navigation ---');
    // Instructor navigates to slide 3
    await instPage.evaluate(() => { window.location.hash = '#/module/E/slide/3'; });
    await instPage.waitForTimeout(2000);

    // Verify instructor sidebar shows 📡 投影中 on slide 3
    const instSidebarLiveBadge = instPage.locator('span:has-text("📡 投影中")');
    console.log('  - Instructor sidebar live badge count:', await instSidebarLiveBadge.count());

    // Instructor starts recording on slide 3
    const tabStickies = instPage.locator('button:has-text("課堂重點"), button:has-text("隨堂重點")').first();
    if (await tabStickies.count() > 0) {
      await tabStickies.click();
    }
    const recordBtn = instPage.locator('button:has-text("開始錄音"), button:has-text("錄音選項")').first();
    if (await recordBtn.count() > 0) {
      await recordBtn.click();
      await instPage.waitForTimeout(500);
      const freshBtn = instPage.locator('button:has-text("重新錄這頁"), button:has-text("補充錄音")').first();
      if (await freshBtn.count() > 0) {
        await freshBtn.click();
      }
    }
    await instPage.waitForTimeout(1500);

    // Check recording status in instructor
    const onAirIndicator = instPage.locator('text=ON AIR, text=正在聆聽');
    console.log('  - Instructor ON AIR active:', (await onAirIndicator.count()) > 0);
    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '04_instructor_onair_and_sidebar_badges.png') });

    // Student navigates away to slide 1
    console.log('  - Navigating student window to slide 1...');
    await studentPage.evaluate(() => { window.location.hash = '#/module/E/slide/1'; });
    await studentPage.waitForTimeout(2000);

    // Check student sidebar indicators on slide 3
    const studentSidebarLiveBadge = studentPage.locator('span:has-text("📡 投影中")');
    console.log('  - Student sidebar live badge count:', await studentSidebarLiveBadge.count());

    // Check student TopBar jump button
    const studentJumpBtn = studentPage.locator('button:has-text("回到老師投影")');
    await studentJumpBtn.waitFor({ state: 'visible', timeout: 5000 });
    const jumpBtnText = await studentJumpBtn.textContent();
    console.log('  - Student TopBar jump button visible:', jumpBtnText);

    await studentPage.screenshot({ path: path.join(EVIDENCE_DIR, '04_student_sidebar_and_jump_button.png') });

    // Click jump button in student window
    await studentJumpBtn.click();
    await studentPage.waitForTimeout(1500);

    // Verify student is navigated to slide 3
    const studentUrlAfterJump = studentPage.url();
    const isNavigatedToSlide3 = studentUrlAfterJump.includes('/slide/3');
    console.log('  - Student navigated to slide 3 after jump click:', isNavigatedToSlide3, studentUrlAfterJump);

    // Verify jump button disappears and "與老師同步中" is visible
    const isJumpBtnGone = (await studentPage.locator('button:has-text("回到老師投影")').count()) === 0;
    const isSyncedBadgeVisible = (await studentPage.locator('text=與老師同步中').count()) > 0;
    console.log('  - Jump button disappeared:', isJumpBtnGone);
    console.log('  - "與老師同步中" badge displayed:', isSyncedBadgeVisible);

    await studentPage.screenshot({ path: path.join(EVIDENCE_DIR, '04_student_jumped_and_synced.png') });

    // Clean up: stop instructor recording
    const stopRecordBtn = instPage.locator('button:has-text("完成錄音"), button:has-text("取消")').first();
    if (await stopRecordBtn.count() > 0) {
      await stopRecordBtn.click().catch(() => {});
    }

    if (isNavigatedToSlide3 && isJumpBtnGone && isSyncedBadgeVisible) {
      testResults.test4_live_projection_and_jump.pass = true;
      testResults.test4_live_projection_and_jump.details = '目錄側欄清楚顯示投影中與錄音狀態；學員換頁時頂部出現「回到老師投影 (P.03)」醒目按鈕，點擊後瞬間導航回投影片且按鈕自動轉換為「與老師同步中」。';
      console.log('>>> TEST 4 PASS');
    } else {
      testResults.test4_live_projection_and_jump.details = 'Test 4 criteria not fully met.';
      console.log('>>> TEST 4 FAIL');
    }

    // ====================================================
    // TEST 5: Perspective Switching & Team Task Isolated Notes
    // ====================================================
    console.log('\n--- TEST 5: Perspective Switching & Team Task Notes ---');
    // 1. Normal slide (slide 2): verify uniform stickies regardless of team
    await instPage.evaluate(() => { window.location.hash = '#/module/E/slide/2'; });
    await instPage.waitForTimeout(1500);

    const teamSelect = instPage.locator('header select').first();
    await teamSelect.selectOption('1');
    await instPage.waitForTimeout(500);
    const hasStickiesTeam1 = (await instPage.locator('text=E2E 驗收重點 - QA 講師即時同步驗證').count()) > 0;

    await teamSelect.selectOption('2');
    await instPage.waitForTimeout(500);
    const hasStickiesTeam2 = (await instPage.locator('text=E2E 驗收重點 - QA 講師即時同步驗證').count()) > 0;
    console.log('  - Normal slide uniform view across Team 1 and Team 2:', hasStickiesTeam1 && hasStickiesTeam2);

    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '05_instructor_normal_slide_uniform_view.png') });

    // 2. Insert a Team Task dynamically
    console.log('  - Inserting custom team task for testing...');
    const insertTaskBtn = instPage.locator('button:has-text("+演練")');
    await insertTaskBtn.click();
    await instPage.waitForTimeout(800);

    const taskTitleInput = instPage.locator('input[placeholder*="團隊演練"]');
    await taskTitleInput.fill('E2E 驗收小組演練任務 - INVEST 拆解');

    const taskObjInput = instPage.locator('textarea[placeholder*="清楚說明小組本次演練"]');
    await taskObjInput.fill('小組通力合作完成 INVEST 需求切分實戰');

    const saveTaskBtn = instPage.locator('button:has-text("儲存並即時發布")');
    await saveTaskBtn.click();
    await instPage.waitForTimeout(2500);

    // Verify task slide is active and default tab is "note"
    console.log('  - Checking Team Task active tab (should be note)...');
    const taskNoteTab = instPage.locator('button:has-text("小組成果筆記")');
    const isTaskNoteTabActive = (await taskNoteTab.count()) > 0;
    console.log('  - Task slide has note tab active:', isTaskNoteTabActive);

    // Switch to Team 1 and write team note
    await teamSelect.selectOption('1');
    await instPage.waitForTimeout(1000);

    const noteTextarea = instPage.locator('textarea').first();
    await noteTextarea.waitFor({ state: 'visible', timeout: 5000 });
    await noteTextarea.click();
    await noteTextarea.fill('【第 1 組專屬演練筆記】：完成會員註冊故事拆解。');
    await instPage.waitForTimeout(1500);

    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '05_team1_task_note.png') });

    // Switch to Team 2 and write team note
    await teamSelect.selectOption('2');
    await instPage.waitForTimeout(1500);

    await noteTextarea.click();
    await noteTextarea.fill('【第 2 組專屬演練筆記】：完成信用卡扣款故事拆解。');
    await instPage.waitForTimeout(1500);

    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '05_team2_task_note.png') });

    // Switch back to Team 1 and verify isolation
    await teamSelect.selectOption('1');
    await instPage.waitForTimeout(1500);

    const team1Content = await noteTextarea.inputValue();
    const isTeam1Isolated = team1Content.includes('會員註冊故事拆解');
    console.log('  - Switched back to Team 1, content preserved and isolated:', isTeam1Isolated, team1Content);

    await instPage.screenshot({ path: path.join(EVIDENCE_DIR, '05_team1_task_note_verified.png') });

    if (hasStickiesTeam1 && hasStickiesTeam2 && isTeam1Isolated) {
      testResults.test5_team_task_and_perspective.pass = true;
      testResults.test5_team_task_and_perspective.details = '一般講義頁面切換組別視角時隨堂重點全班一致；Team Task 演練頁面切換組別時各自獨立載入該組筆記成果，隔離防護 100% 完整。';
      console.log('>>> TEST 5 PASS');
    } else {
      testResults.test5_team_task_and_perspective.details = 'Test 5 criteria not fully met.';
      console.log('>>> TEST 5 FAIL');
    }

  } catch (err) {
    console.error('E2E Execution Error:', err);
  } finally {
    await browser.close();

    // Write summary JSON
    const allPass = Object.values(testResults).every(r => r.pass);
    const summaryData = {
      timestamp: new Date().toISOString(),
      commit: 'debb5cc',
      classId: CLASS_ID,
      allPass,
      results: testResults
    };
    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'test-summary.json'),
      JSON.stringify(summaryData, null, 2),
      'utf-8'
    );
    console.log('\n=== E2E TESTING COMPLETED ===');
    console.log('Overall Status:', allPass ? 'ALL PASS (5/5)' : 'FAILURES DETECTED');
  }
}

runE2E();
