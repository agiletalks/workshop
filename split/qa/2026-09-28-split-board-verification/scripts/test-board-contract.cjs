/**
 * QA 自動化驗證腳本：SPLIT 線上雲端白板合約與權限檢驗
 * 專用測試班級：qa-split-test-01
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== [QA] 開始執行 SPLIT 線上雲端白板合約與權限自動化檢測 ===\n');

const splitRoot = path.join(__dirname, '..', '..', '..');
const boardHtmlPath = path.join(splitRoot, 'public', 'board.html');
const workbookPanelPath = path.join(splitRoot, 'src', 'components', 'WorkbookPanel.tsx');

let passedCount = 0;
let totalCount = 0;

function runTest(testId, name, fn) {
  totalCount++;
  try {
    fn();
    console.log(`✅ [PASS] ${testId}: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`❌ [FAIL] ${testId}: ${name}`);
    console.error(`   原因: ${err.message}`);
  }
}

// TC-01: 檔案存在與標題主題驗證
runTest('TC-BOARD-01', '白板檔案存在且具備 SPLIT 專屬品牌標籤', () => {
  assert(fs.existsSync(boardHtmlPath), 'board.html 檔案不存在');
  const content = fs.readFileSync(boardHtmlPath, 'utf8');
  assert(content.includes('SPLIT 小組線上雲端白板'), '未包含正確的標題文字');
  assert(content.includes('bg-[#0e9aa0]'), '未包含 SPLIT 主題深青綠色');
});

// TC-02: 世代隔離路徑合約驗證
runTest('TC-BOARD-02', 'Firestore 世代隔離路徑合約驗證', () => {
  const content = fs.readFileSync(boardHtmlPath, 'utf8');
  assert(content.includes('split_classes'), '未監聽 split_classes 集合');
  assert(content.includes('split_data'), '未寫入 split_data 集合');
  assert(content.includes("collection('generations')"), '未包含 generations 子集合');
  assert(content.includes("collection('boards')"), '未包含 boards 子集合');
});

// TC-03: 跨組觀摩切換與「切回我組」UI 驗證
runTest('TC-BOARD-03', '跨組觀摩選單 (1~12組) 與切回我組按鈕驗證', () => {
  const content = fs.readFileSync(boardHtmlPath, 'utf8');
  assert(content.includes('id="btn-return-my-team"'), '缺少切回我組按鈕 (btn-return-my-team)');
  assert(content.includes('option value="team-12"'), '未擴充支援至 12 組選項');
  assert(content.includes('returnToMyTeam'), '缺少 returnToMyTeam 處理函式');
});

// TC-04: Session 繼承與身分鎖定驗證
runTest('TC-BOARD-04', '學員 Session (split_user_session) 自動繼承檢測', () => {
  const content = fs.readFileSync(boardHtmlPath, 'utf8');
  assert(content.includes("localStorage.getItem('split_user_session')"), '未自動讀取 split_user_session');
  assert(content.includes('isObserver'), '缺少跨組觀摩判斷標記 isObserver');
});

// TC-05: 講義按鈕串接驗證
runTest('TC-BOARD-05', '講義 WorkbookPanel 直連專屬雲端白板驗證', () => {
  assert(fs.existsSync(workbookPanelPath), 'WorkbookPanel.tsx 檔案不存在');
  const content = fs.readFileSync(workbookPanelPath, 'utf8');
  assert(content.includes('board.html?c='), '白板按鈕未正確導向 board.html 帶 classId');
  assert(content.includes('&team='), '白板按鈕未帶 team 參數');
  assert(content.includes('&type='), '白板按鈕未帶 type 參數');
});

console.log(`\n========================================`);
console.log(`測試統計: ${passedCount} / ${totalCount} 項測試通過`);
console.log(`========================================\n`);

if (passedCount === totalCount) {
  process.exit(0);
} else {
  process.exit(1);
}
