import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { billLikeCategoryIds, detectSubscriptions } from "@/calculations";
import { useCategories, useTransactions } from "@/hooks/useFinancialData";
import { formatCurrency, monthLabel, currentMonth } from "@/lib/format";

function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const { data: transactions } = useTransactions();
  const { data: categories } = useCategories();
  const month = currentMonth();

  const monthTx = (transactions ?? []).filter((t) =>
    t.transactionDate.startsWith(month),
  );
  const income = monthTx
    .filter((t) => t.transactionType === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = monthTx
    .filter((t) => t.transactionType === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const byCategory = (categories ?? [])
    .filter((category) => category.kind === "expense")
    .map((category) => ({
      name: category.name,
      total: monthTx
        .filter(
          (t) =>
            t.categoryId === category.id && t.transactionType === "expense",
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
    }))
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  const byMerchant = Object.entries(
    monthTx
      .filter((t) => t.transactionType === "expense")
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.merchant] = (acc[t.merchant] ?? 0) + Math.abs(t.amount);
        return acc;
      }, {}),
  )
    .map(([merchant, total]) => ({ merchant, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  function exportTransactions() {
    downloadCsv(`homevault-transactions-${month}.csv`, [
      ["Date", "Merchant", "Type", "Amount", "Status"],
      ...monthTx.map((t) => [
        t.transactionDate,
        t.merchant,
        t.transactionType,
        String(t.amount),
        t.status,
      ]),
    ]);
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description={`Summaries for ${monthLabel(month)}.`}
        actions={
          <Button variant="secondary" onClick={exportTransactions}>
            Export CSV
          </Button>
        }
      />
      <div className="three-col page-section">
        <Card title="Income">
          <Money value={income} className="metric-card__value money--positive" />
        </Card>
        <Card title="Expenses">
          <Money value={-expenses} className="metric-card__value money--negative" />
        </Card>
        <Card title="Net cash flow">
          <Money value={income - expenses} className="metric-card__value" />
        </Card>
      </div>
      {(() => {
        const subscriptions = detectSubscriptions(
          transactions ?? [],
          billLikeCategoryIds(categories ?? []),
        );
        if (subscriptions.length === 0) return null;
        const total = subscriptions.reduce((sum, s) => sum + s.monthlyAmount, 0);
        return (
          <Card
            title="Subscription report"
            className="page-section"
            action={
              <span className="card__title-link">
                {formatCurrency(total)}/month detected
              </span>
            }
          >
            <div className="data-list">
              {subscriptions.map((subscription) => (
                <div className="data-list__row" key={subscription.merchant}>
                  <div className="data-list__main">
                    <div className="data-list__title">
                      {subscription.merchant}
                    </div>
                    <div className="data-list__subtitle">
                      Seen in {subscription.months} months · last on{" "}
                      {subscription.lastDate}
                    </div>
                  </div>
                  <div className="data-list__end">
                    <Money value={subscription.monthlyAmount} />
                    {subscription.priceIncreased &&
                      subscription.previousAmount != null && (
                        <div style={{ marginTop: 2 }}>
                          <StatusBadge tone="amber">
                            Up from{" "}
                            {formatCurrency(subscription.previousAmount)}
                          </StatusBadge>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}
      <div className="two-col">
        <Card title="Spending by category">
          <div className="data-list">
            {byCategory.map((row) => (
              <div className="data-list__row" key={row.name}>
                <span>{row.name}</span>
                <span>{formatCurrency(row.total)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Top merchants">
          <div className="data-list">
            {byMerchant.map((row) => (
              <div className="data-list__row" key={row.merchant}>
                <span>{row.merchant}</span>
                <span>{formatCurrency(row.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
