import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  CollectionReference,
  DocumentData,
} from "firebase/firestore";
import {
  deleteObject,
  getBlob as storageGetBlob,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import {
  Account,
  Bill,
  BillOccurrence,
  Category,
  CategoryRule,
  Debt,
  DocumentFolder,
  DocumentRecord,
  Goal,
  Household,
  HouseholdRules,
  Paycheck,
  Transaction,
  TransactionStatus,
} from "@/types";
import { demoStore, newId } from "@/data/demoStore";
import { deleteBlob, getBlob, putBlob } from "@/data/blobStore";
import { db, isDemoMode, storage } from "./firebase";
import { currentHouseholdId } from "./authService";

/**
 * All reads go through this module. In demo mode data comes from the local
 * demo store; with Firebase configured, entities live in Firestore under
 * households/{householdId}/<collection>, guarded by membership security
 * rules. Documents are stored in camelCase matching the app types, so rows
 * map with only an id/householdId envelope.
 */

const DEFAULT_RULES: HouseholdRules = {
  minimumCheckingBuffer: 500,
  givingPercentOfGross: 10,
  utilizationWarningPercent: 30,
  bonusSplitDebtPercent: 50,
};

async function householdCollection(
  name: string,
): Promise<{ ref: CollectionReference<DocumentData>; householdId: string }> {
  if (!db) throw new Error("Firebase is not configured");
  const householdId = await currentHouseholdId();
  return {
    ref: collection(db, "households", householdId, name),
    householdId,
  };
}

function fromDoc<T>(
  id: string,
  householdId: string,
  data: DocumentData,
): T {
  return { id, householdId, ...data } as T;
}

export async function fetchHousehold(): Promise<Household> {
  if (isDemoMode || !db) return demoStore.get().household;
  const householdId = await currentHouseholdId();
  const snap = await getDoc(doc(db, "households", householdId));
  const data = snap.data() ?? {};
  return {
    id: householdId,
    name: (data.name as string) ?? "Our Household",
    currency: (data.currency as string) ?? "USD",
    timezone: (data.timezone as string) ?? "America/Chicago",
  };
}

export async function fetchRules(): Promise<HouseholdRules> {
  if (isDemoMode || !db) return demoStore.get().rules;
  const householdId = await currentHouseholdId();
  const snap = await getDoc(doc(db, "households", householdId));
  return { ...DEFAULT_RULES, ...((snap.data()?.rules ?? {}) as object) };
}

export async function updateHouseholdRules(
  rules: HouseholdRules,
): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.updateRules(rules);
    return;
  }
  const householdId = await currentHouseholdId();
  await updateDoc(doc(db, "households", householdId), { rules });
}

export async function fetchAccounts(): Promise<Account[]> {
  if (isDemoMode || !db) return demoStore.get().accounts;
  const { ref, householdId } = await householdCollection("accounts");
  const snap = await getDocs(query(ref, orderBy("name")));
  return snap.docs.map((d) => fromDoc<Account>(d.id, householdId, d.data()));
}

