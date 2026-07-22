export type AlertPriority = "info" | "attention" | "urgent";

export interface FinancialAlert {
  id: string;
  priority: AlertPriority;
  title: string;
  detail?: string;
  createdAt: string;
}
