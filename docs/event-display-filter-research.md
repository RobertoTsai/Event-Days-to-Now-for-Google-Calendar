# 事件顯示篩選功能：設計、研究與決策紀錄

## 文件目的

本文件整理「依事件類型顯示」、「顯示不參加事件標籤」及「顯示過去事件標籤」功能的需求演進、Google Calendar DOM 研究、程式原有規則、最後採用的實作，以及討論後未執行或已移除的方案。

實作工作計畫另見 [2026-07-22-event-display-filters.md](superpowers/plans/2026-07-22-event-display-filters.md)。

## 改動前的套件結構與規則

### 檔案責任

- `Extensions/content.js`：掃描 Google Calendar 事件、解析日期與時間、計算相對天數／時數、插入倒數標籤。
- `Extensions/styles.css`：以 `::before` 和 `data-date-prefix` 顯示標籤，並區分全天與非全天樣式。
- `Extensions/popup.html`：設定視窗結構與內嵌樣式。
- `Extensions/popup.js`：讀寫 `chrome.storage.sync`、切換 13 種設定介面語言、通知目前 Calendar 分頁重新套用設定。
- `Tests/content.test.js`：以 Node.js `vm` 載入 content script，測試日期解析、時間解析、格式與 DOM helper。
- `Tests/popup.test.js`：以最小 DOM mock 測試 popup 設定、儲存與翻譯切換。

### 事件掃描與更新

- content script 在 Calendar grid／row 出現後啟動。
- `MutationObserver` 監看 Calendar DOM 的子節點變化，透過 `requestAnimationFrame` 合併重複更新。
- popup 儲存設定後會傳送 `updateSettings`，content script 重新載入設定並更新標籤。
- 分頁重新變為可見時也會重新載入設定。
- 標籤不是額外插入文字節點，而是將值放在 `data-date-prefix`，再由 `.date-prefix-host::before` 顯示。
- 找不到有效日期或格式結果為空字串時，會移除既有 prefix data 與 host class，避免殘留舊標籤。

### 日期來源與解析順序

- 一般事件優先讀取事件或標題的無障礙文字，找不到日期時再讀取 `datetime`、`data-start-time`、`data-start-date`、`data-date` 等 metadata。
- 支援 ISO、`YYYYMMDD`、Unix 秒／毫秒時間戳、年月日數字格式及本地化月份名稱。
- 生日事件以 `bday_` 開頭，會從 event ID 解碼日期並視為全天事件。
- 全天事件原本已由 `isAllDay` 區分，因此新增類型篩選時不需要另一套全天偵測。

### 原有倒數格式

- 今天的全天事件不顯示 prefix。
- 今天已開始的非全天事件不顯示 prefix。
- 今天尚未開始的非全天事件顯示小時，例如 `5h`。
- 明天的全天事件或距離超過 24 小時的事件顯示 `1d`；否則顯示剩餘小時。
- 過去日期顯示負數天數，例如 `-14d`。
- 距離達 365 天時，可依原有設定顯示年＋日，例如 `1y5d`。
- 年、日、時單位文字可由 popup 自訂。

### 原有設定相容原則

- 布林設定使用 `storedValue !== false`，未儲存的新設定自然預設開啟。
- 全域 `enableExtension` 關閉時會移除所有標籤，並停用 popup 內的相依設定。
- 新功能不得增加 Calendar API、OAuth、host permission 或外部依賴。

## 最終採用的功能規格

### 依事件類型顯示

四個 checkbox 預設全部開啟。每個事件只歸入一類，判斷順序如下：

1. `data-eventid` 以 `bday_` 開頭：生日。
2. `data-eventid` 以 `tasks_` 開頭：工作。
3. 其他事件且 `isAllDay` 為 true：全天。
4. 其餘事件：非全天。

對應儲存鍵：

- `showAllDayEvents`
- `showTimedEvents`
- `showTasks`
- `showBirthdays`

生日和工作即使在 Calendar 中屬於全天，也只受自己的專用 checkbox 控制，不會同時受「全天」控制。

### 顯示不參加事件標籤