export async function fetchCategories(): Promise<Category[]> {
  if (isDemoMode || !db) return demoStore.get().categories;
  const { ref } = await householdCollection("categories");
  const snap = await getDocs(query(ref, orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Category);
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
  if (isDemoMode || !db) return demoStore.get().bills;
  const { ref, householdId } = await householdCollection("bills");
  const snap = await getDocs(query(ref, orderBy("dueDay")));
  return snap.docs.map((d) => fromDoc<Bill>(d.id, householdId, d.data()));
}

export async function fetchBillOccurrences(): Promise<BillOccurrence[]> {
  if (isDemoMode || !db) {
    return [...demoStore.get().billOccurrences]
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .map(deriveOccurrenceStatus);
  }
  const { ref } = await householdCollection("billOccurrences");
  const snap = await getDocs(query(ref, orderBy("dueDate")));
  return snap.docs.map((d) =>
    deriveOccurrenceStatus({ id: d.id, ...d.data() } as BillOccurrence),
  );
}

export async function fetchTransactions(): Promise<Transaction[]> {
  if (isDemoMode || !db) {
    return [...demoStore.get().transactions].sort((a, b) =>
      b.transactionDate.localeCompare(a.transactionDate),
    );
  }
  const { ref, householdId } = await householdCollection("transactions");
  const snap = await getDocs(query(ref, orderBy("transactionDate", "desc")));
  return snap.docs.map((d) =>
    fromDoc<Transaction>(d.id, householdId, d.data()),
  );
}

export async function fetchDebts(): Promise<Debt[]> {
  if (isDemoMode || !db) return demoStore.get().debts;
  const { ref, householdId } = await householdCollection("debts");
  const snap = await getDocs(ref);
  return snap.docs
    .map((d) => fromDoc<Debt>(d.id, householdId, d.data()))
    .sort(
      (a, b) =>
        (a.payoffPriority ?? Number.MAX_SAFE_INTEGER) -
        (b.payoffPriority ?? Number.MAX_SAFE_INTEGER),
    );
}

export async function fetchGoals(): Promise<Goal[]> {
  if (isDemoMode || !db) return demoStore.get().goals;
  const { ref, householdId } = await householdCollection("goals");
  const snap = await getDocs(query(ref, orderBy("name")));
  return snap.docs.map((d) => fromDoc<Goal>(d.id, householdId, d.data()));
}

export async function fetchPaychecks(): Promise<Paycheck[]> {
  if (isDemoMode || !db) return demoStore.get().paychecks;
  const { ref, householdId } = await householdCollection("paychecks");
  const snap = await getDocs(query(ref, orderBy("payDate")));
  return snap.docs.map((d) => fromDoc<Paycheck>(d.id, householdId, d.data()));
}

export async function fetchNetWorthHistory(): Promise<
  { month: string; netWorth: number }[]
> {
  if (isDemoMode || !db) return demoStore.get().netWorthHistory;
  const { ref } = await householdCollection("netWorthSnapshots");
  const snap = await getDocs(ref);
  return snap.docs
    .map((d) => ({
      month: d.id,
      netWorth: Number(d.data().netWorth ?? 0),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/* ---------- Category rules ---------- */

/** Deterministic doc id gives upsert-by-pattern semantics. */
function ruleDocId(merchantPattern: string): string {
  return merchantPattern
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "rule";
}

export async function fetchCategoryRules(): Promise<CategoryRule[]> {
  if (isDemoMode || !db) return demoStore.get().categoryRules;
  const { ref, householdId } = await householdCollection("categoryRules");
  const snap = await getDocs(query(ref, orderBy("merchantPattern")));
  return snap.docs.map((d) =>
    fromDoc<CategoryRule>(d.id, householdId, d.data()),
  );
}

/** Returns the category for a merchant, per the household's learned rules. */
export function applyCategoryRules(
  merchant: string,
  rules: CategoryRule[],
): string | undefined {
  const lowered = merchant.toLowerCase();
  return rules.find((rule) =>
    lowered.includes(rule.merchantPattern.toLowerCase()),
  )?.categoryId;
}

export async function upsertCategoryRule(
  merchantPattern: string,
  categoryId: string,
): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.upsertCategoryRule({
      id: newId("rule"),
      householdId: demoStore.get().household.id,
      merchantPattern,
      categoryId,
    });
    return;
  }
  const { ref } = await householdCollection("categoryRules");
  await setDoc(doc(ref, ruleDocId(merchantPattern)), {
    merchantPattern: merchantPattern.toLowerCase().trim(),
    categoryId,
  });
}

export async function deleteCategoryRule(ruleId: string): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.deleteCategoryRule(ruleId);
    return;
  }
  const { ref } = await householdCollection("categoryRules");
  await deleteDoc(doc(ref, ruleId));
}

/* ---------- Transactions ---------- */

export interface NewTransactionInput {
  accountId: string;
  transactionDate: string;
  merchant: string;
  amount: number;
  transactionType: Transaction["transactionType"];
  categoryId?: string;
  notes?: string;
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as T;
}

export async function createTransaction(
  input: NewTransactionInput,
): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.addTransaction({
      id: newId("tx"),
      householdId: demoStore.get().household.id,
      status: "posted",
      ...input,
    });
    return;
  }
  const { ref } = await householdCollection("transactions");
  await setDoc(doc(ref), stripUndefined({ status: "posted", ...input }));
}

