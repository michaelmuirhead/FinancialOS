import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuickActions } from "@/components/layout/QuickActionsContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  buildForecastEntries,
  buildForecastLedger,
  buildForecastMilestones,
  ForecastEntryKind,
} from "@/calculations";
import {
  useAccounts,
  useBillOccurrences,
  useBills,
  useCategories,
  useDebts,
  useGoals,
  usePaychecks,
} from "@/hooks/useFinancialData";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDate,
  formatFullDate,
} from "@/lib/format";

const KIND_META: Record<
  ForecastEntryKind,
  { label: string; tone: "green" | "blue" | "amber" | "purple" | "gray" }
> = {
  income: { label: "income", tone: "green" },
  essential: { label: "essential", tone: "blue" },
  debt: { label: "debt", tone: "amber" },
  sub: { label: "sub", tone: "purple" },
  transfer: { label: "transfer", tone: "gray" },
};

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function ForecastPage() {
  const { open } = useQuickActions();
  const { data: accounts } = useAccounts();
  const { data: bills } = useBills();
  const { data: occurrences } = useBillOccurrences();
  const { data: paychecks } = usePaychecks();
  const { data: debts } = useDebts();
  const { data: goals } = useGoals();
  const { data: categories } = useCategories();

  const year = new Date().getFullYear();
  const periods = useMemo(
    () => [
      { value: addDaysIso(30), label: "30-day" },
      { value: addDaysIso(60), label: "60-day" },
      { value: addDaysIso(90), label: "90-day" },
      { value: `${year}-12-31`, label: `Year-end (Dec 31)` },
      { value: `${year + 1}-12-31`, label: `End of ${year + 1}` },
    ],
    [year],
  );
  const [periodEnd, setPeriodEnd] = useState(periods[0].value);

  const ready =
    accounts && bills && occurrences && paychecks && debts && goals && categories;

  const startingBalance = (accounts ?? [])
    .filter((account) => account.isActive && account.includeInSafeToSpend)
    .reduce(
      (sum, account) =>
        sum + (account.availableBalance ?? account.currentBalance),
      0,
    );

  const input = useMemo(
    () => ({
      bills: bills ?? [],
      occurrences: occurrences ?? [],
      paychecks: paychecks ?? [],
      debts: debts ?? [],
      goals: goals ?? [],
      categories: categories ?? [],
    }),
    [bills, occurrences, paychecks, debts, goals, categories],
  );

  const milestones = useMemo(
    () => (ready ? buildForecastMilestones(startingBalance, input) : []),
    [ready, startingBalance, input],
  );

  const entries = useMemo(
    () => (ready ? buildForecastEntries(input, periodEnd) : []),
    [ready, input, periodEnd],
  );
  const ledger = useMemo(
    () => buildForecastLedger(startingBalance, entries),
    [startingBalance, entries],
  );

  const income = entries
    .filter((entry) => entry.amount > 0)
    .reduce((sum, entry) => sum + entry.amount, 0);
  const debits = entries
    .filter((entry) => entry.amount < 0)
    .reduce((sum, entry) => sum + Math.abs(entry.amount), 0);
  const endBalance = ledger.length
    ? ledger[ledger.length - 1].balance
    : startingBalance;

  const chartData = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const points = [{ date: today, balance: startingBalance }];
    for (const row of ledger) {
      const last = points[points.length - 1];
      if (last.date === row.date) last.balance = row.balance;
      else points.push({ date: row.date, balance: row.balance });
    }
    return points;
  }, [ledger, startingBalance]);

  const lowest = chartData.reduce(
    (min, point) => Math.min(min, point.balance),
    startingBalance,
  );

  if (!ready) {
    return <p style={{ color: "var(--text-secondary)" }}>Building forecast…</p>;
  }

  return (
    <>
      <PageHeader
        title="Forecast"
        description="Where the balance is headed — every scheduled bill, paycheck, minimum payment, and transfer, day by day."
        actions={
          <Button variant="secondary" onClick={() => open("import-screenshot")}>
            <Camera size={15} /> Import from screenshot
          </Button>
        }
      />

      <div className="metrics-row metrics-row--six">
        <section className="metric-card metric-card--blue">
          <p className="metric-card__label">Today's balance</p>
          <Money value={startingBalance} className="metric-card__value" />
          <div className="metric-card__detail">{formatFullDate(new Date().toISOString().slice(0, 10))}</div>
        </section>
        {milestones.map((milestone) => (
          <section
            key={milestone.label}
            className={`metric-card metric-card--${milestone.delta >= 0 ? "green" : "red"}`}
          >
            <p className="metric-card__label">{milestone.label}</p>
            <Money
              value={milestone.delta}
              signed
              className="metric-card__value"
            />
            <div className="metric-card__detail">{milestone.caption}</div>
          </section>
        ))}
      </div>

      <Card
        title="Forecast period"
        className="page-section"
        action={
          <select
            value={periodEnd}
            onChange={(event) => setPeriodEnd(event.target.value)}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "0.3rem 0.5rem",
              font: "inherit",
              fontSize: "0.82rem",
            }}
            aria-label="Forecast period"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        }
      >
        <div className="three-col" style={{ marginBottom: "1rem" }}>
          <div>
            <p className="metric-card__label">Income</p>
            <Money value={income} className="metric-card__value money--positive" />
          </div>
          <div>
            <p className="metric-card__label">Total debits</p>
            <Money value={-debits} className="metric-card__value money--negative" />
          </div>
          <div>
            <p className="metric-card__label">
              End balance · {entries.length} entries
            </p>
            <Money
              value={endBalance}
              className={`metric-card__value ${endBalance < 0 ? "money--negative" : ""}`}
            />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--blue-600)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--blue-600)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11 }}
              minTickGap={40}
            />
            <YAxis
              tickFormatter={(v: number) => formatCompactCurrency(v)}
              tick={{ fontSize: 11 }}
              width={54}
              domain={[Math.min(0, lowest), "auto"]}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={(label) => formatDate(String(label))}
            />
            <ReferenceLine y={0} stroke="var(--red-600)" strokeDasharray="4 4" />
            <Area
              type="stepAfter"
              dataKey="balance"
              name="Projected balance"
              stroke="var(--blue-600)"
              strokeWidth={2}
              fill="url(#forecastFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
        {lowest < 0 && (
          <div className="demo-banner" role="alert">
            The projection dips below zero (lowest {formatCurrency(lowest)}).
            Move a bill or add income before then.
          </div>
        )}
      </Card>

      <Card title="Day-by-day ledger">
        {ledger.length === 0 ? (
          <EmptyState
            title="Nothing scheduled in this window"
            detail="Add bills or record paychecks to build the projection."
          />
        ) : (
          <div className="table-wrap" style={{ maxHeight: 480, overflowY: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th className="num">Amount</th>
                  <th className="num">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{formatDate(new Date().toISOString().slice(0, 10))}</td>
                  <td style={{ fontWeight: 600 }}>Starting balance</td>
                  <td>—</td>
                  <td className="num">—</td>
                  <td className="num">
                    <Money value={startingBalance} />
                  </td>
                </tr>
                {ledger.map((row, index) => (
                  <tr key={index}>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.description}</td>
                    <td>
                      <StatusBadge tone={KIND_META[row.kind].tone}>
                        {KIND_META[row.kind].label}
                      </StatusBadge>
                    </td>
                    <td className="num">
                      <Money value={row.amount} signed />
                    </td>
                    <td
                      className="num"
                      style={row.balance < 0 ? { color: "var(--red-600)", fontWeight: 600 } : undefined}
                    >
                      <Money value={row.balance} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
