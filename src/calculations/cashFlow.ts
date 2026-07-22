import { BillOccurrence, Paycheck, Transaction } from "@/types";

export interface CashFlowPoint {
  date: string;
  income: number;
  expenses: number;
  runningBalance: number;
  forecast?: boolean;
}

/**
 * Builds a daily cash-flow series from posted transactions, then extends
 * it with a forecast built from scheduled paychecks and unpaid bills.
 *
 * `currentBalance` is today's actual balance: the historical portion is
 * anchored so the series passes through exactly that value today, and the
 * forecast continues forward from it.
 */
export function buildCashFlowSeries(
  currentBalance: number,
  transactions: Transaction[],
  upcomingBills: BillOccurrence[],
  upcomingPaychecks: Paycheck[],
  daysBack = 30,
  daysForward = 30,
): CashFlowPoint[] {
  const today = new Date();
  const points: CashFlowPoint[] = [];

  const byDate = (iso: string) =>
    transactions.filter((t) => t.transactionDate === iso);

  const dayNets: { iso: string; income: number; expenses: number }[] = [];
  for (let i = daysBack; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const iso = day.toISOString().slice(0, 10);
    const dayTx = byDate(iso);
    const income = dayTx
      .filter((t) => t.transactionType === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = dayTx
      .filter((t) => t.transactionType === "expense")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    dayNets.push({ iso, income, expenses });
  }

  const totalPastNet = dayNets.reduce(
    (sum, day) => sum + day.income - day.expenses,
    0,
  );
  let balance = currentBalance - totalPastNet;

  for (const day of dayNets) {
    balance += day.income - day.expenses;
    points.push({
      date: day.iso,
      income: day.income,
      expenses: day.expenses,
      runningBalance: balance,
    });
  }

  for (let i = 1; i <= daysForward; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() + i);
    const iso = day.toISOString().slice(0, 10);
    const income = upcomingPaychecks
      .filter((p) => p.payDate === iso)
      .reduce((sum, p) => sum + p.netAmount, 0);
    const expenses = upcomingBills
      .filter(
        (b) =>
          b.dueDate === iso && b.status !== "paid" && b.status !== "skipped",
      )
      .reduce((sum, b) => sum + b.expectedAmount, 0);
    balance += income - expenses;
    points.push({
      date: iso,
      income,
      expenses,
      runningBalance: balance,
      forecast: true,
    });
  }

  return points;
}

export interface BufferWarning {
  date: string;
  projectedBalance: number;
}

export function findBufferBreach(
  series: CashFlowPoint[],
  minimumBuffer: number,
): BufferWarning | undefined {
  const breach = series.find(
    (point) => point.forecast && point.runningBalance < minimumBuffer,
  );
  if (!breach) return undefined;
  return { date: breach.date, projectedBalance: breach.runningBalance };
}

export function lowestForecastBalance(series: CashFlowPoint[]): number {
  const forecast = series.filter((point) => point.forecast);
  if (forecast.length === 0) return 0;
  return Math.min(...forecast.map((point) => point.runningBalance));
}
