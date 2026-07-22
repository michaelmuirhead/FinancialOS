export function requiredMonthlyContribution(
  targetAmount: number,
  currentAmount: number,
  monthsRemaining: number,
): number {
  if (monthsRemaining <= 0) {
    return Math.max(0, targetAmount - currentAmount);
  }
  return Math.max(0, (targetAmount - currentAmount) / monthsRemaining);
}

export function monthsBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth())
  );
}

export function goalProgressPercent(
  currentAmount: number,
  targetAmount: number,
): number {
  if (targetAmount <= 0) return 0;
  return Math.min(100, (currentAmount / targetAmount) * 100);
}

export function emergencyFundCoverageMonths(
  currentAmount: number,
  essentialMonthlyExpenses: number,
): number {
  if (essentialMonthlyExpenses <= 0) return 0;
  return currentAmount / essentialMonthlyExpenses;
}
