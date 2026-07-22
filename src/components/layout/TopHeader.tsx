import { Bell, CircleHelp, ShieldCheck, UserRound } from "lucide-react";
import { useHousehold } from "@/hooks/useFinancialData";
import { monthLabel, currentMonth } from "@/lib/format";
import { isDemoMode } from "@/services/firebase";

export function TopHeader() {
  const { data: household } = useHousehold();
  const month = currentMonth();

  return (
    <header className="top-header">
      <div className="top-header__brand">
        <span className="top-header__brand-icon">
          <ShieldCheck size={18} />
        </span>
        <span>
          HomeVault
          <div className="top-header__household desktop-header-details">
            {household?.name ?? "Household"}
            {isDemoMode ? " · demo data" : ""}
          </div>
        </span>
      </div>
      <div className="top-header__spacer" />
      <div className="top-header__period desktop-header-details">
        <select defaultValue={month} aria-label="Reporting period">
          <option value={month}>{monthLabel(month)}</option>
          <option value="ytd">Year to date</option>
          <option value="annual">Annual view</option>
        </select>
      </div>
      <button className="top-header__icon-button" aria-label="Notifications">
        <Bell size={17} />
      </button>
      <button
        className="top-header__icon-button desktop-header-details"
        aria-label="Help"
      >
        <CircleHelp size={17} />
      </button>
      <button className="top-header__icon-button" aria-label="Profile">
        <UserRound size={17} />
      </button>
    </header>
  );
}
