import {
  Account,
  Bill,
  BillOccurrence,
  Category,
  Debt,
  Goal,
  Household,
  HouseholdRules,
  Paycheck,
  Transaction,
} from "@/types";
import { demoStore, newId } from "@/data/demoStore";
import { isDemoMode, supabase } from "./supabase";

/**
 * All reads go through this module. In demo mode data comes from the local
 * demo store; when Supabase is configured, core entities are fetched from
 * Postgres (mapped from snake_case rows) and scoped by RLS to the signed-in
 * user's household.
 */

function mapAccount(row: Record<string, unknown>): Account {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    name: row.name as string,
    institution: (row.institution as string) ?? undefined,
    accountType: row.account_type as Account["accountType"],
    lastFour: (row.last_four as string) ?? undefined,
    currentBalance: Number(row.current_balance ?? 0),
    availableBalance:
      row.available_balance == null ? undefined : Number(row.available_balance),
    creditLimit: row.credit_limit == null ? undefined : Number(row.credit_limit),
    interestRate:
      row.interest_rate == null ? undefined : Number(row.interest_rate),
    includeInSafeToSpend: Boolean(row.include_in_safe_to_spend),
    includeInNetWorth: Boolean(row.include_in_net_worth),
    isActive: Boolean(row.is_active),
  };
}

function mapTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    accountId: row.account_id as string,
    transactionDate: row.transaction_date as string,
    merchant: row.merchant as string,
    description: (row.description as string) ?? undefined,
    amount: Number(row.amount ?? 0),
    transactionType: row.transaction_type as Transaction["transactionType"],
    categoryId: (row.category_id as string) ?? undefined,
    status: row.status as Transaction["status"],
    notes: (row.notes as string) ?? undefined,
  };
}

function mapDebt(row: Record<string, unknown>): Debt {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    accountId: (row.account_id as string) ?? undefined,
    name: row.name as string,
    debtType: row.debt_type as Debt["debtType"],
    originalBalance:
      row.original_balance == null ? undefined : Number(row.original_balance),
    currentBalance: Number(row.current_balance ?? 0),
    minimumPayment: Number(row.minimum_payment ?? 0),
    annualInterestRate: Number(row.annual_interest_rate ?? 0),
    creditLimit: row.credit_limit == null ? undefined : Number(row.credit_limit),
    dueDay: row.due_day == null ? undefined : Number(row.due_day),
    payoffPriority:
      row.payoff_priority == null ? undefined : Number(row.payoff_priority),
  };
}

function mapGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    householdId: row.household_id as string,
    name: row.name as string,
    goalType: row.goal_type as Goal["goalType"],
    targetAmount: Number(row.target_amount ?? 0),
    currentAmount: Number(row.current_amount ?? 0),
    targetDate: (row.target_date as string) ?? undefined,
    monthlyContribution:
      row.monthly_contribution == null
        ? undefined
        : Number(row.monthly_contribution),
  };
}

export async function fetchHousehold(): Promise<Household> {
  if (isDemoMode || !supabase) return demoStore.get().household;
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .limit(1)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    currency: data.currency,
    timezone: data.timezone,
  };
}

export async function fetchRules(): Promise<HouseholdRules> {
  return demoStore.get().rules;
}

export async function fetchAccounts(): Promise<Account[]> {
  if (isDemoMode || !supabase) return demoStore.get().accounts;
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(mapAccount);
}

export async function fetchCategories(): Promise<Category[]> {
  if (isDemoMode || !supabase) return demoStore.get().categories;
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    monthlyTarget:
      row.monthly_target == null ? undefined : Number(row.monthly_target),
  }));
}

/**
 * Bill statuses are derived from the calendar on every read, so a bill
 * automatically moves Scheduled → Due Soon → Overdue without a background
 * job. Paid and skipped statuses are always preserved.
 */
