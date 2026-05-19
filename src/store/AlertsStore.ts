import { defineStore } from "pinia";
import { ref } from "vue";
import type { StockRow } from "@/types";

export const useAlertStore = defineStore("AlertsStore", () => {
  // 定義 State
  const rowIds = ref(new Set<StockRow["id"]>());

  // 定義 Action
  function show(row: StockRow) {
    if (rowIds.value.has(row.id)) {
      return;
    }
    // 注意：加入的是 row.id，而不是整個 row
    rowIds.value.add(row.id);
    alert(`${row.symbol}: ${row.price}`);
  }

  // 必須回傳才能讓外部使用
  return { rowIds, show };
});
