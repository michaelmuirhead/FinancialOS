import { AlertTriangle, Info, Siren } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AlertPriority, FinancialAlert } from "@/types";

interface AlertPanelProps {
  alerts: FinancialAlert[];
}

function priorityTone(priority: AlertPriority): "blue" | "amber" | "red" {
  switch (priority) {
    case "info":
      return "blue";
    case "attention":
      return "amber";
    case "urgent":
      return "red";
  }
}

function priorityIcon(priority: AlertPriority) {
  switch (priority) {
    case "info":
      return <Info size={14} />;
    case "attention":
      return <AlertTriangle size={14} />;
    case "urgent":
      return <Siren size={14} />;
  }
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  return (
    <Card title="Alerts" className="alerts-panel">
      {alerts.length === 0 ? (
        <EmptyState title="No alerts" detail="Your financial watchdog is quiet." />
      ) : (
        <div className="data-list">
          {alerts.map((alert) => (
            <div className="data-list__row" key={alert.id}>
              <div className="data-list__main">
                <div className="data-list__title">{alert.title}</div>
                {alert.detail && (
                  <div className="data-list__subtitle">{alert.detail}</div>
                )}
              </div>
              <div className="data-list__end">
                <StatusBadge tone={priorityTone(alert.priority)}>
                  {priorityIcon(alert.priority)}
                  {alert.priority}
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
