# AI-Align 敏捷協作白板 (board.html) 需求與架構優化規格書

本規格書彙整 `ai-align/board.html` 的**現有問題根因診斷**、**Miro 級協同架構分析**與**預計重構開發需求**，供後續在其他設備進行深入開發與實作。

---

## 📌 目錄
1. [背景與問題總覽](#-一-背景與問題總覽)
2. [需求 1：多選工具列「變更色彩」選單空隙修復 (已本機驗證)](#-二-需求-1多選工具列變更色彩選單空隙修復)
3. [需求 2：多人即時協作並發衝突與內容丟失重構 (核心任務)](#-三-需求-2多人即時協作並發衝突與內容丟失重構-核心任務)
4. [借鏡 Miro：5 大關鍵機制與本專案落地藍圖](#-四-借鏡-miro5-大關鍵機制與本專案落地藍圖)
5. [具體實作規格與函數改動清單](#-五-具體實作規格與函數改動清單)
6. [多用戶並發測試與驗證計畫](#-六-多用戶並發測試與驗證計畫)

---

## 🚨 一、 背景與問題總覽

在課堂中多位學員同時使用 `ai-align/board.html` 協作白板時，同學反應兩大核心問題：
1. **選單操作 Bug**：滑鼠移向「變更色彩」子選單時，選單瞬間消失點不到。
2. **多人協作資料覆寫與丟失（嚴重）**：
   - 同學打好的便利貼內容**突然消失（整張被刪除）**。
   - 同學打好的文字**被退回尚未修改前的舊版本**。
   - 卡片移動後被其他同學的操作彈回原點。

---

## 🛠️ 二、 需求 1：多選工具列「變更色彩」選單空隙修復

### 1. 問題根因
- **位置**：`ai-align/board.html` 第 626～634 行。
- **原因**：多選浮動工具列（`#multiselect-toolbar`）位於畫面底部，子選單設定為向頂部展開（`bottom-full`），且原先使用外距 `mb-2`（`margin-bottom: 8px`）拉開距離。
- **機制**：CSS 盒模型中 `margin` 屬於元素邊界外區域，**無法捕獲滑鼠 hover 事件**。游標從按鈕往上移動跨越這 8px 空隙時，瀏覽器判定觸發 `mouseleave`，導致 `.group/color` 失去 hover 狀態，選單在游標進入前立即隱藏。

### 2. 修復方案（雙層 Padding Bridge 結構）
將 `mb-2` 移除，改用外層透明容器的 `pb-2.5`（底部內距 10px）作為隱形感應橋樑，內層再放有背景與陰影的卡片：
```html
<!-- 批次換色 -->
<div class="relative group/color">
  <button class="hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors">
    <span class="w-3 h-3 rounded-full bg-emerald-500 border border-slate-300"></span> 變更色彩
  </button>
  <!-- 外層容器：pb-2.5 作為無縫懸浮橋樑，消除 mouseleave 空隙 -->
  <div class="absolute bottom-full left-1/2 -translate-x-1/2 pb-2.5 hidden group-hover/color:block hover:block z-50 w-44">
    <div class="bg-white rounded-xl shadow-xl border border-slate-100 p-2">
      <div id="multiselect-color-grid" class="grid grid-cols-5 gap-1.5"></div>
    </div>
  </div>
</div>
```
- **狀態**：本機已完成代碼替換與編譯驗證。

---

## 💥 三、 需求 2：多人即時協作並發衝突與內容丟失重構 (核心任務)

### 1. 深度排查：造成「內容消失」與「退回舊版」的 4 大技術死穴

#### ① 全畫布全陣列覆寫 (Blind Full-Array Overwrite)
- **現行代碼**（第 1076～1083 行）：
  ```javascript
  const dataToSave = {
    notes: boardState.notes, // 整張板子幾十張卡片打包成單一 JS 陣列
    updatedAt: boardState.updatedAt
  };
  roomDocRef.set(dataToSave, { merge: true });
  ```
- **衝突場景**：
  - 10:00:00 板子上有 `[卡片1, 卡片2]`。
  - 10:00:01 同學 A 編輯卡片 1（A 本機：`[卡片1(新), 卡片2]`）。
  - 10:00:02 同學 B 新增卡片 3（B 本機：`[卡片1(舊), 卡片2, 卡片3]`）並按下儲存。
  - 10:00:04 同學 A 編輯完卡片 1 按下儲存：A 將自己本機的 `[卡片1(新), 卡片2]` 寫入雲端。
  - **後果**：同學 B 剛打好的「卡片 3」被同學 A 的整包覆寫直接從雲端抹除！同學 B 畫面的卡片瞬間消失！

#### ② 拖曳卡片時直接丟棄雲端推播 (Snapshot Drop during Drag)
- **現行代碼**（第 1017～1019 行）：
  ```javascript
  roomDocRef.onSnapshot((doc) => {
    if (isUserDraggingNote) {
      return; // 只要使用者正在拖曳卡片，完全不接收雲端任何異動！
    }
    ...
  ```
- **衝突場景**：
  - 同學 A 按住拖曳卡片 2 秒。
  - 這 2 秒內同學 B 新增了卡片，或修改了文字並儲存。
  - 同學 A 的 `onSnapshot` 收到通知，因 `isUserDraggingNote === true` 直接丟棄。
  - 同學 A 放開滑鼠時（`pointerup`，第 2313 行），觸發 `saveState(true)`：A 拿自己 2 秒前完全沒有 B 新卡片的舊資料，整包回寫資料庫！
  - **後果**：同學 B 的所有新增與修改被同學 A 的放開拖曳動作全部覆蓋刪除。

#### ③ 學員未帶唯一 Client ID，防搶鎖定（Lock）完全失效
- **現行代碼**（第 737～744 行、第 935 行）：
  ```javascript
  user = (user && user.trim()) ? user.trim() : '學員';

  function isNoteLockedByOther(note) {
    const myName = TEAM_INFO.userName;
    return Boolean(note.lock.lockedBy && note.lock.lockedBy !== myName);
  }
  ```
- **衝突場景**：
  - 多位同學如果透過同一個 URL（未加 `?user=xxx`）進入同一小組，`TEAM_INFO.userName` 全部預設為 `'學員'`。
  - 同學 A 點開編輯，`lockedBy: '學員'`。
  - 同學 B 也去點同一張卡片，檢查 `lockedBy !== myName` ➜ `'學員' !== '學員'` 為 **false**。
  - 系統誤判為同一個人，**鎖定完全被穿透**。兩人同時打同一張卡片，後存檔者把先存檔者覆蓋。

#### ④ 全域 Undo（Ctrl+Z）導致整塊板子時光倒流
- **現行代碼**（第 1265～1273 行）：
  ```javascript
  function undo() {
    const previousNotes = undoStack.pop();
    boardState.notes = previousNotes; // 整塊板子倒回自己上一步的快照
    saveState(true);
  }
  ```
- **衝突場景**：
  - `undoStack` 存的是整張畫布快照。某位同學按了 Ctrl+Z，直接把全組板子倒回數分鐘前，期間全組所有人打的便利貼全部被退回。

---

## 🚀 四、 借鏡 Miro：5 大關鍵機制與本專案落地藍圖

| Miro / Figma 專業架構 | 本專案落地升級方案 (Vanilla JS + Firestore) |
| :--- | :--- |
| **物件級細粒度存取** | **單卡智慧增量合併 (Per-Note Smart Merge)**：以卡片 `id` 與 `updatedAt` 為依據，不覆蓋全陣列 |
| **瞬態與持久化分流** | **拖曳推播暫存佇列 (Pending Sync Queue)**：拖曳期間不丟棄快照，放開時局部更新座標與合併 |
| **獨立 Client Session** | **隨機生成 Client UUID**：瀏覽器 Session 產生唯一 ID，徹底阻斷同名鎖定穿透 |
| **非阻塞編輯 (Inline)** | **編輯中卡片免受遠端覆蓋 (Local Edit Immunity)**：本機正在編輯的卡片優先保護 |
| **個人專屬 Undo** | **限縮個人動作復原 (Scoped Action Undo)**：Ctrl+Z 僅復原自己最後動過的一張卡片 |

---

## 💻 五、 具體實作規格與函數改動清單

### 1. 新增唯一用戶端 ID (Client UUID)
在 `ai-align/board.html` 初始化時生成，存於 `sessionStorage`：
```javascript
function getOrCreateClientId() {
  let cid = sessionStorage.getItem('aigile_client_id');
  if (!cid) {
    cid = 'cli_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    sessionStorage.setItem('aigile_client_id', cid);
  }
  return cid;
}
const CLIENT_ID = getOrCreateClientId();
```

### 2. 卡片鎖定結構升級
- **卡片資料結構擴充**：
  ```javascript
  note.lock = {
    isLocked: true,
    lockedBy: TEAM_INFO.userName || '組員',
    lockedByClientId: CLIENT_ID, // 唯一 Client ID
    lockedAt: Date.now()
  };
  ```
- **判定函式修改**：
  ```javascript
  function isNoteLockedByOther(note) {
    if (!note || !note.lock || !note.lock.isLocked) return false;
    const lockAge = Date.now() - (note.lock.lockedAt || 0);
    if (lockAge > 45000) return false; // 45秒防死鎖逾時
    // 以 Client ID 為精確判定，名稱為輔
    if (note.lock.lockedByClientId) {
      return note.lock.lockedByClientId !== CLIENT_ID;
    }
    return Boolean(note.lock.lockedBy && note.lock.lockedBy !== TEAM_INFO.userName);
  }
  ```

### 3. 單卡智慧增量合併演算法 (Per-Note Smart Merge)
在 `onSnapshot` 收到 `remoteData.notes` 時，**禁止直接** `boardState.notes = remoteData.notes`：
```javascript
function mergeRemoteNotes(remoteNotes) {
  if (!Array.isArray(remoteNotes)) return;

  const localMap = new Map(boardState.notes.map(n => [n.id, n]));
  const remoteMap = new Map(remoteNotes.map(n => [n.id, n]));
  const merged = [];

  // 1. 處理遠端所有卡片
  for (const [id, remoteNote] of remoteMap.entries()) {
    const localNote = localMap.get(id);

    // 如果本機正在編輯此卡片 (Modal 打開中)，優先保護本地輸入內容
    if (activeModalMode === 'edit' && activeEditingNoteId === id) {
      merged.push(localNote);
      continue;
    }

    // 如果本機正在拖曳此卡片，保留本機座標，但可更新其他非幾何屬性
    if (isDraggingNoteId === id && localNote) {
      merged.push({
        ...remoteNote,
        x: localNote.x,
        y: localNote.y
      });
      continue;
    }

    // 若本地沒有，代表其他組員新增 ➜ 加入
    if (!localNote) {
      merged.push(remoteNote);
      continue;
    }

    // 兩邊都有 ➜ 比較 updatedAt 時間戳記
    const remoteTime = new Date(remoteNote.updatedAt || 0).getTime();
    const localTime = new Date(localNote.updatedAt || 0).getTime();

    if (remoteTime >= localTime) {
      merged.push(remoteNote);
    } else {
      merged.push(localNote);
    }
  }

  // 2. 處理本地剛建立但尚未同步完成的卡片
  for (const [id, localNote] of localMap.entries()) {
    if (!remoteMap.has(id)) {
      // 檢查是否為本地剛建立 (建立未滿 5 秒)
      const age = Date.now() - new Date(localNote.createdAt || 0).getTime();
      if (age < 5000) {
        merged.push(localNote); // 保護新卡片不被遠端延遲覆蓋刪除
      }
    }
  }

  boardState.notes = merged;
}
```

### 4. 拖曳暫存佇列 (Pending Sync Queue)
拖曳卡片時不再直接 `return`，而是記錄最新快照：
```javascript
let pendingRemoteNotes = null;

// 在 onSnapshot 中：
if (isUserDraggingNote) {
  pendingRemoteNotes = remoteData.notes; // 暫存不丟棄
  return;
}

// 在 pointerup / 拖曳結束中：
if (pendingRemoteNotes) {
  mergeRemoteNotes(pendingRemoteNotes);
  pendingRemoteNotes = null;
  renderNotes();
}
```

### 5. 個人化 Undo (Scoped Undo)
將 `pushHistory()` 與 `undo()` 限縮至個人動作：
```javascript
// 記錄個人 Action 格式
{
  type: 'MOVE',
  noteId: 'note-123',
  prevX: 100,
  prevY: 200,
  timestamp: Date.now()
}
// Undo 時僅針對 noteId 恢復座標，並只更新該卡片
```

---

## 🧪 六、 多用戶並發測試與驗證計畫

| 測試案例 | 步驟 | 預期結果 |
| :--- | :--- | :--- |
| **TC-01: 同名學員防鎖定** | 視窗 1 與 視窗 2 皆以預設「學員」登入，視窗 1 雙擊卡片 A 編輯 | 視窗 2 點擊卡片 A 時跳出「正在編輯中，已被鎖定」，無法覆蓋 |
| **TC-02: 拖曳與新增並發** | 視窗 1 按住卡片 A 持續拖曳；視窗 2 新增卡片 B 並儲存；視窗 1 放開卡片 A | 視窗 1 成功保留卡片 A 新座標，且卡片 B 正常出現在畫布上，不丟失 |
| **TC-03: 同時編輯不同卡片** | 視窗 1 修改卡片 A 文字；視窗 2 同時修改卡片 B 文字；兩者先後儲存 | 卡片 A 與 卡片 B 的文字均正確更新，無任何文字退回 |
| **TC-04: 多選換色防斷橋** | 選取多張便利貼，滑鼠自「變更色彩」向上移入調色盤 | 選單不消失，可順利選取顏色並批次換色 |
| **TC-05: 單人 Undo 不影響他人** | 視窗 1 移動卡片 A；視窗 2 新增卡片 C；視窗 1 按下 Ctrl+Z | 僅卡片 A 移回原位，卡片 C 依然完好存在 |

---
*文件建立日期：2026-09-09*  
*適用專案：workshop / ai-align*
