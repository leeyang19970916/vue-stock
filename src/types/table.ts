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

export type QuetoryResponse = {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
};
