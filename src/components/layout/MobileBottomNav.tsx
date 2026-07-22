import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  CalendarDays,
  Home,
  Menu,
  Plus,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { navigation } from "./navigation";
import { QuickAction, useQuickActions } from "./QuickActionsContext";

const ADD_ACTIONS: { label: string; action: QuickAction }[] = [
  { label: "Add transaction", action: "add-transaction" },
  { label: "Add bill", action: "add-bill" },
  { label: "Add account", action: "add-account" },
  { label: "Add debt", action: "add-debt" },
  { label: "Add savings goal", action: "add-goal" },
];

export function MobileBottomNav() {
  const { open } = useQuickActions();
  const [showAdd, setShowAdd] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  const itemClass = ({ isActive }: { isActive: boolean }) =>
    `mobile-bottom-nav__item${isActive ? " mobile-bottom-nav__item--active" : ""}`;

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <NavLink to="/" end className={itemClass}>
          <Home size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/transactions" className={itemClass}>
          <ArrowLeftRight size={20} />
          Activity
        </NavLink>
        <button
          className="mobile-bottom-nav__item"
          onClick={() => setShowAdd(true)}
          aria-label="Add"
        >
          <span className="mobile-bottom-nav__add">
            <Plus size={22} />
          </span>
        </button>
        <NavLink to="/bills" className={itemClass}>
          <CalendarDays size={20} />
          Bills
        </NavLink>
        <button
          className="mobile-bottom-nav__item"
          onClick={() => setShowMore(true)}
        >
          <Menu size={20} />
          More
        </button>
      </nav>

      {showAdd && (
        <Modal title="Quick add" onClose={() => setShowAdd(false)}>
          <div className="quick-actions">
            {ADD_ACTIONS.map((item) => (
              <button
                key={item.action}
                className="quick-actions__button"
                onClick={() => {
                  setShowAdd(false);
                  open(item.action);
                }}
              >
                <Plus size={16} />
                {item.label}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {showMore && (
        <Modal title="All modules" onClose={() => setShowMore(false)}>
          <div className="quick-actions">
            {navigation.map((item) => (
              <button
                key={item.path}
                className="quick-actions__button"
                onClick={() => {
                  setShowMore(false);
                  navigate(item.path);
                }}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </>
  );
}
