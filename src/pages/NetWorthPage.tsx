import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";
import { NetWorthTrend } from "@/components/dashboard/NetWorthTrend";
import { netWorthFromAccounts } from "@/calculations";
import { isLiabilityAccount } from "@/types";
import { useAccounts, useNetWorthHistory } from "@/hooks/useFinancialData";

export function NetWorthPage() {
  const { data: accounts } = useAccounts();
  const { data: history } = useNetWorthHistory();

  const included = (accounts ?? []).filter(
    (account) => account.isActive && account.includeInNetWorth,
  );
  const assets = included.filter((account) => !isLiabilityAccount(account));
  const liabilities = included.filter(isLiabilityAccount);
  const breakdown = netWorthFromAccounts(accounts ?? []);

  return (
    <>
      <PageHeader
        title="Net Worth"
        description="The monthly balance sheet: everything owned minus everything owed."
      />
      <div className="three-col page-section">
        <Card title="Total assets">
          <Money value={breakdown.totalAssets} className="metric-card__value money--positive" />
        </Card>
        <Card title="Total liabilities">
          <Money value={-breakdown.totalLiabilities} className="metric-card__value money--negative" />
        </Card>
        <Card title="Net worth">
          <Money value={breakdown.netWorth} className="metric-card__value" />
        </Card>
      </div>
      <div className="two-col page-section">
        <Card title="Assets">
          <div className="data-list">
            {assets.map((account) => (
              <div className="data-list__row" key={account.id}>
                <div className="data-list__main">
                  <div className="data-list__title">{account.name}</div>
                  <div className="data-list__subtitle">
                    {account.institution ?? account.accountType}
                  </div>
                </div>
                <Money value={account.currentBalance} />
              </div>
            ))}
          </div>
        </Card>
        <Card title="Liabilities">
          <div className="data-list">
            {liabilities.map((account) => (
              <div className="data-list__row" key={account.id}>
                <div className="data-list__main">
                  <div className="data-list__title">{account.name}</div>
                  <div className="data-list__subtitle">
                    {account.institution ?? account.accountType}
                  </div>
                </div>
                <Money value={-Math.abs(account.currentBalance)} />
              </div>
            ))}
          </div>
        </Card>
      </div>
      {history && <NetWorthTrend data={history} />}
    </>
  );
}
