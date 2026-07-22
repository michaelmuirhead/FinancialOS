import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  contributeToGoal,
  createAccount,
  createBill,
  createDebt,
  createGoal,
  createPaycheck,
  createTransaction,
  deleteCategoryRule,
  deleteDocument,
  fetchAccounts,
  fetchBillOccurrences,
  fetchBills,
  fetchCategories,
  fetchCategoryRules,
  fetchDebts,
  fetchDocuments,
  fetchGoals,
  fetchHousehold,
  fetchNetWorthHistory,
  fetchPaychecks,
  fetchRules,
  fetchTransactions,
  importTransactions,
  markBillPaid,
  NewAccountInput,
  NewBillInput,
  NewDebtInput,
  NewGoalInput,
  NewPaycheckInput,
  NewTransactionInput,
  recordNetWorthSnapshot,
  updateAccountBalance,
  updateCategoryTarget,
  updateHouseholdRules,
  updateTransactionCategory,
  updateTransactionStatus,
  uploadDocument,
  upsertCategoryRule,
} from "@/services/dataService";
import {
  DocumentFolder,
  DocumentRecord,
  HouseholdRules,
  TransactionStatus,
} from "@/types";
import { getDashboardSummary } from "@/services/dashboardService";

export function useHousehold() {
  return useQuery({ queryKey: ["household"], queryFn: fetchHousehold });
}

export function useRules() {
  return useQuery({ queryKey: ["rules"], queryFn: fetchRules });
}

export function useAccounts() {
  return useQuery({ queryKey: ["accounts"], queryFn: fetchAccounts });
}

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
}

export function useBills() {
  return useQuery({ queryKey: ["bills"], queryFn: fetchBills });
}

export function useBillOccurrences() {
  return useQuery({
    queryKey: ["bill-occurrences"],
    queryFn: fetchBillOccurrences,
  });
}

export function useTransactions() {
  return useQuery({ queryKey: ["transactions"], queryFn: fetchTransactions });
}

export function useDebts() {
  return useQuery({ queryKey: ["debts"], queryFn: fetchDebts });
}

export function useGoals() {
  return useQuery({ queryKey: ["goals"], queryFn: fetchGoals });
}

export function usePaychecks() {
  return useQuery({ queryKey: ["paychecks"], queryFn: fetchPaychecks });
}

export function useNetWorthHistory() {
  return useQuery({
    queryKey: ["net-worth-history"],
    queryFn: fetchNetWorthHistory,
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardSummary,
  });
}

function useInvalidatingMutation<TInput>(
  mutationFn: (input: TInput) => Promise<void>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useCreateTransaction() {
  return useInvalidatingMutation<NewTransactionInput>(createTransaction);
}

export function useCreateBill() {
  return useInvalidatingMutation<NewBillInput>(createBill);
}

export function useCreateAccount() {
  return useInvalidatingMutation<NewAccountInput>(createAccount);
}

export function useCreateDebt() {
  return useInvalidatingMutation<NewDebtInput>(createDebt);
}

export function useCreateGoal() {
  return useInvalidatingMutation<NewGoalInput>(createGoal);
}

export function useCreatePaycheck() {
  return useInvalidatingMutation<NewPaycheckInput>(createPaycheck);
}

export function useContributeToGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ goalId, amount }: { goalId: string; amount: number }) =>
      contributeToGoal(goalId, amount),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useUpdateCategoryTarget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      categoryId,
      monthlyTarget,
    }: {
      categoryId: string;
      monthlyTarget: number;
    }) => updateCategoryTarget(categoryId, monthlyTarget),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useRecordNetWorthSnapshot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ month, netWorth }: { month: string; netWorth: number }) =>
      recordNetWorthSnapshot(month, netWorth),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useCategoryRules() {
  return useQuery({
    queryKey: ["category-rules"],
    queryFn: fetchCategoryRules,
  });
}

export function useDocuments() {
  return useQuery({ queryKey: ["documents"], queryFn: fetchDocuments });
}

export function useImportTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: importTransactions,
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useUpdateTransactionCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      transactionId,
      categoryId,
    }: {
      transactionId: string;
      categoryId: string | undefined;
    }) => updateTransactionCategory(transactionId, categoryId),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      transactionId,
      status,
    }: {
      transactionId: string;
      status: TransactionStatus;
    }) => updateTransactionStatus(transactionId, status),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useUpdateRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rules: HouseholdRules) => updateHouseholdRules(rules),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useUpdateAccountBalance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      balance,
    }: {
      accountId: string;
      balance: number;
    }) => updateAccountBalance(accountId, balance),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useUpsertCategoryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      merchantPattern,
      categoryId,
    }: {
      merchantPattern: string;
      categoryId: string;
    }) => upsertCategoryRule(merchantPattern, categoryId),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useDeleteCategoryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) => deleteCategoryRule(ruleId),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folder, file }: { folder: DocumentFolder; file: File }) =>
      uploadDocument(folder, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (document: DocumentRecord) => deleteDocument(document),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function useMarkBillPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      occurrenceId,
      actualAmount,
    }: {
      occurrenceId: string;
      actualAmount?: number;
    }) => markBillPaid(occurrenceId, actualAmount),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
