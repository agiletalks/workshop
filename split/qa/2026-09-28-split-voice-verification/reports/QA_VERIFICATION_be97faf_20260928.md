# SPLIT 模組 6 語音筆記：獨立 QA 報告

- 日期：2026-09-28，約 12:46–12:51（Asia/Taipei）。
- 結論：**不通過；已重現文字重複、連續句覆寫、換頁/唯讀時沿用舊回呼等問題。**
- Git 基準：be97fafd8a5564b8ee13b4ce6a7077d4358a7001；實際測試未提交工作目錄，不能將結果等同該 commit 成品。
- 瀏覽器：Windows / Codex in-app Chromium；`http://localhost:5173/?c=qa-split-test-01`，第 1 組、QA-Board-Alice；P03/P04。
- 隔離測試：Node 執行實際 TypeScript service、hook，以及從 WorkbookPanel 擷取的實際追加函式。SpeechRecognition 及 Hook lifecycle 使用最小替身；不是實體麥克風、完整 React DOM 或雲端整合測試。
- 語音 service SHA256：`51b29de8ba3e140609d17677e8d87130971d7f5af1547fc6f5bbfb92149665f2`。
- hook SHA256：`2d9c5e861cfb72983d8d24dc080b12e17dafdc62ad95cf002efd7206876b685e`。
- WorkbookPanel SHA256：`8816523cfa82cc1c895c0107502cf759e9e64b567d833de9d668e4b48b521945`。
- 僅使用 QA 班；未修改產品程式、未部署、未推送、未恢復 listening。

## 驗收總表

主驗收項目：**1 PASS、3 FAIL、2 PARTIAL、1 BLOCKED**。獨立回歸腳本：**5 PASS、4 FAIL**（兩種統計範圍不同，勿相加）。

| 項目 | 判定 | 依據與限制 |
|---|---|---|
| QA-V01 按鈕及初始唯讀 | PASS | P03 出現語音筆記按鈕，本組可按；切第 2 組觀摩後語音鈕與文字框 disabled。 |
| QA-V02 啟動/手動完成 | PARTIAL | 瀏覽器按下後顯示「正在聆聽...」、粉紅串流區與「完成」；按完成後回復語音筆記鈕。未觀察到麥克風授權彈窗，無有效逐字稿，不能證實已成功取得實體音源。 |
| QA-V03 已定稿句停止後只追加一次 | FAIL | 實際 hook/service 隔離測試：定稿一次再停止，同句觸發兩次 append。BUG-VOICE-01。 |
| QA-V04 連續兩句不遺失 | FAIL | 擷取的 panel 追加函式與 hook 測試：第二次 final 使用開始錄音時的舊 memo，覆寫第一句。BUG-VOICE-02。 |
| QA-V05 換頁及權限生命週期 | FAIL | 瀏覽器錄音狀態從 P03 延續到 P04，再轉第 2 組觀摩仍顯示聆聽；隔離測試確認舊 callback 仍被呼叫、stop 將舊頁全文交給新頁 callback。BUG-VOICE-03。 |
| QA-V06 靜音後自動重啟/卸載 | PARTIAL | 假事件與假計時器驗證 onend、no-speech/audio-capture/network 重啟，stop 取消、unmount 呼叫停止，5 個相關基礎案例通過；沒有實際 10 秒以上靜音、恢復講話後成功辨識的完整證據。 |
| QA-V07 真實朗讀→雲端→另一位學員 | BLOCKED / 待補 | 本輪沒有已知真人測試句及成功 final transcript；未驗辨識準確度、實體音源、A/B 語音文字同步。不以模擬辨識事件代替真實收音驗收。 |

5000 打包站的語音 UI 尚未另跑完整流程。本輪沒有執行語音文字的 Firestore 越權寫入測試。

## BUG-VOICE-01 — P1：按停止會重複追加已定稿文字

**證據層級：實際 service + hook 的隔離行為重現；尚非真人收音重現。**

1. startRecording。
2. SpeechRecognition 發出一筆 final：「敏捷需求分解」。
3. Hook onFinal 已呼叫 onAppendText。
4. UI 重新渲染後呼叫 stopRecording。

預期 append 呼叫：`["敏捷需求分解"]`。
實際 append 呼叫：`["敏捷需求分解", "敏捷需求分解"]`。

根因：useVoiceNote.handleStart 的 onFinal 即時追加；VoiceNoteRecorder.stop 又回傳累積 _finalText；handleStop 再把全文追加一次。不是要使用者說「念完了」才能停止；**正常手動按完成也會走到這個路徑**。

建議：明確區分已提交 final 與未提交 interim；每個辨識 chunk 只能提交一次，並處理 stop 後延遲到達的 final 事件。複測需包含至少兩個 final、interim→停止、停止後 final、立即重新錄音。

## BUG-VOICE-02 — P1：長時間錄音沿用舊 memo，第二句覆寫第一句

