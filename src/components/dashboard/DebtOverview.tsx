import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { calculateUtilization } from "@/calculations";
import { Debt } from "@/types";
import { formatPercent } from "@/lib/format";

interface DebtOverviewProps {
  debts: Debt[];
}

export function DebtOverview({ debts }: DebtOverviewProps) {
  const totalDebt = debts.reduce((sum, debt) => sum + debt.currentBalance, 0);
  const cards = debts.filter((debt) => debt.debtType === "credit_card");

  return (
    <Card
      title="Debt Overview"
      className="debt-panel"
      action={
        <Link className="card__title-link" to="/debt">
          Payoff plan
        </Link>
      }
    >
      <div className="metric-card__detail" style={{ marginTop: 0, marginBottom: 10 }}>
        Total debt <Money value={totalDebt} className="metric-card__value" />
      </div>
      <div className="data-list">
        {debts.map((debt) => {
          const utilization = debt.creditLimit
            ? calculateUtilization(debt.currentBalance, debt.creditLimit)
            : undefined;
          const paidPercent = debt.originalBalance
            ? ((debt.originalBalance - debt.currentBalance) /
                debt.originalBalance) *
              100
            : 0;
          return (
            <div key={debt.id} style={{ padding: "0.45rem 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 600 }}>{debt.name}</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  <Money value={debt.currentBalance} />
                  {utilization != null &&
                    ` · ${formatPercent(utilization)} used`}
                </span>
              </div>
              <ProgressBar
                percent={utilization ?? paidPercent}
                tone={
                  utilization != null
                    ? utilization > 30
                      ? "red"
                      : "green"
                    : "purple"
                }
              />
            </div>
          );
        })}
      </div>
      {cards.length > 0 && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            marginTop: 8,
          }}
        >
          Card bars show utilization (keep under 30%). Loans show principal
          paid.
        </p>
      )}
    </Card>
  );
}
