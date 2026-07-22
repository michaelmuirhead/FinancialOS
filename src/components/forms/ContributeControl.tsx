import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useContributeToGoal } from "@/hooks/useFinancialData";

/** Inline "add money to this goal" control shown on goal and fund cards. */
export function ContributeControl({ goalId }: { goalId: string }) {
  const [amount, setAmount] = useState("");
  const contribute = useContributeToGoal();
  const parsed = Number(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;

  return (
    <form
      style={{ display: "flex", gap: 6, marginTop: 10 }}
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        contribute.mutate(
          { goalId, amount: parsed },
          { onSuccess: () => setAmount("") },
        );
      }}
    >
      <input
        className="form-field__input"
        type="number"
        step="0.01"
        min="0"
        placeholder="Amount"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        style={{ flex: 1 }}
        aria-label="Contribution amount"
      />
      <Button
        type="submit"
        variant="secondary"
        disabled={!valid || contribute.isPending}
      >
        <Plus size={14} /> Add
      </Button>
    </form>
  );
}
