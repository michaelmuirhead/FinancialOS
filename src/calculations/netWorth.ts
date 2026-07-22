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
