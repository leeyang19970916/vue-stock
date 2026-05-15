<script setup lang="ts">
import { ref } from "vue";

import Filter from "@/components/Filter/index.vue";
import Table from "@/components/Table/index.vue";
import type { SearchForm } from "@/types/filter";

const searchForm = ref<SearchForm>({
  symbol: undefined,
});
</script>

<template>
  <main class="app-page">
    <section>
      <h2>篩選器</h2>
      <Filter v-model="searchForm" />
    </section>

    <section>
      <h2>表格</h2>
      <Table :search-form="searchForm" />
    </section>
  </main>
</template>

<style lang="scss" scoped>
.app-page {
  width: min(1120px, calc(100% - 32px));
  min-height: 100vh;
  margin: 0 auto;
  padding: 48px 0;
  color: var(--color-stock-neutral);
}

section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;

  h2 {
    margin: 0;
    color: var(--color-stock-neutral);
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
  }
}
</style>
