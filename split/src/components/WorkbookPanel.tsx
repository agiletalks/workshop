import { useState, useEffect } from "react";
import type { Slide, SlideResponse } from "../data/slides";

interface WorkbookPanelProps {
  slide: Slide;
  getResponse: (slideId: string) => SlideResponse;
  updateNote: (slideId: string, note: string) => void;
  updateInteractionData: (slideId: string, data: any) => void;
  toggleCompleted: (slideId: string) => void;
  onImageClick?: (imageUrl: string) => void;
}

const slide3Prompt = `你是一位熟悉 Scrum、Agile 與產品開發的專業講師。請協助我研究並理解 Definition of Done（DoD）與 Definition of Ready（DoR），最後將研究結果製作成一份可以直接在瀏覽器開啟閱讀的完整 HTML 網頁。

【一、學習目標】

完成這項任務後，我應該能夠：

1. 用自己的話解釋 DoD 與 DoR。
2. 說明 DoD 與 DoR 分別要解決什麼問題。
3. 判斷一項條件屬於 DoD 或 DoR。
4. 說明 DoD 與 DoR 在 Scrum 中的正式定位。
5. 發現不恰當或過度僵化的 DoD、DoR。
6. 為一個團隊提出初步的 DoD 與 DoR 範例。

本次研究只聚焦於 DoD 與 DoR。

請不要介紹或延伸討論以下內容：

* User Story
* Acceptance Criteria
* Story Point
* INVEST
* 需求拆分方法

【二、資料查證要求】

請優先查閱以下來源：

1. 最新版官方 Scrum Guide。
2. Scrum.org 或 Scrum Alliance 的資料。
3. Scrum 共同創始人 Ken Schwaber、Jeff Sutherland 的相關資料。
4. Roman Pichler、Mike Cohn 等具代表性的敏捷專家文章。

請遵守以下查證原則：

1. 清楚區分「Scrum Guide 的正式規定」與「敏捷社群常見實務」。
2. 不要把 DoR 誤寫成 Scrum 的正式必要元素。
3. 如果資料來源對 DoR 有不同觀點，請呈現主要差異。
4. 不確定的歷史資訊，不要推測或虛構。
5. 重要定義後面請標示資料來源。
6. 網頁最後列出完整參考資料，包括資料名稱、作者或組織、網址及查閱日期。

【三、內容結構】

請依照以下結構撰寫網頁內容。

第一部分：快速理解

請先用白話、簡短的方式回答：

* DoR 是什麼？
* DoD 是什麼？
* 兩者最主要的差異是什麼？

請用醒目的方式呈現以下兩個核心問題：

* DoR 回答：「這項工作是否已具備開始的條件？」
* DoD 回答：「這項成果是否已達到完成的標準？」

另外，請製作一個簡單的流程示意：

準備工作 → 符合 DoR → 開始執行 → 完成工作 → 符合 DoD

請註明：這個流程用於協助理解概念，不代表 Scrum Guide 規定所有工作都必須通過正式的 DoR 關卡。

第二部分：Definition of Ready

請說明：

1. DoR 的完整英文名稱。
2. DoR 常見的繁體中文翻譯。
3. DoR 的白話定義。
4. DoR 主要要解決的問題。
5. DoR 通常在什麼時候使用。
6. DoR 通常由誰共同討論與制定。
7. DoR 是否屬於 Scrum Guide 的正式元素。
8. DoR 與工作透明度、可行性及共同理解的關係。
9. 使用 DoR 可能帶來的好處。
10. 使用 DoR 可能帶來的風險。

請清楚說明：

* DoR 是部分敏捷團隊採用的輔支實務。
* DoR 並非 Scrum Guide 規定的正式承諾或必要元素。
* DoR 應協助團隊展開對話，不宜成為僵化的審核關卡。
* 工作不需要消除所有不確定性才可以開始。

第三部分：Definition of Done

請說明：

1. DoD 的完整英文名稱。
2. DoD 常見的繁體中文翻譯。
3. DoD 的正式定義與白話解釋。
4. DoD 主要要解決的問題。
5. DoD 在 Scrum 中的正式定位。
6. DoD 與 Increment 的關係。
7. DoD 通常由誰建立與遵守。
8. 如果組織已經有品質標準，Scrum Team 應如何處理。
9. 未符合 DoD 的工作應如何處理。
10. DoD 如何提升透明度與產品品質。

請清楚說明：

* DoD 是 Scrum 的正式概念。
* DoD 描述 Increment 達到產品品質要求時的狀態。
* 工作符合 DoD，才可以被視為 Increment 的一部分。
* DoD 通常是跨工作項目共同適用的品質標準。
* DoD 應隨著團隊能力與產品需求持續改善。

第四部分：DoR 與 DoD 比較表

請製作一張比較表，至少包含以下欄位：

* 比較面向
* DoR
* DoD

至少比較以下面向：

1. 核心問題
2. 主要目的
3. 使用時機
4. 檢查的對象
5. 制定與討論者
6. Scrum 中的正式定位
7. 是否為 Scrum 的必要元素
8. 與品質的關係
9. 未符合條件時的處理方式
10. 可能的使用風險

第五部分：軟體產品開發範例

請使用以下情境：

「團隊準備開發網站的忘記密碼功能。」

請不要撰寫 User Story，也不要使用 Acceptance Criteria。

請分別提供：

A. 可能的 DoR

至少列出六項工作開始前的條件，例如：

* 團隊了解要解決的使用者問題。
* 工作範圍已經過團隊討論。
* 主要技術相依性已經識別。
* 必要的設計或介面資訊已可取得。
* 團隊認為工作規模適合在一個 Sprint 內處理。
* 團隊知道可以如何驗證成果。

B. 可能的 DoD

至少列出八項完成與品質標準，例如：

* 程式碼已完成同儕審查。
* 自動化測試已通過。
* 必要的整合測試已完成。
* 已完成適當的安全性檢查。
* 沒有未處理的重大缺陷。
* 成果已整合至團隊指定的環境。
* 相關技術文件已更新。
* 成果符合團隊共同同意的品質標準。

每一項條件都必須包含：

* 條件內容
* 為什麼需要這項條件
* 如果缺少這項條件，可能產生什麼風險

第六部分：非軟體工作範例

請使用以下情境：

「團隊準備設計並發布一門兩小時的線上課程。」

請分別提供：

1. 至少六項可能的 DoR。
2. 至少八項可能的 DoD。
3. 每一項條件的用途。
4. DoR 與 DoD 在這個案例中的差異。

請註明：

這是將敏捷工作方式應用於非軟體情境的示例，不代表所有條件都是 Scrum Guide 的正式規定。

第七部分：條件分類練習

請設計十二項條件，讓讀者判斷它們屬於：

* DoR
* DoD
* 兩者都不適合

請先呈現題目，接著在另一個答案區公布：

* 正確分類
* 判斷理由
* 如果原條件寫得不清楚，提供改善後的版本

題目必須包含容易混淆的情況，不能只使用明顯的例子。

第八部分：品質檢視練習

請分別提供一份「有問題的 DoR」與「有問題的 DoD」。

每份至少包含五項條件，並刻意加入以下問題：

* 條件過於模糊
* 無法客觀判斷
* 指定不必要的文件
* 把個人核准當成必要關卡
* 要求消除所有不確定性
* 只描述完成活動，沒有描述成果或品質

接著逐項分析：

1. 問題在哪裡。
2. 可能造成什麼影響。
3. 應該如何改寫。

第九部分：常見誤解

請至少分析以下錯誤觀念：

1. DoR 是 Scrum 的強制規定。
2. 所有不確定性都消除後，工作才算 Ready。
3. DoR 的條件愈多，工作準備得愈完整。
4. 功能可以操作，就代表符合 DoD。
5. DoD 核心問題應為「是否達到完成標準」。
6. DoD 由 Product Owner 或 Scrum Master 單方面決定。
7. 每項工作都應該使用完全不同的 DoD。
8. DoD 建立後就不應再調整。

每一項請提供：

* 錯誤觀念
* 為什麼不正確
* 建議的正確理解

第十部分：學習檢核

請設計八題選擇題，每題包含：

* 題目
* 四個選項
* 正確答案
* 答案解析

題目應該檢查讀者是否能：

* 分辨 DoR 與 DoD。
* 理解兩者的 Scrum 正式定位。
* 判斷條件是否適當。
* 發現僵化或形式化的錯誤用法。
* 將概念應用到實際情境。

請避免只考英文全名或名詞記憶。

第十一部分：個人反思

請在網頁最後提供三個反思問題：

1. 我原本如何理解「準備好」與「完成」？
2. 我現在工作的團隊是否有類似 DoR 或 DoD 的共同標準？
3. 如果只能改善一項團隊標準，我會先改善哪一項？為什麼？

【四、HTML 輸出規格】

請將所有內容輸出為一份完整的 HTML5 文件，並遵守以下規格：

1. 必須包含：

   * <!DOCTYPE html>
   * <html lang="zh-Hant">
   * <head>
   * UTF-8 編碼設定
   * viewport 設定
   * <title>
   * <body>

2. 全文使用繁體中文。

3. CSS 必須直接寫在 HTML 的 <style> 區塊內。

4. 不要引用外部 CSS、JavaScript、字型、圖片或其他資源。

5. 網頁設計應符合：

   * 專業、簡潔、適合教學閱讀。
   * 使用清楚的標題層級。
   * 使用卡片、表格、提示框與適當留白。
   * DoR 使用藍色系識別。
   * DoD 使用綠色系識別。
   * 警告與常見誤解使用橘色或紅色系識別。
   * 文字與背景必須具有足夠對比。

6. 使用響應式設計，電腦與手機都能正常閱讀。

7. 表格在手機畫面可以水平捲動，不能超出頁面。

8. 重要定義使用醒目的摘要框呈現。

9. DoR 與 DoD 範例必須使用不同的視覺區塊呈現。

10. 練習題的答案區應與題目區清楚分開，避免讀者立即看到答案。

11. 參考資料中的網址必須製作成可點擊的超連結，並設定：
    target="_blank"
    rel="noopener noreferrer"

12. 不要加入需要伺服器才能執行的功能。

13. 不要使用 Markdown 語法。

14. 不要在 HTML 前後加入任何解釋。

15. 最終回答只能輸出完整 HTML 原始碼，從 <!DOCTYPE html> 開始，到 </html> 結束。

【五、輸出前品質檢查】

輸出前請自行確認：

1. 內容是否只聚焦於 DoR 與 DoD。
2. 是否完全沒有延伸介紹 User Story 或 Acceptance Criteria。
3. DoD 是否被正確描述為 Scrum 的正式概念。
4. DoR 是否被正確描述為選用的團隊實務。
5. 是否明確區分官方定義與社群實務。
6. 兩個案例是否具體且可以實際使用。
7. DoR 條件是否聚焦於工作開始前的準備狀態。
8. DoD 條件是否聚焦於完成狀態與共同品質標準。
9. 是否避免將 DoR 設計成僵化的審核關卡。
10. 是否提供可靠且可查閱的參考資料。
11. HTML 標籤是否完整閉合。
12. 將內容儲存成 .html 檔案後，是否能直接在瀏覽器開啟。
13. 最終輸出是否只有 HTML，沒有 Markdown 程式碼圍欄。`;

