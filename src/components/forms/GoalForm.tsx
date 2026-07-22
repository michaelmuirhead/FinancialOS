import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { Field } from "./fields";
import { useCreateGoal } from "@/hooks/useFinancialData";

const goalSchema = z.object({
  name: z.string().min(1, "Goal name is required"),
  goalType: z.enum(["savings", "sinking_fund", "emergency_fund"]),
  targetAmount: z.coerce.number().positive("Target must be positive"),
  currentAmount: z.coerce.number().min(0),
  targetDate: z.string().optional(),
  monthlyContribution: z.coerce.number().min(0).optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

export function GoalForm({ onDone }: { onDone: () => void }) {
  const createGoal = useCreateGoal();
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      goalType: "sinking_fund",
      targetAmount: 0,
      currentAmount: 0,
      targetDate: "",
      monthlyContribution: 0,
    },
  });

  async function handleSave(values: GoalFormValues) {
    await createGoal.mutateAsync({
      ...values,
      targetDate: values.targetDate || undefined,
      monthlyContribution: values.monthlyContribution || undefined,
    });
    onDone();
  }

  const { errors } = form.formState;

  return (
    <form className="form-grid" onSubmit={form.handleSubmit(handleSave)}>
      <Field label="Goal name" error={errors.name?.message}>
        <input
          className="form-field__input"
          placeholder="Christmas"
          {...form.register("name")}
        />
      </Field>
      <Field label="Type">
        <select {...form.register("goalType")}>
          <option value="sinking_fund">Sinking fund</option>
          <option value="savings">Savings goal</option>
          <option value="emergency_fund">Emergency fund</option>
        </select>
      </Field>
      <Field label="Target amount" error={errors.targetAmount?.message}>
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          min="0"
          {...form.register("targetAmount")}
        />
      </Field>
      <Field label="Current amount" error={errors.currentAmount?.message}>
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          min="0"
          {...form.register("currentAmount")}
        />
      </Field>
      <Field label="Target date">
        <input
          className="form-field__input"
          type="date"
          {...form.register("targetDate")}
        />
      </Field>
      <Field label="Monthly contribution">
        <input
          className="form-field__input"
          type="number"
          step="0.01"
          min="0"
          {...form.register("monthlyContribution")}
        />
      </Field>
      <div className="form-actions">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={createGoal.isPending}>
          Save goal
        </Button>
      </div>
    </form>
  );
}
