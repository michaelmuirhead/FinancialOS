export type DebtType =
  | "credit_card"
  | "auto_loan"
  | "mortgage"
  | "personal_loan"
  | "medical"
  | "bnpl"
  | "other";

export interface Debt {
  id: string;
  householdId: string;
  accountId?: string;
  name: string;
  debtType: DebtType;
  originalBalance?: number;
  currentBalance: number;
  minimumPayment: number;
  annualInterestRate: number;
  creditLimit?: number;
  dueDay?: number;
  payoffPriority?: number;
}

export type PayoffStrategy = "snowball" | "avalanche" | "utilization" | "custom";