export async function importTransactions(
  inputs: NewTransactionInput[],
): Promise<number> {
  if (inputs.length === 0) return 0;
  if (isDemoMode || !db) {
    const householdId = demoStore.get().household.id;
    demoStore.addTransactions(
      inputs.map((input) => ({
        id: newId("tx"),
        householdId,
        status: "posted" as const,
        ...input,
      })),
    );
    return inputs.length;
  }
  const { ref } = await householdCollection("transactions");
  const batch = writeBatch(db);
  for (const input of inputs) {
    batch.set(doc(ref), stripUndefined({ status: "posted", ...input }));
  }
  await batch.commit();
  return inputs.length;
}

export async function updateTransactionCategory(
  transactionId: string,
  categoryId: string | undefined,
): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.updateTransaction(transactionId, { categoryId });
    return;
  }
  const { ref } = await householdCollection("transactions");
  await updateDoc(doc(ref, transactionId), {
    categoryId: categoryId ?? null,
  });
}

export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.updateTransaction(transactionId, { status });
    return;
  }
  const { ref } = await householdCollection("transactions");
  await updateDoc(doc(ref, transactionId), { status });
}

/* ---------- Bills ---------- */

export interface NewBillInput {
  name: string;
  expectedAmount: number;
  dueDay: number;
  frequency: Bill["frequency"];
  autopay: boolean;
  categoryId?: string;
  paymentAccountId?: string;
}

function nextDueDate(dueDay: number): string {
  const today = new Date();
  const due = new Date(today.getFullYear(), today.getMonth(), Math.min(dueDay, 28));
  if (due < today) due.setMonth(due.getMonth() + 1);
  return due.toISOString().slice(0, 10);
}

export async function createBill(input: NewBillInput): Promise<void> {
  const dueDate = nextDueDate(input.dueDay);
  if (isDemoMode || !db) {
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
  const { ref } = await householdCollection("bills");
  const occurrences = await householdCollection("billOccurrences");
  const billRef = doc(ref);
  const batch = writeBatch(db);
  batch.set(billRef, stripUndefined({ isActive: true, ...input }));
  batch.set(
    doc(occurrences.ref),
    stripUndefined({
      billId: billRef.id,
      name: input.name,
      dueDate,
      expectedAmount: input.expectedAmount,
      status: "scheduled",
      autopay: input.autopay,
      paymentAccountId: input.paymentAccountId,
    }),
  );
  await batch.commit();
}

export async function markBillPaid(
  occurrenceId: string,
  actualAmount?: number,
): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.markBillPaid(occurrenceId, actualAmount);
    return;
  }
  const { ref } = await householdCollection("billOccurrences");
  await updateDoc(doc(ref, occurrenceId), {
    status: "paid",
    ...(actualAmount != null ? { actualAmount } : {}),
    paidDate: new Date().toISOString().slice(0, 10),
  });
}

/* ---------- Accounts ---------- */

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
  if (isDemoMode || !db) {
    demoStore.addAccount({
      id: newId("acc"),
      householdId: demoStore.get().household.id,
      includeInNetWorth: true,
      isActive: true,
      ...input,
    });
    return;
  }
  const { ref } = await householdCollection("accounts");
  await setDoc(
    doc(ref),
    stripUndefined({ includeInNetWorth: true, isActive: true, ...input }),
  );
}

export async function updateAccountBalance(
  accountId: string,
  balance: number,
): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.updateAccountBalance(accountId, balance);
    return;
  }
  const { ref } = await householdCollection("accounts");
  await updateDoc(doc(ref, accountId), {
    currentBalance: balance,
    availableBalance: balance,
  });
}

