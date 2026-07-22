import {
  BillOccurrence,
  Debt,
  FinancialAlert,
  Goal,
  Paycheck,
  Transaction,
} from "@/types";
import {
  buildCashFlowSeries,
  calculateSafeToSpend,
  CashFlowPoint,
  generateAlerts,
  netWorthFromAccounts,
  withCurrentMonth,
} from "@/calculations";
import { LIQUID_ACCOUNT_TYPES } from "@/types";
import {
  fetchAccounts,
  fetchBillOccurrences,
  fetchCategories,
  fetchDebts,
  fetchGoals,
  fetchNetWorthHistory,
  fetchPaychecks,
  fetchRules,
  fetchTransactions,
} from "./dataService";

export interface DashboardSummary {
  totalCash: number;
  monthlyIncome: number;
  billsTotal: number;
  billsPaid: number;
  billsRemaining: number;
  billsPercentComplete: number;
  safeToSpend: number;
  netWorth: number;
  netWorthChangeMonth: number;
  upcomingBills: BillOccurrence[];
  alerts: FinancialAlert[];
  budgetUsagePercent: number;
  cashFlow: CashFlowPoint[];
  paychecks: Paycheck[];
  debts: Debt[];
  goals: Goal[];
  netWorthHistory: { month: string; netWorth: number }[];
  monthlySpending: number;
}

function isThisMonth(iso: string): boolean {
  return iso.slice(0, 7) === new Date().toISOString().slice(0, 7);
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    accounts,
    occurrences,
    transactions,
    debts,
    goals,
    paychecks,
    categories,
    rules,
    netWorthHistory,
  ] = await Promise.all([
    fetchAccounts(),
    fetchBillOccurrences(),
    fetchTransactions(),
    fetchDebts(),
    fetchGoals(),
    fetchPaychecks(),
    fetchCategories(),
    fetchRules(),
    fetchNetWorthHistory(),
  ]);

  const alerts = generateAlerts({
    accounts,
    debts,
    occurrences,
    categories,
    transactions,
    goals,
    rules,
  });

  const totalCash = accounts
    .filter(
      (account) =>
        account.isActive && LIQUID_ACCOUNT_TYPES.includes(account.accountType),
    )
    .reduce((sum, account) => sum + account.currentBalance, 0);

  const monthTransactions = transactions.filter((t: Transaction) =>
    isThisMonth(t.transactionDate),
  );
  const monthlyIncome = monthTransactions
    .filter((t) => t.transactionType === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlySpending = monthTransactions
    .filter((t) => t.transactionType === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const monthOccurrences = occurrences.filter((o) => isThisMonth(o.dueDate));
  const billsTotal = monthOccurrences.reduce(
    (sum, o) => sum + (o.actualAmount ?? o.expectedAmount),
    0,
  );
  const billsPaid = monthOccurrences
    .filter((o) => o.status === "paid")
    .reduce((sum, o) => sum + (o.actualAmount ?? o.expectedAmount), 0);
  const billsRemaining = billsTotal - billsPaid;

  const nextPayday = paychecks
    .map((p) => p.payDate)
    .sort()
    .find((d) => d >= new Date().toISOString().slice(0, 10));

  const unpaidBeforePayday = occurrences
    .filter(
      (o) =>
        o.status !== "paid" &&
        o.status !== "skipped" &&
        (!nextPayday || o.dueDate <= nextPayday),
    )
    .reduce((sum, o) => sum + o.expectedAmount, 0);

  const checkingAvailable = accounts
    .filter((account) => account.isActive && account.includeInSafeToSpend)
    .reduce(
      (sum, account) =>
        sum + (account.availableBalance ?? account.currentBalance),
      0,
    );

  const plannedSavings = goals.reduce(
    (sum, goal) => sum + (goal.monthlyContribution ?? 0),
    0,
  );
  const plannedDebtPayments = debts
    .filter((debt) => debt.debtType === "credit_card")
    .reduce((sum, debt) => sum + debt.minimumPayment, 0);

  const safeToSpend = calculateSafeToSpend({
    availableChecking: checkingAvailable,
    unpaidBillsBeforeNextPayday: unpaidBeforePayday,
    plannedDebtPayments,
    plannedSavingsTransfers: Math.min(plannedSavings, 500),
    reservedFunds: 0,
    minimumBuffer: rules.minimumCheckingBuffer,
  });

  const { netWorth } = netWorthFromAccounts(accounts);
  const history = withCurrentMonth(netWorthHistory, netWorth);
  const previousMonth = history[history.length - 2];
  const netWorthChangeMonth = previousMonth
    ? netWorth - previousMonth.netWorth
    : 0;

  const upcomingBills = occurrences
    .filter((o) => o.status !== "paid" && o.status !== "skipped")
    .slice(0, 6);

  const cashFlow = buildCashFlowSeries(
    totalCash,
    transactions,
    occurrences,
    paychecks,
  );

  const budgetUsagePercent =
    billsTotal > 0 ? Math.min(100, (billsPaid / billsTotal) * 100) : 0;

  return {
    totalCash,
    monthlyIncome,
    billsTotal,
    billsPaid,
    billsRemaining,
    billsPercentComplete:
      billsTotal > 0 ? Math.round((billsPaid / billsTotal) * 100) : 0,
    safeToSpend,
    netWorth,
    netWorthChangeMonth,
    upcomingBills,
    alerts,
    budgetUsagePercent,
    cashFlow,
    paychecks,
    debts,
    goals,
    netWorthHistory: history,
    monthlySpending,
  };
}
