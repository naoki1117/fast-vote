/** 半数以上。3人なら2人、4人なら2人 */
export function majorityNeeded(total: number) {
  if (total <= 0) {
    return 0;
  }
  return Math.ceil(total / 2);
}

export function hasMajority(count: number, total: number) {
  return total > 0 && count >= majorityNeeded(total);
}
