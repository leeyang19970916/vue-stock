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
  const padding = 3; // 留白，避免線條貼死在畫布邊緣被切掉

  if (trend.length === 0) return ""; // 沒資料就不畫

  // 如果只有一筆資料，就直接在畫布正中間畫一條水平的直線
  if (trend.length === 1) {
    const y = (height / 2).toFixed(2);
    const startX = padding.toFixed(2);
    const endX = (width - padding).toFixed(2);

    return `${startX},${y} ${endX},${y}`;
  }

  const min = Math.min(...trend); // 20 筆價格中的最低價
  const max = Math.max(...trend); // 20 筆價格中的最高價
  const range = max - min || 1; // 最高與最低的價差 (加上 || 1 是為了防止價差為 0 時，除以零會報錯)
  const xStep = (width - padding * 2) / (trend.length - 1);

  return trend
    .map((value, index) => {
      // 1. 算 X 座標：目前走到第幾步
      const x = padding + index * xStep;

      // 2. 算 Y 座標的比例 (正規化)
      const normalized = (value - min) / range;

      // 3. 翻轉並映射到畫布上
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
