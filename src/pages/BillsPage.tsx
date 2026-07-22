import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useQuickActions } from "@/components/layout/QuickActionsContext";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/ui/Money";
import {
  billStatusLabel,
  billStatusTone,
  StatusBadge,
} from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  useBillOccurrences,
  useMarkBillPaid,
} from "@/hooks/useFinancialData";
import { formatDate } from "@/lib/format";

export function BillsPage() {
  const { data: occurrences } = useBillOccurrences();
  const { open } = useQuickActions();
  const markPaid = useMarkBillPaid();

  const unpaid = (occurrences ?? []).filter(
    (o) => o.status !== "paid" && o.status !== "skipped",
  );
  const paid = (occurrences ?? []).filter((o) => o.status === "paid");

  return (
    <>
      <PageHeader
        title="Bills & Calendar"
        description="Recurring and one-time obligations, tracked from scheduled to paid."
        actions={
          <Button onClick={() => open("add-bill")}>
            <Plus size={16} /> Add bill
          </Button>
        }
      />
      <div className="two-col">
        <Card title={`Unpaid (${unpaid.length})`}>
          {unpaid.length === 0 ? (
            <EmptyState title="Nothing unpaid" detail="Every bill is handled." />
          ) : (
            <div className="data-list">
              {unpaid.map((occurrence) => (
                <div className="data-list__row" key={occurrence.id}>
                  <div className="data-list__main">
                    <div className="data-list__title">{occurrence.name}</div>
                    <div className="data-list__subtitle">
                      Due {formatDate(occurrence.dueDate)}
                      {occurrence.autopay ? " · Auto-pay" : ""}
                    </div>
                  </div>
                  <div
                    className="data-list__end"
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div>
                      <Money value={occurrence.expectedAmount} />
                      <div style={{ marginTop: 2 }}>
                        <StatusBadge tone={billStatusTone(occurrence.status)}>
                          {billStatusLabel(occurrence.status)}
                        </StatusBadge>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() =>
                        markPaid.mutate({ occurrenceId: occurrence.id })
                      }
                      disabled={markPaid.isPending}
                    >
                      Mark paid
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title={`Paid this cycle (${paid.length})`}>
          {paid.length === 0 ? (
            <EmptyState title="No paid bills yet" />
          ) : (
            <div className="data-list">
              {paid.map((occurrence) => (
                <div className="data-list__row" key={occurrence.id}>
                  <div className="data-list__main">
                    <div className="data-list__title">{occurrence.name}</div>
                    <div className="data-list__subtitle">
                      Paid {occurrence.paidDate ? formatDate(occurrence.paidDate) : ""}
                      {occurrence.actualAmount != null &&
                      occurrence.actualAmount !== occurrence.expectedAmount
                        ? ` · expected ${occurrence.expectedAmount.toLocaleString(
                            "en-US",
                            { style: "currency", currency: "USD" },
                          )}`
                        : ""}
                    </div>
                  </div>
                  <div className="data-list__end">
                    <Money
                      value={occurrence.actualAmount ?? occurrence.expectedAmount}
                    />
                    <div style={{ marginTop: 2 }}>
                      <StatusBadge tone="green">Paid</StatusBadge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
