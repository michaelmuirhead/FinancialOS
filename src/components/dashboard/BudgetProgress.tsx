import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { budgetTone, ProgressBar } from "@/components/ui/ProgressBar";
import { Category, Transaction } from "@/types";
import { formatPercent } from "@/lib/format";

interface BudgetProgressProps {
  categories: Category[];
  transactions: Transaction[];
}

function spentThisMonth(
  transactions: Transaction[],
  categoryId: string,
): number {
  const month = new Date().toISOString().slice(0, 7);
  return transactions
    .filter(
      (t) =>
        t.categoryId === categoryId &&
        t.transactionType === "expense" &&
        t.transactionDate.slice(0, 7) === month,
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

export function BudgetProgress({ categories, transactions }: BudgetProgressProps) {
  const rows = categories
    .filter((category) => category.kind === "expense" && category.monthlyTarget)
    .map((category) => {
      const spent = spentThisMonth(transactions, category.id);
      const target = category.monthlyTarget ?? 0;
      const percent = target > 0 ? (spent / target) * 100 : 0;
      return { category, spent, target, percent };
    })
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  return (
    <Card
      title="Budget"
      className="budget-panel"
      action={
        <Link className="card__title-link" to="/budget">
          View all
        </Link>
      }
    >
      <div className="data-list">
        {rows.map(({ category, spent, target, percent }) => (
          <div key={category.id} style={{ padding: "0.45rem 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.82rem",
                marginBottom: 4,
              }}
            >
              <span style={{ fontWeight: 600 }}>{category.name}</span>
              <span style={{ color: "var(--text-secondary)" }}>
                <Money value={spent} /> / <Money value={target} /> ·{" "}
                {formatPercent(percent)}
              </span>
            </div>
            <ProgressBar percent={percent} tone={budgetTone(percent)} />
          </div>
        ))}
      </div>
    </Card>
  );
}
