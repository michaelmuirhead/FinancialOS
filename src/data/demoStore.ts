import {
  Account,
  Bill,
  BillOccurrence,
  Category,
  Debt,
  FinancialAlert,
  Goal,
  Household,
  HouseholdRules,
  Paycheck,
  Transaction,
} from "@/types";
import {
  demoAccounts,
  demoAlerts,
  demoBillOccurrences,
  demoBills,
  demoCategories,
  demoDebts,
  demoGoals,
  demoHousehold,
  demoNetWorthHistory,
  demoPaychecks,
  demoRules,
  demoTransactions,
} from "./demoData";

interface DemoState {
  household: Household;
  rules: HouseholdRules;
  accounts: Account[];
  categories: Category[];
  bills: Bill[];
  billOccurrences: BillOccurrence[];
  transactions: Transaction[];
  debts: Debt[];
  goals: Goal[];
  paychecks: Paycheck[];
  alerts: FinancialAlert[];
  netWorthHistory: { month: string; netWorth: number }[];
}

const STORAGE_KEY = "homevault-demo-state-v1";

function seedState(): DemoState {
  return {
    household: demoHousehold,
    rules: demoRules,
    accounts: demoAccounts,
    categories: demoCategories,
    bills: demoBills,
    billOccurrences: demoBillOccurrences,
    transactions: demoTransactions,
    debts: demoDebts,
    goals: demoGoals,
    paychecks: demoPaychecks,
    alerts: demoAlerts,
    netWorthHistory: demoNetWorthHistory,
  };
}

function loadState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    // corrupted or unavailable storage falls back to seed data
  }
  return seedState();
}

let state: DemoState = loadState();

function persist(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage may be unavailable (private mode); demo data stays in memory
  }
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export const demoStore = {
  get: (): DemoState => state,

  reset(): void {
    state = seedState();
    persist();
  },

  addTransaction(transaction: Transaction): void {
    state.transactions = [transaction, ...state.transactions];
    persist();
  },

  addBill(bill: Bill, occurrence: BillOccurrence): void {
    state.bills = [...state.bills, bill];
    state.billOccurrences = [...state.billOccurrences, occurrence];
    persist();
  },

  addAccount(account: Account): void {
    state.accounts = [...state.accounts, account];
    persist();
  },

  addDebt(debt: Debt): void {
    state.debts = [...state.debts, debt];
    persist();
  },

  addGoal(goal: Goal): void {
    state.goals = [...state.goals, goal];
    persist();
  },

  markBillPaid(occurrenceId: string, actualAmount?: number): void {
    state.billOccurrences = state.billOccurrences.map((occurrence) =>
      occurrence.id === occurrenceId
        ? {
            ...occurrence,
            status: "paid",
            actualAmount: actualAmount ?? occurrence.expectedAmount,
            paidDate: new Date().toISOString().slice(0, 10),
          }
        : occurrence,
    );
    persist();
  },

  updateRules(rules: HouseholdRules): void {
    state.rules = rules;
    persist();
  },
};
