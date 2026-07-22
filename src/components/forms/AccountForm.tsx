import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Field } from "./fields";
import { useCreateAccount } from "@/hooks/useFinancialData";

const accountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  institution: z.string().optional(),
  accountType: z.enum([
    "checking",
    "savings",
    "credit_card",
    "mortgage",
    "auto_loan",
    "retirement",
    "investment",
    "529",
    "cash",
    "other",
  ]),
  lastFour: z.string().max(4).optional(),
  currentBalance: z.coerce.number(),
  includeInSafeToSpend: z.boolean(),
});

type AccountFormValues = z.infer<typeof accountSchema>;

export function AccountForm({ onDone }: { onDone: () => void }) {
  const createAccount = useCreateAccount();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      institution: "",
      accountType: "checking",
      lastFour: "",
      currentBalance: 0,
      includeInSafeToSpend: false,
    },
  });

  async function handleSave(values: AccountFormValues) {
    await createAccount.mutateAsync({
      ...values,
      institution: values.institution || undefined,
      lastFour: values.lastFour || undefined,
    });
    onDone();
  }

  const { errors } = form.formState;

  return (
    <form className="form-grid" onSubmit={form.handleSubmit(handleSave)}>
      <Field label="Account name" error={errors.name?.message}>
        <input
          className="form-field__input"
          placeholder="Primary Checking"
          {...form.register("name")}
        />
      </Field>
      <Field label="Institution">
        <input className="form-field__input" {...form.register("institution")} />
      </Field>
      <Field label="Account type">
        <select {...form.register("accountType")}>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="credit_card">Credit card</option>
          <option value="auto_loan">Auto loan</option>
          <option value="mortgage">Mortgage</option>
          <option value="retirement">Retirement</option>
          <option value="investment">Investment</option>
          <option value="529">529</option>
          <option value="cash">Cash</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Last four digits">
        <input
          className="form-field__input"
          maxLength={4}
          {...form.register("lastFour")}
        />
      </Field>
      <Field label="Current balance" error={errors.currentBalance?.message}>
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          {...form.register("currentBalance")}
        />
      </Field>
      <div className="form-field form-field--checkbox">
        <input
          id="account-sts"
          type="checkbox"
          {...form.register("includeInSafeToSpend")}
        />
        <label htmlFor="account-sts" className="form-field__label">
          Count toward safe-to-spend
        </label>
      </div>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={createAccount.isPending}>
          Save account
        </Button>
      </div>
    </form>
  );
}
