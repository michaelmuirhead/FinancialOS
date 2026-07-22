import { Debt, PayoffStrategy } from "@/types";

export function calculateUtilization(
  balance: number,
  creditLimit: number,
): number {
  if (creditLimit <= 0) return 0;
  return (balance / creditLimit) * 100;
}

export function orderDebtsByStrategy(
  debts: Debt[],
  strategy: PayoffStrategy,
): Debt[] {
  const ordered = [...debts];
  switch (strategy) {
    case "snowball":
      return ordered.sort((a, b) => a.currentBalance - b.currentBalance);
    case "avalanche":
      return ordered.sort(
        (a, b) => b.annualInterestRate - a.annualInterestRate,
      );
    case "utilization":
      return ordered.sort(
        (a, b) =>
          calculateUtilization(b.currentBalance, b.creditLimit ?? 0) -
          calculateUtilization(a.currentBalance, a.creditLimit ?? 0),
      );
    case "custom":
      return ordered.sort(
        (a, b) =>
          (a.payoffPriority ?? Number.MAX_SAFE_INTEGER) -
          (b.payoffPriority ?? Number.MAX_SAFE_INTEGER),
      );
  }
}

export interface PayoffProjection {
  months: number;
  totalInterest: number;
  debtFreeDate: string;
}

/**
 * Simulates month-by-month payoff of every debt using the given strategy,
 * rolling freed-up minimum payments plus the extra payment into the
 * focus debt (standard snowball/avalanche mechanics).
 */
export function projectPayoff(
  debts: Debt[],
  extraMonthlyPayment: number,
  strategy: PayoffStrategy,
  maxMonths = 600,
): PayoffProjection {
  const balances = new Map(
    debts.map((debt) => [debt.id, debt.currentBalance]),
  );
  let totalInterest = 0;
  let months = 0;

  while (months < maxMonths) {
    const remaining = debts.filter((d) => (balances.get(d.id) ?? 0) > 0.005);
    if (remaining.length === 0) break;
    months += 1;

    for (const debt of remaining) {
      const balance = balances.get(debt.id) ?? 0;
      const interest = (balance * debt.annualInterestRate) / 100 / 12;
      totalInterest += interest;
      balances.set(debt.id, balance + interest);
    }

    let budget =
      remaining.reduce((sum, d) => sum + d.minimumPayment, 0) +
      extraMonthlyPayment;

    for (const debt of orderDebtsByStrategy(remaining, strategy)) {
      if (budget <= 0) break;
      const balance = balances.get(debt.id) ?? 0;
      const payment = Math.min(balance, budget);
      balances.set(debt.id, balance - payment);
      budget -= payment;
    }
  }

  const debtFree = new Date();
  debtFree.setMonth(debtFree.getMonth() + months);
  return {
    months,
    totalInterest: Math.round(totalInterest * 100) / 100,
    debtFreeDate: debtFree.toISOString().slice(0, 10),
  };
}
