<script setup lang="ts">
import {
  MOCK_SYMBOLS,
  MOCK_ROWS,
  SORT_STATE,
  TARGET_PRICE,
  API_DOMAIN,
  TOKEN,
} from "@/constants";
import type { StockRow } from "@/types";
import type { QuetoryResponse } from "@/types/table";
import type { SearchForm } from "@/types/filter";
import { getLineStyle } from "@/utils/getLineStyle";
import { computed, onMounted, onUnmounted, ref } from "vue";
import { randomFloat, randomInt, getRandomRowIndexes } from "@/utils/random";
import TheadLabel from "@/components/Table/TheadLabel.vue";
import type { Col, SortState } from "@/types/table";
import Sparkline from "./Sparkline.vue";
import { useAlertStore } from "@/store/AlertsStore";
// ESM / Typescript
import { ofetch } from "ofetch";
// import dayjs from "dayjs";
// import { get } from "http";

const props = defineProps<{
  searchForm: SearchForm;
}>();

defineOptions({
  name: "StockTable",
});

const currentQuote = ref<{
  symbolInput: string | undefined;
  isLoading: boolean;
  errorMsg: string;
  row: StockRow | undefined;
}>({
  symbolInput: undefined,
  isLoading: false,
  errorMsg: "",
  row: undefined,
});

const COLS: Col[] = [
  { label: "Symbol", key: "symbol", sortable: true },
  { label: "Price", key: "price", sortable: true },
  { label: "Change", key: "change", sortable: true },
  { label: "% Change", key: "changePct", sortable: true },
  { label: "Volume", key: "volume", sortable: true },
  { label: "Trend", key: "trend", sortable: false },
];
const alertStore = useAlertStore();

const rows = ref<StockRow[]>([...MOCK_ROWS]);
const sortState = ref<SortState>(SORT_STATE);

// --- 狀態與計時器管理 ---
// 使用 ref(Set) 儲存目前正在高亮的股票 ID
const updatedRowIds = ref(new Set<StockRow["id"]>(new Set()));
// 使用原生的 Map 在背景追蹤每隻股票專屬的倒數計時器 (不需要響應式，效能更好)
const rowClearTimers = new Map<StockRow["id"], number>(new Map());
let tickTimer: number | undefined = undefined;

// --- 搜尋與排序邏輯 ---
const filteredRows = computed(() => {
  if (!props.searchForm.symbol) {
    return rows.value;
  }
  return rows.value.filter(({ symbol }) => symbol === props.searchForm.symbol);
});

const sortedRows = computed(() => {
  const { direction, key } = sortState.value;
  const directionValue = direction === "asc" ? 1 : -1;
  const result = [...filteredRows.value].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];
    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * directionValue;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * directionValue;
    }

    return 0;
  });

  return result;
});

/**
 * [AI輔助] 執行單次股票資料更新跳動與 UI 高亮控制
 *
 * - 做了什麼事情：
 *   1. 隨機抽出要更新的目標索引 (targetIndexes)。
 *   2. 精準只針對抽到的索引進行資料覆蓋 (不再拷貝整個陣列)，減少效能損耗。
 *   3. 實作 Timer Reset 機制：將更新的股票 ID 加進 `updatedRowIds`，
 *      若股票仍在發亮，會先拆除舊炸彈 (clearTimeout)，重新設定 600ms 的新炸彈，延長發亮時間。
 * - 完成了什麼事情：
 *   解決了資料更新時的陣列效能瓶頸，並確保每支股票的高亮動畫彼此獨立、互不干擾。
 */
const runTick = () => {
  const updateCount = randomInt(1, 4);
  const targetIndexes = getRandomRowIndexes(rows.value.length, updateCount);

  // 暫存這一次 Tick 中被抽到更新的股票 ID
  const currentTickUpdatedIds: StockRow["id"][] = [];

  // 精準打擊：只針對抽到的 index 做更新，不使用 .map() 覆寫全陣列
  targetIndexes.forEach((index) => {
    const currentRow = rows.value[index];
    if (!currentRow) return;
    const nextRow = updateStockRow(currentRow);

    // 直接修改該列資料，Vue 會自動觸發這列的 UI 重新渲染
    rows.value[index] = nextRow;
    currentTickUpdatedIds.push(nextRow.id);
    if (nextRow.price > TARGET_PRICE) {
      alertStore.show(nextRow);
    }
  });

  // 針對這次有更新的股票，逐一進行「獨立高亮控制」
  currentTickUpdatedIds.forEach((id) => {
    updatedRowIds.value.add(id);

    // 如果這隻股票目前本來就正在亮，拆掉舊炸彈！不要讓它提早熄滅
    if (rowClearTimers.has(id)) {
      window.clearTimeout(rowClearTimers.get(id));
    }

    // 重新設定一個專屬於這隻股票的 0.6 秒新炸彈
    const timerId = window.setTimeout(() => {
      updatedRowIds.value.delete(id); // 時間到，只熄滅自己
      rowClearTimers.delete(id); // 把計時器從記錄中刪除
    }, 600);

    // 把新炸彈記錄到地圖裡
    rowClearTimers.set(id, timerId);
  });
};

