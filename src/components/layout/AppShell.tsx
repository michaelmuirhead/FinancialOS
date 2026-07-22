import { Outlet } from "react-router-dom";
import { TopHeader } from "./TopHeader";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { QuickActionsProvider } from "./QuickActionsContext";

export function AppShell() {
  return (
    <QuickActionsProvider>
      <div className="app-shell">
        <TopHeader />
        <div className="app-body">
          <DesktopSidebar />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </QuickActionsProvider>
  );
}
