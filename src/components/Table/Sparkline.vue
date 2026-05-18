<script setup lang="ts">
import type { StockRow } from "@/types";
import { getLineStyle } from "@/utils/getLineStyle";

const props = defineProps<{
  row: StockRow;
}>();

// [AI 輔助] 用 AI 協助整理 SVG sparkline 的 min/max 正規化與單點 fallback。
const getSparklinePoints = (trend: number[]): string => {
  const width = 120;
  const height = 32;
  const padding = 3;

  if (trend.length === 0) {
    return "";
  }

  if (trend.length === 1) {
    const y = (height / 2).toFixed(2);
    const startX = padding.toFixed(2);
    const endX = (width - padding).toFixed(2);

    return `${startX},${y} ${endX},${y}`;
  }

  const min = Math.min(...trend);
  const max = Math.max(...trend);
  const range = max - min || 1;
  const xStep = (width - padding * 2) / (trend.length - 1);

  return trend
    .map((value, index) => {
      const x = padding + index * xStep;
      const normalized = (value - min) / range;
      const y = height - padding - normalized * (height - padding * 2);

      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};
</script>

<template>
  <svg
    class="sparkline"
    :class="getLineStyle(row.change)"
    viewBox="0 0 120 32"
    role="img"
    :aria-label="`${row.symbol} recent price trend`"
  >
    <polyline
      :points="getSparklinePoints(row.trend)"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>
