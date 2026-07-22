import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { budgetTone, ProgressBar } from "@/components/ui/ProgressBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { summarizeCategory, budgetWarningLevel } from "@/calculations";
import { useCategories, useTransactions } from "@/hooks/useFinancialData";
import { formatPercent } from "@/lib/format";

export function BudgetPage() {
  const { data: categories } = useCategories();
  const { data: transactions } = useTransactions();

  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();

  const summaries = (categories ?? [])
    .filter((category) => category.kind === "expense" && category.monthlyTarget)
    .map((category) => {
      const spent = (transactions ?? [])
        .filter(
          (t) =>
            t.categoryId === category.id &&
            t.transactionType === "expense" &&
            t.transactionDate.slice(0, 7) === month,
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return summarizeCategory(
        category.id,
        category.name,
        category.monthlyTarget ?? 0,
        spent,
        dayOfMonth,
        daysInMonth,
      );
    })
    .sort((a, b) => b.percentUsed - a.percentUsed);

  const totalTarget = summaries.reduce((sum, s) => sum + s.monthlyTarget, 0);
  const totalSpent = summaries.reduce((sum, s) => sum + s.spent, 0);

  return (
    <>
      <PageHeader
        title="Budget"
        description="Planned versus actual spending, with month-end projections."
      />
      <Card
        title="Month at a glance"
        className="page-section"
      >
        <div className="data-list__row" style={{ borderBottom: "none" }}>
          <span>
            Spent <Money value={totalSpent} /> of <Money value={totalTarget} />
          </span>
          <span style={{ color: "var(--text-secondary)" }}>
            {formatPercent(totalTarget > 0 ? (totalSpent / totalTarget) * 100 : 0)}{" "}
            of total budget used · day {dayOfMonth} of {daysInMonth}
          </span>
        </div>
        <ProgressBar
          percent={totalTarget > 0 ? (totalSpent / totalTarget) * 100 : 0}
          tone={budgetTone(totalTarget > 0 ? (totalSpent / totalTarget) * 100 : 0)}
        />
      </Card>
      <Card title="Categories">
        <div className="data-list">
          {summaries.map((summary) => {
            const level = budgetWarningLevel(summary.percentUsed);
            return (
              <div key={summary.categoryId} style={{ padding: "0.55rem 0" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                    fontSize: "0.88rem",
                  }}
                >
                  <span style={{ fontWeight: 600 }}>
                    {summary.name}{" "}
                    {level === "over" && (
                      <StatusBadge tone="red">Over budget</StatusBadge>
                    )}
                    {level === "critical" && (
                      <StatusBadge tone="red">90%+</StatusBadge>
                    )}
                    {level === "warning" && (
                      <StatusBadge tone="amber">75%+</StatusBadge>
                    )}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    <Money value={summary.spent} /> /{" "}
                    <Money value={summary.monthlyTarget} /> · projected{" "}
                    <Money value={summary.projectedMonthEnd} />
                  </span>
                </div>
                <ProgressBar
                  percent={summary.percentUsed}
                  tone={budgetTone(summary.percentUsed)}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