/**
 * [AI輔助] 建立不規則的遞迴排程，模擬真實股市成交頻率
 *
 * - 做了什麼事情：
 *   使用 `window.setTimeout` 註冊一個定時器，隨機等待 300ms 到 1000ms（0.3秒到1秒）。
 *   時間截止時執行更新，並再次呼叫自己。
 * - 完成了什麼事情：
 *   打造出一個無限循環且間隔隨機的引擎，模擬股市時快時慢的跳動節奏。
 */
const scheduleNextTick = () => {
  tickTimer = window.setTimeout(
    () => {
      runTick();
      scheduleNextTick();
    },
    randomInt(300, 1_000),
  );
};
const fetchData = async (symbol: (typeof MOCK_SYMBOLS)[number]) => {
  try {
    currentQuote.value.isLoading = true;
    currentQuote.value.errorMsg = "";
    // const url = `${API_BASE}/quote?symbol=${encodeURIComponent(currentSymbol.value)}&token=${encodeURIComponent(token.value)}`;
    const url = `${API_DOMAIN}/api/v1/quote`;
    const data = await ofetch<QuetoryResponse>(url, {
      method: "GET",
      // headers: {
      //   "X-Finnhub-Token ": `${encodeURIComponent(TOKEN)}`,
      // },
      query: {
        symbol,
        token: TOKEN,
      },
    });
    const index = rows.value.findIndex((i) => i.symbol === symbol);
    if (index === -1) {
      throw new Error();
    }
    if (rows.value[index]) {
      rows.value[index] = {
        ...rows.value[index],
        price: data.c,
        change: data.d,
        changePct: data.dp,
        updatedAt: data.t,
        trend: [...rows.value[index].trend, data.c].slice(-20),
      };
    }
    currentQuote.value.row = rows.value[index];
  } catch (error) {
    console.error("API 請求失敗:", error);
    currentQuote.value.errorMsg = "無法取得資料，請稍後再試。";
    currentQuote.value.row = undefined;
  } finally {
    currentQuote.value.isLoading = false;
  }
};
setInterval(() => {
  if (currentQuote.value.row) {
    const symbol = currentQuote.value.row.symbol;
    fetchData(symbol);
  }
}, 5000);

onMounted(async () => {
  scheduleNextTick();
});

onUnmounted(() => {
  // 1. 關閉持續更新的主引擎
  if (tickTimer !== undefined) {
    window.clearTimeout(tickTimer);
  }
  // 2. 徹底拆除所有還在倒數的高亮計時器，避免離開頁面時發生 Memory Leak
  rowClearTimers.forEach((timerId) => window.clearTimeout(timerId));
  rowClearTimers.clear();
});

const getValueToneClass = (row: StockRow, colKey: Col["key"]): string => {
  if (colKey !== "change" && colKey !== "changePct") return "";
  return getLineStyle(row[colKey]);
};

const formatCell = (
  row: StockRow,
  colKey: Exclude<Col["key"], "trend">,
): string => {
  switch (colKey) {
    case "price":
      return row.price.toFixed(2);

    case "change":
      return `${row.change >= 0 ? "+" : ""}${row.change.toFixed(2)}`;

    case "changePct":
      return `${row.changePct >= 0 ? "+" : ""}${row.changePct.toFixed(2)}%`;

    case "volume":
      return row.volume.toLocaleString();

    case "symbol":
      return row.symbol;
  }
};

/**
 * [AI輔助] 計算並生成單一股票的最新隨機市場資料
 *
 * - 做了什麼事情：
 *   計算隨機價格漲跌，重新計算金額、百分比、成交量，並維護 20 筆歷史 trend 資料。
 * - 完成了什麼事情：
 *   回傳一個結構完整、附帶當前時間戳記的全新 StockRow 物件。
 */
