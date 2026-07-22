import { Plus, TriangleAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuickActions } from "@/components/layout/QuickActionsContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { paycheckCashRemaining, daysUntil } from "@/calculations";
import {
  useBillOccurrences,
  useDashboard,
  usePaychecks,
  useRules,
} from "@/hooks/useFinancialData";
import { formatCurrency, formatDate, formatFullDate } from "@/lib/format";

export function PaycheckPlannerPage() {
  const { data: paychecks } = usePaychecks();
  const { data: occurrences } = useBillOccurrences();
  const { data: dashboard } = useDashboard();
  const { data: rules } = useRules();
  const { open } = useQuickActions();

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (paychecks ?? []).filter((p) => p.payDate >= today);
  const past = (paychecks ?? []).filter((p) => p.payDate < today);
  const buffer = rules?.minimumCheckingBuffer ?? 0;

  // Lowest projected balance between now and the first upcoming payday,
  // taken from the dashboard's cash-flow forecast.
  const firstPayday = upcoming[0]?.payDate;
  const forecastUntilPayday = (dashboard?.cashFlow ?? []).filter(
    (point) => point.forecast && (!firstPayday || point.date <= firstPayday),
  );
  const lowestPoint = forecastUntilPayday.reduce<
    { date: string; runningBalance: number } | undefined
  >(
    (lowest, point) =>
      !lowest || point.runningBalance < lowest.runningBalance
        ? { date: point.date, runningBalance: point.runningBalance }
        : lowest,
    undefined,
  );
  const overdraftRisk = lowestPoint && lowestPoint.runningBalance < buffer;

  return (
    <>
      <PageHeader
        title="Paycheck Planner"
        description="Give every incoming paycheck a job before it arrives."
        actions={
          <Button onClick={() => open("record-paycheck")}>
            <Plus size={16} /> Record paycheck
          </Button>
        }
      />
      {lowestPoint && (
        <Card
          title="Before the next payday"
          className="page-section"
        >
          <div className="data-list__row" style={{ borderBottom: "none" }}>
            <span>
              Lowest projected balance before{" "}
              {firstPayday ? formatFullDate(firstPayday) : "month end"}
            </span>
            <span
              style={{ fontWeight: 700 }}
              className={overdraftRisk ? "money--negative" : "money--positive"}
            >
              {formatCurrency(lowestPoint.runningBalance)} on{" "}
              {formatDate(lowestPoint.date)}
            </span>
          </div>
          {overdraftRisk && (
            <div className="demo-banner" role="alert">
              <TriangleAlert
                size={14}
                style={{ verticalAlign: "-2px", marginRight: 6 }}
              />
              Projected to fall below your {formatCurrency(buffer)} buffer —
              consider moving a bill to a different paycheck.
            </div>
          )}
        </Card>
      )}
      {!paychecks || paychecks.length === 0 ? (
        <EmptyState
          title="No paychecks planned"
          detail="Record a paycheck to start planning by pay period."
        />
      ) : (
        <>
          <div className="two-col">
            {[...upcoming, ...past].map((paycheck) => {
              const remaining = paycheckCashRemaining(paycheck);
              const days = daysUntil(paycheck.payDate);
              const billsDueBefore = (occurrences ?? []).filter(
                (o) =>
                  o.status !== "paid" &&
                  o.status !== "skipped" &&
                  o.dueDate <= paycheck.payDate,
              );
              return (
                <Card
                  key={paycheck.id}
                  title={`${paycheck.memberName} — ${formatFullDate(paycheck.payDate)}`}
                  action={
                    days >= 0 ? (
                      <StatusBadge tone="blue">in {days} days</StatusBadge>
                    ) : (
                      <StatusBadge tone="gray">{-days} days ago</StatusBadge>
                    )
                  }
                >
                  <div className="data-list">
                    <div className="data-list__row">
                      <span>Starting balance</span>
                      <Money value={paycheck.startingBalance} />
                    </div>
                    <div className="data-list__row">
                      <span style={{ fontWeight: 600 }}>Paycheck</span>
                      <Money
                        value={paycheck.netAmount}
                        className="money--positive"
                      />
                    </div>
                    {paycheck.allocations.map((allocation) => (
                      <div className="data-list__row" key={allocation.label}>
                        <span>{allocation.label}</span>
                        <Money value={-allocation.amount} />
                      </div>
                    ))}
                    <div className="data-list__row">
                      <span style={{ fontWeight: 700 }}>Cash available</span>
                      <Money
                        value={remaining}
                        className={
                          remaining >= 0 ? "money--positive" : "money--negative"
                        }
                      />
                    </div>
                    {days >= 0 && billsDueBefore.length > 0 && (
                      <div className="data-list__row">
                        <span className="data-list__subtitle">
                          {billsDueBefore.length} unpaid bill
                          {billsDueBefore.length === 1 ? "" : "s"} due before
                          this check
                        </span>
                        <Money
                          value={billsDueBefore.reduce(
                            (sum, o) => sum + o.expectedAmount,
                            0,
                          )}
                        />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
