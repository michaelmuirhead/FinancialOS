import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Money } from "@/components/ui/Money";
import {
  billStatusLabel,
  billStatusTone,
  StatusBadge,
} from "@/components/ui/StatusBadge";
import { BillOccurrence } from "@/types";
import { formatDate } from "@/lib/format";

interface UpcomingBillsProps {
  bills: BillOccurrence[];
}

export function UpcomingBills({ bills }: UpcomingBillsProps) {
  return (
    <Card
      title="Upcoming Bills"
      className="upcoming-panel"
      action={
        <Link className="card__title-link" to="/bills">
          View all
        </Link>
      }
    >
      {bills.length === 0 ? (
        <EmptyState title="No upcoming bills" detail="You're all caught up." />
      ) : (
        <div className="data-list">
          {bills.map((bill) => (
            <div className="data-list__row" key={bill.id}>
              <div className="data-list__main">
                <div className="data-list__title">{bill.name}</div>
                <div className="data-list__subtitle">
                  Due {formatDate(bill.dueDate)}
                  {bill.autopay ? " · Auto-pay" : ""}
                </div>
              </div>
              <div className="data-list__end">
                <Money value={bill.expectedAmount} />
                <div style={{ marginTop: 2 }}>
                  <StatusBadge tone={billStatusTone(bill.status)}>
                    {billStatusLabel(bill.status)}
                  </StatusBadge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
