export interface PaycheckAllocation {
  label: string;
  amount: number;
  kind: "bills" | "giving" | "groceries" | "gas" | "debt" | "savings" | "buffer" | "other";
}

export interface Paycheck {
  id: string;
  householdId: string;
  memberName: string;
  payDate: string;
  netAmount: number;
  startingBalance: number;
  allocations: PaycheckAllocation[];
}
