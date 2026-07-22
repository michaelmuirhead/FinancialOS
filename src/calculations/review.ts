import {
  Account,
  BillOccurrence,
  Category,
  Debt,
  Goal,
  HouseholdRules,
  Transaction,
} from "@/types";
import { netWorthFromAccounts, withCurrentMonth } from "./netWorth";
import { orderDebtsByStrategy, projectPayoff } from "./debtPayoff";
import {
  billLikeCategoryIds,
  detectSubscriptions,
  findSpendingAnomalies,
} from "./insights";

export type ReviewStatus = "good" | "warn" | "action";

export interface ReviewItem {
  id: string;
  question: string;
  status: ReviewStatus;
  detail: string;
}

export interface ActionItem {
  text: string;
  link?: string;
}

export interface MonthlyReview {
  monthLabel: string;
  checklist: ReviewItem[];
  actionPlan: ActionItem[];
  stats: {
    income: number;
    spending: number;
    net: number;
    netWorthChange: number;
  };
}

export interface ReviewInput {
  transactions: Transaction[];
  occurrences: BillOccurrence[];
  accounts: Account[];
  categories: Category[];
  goals: Goal[];
  debts: Debt[];
  rules: HouseholdRules;
  netWorthHistory: { month: string; netWorth: number }[];
}

