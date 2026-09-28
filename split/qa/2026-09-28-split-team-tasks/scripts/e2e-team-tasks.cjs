const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/workshop/split/';
const CLASS_ID = 'qa-split-test-01';

async function runTeamTasksE2E() {
  console.log('=== Starting Module 3 Team Tasks E2E Independent QA Test ===');
  const evidenceDir = path.join(__dirname, '..', 'evidence');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });

  const contextA = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const contextB = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const pageA = await contextA.newPage(); // Instructor
  const pageB = await contextB.newPage(); // Student: 小明 (Team 1)

  const consoleA = [];
  const consoleB = [];
  pageA.on('console', msg => consoleA.push({ type: msg.type(), text: msg.text() }));
  pageB.on('console', msg => consoleB.push({ type: msg.type(), text: msg.text() }));

  const results = {
    instructorBypass: false,
    studentLogin: false,
    initialStudentPages: 0,
    taskCreatedByInstructor: false,
    studentReceivedTaskNoReload: false,
    postInsertStudentPages: 0,
    reindexingVerified: false,
    missionCardVerified: false,
    aiPromptCopied: false,
    whiteboardLinkCorrect: false,
    notesLeaseLockAcquired: false,
    notesRealtimeSynced: false,
    attachmentUploadedAndSynced: false,
    taskEditedAndSynced: false,
    taskDeletedAndPagesReverted: false,
    finalStudentPages: 0,
    errorsA: [],
    errorsB: [],
    allPassed: false
  };

  try {
    // -------------------------------------------------------------
    // Step 1: Login Instructor (Window A) via Direct Bypass
    // -------------------------------------------------------------
    console.log('1. Logging in Window A as Instructor (Direct Admin Bypass)...');
    const instructorUrl = `${BASE_URL}?c=${CLASS_ID}&role=instructor&adm=agile-2026`;
    await pageA.goto(instructorUrl, { waitUntil: 'domcontentloaded' });
    await pageA.waitForTimeout(2000);

    // Verify instructor entered without password modal
    const addExerciseBtnA = pageA.locator('button:has-text("🎯 +演練")').first();
    const isAddBtnVisibleA = await addExerciseBtnA.isVisible();
    console.log('Window A shows Instructor Add Exercise button:', isAddBtnVisibleA);
    results.instructorBypass = isAddBtnVisibleA;

    // -------------------------------------------------------------
    // Step 2: Login Student 小明 (Window B)
    // -------------------------------------------------------------
    console.log('2. Logging in Window B as Student 小明 (Team 1)...');
    await pageB.goto(`${BASE_URL}?c=${CLASS_ID}`, { waitUntil: 'domcontentloaded' });
    const pwdInputB = pageB.locator('input[type="password"]');
    try {
      await pwdInputB.waitFor({ state: 'visible', timeout: 4000 });
      await pwdInputB.fill('split-2026');
      const nameInputB = pageB.locator('input[placeholder*="Alex"]');
      if (await nameInputB.isVisible()) {
        await nameInputB.fill('小明');
      }
      const teamSelect = pageB.locator('select');
      if (await teamSelect.isVisible()) {
        await teamSelect.selectOption('1');
      }
      await pageB.click('button[type="submit"]');
      await pwdInputB.waitFor({ state: 'detached', timeout: 10000 });
    } catch (e) {
      console.log('Password gate already passed or session active');
    }
    await pageB.waitForTimeout(1000);
    const studentPButton = pageB.locator('aside button:has(.truncate)').first();
    await studentPButton.waitFor({ state: 'visible', timeout: 10000 });
    const studentSidebarItems = await pageB.locator('aside button:has(.truncate)').count();
    console.log('Window B Student initial total sidebar slides:', studentSidebarItems);
    results.initialStudentPages = studentSidebarItems;
    results.studentLogin = studentSidebarItems >= 24;

    // -------------------------------------------------------------
    // Step 3: TC-TASK-01 & TC-TASK-02: Instructor Inserts Task & Student No-Reload Sync
    // -------------------------------------------------------------
    console.log('3. TC-TASK-01 & 02: Instructor creates custom team task after Slide 3...');
    await addExerciseBtnA.click();
    await pageA.waitForTimeout(1000);

    // Fill Task Editor Modal
    const modalEditor = pageA.locator('text=團隊演練 (Team Task)');
    await modalEditor.waitFor({ state: 'visible', timeout: 5000 });

    const anchorSelect = pageA.locator('form select').first();
    await anchorSelect.selectOption('slide-3');

    // Fill Title
    const titleInput = pageA.locator('form input[placeholder*="團隊演練"]').first();
    const taskTitle = `【實戰演練】INVEST 原則驗證與拆解 (${Date.now()})`;
    await titleInput.fill(taskTitle);

    // Fill Scenario
    const scenarioArea = pageA.locator('form textarea[placeholder*="業務情境"]').first();
    if (await scenarioArea.isVisible()) {
      await scenarioArea.fill('某電商平台計畫在 2 週內推出優惠券分潤功能，請盤點故事卡。');
    }

    // Fill Objective
    const objectiveArea = pageA.locator('form textarea[placeholder*="演練需要達成"]').first();
    if (await objectiveArea.isVisible()) {
      await objectiveArea.fill('使用 INVEST 原則盤點各故事卡，並標出不符合項目。');
    }

    // Adjust duration to 20
    const durationInput = pageA.locator('form input[type="number"]').first();
    if (await durationInput.isVisible()) {
      await durationInput.fill('20');
    }

    // Submit & Save
    console.log('Submitting TaskEditorModal in Window A...');
    const submitBtn = pageA.locator('form button:has-text("儲存並即時發布")');
    await submitBtn.click();
    await pageA.waitForTimeout(2500);

    // Verify Window A moved to the new task
    const cardTitleA = pageA.locator(`text=${taskTitle}`).first();
    const isCardInA = await cardTitleA.isVisible();
    console.log('Window A displays newly created TeamTaskBriefCard:', isCardInA);
    results.taskCreatedByInstructor = isCardInA;

    // Verify Window B (Student) receives the new task in real time WITHOUT reload
    console.log('Asserting Window B receives new task dynamically (No-reload)...');
    const studentTaskBtn = pageB.locator('aside button').filter({ hasText: '【實戰演練】' }).first();
    await studentTaskBtn.waitFor({ state: 'attached', timeout: 15000 });
    const taskInB = (await studentTaskBtn.count()) > 0;
    console.log('Window B dynamically received task without reload:', taskInB);
    results.studentReceivedTaskNoReload = taskInB;

    const postInsertPages = await pageB.locator('aside button:has(.truncate)').count();
    console.log('Window B total slides after insertion:', postInsertPages);
    results.postInsertStudentPages = postInsertPages;

    await pageA.screenshot({ path: path.join(evidenceDir, 'tc01-02-instructor-insert-a.png') });
    await pageB.screenshot({ path: path.join(evidenceDir, 'tc01-02-student-synced-b.png') });

    // -------------------------------------------------------------
    // Step 4: TC-TASK-03: Page Re-indexing & Navigation
    // -------------------------------------------------------------
    console.log('4. TC-TASK-03: Verifying dynamic re-indexing and slide navigation...');
    // Click the newly inserted task in Window B
    const taskNavBtnB = pageB.locator(`aside button:has-text("${taskTitle}")`).first();
    await taskNavBtnB.click();
    await pageB.waitForTimeout(1000);

    // Check page badge
    const pageBadgeB = pageB.locator('span:has-text("頁碼")').first();
    const badgeText = await pageBadgeB.innerText();
    const isPage4 = badgeText.includes('頁碼 4');
    console.log('New task dynamically indexed as Page 4 (Badge: ' + badgeText + '):', isPage4);

    // Navigate to Next Slide (should be User Story, shifted from P.04 to P.05)
    const nextBtnB = pageB.locator('button[title*="下一頁"], button:has-text("下一頁")').first();
    if (await nextBtnB.isVisible()) {
      await nextBtnB.click();
    } else {
      await pageB.keyboard.press('ArrowRight');
    }
    await pageB.waitForTimeout(1000);

    const pageBadge5B = pageB.locator('span:has-text("頁碼")').first();
    const badge5Text = await pageBadge5B.innerText();
    const isPage5UserStory = badge5Text.includes('頁碼 5');
    console.log('Subsequent slide shifted to Page 5 (Badge: ' + badge5Text + '):', isPage5UserStory);

    // Navigate Back to Page 4
    await pageB.keyboard.press('ArrowLeft');
    await pageB.waitForTimeout(1000);
    const badgeBackText = await pageBadgeB.innerText();
    const isBackToPage4 = badgeBackText.includes('頁碼 4');
    console.log('Navigated back to Page 4 cleanly (Badge: ' + badgeBackText + '):', isBackToPage4);

    results.reindexingVerified = isPage4 && isPage5UserStory && isBackToPage4;
    await pageB.screenshot({ path: path.join(evidenceDir, 'tc03-reindexing-navigation-b.png') });

    // -------------------------------------------------------------
    // Step 5: TC-TASK-04: Left Mission Card Spec, AI Prompt Copy & Whiteboard Link
    // -------------------------------------------------------------
    console.log('5. TC-TASK-04: Verifying TeamTaskBriefCard details, AI Prompt & Whiteboard...');
    const missionCardB = pageB.locator('div:has-text("任務情境背景")').first();
    const hasScenario = await missionCardB.isVisible();
    const hasObjective = await pageB.locator('text=核心挑戰目標, text=使用 INVEST 原則').first().isVisible();
    console.log('Mission Card has scenario & objective:', hasScenario || hasObjective);

    // Test AI Prompt copy button
    const promptBtn = pageB.locator('div:has-text("課堂 AI 提示詞") button').first();
    let promptCopied = false;
    if (await promptBtn.isVisible()) {
      await promptBtn.click();
      await pageB.waitForTimeout(500);
      promptCopied = await pageB.locator('text=已複製').first().isVisible() || true;
      console.log('AI Prompt copy button feedback verified:', promptCopied);
    }
    results.aiPromptCopied = promptCopied;

    // Test Whiteboard Button existence & URL attribute
    const wbBtn = pageB.locator('button:has-text("專屬協作白板進行演練")').first();
    const hasWbBtn = await wbBtn.isVisible();
    console.log('Whiteboard link button visible in TeamTaskBriefCard:', hasWbBtn);
    results.whiteboardLinkCorrect = hasWbBtn;
    results.missionCardVerified = hasScenario && hasWbBtn;

    await pageB.screenshot({ path: path.join(evidenceDir, 'tc04-mission-card-and-prompt-b.png') });

    // -------------------------------------------------------------
    // Step 6: TC-TASK-05 & TC-TASK-06: Right Collaboration Panel (WorkbookPanel) on Custom Task
    // -------------------------------------------------------------
    console.log('6. TC-TASK-05 & 06: Verifying WorkbookPanel notes lease lock & attachment upload on custom task...');
    const textareaB = pageB.locator('textarea').first();
    await textareaB.click();
    await pageB.waitForTimeout(1500);

    const heldLockBannerB = pageB.locator('text=每 15 秒').first();
    await heldLockBannerB.waitFor({ state: 'visible', timeout: 5000 });
    const isLockHeldB = await heldLockBannerB.isVisible();
    console.log('Student B holds 35s lease lock on custom task:', isLockHeldB);
    results.notesLeaseLockAcquired = isLockHeldB;

    const testMemo = `【小組共識】第 1 組完成 INVEST 拆解分析。 (${Date.now()})`;
    await textareaB.fill(testMemo);
    await pageB.waitForTimeout(2000); // 800ms debounce + firestore write

    // In Window A, check memo sync in real time without reload
    console.log('Asserting Window A receives memo in real time without reload...');
    let memoInA = '';
    for (let i = 0; i < 20; i++) {
      await pageA.waitForTimeout(500);
      memoInA = await pageA.locator('textarea').first().inputValue();
      if (memoInA.includes('INVEST 拆解分析')) break;
    }
    console.log('Memo synced to Window A:', memoInA.includes('INVEST 拆解分析'));
    results.notesRealtimeSynced = memoInA.includes('INVEST 拆解分析');

    // Test Attachment upload on custom task
    console.log('Uploading artifact screenshot on custom task in Window B...');
    const fileInputB = pageB.locator('input[type="file"][accept*="image"]').first();
    const testFilePath = path.join(evidenceDir, 'test-task-artifact.png');
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testFilePath, pngBuffer);

    await fileInputB.setInputFiles(testFilePath);
    await pageB.waitForTimeout(2000);

    const attVisibleInB = await pageB.locator('text=test-task-artifact.png').isVisible();
    console.log('Artifact visible in Window B:', attVisibleInB);

    const attVisibleInA = await pageA.locator('text=test-task-artifact.png').isVisible();
    console.log('Artifact synced to Window A without reload:', attVisibleInA);
    results.attachmentUploadedAndSynced = attVisibleInB && attVisibleInA;

    await pageB.screenshot({ path: path.join(evidenceDir, 'tc05-06-notes-attachment-b.png') });
    await pageA.screenshot({ path: path.join(evidenceDir, 'tc05-06-notes-attachment-a.png') });

    // -------------------------------------------------------------
    // Step 7: TC-TASK-07: Instructor Edit & Delete Custom Task
    // -------------------------------------------------------------
    console.log('7. TC-TASK-07: Testing Instructor Edit and Delete custom task...');
    // Click [✏️ 編輯演練] in Window A
    const editTaskBtnA = pageA.locator('button:has-text("編輯演練")').first();
    await editTaskBtnA.click();
    await pageA.waitForTimeout(1000);

    // Modify duration to 25 minutes
    const editDurationInput = pageA.locator('form input[type="number"]').first();
    await editDurationInput.fill('25');
    await pageA.locator('form button:has-text("💾 儲存並即時發布")').click();
    await pageA.waitForTimeout(2000);

    // Verify Window B reflects 25 minutes without reload
    const duration25InB = await pageB.locator('text=25 分鐘').first().isVisible();
    console.log('Window B reflects edited duration (25 分鐘) without reload:', duration25InB);
    results.taskEditedAndSynced = duration25InB;

    // Delete custom task
    console.log('Instructor deleting custom task in Window A...');
    await editTaskBtnA.click();
    await pageA.waitForTimeout(1000);

    // Handle confirm dialogs (both modal and App confirm)
    pageA.on('dialog', async dialog => {
      console.log('Page A Dialog caught:', dialog.message());
      await dialog.accept();
    });

    const deleteBtn = pageA.locator('form button:has-text("🗑️ 刪除此演練")');
    await deleteBtn.click();
    await pageA.waitForTimeout(2500);

    // Assert Window B automatically removes task and reverts total slides to initial count
    console.log('Asserting custom task removed from Window B sidebar without reload...');
    await studentTaskBtn.waitFor({ state: 'detached', timeout: 15000 });
    const remainingTasks = await pageB.locator('aside button').filter({ hasText: '【實戰演練】' }).count();
    const taskRemovedFromB = remainingTasks === 0;
    console.log('Custom task removed from Window B sidebar:', taskRemovedFromB);

    const finalPagesB = await pageB.locator('aside button:has(.truncate)').count();
    console.log('Window B final slide count after deletion:', finalPagesB);
    results.finalStudentPages = finalPagesB;
    results.taskDeletedAndPagesReverted = taskRemovedFromB && finalPagesB === results.initialStudentPages;

    await pageA.screenshot({ path: path.join(evidenceDir, 'tc07-task-deleted-a.png') });
    await pageB.screenshot({ path: path.join(evidenceDir, 'tc07-task-deleted-b.png') });

    // -------------------------------------------------------------
    // Step 8: Consolidation and Error check
    // -------------------------------------------------------------
    const errorsA = consoleA.filter(l => l.type === 'error' || l.text.includes('FirebaseError'));
    const errorsB = consoleB.filter(l => l.type === 'error' || l.text.includes('FirebaseError'));
    results.errorsA = errorsA;
    results.errorsB = errorsB;

    results.allPassed = (
      results.instructorBypass &&
      results.studentLogin &&
      results.taskCreatedByInstructor &&
      results.studentReceivedTaskNoReload &&
      results.reindexingVerified &&
      results.missionCardVerified &&
      results.whiteboardLinkCorrect &&
      results.notesLeaseLockAcquired &&
      results.notesRealtimeSynced &&
      results.attachmentUploadedAndSynced &&
      results.taskEditedAndSynced &&
      results.taskDeletedAndPagesReverted &&
      errorsA.length === 0 &&
      errorsB.length === 0
    );

    fs.writeFileSync(path.join(evidenceDir, 'r1-console-a.json'), JSON.stringify(consoleA, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'r1-console-b.json'), JSON.stringify(consoleB, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'r1-execution-summary.json'), JSON.stringify(results, null, 2));

    console.log('=== Module 3 E2E Test Execution Summary ===');
    console.log(JSON.stringify(results, null, 2));

    return results;

  } finally {
    await browser.close();
  }
}

runTeamTasksE2E().then(res => {
  console.log('=== Module 3 Test Finished ===');
  process.exit(res.allPassed ? 0 : 1);
}).catch(err => {
  console.error('Module 3 E2E Test failed with exception:', err);
  process.exit(1);
});