/* ---------- Debts ---------- */

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
  if (isDemoMode || !db) {
    demoStore.addDebt({
      id: newId("debt"),
      householdId: demoStore.get().household.id,
      ...input,
    });
    return;
  }
  const { ref } = await householdCollection("debts");
  await setDoc(doc(ref), stripUndefined({ ...input }));
}

/* ---------- Goals ---------- */

export interface NewGoalInput {
  name: string;
  goalType: Goal["goalType"];
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  monthlyContribution?: number;
}

export async function createGoal(input: NewGoalInput): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.addGoal({
      id: newId("goal"),
      householdId: demoStore.get().household.id,
      ...input,
    });
    return;
  }
  const { ref } = await householdCollection("goals");
  await setDoc(doc(ref), stripUndefined({ ...input }));
}

export async function contributeToGoal(
  goalId: string,
  amount: number,
): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.contributeToGoal(goalId, amount);
    return;
  }
  const { ref } = await householdCollection("goals");
  await updateDoc(doc(ref, goalId), { currentAmount: increment(amount) });
}

/* ---------- Categories & snapshots ---------- */

export async function updateCategoryTarget(
  categoryId: string,
  monthlyTarget: number,
): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.updateCategoryTarget(categoryId, monthlyTarget);
    return;
  }
  const { ref } = await householdCollection("categories");
  await updateDoc(doc(ref, categoryId), { monthlyTarget });
}

export async function recordNetWorthSnapshot(
  month: string,
  netWorth: number,
): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.recordNetWorthSnapshot(month, netWorth);
    return;
  }
  const { ref } = await householdCollection("netWorthSnapshots");
  await setDoc(doc(ref, month), { netWorth });
}

/* ---------- Paychecks ---------- */

export interface NewPaycheckInput {
  memberName: string;
  payDate: string;
  netAmount: number;
  startingBalance: number;
  allocations: Paycheck["allocations"];
}

export async function createPaycheck(input: NewPaycheckInput): Promise<void> {
  if (isDemoMode || !db) {
    demoStore.addPaycheck({
      id: newId("pay"),
      householdId: demoStore.get().household.id,
      ...input,
    });
    return;
  }
  const { ref } = await householdCollection("paychecks");
  await setDoc(doc(ref), stripUndefined({ ...input }));
}

/* ---------- Documents ---------- */

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  if (isDemoMode || !db) return demoStore.get().documents;
  const { ref, householdId } = await householdCollection("documents");
  const snap = await getDocs(query(ref, orderBy("uploadedAt", "desc")));
  return snap.docs.map((d) =>
    fromDoc<DocumentRecord>(d.id, householdId, d.data()),
  );
}

export async function uploadDocument(
  folder: DocumentFolder,
  file: File,
): Promise<void> {
  if (isDemoMode || !db || !storage) {
    const id = newId("doc");
    await putBlob(id, file);
    demoStore.addDocument({
      id,
      householdId: demoStore.get().household.id,
      folder,
      name: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
    });
    return;
  }
  const { ref, householdId } = await householdCollection("documents");
  const documentRef = doc(ref);
  const storagePath = `documents/${householdId}/${documentRef.id}-${file.name}`;
  await uploadBytes(storageRef(storage, storagePath), file, {
    contentType: file.type || "application/octet-stream",
  });
  await setDoc(documentRef, {
    folder,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    storagePath,
    uploadedAt: new Date().toISOString(),
  });
}

export async function getDocumentBlob(
  document: DocumentRecord,
): Promise<Blob | undefined> {
  if (isDemoMode || !storage) return getBlob(document.id);
  if (!document.storagePath) return undefined;
  return storageGetBlob(storageRef(storage, document.storagePath));
}

export async function deleteDocument(
  document: DocumentRecord,
): Promise<void> {
  if (isDemoMode || !db || !storage) {
    await deleteBlob(document.id);
    demoStore.deleteDocument(document.id);
    return;
  }
  if (document.storagePath) {
    await deleteObject(storageRef(storage, document.storagePath)).catch(() => {
      // Metadata cleanup still proceeds when the object is already gone.
    });
  }
  const { ref } = await householdCollection("documents");
  await deleteDoc(doc(ref, document.id));
}