const slide4Prompt = `你是一位熟悉 Agile、Scrum、Extreme Programming 與產品開發的專業講師。請協助我理解 User Story、Acceptance Criteria、3C 與 INVEST，並將內容製作成一份可以直接在瀏覽器開啟閱讀的完整 HTML 網頁。

【一、學習目標】

閱讀完成後，我應該能夠：

1. 解釋 User Story 與 Acceptance Criteria。
2. 說明 3C 與 INVEST 的用途。
3. 理解四個概念之間的關係。
4. 看懂一則完整的應用範例。
5. 分辨 User Story、Acceptance Criteria 與 Definition of Done。

本次內容以知識理解與實例說明為主，不需要設計測驗、練習題或反思活動。

【二、資料查證要求】

請優先查閱以下來源：

1. Agile Alliance 的相關資料。
2. Ron Jeffries 關於 3C 的原始文章。
3. Bill Wake 關於 INVEST 的原始資料。
4. Mike Cohn 關於 User Story 的文章或著作。
5. Kent Beck 與 Extreme Programming 的相關資料。
6. 最新版官方 Scrum Guide。

請遵守以下原則：

1. 清楚區分 Scrum 正式規定與敏捷社群常見實務。
2. 不要把 User Story 描述為 Scrum 強制規定的需求格式。
3. 不要把固定句型描述成 User Story 的唯一格式。
4. 不要把 3C 與 INVEST 誤寫成 Scrum Guide 的正式元素。
5. 不要聲稱 Acceptance Criteria 由某一個人單獨發明。
6. 不確定的歷史資訊不要推測或虛構。
7. 重要定義請標示資料來源。
8. 最後列出完整參考資料與網址。

【三、內容結構】

第一部分：快速總覽

請用簡短、白話的方式說明：

* User Story 是什麼？
* Acceptance Criteria 是什麼？
* 3C 是什麼？
* INVEST 是什麼？

請製作一張總覽表：

| 概念                  | 核心問題            | 主要用途        |
| ------------------- | --------------- | ----------- |
| User Story          | 誰需要什麼？為什麼？      | 表達需求與價值     |
| Acceptance Criteria | 做到什麼才符合這項需求？    | 說明具體接受條件    |
| 3C                  | 團隊如何形成共同理解？     | 引導對話與確認     |
| INVEST              | 這則 Story 的品質如何？ | 檢視與改善 Story |

第二部分：User Story

請說明：

1. User Story 的中文翻譯與白話定義。
2. User Story 的歷史背景及其與 Extreme Programming 的關係。
3. User Story 主要要解決的問題。
4. User Story 為什麼要呈現使用者、需求與價值。
5. User Story 為什麼是對話的起點，而非完整需求文件。
6. User Story 是否為 Scrum Guide 規定的必要格式。

請介紹常見句型：

身為［某一類使用者或角色］，
我想要［完成某件事情］，
以便［獲得某項價值或成果］。

請清楚說明：

* 這是常用範本，並非唯一格式。
* 重點在於使用者需求與價值，不在於套用句型。
* 技術工作不一定適合勉強套入使用者角色格式。

第三部分：Acceptance Criteria

請說明：

1. Acceptance Criteria 的中文翻譯與白話定義。
2. Acceptance Criteria 要解決的問題。
3. Acceptance Criteria 通常由誰共同討論。
4. Acceptance Criteria 如何支持共同理解與驗證。
5. 好的 Acceptance Criteria 應具備哪些特徵。
6. Acceptance Criteria 與測試案例的關係。
7. Acceptance Criteria 與 Definition of Done 的差異。

請介紹兩種常見寫法：

A. 規則式

以條列方式說明系統必須符合的條件。

B. 情境式

使用 Given／When／Then：

Given［前提情境］
When［發生的行為或事件］
Then［預期結果］

請清楚說明：

* Acceptance Criteria 聚焦於單一需求的接受條件。
* Acceptance Criteria 應該具體、清楚且可以驗證。
* Acceptance Criteria 不需要全部寫成 Given／When／Then。
* Acceptance Criteria 不應只是重複 User Story。

Fourth部分：3C

請介紹 Ron Jeffries 提出的 3C：

1. Card
2. Conversation
3. Confirmation

請使用表格說明：

| 元素           | 中文解釋 | 核心問題        | 主要內容          |
| ------------ | ---- | ----------- | ------------- |
| Card         | 卡片   | 我們要談的是什麼？   | 簡短記錄需求與價值     |
| Conversation | 對話   | 我們需要共同理解什麼？ | 討論情境、規則、限制與例外 |
| Confirmation | 確認   | 如何知道需求已經符合？ | 形成具體且可驗證的條件   |

請特別說明：

* Card 不是完整需求文件。
* Conversation 是形成共同理解的核心。
* Confirmation 通常可以透過具體範例與 Acceptance Criteria 呈現。
* 3C 描述的是需求逐步被理解與確認的過程。

第五部分：INVEST

請介紹 Bill Wake 提出的 INVEST：

| 原則 | 英文          | 中文解釋  |
| -- | ----------- | ----- |
| I  | Independent | 獨立的   |
| N  | Negotiable  | 可協商的  |
| V  | Valuable    | 有價值的  |
| E  | Estimable   | 可估算的  |
| S  | Small       | 規模適當的 |
| T  | Testable    | 可驗證的  |

每一項原則請包含：

1. 白話解釋。
2. 一個判斷問題。
3. 一個簡短例子。
4. 不符合時可以如何改善。

請清楚說明：

* INVEST 是檢視與改善 User Story 的參考原則。
* INVEST 不是 Scrum Guide 的正式規定。
* INVEST 不應成為僵化的審核表。
* Story 不一定能完全獨立，也不一定能完美符合所有原則。
* 團隊應使用 INVEST 找出值得進一步討論的問題。

第六部分：四個概念的關係

請清楚呈現以下關係：

1. User Story：簡短表達使用者的需求與價值。
2. 3C：說明團隊如何從簡短卡片展開對話並形成確認。
3. Acceptance Criteria：將對話中形成的關鍵規則與預期結果具體化。
4. INVEST：協助團隊檢視與改善 User Story 的品質。

請製作一張比較表，包含：

* 概念
* 核心目的
* 使用時機
* 主要產出
* 是否為 Scrum Guide 正式元素

第七部分：完整應用範例

請使用以下情境：

「網站使用者忘記密碼，希望重新設定密碼。」

請依序呈現：

A. 問題背景

說明使用者遇到的問題，以及希望達成的結果。

B. User Story

使用常見格式撰寫一則 User Story。

C. 3C

Card：

呈現卡片上會寫的簡短內容。

Conversation：

列出團隊需要討論的重點，例如：

* 哪些使用者可以使用這項功能？
* 如何確認使用者身分？
* 重設連結的有效期限為何？
* 連結失效後如何處理？
* 新密碼有哪些安全規則？
* 如何避免帳號資訊外洩？
* 使用者完成或失敗時會看到什麼訊息？

Confirmation：

說明團隊最後需要確認哪些結果。

D. Acceptance Criteria

請提供：

1. 至少五項規則式 Acceptance Criteria。
2. 至少兩組 Given／When／Then 情境。
3. 同時包含正常情況與例外情況。

E. INVEST 分析

請逐項說明這則 User Story 是否符合：

* Independent
* Negotiable
* Valuable
* Estimable
* Small
* Testable

每一項只需要提供：

* 簡短判斷
* 判斷理由
* 必要的改善建議

第八部分：容易混淆的概念

請製作比較表，說明：

| 比較項目                      | 核心差異                            |
| ------------------------- | ------------------------------- |
| User Story 與需求規格          | User Story 是對話起點，不等於完整規格        |
| Acceptance Criteria 與測試案例 | 前者描述接受條件，後者描述具體測試方式與資料          |
| Acceptance Criteria 與 DoD | 前者針對特定需求，後者是共同品質標準              |
| 3C 與 User Story 格式        | 3C 是溝通過程，不是固定句型                 |
| INVEST 與 DoR              | INVEST 是品質檢視原則，DoR 是部分團隊採用的準備條件 |

第九部分：重點摘要

請用一張摘要表整理：

* User Story：表達需求與價值。
* Acceptance Criteria：說明接受條件。
* 3C：支持對話與確認。
* INVEST：檢視 Story 品質。

最後提供一句整體總結，幫助讀者記憶四個概念之間的關係。

【四、HTML 輸出規格】

請將所有內容輸出為一份完整的 HTML5 文件。

1. 必須包含：

   * <!DOCTYPE html>
   * <html lang="zh-Hant">
   * <head>
   * UTF-8 編碼設定
   * viewport 設定
   * <title>
   * <body>

2. 全文使用繁體中文。

3. CSS 必須直接寫在 HTML 的 <style> 區塊內。

4. 不要引用外部 CSS、JavaScript、字型或圖片。

5. 網頁風格：

   * 專業、簡潔、適合教學閱讀。
   * 使用清楚的標題層級。
   * 使用卡片、表格、提示框與適當留白。
   * User Story 使用藍色系。
   * Acceptance Criteria 使用綠色系。
   * 3C 使用紫色系。
   * INVEST 使用橘色系。
   * 文字與背景必須具有足夠對比。

6. 使用響應式設計，電腦與手機都能正常閱讀。

7. 表格在手機畫面可以水平捲動。

8. 重要定義使用醒目的摘要框呈現。

9. 英文縮寫第一次出現時，必須呈現英文全名與繁體中文解釋。

10. 參考資料網址必須製作成可點擊的超連結，並設定：
    target="_blank"
    rel="noopener noreferrer"

11. 不要加入測驗、練習題、作業或反思問題。

12. 不要使用 Markdown 語法。

13. 不要在 HTML 前後加入解釋。

14. 最終回答只能輸出完整 HTML 原始碼，從 <!DOCTYPE html> 開始，到 </html> 結束。

【五、輸出前檢查】

輸出前請確認：

1. 內容是否聚焦於知識理解與範例。
2. 是否完整說明四個核心概念。
3. 是否清楚呈現四個概念之間的關係。
4. 是否避免把 User Story、3C 或 INVEST說成 Scrum 的強制規定。
5. 是否正確區分 Acceptance Criteria 與 Definition of Done。
6. 是否提供一個完整且前後一致的案例。
7. 是否提供可靠且可以查閱的參考資料。
8. HTML 是否可以直接在瀏覽器開啟。
9. 最終輸出是否只有 HTML，沒有 Markdown 程式碼圍欄。`;

