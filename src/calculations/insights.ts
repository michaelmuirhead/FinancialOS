import { Category, Transaction } from "@/types";

function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

function currentMonthIso(): string {
  return new Date().toISOString().slice(0, 7);
}

function normalizeMerchant(merchant: string): string {
  return merchant.toLowerCase().replace(/[#\d]+/g, "").trim();
}

/* ---------- Subscriptions ---------- */

export interface Subscription {
  merchant: string;
  monthlyAmount: number;
  months: number;
  lastDate: string;
  previousAmount?: number;
  priceIncreased: boolean;
}

/**
 * Categories that recur but are not subscriptions — regular bills, staples,
 * and everyday spending. Matched by name so it works for both the demo
 * dataset and Supabase-seeded categories.
 */
const NON_SUBSCRIPTION_CATEGORIES = new Set([
  "housing",
  "utilities",
  "insurance",
  "giving",
  "groceries",
  "gas",
  "restaurants",
  "debt",
  "savings",
  "medical",
  "children",
]);

export function billLikeCategoryIds(categories: Category[]): Set<string> {
  return new Set(
    categories
      .filter((category) =>
        NON_SUBSCRIPTION_CATEGORIES.has(category.name.toLowerCase()),
      )
      .map((category) => category.id),
  );
}

/**
 * A merchant is treated as a subscription when it charges in at least two
 * distinct months, at most once per month, with similar amounts (within
 * 20%). Merchants categorized as regular bills or everyday spending are
 * skipped. A price increase is flagged when the newest charge is more than
 * 5% above the previous one.
 */
export function detectSubscriptions(
  transactions: Transaction[],
  excludeCategoryIds: Set<string> = new Set(),
): Subscription[] {
  const groups = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    if (transaction.transactionType !== "expense") continue;
    if (
      transaction.categoryId != null &&
      excludeCategoryIds.has(transaction.categoryId)
    )
      continue;
    const key = normalizeMerchant(transaction.merchant);
    const list = groups.get(key) ?? [];
    list.push(transaction);
    groups.set(key, list);
  }

  const subscriptions: Subscription[] = [];
  for (const list of groups.values()) {
    const byDate = [...list].sort((a, b) =>
      a.transactionDate.localeCompare(b.transactionDate),
    );
    const months = new Set(byDate.map((t) => monthOf(t.transactionDate)));
    if (months.size < 2) continue;
    // More charges than months means it's a habit, not a subscription.
    if (byDate.length > months.size) continue;

    const amounts = byDate.map((t) => Math.abs(t.amount));
    const latest = amounts[amounts.length - 1];
    const min = Math.min(...amounts);
    const max = Math.max(...amounts);
    if (max > min * 1.2 && max - min > 5) continue;

    const previous = amounts.length > 1 ? amounts[amounts.length - 2] : undefined;
    subscriptions.push({
      merchant: byDate[byDate.length - 1].merchant,
      monthlyAmount: latest,
      months: months.size,
      lastDate: byDate[byDate.length - 1].transactionDate,
      previousAmount: previous,
      priceIncreased:
        previous != null && latest > previous * 1.05 && latest - previous > 0.5,
    });
  }
  return subscriptions.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}

/* ---------- Duplicate charges ---------- */

export interface DuplicateCharge {
  merchant: string;
  amount: number;
  dates: string[];
}

/** Same merchant and amount within a 3-day window — likely double-charged. */
export function findDuplicateCharges(
  transactions: Transaction[],
): DuplicateCharge[] {
  const expenses = transactions
    .filter((t) => t.transactionType === "expense")
    .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

  const duplicates: DuplicateCharge[] = [];
  const reported = new Set<string>();
  for (let i = 0; i < expenses.length; i++) {
    for (let j = i + 1; j < expenses.length; j++) {
      const a = expenses[i];
      const b = expenses[j];
      if (a.merchant !== b.merchant) continue;
      if (Math.abs(a.amount) !== Math.abs(b.amount)) continue;
      const gapDays =
        (new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime()) /
        86_400_000;
      if (gapDays > 3) continue;
      const key = `${a.merchant}|${Math.abs(a.amount)}|${a.transactionDate}`;
      if (reported.has(key)) continue;
      reported.add(key);
      duplicates.push({
        merchant: a.merchant,
        amount: Math.abs(a.amount),
        dates: [a.transactionDate, b.transactionDate],
      });
    }
  }
  return duplicates;
}

/* ---------- Spending anomalies ---------- */

export interface SpendingAnomaly {
  categoryId: string;
  categoryName: string;
  currentSpend: number;
  typicalSpend: number;
  /** e.g. 1.62 = 62% above the trailing average at this point in a month. */
  ratio: number;
}

/**
 * Compares this month's category spending against the trailing three full
 * months' average, pro-rated to the current day of month so mid-month
 * checks don't compare a partial month against full ones.
 */
export function findSpendingAnomalies(
  transactions: Transaction[],
  categories: Category[],
): SpendingAnomaly[] {
  const month = currentMonthIso();
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const monthFraction = dayOfMonth / daysInMonth;

  const anomalies: SpendingAnomaly[] = [];
  for (const category of categories) {
    if (category.kind !== "expense") continue;
    const spendByMonth = new Map<string, number>();
    for (const transaction of transactions) {
      if (transaction.categoryId !== category.id) continue;
      if (transaction.transactionType !== "expense") continue;
      const m = monthOf(transaction.transactionDate);
      spendByMonth.set(
        m,
        (spendByMonth.get(m) ?? 0) + Math.abs(transaction.amount),
      );
    }
    const pastMonths = [...spendByMonth.entries()]
      .filter(([m]) => m < month)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 3);
    if (pastMonths.length === 0) continue;
    const typicalFull =
      pastMonths.reduce((sum, [, value]) => sum + value, 0) / pastMonths.length;
    const typicalToDate = typicalFull * monthFraction;
    const current = spendByMonth.get(month) ?? 0;
    if (typicalToDate < 25) continue;
    const ratio = current / typicalToDate;
    if (ratio >= 1.5 && current - typicalToDate >= 50) {
      anomalies.push({
        categoryId: category.id,
        categoryName: category.name,
        currentSpend: current,
        typicalSpend: typicalToDate,
        ratio,
      });
    }
  }
  return anomalies.sort((a, b) => b.ratio - a.ratio);
}

/* ---------- Large transactions ---------- */

export function findLargeTransactions(
  transactions: Transaction[],
  threshold = 500,
): Transaction[] {
  const month = currentMonthIso();
  return transactions.filter(
    (t) =>
      t.transactionType === "expense" &&
      monthOf(t.transactionDate) === month &&
      Math.abs(t.amount) >= threshold,
  );
}
