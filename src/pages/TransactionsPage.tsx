import { useMemo, useState } from "react";
import { FileUp, Plus, Wand2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuickActions } from "@/components/layout/QuickActionsContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImportTransactionsModal } from "@/components/forms/ImportTransactionsModal";
import {
  useAccounts,
  useCategories,
  useCategoryRules,
  useDeleteCategoryRule,
  useTransactions,
  useUpdateTransactionCategory,
  useUpdateTransactionStatus,
  useUpsertCategoryRule,
} from "@/hooks/useFinancialData";
import { TransactionStatus } from "@/types";
import { formatDate } from "@/lib/format";

type StatusFilter = "all" | TransactionStatus;

export function TransactionsPage() {
  const { data: transactions } = useTransactions();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: rules } = useCategoryRules();
  const { open } = useQuickActions();
  const updateCategory = useUpdateTransactionCategory();
  const updateStatus = useUpdateTransactionStatus();
  const upsertRule = useUpsertCategoryRule();
  const deleteRule = useDeleteCategoryRule();

  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showImport, setShowImport] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const accountName = useMemo(
    () => new Map((accounts ?? []).map((a) => [a.id, a.name])),
    [accounts],
  );
  const categoryName = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c.name])),
    [categories],
  );

  const all = transactions ?? [];
  const counts = {
    pending: all.filter((t) => t.status === "pending").length,
    posted: all.filter((t) => t.status === "posted").length,
    reconciled: all.filter((t) => t.status === "reconciled").length,
  };

  const rows = all.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (!filter) return true;
    const lowered = filter.toLowerCase();
    return (
      t.merchant.toLowerCase().includes(lowered) ||
      (categoryName.get(t.categoryId ?? "") ?? "")
        .toLowerCase()
        .includes(lowered)
    );
  });

  function handleCategoryChange(
    transactionId: string,
    merchant: string,
    categoryId: string,
  ) {
    updateCategory.mutate({
      transactionId,
      categoryId: categoryId || undefined,
    });
    // Learn the choice so future imports categorize this merchant themselves.
    if (categoryId) {
      upsertRule.mutate({
        merchantPattern: merchant.toLowerCase().trim(),
        categoryId,
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        description="The household ledger — categorize once and the app remembers the merchant."
        actions={
          <>
            <input
              className="form-field__input"
              placeholder="Search merchant or category…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              style={{ width: 200 }}
            />
            <Button variant="secondary" onClick={() => setShowRules(true)}>
              <Wand2 size={15} /> Rules ({(rules ?? []).length})
            </Button>
            <Button variant="secondary" onClick={() => setShowImport(true)}>
              <FileUp size={15} /> Import CSV
            </Button>
            <Button onClick={() => open("add-transaction")}>
              <Plus size={16} /> Add
            </Button>
          </>
        }
      />

      <Card className="page-section">
        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}
        >
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            Reconciliation:
          </span>
          {(
            [
              ["all", `All (${all.length})`],
              ["pending", `Pending (${counts.pending})`],
              ["posted", `Posted (${counts.posted})`],
              ["reconciled", `Reconciled (${counts.reconciled})`],
            ] as const
          ).map(([value, label]) => (
            <Button
              key={value}
              variant={statusFilter === value ? "primary" : "secondary"}
              onClick={() => setStatusFilter(value)}
              style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem" }}
            >
              {label}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No transactions found"
            detail={
              filter || statusFilter !== "all"
                ? "Try a different search or filter."
                : "Add or import your first transactions."
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Merchant</th>
                  <th>Category</th>
                  <th>Account</th>
                  <th>Status</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{formatDate(transaction.transactionDate)}</td>
                    <td>
                      {transaction.merchant}
                      {transaction.memberName
                        ? ` · ${transaction.memberName}`
                        : ""}
                    </td>
                    <td>
                      <select
                        value={transaction.categoryId ?? ""}
                        onChange={(event) =>
                          handleCategoryChange(
                            transaction.id,
                            transaction.merchant,
                            event.target.value,
                          )
                        }
                        aria-label={`Category for ${transaction.merchant}`}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "0.2rem 0.4rem",
                          font: "inherit",
                          fontSize: "0.82rem",
                          background:
                            transaction.categoryId == null
                              ? "var(--amber-100)"
                              : "var(--surface)",
                        }}
                      >
                        <option value="">Uncategorized</option>
                        {(categories ?? []).map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{accountName.get(transaction.accountId) ?? "—"}</td>
                    <td>
                      <select
                        value={transaction.status}
                        onChange={(event) =>
                          updateStatus.mutate({
                            transactionId: transaction.id,
                            status: event.target.value as TransactionStatus,
                          })
                        }
                        aria-label={`Status for ${transaction.merchant}`}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "0.2rem 0.4rem",
                          font: "inherit",
                          fontSize: "0.82rem",
                        }}
                      >
                        <option value="pending">Pending</option>
                        <option value="posted">Posted</option>
                        <option value="reconciled">Reconciled</option>
                      </select>
                    </td>
                    <td className="num">
                      <Money value={transaction.amount} signed />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showImport && (
        <ImportTransactionsModal onClose={() => setShowImport(false)} />
      )}

      {showRules && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowRules(false);
          }}
        >
          <div className="modal" role="dialog" aria-modal="true">
            <div className="modal__header">
              <h2 className="modal__title">Merchant rules</h2>
              <button
                className="modal__close"
                onClick={() => setShowRules(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                marginBottom: 10,
              }}
            >
              When a merchant name contains the pattern, imports and new
              transactions get the category automatically. Rules are created
              when you categorize a transaction in the ledger.
            </p>
            {(rules ?? []).length === 0 ? (
              <EmptyState title="No rules yet" />
            ) : (
              <div className="data-list">
                {(rules ?? []).map((rule) => (
                  <div className="data-list__row" key={rule.id}>
                    <div className="data-list__main">
                      <span className="data-list__title">
                        “{rule.merchantPattern}”
                      </span>
                      <span className="data-list__subtitle">
                        → {categoryName.get(rule.categoryId) ?? "Unknown"}
                      </span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => deleteRule.mutate(rule.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {counts.pending > 0 && statusFilter === "all" && (
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--text-secondary)",
            marginTop: 10,
          }}
        >
          <StatusBadge tone="gray">{counts.pending} pending</StatusBadge>{" "}
          Mark transactions Reconciled once they match your bank statement.
        </p>
      )}
    </>
  );
}
