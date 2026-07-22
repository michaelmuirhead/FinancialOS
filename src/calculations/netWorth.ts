import { Account, isLiabilityAccount } from "@/types";

export function calculateNetWorth(
  assets: number[],
  liabilities: number[],
): number {
  const totalAssets = assets.reduce((sum, value) => sum + value, 0);
  const totalLiabilities = liabilities.reduce((sum, value) => sum + value, 0);
  return totalAssets - totalLiabilities;
}

export interface NetWorthBreakdown {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
}

/**
 * Ensures the history series ends with the live computed net worth for the
 * current month, replacing any stale stored snapshot for this month.
 */
export function withCurrentMonth(
  history: { month: string; netWorth: number }[],
  currentNetWorth: number,
): { month: string; netWorth: number }[] {
  const month = new Date().toISOString().slice(0, 7);
  return [
    ...history.filter((point) => point.month !== month),
    { month, netWorth: currentNetWorth },
  ].sort((a, b) => a.month.localeCompare(b.month));
}

export function netWorthFromAccounts(accounts: Account[]): NetWorthBreakdown {
  const included = accounts.filter(
    (account) => account.isActive && account.includeInNetWorth,
  );
  const totalAssets = included
    .filter((account) => !isLiabilityAccount(account))
    .reduce((sum, account) => sum + account.currentBalance, 0);
  const totalLiabilities = included
    .filter(isLiabilityAccount)
    .reduce((sum, account) => sum + Math.abs(account.currentBalance), 0);
  return {
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}
