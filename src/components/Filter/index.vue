<template>
  <select
    id="symbol"
    v-model="model.symbol"
    name="symbol"
  >
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
  padding: 0 40px 0 14px;
  color: var(--color-stock-neutral);
  background-color: rgb(var(--color-stock-hover-rgb) / 42%);
  border: 1px solid rgb(var(--color-stock-header-rgb) / 26%);
  border-radius: 8px;
  outline: none;
}

select:focus {
  border-color: var(--color-stock-positive);
  box-shadow: 0 0 0 3px rgb(var(--color-stock-positive-rgb) / 16%);
}
</style>
