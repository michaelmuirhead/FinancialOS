import { ReactNode } from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  detail?: string;
  icon?: ReactNode;
}

export function EmptyState({ title, detail, icon }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon ?? <Inbox size={22} />}</div>
      <div className="empty-state__title">{title}</div>
      {detail && <div>{detail}</div>}
    </div>
  );
}