function deriveOccurrenceStatus(occurrence: BillOccurrence): BillOccurrence {
  if (occurrence.status === "paid" || occurrence.status === "skipped") {
    return occurrence;
  }
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const dueSoonCutoff = soon.toISOString().slice(0, 10);

  const status =
    occurrence.dueDate < today
      ? "overdue"
      : occurrence.dueDate <= dueSoonCutoff
        ? "due_soon"
        : "scheduled";
  return status === occurrence.status ? occurrence : { ...occurrence, status };
}

export async function fetchBills(): Promise<Bill[]> {
  if (isDemoMode || !supabase) return demoStore.get().bills;
  const { data, error } = await supabase.from("bills").select("*").order("due_day");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    householdId: row.household_id,
    name: row.name,
    categoryId: row.category_id ?? undefined,
    expectedAmount: Number(row.expected_amount ?? 0),
    dueDay: Number(row.due_day ?? 1),
    frequency: row.frequency,
    autopay: Boolean(row.autopay),
    paymentAccountId: row.payment_account_id ?? undefined,
    isActive: Boolean(row.is_active),
  }));
}

export async function fetchBillOccurrences(): Promise<BillOccurrence[]> {
  if (isDemoMode || !supabase) {
    return [...demoStore.get().billOccurrences]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map(deriveOccurrenceStatus);
  }
  const { data, error } = await supabase
    .from("bill_occurrences")
    .select("*, bills(name, autopay)")
    .order("due_date");
  if (error) throw error;
  return (data ?? []).map((row) => deriveOccurrenceStatus({
    id: row.id,
    billId: row.bill_id,
    name: row.bills?.name ?? "Bill",
    dueDate: row.due_date,
    expectedAmount: Number(row.expected_amount ?? 0),
    actualAmount:
      row.actual_amount == null ? undefined : Number(row.actual_amount),
    status: row.status,
    autopay: Boolean(row.bills?.autopay),
    paidDate: row.paid_date ?? undefined,
  }));
}


export async function fetchTransactions(): Promise<Transaction[]> {
  if (isDemoMode || !supabase) {
    return [...demoStore.get().transactions].sort((a, b) =>
      b.transactionDate.localeCompare(a.transactionDate),
    );
  }
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map(mapTransaction);
}

export async function fetchDebts(): Promise<Debt[]> {
  if (isDemoMode || !supabase) return demoStore.get().debts;
  const { data, error } = await supabase
    .from("debts")
    .select("*")
    .order("payoff_priority");
  if (error) throw error;
  return (data ?? []).map(mapDebt);
}

export async function fetchGoals(): Promise<Goal[]> {
  if (isDemoMode || !supabase) return demoStore.get().goals;
  const { data, error } = await supabase.from("goals").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(mapGoal);
}

export async function fetchPaychecks(): Promise<Paycheck[]> {
  if (isDemoMode || !supabase) return demoStore.get().paychecks;
  const { data, error } = await supabase
    .from("paychecks")
    .select("*, paycheck_allocations(label, amount, kind)")
    .order("pay_date");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    householdId: row.household_id,
    memberName: row.member_name,
    payDate: row.pay_date,
    netAmount: Number(row.net_amount ?? 0),
    startingBalance: Number(row.starting_balance ?? 0),
    allocations: (row.paycheck_allocations ?? []).map(
      (allocation: { label: string; amount: number; kind: string }) => ({
        label: allocation.label,
        amount: Number(allocation.amount ?? 0),
        kind: allocation.kind as Paycheck["allocations"][number]["kind"],
      }),
    ),
  }));
}

export async function fetchNetWorthHistory(): Promise<
  { month: string; netWorth: number }[]
> {
  if (isDemoMode || !supabase) return demoStore.get().netWorthHistory;
  const { data, error } = await supabase
    .from("net_worth_snapshots")
    .select("*")
    .order("month");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    month: String(row.month).slice(0, 7),
    netWorth: Number(row.net_worth ?? 0),
  }));
}

/* ---------- Mutations ---------- */

export interface NewTransactionInput {
  accountId: string;
  transactionDate: string;
  merchant: string;
  amount: number;
  transactionType: Transaction["transactionType"];
  categoryId?: string;
  notes?: string;
}

