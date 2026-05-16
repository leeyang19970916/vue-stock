<script setup lang="ts">
import { MOCK_ROWS, SORT_STATE } from "@/constants";
import type { StockRow } from "@/types";
import type { SearchForm } from "@/types/filter";
import { getLineStyle } from "@/utils/getLineStyle";
import { computed, onMounted, onUnmounted, ref } from "vue";
import TheadLabel from "@/components/Table/TheadLabel.vue";
import type { Col, SortState } from "@/types/table";

const props = defineProps<{
  searchForm: SearchForm;
}>();

defineOptions({
  name: "StockTable",
});

const COLS: Col[] = [
  { label: "Symbol", key: "symbol", sortable: true },
  { label: "Price", key: "price", sortable: true },
  { label: "Change", key: "change", sortable: true },
  { label: "% Change", key: "changePct", sortable: true },
  { label: "Volume", key: "volume", sortable: true },
  { label: "Trend", key: "trend", sortable: false },
];
const rows = ref<StockRow[]>([...MOCK_ROWS]);

const sortState = ref<SortState>(SORT_STATE);

const updatedRowIds = ref<Set<StockRow["id"]>>(new Set());
let tickTimer: number | undefined;

const filteredRows = computed(() => {
  if (!props.searchForm.symbol) {
    return rows.value;
  }
  return rows.value.filter(({ symbol }) => symbol === props.searchForm.symbol);
});

const sortedRows = computed(() => {
  // ??
  return 0;

  // const directionValue = sortState.value.direction === "asc" ? 1 : -1;

  // return [...filteredRows.value].sort((a, b) => {
  //   const aValue = a[sortState.value.key];
  //   const bValue = b[sortState.value.key];

  //   if (typeof aValue === "string" && typeof bValue === "string") {
  //     return aValue.localeCompare(bValue) * directionValue;
  //   }

  //   if (typeof aValue === "number" && typeof bValue === "number") {
  //     return (aValue - bValue) * directionValue;
  //   }

  //   return 0;
  // });
});

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

const getRandomRowIndexes = (
  rowCount: number,
  updateCount: number
): Set<number> => {
  const indexes = new Set<number>();

  while (indexes.size < updateCount && indexes.size < rowCount) {
    indexes.add(randomInt(0, rowCount - 1));
  }

  return indexes;
};

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

const runTick = () => {
  const updateCount = randomInt(1, 4);
  const targetIndexes = getRandomRowIndexes(rows.value.length, updateCount);
  const nextUpdatedRowIds = new Set<StockRow["id"]>();

  rows.value = rows.value.map((row, index) => {
    if (!targetIndexes.has(index)) {
      return row;
    }

    const nextRow = updateStockRow(row);
    nextUpdatedRowIds.add(nextRow.id);

    return nextRow;
  });

  updatedRowIds.value = nextUpdatedRowIds;

  window.setTimeout(() => {
    updatedRowIds.value = new Set();
  }, 600);
};

const scheduleNextTick = () => {
  tickTimer = window.setTimeout(() => {
    runTick();
    scheduleNextTick();
  }, randomInt(300, 1_000));
};

onMounted(() => {
  scheduleNextTick();
});

onUnmounted(() => {
  if (tickTimer !== undefined) {
    window.clearTimeout(tickTimer);
  }
});

const getValueToneClass = (row: StockRow, colKey: Col["key"]): string => {
  if (colKey !== "change" && colKey !== "changePct") return "";
  return getLineStyle(row[colKey]);
};

// [AI 輔助] 用 AI 協助整理 SVG sparkline 的 min/max 正規化與單點 fallback。
const getSparklinePoints = (trend: number[]): string => {
  const width = 120;
  const height = 32;
  const padding = 3;

  if (trend.length === 0) {
    return "";
  }

  if (trend.length === 1) {
    const y = (height / 2).toFixed(2);
    const startX = padding.toFixed(2);
    const endX = (width - padding).toFixed(2);

    return `${startX},${y} ${endX},${y}`;
  }

  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const range = max - min || 1;
  const xStep = (width - padding * 2) / (trend.length - 1);

  return trend
    .map((value, index) => {
      const x = padding + index * xStep;
      const normalized = (value - min) / range;
      const y = height - padding - normalized * (height - padding * 2);

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

const formatCell = (
  row: StockRow,
  colKey: Exclude<Col["key"], "trend">
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
</script>

<template>
  {{ sortState }}
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
        v-for="row in rows"
        :key="row.id"
        :class="{ 'is-updated': updatedRowIds.has(row.id) }"
      >
        <td
          v-for="col in COLS"
          :key="col.key"
          :class="getValueToneClass(row, col.key)"
        >
          <template v-if="col.key === 'trend'">
            <svg
              class="sparkline"
              :class="getLineStyle(row.change)"
              viewBox="0 0 120 32"
              role="img"
              :aria-label="`${row.symbol} recent price trend`"
            >
              <polyline
                :points="getSparklinePoints(row.trend)"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                vector-effect="non-scaling-stroke"
              />
            </svg>
          </template>
          <template v-else>
            {{ formatCell(row, col.key) }}
          </template>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style lang="scss" scoped>
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
  text-transform: uppercase;
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
  transition: background-color 600ms ease, color 160ms ease;
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
