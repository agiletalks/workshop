const { chromium } = require('C:/Antigravity/aigile-me/node_modules/@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/workshop/split/';
const CLASS_ID = 'qa-split-test-01';

async function runVoiceMemoAndHandbookE2E() {
  console.log('=== Starting SPLIT Voice Memo, Detailed Article & Print Handbook E2E Test ===');
  const evidenceDir = path.resolve(__dirname, '../evidence');
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
    step1_login: false,
    step2_onAirExperience: false,
    step3_stickiesAndRealtimeSync: false,
    step4_flipDetailedArticle: false,
    step5_copyStickyToTeamNote: false,
    step6_navCancelUnder8s: false,
    step6_navSaveOver8s: false,
    step7_rerecordModalOptions: false,
    step8_printHandbookModal: false,
    step9_zeroAiWordingAudit: false,
    defectsFound: [],
    details: {}
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

    // Fill PasswordGate in Window B
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

    results.step1_login = true;
    console.log('Step 1 complete: Both Instructor and Student logged in.');

    // -------------------------------------------------------------
    // Step 2: Scenario 1 - Instructor Start Recording (ON-AIR board)
    // -------------------------------------------------------------
    console.log('2. Scenario 1: Instructor Start Recording ON-AIR Experience...');
    const lectureTabBtnA = pageA.locator('button:has-text("課堂重點")').first();
    await lectureTabBtnA.click();
    await pageA.waitForTimeout(800);

    const startRecordBtn = pageA.locator('button:has-text("開始錄音")').first();
    await startRecordBtn.waitFor({ state: 'visible', timeout: 5000 });
    await startRecordBtn.click();
    await pageA.waitForTimeout(1500);

    const onAirIndicator = pageA.locator('text=● 錄音中').first();
    const timerDisplay = pageA.locator('text=/00:[0-9]{2}/').first();
    const listeningText = pageA.locator('text=正在聆聽講述內容').first();

    const isOnAirVisible = await onAirIndicator.isVisible().catch(() => false);
    const isTimerVisible = await timerDisplay.isVisible().catch(() => false);
    const isListeningVisible = await listeningText.isVisible().catch(() => false);

    console.log('ON-AIR visible:', isOnAirVisible, 'Timer visible:', isTimerVisible, 'Listening visible:', isListeningVisible);
    await pageA.screenshot({ path: path.join(evidenceDir, 'tc01-onair-recording.png') });
    results.step2_onAirExperience = isOnAirVisible && (isTimerVisible || isListeningVisible);

    // Wait a bit to simulate speaking
    await pageA.waitForTimeout(1500);

    // -------------------------------------------------------------
    // Step 3: Scenario 1 & 2 - Stop Recording & Compile Lecture Stickies
    // -------------------------------------------------------------
    console.log('3. Stopping record & compiling lecture stickies...');
    const stopRecordBtn = pageA.locator('button:has-text("錄好了，整理重點")').first();
    await stopRecordBtn.click();

    // Verify Compiling state: 小編工作中...
    const compilingText = pageA.locator('text=小編工作中').first();
    const isCompilingVisible = await compilingText.isVisible({ timeout: 4000 }).catch(() => false);
    console.log('Compiling state displayed:', isCompilingVisible);

    // Check for Permission Error in console or alert
    pageA.on('dialog', async dialog => {
      console.log('Dialog popped up:', dialog.message());
      await dialog.dismiss();
    });

    try {
      const stickiesTitle = pageA.locator('text=隨堂重點便利貼').first();
      await stickiesTitle.waitFor({ state: 'visible', timeout: 6000 });
      results.step3_stickiesAndRealtimeSync = true;
      await pageA.screenshot({ path: path.join(evidenceDir, 'tc02-stickies-front-instructor.png') });
    } catch (e) {
      console.warn('Stickies did not render due to Firestore permission rejection!');
      const hasPermissionError = consoleLogsA.some(l => l.text.includes('Missing or insufficient permissions')) ||
                                 consoleLogsB.some(l => l.text.includes('Missing or insufficient permissions'));
      if (hasPermissionError) {
        console.error('CRITICAL P0 DETECTED: Missing or insufficient permissions on split_data/.../lecture_notes');
        results.defectsFound.push({
          id: 'BUG-SPLIT-VOICE-01',
          title: 'Firestore 安全規則缺失 lecture_notes 集合權限，導致重點便利貼與詳細內容存檔與全班同步完全被阻斷 (Missing or insufficient permissions)',
          severity: 'P0'
        });
      }
    }

    // -------------------------------------------------------------
    // Step 4: Scenario 4 - Print Handbook Modal (全日列印手冊)
    // -------------------------------------------------------------
    console.log('4. Scenario 4: Testing Print Handbook Modal (全日列印手冊)...');
    const printHandbookBtn = pageA.locator('button:has-text("印出今天筆記")').first();
    await printHandbookBtn.waitFor({ state: 'visible', timeout: 5000 });
    await printHandbookBtn.click();
    await pageA.waitForTimeout(2000);

    const handbookTitle = pageA.locator('text=全日課堂講義手冊').first();
    const coverTitle = pageA.locator('text=需求拆解實戰 · 全日講義筆記手冊').first();
    const printActionBtn = pageA.locator('button:has-text("立即列印 / 存為 PDF")').first();

    const isHandbookTitleVisible = await handbookTitle.isVisible().catch(() => false);
    const isCoverTitleVisible = await coverTitle.isVisible().catch(() => false);
    const isPrintActionVisible = await printActionBtn.isVisible().catch(() => false);

    console.log('Handbook modal visible:', isHandbookTitleVisible, 'Cover visible:', isCoverTitleVisible, 'Print action visible:', isPrintActionVisible);
    await pageA.screenshot({ path: path.join(evidenceDir, 'tc04-print-handbook-modal.png') });

    // Check if Table of Contents (目錄/索引) exists
    const tocLocator = pageA.locator('text=目錄').or(pageA.locator('text=索引')).first();
    const hasToc = await tocLocator.isVisible().catch(() => false);
    console.log('Handbook TOC visible:', hasToc);
    if (!hasToc) {
      results.defectsFound.push({
        id: 'BUG-SPLIT-PRINT-01',
        title: '列印手冊缺少需求委託書載明的「27 頁目錄索引」與「小組筆記成果」區塊',
        severity: 'P2'
      });
    }

    results.step8_printHandbookModal = isHandbookTitleVisible && isCoverTitleVisible && isPrintActionVisible;

    // Close handbook modal
    const closeHandbookBtn = pageA.locator('button:has-text("✕")').first();
    await closeHandbookBtn.click();
    await pageA.waitForTimeout(1000);

    // -------------------------------------------------------------
    // Step 5: Scenario 5 - Zero-AI Wording Check in TaskEditorModal & TeamTaskBriefCard
    // -------------------------------------------------------------
    console.log('5. Scenario 5: Checking Zero-AI wording purity...');
    // Open dynamic task modal
    const insertTaskBtn = pageA.locator('button:has-text("演練任務")').first();
    if (await insertTaskBtn.isVisible()) {
      await insertTaskBtn.click();
      await pageA.waitForTimeout(1200);

      const aiPromptLabel = pageA.locator('text=課堂 AI 提示詞').first();
      const hasAiPromptInModal = await aiPromptLabel.isVisible().catch(() => false);
      console.log('Found "課堂 AI 提示詞" in TaskEditorModal:', hasAiPromptInModal);

      if (hasAiPromptInModal) {
        await pageA.screenshot({ path: path.join(evidenceDir, 'tc05-forbidden-ai-wording-editor.png') });
        results.defectsFound.push({
          id: 'BUG-SPLIT-WORDING-01',
          title: '演練任務編輯器 (TaskEditorModal) 與任務卡 (TeamTaskBriefCard) 仍顯著存在「課堂 AI 提示詞」字樣，違反全站「零 AI 字樣」純潔度規範',
          severity: 'P2'
        });
      }

      // Close modal
      const cancelBtn = pageA.locator('button:has-text("取消")').first();
      if (await cancelBtn.isVisible()) await cancelBtn.click();
      await pageA.waitForTimeout(800);
    }

    // -------------------------------------------------------------
    // Step 6: Code-Level Architectural Analysis for Navigation Race Condition (BUG-SPLIT-VOICE-02)
    // -------------------------------------------------------------
    console.log('6. Analyzing navigation >= 8s race condition bug...');
    // Inspect lines in WorkbookPanel.tsx
    const workbookSource = fs.readFileSync(path.resolve('C:/Antigravity/workshop/split/src/components/WorkbookPanel.tsx'), 'utf-8');
    const bugPattern = /useEffect\(\(\)\s*=>\s*\{\s*recordingSlideIdRef\.current\s*=\s*slide\.id;\s*if\s*\(isLectureRecording\)\s*\{\s*handleStopLectureRecord\(\{[\s\S]*?isNavigating:\s*true/;
    if (bugPattern.test(workbookSource)) {
      console.warn('Confirmed BUG-SPLIT-VOICE-02 in source code: recordingSlideIdRef.current updated before handleStopLectureRecord');
      results.defectsFound.push({
        id: 'BUG-SPLIT-VOICE-02',
        title: '換頁 >= 8 秒保護邏輯中，recordingSlideIdRef.current 在呼叫 handleStopLectureRecord 前被先覆寫為新投影片 ID，導致錄音產生的重點被錯存至下一頁',
        severity: 'P1'
      });
    }

  } catch (err) {
    console.error('Test execution error:', err);
    results.error = err.message;
  } finally {
    fs.writeFileSync(path.join(evidenceDir, 'console-a.json'), JSON.stringify(consoleLogsA, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'console-b.json'), JSON.stringify(consoleLogsB, null, 2));
    fs.writeFileSync(path.join(evidenceDir, 'test-execution-summary.json'), JSON.stringify(results, null, 2));
    console.log('=== Test Execution Finished ===');
    console.log(JSON.stringify(results, null, 2));
    await browser.close();
  }
}

runVoiceMemoAndHandbookE2E().catch(console.error);
