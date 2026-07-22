import {
  Account,
  BillOccurrence,
  Category,
  Debt,
  FinancialAlert,
  Goal,
  HouseholdRules,
  Transaction,
} from "@/types";
import { calculateUtilization } from "./debtPayoff";
import {
  billLikeCategoryIds,
  detectSubscriptions,
  findDuplicateCharges,
  findSpendingAnomalies,
} from "./insights";
import { emergencyFundCoverageMonths } from "./sinkingFunds";

export interface AlertEngineInput {
  accounts: Account[];
  debts: Debt[];
  occurrences: BillOccurrence[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  rules: HouseholdRules;
}

const EMERGENCY_TARGET_MONTHS = 3;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The automated financial watchdog: derives every alert from current data
 * on each load, so the panel always reflects reality instead of a stored
 * list that can go stale.
 */
export function generateAlerts(input: AlertEngineInput): FinancialAlert[] {
  const alerts: FinancialAlert[] = [];
  const now = today();
  const month = now.slice(0, 7);

  // Credit utilization above the household threshold
  for (const debt of input.debts) {
    if (!debt.creditLimit || debt.creditLimit <= 0) continue;
    const utilization = calculateUtilization(
      debt.currentBalance,
      debt.creditLimit,
    );
    if (utilization > input.rules.utilizationWarningPercent) {
      const targetBalance =
        (input.rules.utilizationWarningPercent / 100) * debt.creditLimit;
      const payDown = Math.ceil(debt.currentBalance - targetBalance);
      alerts.push({
        id: `utilization-${debt.id}`,
        priority: utilization > 50 ? "urgent" : "attention",
        title: `${debt.name} utilization is ${Math.round(utilization)}%`,
        detail: `Above your ${input.rules.utilizationWarningPercent}% threshold. Paying $${payDown.toLocaleString()} brings it under.`,
        createdAt: now,
      });
    }
  }

  // Overdue and due-soon bills
  for (const occurrence of input.occurrences) {
    if (occurrence.status === "overdue") {
      alerts.push({
        id: `overdue-${occurrence.id}`,
        priority: "urgent",
        title: `${occurrence.name} is overdue`,
        detail: `Was due ${occurrence.dueDate} · $${occurrence.expectedAmount.toLocaleString()}.`,
        createdAt: now,
      });
    } else if (occurrence.status === "due_soon" && !occurrence.autopay) {
      alerts.push({
        id: `due-soon-${occurrence.id}`,
        priority: "attention",
        title: `${occurrence.name} due ${occurrence.dueDate}`,
        detail: `$${occurrence.expectedAmount.toLocaleString()} — no auto-pay on this bill.`,
        createdAt: now,
      });
    }
  }

  // Bill paid materially above its expected amount (>10% and >$10)
  for (const occurrence of input.occurrences) {
    if (occurrence.status !== "paid" || occurrence.actualAmount == null) continue;
    const variance = occurrence.actualAmount - occurrence.expectedAmount;
    if (variance > 10 && variance > occurrence.expectedAmount * 0.1) {
      alerts.push({
        id: `variance-${occurrence.id}`,
        priority: "info",
        title: `${occurrence.name} was $${Math.round(variance)} above expected`,
        detail: `Paid $${occurrence.actualAmount.toLocaleString()} vs. expected $${occurrence.expectedAmount.toLocaleString()}.`,
        createdAt: now,
      });
    }
  }

  // Budget categories at or over their warning thresholds
  for (const category of input.categories) {
    if (category.kind !== "expense" || !category.monthlyTarget) continue;
    const spent = input.transactions
      .filter(
        (t) =>
          t.categoryId === category.id &&
          t.transactionType === "expense" &&
          t.transactionDate.slice(0, 7) === month,
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const percent = (spent / category.monthlyTarget) * 100;
    if (percent > 100) {
      alerts.push({
        id: `budget-over-${category.id}`,
        priority: "urgent",
        title: `${category.name} budget exceeded`,
        detail: `$${Math.round(spent).toLocaleString()} spent of $${category.monthlyTarget.toLocaleString()} (${Math.round(percent)}%).`,
        createdAt: now,
      });
    } else if (percent >= 75) {
      alerts.push({
        id: `budget-warn-${category.id}`,
        priority: "attention",
        title: `${category.name} budget at ${Math.round(percent)}%`,
        detail: `$${Math.round(spent).toLocaleString()} of $${category.monthlyTarget.toLocaleString()} used.`,
        createdAt: now,
      });
    }
  }

  // Safe-to-spend accounts sitting below the required buffer
  const spendableBalance = input.accounts
    .filter((account) => account.isActive && account.includeInSafeToSpend)
    .reduce(
      (sum, account) =>
        sum + (account.availableBalance ?? account.currentBalance),
      0,
    );
  if (spendableBalance < input.rules.minimumCheckingBuffer) {
    alerts.push({
      id: "low-checking",
      priority: "urgent",
      title: "Checking below minimum buffer",
      detail: `$${Math.round(spendableBalance).toLocaleString()} available vs. your $${input.rules.minimumCheckingBuffer.toLocaleString()} buffer.`,
      createdAt: now,
    });
  }

  // Emergency fund coverage below target
  const emergency = input.goals.find(
    (goal) => goal.goalType === "emergency_fund",
  );
  if (emergency && emergency.currentAmount < emergency.targetAmount) {
    const essentials = emergency.targetAmount / EMERGENCY_TARGET_MONTHS;
    const coverage = emergencyFundCoverageMonths(
      emergency.currentAmount,
      essentials,
    );
    alerts.push({
      id: "emergency-fund",
      priority: "info",
      title: `Emergency fund at ${coverage.toFixed(1)} months of coverage`,
      detail: `Target is ${EMERGENCY_TARGET_MONTHS} months ($${emergency.targetAmount.toLocaleString()}).`,
      createdAt: now,
    });
  }

  // Spending pace anomalies vs. the trailing three-month average
  for (const anomaly of findSpendingAnomalies(
    input.transactions,
    input.categories,
  )) {
    alerts.push({
      id: `anomaly-${anomaly.categoryId}`,
      priority: "attention",
      title: `Unusual ${anomaly.categoryName.toLowerCase()} spending`,
      detail: `$${Math.round(anomaly.currentSpend).toLocaleString()} so far this month vs. a typical $${Math.round(anomaly.typicalSpend).toLocaleString()} by this point (${Math.round((anomaly.ratio - 1) * 100)}% above normal).`,
      createdAt: now,
    });
  }

  // Possible duplicate charges
  for (const duplicate of findDuplicateCharges(input.transactions)) {
    alerts.push({
      id: `duplicate-${duplicate.merchant}-${duplicate.dates[0]}`,
      priority: "attention",
      title: `Possible duplicate charge at ${duplicate.merchant}`,
      detail: `$${duplicate.amount.toLocaleString()} charged on ${duplicate.dates.join(" and ")}.`,
      createdAt: now,
    });
  }

  // Subscription price increases
  for (const subscription of detectSubscriptions(
    input.transactions,
    billLikeCategoryIds(input.categories),
  )) {
    if (!subscription.priceIncreased || subscription.previousAmount == null)
      continue;
    alerts.push({
      id: `sub-increase-${subscription.merchant}`,
      priority: "info",
      title: `${subscription.merchant} price increased`,
      detail: `Now $${subscription.monthlyAmount.toFixed(2)}/month, up from $${subscription.previousAmount.toFixed(2)}.`,
      createdAt: now,
    });
  }

  const priorityRank = { urgent: 0, attention: 1, info: 2 } as const;
  return alerts.sort(
    (a, b) => priorityRank[a.priority] - priorityRank[b.priority],
  );
}
