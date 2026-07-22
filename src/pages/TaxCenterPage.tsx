import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTransactions } from "@/hooks/useFinancialData";

const DOCUMENT_FOLDERS = [
  "W-2s",
  "1099s",
  "Donation records",
  "Childcare records",
  "Medical documents",
  "Tax returns",
  "Property-tax records",
];

export function TaxCenterPage() {
  const { data: transactions } = useTransactions();
  const year = new Date().getFullYear();

  const ytdIncome = (transactions ?? [])
    .filter(
      (t) =>
        t.transactionType === "income" &&
        t.transactionDate.startsWith(String(year)),
    )
    .reduce((sum, t) => sum + t.amount, 0);
  const ytdGiving = (transactions ?? [])
    .filter(
      (t) =>
        t.categoryId === "cat-giving" &&
        t.transactionDate.startsWith(String(year)),
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <>
      <PageHeader
        title="Tax Center"
        description={`Household tax planning and records for ${year}.`}
      />
      <div className="three-col page-section">
        <Card title="Year-to-date recorded income">
          <Money value={ytdIncome} className="metric-card__value" />
          <p className="metric-card__detail">
            From recorded income transactions. Connect paystub tracking for
            withholding detail.
          </p>
        </Card>
        <Card title="Year-to-date giving">
          <Money value={ytdGiving} className="metric-card__value" />
          <p className="metric-card__detail">
            Deductible giving recorded under the Giving category.
          </p>
        </Card>
        <Card title="Projected position">
          <StatusBadge tone="blue">Coming in Phase 4</StatusBadge>
          <p className="metric-card__detail">
            Estimated liability and expected refund will appear here once
            withholding data is tracked.
          </p>
        </Card>
      </div>
      <Card title="Tax document folders">
        <div className="data-list">
          {DOCUMENT_FOLDERS.map((folder) => (
            <div className="data-list__row" key={folder}>
              <span>{folder}</span>
              <StatusBadge tone="gray">Empty</StatusBadge>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
