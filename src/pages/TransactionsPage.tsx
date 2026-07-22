import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuickActions } from "@/components/layout/QuickActionsContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useAccounts,
  useCategories,
  useTransactions,
} from "@/hooks/useFinancialData";
import { formatDate } from "@/lib/format";

export function TransactionsPage() {
  const { data: transactions } = useTransactions();
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { open } = useQuickActions();
  const [filter, setFilter] = useState("");

  const accountName = useMemo(
    () => new Map((accounts ?? []).map((a) => [a.id, a.name])),
    [accounts],
  );
  const categoryName = useMemo(
    () => new Map((categories ?? []).map((c) => [c.id, c.name])),
    [categories],
  );

  const rows = (transactions ?? []).filter((t) =>
    filter
      ? t.merchant.toLowerCase().includes(filter.toLowerCase()) ||
        (categoryName.get(t.categoryId ?? "") ?? "")
          .toLowerCase()
          .includes(filter.toLowerCase())
      : true,
  );

  return (
    <>
      <PageHeader
        title="Transactions"
        description="The household ledger — every movement of money in one place."
        actions={
          <>
            <input
              className="form-field__input"
              placeholder="Search merchant or category…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              style={{ width: 220 }}
            />
            <Button onClick={() => open("add-transaction")}>
              <Plus size={16} /> Add transaction
            </Button>
          </>
        }
      />
      <Card>
        {rows.length === 0 ? (
          <EmptyState
            title="No transactions found"
            detail={filter ? "Try a different search." : "Add your first transaction."}
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
                      {transaction.memberName ? ` · ${transaction.memberName}` : ""}
                    </td>
                    <td>
                      {categoryName.get(transaction.categoryId ?? "") ?? (
                        <StatusBadge tone="amber">Uncategorized</StatusBadge>
                      )}
                    </td>
                    <td>{accountName.get(transaction.accountId) ?? "—"}</td>
                    <td>
                      <StatusBadge
                        tone={
                          transaction.status === "reconciled"
                            ? "green"
                            : transaction.status === "posted"
                              ? "blue"
                              : "gray"
                        }
                      >
                        {transaction.status}
                      </StatusBadge>
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
    </>
  );
}
