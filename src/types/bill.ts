export type BillFrequency =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "annually";

export type BillStatus =
  | "scheduled"
  | "due_soon"
  | "paid"
  | "overdue"
  | "skipped";

export interface Bill {
  id: string;
  householdId: string;
  name: string;
  categoryId?: string;
  expectedAmount: number;
  dueDay: number;
  frequency: BillFrequency;
  autopay: boolean;
  paymentAccountId?: string;
  isActive: boolean;
  notes?: string;
}

export interface BillOccurrence {
  id: string;
  billId: string;
  name: string;
  dueDate: string;
  expectedAmount: number;
  actualAmount?: number;
  status: BillStatus;
  autopay: boolean;
  paymentAccountId?: string;
  paidDate?: string;
}
