import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuickActions } from "@/components/layout/QuickActionsContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ContributeControl } from "@/components/forms/ContributeControl";
import {
  goalProgressPercent,
  monthsBetween,
  requiredMonthlyContribution,
} from "@/calculations";
import { useGoals } from "@/hooks/useFinancialData";
import { formatCurrency, formatFullDate } from "@/lib/format";

export function SinkingFundsPage() {
  const { data: goals } = useGoals();
  const { open } = useQuickActions();
  const funds = (goals ?? []).filter((goal) => goal.goalType === "sinking_fund");
  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <PageHeader
        title="Sinking Funds"
        description="Save a little every month for the expenses you already know are coming."
        actions={
          <Button onClick={() => open("add-goal")}>
            <Plus size={16} /> Add fund
          </Button>
        }
      />
      {funds.length === 0 ? (
        <EmptyState
          title="No sinking funds yet"
          detail="Christmas, car repairs, school clothes — plan them before they arrive."
        />
      ) : (
        <div className="three-col">
          {funds.map((fund) => {
            const percent = goalProgressPercent(
              fund.currentAmount,
              fund.targetAmount,
            );
            const monthsRemaining = fund.targetDate
              ? Math.max(0, monthsBetween(today, fund.targetDate))
              : undefined;
            const needed =
              monthsRemaining != null
                ? requiredMonthlyContribution(
                    fund.targetAmount,
                    fund.currentAmount,
                    monthsRemaining,
                  )
                : fund.monthlyContribution;
            return (
              <Card key={fund.id} title={fund.name}>
                <div className="metric-card__value">
                  <Money value={fund.currentAmount} />{" "}
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      fontWeight: 500,
                    }}
                  >
                    of {formatCurrency(fund.targetAmount)}
                  </span>
                </div>
                <div style={{ margin: "0.6rem 0" }}>
                  <ProgressBar percent={percent} tone="purple" />
                </div>
                <div className="data-list">
                  {fund.targetDate && (
                    <div className="data-list__row">
                      <span>Target date</span>
                      <span>{formatFullDate(fund.targetDate)}</span>
                    </div>
                  )}
                  {monthsRemaining != null && (
                    <div className="data-list__row">
                      <span>Months remaining</span>
                      <span>{monthsRemaining}</span>
                    </div>
                  )}
                  {needed != null && (
                    <div className="data-list__row">
                      <span>Needed monthly</span>
                      <Money value={needed} />
                    </div>
                  )}
                </div>
                <ContributeControl goalId={fund.id} />
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
