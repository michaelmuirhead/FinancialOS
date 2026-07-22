import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/pages/DashboardPage";
import { PaycheckPlannerPage } from "@/pages/PaycheckPlannerPage";
import { BillsPage } from "@/pages/BillsPage";
import { TransactionsPage } from "@/pages/TransactionsPage";
import { BudgetPage } from "@/pages/BudgetPage";
import { DebtPage } from "@/pages/DebtPage";
import { SinkingFundsPage } from "@/pages/SinkingFundsPage";
import { SavingsPage } from "@/pages/SavingsPage";
import { NetWorthPage } from "@/pages/NetWorthPage";
import { TaxCenterPage } from "@/pages/TaxCenterPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { DocumentsPage } from "@/pages/DocumentsPage";
import { AccountsPage } from "@/pages/AccountsPage";
import { SettingsPage } from "@/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/paychecks", element: <PaycheckPlannerPage /> },
      { path: "/bills", element: <BillsPage /> },
      { path: "/transactions", element: <TransactionsPage /> },
      { path: "/budget", element: <BudgetPage /> },
      { path: "/debt", element: <DebtPage /> },
      { path: "/sinking-funds", element: <SinkingFundsPage /> },
      { path: "/goals", element: <SavingsPage /> },
      { path: "/net-worth", element: <NetWorthPage /> },
      { path: "/tax", element: <TaxCenterPage /> },
      { path: "/reports", element: <ReportsPage /> },
      { path: "/documents", element: <DocumentsPage /> },
      { path: "/accounts", element: <AccountsPage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },
]);
