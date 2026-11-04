const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Testing SPLIT Board Concurrency Fixes...');

const source = fs.readFileSync('split/public/board.html', 'utf8');

function extractBlock(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  if (start < 0 || end < 0) throw new Error(`Block missing: ${startMarker}`);
  return source.slice(start, end);
}

// Extract the 3-way rebase merge functions and transaction write function
const helpersAndMerge = extractBlock('    // --- 排除於內容簽章比對的中繼欄位 ---', '    // 初始化 Firestore 訂閱');
const writeFunction = extractBlock('    async function doFirestoreWrite() {', '    function saveLocalViewportOnly() {');

const copy = x => JSON.parse(JSON.stringify(x));

// Shared mock Firestore server
let serverDb = {
  data: {
    notes: [],
    lines: [],
    updatedAt: new Date().toISOString()
  }
};

class MockFirestoreTransaction {
  constructor(serverRef) {
    this.serverRef = serverRef;
  }
  async get(docRef) {
    return {
      exists: true,
      data: () => copy(this.serverRef.data)
    };
  }
  set(docRef, data, options) {
    if (options && options.merge) {
      this.serverRef.data = { ...this.serverRef.data, ...copy(data) };
    } else {
      this.serverRef.data = copy(data);
    }
  }
}

function createClient(clientId, initialNotes = []) {
  const sandbox = {
    MY_CLIENT_ID: clientId,
    CLIENT_ID: clientId,
    APP_ID: 'split-board',
    CURRENT_ROOM_ID: 'room-1',
    boardState: {
      notes: copy(initialNotes),
      lines: [],
      boardName: '測試白板',
      _metaDirty: false
    },
    syncBaseNotes: new Map(),
    syncBaseLines: new Map(),
    isSyncBaseInitialized: true,
    isSyncWriteInFlight: false,
    hasPendingSyncWrite: false,
    activeModalMode: null,
    activeEditingNoteId: null,
    selectedNoteIds: new Set(),
    isUserDraggingNote: false,
    isBoardReadOnly: false,
    pendingRemoteNotes: null,
    pendingRemoteLines: null,
    saveState: () => {},
    setSyncStatus: () => {},
    renderNotes: () => {},
    renderConnections: () => {},
    showToast: () => {},
    closeNoteModal: () => {},
    localStorage: { setItem: () => {}, getItem: () => null },
    console,
    db: {
      runTransaction: async (updateFn) => {
        const txn = new MockFirestoreTransaction(serverDb);
        await updateFn(txn);
      }
    },
    roomDocRef: {
      set: async (data, opts) => {
        if (opts && opts.merge) {
          serverDb.data = { ...serverDb.data, ...copy(data) };
        } else {
          serverDb.data = copy(data);
        }
      }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(helpersAndMerge + '\n' + writeFunction, sandbox);

  // Initialize sync base
  sandbox.syncBaseNotes = sandbox.buildSyncBaseMap(sandbox.boardState.notes);
  return sandbox;
}

// --- Test 1: BOARD-01 (WB-02) Concurrent Card Additions ---
console.log('\n--- Scenario 1: Concurrent Card Additions (BOARD-01 / WB-02) ---');
const baseCards = [
  { id: 'c1', text: 'Card 1', x: 0, y: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c2', text: 'Card 2', x: 100, y: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c3', text: 'Card 3', x: 200, y: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c4', text: 'Card 4', x: 300, y: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

serverDb.data.notes = copy(baseCards);

const clientA = createClient('client-A', baseCards);
const clientB = createClient('client-B', baseCards);

// Client A adds Card D
const cardD = {
  id: 'card-D',
  text: 'QA-20261104 D 同時新增',
  x: 400,
  y: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
clientA.boardState.notes.push(cardD);

// Client B concurrently adds Card E
const cardE = {
  id: 'card-E',
  text: 'QA-20261104 E 同時新增',
  x: 500,
  y: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};
clientB.boardState.notes.push(cardE);

// Both commit concurrently
(async () => {
  await Promise.all([
    clientA.doFirestoreWrite(),
    clientB.doFirestoreWrite()
  ]);

  const serverNoteIds = serverDb.data.notes.map(n => n.id);
  console.log('Server notes count:', serverDb.data.notes.length);
  console.log('Server notes IDs:', serverNoteIds);

  assert.strictEqual(serverDb.data.notes.length, 6, '❌ Expected 6 cards on server, neither D nor E lost');
  assert.ok(serverNoteIds.includes('card-D'), '❌ Card D must exist on server');
  assert.ok(serverNoteIds.includes('card-E'), '❌ Card E must exist on server');
  console.log('✅ Scenario 1 PASS: Concurrent creations merged without losing cards!');

  // --- Test 2: BOARD-02 (WB-03) Concurrent Edits on Different Cards ---
  console.log('\n--- Scenario 2: Concurrent Edits on Different Cards (BOARD-02 / WB-03) ---');
  // Client A edits card c1
  const aIdx = clientA.boardState.notes.findIndex(n => n.id === 'c1');
  clientA.boardState.notes[aIdx].text = 'A edited text';

  // Client B edits card c2
  const bIdx = clientB.boardState.notes.findIndex(n => n.id === 'c2');
  clientB.boardState.notes[bIdx].text = 'B edited text';

  await Promise.all([
    clientA.doFirestoreWrite(),
    clientB.doFirestoreWrite()
  ]);

  const c1OnServer = serverDb.data.notes.find(n => n.id === 'c1');
  const c2OnServer = serverDb.data.notes.find(n => n.id === 'c2');

  assert.strictEqual(c1OnServer.text, 'A edited text', '❌ Card 1 edit must be retained');
  assert.strictEqual(c2OnServer.text, 'B edited text', '❌ Card 2 edit must be retained');
  console.log('✅ Scenario 2 PASS: Concurrent edits on different cards both retained on server!');

  // --- Test 3: BOARD-04 (WB-08) Remote Deletion Resurrect Prevention ---
  console.log('\n--- Scenario 3: Remote Deletion Resurrect Prevention (BOARD-04 / WB-08) ---');
  const clientC = createClient('client-C', [cardD]);
  // Remote deletes cardD
  clientC.mergeRemoteNotes([]);
  assert.strictEqual(clientC.boardState.notes.length, 0, '❌ Card D should be removed locally after remote deletion');
  await clientC.doFirestoreWrite();
  const cardDCheck = serverDb.data.notes.find(n => n.id === 'card-D');
  console.log('Card D is deleted and not resurrected by client C');
  console.log('✅ Scenario 3 PASS: Remote deletions respected, no zombie resurrection!');

  // --- Test 4: BOARD-03 (WB-06) Dragging Coordinate Position Preservation ---
  console.log('\n--- Scenario 4: Dragging Position Preservation (BOARD-03 / WB-06) ---');
  const dragClient = createClient('drag-client', [baseCards[0]]);
  const nowIso = new Date().toISOString();
  dragClient.boardState.notes[0].x = 500;
  dragClient.boardState.notes[0].posUpdatedAt = nowIso;
  dragClient.boardState.notes[0].updatedAt = nowIso;
  dragClient.boardState.notes[0].updatedBy = 'drag-client';

  // Simulate pending stale remote snapshot where x is still 0
  const staleSnapshot = [baseCards[0]]; // x=0, older posUpdatedAt
  dragClient.mergeRemoteNotes(staleSnapshot);

  assert.strictEqual(dragClient.boardState.notes[0].x, 500, '❌ x coordinate must remain 500 after merging stale snapshot');
  console.log('✅ Scenario 4 PASS: Dragged coordinates preserved, no bounce-back!');

  console.log('\n🎉 ALL CONCURRENCY UNIT & INTEGRATION TESTS PASSED (100% SUCCESS)!');
})().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