**證據層級：實際 panel 函式與 hook 的隔離重現。**

- 初始 memo：「原筆記」。
- 第一次 final：「第一句」→ 更新為 `原筆記\n第一句`。
- 模擬筆記同步並重新渲染，第二次 final：「第二句」。
- 實際更新為 `原筆記\n第二句`；第一句消失。

useVoiceNote.handleStart 建立的 onFinal 閉包固定捕捉該次 onAppendText；後续 render 雖產生新的 handleAppendVoiceText，辨識器中的回呼未更新。WorkbookPanel 使用 closure 中的 teamNote.memo / response.personalNote 計算完整新字串，所以會以舊基底覆寫。

建議以最新內容的函數式追加或明確同步的 ref 實作，避免每次結果使用錄音開始時的 memo；也應保留录音途中使用者打字與同組遠端更新。

## BUG-VOICE-03 — P1：換頁及轉為唯讀後，錄音工作階段未綁定原上下文

**瀏覽器已觀察到錄音狀態延續；文字錯頁/權限回呼以隔離測試重現，未宣稱實際雲端越權寫入。**

瀏覽器步驟：P03 開始語音 → 點 P04 →「正在聆聽...」與完成按鈕仍在 → 切第 2 組觀摩 → 上方聆聽鈕 disabled，但串流狀態與完成按鈕仍在。最後已按完成停止。

隔離結果：在 page3 收到「第三頁講述」，render 換為 page4 callback 後按 stop，產生：

```json
[{"page":3,"text":"第三頁講述"},{"page":4,"text":"第三頁講述"}]
```

換成 readonly callback 後，辨識器仍呼叫開始錄音時的 editable callback。舊 callback 也可能攜帶舊班級、組別、世代與可編輯狀態。App 的 handleUpdateMemo 使用閉包內身分/班級狀態，不能僅依目前按鈕 disabled 判定安全。

另，語音啟動直接呼叫 toggleRecording，未先 await onAcquireLock；筆記 textarea 的 onFocus 才有取得鎖的流程。此為源碼風險，尚未做兩位使用者同時語音寫入的實測。

建議：每段錄音明確鎖定 class/generation/team/slide；換上下文、停用、觀摩或失去鎖時先結束/取消，再切換。追加時重新檢查當前授權与鎖；先取得鎖才允許開始，處理競爭失敗。若產品決定允許背景錄音，必須明確保證內容只寫回原頁，不能把 stop 全文寫到新頁。

## 建置與並行開發限制

本輪實際執行：

`node split/node_modules/typescript/bin/tsc --noEmit --incremental false -p split/tsconfig.app.json`

Exit Code **2**。當時工作目錄已出現提問模組新增碼，錯誤包含 QuestionsDrawer.tsx 匯入不存在的 UserSession、找不到 ../types，以及 App.tsx 未使用的提問變數。Vite Console 同時有 App.tsx HMR reload failure。

這些是**驗收時工作目錄不穩定的建置阻礙**，不直接歸因於語音三個檔案。DEV 先前 build PASS 與目前狀態不同；本輪沒有重新 build-all 或把正在變動的版本視為固定發行包。語音行為測試所用三個檔案 hash 已記錄，可獨立重現。

## 其他待驗宣告

- 不支援瀏覽器的禁用提示、拒絕麥克風授權、持續失敗的重試上限、背景分頁與長課程資源釋放，尚未完整驗證。
- hook 回傳 errorMessage，但 WorkbookPanel 沒有呈現該錯誤，可能只見按鈕停止而不知道原因；列為程式碼審查待驗。
- 「免應用程式 API key」不等於已完成隱私稽核。本輪未稽核辨識供應商、流量、資料留存，因此不能認可「零成本、無外洩風險」等絕對宣告。

## 證據與複測

- `../evidence/voice-behavior-results.json`：9 項行為測試，5 PASS / 4 FAIL。
- `../scripts/test-voice-independent.cjs`：獨立可重跑腳本，不操作瀏覽器、不錄音、不寫 Firestore。執行時可傳輸出 JSON 路徑；預設 repository root 為 C:/Antigravity/workshop，可用 WORKSHOP_ROOT 調整。
- `../evidence/recording-after-page-change.txt`、`recording-after-readonly.txt`：真實瀏覽器狀態。
- `../evidence/observer-dom.txt`、`recording-dom.txt`、`stopped-dom.txt`、`recording.png`：按鈕、串流區、手動停止證據。
- `../evidence/typecheck.log`、`browser-console.json`：建置與 HMR 限制。

建議先修正三項資料與生命週期缺陷，再用真人朗讀至少两句、靜音 10 秒、續講、手動按完成，確認每句僅出現一次；再開第二位同組學員核對雲端結果。模組 5 如持續開發，請交付可固定的 commit 或隔離工作目錄，避免驗收與 HMR 同時變動。
