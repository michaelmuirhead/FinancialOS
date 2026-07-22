import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuickActions } from "@/components/layout/QuickActionsContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  calculateUtilization,
  orderDebtsByStrategy,
  projectPayoff,
} from "@/calculations";
import { useDebts } from "@/hooks/useFinancialData";
import { PayoffStrategy } from "@/types";
import { formatCurrency, formatFullDate, formatPercent } from "@/lib/format";

const STRATEGIES: { value: PayoffStrategy; label: string; hint: string }[] = [
  { value: "snowball", label: "Snowball", hint: "Smallest balance first" },
  { value: "avalanche", label: "Avalanche", hint: "Highest interest first" },
  {
    value: "utilization",
    label: "Utilization",
    hint: "Highest card utilization first",
  },
  { value: "custom", label: "Custom", hint: "Your chosen order" },
];

export function DebtPage() {
  const { data: debts } = useDebts();
  const { open } = useQuickActions();
  const [strategy, setStrategy] = useState<PayoffStrategy>("avalanche");
  const [extra, setExtra] = useState(250);

  const list = debts ?? [];
  const ordered = orderDebtsByStrategy(list, strategy);
  const projection = list.length
    ? projectPayoff(list, extra, strategy)
    : undefined;
  const baseline = list.length
    ? projectPayoff(list, 0, strategy)
    : undefined;
  const totalDebt = list.reduce((sum, debt) => sum + debt.currentBalance, 0);

  return (
    <>
      <PageHeader
        title="Debt Payoff"
        description="Every balance, one strategy, a date you become debt-free."
        actions={
          <Button onClick={() => open("add-debt")}>
            <Plus size={16} /> Add debt
          </Button>
        }
      />
      <div className="three-col page-section">
        <Card title="Strategy">
          <div className="form-grid">
            <select
              value={strategy}
              onChange={(event) =>
                setStrategy(event.target.value as PayoffStrategy)
              }
            >
              {STRATEGIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label} — {s.hint}
                </option>
              ))}
            </select>
            <label className="form-field__label">
              Extra monthly payment
              <input
                className="form-field__input"
                type="number"
                min={0}
                step={25}
                value={extra}
                onChange={(event) => setExtra(Number(event.target.value) || 0)}
              />
            </label>
          </div>
        </Card>
        <Card title="Projection">
          {projection ? (
            <div className="data-list">
              <div className="data-list__row">
                <span>Total debt</span>
                <Money value={totalDebt} />
              </div>
              <div className="data-list__row">
                <span>Debt-free by</span>
                <span style={{ fontWeight: 700 }}>
                  {formatFullDate(projection.debtFreeDate)}
                </span>
              </div>
              <div className="data-list__row">
                <span>Months remaining</span>
                <span>{projection.months}</span>
              </div>
              <div className="data-list__row">
                <span>Projected interest</span>
                <Money value={projection.totalInterest} />
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)" }}>Add a debt to project.</p>
          )}
        </Card>
        <Card title="Extra-payment impact">
          {projection && baseline ? (
            <div className="data-list">
              <div className="data-list__row">
                <span>Months saved</span>
                <span style={{ fontWeight: 700 }}>
                  {Math.max(0, baseline.months - projection.months)}
                </span>
              </div>
              <div className="data-list__row">
                <span>Interest saved</span>
                <span className="money--positive">
                  {formatCurrency(
                    Math.max(
                      0,
                      baseline.totalInterest - projection.totalInterest,
                    ),
                  )}
                </span>
              </div>
              <div className="data-list__row">
                <span>Extra applied</span>
                <Money value={extra} />
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-secondary)" }}>—</p>
          )}
        </Card>
      </div>
      <Card title={`Payoff order — ${STRATEGIES.find((s) => s.value === strategy)?.label}`}>
        <div className="data-list">
          {ordered.map((debt, index) => {
            const utilization = debt.creditLimit
              ? calculateUtilization(debt.currentBalance, debt.creditLimit)
              : undefined;
            return (
              <div key={debt.id} style={{ padding: "0.55rem 0" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                    fontSize: "0.88rem",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {index + 1}. {debt.name}{" "}
                    {index === 0 && <StatusBadge tone="blue">Focus</StatusBadge>}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    <Money value={debt.currentBalance} /> ·{" "}
                    {formatPercent(debt.annualInterestRate, 2)} APR · min{" "}
                    <Money value={debt.minimumPayment} />
                    {utilization != null &&
                      ` · ${formatPercent(utilization)} utilization`}
                  </span>
                </div>
                {utilization != null && (
                  <ProgressBar
                    percent={utilization}
                    tone={utilization > 30 ? "red" : "green"}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