const money = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export function buildMonthlyReview(input: ReviewInput): MonthlyReview {
  const month = new Date().toISOString().slice(0, 7);
  const monthTx = input.transactions.filter((t) =>
    t.transactionDate.startsWith(month),
  );
  const checklist: ReviewItem[] = [];
  const actionPlan: ActionItem[] = [];

  // 1. Was all income recorded?
  const income = monthTx
    .filter((t) => t.transactionType === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  checklist.push({
    id: "income",
    question: "Was all income recorded?",
    status: income > 0 ? "good" : "action",
    detail:
      income > 0
        ? `${money(income)} recorded this month.`
        : "No income recorded yet this month — record paychecks as they arrive.",
  });
  if (income === 0) {
    actionPlan.push({
      text: "Record this month's paychecks so income and safe-to-spend are accurate.",
      link: "/paychecks",
    });
  }

  // 2. Were all accounts reconciled?
  const unreconciled = input.transactions.filter(
    (t) => t.status !== "reconciled",
  ).length;
  checklist.push({
    id: "reconciled",
    question: "Were all accounts reconciled?",
    status: unreconciled === 0 ? "good" : unreconciled <= 5 ? "warn" : "action",
    detail:
      unreconciled === 0
        ? "Every transaction is reconciled against statements."
        : `${unreconciled} transaction${unreconciled === 1 ? "" : "s"} not yet reconciled.`,
  });
  if (unreconciled > 0) {
    actionPlan.push({
      text: `Reconcile ${unreconciled} outstanding transaction${unreconciled === 1 ? "" : "s"} against your statements.`,
      link: "/transactions",
    });
  }

  // 3. Were all bills paid?
  const monthBills = input.occurrences.filter((o) =>
    o.dueDate.startsWith(month),
  );
  const overdue = input.occurrences.filter((o) => o.status === "overdue");
  const unpaid = monthBills.filter(
    (o) => o.status !== "paid" && o.status !== "skipped",
  );
  checklist.push({
    id: "bills",
    question: "Were all bills paid?",
    status:
      overdue.length > 0 ? "action" : unpaid.length > 0 ? "warn" : "good",
    detail:
      overdue.length > 0
        ? `${overdue.length} bill${overdue.length === 1 ? " is" : "s are"} overdue.`
        : unpaid.length > 0
          ? `${unpaid.length} bill${unpaid.length === 1 ? "" : "s"} still due this month.`
          : "Every bill due this month is paid.",
  });
  for (const occurrence of overdue) {
    actionPlan.push({
      text: `Pay the overdue ${occurrence.name} bill (${money(occurrence.expectedAmount)}).`,
      link: "/bills",
    });
  }

  // 4. Which categories exceeded budget?
  const overBudget = input.categories
    .filter((category) => category.kind === "expense" && category.monthlyTarget)
    .map((category) => {
      const spent = monthTx
        .filter(
          (t) =>
            t.categoryId === category.id && t.transactionType === "expense",
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return { category, spent, over: spent - (category.monthlyTarget ?? 0) };
    })
    .filter((row) => row.over > 0)
    .sort((a, b) => b.over - a.over);
  checklist.push({
    id: "budget",
    question: "Which categories exceeded budget?",
    status:
      overBudget.length === 0 ? "good" : overBudget.length <= 1 ? "warn" : "action",
    detail:
      overBudget.length === 0
        ? "No category is over budget."
        : overBudget
            .map(
              (row) =>
                `${row.category.name} is ${money(row.over)} over its ${money(row.category.monthlyTarget ?? 0)} target`,
            )
            .join("; ") + ".",
  });
  for (const row of overBudget.slice(0, 2)) {
    actionPlan.push({
      text: `Reduce ${row.category.name.toLowerCase()} spending by ${money(Math.ceil(row.over / 10) * 10)} next month.`,
      link: "/budget",
    });
  }

  // Spending anomalies feed the same question as advisory context.
  const anomalies = findSpendingAnomalies(input.transactions, input.categories);
  for (const anomaly of anomalies.slice(0, 1)) {
    actionPlan.push({
      text: `Review ${anomaly.categoryName.toLowerCase()} — pace is ${Math.round((anomaly.ratio - 1) * 100)}% above your three-month norm.`,
      link: "/transactions",
    });
  }

  // 5. Did debt decrease?
  const debtPayments = monthTx
    .filter(
      (t) => t.categoryId === "cat-debt" && t.transactionType === "expense",
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalDebt = input.debts.reduce(
    (sum, debt) => sum + debt.currentBalance,
    0,
  );
  checklist.push({
    id: "debt",
    question: "Did debt decrease?",
    status: debtPayments > 0 ? "good" : "warn",
    detail:
      debtPayments > 0
        ? `${money(debtPayments)} in debt payments recorded; ${money(totalDebt)} remains.`
        : `No debt payments recorded this month; ${money(totalDebt)} outstanding.`,
  });
  const focus = orderDebtsByStrategy(
    input.debts.filter((debt) => debt.debtType === "credit_card"),
    "avalanche",
  )[0];
  if (focus) {
    const withExtra = projectPayoff(input.debts, 250, "avalanche");
    const baseline = projectPayoff(input.debts, 0, "avalanche");
    const saved = Math.max(0, baseline.totalInterest - withExtra.totalInterest);
    actionPlan.push({
      text: `Apply an extra ${money(250)} to ${focus.name} (${focus.annualInterestRate.toFixed(2)}% APR) — about ${money(saved)} less interest over the payoff.`,
      link: "/debt",
    });
  }

  // 6. Did savings increase?
  const savingsMoved = monthTx
    .filter(
      (t) => t.categoryId === "cat-savings" || t.transactionType === "transfer",
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  checklist.push({
    id: "savings",
    question: "Did savings increase?",
    status: savingsMoved > 0 ? "good" : "warn",
    detail:
      savingsMoved > 0
        ? `${money(savingsMoved)} moved to savings this month.`
        : "No savings transfers recorded this month.",
  });
  const emergency = input.goals.find(
    (goal) => goal.goalType === "emergency_fund",
  );
  if (emergency && emergency.currentAmount < emergency.targetAmount) {
    const suggested = emergency.monthlyContribution ?? 300;
    actionPlan.push({
      text: `Transfer ${money(suggested)} to the emergency fund (${money(emergency.currentAmount)} of ${money(emergency.targetAmount)} funded).`,
      link: "/goals",
    });
  }

  // 7. Did net worth improve?
  const { netWorth } = netWorthFromAccounts(input.accounts);
  const history = withCurrentMonth(input.netWorthHistory, netWorth);
  const previous = history[history.length - 2];
  const netWorthChange = previous ? netWorth - previous.netWorth : 0;
  checklist.push({
    id: "networth",
    question: "Did net worth improve?",
    status: netWorthChange >= 0 ? "good" : "warn",
    detail: `${netWorthChange >= 0 ? "Up" : "Down"} ${money(Math.abs(netWorthChange))} versus last month (now ${money(netWorth)}).`,
  });

  // Subscription hygiene
  const subscriptions = detectSubscriptions(
    input.transactions,
    billLikeCategoryIds(input.categories),
  );
  if (subscriptions.length > 0) {
    const total = subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0);
    actionPlan.push({
      text: `Review ${subscriptions.length} detected subscription${subscriptions.length === 1 ? "" : "s"} (${money(total)}/month) and cancel any that went unused.`,
      link: "/reports",
    });
  }

  const spending = monthTx
    .filter((t) => t.transactionType === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    monthLabel: new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    checklist,
    actionPlan: actionPlan.slice(0, 6),
    stats: {
      income,
      spending,
      net: income - spending,
      netWorthChange,
    },
  };
}