export async function createTransaction(
  input: NewTransactionInput,
): Promise<void> {
  if (isDemoMode || !supabase) {
    demoStore.addTransaction({
      id: newId("tx"),
      householdId: demoStore.get().household.id,
      status: "posted",
      ...input,
    });
    return;
  }
  const household = await fetchHousehold();
  const { error } = await supabase.from("transactions").insert({
    household_id: household.id,
    account_id: input.accountId,
    transaction_date: input.transactionDate,
    merchant: input.merchant,
    amount: input.amount,
    transaction_type: input.transactionType,
    category_id: input.categoryId ?? null,
    notes: input.notes ?? null,
  });
  if (error) throw error;
}

export interface NewBillInput {
  name: string;
  expectedAmount: number;
  dueDay: number;
  frequency: Bill["frequency"];
  autopay: boolean;
  categoryId?: string;
  paymentAccountId?: string;
}

export async function createBill(input: NewBillInput): Promise<void> {
  const today = new Date();
  const dueThisMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    Math.min(input.dueDay, 28),
  );
  if (dueThisMonth < today) dueThisMonth.setMonth(dueThisMonth.getMonth() + 1);
  const dueDate = dueThisMonth.toISOString().slice(0, 10);

  if (isDemoMode || !supabase) {
    const billId = newId("bill");
    demoStore.addBill(
      {
        id: billId,
        householdId: demoStore.get().household.id,
        isActive: true,
        ...input,
      },
      {
        id: newId("occ"),
        billId,
        name: input.name,
        dueDate,
        expectedAmount: input.expectedAmount,
        status: "scheduled",
        autopay: input.autopay,
        paymentAccountId: input.paymentAccountId,
      },
    );
    return;
  }
  const household = await fetchHousehold();
  const { data, error } = await supabase
    .from("bills")
    .insert({
      household_id: household.id,
      name: input.name,
      expected_amount: input.expectedAmount,
      due_day: input.dueDay,
      frequency: input.frequency,
      autopay: input.autopay,
      category_id: input.categoryId ?? null,
      payment_account_id: input.paymentAccountId ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  const { error: occurrenceError } = await supabase
    .from("bill_occurrences")
    .insert({
      bill_id: data.id,
      household_id: household.id,
      due_date: dueDate,
      expected_amount: input.expectedAmount,
    });
  if (occurrenceError) throw occurrenceError;
}

export interface NewAccountInput {
  name: string;
  institution?: string;
  accountType: Account["accountType"];
  lastFour?: string;
  currentBalance: number;
  creditLimit?: number;
  interestRate?: number;
  includeInSafeToSpend: boolean;
}

export async function createAccount(input: NewAccountInput): Promise<void> {
  if (isDemoMode || !supabase) {
    demoStore.addAccount({
      id: newId("acc"),
      householdId: demoStore.get().household.id,
      includeInNetWorth: true,
      isActive: true,
      ...input,
    });
    return;
  }
  const household = await fetchHousehold();
  const { error } = await supabase.from("accounts").insert({
    household_id: household.id,
    name: input.name,
    institution: input.institution ?? null,
    account_type: input.accountType,
    last_four: input.lastFour ?? null,
    current_balance: input.currentBalance,
    credit_limit: input.creditLimit ?? null,
    interest_rate: input.interestRate ?? null,
    include_in_safe_to_spend: input.includeInSafeToSpend,
  });
  if (error) throw error;
}

export interface NewDebtInput {
  name: string;
  debtType: Debt["debtType"];
  currentBalance: number;
  minimumPayment: number;
  annualInterestRate: number;
  creditLimit?: number;
  dueDay?: number;
}

export async function createDebt(input: NewDebtInput): Promise<void> {
  if (isDemoMode || !supabase) {
    demoStore.addDebt({
      id: newId("debt"),
      householdId: demoStore.get().household.id,
      ...input,
    });
    return;
  }
  const household = await fetchHousehold();
  const { error } = await supabase.from("debts").insert({
    household_id: household.id,
    name: input.name,
    debt_type: input.debtType,
    current_balance: input.currentBalance,
    minimum_payment: input.minimumPayment,
    annual_interest_rate: input.annualInterestRate,
    credit_limit: input.creditLimit ?? null,
    due_day: input.dueDay ?? null,
  });
  if (error) throw error;
}

export interface NewGoalInput {
  name: string;
  goalType: Goal["goalType"];
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  monthlyContribution?: number;
}

export async function createGoal(input: NewGoalInput): Promise<void> {
  if (isDemoMode || !supabase) {
    demoStore.addGoal({
      id: newId("goal"),
      householdId: demoStore.get().household.id,
      ...input,
    });
    return;
  }
  const household = await fetchHousehold();
  const { error } = await supabase.from("goals").insert({
    household_id: household.id,
    name: input.name,
    goal_type: input.goalType,
    target_amount: input.targetAmount,
    current_amount: input.currentAmount,
    target_date: input.targetDate ?? null,
    monthly_contribution: input.monthlyContribution ?? null,
  });
  if (error) throw error;
}

export interface NewPaycheckInput {
  memberName: string;
  payDate: string;
  netAmount: number;
  startingBalance: number;
  allocations: Paycheck["allocations"];
}

export async function createPaycheck(input: NewPaycheckInput): Promise<void> {
  if (isDemoMode || !supabase) {
    demoStore.addPaycheck({
      id: newId("pay"),
      householdId: demoStore.get().household.id,
      ...input,
    });
    return;
  }
  const household = await fetchHousehold();
  const { data, error } = await supabase
    .from("paychecks")
    .insert({
      household_id: household.id,
      member_name: input.memberName,
      pay_date: input.payDate,
      net_amount: input.netAmount,
      starting_balance: input.startingBalance,
    })
    .select()
    .single();
  if (error) throw error;
  if (input.allocations.length > 0) {
    const { error: allocationError } = await supabase
      .from("paycheck_allocations")
      .insert(
        input.allocations.map((allocation) => ({
          paycheck_id: data.id,
          household_id: household.id,
          label: allocation.label,
          amount: allocation.amount,
          kind: allocation.kind,
        })),
      );
    if (allocationError) throw allocationError;
  }
}

export async function contributeToGoal(
  goalId: string,
  amount: number,
): Promise<void> {
  if (isDemoMode || !supabase) {
    demoStore.contributeToGoal(goalId, amount);
    return;
  }
  const { data, error } = await supabase
    .from("goals")
    .select("current_amount")
    .eq("id", goalId)
    .single();
  if (error) throw error;
  const { error: updateError } = await supabase
    .from("goals")
    .update({ current_amount: Number(data.current_amount ?? 0) + amount })
    .eq("id", goalId);
  if (updateError) throw updateError;
}

export async function updateCategoryTarget(
  categoryId: string,
  monthlyTarget: number,
): Promise<void> {
  if (isDemoMode || !supabase) {
    demoStore.updateCategoryTarget(categoryId, monthlyTarget);
    return;
  }
  const { error } = await supabase
    .from("categories")
    .update({ monthly_target: monthlyTarget })
    .eq("id", categoryId);
  if (error) throw error;
}

export async function recordNetWorthSnapshot(
  month: string,
  netWorth: number,
): Promise<void> {
  if (isDemoMode || !supabase) {
    demoStore.recordNetWorthSnapshot(month, netWorth);
    return;
  }
  const household = await fetchHousehold();
  const { error } = await supabase.from("net_worth_snapshots").upsert(
    {
      household_id: household.id,
      month: `${month}-01`,
      net_worth: netWorth,
    },
    { onConflict: "household_id,month" },
  );
  if (error) throw error;
}

export async function markBillPaid(
  occurrenceId: string,
  actualAmount?: number,
): Promise<void> {
  if (isDemoMode || !supabase) {
    demoStore.markBillPaid(occurrenceId, actualAmount);
    return;
  }
  const { error } = await supabase
    .from("bill_occurrences")
    .update({
      status: "paid",
      actual_amount: actualAmount ?? null,
      paid_date: new Date().toISOString().slice(0, 10),
    })
    .eq("id", occurrenceId);
  if (error) throw error;
}
