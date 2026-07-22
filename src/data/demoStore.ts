import {
  Account,
  Bill,
  BillOccurrence,
  Category,
  CategoryRule,
  Debt,
  DocumentRecord,
  Goal,
  Household,
  HouseholdRules,
  Paycheck,
  Transaction,
  TransactionStatus,
} from "@/types";
import {
  demoAccounts,
  demoBillOccurrences,
  demoBills,
  demoCategories,
  demoCategoryRules,
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
  netWorthHistory: { month: string; netWorth: number }[];
  categoryRules: CategoryRule[];
  documents: DocumentRecord[];
}

const STORAGE_KEY = "homevault-demo-state-v3";

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
    netWorthHistory: demoNetWorthHistory,
    categoryRules: demoCategoryRules,
    documents: [],
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

  addPaycheck(paycheck: Paycheck): void {
    state.paychecks = [...state.paychecks, paycheck].sort((a, b) =>
      a.payDate.localeCompare(b.payDate),
    );
    persist();
  },

  contributeToGoal(goalId: string, amount: number): void {
    state.goals = state.goals.map((goal) =>
      goal.id === goalId
        ? { ...goal, currentAmount: goal.currentAmount + amount }
        : goal,
    );
    persist();
  },

  updateCategoryTarget(categoryId: string, monthlyTarget: number): void {
    state.categories = state.categories.map((category) =>
      category.id === categoryId ? { ...category, monthlyTarget } : category,
    );
    persist();
  },

  addTransactions(transactions: Transaction[]): void {
    state.transactions = [...transactions, ...state.transactions];
    persist();
  },

  updateTransaction(
    transactionId: string,
    patch: Partial<Pick<Transaction, "categoryId" | "status">>,
  ): void {
    state.transactions = state.transactions.map((transaction) =>
      transaction.id === transactionId
        ? { ...transaction, ...patch }
        : transaction,
    );
    persist();
  },

  setTransactionsStatus(ids: string[], status: TransactionStatus): void {
    const idSet = new Set(ids);
    state.transactions = state.transactions.map((transaction) =>
      idSet.has(transaction.id) ? { ...transaction, status } : transaction,
    );
    persist();
  },

  upsertCategoryRule(rule: CategoryRule): void {
    const pattern = rule.merchantPattern.toLowerCase();
    const existing = state.categoryRules.find(
      (candidate) => candidate.merchantPattern.toLowerCase() === pattern,
    );
    state.categoryRules = existing
      ? state.categoryRules.map((candidate) =>
          candidate.id === existing.id
            ? { ...candidate, categoryId: rule.categoryId }
            : candidate,
        )
      : [...state.categoryRules, rule];
    persist();
  },

  deleteCategoryRule(ruleId: string): void {
    state.categoryRules = state.categoryRules.filter(
      (rule) => rule.id !== ruleId,
    );
    persist();
  },

  addDocument(document: DocumentRecord): void {
    state.documents = [document, ...state.documents];
    persist();
  },

  deleteDocument(documentId: string): void {
    state.documents = state.documents.filter(
      (document) => document.id !== documentId,
    );
    persist();
  },

  recordNetWorthSnapshot(month: string, netWorth: number): void {
    const existing = state.netWorthHistory.filter(
      (point) => point.month !== month,
    );
    state.netWorthHistory = [...existing, { month, netWorth }].sort((a, b) =>
      a.month.localeCompare(b.month),
    );
    persist();
  },
};
