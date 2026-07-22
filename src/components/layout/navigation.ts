import {
  ArrowLeftRight,
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardList,
  Coins,
  FileChartColumn,
  Files,
  Goal,
  Home,
  Landmark,
  LucideIcon,
  PiggyBank,
  ReceiptText,
  Settings,
  WalletCards,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navigation: NavItem[] = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "Paycheck Planner", path: "/paychecks", icon: WalletCards },
  { label: "Bills & Calendar", path: "/bills", icon: CalendarDays },
  { label: "Transactions", path: "/transactions", icon: ArrowLeftRight },
  { label: "Budget", path: "/budget", icon: ClipboardList },
  { label: "Debt Payoff", path: "/debt", icon: Coins },
  { label: "Sinking Funds", path: "/sinking-funds", icon: PiggyBank },
  { label: "Savings Goals", path: "/goals", icon: Goal },
  { label: "Net Worth", path: "/net-worth", icon: ChartNoAxesCombined },
  { label: "Tax Center", path: "/tax", icon: ReceiptText },
  { label: "Reports", path: "/reports", icon: FileChartColumn },
  { label: "Documents", path: "/documents", icon: Files },
  { label: "Accounts", path: "/accounts", icon: Landmark },
  { label: "Settings", path: "/settings", icon: Settings },
];
