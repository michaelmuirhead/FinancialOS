import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createAccount,
  createBill,
  createDebt,
  createGoal,
  createTransaction,
  fetchAccounts,
  fetchAlerts,
  fetchBillOccurrences,
  fetchBills,
  fetchCategories,
  fetchDebts,
  fetchGoals,
  fetchHousehold,
  fetchNetWorthHistory,
  fetchPaychecks,
  fetchRules,
  fetchTransactions,
  markBillPaid,
  NewAccountInput,
  NewBillInput,
  NewDebtInput,
  NewGoalInput,
  NewTransactionInput,
} from "@/services/dataService";
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

export function useAlerts() {
  return useQuery({ queryKey: ["alerts"], queryFn: fetchAlerts });
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
