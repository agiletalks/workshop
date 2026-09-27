# AI-ARM 課堂體驗三項優化：獨立複測結果

- 測試日期：2026-09-22（Asia/Taipei）
- 依據：C:\Antigravity\workshop\ai-arm\QA_TEST_CASES_20260922.md
- 實測 HEAD：479d6a7
- 服務：http://localhost:5000/workshop/ai-arm/ ，HTTP 200；回傳 HTML 與 ai-arm/index.html 內容完全一致。
- 瀏覽器：Codex 內建 Chromium（版本未由工具取得）、Microsoft Edge 153.0.4234.48（本機執行檔版本）。兩者為不同瀏覽器儲存環境；未清除既有 localStorage，未建立全新無痕 profile。
- 測試 viewport：390×844、1280×900；為 CSS viewport 模擬，不是真實手機或虛擬鍵盤測試。完成後已解除 viewport override。

## 最終裁定：需修正，不能全數結案

14 個案例：10 PASS、1 FAIL、3 PARTIAL。門禁一般失敗鎖定、到期解鎖與跨瀏覽器跨頁／跨組表情主要流程通過。明確發現桌機劇院模式失效：筆記區的 md:flex 覆蓋 hidden，導致劇院模式仍顯示左右雙欄。真實 Touch 捲動、下載落地及實機時鐘偏差未完整驗證，不能列為 PASS。

## 案例結果

| 編號 | 裁定 | 實測與依據 |
|---|---|---|
| TC-SEC-01 | PASS | 門禁標籤無公司／年份範例，placeholder 為「請輸入講師公布之專屬代碼」。填姓名但留空代碼提交，DOM 顯示「請輸入講師公布之專屬班級代碼」。 |
| TC-SEC-02 | PASS | fake-code-999 失敗提示依序觀察到剩餘 4、3、2、1 次；第 5 次出現 03:00，代碼、姓名及送出按鈕皆 disabled。 |
| TC-SEC-03 | PASS | 倒數由 03:00→02:47→01:35→00:57→00:09，錯誤提示與按鈕皆呈倒數。未逐幀錄製每一秒，但已驗證持續更新及時間遞減。 |
| TC-SEC-04 | PASS | 02:47 時 reload，重新載入仍為 02:47 且三項控制 disabled，未回到 03:00。驗證 F5 等價 reload 分支，未另外測關閉重開。 |
| TC-SEC-05 | PASS | 未調整時間或 localStorage，自然等待約 180 秒後自動解鎖；錯誤隱藏、送出文字復原、代碼與姓名可用，代碼框 active。 |
| TC-SEC-06 | PASS | Edge 先失敗一次（剩 4 次），再以有效班完成 P01 報到；重開固定入口再次失敗，仍剩 4 次而非 3，證明計數重置。另以原始碼隔離測試確認 clearGatekeeperFailures 移除兩個 key；未直接讀取瀏覽器 localStorage。 |
| TC-MOB-01 | PASS | 390×844 顯示兩頁籤；筆記頁籤選中為金底黑字，投影片收合且筆記展開；切回投影片後筆記收合。截圖確認。 |
| TC-MOB-02 | PARTIAL | 先輸入 20 行，再擴充 45 行。指標位於 textarea 上捲動，可見第 21～45 行及底部附件區，無捲動死鎖。工具執行的是瀏覽器 scroll，未模擬真實 Touch／軟鍵盤，不能替代完整手機手勢驗收。 |
| TC-MOB-03 | PARTIAL | 手機尺寸附件按鈕可觸發 filechooser；成功上傳 PNG，卡片正常出現，預覽顯示測試圖片完整內容。未測下載落地檔案與手機系統選檔器／工具列遮擋。 |
| TC-MOB-04 | FAIL | 1280×900 手機頁籤隱藏，雙欄寬度約 639.6／640.4 px 正常。但切到劇院模式後筆記仍 display:flex，畫面仍雙欄，見 BUG-0922-01。 |
| TC-REA-01 | PASS | A 從無參數固定入口報到後成功傳送至 B；唯讀 REST 查得 aigile_boards/ai_arm_qa-retest-0920-b_reaction_latest，內含本次 heart／slideIndex=1／reactionId。原始碼隔離測試另確認頻道 key。未擷取瀏覽器底層監聽封包。 |
| TC-REA-02 | PASS | A：內建瀏覽器、第 1 組、P01；B：Edge、第 2 組、P05。A 愛心本地 DOM 有 1 粒；再次發送愛心，B 約 613 ms 內出現同款粒子。第一次在 590 ms 讀取時 B 尚無粒子，未將其誤判為不會同步。 |
| TC-REA-03 | PASS | 同上跨組與不同姓名，大拇指發送後 B 約 694 ms 內出現 1 個 👍。兩端不同瀏覽器，非只驗證 BroadcastChannel 同瀏覽器捷徑。 |
| TC-REA-04 | PARTIAL | 實際雲端文件存在 reactionId；B 觀測每次僅 1 粒。隔離執行原始 onSnapshot 回呼：相同 ID 重送不重播，後續事件 timestamp 正負 10 秒皆播放，測試通過。未調整真實裝置時鐘、未做大量唯一性／斷線重連測試。 |