const slide16Prompt = `# MVP 與 MMF 概念學習網頁生成 Prompt

你是一位熟悉 Lean Startup、敏捷產品開發與產品管理的專業講師。

請使用「同一個產品案例」解釋並比較：

1. **MVP：Minimum Viable Product**
2. **MMF：Minimum／Minimally Marketable Feature**

你的目標不是讓學習者背誦定義，而是幫助學習者看懂：

* MVP 與 MMF 分別要解決什麼問題。
* 兩者在目的、範圍、成熟度與衡量方式上的差異。
* 兩者如何出現在同一個產品的發展過程中。
* 如何判斷一個方案屬於 MVP、MMF，或同時具備兩者性質。

---

## 一、案例設定

請全程使用以下產品或服務作為案例：

**產品／服務：［請填入，例如：行動銀行 App、線上課程平台、外送平台］**

如果沒有填寫，請自行選擇一個生活化、容易理解，且能清楚呈現 MVP 與 MMF 差異的案例。

選定案例後，全文不得任意更換案例。

---

## 二、內容結構

### 1. 開場情境

先用一段簡短情境介紹：

* 這個產品想服務誰？
* 使用者遇到什麼問題？
* 團隊想創造什麼價值？
* 目前最重要、但尚未被證明的假設是什麼？

將「尚未被證明的假設」以醒目的提示框呈現。

---

### 2. 白話定義

分別用不超過 100 字說明：

#### MVP 是什麼？

必須說明：

* MVP 的主要目的。
* 它想降低哪一種不確定性。
* 為什麼不能只把它理解為「功能最少的產品」。

#### MMF 是什麼？

必須說明：

* MMF 的主要目的。
* 它必須為誰帶來什麼價值。
* 為什麼不能只把它理解為「可以販售的小功能」。

如不同文獻使用 **Minimum Marketable Feature** 或 **Minimally Marketable Feature**，請簡短說明兩種名稱，但不要展開成文獻考證。

---

### 3. 核心差異比較

請使用 HTML 表格比較：

| 比較面向      | MVP | MMF |
| --------- | --- | --- |
| 核心目的      |     |     |
| 想回答的問題    |     |     |
| 關注的不確定性   |     |     |
| 主要使用對象    |     |     |
| 價值完整程度    |     |     |
| 產品成熟程度    |     |     |
| 是否一定要正式上線 |     |     |
| 主要衡量方式    |     |     |
| 結果可能導向的決策 |     |     |

表格後請用一句話點出最重要的差異：

> MVP 關注的是「是否值得繼續」，MMF 關注的是「是否已形成值得交付的價值」。

不要把「是否一定要正式上線」做成過度絕對的判斷。應說明 MMF 必須具備可交付的市場價值，但不一定立即公開給全部市場，也可能先提供給特定客群。

---

### 4. 同一案例中的 MVP 與第一個 MMF

根據前述案例，分別設計：

* 一個用來驗證關鍵假設的 MVP。
* 一個準備交付給特定市場或使用者的第一個 MMF。

兩者必須明顯不同，不能只更換名稱。

請分別說明：

1. 要驗證或解決什麼？
2. 目標使用者是誰？
3. 包含哪些內容？
4. 刻意不包含哪些內容？
5. 使用者如何實際接觸或使用？
6. 如何衡量結果？
7. 結果出現後，團隊可能做出什麼決策？
8. 為什麼它屬於 MVP 或 MMF？

最後使用並排卡片或對照表，說明：

* MVP 如何產生「有效學習」。
* MMF 如何形成「完整且可辨識的使用者或市場價值」。
* 從 MVP 發展到 MMF，團隊增加的不節功能，還包括哪些必要條件，例如品質、可靠性、安全性、營運支援或完整流程。

---

### 5. 常見誤解判斷

請逐項判斷下列說法是「正確」、「錯誤」或「視情況而定」，並用 60 字以內解釋理由：

1. MVP 就是功能很少、品質不好的產品。
2. MVP 一定要是真正完成並正式上線的軟體。
3. MMF 就是一個很小的 User Story。
4. MMF 必須為特定使用者帶來完整且可辨識的價值。
5. MVP 與 MMF 永遠不可能是同一個版本。

請使用易於辨識的圖示或色彩標籤呈現判斷結果，但不可只用顏色傳達資訊。

---

### 6. 概念關係整理

請說明：

#### MVP 與 MMF 何時不同？

從「驗證假設」與「交付價值」兩種目的說明。

#### MVP 與 MMF 何時可能重疊？

說明一個足以驗證假設的最小版本，如果同時能為特定使用者提供完整、可靠且可交付的價值，就可能同時是 MVP 與 MMF。

#### 它們與 User Story、產品版本有什麼關係？

必須清楚指出：

* User Story 通常描述一項使用者需求，不等於 MVP。
* MMF 可能由一個或多個 User Story 組成。
* 一個產品版本可能包含一個或多個 MMF。
* MVP 可能是一個產品版本，也可能是原型、人工服務、登陸頁、預購測試或其他能產生有效學習的實驗。

請完成並醒目呈現：

> MVP 是最小的「有效學習」單位，主要用來「驗證關鍵假設」。

> MMF 是最小的「市場價值交付」單位，主要用來「為特定使用者提供完整且可辨識的價值」。

---

### 7. 情境判斷

沿用同一案例，另外設計三個具體方案：

1. 主要屬於 MVP。
2. 主要屬於 MMF。
3. 同時是 MVP 與 MMF。

每個方案必須包含：

* 方案內容。
* 主要目的。
* 判斷結果。
* 判斷依據。
* 如果刪除哪些內容，可能會改變它的分類。

判斷時至少檢查以下兩個問題：

1. 這個方案的首要目的是「取得學習」，還是「交付價值」？
2. 它是否已為特定使用者形成完整、可辨識且可實際交付的價值？

不可只公布答案，必須呈現判斷邏輯。

---

### 8. 最終判斷方法

用一個簡潔的 HTML 決策流程呈現：

1. 團隊目前最大的問題，是「不知道假設是否成立」嗎？

   * 是：優先思考 MVP。
2. 團隊已經確認需求，現在要決定「最少交付哪些內容才能形成完整價值」嗎？

   * 是：優先思考 MMF。
3. 最小的驗證版本是否也已經可以為特定使用者提供完整且可靠的價值？

   * 是：它可能同時是 MVP 與 MMF。

最後用 150 字以內回答：

> 當產品團隊討論「最少要做什麼」時，如何判斷現在需要思考的是 MVP，還是 MMF？

---

## 三、教學與內容原則

1. 全文使用繁體中文。
2. 全程使用同一個案例。
3. 使用白話、具體且精準的語言。
4. 先說明「團隊要做什麼決策」，再說明需要 MVP 或 MMF。
5. 清楚區分：

   * MVP：驗證假設、降低不確定性、取得有效學習。
   * MMF：整合必要能力、形成完整價值、交付特定市場。
6. 不要把 MVP 簡化成「最少功能」或「品質不好的半成品」。
7. 不要把 MMF 簡化成「可以販售的單一功能」。
8. 不要預設 MVP 一定是軟體或正式上線的產品。
9. 不要預設 MMF 一定要立即公開給所有使用者。
10. 案例內容必須前後一致，所有比較都要回到同一個產品脈絡。
11. 正文建議控制在 1,800 字以內，不計 HTML、CSS 標籤。

---

## 四、HTML 輸出規格

請將回答製作成一份可以直接在瀏覽器開啟的完整 HTML5 網頁。

### 必要技術規格

1. 必須包含：

   * \`<!DOCTYPE html>\`
   * \`<html lang="zh-Hant">\`
   * \`<head>\`
   * UTF-8 編碼設定
   * viewport 設定
   * \`<title>\`
   * 完整的 \`<body>\`
2. CSS 必須直接寫在 \`<style>\` 中。
3. 不使用 JavaScript。
4. 不引用外部 CSS、字型、圖片、圖示或套件。
5. 不使用 Mermaid、SVG 或 Canvas。
6. 所有內容必須能離線閱讀。
7. 使用語意化 HTML，例如：

   * \`<header>\`
   * \`<main>\`
   * \`<section>\`
   * \`<article>\`
   * \`<table>\`
   * \`<blockquote>\`
   * \`<footer>\`
8. 比較表在手機上必須可水平捲動，不得破版。
9. 色彩需具備足夠對比，不能只靠顏色表達判斷結果。
10. 設計應適合教學投影與個人閱讀。

### 視覺設計要求

* 使用乾淨、專業、現代的教學網頁風格。
* 以不同但協調的色彩區分 MVP 與 MMF。
* 使用大標題、段落留白、重點卡片與比較表強化資訊層級。
* 正文字級至少 17px，行距至少 1.7.
* 頁面最大寬度約 1100px，置中顯示。
* 為 MVP、MMF、兩者重疊及判斷結果設計一致的文字標籤。
* 避免過度裝飾、漸層濫用與不必要動畫。
* 列印時仍需保持清楚，並避免重要區塊被不當分頁。

### 最終輸出限制

* 只能輸出完整 HTML 原始碼。
* 從 \`<!DOCTYPE html>\` 開始，到 \`</html>\` 結束。
* 不要使用 Markdown 程式碼區塊包住 HTML。
* 不要在 HTML 前後加入解釋、摘要、操作說明或其他文字。
`;

