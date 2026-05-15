# 即時股票 Data Grid 元件面試題

## 概述

請使用 Vue 3 實作一個即時更新的股票資料表元件。

本題必須使用 **mock 資料**，不需使用後端或外部 API。你需要在前端模擬即時行情更新，並以可排序、可篩選的資料表呈現。

## 核心需求

### 技術範圍

- 框架：Vue 3
- 語言：JavaScript 或 TypeScript
- 資料來源：僅前端記憶體 mock 資料
- 執行方式：可直接在瀏覽器開啟（單一 HTML 可）

### 互動功能

- 即時更新功能
- 股票篩選功能
- Trend 趨勢線圖呈現
- 欄位可點擊排序

## AI 使用建議

本題不限制使用 AI 工具（例如 GitHub Copilot、ChatGPT、Claude 等）。

但若你有採用 AI，請：

1. **在對應程式碼處加上註解**，例如 `// [AI 輔助]`
2. **簡短說明為何使用**，例如：用來查詢 API 用法、生成樣板程式碼、或解決某個具體問題

範例：

```js
// [AI 輔助] 用 AI 協助生成 SVG 座標的 min/max 正規化邏輯
const sparklinePoints = (trend) => { ... };
```

使用 AI 不會扣分。我們在意的是你的判斷力：**知道何時以及如何善用 AI，本身就是一種重要能力**。重點是你能理解並掌握自己提交的程式碼。

## 評估重點

- 功能完整性
- 介面易用性
- 圖表相關應用
- 資料&狀態是否正確顯示
- 程式邏輯與結構

## 撰寫格式說明

### 基本欄位

請顯示以下欄位：

- `Symbol`
- `Price`
- `Change`
- `% Change`
- `Volume`
- `Trend`（即時線條走勢圖）

### 格式規則

- Price：小數固定 2 位，例如 `182.34`
- Change：需顯示正負號與小數 2 位，例如 `+1.24`、`-0.87`
- % Change：需顯示正負號與小數 2 位百分比，例如 `+0.68%`
- Volume：需加千分位逗號，例如 `12,304,990`

### 即時模擬規則

- 初始至少 12 筆股票資料
- 每 `300ms` 到 `1000ms` 更新一次
- 每個 tick 隨機更新 `1-4` 列
- 每列更新時需更新：
  - `price`
  - `change`（新舊價格差）
  - `changePct`（`change / previousPrice * 100`）
  - `volume`（遞增）
  - `trend`（追加最新價格並保留最近 N 筆）
  - `updatedAt`

### 視覺規則

- 正值顏色：`#00b15d`
- 負值顏色：`#FF5B5A`
- 0 值顏色：`#F0F4F8`
- 更新列需有約 `0.6s` 高亮動畫
- 滑鼠移入列背景：`#1E3059`
- 趨勢圖需可反映最近價格變化，且會隨 tick 即時更新

### 主題色

- 背景：`#131B29`
- 預設文字：`#F0F4F8`
- 表頭文字：`#8698aa`

## Mock 資料走

資料結構：

```ts
type StockRow = {
  id: number;
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  trend: number[];
  updatedAt: number;
};
```

建議初始資料：

````ts
const MOCK_SYMBOLS = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA', 'AMZN', 'GOOGL',
  'META', 'AMD', 'NFLX', 'AVGO', 'ORCL', 'CRM'
];

const MOCK_ROWS = [
  { id: 1, symbol: 'AAPL',  price: 188.42, change: 0, changePct: 0, volume: 10304550, trend: [188.42], updatedAt: Date.now() },
  { id: 2, symbol: 'MSFT',  price: 421.63, change: 0, changePct: 0, volume: 7421990,  trend: [421.63], updatedAt: Date.now() },
  { id: 3, symbol: 'NVDA',  price: 917.12, change: 0, changePct: 0, volume: 22810440, trend: [917.12], updatedAt: Date.now() },
  { id: 4, symbol: 'TSLA',  price: 173.58, change: 0, changePct: 0, volume: 18230010, trend: [173.58], updatedAt: Date.now() },
  { id: 5, symbol: 'AMZN',  price: 178.22, change: 0, changePct: 0, volume: 8305110,  trend: [178.22], updatedAt: Date.now() },
  { id: 6, symbol: 'GOOGL', price: 152.67, change: 0, changePct: 0, volume: 6119930,  trend: [152.67], updatedAt: Date.now() },
  { id: 7, symbol: 'META',  price: 496.51, change: 0, changePct: 0, volume: 4401550,  trend: [496.51], updatedAt: Date.now() },
  { id: 8, symbol: 'AMD',   price: 189.77, change: 0, changePct: 0, volume: 9711440,  trend: [189.77], updatedAt: Date.now() },
  { id: 9, symbol: 'NFLX',  price: 631.25, change: 0, changePct: 0, volume: 2511940,  trend: [631.25], updatedAt: Date.now() },
  { id: 10, symbol: 'AVGO', price: 1328.4, change: 0, changePct: 0, volume: 1810150,  trend: [1328.4], updatedAt: Date.now() },
  { id: 11, symbol: 'ORCL', price: 129.35, change: 0, changePct: 0, volume: 3520980,  trend: [129.35], updatedAt: Date.now() },
  { id: 12, symbol: 'CRM',  price: 302.96, change: 0, changePct: 0, volume: 2033550,  trend: [302.96], updatedAt: Date.now() },
];
```ㄋ
````
