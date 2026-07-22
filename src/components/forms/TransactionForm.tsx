import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Field } from "./fields";
import {
  useAccounts,
  useCategories,
  useCreateTransaction,
} from "@/hooks/useFinancialData";

const transactionSchema = z.object({
  merchant: z.string().min(1, "Merchant is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  transactionType: z.enum(["income", "expense", "transfer"]),
  transactionDate: z.string().min(1, "Date is required"),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().optional(),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function TransactionForm({ onDone }: { onDone: () => void }) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createTransaction = useCreateTransaction();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      merchant: "",
      amount: 0,
      transactionType: "expense",
      transactionDate: new Date().toISOString().slice(0, 10),
      accountId: accounts?.[0]?.id ?? "",
      categoryId: "",
      notes: "",
    },
  });

  async function handleSave(values: TransactionFormValues) {
    const signedAmount =
      values.transactionType === "income" ? values.amount : -values.amount;
    await createTransaction.mutateAsync({
      ...values,
      amount: signedAmount,
      categoryId: values.categoryId || undefined,
      notes: values.notes || undefined,
    });
    onDone();
  }

  const { errors } = form.formState;

  return (
    <form className="form-grid" onSubmit={form.handleSubmit(handleSave)}>
      <Field label="Merchant" error={errors.merchant?.message}>
        <input
          className="form-field__input"
          placeholder="Kroger"
          {...form.register("merchant")}
        />
      </Field>
      <Field label="Amount" error={errors.amount?.message}>
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          min="0"
          {...form.register("amount")}
        />
      </Field>
      <Field label="Type" error={errors.transactionType?.message}>
        <select {...form.register("transactionType")}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer</option>
        </select>
      </Field>
      <Field label="Date" error={errors.transactionDate?.message}>
        <input
          className="form-field__input"
          type="date"
          {...form.register("transactionDate")}
        />
      </Field>
      <Field label="Account" error={errors.accountId?.message}>
        <select {...form.register("accountId")}>
          {(accounts ?? []).map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Category">
        <select {...form.register("categoryId")}>
          <option value="">Uncategorized</option>
          {(categories ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Notes">
        <input className="form-field__input" {...form.register("notes")} />
      </Field>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={createTransaction.isPending}>
          Save transaction
        </Button>
      </div>
    </form>
  );
}
