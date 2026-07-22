import { NavLink } from "react-router-dom";
import {
  ArrowLeftRight,
  CalendarPlus,
  Goal,
  Landmark,
  ReceiptText,
} from "lucide-react";
import { navigation } from "./navigation";
import { useQuickActions } from "./QuickActionsContext";

export function DesktopSidebar() {
  const { open } = useQuickActions();

  return (
    <aside className="desktop-sidebar">
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              `sidebar-nav__link${isActive ? " sidebar-nav__link--active" : ""}`
            }
          >
            <item.icon size={17} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div>
        <div className="sidebar-section__title">Quick actions</div>
        <div className="quick-actions">
          <button
            className="quick-actions__button"
            onClick={() => open("add-transaction")}
          >
            <ArrowLeftRight size={16} />
            Add transaction
          </button>
          <button
            className="quick-actions__button"
            onClick={() => open("add-bill")}
          >
            <CalendarPlus size={16} />
            Add bill
          </button>
          <button
            className="quick-actions__button"
            onClick={() => open("add-account")}
          >
            <Landmark size={16} />
            Add account
          </button>
          <button
            className="quick-actions__button"
            onClick={() => open("add-debt")}
          >
            <ReceiptText size={16} />
            Add debt
          </button>
          <button
            className="quick-actions__button"
            onClick={() => open("add-goal")}
          >
            <Goal size={16} />
            Add savings goal
          </button>
        </div>
      </div>
    </aside>
  );
}