- 單一 switch，儲存鍵為 `showDeclinedEvents`，預設開啟。
- 開啟時，不參加事件照常顯示倒數標籤。
- 關閉時，只隱藏事件本身或子元素具有 `.w9eXqe` 的倒數標籤。
- `.w9eXqe` 是目前各檢視中一致對應刪除線的訊號，不需要解析任何語系文字。
- 參加、不確定、未回覆、無參加狀態及外部日曆事件不受此 switch 影響。

### 顯示過去事件標籤

- 獨立 switch，儲存鍵為 `showPastEvents`，預設開啟。
- 關閉時，不顯示 `dayDifference < 0` 的負數日期標籤。
- 此設定的準確名稱是「過去事件」，不是嚴格的「已結束事件」：目前程式以事件日期／開始時間計算，沒有解析完整結束時間。
- 今天的全天事件及今天已開始的定時事件仍沿用原有的不顯示規則。

### 最終顯示條件

```text
顯示倒數 =
  對應事件類型已開啟
  &&（事件沒有刪除線 || 顯示不參加事件標籤已開啟）
  &&（事件不是過去日期 || 顯示過去事件標籤已開啟）
```

## HTML 樣本與研究結果

### `event_task.txt`

- 工作事件的 event ID 穩定以 `tasks_` 開頭。
- 外層真正事件與內層完成按鈕都具有 `data-eventid`。
- 原本掃描所有 `[data-eventid]` 時，外層先加入 prefix，內層完成按鈕隨後因沒有日期而清除同一個 prefix。
- 最終選擇器只掃描真正的 event chip，排除工作完成按鈕。

### `event_status.txt`

月份檢視最初觀察到：

- 參加：沒有專屬狀態 class。
- 不參加：`.LKeQwe`，標題另有 `.w9eXqe` 刪除線。
- 不確定：`.Epw9Dc`。
- 未回覆：可能同時有 `.LKeQwe`、`.KKjvXb`。

這些訊號後來證實除了 `.w9eXqe` 外都無法跨檢視穩定使用。

### 自建、無受邀者事件樣本

- 自建事件沒有可靠的參加狀態訊號。
- `data-dragsource-type` 可能和工作事件相同，因此不能用來辨識工作或參加狀態。
- 此樣本促使規格明確要求：沒有可靠參加狀態的事件不可被狀態設定誤藏。

### `week_event_status.txt`

- 週／雙週檢視的事件可能沒有 `.smECzc`。
- 全天與直向定時事件的 class 所在層級不同。
- 未回覆可能只有 `.LKeQwe`，不一定有 `.KKjvXb`。
- 不參加事件的標題仍一致具有 `.w9eXqe`。

### `schedule_event_status.txt`

- 時程表的 `data-eventid` 位於 `.uFexlc` 的直接子元素，而不是 `[data-eventchip]`。
- 最終掃描選擇器因此包含 `.uFexlc > [data-eventid]`，同時保留對工作巢狀按鈕的排除。
- 參加、不確定、未回覆的 DOM class 可能完全相同，只有本地化 `aria-label` 不同。
- 不參加事件仍有 `.w9eXqe`，因此最終單一開關可以跨語系及檢視運作。

### `other_calendar_event.txt`

- 外部日曆事件可能具有 `.smECzc`，但沒有參加狀態。
- 因此 `.smECzc` 不能視為「已參加」或「具有 RSVP 狀態」的證據。

### `month_event_status_en.txt`

- 英文狀態文字為 `Accepted`、`Declined`、`Tentative`、`Needs RSVP`。
- 這證明依無障礙文字辨識需要逐語系維護，無法涵蓋 Google Calendar 的所有語言。
- 最終方案已移除這些文字及繁中狀態文字 mapping。

### 英文／西文日期錯誤案例

- 英文事件日期為 `July 7, 2026`，但地點名稱較早出現 `1914`。
- 原本 localized parser 取第一個四位數，錯把 1914 當成事件年份，產生約 `-112y224d`。
- 修正後會收集所有四位數年份，使用既有距離排序選擇最接近月份名稱的年份。
- 英文原始案例及西文 `7 de julio de 2026` 同型案例均加入回歸測試。

