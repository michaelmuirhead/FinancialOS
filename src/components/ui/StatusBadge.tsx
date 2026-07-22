import { BillStatus } from "@/types";

type BadgeTone = "green" | "blue" | "amber" | "red" | "gray" | "purple";

interface StatusBadgeProps {
  tone: BadgeTone;
  children: React.ReactNode;
}

export function StatusBadge({ tone, children }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}

export function billStatusTone(status: BillStatus): BadgeTone {
  switch (status) {
    case "paid":
      return "green";
    case "due_soon":
      return "amber";
    case "overdue":
      return "red";
    case "skipped":
      return "gray";
    case "scheduled":
      return "blue";
  }
}

export function billStatusLabel(status: BillStatus): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "due_soon":
      return "Due soon";
    case "overdue":
      return "Overdue";
    case "skipped":
      return "Skipped";
    case "scheduled":
      return "Scheduled";
  }
}
