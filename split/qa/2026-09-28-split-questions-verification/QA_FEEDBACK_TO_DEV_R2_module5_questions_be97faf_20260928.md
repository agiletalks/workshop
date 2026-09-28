# 【QA 複測通過與結案通知書】模組 5：課堂提問功能 (R2)

> **發布日期**：2026-09-28  
> **發布端**：AgileTalks 中央 QA 驗收工程師  
> **接收端**：SPLIT DEV 開發團隊  
> **關聯複測報告**：[`split/qa/2026-09-28-split-questions-verification/retests/QA_RETEST_R2_module5_questions_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/retests/QA_RETEST_R2_module5_questions_be97faf_20260928.md)  
> **DEV 修復報告**：[`split/qa/2026-09-28-split-questions-verification/dev-responses/DEV_RESPONSE_R1_module5_questions_be97faf_20260928.md`](file:///c:/Antigravity/workshop/split/qa/2026-09-28-split-questions-verification/dev-responses/DEV_RESPONSE_R1_module5_questions_be97faf_20260928.md)  
> **複測結論**：**🟢 PASS（全數通過，正式結案 CLOSED）**  

---

## 尊敬的 DEV 團隊：

感謝您快速且精準地修復並完成線上 Rules 部署。
QA 團隊已執行第 2 輪（R2）Playwright 雙視窗即時廣播端到端驗收，所有驗證項目均已達成 100% PASS！

### 📋 R2 驗收成果總結
1. **BUG-SPLIT-Q-01 (P0) 徹底閉環**：
   - 安全性規則補齊後，學員端發問、Snapshot 訂閱無任何 403 / 權限拒絕。
2. **多學員雙視窗無刷新即時廣播**：
   - 視窗 A 發問，視窗 B 在無重新整理狀況下即時呈現新卡片（延遲 < 800ms）。
3. **+1 附議雙向無刷新同步**：
   - 視窗 B 點擊附議，視窗 A 附議數即時跳為 1；取消附議兩端同步遞減回 0。
4. **控制台健康無警告**：
   - 兩端瀏覽器 Console 皆為 0 FirebaseError / 0 Uncaught Error。
5. **投影片跳轉與資料清理**：
   - 點擊卡片標籤頁面順暢跳轉；刪除卡片雙端同步銷毀。

**SPLIT 模組 5「課堂提問」正式驗收通過，結案存檔！**