## 討論後未執行或已移除的方案

### 全天事件淡化模式

最初回饋包含「淡化或隱藏全天事件倒數」。研究階段曾考慮 `Show / Dim / Hide` 三段設定，但最終改成統一的事件類型 checkbox，只提供顯示／隱藏；沒有加入透明度或淡化樣式。

### 四種參加狀態 checkbox

曾實作以下四個設定：

- 參加
- 不參加
- 不確定
- 尚未回覆

此方案最後完整移除，原因包括：

- `.smECzc` 也會出現在外部日曆事件。
- `.UflSff` 也可能出現在過去但沒有參加狀態的事件。
- `.LKeQwe` 可能同時代表不參加與未回覆。
- `.KKjvXb` 在不同檢視或語言下不一定存在。
- 時程表中參加、不確定及未回覆可能具有完全相同的 DOM class。

### 逐語系狀態文字表

曾為繁中及英文加入 RSVP 文字 mapping，但最後移除：

- Google Calendar 支援的語系很多，無法合理窮舉。
- popup 顯示語言和 Calendar 頁面語言不一定相同。
- 翻譯內容可能由 Google 變更。
- 事件標題、地點或其他無障礙欄位也可能含相同字詞。

最終只使用不依語系的 `.w9eXqe`。

### Google Calendar API

API 可以從 `attendees[].self` 與 `responseStatus` 取得可靠狀態，但沒有採用，因為需要：

- 新增 OAuth 與 Calendar readonly scope。
- 說明並審查更高的使用者資料權限。
- 同步及快取事件資料。
- 將 DOM `data-eventid`、Calendar ID、重複事件及多帳號資料互相對應。

這些成本不符合套件原本的輕量、只需 `storage` 權限架構。

### 解析真正的事件結束時間

「顯示已結束事件」曾被討論，但最後採用「顯示過去事件標籤」。沒有新增結束時間、跨日事件或持續時間解析；`showPastEvents` 只控制今天以前的負數日期標籤。

## 最終事件選擇器

```css
[data-eventchip][data-eventid], .uFexlc > [data-eventid]
```

- 第一段涵蓋月、週、雙週等 event chip，並排除工作事件內部的完成按鈕。
- 第二段涵蓋時程表事件。

## 驗證範圍

### 自動測試

- 四種互斥事件類型。
- `.w9eXqe` 位於事件自身及子元素的判斷。
- 沒有 `.w9eXqe` 的 `.LKeQwe` 事件不視為不參加。
- 各類型、過去事件及不參加事件設定的獨立作用。
- 工作事件不再被巢狀 `data-eventid` 清除標籤。
- 月／週 event chip 與時程表選擇器。
- 英文／西文本地化月份遇到其他四位數時選擇正確年份。
- popup 新設定預設值、儲存、總開關停用狀態及繁中／日文翻譯。
- 13 種 popup 語言均包含新增設定文案。

### 人工驗證

- 月、週、雙週、時程表檢視。
- 全天、非全天、工作及生日 checkbox。
- 不參加開關開啟與關閉。
- 參加、不確定、未回覆、無狀態及外部日曆事件不受不參加開關影響。
- 過去事件開關。
- 英文與繁中 Calendar 顯示；西文本地化日期回歸由自動測試涵蓋。

## 已知限制與後續維護

- Google Calendar DOM class 沒有公開穩定性保證；若刪除線不再使用 `.w9eXqe`，需以新 HTML 樣本更新單一 helper 與回歸測試。
- popup 的 13 種語言只影響設定視窗，不用來解析 Calendar 內容。
- Calendar 新增檢視模式時，應先確認真正事件根節點是否符合目前兩段 selector。
- 日期 parser 仍以 Calendar 的無障礙文字及 metadata 為資料來源；遇到新格式時應先加入完整原始字串回歸測試，再修改共用 parser。
- 不應重新加入推測性的 RSVP class 組合或逐語系狀態表；若未來需要完整四狀態篩選，應重新評估 Calendar API，而不是擴大 DOM 猜測。
