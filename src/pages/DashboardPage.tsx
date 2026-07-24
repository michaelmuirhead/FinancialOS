import {
  Banknote,
  CalendarCheck,
  ChartNoAxesCombined,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { CashFlowChart } from "@/components/dashboard/CashFlowChart";
import { BudgetProgress } from "@/components/dashboard/BudgetProgress";
import { UpcomingBills } from "@/components/dashboard/UpcomingBills";
import { DebtOverview } from "@/components/dashboard/DebtOverview";
import { SavingsGoals } from "@/components/dashboard/SavingsGoals";
import { AlertPanel } from "@/components/dashboard/AlertPanel";
import { NetWorthTrend } from "@/components/dashboard/NetWorthTrend";
import { Money } from "@/components/ui/Money";
import {
  useCategories,
  useDashboard,
  useRules,
  useTransactions,
} from "@/hooks/useFinancialData";
import { isDemoMode } from "@/services/firebase";

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const { data: categories } = useCategories();
  const { data: transactions } = useTransactions();
  const { data: rules } = useRules();

  if (isLoading) {
    return <p style={{ color: "var(--text-secondary)" }}>Loading dashboard…</p>;
  }
  if (error || !data) {
    const message = error instanceof Error ? error.message : "";
    const looksLikePermissions = /permission|insufficient|PERMISSION/.test(
      message,
    );
    return (
      <div style={{ maxWidth: 640 }}>
        <p style={{ color: "var(--red-600)", fontWeight: 600 }}>
          Could not load the dashboard.
        </p>
        {message && (
          <p
            style={{
              fontSize: "0.82rem",
              fontFamily: "ui-monospace, monospace",
              color: "var(--text-secondary)",
              marginTop: 8,
              wordBreak: "break-word",
            }}
          >
            {message}
          </p>
        )}
        {looksLikePermissions && (
          <div className="demo-banner" style={{ marginTop: 12 }}>
            This is a Firestore permissions error. Deploy the security rules
            so household members can read their data:{" "}
            <code>firebase deploy --only firestore:rules,storage</code>. If the
            rules are already deployed, sign out and back in to re-run
            first-time household setup.
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard Overview"
        description="Your financial snapshot — all systems at a glance."
      />
      {isDemoMode && (
        <div className="demo-banner">
          Demo mode — showing sample household data (VITE_DEMO_MODE is on).
          Remove that env var to use your live Firebase household.
        </div>
      )}
      <div className="metrics-row">
        <MetricCard
          label="Total Cash"
          value={data.totalCash}
          icon={Banknote}
          tone="green"
          detail={<span>All liquid accounts combined</span>}
        />
        <MetricCard
          label="Monthly Income"
          value={data.monthlyIncome}
          icon={TrendingUp}
          tone="blue"
          detail={<span>Received this month</span>}
        />
        <MetricCard
          label="Bills Paid"
          value={data.billsPaid}
          icon={CalendarCheck}
          tone="amber"
          detail={
            <span>
              <Money value={data.billsRemaining} /> remaining ·{" "}
              {data.billsPercentComplete}% complete
            </span>
          }
        />
        <MetricCard
          label="Safe to Spend"
          value={data.safeToSpend}
          icon={Wallet}
          tone="purple"
          detail={<span>After bills, goals, and buffer</span>}
        />
        <MetricCard
          label="Net Worth"
          value={data.netWorth}
          icon={ChartNoAxesCombined}
          tone={data.netWorthChangeMonth >= 0 ? "green" : "red"}
          detail={
            <span>
              <Money value={data.netWorthChangeMonth} signed /> this month
            </span>
          }
        />
      </div>
      <div className="dashboard-grid">
        <CashFlowChart
          data={data.cashFlow}
          minimumBuffer={rules?.minimumCheckingBuffer}
        />
        <BudgetProgress
          categories={categories ?? []}
          transactions={transactions ?? []}
        />
        <UpcomingBills bills={data.upcomingBills} />
        <DebtOverview debts={data.debts} />
        <SavingsGoals goals={data.goals} />
        <AlertPanel alerts={data.alerts} />
        <NetWorthTrend data={data.netWorthHistory} />
      </div>
    </>
  );
}
