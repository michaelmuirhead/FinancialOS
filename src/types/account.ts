export type AccountType =
  | "checking"
  | "savings"
  | "credit_card"
  | "mortgage"
  | "auto_loan"
  | "retirement"
  | "investment"
  | "529"
  | "cash"
  | "other";

export interface Account {
  id: string;
  householdId: string;
  name: string;
  institution?: string;
  accountType: AccountType;
  lastFour?: string;
  currentBalance: number;
  availableBalance?: number;
  creditLimit?: number;
  interestRate?: number;
  includeInSafeToSpend: boolean;
  includeInNetWorth: boolean;
  isActive: boolean;
}

export const ASSET_ACCOUNT_TYPES: AccountType[] = [
  "checking",
  "savings",
  "retirement",
  "investment",
  "529",
  "cash",
  "other",
];

export const LIABILITY_ACCOUNT_TYPES: AccountType[] = [
  "credit_card",
  "mortgage",
  "auto_loan",
];

export const LIQUID_ACCOUNT_TYPES: AccountType[] = [
  "checking",
  "savings",
  "cash",
];

export function isLiabilityAccount(account: Account): boolean {
  return LIABILITY_ACCOUNT_TYPES.includes(account.accountType);
}
