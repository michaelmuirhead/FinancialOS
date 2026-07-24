import { useEffect, useRef, useState } from "react";
import { Bell, CircleHelp, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useHousehold } from "@/hooks/useFinancialData";
import { monthLabel, currentMonth } from "@/lib/format";
import { auth, isDemoMode } from "@/services/firebase";
import { signOutUser } from "@/services/authService";

export function TopHeader() {
  const { data: household } = useHousehold();
  const month = currentMonth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickAway(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, [menuOpen]);

  const email = auth?.currentUser?.email ?? undefined;

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
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          className="top-header__icon-button"
          aria-label="Profile"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <UserRound size={17} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: 220,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 12px 32px rgb(6 27 58 / 0.22)",
              padding: 8,
              zIndex: 60,
            }}
          >
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
                  setMenuOpen(false);
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
    </header>
  );
}
