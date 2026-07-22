import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuickActions } from "@/components/layout/QuickActionsContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  emergencyFundCoverageMonths,
  goalProgressPercent,
} from "@/calculations";
import { useGoals } from "@/hooks/useFinancialData";
import { formatCurrency } from "@/lib/format";

const ESSENTIAL_MONTHLY_EXPENSES = 5000;

export function SavingsPage() {
  const { data: goals } = useGoals();
  const { open } = useQuickActions();
  const list = (goals ?? []).filter((goal) => goal.goalType !== "sinking_fund");
  const emergency = list.find((goal) => goal.goalType === "emergency_fund");

  return (
    <>
      <PageHeader
        title="Savings Goals"
        description="The larger targets: emergency fund, vacation, vehicles, and beyond."
        actions={
          <Button onClick={() => open("add-goal")}>
            <Plus size={16} /> Add goal
          </Button>
        }
      />
      {emergency && (
        <Card title="Emergency fund coverage" className="page-section">
          <div className="data-list__row" style={{ borderBottom: "none" }}>
            <span>
              <Money value={emergency.currentAmount} /> saved toward{" "}
              {formatCurrency(emergency.targetAmount)} (3 months of essentials)
            </span>
            <span style={{ fontWeight: 700 }}>
              {emergencyFundCoverageMonths(
                emergency.currentAmount,
                ESSENTIAL_MONTHLY_EXPENSES,
              ).toFixed(1)}{" "}
              months covered
            </span>
          </div>
          <ProgressBar
            percent={goalProgressPercent(
              emergency.currentAmount,
              emergency.targetAmount,
            )}
            tone="green"
          />
        </Card>
      )}
      {list.length === 0 ? (
        <EmptyState title="No savings goals yet" />
      ) : (
        <div className="three-col">
          {list.map((goal) => {
            const percent = goalProgressPercent(
              goal.currentAmount,
              goal.targetAmount,
            );
            const remaining = Math.max(
              0,
              goal.targetAmount - goal.currentAmount,
            );
            const monthsToFinish =
              goal.monthlyContribution && goal.monthlyContribution > 0
                ? Math.ceil(remaining / goal.monthlyContribution)
                : undefined;
            return (
              <Card key={goal.id} title={goal.name}>
                <div className="metric-card__value">
                  <Money value={goal.currentAmount} />{" "}
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    of {formatCurrency(goal.targetAmount)}
                  </span>
                </div>
                <div style={{ margin: "0.6rem 0" }}>
                  <ProgressBar percent={percent} tone="green" />
                </div>
                <div className="data-list">
                  <div className="data-list__row">
                    <span>Remaining</span>
                    <Money value={remaining} />
                  </div>
                  {goal.monthlyContribution != null && (
                    <div className="data-list__row">
                      <span>Monthly contribution</span>
                      <Money value={goal.monthlyContribution} />
                    </div>
                  )}
                  {monthsToFinish != null && (
                    <div className="data-list__row">
                      <span>Months to finish</span>
                      <span>{monthsToFinish}</span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
