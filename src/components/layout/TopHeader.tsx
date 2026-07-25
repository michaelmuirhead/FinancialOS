import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CircleHelp,
  Info,
  LogOut,
  ShieldCheck,
  Siren,
  UserRound,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useDashboard, useHousehold } from "@/hooks/useFinancialData";
import { monthLabel, currentMonth } from "@/lib/format";
import { AlertPriority } from "@/types";
import { auth, isDemoMode } from "@/services/firebase";
import { signOutUser } from "@/services/authService";

type OpenMenu = "notifications" | "help" | "profile" | null;

function priorityTone(priority: AlertPriority): "blue" | "amber" | "red" {
  return priority === "urgent" ? "red" : priority === "attention" ? "amber" : "blue";
}

function priorityIcon(priority: AlertPriority) {
  if (priority === "urgent") return <Siren size={13} />;
  if (priority === "attention") return <AlertTriangle size={13} />;
  return <Info size={13} />;
}

const menuStyle: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 8px)",
  right: 0,
  minWidth: 260,
  maxWidth: 340,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  boxShadow: "0 12px 32px rgb(6 27 58 / 0.22)",
  padding: 8,
  zIndex: 60,
};

export function TopHeader() {
  const { data: household } = useHousehold();
  const { data: dashboard } = useDashboard();
  const month = currentMonth();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickAway(event: MouseEvent) {
      if (
        clusterRef.current &&
        !clusterRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    }
    if (openMenu) document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [openMenu]);

  const toggle = (menu: OpenMenu) =>
    setOpenMenu((current) => (current === menu ? null : menu));

  const email = auth?.currentUser?.email ?? undefined;
  const alerts = dashboard?.alerts ?? [];
  const unreadCount = alerts.filter((a) => a.priority !== "info").length;

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

      <div
        ref={clusterRef}
        style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}
      >
        {/* Notifications */}
        <div style={{ position: "relative", display: "flex" }}>
          <button
            className="top-header__icon-button"
            aria-label="Notifications"
            aria-haspopup="menu"
            aria-expanded={openMenu === "notifications"}
            onClick={() => toggle("notifications")}
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  borderRadius: 999,
                  background: "var(--red-600)",
                  color: "#fff",
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  display: "grid",
                  placeItems: "center",
                  lineHeight: 1,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          {openMenu === "notifications" && (
            <div role="menu" style={menuStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.35rem 0.5rem 0.5rem",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: 4,
                }}
              >
                <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                  Notifications
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                  {alerts.length} active
                </span>
              </div>
              {alerts.length === 0 ? (
                <div
                  style={{
                    padding: "0.75rem 0.5rem",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    textAlign: "center",
                  }}
                >
                  Your financial watchdog is quiet — no alerts right now.
                </div>
              ) : (
                <div style={{ maxHeight: 340, overflowY: "auto" }}>
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        display: "flex",
                        gap: 8,
                        padding: "0.5rem",
                        borderRadius: 8,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ marginTop: 2 }}>
                        <StatusBadge tone={priorityTone(alert.priority)}>
                          {priorityIcon(alert.priority)}
                        </StatusBadge>
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.84rem", fontWeight: 600 }}>
                          {alert.title}
                        </div>
                        {alert.detail && (
                          <div
                            style={{
                              fontSize: "0.76rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {alert.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Help */}
        <div className="desktop-header-details" style={{ position: "relative", display: "flex" }}>
          <button
            className="top-header__icon-button"
            aria-label="Help"
            aria-haspopup="menu"
            aria-expanded={openMenu === "help"}
            onClick={() => toggle("help")}
          >
            <CircleHelp size={17} />
          </button>
          {openMenu === "help" && (
            <div role="menu" style={menuStyle}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  padding: "0.35rem 0.5rem 0.5rem",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: 6,
                }}
              >
                Quick help
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: "1.1rem",
                  display: "grid",
                  gap: 7,
                  fontSize: "0.82rem",
                  color: "var(--text-primary)",
                }}
              >
                <li>
                  Use the <strong>+ Add</strong> button (or Quick Actions) to
                  record transactions, bills, paychecks, and more.
                </li>
                <li>
                  <strong>Import from screenshot</strong> reads balances and
                  bills from a photo of your bank app.
                </li>
                <li>
                  <strong>Forecast</strong> projects your balance day-by-day;
                  <strong> Monthly Review</strong> gives an end-of-month action
                  plan.
                </li>
                <li>
                  The <strong>bell</strong> shows financial alerts; your data
                  syncs securely to your household.
                </li>
              </ul>
              <button
                onClick={() => {
                  setOpenMenu(null);
                  navigate("/review");
                }}
                style={{
                  marginTop: 8,
                  width: "100%",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--blue-600)",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  padding: "0.45rem",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Open Monthly Review
              </button>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: "relative", display: "flex" }}>
          <button
            className="top-header__icon-button"
            aria-label="Profile"
            aria-haspopup="menu"
            aria-expanded={openMenu === "profile"}
            onClick={() => toggle("profile")}
          >
            <UserRound size={17} />
          </button>
          {openMenu === "profile" && (
            <div role="menu" style={{ ...menuStyle, minWidth: 220 }}>
              <div
                style={{
                  padding: "0.5rem 0.6rem",
                  fontSize: "0.8rem",
                  color: "var(--text-secondary)",
                  borderBottom: "1px solid var(--border)",
                  marginBottom: 4,
                  wordBreak: "break-word",
                }}
              >
                {isDemoMode ? "Demo mode — no account" : (email ?? "Signed in")}
              </div>
              {!isDemoMode && (
                <button
                  role="menuitem"
                  onClick={() => {
                    setOpenMenu(null);
                    void signOutUser();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    color: "var(--text-primary)",
                    fontSize: "0.88rem",
                    padding: "0.5rem 0.6rem",
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
