const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// 1. Static file server
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function startServer(port = 8899) {
  const server = http.createServer((req, res) => {
    let reqPath = decodeURI(req.url.split('?')[0]);
    if (reqPath.startsWith('/workshop/split/')) {
      reqPath = reqPath.replace('/workshop/split/', '/split/public/');
    } else if (reqPath.startsWith('/workshop/')) {
      reqPath = reqPath.replace('/workshop/', '/');
    }
    let filePath = path.join(rootDir, reqPath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

// 2. CDP Runner
async function testBrowser(browserName, browserExe, debugPort, serverPort) {
  console.log(`\n========================================`);
  console.log(`Testing with ${browserName}: ${browserExe}`);
  console.log(`========================================`);

  const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), `test-profile-${browserName}-`));

  const proc = spawn(browserExe, [
    '--headless=new',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${tempProfile}`,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  // Wait for remote debugging to be ready
  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (res.ok) {
        const json = await res.json();
        wsUrl = json.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    proc.kill();
    fs.rmSync(tempProfile, { recursive: true, force: true });
    throw new Error(`Failed to connect to ${browserName} remote debugging port ${debugPort}`);
  }

  console.log(`✓ Connected to ${browserName} CDP`);

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const pendingRequests = new Map();
  const exceptions = [];
  const consoleLogs = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      pendingRequests.get(data.id)(data);
      pendingRequests.delete(data.id);
    }
    if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params?.exceptionDetails?.text || '';
      const exDesc = data.params?.exceptionDetails?.exception?.description || '';
      exceptions.push(`${desc} ${exDesc}`);
    }
    if (data.method === 'Runtime.consoleAPICalled') {
      const type = data.params?.type;
      const text = (data.params?.args || []).map(a => a.value || a.description || '').join(' ');
      consoleLogs.push(`[${type}] ${text}`);
    }
  };

  function sendCmd(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Create new target / page
  const newTargetRes = await sendCmd('Target.createTarget', { url: 'about:blank' });
  const targetId = newTargetRes.result.targetId;

  // Attach to target
  const attachRes = await sendCmd('Target.attachToTarget', { targetId, flatten: true });
  const sessionId = attachRes.result.sessionId;

  function sendSessionCmd(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      pendingRequests.set(id, resolve);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  await sendSessionCmd('Page.enable');
  await sendSessionCmd('Runtime.enable');

  const targetUrl = process.env.TEST_URL || `http://localhost:${serverPort}/workshop/split/board.html?class=qa-split-collab-20261104&type=qa-collab-r1&team=1`;
  console.log(`Navigating to: ${targetUrl}`);
  await sendSessionCmd('Page.navigate', { url: targetUrl });

  // Wait 4 seconds for scripts and Firestore to initialize
  await new Promise(r => setTimeout(r, 4000));

  // Check exceptions
  console.log(`Captured ${exceptions.length} exceptions:`);
  exceptions.forEach(e => console.log('  ❌ Exception:', e));

  // Evaluate page status
  const evalCheck = await sendSessionCmd('Runtime.evaluate', {
    expression: `(() => {
      return {
        myClientIdDefined: typeof MY_CLIENT_ID !== 'undefined' ? MY_CLIENT_ID : null,
        clientIdDefined: typeof CLIENT_ID !== 'undefined' ? CLIENT_ID : null,
        openNoteModalExists: typeof openNoteModal === 'function',
        btnAddNoteExists: !!document.getElementById('btn-add-note'),
        roomDocRefExists: typeof roomDocRef !== 'undefined' && !!roomDocRef,
        isBoardReadOnly: typeof isBoardReadOnly !== 'undefined' ? isBoardReadOnly : null,
        boardStateNotesCount: typeof boardState !== 'undefined' && boardState.notes ? boardState.notes.length : -1
      };
    })()`,
    returnByValue: true
  });

  const checkResult = evalCheck.result?.result?.value;
  console.log('Initialization Check Result:', JSON.stringify(checkResult, null, 2));

  if (!checkResult?.myClientIdDefined || !checkResult?.openNoteModalExists || !checkResult?.btnAddNoteExists) {
    throw new Error(`${browserName} initialization verification failed!`);
  }
  console.log(`✓ ${browserName} script initialized successfully. MY_CLIENT_ID = ${checkResult.myClientIdDefined}`);

  // Test clicking "新增便利貼"
  console.log('Testing "新增便利貼" click and modal opening...');
  const clickResult = await sendSessionCmd('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-add-note');
      btn.click();
      const modal = document.getElementById('note-modal');
      const isVisible = modal && !modal.classList.contains('hidden');
      return {
        modalOpened: isVisible,
        activeModalMode: typeof activeModalMode !== 'undefined' ? activeModalMode : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Modal Click Result:', JSON.stringify(clickResult.result?.result?.value, null, 2));

  // Test creating a sticky note
  console.log('Testing saving a new note via saveNoteModal()...');
  const createResult = await sendSessionCmd('Runtime.evaluate', {
    expression: `(() => {
      const textInput = document.getElementById('modal-note-text');
      if (textInput) textInput.value = 'QA Smoke Test Note from ' + '${browserName}';
      saveNoteModal();
      const modal = document.getElementById('note-modal');
      const isHiddenNow = modal && modal.classList.contains('hidden');
      const addedNote = boardState.notes.find(n => n.text.includes('QA Smoke Test Note'));
      return {
        modalClosed: isHiddenNow,
        noteAdded: !!addedNote,
        noteId: addedNote ? addedNote.id : null,
        notesCount: boardState.notes.length
      };
    })()`,
    returnByValue: true
  });
  console.log('Note Creation Result:', JSON.stringify(createResult.result?.result?.value, null, 2));

  const noteCreated = createResult.result?.result?.value?.noteAdded;
  if (!noteCreated) {
    throw new Error(`${browserName} failed to create sticky note!`);
  }
  console.log(`✓ ${browserName} successfully created note! Total notes: ${createResult.result?.result?.value?.notesCount}`);

  // Verify syntax exceptions are 0
  const syntaxErrors = exceptions.filter(e => e.includes('SyntaxError') || e.includes('already been declared'));
  if (syntaxErrors.length > 0) {
    throw new Error(`${browserName} had syntax errors: ${syntaxErrors.join('; ')}`);
  }
  console.log(`✓ ${browserName} passed with 0 SyntaxError exceptions.`);

  ws.close();
  proc.kill();
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch (e) {}

  return true;
}

async function main() {
  const serverPort = 8899;
  const server = await startServer(serverPort);
  console.log(`Local test server running on port ${serverPort}`);

  const chromeExe = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  try {
    await testBrowser('Google Chrome', chromeExe, 9222, serverPort);
    await testBrowser('Microsoft Edge', edgeExe, 9223, serverPort);
    console.log('\n🎉 ALL BROWSER SMOKE TESTS PASSED (Chrome + Edge)!');
  } catch (err) {
    console.error('\n❌ Smoke Test Failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

main();
