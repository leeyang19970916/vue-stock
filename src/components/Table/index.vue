<script setup lang="ts">
import { MOCK_ROWS } from "@/constants";
import type { StockRow } from "@/types";
import type { SearchForm } from "@/types/filter";
import { computed, onMounted, onUnmounted, ref } from "vue";
defineOptions({
  name: "StockTable",
});
interface Col {
  label: string;
  key: Exclude<keyof StockRow, "id" | "updatedAt">;
  sortable: boolean;
}

type SortableColKey = Exclude<Col["key"], "trend">;

type SortDirection = "asc" | "desc";

type TimeoutId = number;

interface SortState {
  key: SortableColKey;
  direction: SortDirection;
}

const props = defineProps<{
  searchForm: SearchForm;
}>();

const cols: Col[] = [
  { label: "Symbol", key: "symbol", sortable: true },
  { label: "Price", key: "price", sortable: true },
  { label: "Change", key: "change", sortable: true },
  { label: "% Change", key: "changePct", sortable: true },
  { label: "Volume", key: "volume", sortable: true },
  { label: "Trend", key: "trend", sortable: false },
];
const rows = ref<StockRow[]>(MOCK_ROWS.map((row) => ({ ...row })));
const sortState = ref<SortState>({
  key: "symbol",
  direction: "asc",
});
const updatedRowIds = ref<Set<StockRow["id"]>>(new Set());
let tickTimer: TimeoutId | undefined;

const filteredRows = computed(() => {
  if (props.searchForm.symbol === undefined) {
    return rows.value;
  }

  return rows.value.filter((row) => row.symbol === props.searchForm.symbol);
});

const sortedRows = computed(() => {
  const directionValue = sortState.value.direction === "asc" ? 1 : -1;

  return [...filteredRows.value].sort((a, b) => {
    const aValue = a[sortState.value.key];
    const bValue = b[sortState.value.key];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return aValue.localeCompare(bValue) * directionValue;
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return (aValue - bValue) * directionValue;
    }

    return 0;
  });
});

const isSortableColKey = (key: Col["key"]): key is SortableColKey =>
  key !== "trend";

const updateSort = (key: Col["key"]) => {
  if (!isSortableColKey(key)) {
    return;
  }

  if (sortState.value.key === key) {
    sortState.value.direction =
      sortState.value.direction === "asc" ? "desc" : "asc";
    return;
  }

  sortState.value = {
    key,
    direction: "asc",
  };
};

const getSortLabel = (key: Col["key"]): string => {
  if (!isSortableColKey(key) || sortState.value.key !== key) {
    return "";
  }

  return sortState.value.direction === "asc" ? "↑" : "↓";
};

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

const getRandomRowIndexes = (rowCount: number, updateCount: number): Set<number> => {
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
  if (colKey !== "change" && colKey !== "changePct") {
    return "";
  }

  const value = row[colKey];

  if (value > 0) {
    return "is-positive";
  }

  if (value < 0) {
    return "is-negative";
  }

  return "is-neutral";
};

const formatCell = (row: StockRow, colKey: Col["key"]): string => {
  switch (colKey) {
    case "price":
      return row.price.toFixed(2);

    case "change":
      return `${row.change >= 0 ? "+" : ""}${row.change.toFixed(2)}`;

    case "changePct":
      return `${row.changePct >= 0 ? "+" : ""}${row.changePct.toFixed(2)}%`;

    case "volume":
      return row.volume.toLocaleString();

    case "trend":
      return row.trend.join(", ");

    case "symbol":
      return row.symbol;
  }
};
</script>

<template>
  <table>
    <thead>
      <tr>
        <th
          v-for="col in cols"
          :key="col.key"
          scope="col"
        >
          <button
            v-if="col.sortable"
            type="button"
            @click="updateSort(col.key)"
          >
            {{ col.label }} {{ getSortLabel(col.key) }}
          </button>
          <template v-else>
            {{ col.label }}
          </template>
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
          v-for="col in cols"
          :key="col.key"
          :class="getValueToneClass(row, col.key)"
        >
          <template v-if="col.key === 'trend'">
            {{ formatCell(row, col.key) }}
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
