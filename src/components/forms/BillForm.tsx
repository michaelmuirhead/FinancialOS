import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Field } from "./fields";
import {
  useAccounts,
  useCategories,
  useCreateBill,
} from "@/hooks/useFinancialData";

const billSchema = z.object({
  name: z.string().min(1, "Bill name is required"),
  expectedAmount: z.coerce.number().positive("Amount must be positive"),
  dueDay: z.coerce.number().int().min(1).max(31),
  frequency: z.enum(["weekly", "biweekly", "monthly", "quarterly", "annually"]),
  autopay: z.boolean(),
  categoryId: z.string().optional(),
  paymentAccountId: z.string().optional(),
});

type BillFormValues = z.infer<typeof billSchema>;

export function BillForm({ onDone }: { onDone: () => void }) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const createBill = useCreateBill();

  const form = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      name: "",
      expectedAmount: 0,
      dueDay: 1,
      frequency: "monthly",
      autopay: false,
      categoryId: "",
      paymentAccountId: "",
    },
  });

  async function handleSave(values: BillFormValues) {
    await createBill.mutateAsync({
      ...values,
      categoryId: values.categoryId || undefined,
      paymentAccountId: values.paymentAccountId || undefined,
    });
    onDone();
  }

  const { errors } = form.formState;

  return (
    <form className="form-grid" onSubmit={form.handleSubmit(handleSave)}>
      <Field label="Bill name" error={errors.name?.message}>
        <input
          className="form-field__input"
          placeholder="Electric"
          {...form.register("name")}
        />
      </Field>
      <Field label="Expected amount" error={errors.expectedAmount?.message}>
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          min="0"
          {...form.register("expectedAmount")}
        />
      </Field>
      <Field label="Due day of month" error={errors.dueDay?.message}>
        <input
          className="form-field__input"
          type="number"
          min={1}
          max={31}
          {...form.register("dueDay")}
        />
      </Field>
      <Field label="Frequency">
        <select {...form.register("frequency")}>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annually">Annually</option>
        </select>
      </Field>
      <Field label="Category">
        <select {...form.register("categoryId")}>
          <option value="">Uncategorized</option>
          {(categories ?? [])
            .filter((category) => category.kind === "expense")
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Payment account">
        <select {...form.register("paymentAccountId")}>
          <option value="">Not set</option>
          {(accounts ?? []).map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="form-field form-field--checkbox">
        <input id="bill-autopay" type="checkbox" {...form.register("autopay")} />
        <label htmlFor="bill-autopay" className="form-field__label">
          Auto-pay enabled
        </label>
      </div>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={createBill.isPending}>
          Save bill
        </Button>
      </div>
    </form>
  );
}
