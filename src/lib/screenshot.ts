import { Account, Transaction } from "@/types";

/**
 * The extraction contract shared between the app and the
 * extract-screenshot Edge Function. The function constrains Claude's
 * response to exactly this shape via a structured-output JSON schema.
 */
export interface ExtractedBalance {
  accountName: string;
  lastFour?: string;
  balance: number;
}

export interface ExtractedBill {
  name: string;
  amount: number;
  /** ISO date when visible in the screenshot. */
  dueDate?: string;
  autopay?: boolean;
}

export interface ExtractedTransaction {
  /** ISO date. */
  date: string;
  merchant: string;
  /** Signed: expenses negative, income positive. */
  amount: number;
}

export interface ScreenshotExtraction {
  balances: ExtractedBalance[];
  bills: ExtractedBill[];
  transactions: ExtractedTransaction[];
  /** One line describing what the screenshot appears to be. */
  sourceDescription?: string;
}

/**
 * Matches an extracted balance to an existing account: last-four digits
 * win, then case-insensitive name containment in either direction.
 */
export function matchAccount(
  extracted: ExtractedBalance,
  accounts: Account[],
): Account | undefined {
  if (extracted.lastFour) {
    const byDigits = accounts.find(
      (account) => account.lastFour === extracted.lastFour,
    );
    if (byDigits) return byDigits;
  }
  const name = extracted.accountName.toLowerCase().trim();
  if (!name) return undefined;
  return accounts.find((account) => {
    const candidate = account.name.toLowerCase();
    return candidate.includes(name) || name.includes(candidate);
  });
}

export function dueDayFromDate(iso: string | undefined): number {
  if (!iso) return 1;
  const day = Number(iso.slice(8, 10));
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : 1;
}

export function transactionKey(
  date: string,
  amount: number,
  merchant: string,
): string {
  return `${date}|${Math.abs(amount).toFixed(2)}|${merchant.toLowerCase().trim()}`;
}

export function findDuplicateTransactions(
  extracted: ExtractedTransaction[],
  existing: Transaction[],
): Set<number> {
  const existingKeys = new Set(
    existing.map((t) =>
      transactionKey(t.transactionDate, t.amount, t.merchant),
    ),
  );
  const duplicates = new Set<number>();
  const seen = new Set<string>();
  extracted.forEach((transaction, index) => {
    const key = transactionKey(
      transaction.date,
      transaction.amount,
      transaction.merchant,
    );
    if (existingKeys.has(key) || seen.has(key)) duplicates.add(index);
    seen.add(key);
  });
  return duplicates;
}

/** Sample extraction used to preview the flow in demo mode. */
export const sampleExtraction: ScreenshotExtraction = {
  sourceDescription: "Sample bank app screenshot (demo preview)",
  balances: [
    { accountName: "Primary Checking", lastFour: "4821", balance: 2643.17 },
    { accountName: "Rewards Card", lastFour: "7008", balance: 412.55 },
  ],
  bills: [
    { name: "Spotify", amount: 11.99, dueDate: isoDaysAhead(6), autopay: true },
    { name: "Car Insurance", amount: 182.4, dueDate: isoDaysAhead(11) },
  ],
  transactions: [
    { date: isoDaysAhead(-1), merchant: "Target", amount: -54.23 },
    { date: isoDaysAhead(-2), merchant: "Chevron", amount: -47.1 },
    { date: isoDaysAhead(-3), merchant: "Payroll Deposit", amount: 1250 },
  ],
};

function isoDaysAhead(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
