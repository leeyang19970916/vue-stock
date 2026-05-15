import type { MOCK_SYMBOLS } from "@/constants";
// type StockRow = {
//   id: number;
//   symbol: string;
//   price: number;
//   change: number;
//   changePct: number;
//   volume: number;
//   trend: number[];
//   updatedAt: number;
// };
export interface StockRow {
  id: number;
  symbol: (typeof MOCK_SYMBOLS)[number]; //原本是string
  price: number;
  change: number;
  changePct: number;
  volume: number;
  trend: number[];
  updatedAt: number;
}
