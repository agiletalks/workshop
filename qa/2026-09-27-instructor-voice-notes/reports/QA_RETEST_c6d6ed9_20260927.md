# BUG-0927-07 修復複驗

- 日期：2026-09-27；修復c6d6ed9；HEAD 33e2c0f（報告提交）。
- 分支：feature/instructor-voice-notes。
- 已閱讀DEV_FIX_REPORT_4294a45_20260927.md並檢查實際測試腳本。
- 原始index.html、dist/workshop/ai-arm/index.html、localhost HTTP內容SHA256一致：`93F3EED8BD82C9556FB2E615EF9762ADB8B94BF2EAD552AE893A6C030127D001`。

## 結果：BUG-0927-07 PASS（已知反例與隔離降級邏輯範圍）

在C:\Antigravity\workshop執行 `node ai-arm/qa_fallback_4294a45.cjs`，Exit 0。此腳本原樣抽取產品fallback區塊，以parsedData=null及已知逐字稿於Node vm執行，沒有改動產品程式或雲端資料。

| 案例 | 便籤內容源於輸入 | 舊模板句仍存在 | 文章正文比對 | 結果 |
|---|---|---|---|---|
| single：今天只驗證付款逾時 | true | false | 相符 | PASS |
| multi：付款逾時／重送代碼／寄送收據三句 | true | false | 相符 | PASS |
| short_fragments：甲。乙。丙。 | true | false | 相符 | PASS |

另以獨立檢查去除文章Markdown標題行、空白與分句標點後，比對正文與原輸入：三組全部相符。這比原腳本僅搜尋舊模板字串更嚴格，確認這三組案例沒有以其他新增正文取代舊句。

- 單句文章不再生成沒有內容的「實務敏捷落地與案例」段落。
- 短詞甲、乙、丙皆保留，未因原本兩字長度門檻被排除。
- 證據檔：QA_c6d6ed9_fallback-evidence.json。

## 判定邊界

- 已知BUG-0927-07可就上述回歸案例結案；不採用「所有輸入100%忠實」的無界限宣告。固定章節/便籤標題仍為系統產生，本次比對的是講述正文及points。
- 本輪未重跑瀏覽器UI，未使用真實麥克風、API失敗/超時、補充融合或長文截斷情境。原PARTIAL與端到端待驗項目保持，不將隔離測試等同整體驗收。
- 未修改產品、未build、未git pull/push、未部署、未恢復監聽。
