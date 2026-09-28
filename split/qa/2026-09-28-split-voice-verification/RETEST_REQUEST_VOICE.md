# 【QA 複測任務委託書】SPLIT 模組 6：語音筆記缺陷修復複測 (Retest)

> **交付時間**：2026-09-28  
> **交付對象**：AgileTalks 中央 QA 驗收工程師  
> **關聯初測報告**：`split/qa/2026-09-28-split-voice-verification/reports/QA_VERIFICATION_be97faf_20260928.md`  
> **DEV 修復報告**：`split/qa/2026-09-28-split-voice-verification/dev-responses/DEV_RESPONSE_VOICE_20260928.md`  
> **預期複測報告**：`split/qa/2026-09-28-split-voice-verification/retests/QA_RETEST_VOICE_20260928.md`  

---

## 一、複測背景與初測缺陷

QA 在初次驗收中（判定為 FAIL），指出了 3 項關鍵 P1 級缺陷：
1. **BUG-VOICE-01 (QA-V03 FAIL)**：按停止/完成會重複追加已定稿文字（產生雙倍內容）。
2. **BUG-VOICE-02 (QA-V04 FAIL)**：長時間錄音沿用舊 memo 閉包，第二句定稿時覆寫第一句（導致前文遺失）。
3. **BUG-VOICE-03 (QA-V05, QA-V06 FAIL)**：換頁與切為唯讀時，錄音階段未綁定原頁面上下文，產生跨頁寫入與舊 callback 持續執行。

---

## 二、DEV 端修復摘要與自測狀態

DEV 團隊已完成原始碼重構並通過自我驗證：
- **修改檔案**：
  - [`split/src/services/voiceRecorder.ts`](file:///c:/Antigravity/workshop/split/src/services/voiceRecorder.ts)：增加 `setCallbacks()` 支援動態注入最新回呼，`stop()` 徹底重設累積文字。
  - [`split/src/hooks/useVoiceNote.ts`](file:///c:/Antigravity/workshop/split/src/hooks/useVoiceNote.ts)：移除停止時二次追加全文邏輯；於 render/effect 時即時動態同步 callback，徹底解決閉包陳舊與唯讀洩漏。
  - [`split/src/components/WorkbookPanel.tsx`](file:///c:/Antigravity/workshop/split/src/components/WorkbookPanel.tsx)：加入換頁與唯讀生命週期監控（自動停止）；啟動錄音前先爭取編輯鎖（`onAcquireLock`）；新增 `voiceErrorMessage` 錯誤提示。
- **獨立回歸腳本驗收結果**：
  執行 QA 原廠提供之腳本：
  ```bash
  node split/qa/2026-09-28-split-voice-verification/scripts/test-voice-independent.cjs
  ```
  **執行結果：9 PASS / 0 FAIL（全數通過，Exit Code 0）**。

---

## 三、QA 複測重點清單

請 QA 驗收工程師針對以下項目執行獨立複測：

1. **執行獨立回歸腳本**：
   - 重新執行 `test-voice-independent.cjs`，確認 9 項行為案例均為 PASS。
2. **手動按「完成」單次追加驗證 (BUG-VOICE-01)**：
   - 瀏覽器中啟動錄音，說一句文字（或模擬 final 產生）。
   - 點擊「完成」停止。
   - 驗證文字框內該句是否**僅出現一次**，絕無重複出現兩次之現象。
3. **連續兩句保留驗證 (BUG-VOICE-02)**：
   - 連續說出「第一句」與「第二句」。
   - 驗證文字框內容為「第一句\n第二句」，第一句絕不被第二句覆寫。
4. **換頁與觀摩唯讀生命週期 (BUG-VOICE-03)**：
   - 於 P03 開始錄音，手動切換至 P04。
   - 驗證：P03 的錄音是否立即終止，P04 筆記區絕不會被注入 P03 的錄音內容。
   - 切換至第 2 組（觀摩模式），驗證錄音按鈕 disabled，串流狀態不再接收語音。
5. **啟動錄音取鎖防護**：
   - 驗證在未持有鎖的情況下啟動語音，系統會正確檢查並取得編輯鎖。

---

## 四、預期交付物

請 QA 完成複測後，於以下路徑產出複測報告：
- `split/qa/2026-09-28-split-voice-verification/retests/QA_RETEST_VOICE_20260928.md`
- 註明各 Bug 之最終判定（CLOSED / REOPENED）。
