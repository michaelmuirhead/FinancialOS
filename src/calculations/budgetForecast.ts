export interface BudgetCategorySummary {
  categoryId: string;
  name: string;
  monthlyTarget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  projectedMonthEnd: number;
}

export function summarizeCategory(
  categoryId: string,
  name: string,
  monthlyTarget: number,
  spent: number,
  dayOfMonth: number,
  daysInMonth: number,
): BudgetCategorySummary {
  const percentUsed = monthlyTarget > 0 ? (spent / monthlyTarget) * 100 : 0;
  const dailyPace = dayOfMonth > 0 ? spent / dayOfMonth : 0;
  return {
    categoryId,
    name,
    monthlyTarget,
    spent,
    remaining: Math.max(0, monthlyTarget - spent),
    percentUsed,
    projectedMonthEnd: dailyPace * daysInMonth,
  };
}

export type BudgetWarningLevel = "ok" | "warning" | "critical" | "over";

export function budgetWarningLevel(percentUsed: number): BudgetWarningLevel {
  if (percentUsed > 100) return "over";
  if (percentUsed >= 90) return "critical";
  if (percentUsed >= 75) return "warning";
  return "ok";
}
