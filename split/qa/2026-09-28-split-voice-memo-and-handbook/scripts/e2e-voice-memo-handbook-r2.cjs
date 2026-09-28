const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/workshop/split/';
const CLASS_ID = 'qa-split-test-01';

async function runVoiceMemoAndHandbookR2() {
  console.log('=== Starting SPLIT Voice Memo & Handbook Round 2 (R2) Retest ===');
  const evidenceDir = path.resolve(__dirname, '../evidence/r2');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });

  const contextA = await browser.newContext({
    permissions: ['microphone'],
    viewport: { width: 1440, height: 900 }
  });
  const contextB = await browser.newContext({
    permissions: ['microphone'],
    viewport: { width: 1440, height: 900 }
  });

  // Inject Web Speech API mock into both contexts
  const mockSpeechScript = `
    class MockSpeechRecognition {
      constructor() {
        this.continuous = true;
        this.interimResults = true;
        this.lang = 'zh-TW';
        this.onresult = null;
        this.onerror = null;
        this.onend = null;
        this.started = false;
      }
      start() {
        this.started = true;
        window.__mockSpeechRecognitionInstance = this;
        setTimeout(() => {
          if (this.started && this.onresult) {
            const speechText = window.__mockSpeechText || '敏捷需求拆解的核心原則是以價值為導向小步快跑驗證假設。透過使用者故事切割邊界與確認驗收條件。';
            this.onresult({
              resultIndex: 0,
              results: [[{ transcript: speechText, isFinal: true }]]
            });
          }
        }, 800);
      }
      stop() {
        this.started = false;
        if (this.onend) this.onend();
      }
      abort() {
        this.started = false;
        if (this.onend) this.onend();
      }
    }
    window.webkitSpeechRecognition = MockSpeechRecognition;
    window.SpeechRecognition = MockSpeechRecognition;
  `;

  await contextA.addInitScript(mockSpeechScript);
  await contextB.addInitScript(mockSpeechScript);

  const pageA = await contextA.newPage(); // Instructor
  const pageB = await contextB.newPage(); // Student

  const consoleLogsA = [];
  const consoleLogsB = [];
  pageA.on('console', msg => consoleLogsA.push({ type: msg.type(), text: msg.text() }));
  pageB.on('console', msg => consoleLogsB.push({ type: msg.type(), text: msg.text() }));

  const results = {
    testTime: new Date().toISOString(),
    tc01_voiceCloudSaveAndSync: false,
    tc01_studentReceivedSync: false,
    tc01_flipCardArticleWorks: false,
    tc01_copyStickyToNoteWorks: false,
    tc02_navOver8sTargetCorrect: false,
    tc02_nextSlideRemainedClean: false,
    tc03_handbookModalOpened: false,
    tc03_handbookHas27PageToc: false,
    tc03_handbookHasTeamNotes: false,
    tc04_zeroAiWordingTaskEditor: false,
    tc04_zeroAiWordingTaskCard: false,
    defectsResolved: [],
    remainingDefects: [],
    allPassed: false
  };

  try {
    // -------------------------------------------------------------
    // Step 1: Login Instructor (Window A) & Student (Window B)
    // -------------------------------------------------------------
    console.log('1. Logging in Instructor (Window A)...');
    await pageA.goto(`${BASE_URL}?c=${CLASS_ID}&role=instructor&adm=agile-2026`, { waitUntil: 'domcontentloaded' });
    await pageA.waitForTimeout(2000);

    console.log('1b. Logging in Student 小明 (Window B)...');
    await pageB.goto(`${BASE_URL}?c=${CLASS_ID}`, { waitUntil: 'domcontentloaded' });
    await pageB.waitForTimeout(1500);

    const nameInput = pageB.locator('input[placeholder*="Alex"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('QA-小明');
      const passInput = pageB.locator('input[type="password"]');
      if (await passInput.isVisible()) {
        await passInput.fill('split-2026');
      }
      await pageB.click('button[type="submit"]');
      await pageB.waitForTimeout(2000);
    }

    // -------------------------------------------------------------
    // TC-VOICE-R2-01: 雲端存取與同步 (驗證 BUG-SPLIT-VOICE-01 修復)
    // -------------------------------------------------------------
    console.log('2. [TC-VOICE-R2-01] Testing cloud save & permissions...');
    const lectureTabBtnA = pageA.locator('button:has-text("課堂重點")').first();
    await lectureTabBtnA.click();
    await pageA.waitForTimeout(800);

    // If already has stickies or button, handle start record
    const recordBtn = pageA.locator('button:has-text("開始錄音")').or(pageA.locator('button:has-text("錄音選項")')).first();
    await recordBtn.waitFor({ state: 'visible', timeout: 5000 });
    const btnText = await recordBtn.innerText();

    if (btnText.includes('錄音選項')) {
      await recordBtn.click();
      await pageA.waitForTimeout(800);
      const freshBtn = pageA.locator('button:has-text("重新錄這頁")').first();
      await freshBtn.click();
    } else {
      await recordBtn.click();
    }
    await pageA.waitForTimeout(1500);

    // Wait 2.5s for audio mock to fire
    await pageA.waitForTimeout(2500);

    // Click Stop Recording
    const stopRecordBtn = pageA.locator('button:has-text("錄好了，整理重點")').first();
    await stopRecordBtn.click();
    console.log('Clicked stop recording, waiting for compile...');

    // Wait for stickies to render
    const stickiesTitleA = pageA.locator('text=隨堂重點便利貼').first();
    await stickiesTitleA.waitFor({ state: 'visible', timeout: 15000 });
    console.log('Stickies rendered on Instructor Window A!');
    await pageA.screenshot({ path: path.join(evidenceDir, 'r2-tc01-instructor-stickies-saved.png') });
    results.tc01_voiceCloudSaveAndSync = true;

    // Verify Student Window B received the stickies without reload!
    console.log('Verifying Student Window B realtime sync...');
    const lectureTabBtnB = pageB.locator('button:has-text("課堂重點")').first();
    await lectureTabBtnB.click();
    await pageB.waitForTimeout(2000);

    const stickiesTitleB = pageB.locator('text=隨堂重點便利貼').first();
    const isStudentSynced = await stickiesTitleB.isVisible({ timeout: 6000 }).catch(() => false);
    console.log('Student Window B synced stickies without reload:', isStudentSynced);
    await pageB.screenshot({ path: path.join(evidenceDir, 'r2-tc01-student-stickies-synced.png') });
    results.tc01_studentReceivedSync = isStudentSynced;

    // Flip to article (反面)
    console.log('Testing flip to article (反面)...');
    const viewArticleBtn = pageA.locator('button:has-text("看詳細內容")').first();
    await viewArticleBtn.click();
    await pageA.waitForTimeout(1000);

    const articleTitle = pageA.locator('text=課堂詳細內容').first();
    const isArticleVisible = await articleTitle.isVisible().catch(() => false);
    console.log('Detailed article visible on flip:', isArticleVisible);
    await pageA.screenshot({ path: path.join(evidenceDir, 'r2-tc01-article-back-view.png') });

    // Flip back
    const backToStickiesBtn = pageA.locator('button:has-text("翻回重點便利貼")').first();
    await backToStickiesBtn.click();
    await pageA.waitForTimeout(800);
    results.tc01_flipCardArticleWorks = isArticleVisible && (await stickiesTitleA.isVisible());

    // Copy sticky to team note
    console.log('Testing copy sticky to team note on Student Window B...');
    const copyStickyBtn = pageB.locator('button:has-text("貼入小組筆記")').first();
    if (await copyStickyBtn.isVisible()) {
      await copyStickyBtn.click();
      await pageB.waitForTimeout(1500);

      const memoTextarea = pageB.locator('textarea').first();
      const memoVal = await memoTextarea.inputValue().catch(() => '');
      console.log('Student memo textarea value:', memoVal.slice(0, 60));
      results.tc01_copyStickyToNoteWorks = memoVal.includes('【') && memoVal.includes('•');
      await pageB.screenshot({ path: path.join(evidenceDir, 'r2-tc01-sticky-copied-to-note.png') });
    }

    if (results.tc01_voiceCloudSaveAndSync && results.tc01_studentReceivedSync) {
      results.defectsResolved.push('BUG-SPLIT-VOICE-01');
    }

    // -------------------------------------------------------------
    // TC-VOICE-R2-02: 換頁收尾目標正確性 (驗證 BUG-SPLIT-VOICE-02 修復)
    // -------------------------------------------------------------
    console.log('3. [TC-VOICE-R2-02] Testing navigation >= 8s target accuracy...');
    // Switch to Slide 2 via Next Slide button
    const nextBtn = pageA.locator('button:has-text("下一頁")').first();
    const prevBtn = pageA.locator('button:has-text("上一頁")').first();
    await nextBtn.click();
    await pageA.waitForTimeout(1500);
    await lectureTabBtnA.click();
    await pageA.waitForTimeout(800);

    // Set mock speech specifically for Slide 2
    await pageA.evaluate(() => {
      window.__mockSpeechText = '第二頁核心是需求拆解架構與價值全景圖，確認商業目標與實作者共識。';
    });

    const startRecordSlide2 = pageA.locator('button:has-text("開始錄音")').or(pageA.locator('button:has-text("錄音選項")')).first();
    const btn2Text = await startRecordSlide2.innerText();
    if (btn2Text.includes('錄音選項')) {
      await startRecordSlide2.click();
      await pageA.waitForTimeout(600);
      await pageA.locator('button:has-text("重新錄這頁")').first().click();
    } else {
      await startRecordSlide2.click();
    }

    console.log('Recording on Slide 2, waiting 9 seconds (>= 8s)...');
    await pageA.waitForTimeout(9000);

    // Now navigate to Slide 3 via Next Slide button!
    console.log('Navigating to Slide 3 after 9s to trigger auto-finalize...');
    await nextBtn.click();
    await pageA.waitForTimeout(6000); // Wait for compilation to finish

    // Verify Slide 3 is CLEAN (did NOT receive Slide 2 notes)
    await lectureTabBtnA.click();
    await pageA.waitForTimeout(800);
    const slide3HasStickies = await pageA.locator('text=隨堂重點便利貼').isVisible().catch(() => false);
    const slide3HasUnrecordedPrompt = await pageA.locator('text=尚未錄製本頁重點').isVisible().catch(() => false);
    console.log('Slide 3 has stickies (expect false):', slide3HasStickies, 'has unrecorded prompt (expect true):', slide3HasUnrecordedPrompt);
    results.tc02_nextSlideRemainedClean = !slide3HasStickies && slide3HasUnrecordedPrompt;
    await pageA.screenshot({ path: path.join(evidenceDir, 'r2-tc02-slide3-remained-clean.png') });

    // Go back to Slide 2 to verify it received the notes!
    console.log('Navigating back to Slide 2 via Prev Slide button to verify note saved properly...');
    await prevBtn.click();
    await pageA.waitForTimeout(2000);
    await lectureTabBtnA.click();
    await pageA.waitForTimeout(800);

    const slide2HasStickies = await pageA.locator('text=隨堂重點便利貼').isVisible().catch(() => false);
    console.log('Slide 2 has stickies (expect true):', slide2HasStickies);
    await pageA.screenshot({ path: path.join(evidenceDir, 'r2-tc02-slide2-saved-correctly.png') });
    results.tc02_navOver8sTargetCorrect = slide2HasStickies;

    if (results.tc02_navOver8sTargetCorrect && results.tc02_nextSlideRemainedClean) {
      results.defectsResolved.push('BUG-SPLIT-VOICE-02');
    }

    // -------------------------------------------------------------
    // TC-PRINT-R2-01: 列印手冊完備度 (驗證 BUG-SPLIT-PRINT-01 修復)
    // -------------------------------------------------------------
    console.log('4. [TC-PRINT-R2-01] Testing Print Handbook Modal...');
    const printHandbookBtn = pageA.locator('button:has-text("印出今天筆記")').first();
    await printHandbookBtn.waitFor({ state: 'visible', timeout: 5000 });
    await printHandbookBtn.click();
    await pageA.waitForTimeout(2500);

    const handbookModalTitle = pageA.locator('text=全日課堂講義手冊').first();
    results.tc03_handbookModalOpened = await handbookModalTitle.isVisible().catch(() => false);

    // Verify 27 頁目錄索引 (Table of Contents)
    const tocHeading = pageA.locator('text=課程單元與投影片目錄索引').first();
    const isTocVisible = await tocHeading.isVisible().catch(() => false);
    console.log('Handbook 27-page TOC visible:', isTocVisible);
    results.tc03_handbookHas27PageToc = isTocVisible;

    // Verify Team Notes Section (e.g. 👥 第 1 組實作與討論筆記成果)
    const teamNoteSection = pageA.locator('text=/第 [0-9]+ 組實作與討論筆記成果/').first();
    const isTeamNoteVisible = await teamNoteSection.isVisible().catch(() => false);
    console.log('Handbook team note section visible:', isTeamNoteVisible);
    results.tc03_handbookHasTeamNotes = isTeamNoteVisible;

    await pageA.screenshot({ path: path.join(evidenceDir, 'r2-tc03-print-handbook-complete.png') });

    if (results.tc03_handbookHas27PageToc && results.tc03_handbookHasTeamNotes) {
      results.defectsResolved.push('BUG-SPLIT-PRINT-01');
    }

    // Close handbook modal
    const closeHandbookBtn = pageA.locator('button:has-text("✕")').first();
    await closeHandbookBtn.click();
    await pageA.waitForTimeout(1000);

    // -------------------------------------------------------------
    // TC-WORDING-R2-01: 零 AI 字樣查核 (驗證 BUG-SPLIT-WORDING-01 修復)
    // -------------------------------------------------------------
    console.log('5. [TC-WORDING-R2-01] Verifying Zero-AI wording in TaskEditorModal & TaskCard...');
    const addTeamTaskBtn = pageA.locator('button:has-text("+演練")').first();
    if (await addTeamTaskBtn.isVisible()) {
      await addTeamTaskBtn.click();
      await pageA.waitForTimeout(1000);

      // Scroll modal to bottom
      const modalScrollable = pageA.locator('form').first();
      await modalScrollable.evaluate(el => el.scrollTop = el.scrollHeight);
      await pageA.waitForTimeout(500);

      const promptLabel = pageA.locator('text=💡 課堂提示詞範本').first();
      const isPromptLabelVisible = await promptLabel.isVisible().catch(() => false);

      const forbiddenAiLabel = pageA.locator('text=課堂 AI 提示詞').first();
      const hasForbiddenAi = await forbiddenAiLabel.isVisible().catch(() => false);

      console.log('Prompt label visible:', isPromptLabelVisible, 'Forbidden "課堂 AI 提示詞" exists:', hasForbiddenAi);
      await pageA.screenshot({ path: path.join(evidenceDir, 'r2-tc04-task-editor-zero-ai.png') });

      results.tc04_zeroAiWordingTaskEditor = isPromptLabelVisible && !hasForbiddenAi;

      // Close modal
      const cancelModalBtn = pageA.locator('button:has-text("取消")').first();
      await cancelModalBtn.click();
      await pageA.waitForTimeout(800);
    }

    // Verify TeamTaskBriefCard source code as well
    const teamTaskCardSource = fs.readFileSync(path.resolve('C:/Antigravity/workshop/split/src/components/TeamTaskBriefCard.tsx'), 'utf-8');
    results.tc04_zeroAiWordingTaskCard = !teamTaskCardSource.includes('課堂 AI 提示詞') && teamTaskCardSource.includes('課堂提示詞範本');
    console.log('TeamTaskBriefCard has zero AI wording:', results.tc04_zeroAiWordingTaskCard);

    if (results.tc04_zeroAiWordingTaskEditor && results.tc04_zeroAiWordingTaskCard) {
      results.defectsResolved.push('BUG-SPLIT-WORDING-01');
    }

    // Check if any errors in consoles
    const hasConsoleErrorsA = consoleLogsA.some(l => l.text.includes('Missing or insufficient permissions'));
    const hasConsoleErrorsB = consoleLogsB.some(l => l.text.includes('Missing or insufficient permissions'));
    if (hasConsoleErrorsA || hasConsoleErrorsB) {
      results.remainingDefects.push('BUG-SPLIT-VOICE-01');
    }

    results.allPassed = results.defectsResolved.length === 4 && results.remainingDefects.length === 0;

  } catch (err) {
    console.error('R2 Retest error:', err);
    results.error = err.message;
  } finally {
    fs.writeFileSync(path.join(evidenceDir, 'r2-console-a.json'), JSON.stringify(consoleLogsA, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'r2-console-b.json'), JSON.stringify(consoleLogsB, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'r2-execution-summary.json'), JSON.stringify(results, null, 2));
    console.log('=== R2 Retest Finished ===');
    console.log(JSON.stringify(results, null, 2));
    await browser.close();
  }
}

runVoiceMemoAndHandbookR2().catch(console.error);
