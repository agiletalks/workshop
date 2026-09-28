# DEV 缺陷修復與回應報告：模組 6 語音筆記

- **日期**：2026-09-28
- **回應對象**：QA 驗收團隊
- **對應 QA 報告**：`split/qa/2026-09-28-split-voice-verification/reports/QA_VERIFICATION_be97faf_20260928.md`
- **修復狀態**：已全數修復（獨立回歸測試 9 PASS / 0 FAIL）

---

### 一、缺陷修復對照表

| 缺陷編號 | 優先級 | 缺陷摘要 | 修復檔案 | 修復原理與說明 |
|---|---|---|---|---|
| **BUG-VOICE-01** | P1 | 按停止會重複追加已定稿文字 (QA-V03) | `src/hooks/useVoiceNote.ts` | 移除 `handleStop` 中重複呼叫 `onAppendText(finalResult)` 的邏輯。錄音期間定稿之 chunk 均已透過 `onFinal` 即時追加，`stop()` 僅負責釋放資源並終止辨識，不再重複注入全文。 |
| **BUG-VOICE-02** | P1 | 連續兩句覆寫第一句 (QA-V04) | `src/services/voiceRecorder.ts`<br>`src/hooks/useVoiceNote.ts` | 1. `VoiceNoteRecorder` 新增 `setCallbacks()` API，支援在運作中動態替換回呼函式。<br>2. `useVoiceNote` 在每次 render 與 effect 階段即時同步最新 callback 至 recorder，消除陳舊閉包。<br>3. 第二次 final 抵達時正確獲取最新元件狀態與已更新 memo，兩句均完整保留。 |
| **BUG-VOICE-03** | P1 | 換頁及轉唯讀時狀態洩漏與跨頁寫入 (QA-V05, QA-V06) | `src/components/WorkbookPanel.tsx`<br>`src/hooks/useVoiceNote.ts` | 1. `WorkbookPanel` 加入 `useEffect` 監聽 `[slide.id, isInputDisabled]`，當換頁或切為唯讀時立即自動結束錄音。<br>2. 切為唯讀（如觀摩）時，動態同步之唯讀 callback 立即生效，舊 editable callback 絕對不會再被觸發。<br>3. 啟動語音前（`handleToggleVoice`）新增自動取鎖檢查，若無法取得鎖則阻擋啟動並提示。 |

---

### 二、附加健全性改善
- **錯誤訊息提示**：`WorkbookPanel` 介面增加 `voiceErrorMessage` 告警呈現，當遭遇麥克風未授權、不支援或網路錯誤時，直接呈現友善提示字樣。
- **停止時徹底重置緩衝**：`voiceRecorder.stop()` 確保 `_finalText = ''` 與 `_interimText = ''` 徹底清空，防止下一次錄音殘留。

---

### 三、獨立回歸腳本驗收結果

執行指令：
```bash
node split/qa/2026-09-28-split-voice-verification/scripts/test-voice-independent.cjs
```

**測試結果**：
```json
{
  "at": "2026-09-28T04:57:46.384Z",
  "results": [
    { "id": "V01 recognition config", "result": "PASS" },
    { "id": "V02 interim and finalized chunk", "result": "PASS" },
    { "id": "V03 stop must not append already-finalized text again", "result": "PASS" },
    { "id": "V04 successive finals preserve both chunks", "result": "PASS" },
    { "id": "V05 page switch must not append prior-page aggregate into new page on stop", "result": "PASS" },
    { "id": "V06 active recording must respect new readonly callback", "result": "PASS" },
    { "id": "V07 onend restart and explicit stop cancel restart", "result": "PASS" },
    { "id": "V08 unmount stops recorder", "result": "PASS" },
    { "id": "V09 retriable no-speech/audio-capture/network create new recognizer", "result": "PASS" }
  ]
}
```
**統計**：**9 PASS / 0 FAIL**（Exit Code: 0）。

---

### 四、建置驗證
- `npm run build`（in `split/`）：Exit Code 0，產物更新至 `dist/workshop/split/`。
- `node scripts/build-all.js`（in `workshop/`）：全套件打包通過。
- 請 QA 團隊協助進行複測（Retest）。
