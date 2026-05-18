<template>
  <select id="symbol" v-model="model.symbol" name="symbol">
    <option
      v-for="symbol in symbolOpts"
      :key="symbol.value"
      :value="symbol.value"
    >
      {{ symbol.label }}
    </option>
  </select>
</template>
<script setup lang="ts">
import { computed } from "vue";
import { MOCK_SYMBOLS } from "@/constants";
import type { SearchForm, SymbolOpt } from "@/types/filter";

defineOptions({
  name: "StockFilter",
});

const model = defineModel<SearchForm>({
  default: () => ({
    symbol: undefined,
  }),
});

const symbolOpts = computed<SymbolOpt[]>(() => {
  const allOpt: SymbolOpt = {
    label: "ALL",
    value: undefined,
  };

  return [
    allOpt,
    ...MOCK_SYMBOLS.map((symbol) => ({
      label: symbol,
      value: symbol,
    })),
  ];
});
</script>

<style lang="scss" scoped>
select {
  width: min(240px, 100%);
  min-height: 40px;
  /* 調整右側 padding 讓瀏覽器預設下拉箭頭往左一點 */
  padding: 0 56px 0 14px; /* 原來 40px -> 改為 56px，使箭頭往左 */
  color: var(--color-stock-neutral);
  background-color: rgb(var(--color-stock-hover-rgb) / 42%);
  border: 1px solid rgb(var(--color-stock-header-rgb) / 26%);
  border-radius: 8px;
  outline: none;

  /* 使用自訂箭頭，並可精準控制位置 */
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23F0F4F8' d='M6 8L0 0h12L6 8z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: calc(100% - 18px) center; /* 調整此數值可微調箭頭到更左或更右 */
  background-size: 12px 8px;
}

select:focus {
  border-color: var(--color-stock-positive);
  box-shadow: 0 0 0 3px rgb(var(--color-stock-positive-rgb) / 16%);
}
</style>
// ...existing code...
