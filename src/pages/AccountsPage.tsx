import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuickActions } from "@/components/layout/QuickActionsContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAccounts } from "@/hooks/useFinancialData";
import { Account, isLiabilityAccount } from "@/types";
import { formatPercent } from "@/lib/format";

const TYPE_LABELS: Record<Account["accountType"], string> = {
  checking: "Checking",
  savings: "Savings",
  credit_card: "Credit card",
  mortgage: "Mortgage",
  auto_loan: "Auto loan",
  retirement: "Retirement",
  investment: "Investment",
  "529": "529",
  cash: "Cash",
  other: "Other",
};

export function AccountsPage() {
  const { data: accounts } = useAccounts();
  const { open } = useQuickActions();

  return (
    <>
      <PageHeader
        title="Account Center"
        description="All financial accounts in one registry. No passwords or credentials are stored."
        actions={
          <Button onClick={() => open("add-account")}>
            <Plus size={16} /> Add account
          </Button>
        }
      />
      <Card>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Institution</th>
                <th>Type</th>
                <th>Flags</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {(accounts ?? []).map((account) => (
                <tr key={account.id}>
                  <td>
                    {account.name}
                    {account.lastFour ? ` ····${account.lastFour}` : ""}
                  </td>
                  <td>{account.institution ?? "—"}</td>
                  <td>{TYPE_LABELS[account.accountType]}</td>
                  <td>
                    <span style={{ display: "inline-flex", gap: 4 }}>
                      {account.includeInSafeToSpend && (
                        <StatusBadge tone="purple">Safe-to-spend</StatusBadge>
                      )}
                      {account.interestRate != null && (
                        <StatusBadge tone="blue">
                          {formatPercent(account.interestRate, 2)} APR
                        </StatusBadge>
                      )}
                      {!account.isActive && (
                        <StatusBadge tone="gray">Closed</StatusBadge>
                      )}
                    </span>
                  </td>
                  <td className="num">
                    <Money
                      value={
                        isLiabilityAccount(account)
                          ? -Math.abs(account.currentBalance)
                          : account.currentBalance
                      }
                      signed={isLiabilityAccount(account)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
