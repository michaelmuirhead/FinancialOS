import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { EmptyState } from "@/components/ui/EmptyState";
import { paycheckCashRemaining, daysUntil } from "@/calculations";
import { usePaychecks } from "@/hooks/useFinancialData";
import { formatFullDate } from "@/lib/format";

export function PaycheckPlannerPage() {
  const { data: paychecks } = usePaychecks();

  return (
    <>
      <PageHeader
        title="Paycheck Planner"
        description="Give every incoming paycheck a job before it arrives."
      />
      {!paychecks || paychecks.length === 0 ? (
        <EmptyState
          title="No paychecks planned"
          detail="Record a paycheck to start planning by pay period."
        />
      ) : (
        <div className="two-col">
          {paychecks.map((paycheck) => {
            const remaining = paycheckCashRemaining(paycheck);
            const days = daysUntil(paycheck.payDate);
            return (
              <Card
                key={paycheck.id}
                title={`${paycheck.memberName} — ${formatFullDate(paycheck.payDate)}`}
                action={
                  <span className="card__title-link">
                    {days >= 0 ? `in ${days} days` : `${-days} days ago`}
                  </span>
                }
              >
                <div className="data-list">
                  <div className="data-list__row">
                    <span>Starting balance</span>
                    <Money value={paycheck.startingBalance} />
                  </div>
                  <div className="data-list__row">
                    <span style={{ fontWeight: 600 }}>Paycheck</span>
                    <Money value={paycheck.netAmount} className="money--positive" />
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
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
