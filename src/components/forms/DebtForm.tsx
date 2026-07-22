import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Field } from "./fields";
import { useCreateDebt } from "@/hooks/useFinancialData";

const debtSchema = z.object({
  name: z.string().min(1, "Creditor name is required"),
  debtType: z.enum([
    "credit_card",
    "auto_loan",
    "mortgage",
    "personal_loan",
    "medical",
    "bnpl",
    "other",
  ]),
  currentBalance: z.coerce.number().positive("Balance must be positive"),
  minimumPayment: z.coerce.number().min(0),
  annualInterestRate: z.coerce.number().min(0).max(100),
  creditLimit: z.coerce.number().min(0).optional(),
  dueDay: z.coerce.number().int().min(1).max(31).optional(),
});

type DebtFormValues = z.infer<typeof debtSchema>;

export function DebtForm({ onDone }: { onDone: () => void }) {
  const createDebt = useCreateDebt();
  const form = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: "",
      debtType: "credit_card",
      currentBalance: 0,
      minimumPayment: 0,
      annualInterestRate: 0,
    },
  });

  async function handleSave(values: DebtFormValues) {
    await createDebt.mutateAsync({
      ...values,
      creditLimit: values.creditLimit || undefined,
      dueDay: values.dueDay || undefined,
    });
    onDone();
  }

  const { errors } = form.formState;

  return (
    <form className="form-grid" onSubmit={form.handleSubmit(handleSave)}>
      <Field label="Creditor" error={errors.name?.message}>
        <input
          className="form-field__input"
          placeholder="Discover Card"
          {...form.register("name")}
        />
      </Field>
      <Field label="Debt type">
        <select {...form.register("debtType")}>
          <option value="credit_card">Credit card</option>
          <option value="auto_loan">Auto loan</option>
          <option value="mortgage">Mortgage</option>
          <option value="personal_loan">Personal loan</option>
          <option value="medical">Medical</option>
          <option value="bnpl">Buy now, pay later</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Current balance" error={errors.currentBalance?.message}>
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          min="0"
          {...form.register("currentBalance")}
        />
      </Field>
      <Field label="Minimum payment" error={errors.minimumPayment?.message}>
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          min="0"
          {...form.register("minimumPayment")}
        />
      </Field>
      <Field
        label="Interest rate (APR %)"
        error={errors.annualInterestRate?.message}
      >
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          min="0"
          {...form.register("annualInterestRate")}
        />
      </Field>
      <Field label="Credit limit (cards)">
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          min="0"
          {...form.register("creditLimit")}
        />
      </Field>
      <Field label="Due day of month">
        <input
          className="form-field__input"
          type="number"
          min={1}
          max={31}
          {...form.register("dueDay")}
        />
      </Field>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={createDebt.isPending}>
          Save debt
        </Button>
      </div>
    </form>
  );
}
