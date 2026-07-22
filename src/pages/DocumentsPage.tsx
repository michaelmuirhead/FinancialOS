import { FolderClosed } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";

const FOLDERS = [
  "Bank statements",
  "Credit-card statements",
  "Paystubs",
  "Bills",
  "Tax documents",
  "Insurance policies",
  "Loan agreements",
  "Vehicle documents",
  "Medical bills",
  "Receipts",
  "Warranties",
  "Annual reviews",
];

export function DocumentsPage() {
  return (
    <>
      <PageHeader
        title="Documents"
        description="The household financial filing cabinet. Files link to accounts, bills, debts, and transactions."
      />
      <div className="demo-banner">
        Document upload is part of Phase 3 (Supabase Storage). Folders below
        show the planned structure.
      </div>
      <div className="three-col">
        {FOLDERS.map((folder) => (
          <Card key={folder}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="empty-state__icon" style={{ marginBottom: 0 }}>
                <FolderClosed size={20} />
              </span>
              <div>
                <div style={{ fontWeight: 600 }}>{folder}</div>
                <StatusBadge tone="gray">0 files</StatusBadge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