表情延遲是工具端自 click 前起算至 B DOM 觀察完成，包含工具往返，僅代表本次小樣本，非正式網路延遲 SLA。

## BUG-0922-01：桌機劇院模式仍顯示筆記（P2）

重現：

1. 開啟 qa-retest-0920-b，以既有第 8 組身分進入。
2. viewport 390×844，切筆記再切回投影片。
3. 改為 1280×900，確認雙欄顯示。
4. 點 #btn-toggle-layout 切「劇院模式」。
5. 按鈕 title 已變成「切換為左圖右筆記雙欄模式」，但右側筆記仍顯示，投影片未滿版。

實際 DOM：

```text
button.title = 切換為左圖右筆記雙欄模式
notes-aside.className = w-full md:w-1/2 flex-1 h-full md:h-full bg-white md:flex flex-col overflow-hidden min-h-0 border-t md:border-t-0 md:border-l border-slate-200 hidden
getComputedStyle(notes-aside).display = flex
slide-section.width ≈ 639.6
notes-aside.width ≈ 640.4
```

原始碼：ai-arm/index.html 的 applyLayoutMode（約 2559 行）在 theater 分支只新增 hidden、移除 flex，未移除 aside 的 md:flex；桌機 breakpoint 下 md:flex 仍生效。

建議：統一桌機顯示類別控制，避免 hidden 與 md:flex 同時存在；修正後補測桌機直接開頁、手機放大至桌機、劇院／雙欄反覆切換。

## 自動化輔助證據

隔離測試腳本：C:\VIBE\ai-arm\qa-0922-unit.cjs。它讀取實際 index.html 函式，在 Node VM 內以 mock Firestore／storage 驗證，不操控真實瀏覽器或修改產品。

```text
PASS isolated source callback: class key, duplicate ID suppression, subsequent events +/-10 sec clock skew
PASS isolated source helper: both lock storage keys removed
```

本次 Firestore 唯讀結果：

```text
document: aigile_boards/ai_arm_qa-retest-0920-b_reaction_latest
type: heart
emoji: ❤️
slideIndex: 1
reactionId: 1790089098654_zzuz6a
```

## 測試留下的資料與限制

- qa-retest-0920-b 第 8 組 P01 原先筆記空白，新增 QA0922 手機滾動測試 45 行與白板照片_第1組.png（9.3 KB），保留供工程師重現；未刪除既有資料。
- 新增測試在線身分 QA0922-A（第 1 組）、QA0922-B（第 2 組）。Edge 最後一次錯誤驗證留下 1 次失敗計數；沒有鎖定。
- 未測真實 iOS／Android、虛擬鍵盤、下載落地完整性、Safari、重連／離線及高併發。
- 本報告 PASS 僅限上述操作與證據；前端 localStorage 鎖定不代表伺服器端安全防護已驗證。
- 未修改產品原始碼，未重建、未 git pull／push、未部署。

## 工程師下一步

1. 修正 BUG-0922-01，回測桌機劇院模式。
2. 使用實際手機補完 TC-MOB-02／03 的 Touch、鍵盤及下載。
3. 如需完整時鐘容錯驗收，補做實機偏差與重連情境；目前只有回呼隔離測試證據。
