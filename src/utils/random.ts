// [AI 輔助] 隨機產生數值 min<=x<=max
export const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// [AI 輔助] 隨機產生數值 min<=x<max
export const randomFloat = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

/**
 * [AI輔助] 隨機抽取要更新的股票索引
 *
 * - 做了什麼事情：
 *   建立一個 Set，並在 while 迴圈中持續呼叫 `randomInt` 隨機產生介於 0 到總列數之間的索引，
 *   利用 Set 天然去重的特性，直到收集到足夠數量或達到陣列長度上限為止。
 *
 * - 完成了什麼事情：
 *   安全且不重複地挑選出本次 tick 要被更新的股票陣列索引，避免同一支股票在同一次更新中被選中兩次。
 */
export const getRandomRowIndexes = (
  rowCount: number,
  updateCount: number
): Set<number> => {
  const indexes = new Set<number>();

  while (indexes.size < updateCount && indexes.size < rowCount) {
    indexes.add(randomInt(0, rowCount - 1));
  }

  return indexes;
};
