import type { StockRow } from "@/types";

export const getLineStyle = (
  val: StockRow["change"] | StockRow["changePct"]
): string => {
  if (val > 0) {
    return "is-positive";
  }
  if (val < 0) {
    return "is-negative";
  }
  return "is-neutral";
};
