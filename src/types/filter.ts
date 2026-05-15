import type { MOCK_SYMBOLS } from "@/constants";

export interface SymbolOpt {
  label: (typeof MOCK_SYMBOLS)[number] | "ALL";
  value: (typeof MOCK_SYMBOLS)[number] | undefined;
}

export interface SearchForm {
  symbol: SymbolOpt["value"];
}
