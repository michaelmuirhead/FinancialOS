import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  TriangleAlert,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { buildMonthlyReview, ReviewStatus } from "@/calculations";
import {
  useAccounts,
  useBillOccurrences,
  useCategories,
  useDebts,
  useGoals,
  useNetWorthHistory,
  useRules,
  useTransactions,
} from "@/hooks/useFinancialData";

function StatusIcon({ status }: { status: ReviewStatus }) {
  switch (status) {
    case "good":
      return <CheckCircle2 size={18} style={{ color: "var(--green-600)" }} />;
    case "warn":
      return <CircleAlert size={18} style={{ color: "var(--amber-500)" }} />;
    case "action":
      return <TriangleAlert size={18} style={{ color: "var(--red-600)" }} />;
  }
}

export function MonthlyReviewPage() {
  const { data: transactions } = useTransactions();
  const { data: occurrences } = useBillOccurrences();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: goals } = useGoals();
  const { data: debts } = useDebts();
  const { data: rules } = useRules();
  const { data: netWorthHistory } = useNetWorthHistory();

  const ready =
    transactions &&
    occurrences &&
    accounts &&
    categories &&
    goals &&
    debts &&
    rules &&
    netWorthHistory;

  if (!ready) {
    return <p style={{ color: "var(--text-secondary)" }}>Preparing review…</p>;
  }

  const review = buildMonthlyReview({
    transactions,
    occurrences,
    accounts,
    categories,
    goals,
    debts,
    rules,
    netWorthHistory,
  });

  return (
    <>
      <PageHeader
        title={`Monthly Review — ${review.monthLabel}`}
        description="A guided month-end walkthrough: what happened, and what to do next."
      />
      <div className="three-col page-section">
        <Card title="Income">
          <Money
            value={review.stats.income}
            className="metric-card__value money--positive"
          />
        </Card>
        <Card title="Spending">
          <Money
            value={-review.stats.spending}
            className="metric-card__value money--negative"
          />
        </Card>
        <Card title="Net worth change">
          <Money
            value={review.stats.netWorthChange}
            signed
            className="metric-card__value"
          />
        </Card>
      </div>
      <div className="two-col">
        <Card title="Month-end checklist">
          <div className="data-list">
            {review.checklist.map((item) => (
              <div className="data-list__row" key={item.id}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <StatusIcon status={item.status} />
                  <div className="data-list__main">
                    <div className="data-list__title">{item.question}</div>
                    <div className="data-list__subtitle">{item.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Your action plan">
          {review.actionPlan.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Nothing needs attention — a clean month.
            </p>
          ) : (
            <ol style={{ margin: 0, paddingLeft: "1.2rem", display: "grid", gap: 10 }}>
              {review.actionPlan.map((action, index) => (
                <li key={index} style={{ fontSize: "0.9rem" }}>
                  {action.text}{" "}
                  {action.link && (
                    <Link
                      to={action.link}
                      style={{
                        color: "var(--blue-600)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      Go <ArrowRight size={12} style={{ verticalAlign: "-1px" }} />
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
