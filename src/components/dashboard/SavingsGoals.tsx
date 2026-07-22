import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { goalProgressPercent } from "@/calculations";
import { Goal } from "@/types";
import { formatPercent } from "@/lib/format";

interface SavingsGoalsProps {
  goals: Goal[];
}

export function SavingsGoals({ goals }: SavingsGoalsProps) {
  return (
    <Card
      title="Savings Goals"
      className="goals-panel"
      action={
        <Link className="card__title-link" to="/goals">
          View all
        </Link>
      }
    >
      <div className="data-list">
        {goals.slice(0, 5).map((goal) => {
          const percent = goalProgressPercent(
            goal.currentAmount,
            goal.targetAmount,
          );
          return (
            <div key={goal.id} style={{ padding: "0.45rem 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 600 }}>{goal.name}</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  <Money value={goal.currentAmount} /> /{" "}
                  <Money value={goal.targetAmount} /> · {formatPercent(percent)}
                </span>
              </div>
              <ProgressBar percent={percent} tone="green" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