export const WorkbookPanel: React.FC<WorkbookPanelProps> = ({
  slide,
  getResponse,
  updateNote,
  onImageClick
}) => {
  const response = getResponse(slide.id);
  const noteLength = response.personalNote.length;
  const hasExamples = slide.examples && slide.examples.length > 0;
  const hasWhiteboard = ["slide-7", "slide-8", "slide-9", "slide-22"].includes(slide.id);

  const [activeTab, setActiveTab] = useState<"note" | "example">("note");

  // Reset tab to note when slide changes
  useEffect(() => {
    setActiveTab("note");
  }, [slide.id]);

  const getImageUrl = (imageName: string) => {
    if (!imageName) return "";
    const baseUrl = import.meta.env.BASE_URL || "/";
    return `${baseUrl}assets/${imageName}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white select-none overflow-hidden p-5">
      {/* Title & Tabs Selector / Word Count */}
      <div className="flex justify-between items-center mb-3 shrink-0 border-b border-slate-100 pb-2">
        {hasExamples ? (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("note")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "note"
                  ? "bg-fubon-blue text-white shadow-sm shadow-fubon-blue/15"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              📝 個人隨堂筆記
            </button>
            <button
              onClick={() => setActiveTab("example")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === "example"
                  ? "bg-fubon-blue text-white shadow-sm shadow-fubon-blue/15"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              💡 補充參考範例
              <span className="bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {slide.examples?.length || 0}
              </span>
            </button>
          </div>
        ) : (
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-fubon-blue rounded-full" />
            個人隨堂筆記
          </h3>
        )}
        <span className="text-xs font-mono text-slate-400">
          {activeTab === "note" ? `${noteLength} / 10,000 字` : "範例圖片模式"}
        </span>
      </div>

      {/* Dedicate whiteboard button if page has one */}
      {hasWhiteboard && (
        <div className="mb-3 shrink-0">
          <button
            onClick={() => {
              const baseUrl = import.meta.env.BASE_URL || "/";
              let boardFile = "";
              if (slide.id === "slide-7") boardFile = "wbs.html";
              else if (slide.id === "slide-8") boardFile = "impact-map.html";
              else if (slide.id === "slide-9") boardFile = "story-map.html";
              else if (slide.id === "slide-22") boardFile = "decision-table.html";
              window.open(`${baseUrl}${boardFile}`, "_blank");
            }}
            className="w-full py-2.5 bg-fubon-green hover:bg-fubon-green-dark text-slate-900 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            開啟專屬 {slide.title} {slide.id === "slide-22" ? "工具" : "協作白板"}
          </button>
        </div>
      )}

      {activeTab === "note" ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Slide 3 Specific: One-click Copy Button */}
          {slide.id === "slide-3" && (
            <div className="mb-4 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(slide3Prompt);
                  alert("提示詞已成功複製到剪貼簿！DoD & DoR");
                }}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 active:scale-[0.98] text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                一鍵複製課堂 AI 提示詞 (DoD & DoR)
              </button>
            </div>
          )}

          {/* Slide 4 Specific: One-click Copy Button */}
          {slide.id === "slide-4" && (
            <div className="mb-4 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(slide4Prompt);
                  alert("提示詞已成功複製到剪貼簿！User Story & AC");
                }}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 active:scale-[0.98] text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                一鍵複製課堂 AI 提示詞 (User Story & AC)
              </button>
            </div>
          )}

          {/* Slide 16 Specific: One-click Copy Button */}
          {slide.id === "slide-16" && (
            <div className="mb-4 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(slide16Prompt);
                  alert("提示詞已成功複製到剪貼簿！MVP & MMF");
                }}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 active:scale-[0.98] text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                一鍵複製課堂 AI 提示詞 (MVP & MMF)
              </button>
            </div>
          )}

          {/* Input Area (Textarea) */}
          <textarea
            value={response.personalNote}
            onChange={(e) => updateNote(slide.id, e.target.value)}
            placeholder={slide.notePlaceholder || "記錄你對這張卡片的理解、講師補充、疑問或工作上的聯想……"}
            maxLength={10000}
            className="w-full flex-1 p-4 border border-slate-200 focus:border-fubon-blue rounded-2xl outline-none focus:ring-4 focus:ring-fubon-blue-glow transition-all text-sm resize-none leading-relaxed bg-slate-50 focus:bg-white"
          />
        </div>
      ) : (
        /* Examples tab view */
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {slide.examples?.map((ex, index) => {
            const exUrl = getImageUrl(ex.image);
            return (
              <div key={index} className="bg-slate-50 rounded-2xl border border-slate-200/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-fubon-green rounded-full" />
                    {ex.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200/50 font-mono">
                    範例 {index + 1}
                  </span>
                </div>

                {ex.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 font-medium">
                    {ex.description}
                  </p>
                )}

                {ex.image && (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group cursor-zoom-in">
                    <img
                      src={exUrl}
                      alt={ex.title}
                      onClick={() => onImageClick?.(exUrl)}
                      className="w-full object-contain max-h-[350px] transition-transform duration-300 group-hover:scale-[1.01]"
                    />
                    <div className="absolute bottom-2 right-2 bg-slate-900/60 text-white text-[9px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                      點擊放大
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