const updateStockRow = (row: StockRow): StockRow => {
  const previousPrice = row.price;
  const priceDelta = randomFloat(-1.5, 1.5);
  const nextPrice = Math.max(0.01, previousPrice + priceDelta);
  const change = nextPrice - previousPrice;
  const changePct = (change / previousPrice) * 100;
  const trend = [...row.trend, nextPrice].slice(-20);

  return {
    ...row,
    price: nextPrice,
    change,
    changePct,
    volume: row.volume + randomInt(1_000, 80_000),
    trend,
    updatedAt: Date.now(),
  };
};
</script>

<template>
  <div>
    <div class="input-container">
      <input
        class="symbol-input"
        type="text"
        v-model="currentQuote.symbolInput"
        placeholder="輸入股票代碼"
        @keyup.enter="
          () => {
            const val =
              currentQuote.symbolInput as (typeof MOCK_SYMBOLS)[number];

            fetchData(val);
          }
        "
      />
      <button
        @click="
          () => {
            const val =
              currentQuote.symbolInput as (typeof MOCK_SYMBOLS)[number];

            fetchData(val);
          }
        "
        :disabled="currentQuote.isLoading"
      >
        查詢
      </button>
    </div>
    <div
      v-if="currentQuote.errorMsg"
      style="color: var(--color-stock-negative); margin-bottom: 16px"
    >
      {{ currentQuote.errorMsg }}
    </div>
    <div v-if="currentQuote.row">
      <strong>最新查詢：</strong>
      <div>股票名稱：{{ currentQuote.row.symbol }}</div>
      <div>最新價格：${{ currentQuote.row.price.toFixed(2) }}</div>
      <div>漲跌金額：${{ currentQuote.row.change.toFixed(2) }}</div>
      <div>漲跌幅度：{{ currentQuote.row.changePct.toFixed(2) }}%</div>
    </div>

    <table>
      <thead>
        <tr>
          <th v-for="col in COLS" :key="col.key" scope="col">
            <TheadLabel :col v-model="sortState" />
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in sortedRows"
          :key="row.id"
          :class="{ 'is-updated': updatedRowIds.has(row.id) }"
        >
          <td
            v-for="col in COLS"
            :key="col.key"
            :class="getValueToneClass(row, col.key)"
          >
            <template v-if="col.key === 'trend'">
              <Sparkline :row />
            </template>
            <template v-else>
              {{ formatCell(row, col.key) }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="scss" scoped>
.input-container {
  display: flex;
  gap: 8px;
  align-items: center;

  margin-bottom: 16px;
  .symbol-input {
    display: block;
    padding: 8px 12px;
    width: 200px;
    color: var(--color-stock-neutral);
    background: rgb(var(--color-stock-background-rgb) / 72%);
    border: 1px solid rgb(var(--color-stock-header-rgb) / 18%);
    border-radius: 4px;
  }
  button {
    width: auto;
    padding: 8px 16px;
    color: var(--color-stock-neutral);
    background: rgb(var(--color-stock-background-rgb) / 72%);
    border-radius: 4px;
    cursor: pointer;
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

table {
  width: 100%;
  overflow: hidden;
  border-collapse: separate;
  border-spacing: 0;
  color: var(--color-stock-neutral);
  background: rgb(var(--color-stock-background-rgb) / 72%);
  border: 1px solid rgb(var(--color-stock-header-rgb) / 18%);
  border-radius: 8px;
}

thead {
  color: var(--color-stock-header);
  background: rgb(var(--color-stock-hover-rgb) / 34%);
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid rgb(var(--color-stock-header-rgb) / 14%);
  text-align: right;
  white-space: nowrap;
}

th:first-child,
td:first-child {
  text-align: left;
}

th {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
}

td {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

td:last-child {
  width: 152px;
}

.sparkline {
  display: block;
  width: 120px;
  height: 32px;
  margin-left: auto;
}

tbody tr {
  transition:
    background-color 600ms ease,
    color 160ms ease;
}

tbody tr.is-updated {
  background: rgb(var(--color-stock-positive-rgb) / 14%);
}

tbody tr:hover {
  background: var(--color-stock-hover);
}

tbody tr:last-child td {
  border-bottom: 0;
}

button {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  min-height: 28px;
  width: 100%;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  cursor: pointer;
}

th:first-child button {
  justify-content: flex-start;
}

.is-positive {
  color: var(--color-stock-positive);
}

.is-negative {
  color: var(--color-stock-negative);
}

.is-neutral {
  color: var(--color-stock-neutral);
}
</style>
