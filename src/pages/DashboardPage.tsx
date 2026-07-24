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
import { isDemoMode, missingFirebaseVars } from "@/services/firebase";

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();
  const { data: categories } = useCategories();
  const { data: transactions } = useTransactions();
  const { data: rules } = useRules();

  if (isLoading) {
    return <p style={{ color: "var(--text-secondary)" }}>Loading dashboard…</p>;
  }
  if (error || !data) {
    return (
      <p style={{ color: "var(--red-600)" }}>
        Could not load the dashboard. Check your connection and try again.
      </p>
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
          Demo mode — showing sample household data. This build is missing{" "}
          {missingFirebaseVars.join(", ")}. Set the VITE_FIREBASE_* env vars in
          your host (e.g. Vercel → Settings → Environment Variables) and
          redeploy — Vite reads them at build time, not runtime.
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
