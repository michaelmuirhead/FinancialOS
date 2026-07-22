export type TransactionType = "income" | "expense" | "transfer";

export type TransactionStatus = "pending" | "posted" | "reconciled";

export interface Transaction {
  id: string;
  householdId: string;
  accountId: string;
  transactionDate: string;
  merchant: string;
  description?: string;
  amount: number;
  transactionType: TransactionType;
  categoryId?: string;
  memberName?: string;
  status: TransactionStatus;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  kind: "income" | "expense";
  monthlyTarget?: number;
}
