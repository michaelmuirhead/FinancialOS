import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Field } from "./fields";
import { useCreatePaycheck } from "@/hooks/useFinancialData";
import { PaycheckAllocation } from "@/types";

const paycheckSchema = z.object({
  memberName: z.string().min(1, "Name is required"),
  payDate: z.string().min(1, "Pay date is required"),
  netAmount: z.coerce.number().positive("Net amount must be positive"),
  startingBalance: z.coerce.number(),
  bills: z.coerce.number().min(0),
  giving: z.coerce.number().min(0),
  groceries: z.coerce.number().min(0),
  gas: z.coerce.number().min(0),
  debt: z.coerce.number().min(0),
  savings: z.coerce.number().min(0),
  buffer: z.coerce.number().min(0),
});

type PaycheckFormValues = z.infer<typeof paycheckSchema>;

const ALLOCATION_FIELDS: {
  key: keyof Pick<
    PaycheckFormValues,
    "bills" | "giving" | "groceries" | "gas" | "debt" | "savings" | "buffer"
  >;
  label: string;
  kind: PaycheckAllocation["kind"];
}[] = [
  { key: "bills", label: "Bills assigned", kind: "bills" },
  { key: "giving", label: "Giving", kind: "giving" },
  { key: "groceries", label: "Groceries", kind: "groceries" },
  { key: "gas", label: "Gas", kind: "gas" },
  { key: "debt", label: "Debt payment", kind: "debt" },
  { key: "savings", label: "Savings", kind: "savings" },
  { key: "buffer", label: "Required buffer", kind: "buffer" },
];

export function PaycheckForm({ onDone }: { onDone: () => void }) {
  const createPaycheck = useCreatePaycheck();
  const form = useForm<PaycheckFormValues>({
    resolver: zodResolver(paycheckSchema),
    defaultValues: {
      memberName: "",
      payDate: new Date().toISOString().slice(0, 10),
      netAmount: 0,
      startingBalance: 0,
      bills: 0,
      giving: 0,
      groceries: 0,
      gas: 0,
      debt: 0,
      savings: 0,
      buffer: 500,
    },
  });

  async function handleSave(values: PaycheckFormValues) {
    const allocations = ALLOCATION_FIELDS.map((field) => ({
      label: field.label,
      amount: values[field.key],
      kind: field.kind,
    })).filter((allocation) => allocation.amount > 0);
    await createPaycheck.mutateAsync({
      memberName: values.memberName,
      payDate: values.payDate,
      netAmount: values.netAmount,
      startingBalance: values.startingBalance,
      allocations,
    });
    onDone();
  }

  const { errors } = form.formState;
  const watched = form.watch();
  const allocated = ALLOCATION_FIELDS.reduce(
    (sum, field) => sum + (Number(watched[field.key]) || 0),
    0,
  );
  const remaining =
    (Number(watched.startingBalance) || 0) +
    (Number(watched.netAmount) || 0) -
    allocated;

  return (
    <form className="form-grid" onSubmit={form.handleSubmit(handleSave)}>
      <Field label="Household member" error={errors.memberName?.message}>
        <input
          className="form-field__input"
          placeholder="Michael"
          {...form.register("memberName")}
        />
      </Field>
      <Field label="Pay date" error={errors.payDate?.message}>
        <input
          className="form-field__input"
          type="date"
          {...form.register("payDate")}
        />
      </Field>
      <Field label="Net paycheck amount" error={errors.netAmount?.message}>
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          min="0"
          {...form.register("netAmount")}
        />
      </Field>
      <Field label="Starting balance" error={errors.startingBalance?.message}>
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          {...form.register("startingBalance")}
        />
      </Field>
      <div className="two-col">
        {ALLOCATION_FIELDS.map((field) => (
          <Field key={field.key} label={field.label}>
            <input
              className="form-field__input"
              type="number"
              step="0.01"
              min="0"
              {...form.register(field.key)}
            />
          </Field>
        ))}
      </div>
      <div
        className="data-list__row"
        style={{ borderBottom: "none", fontWeight: 700 }}
      >
        <span>Cash available after allocations</span>
        <span className={remaining >= 0 ? "money--positive" : "money--negative"}>
          {remaining.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })}
        </span>
      </div>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={createPaycheck.isPending}>
          Record paycheck
        </Button>
      </div>
    </form>
  );
}
