import type { StockRow } from "@/types";
export interface Col {
  label: string;
  key: Exclude<keyof StockRow, "id" | "updatedAt">;
  sortable: boolean; //有無排序功能，只有trend不會有
}

export interface SortState {
  key: Exclude<Col["key"], "trend">;
  direction: "asc" | "desc";
}
