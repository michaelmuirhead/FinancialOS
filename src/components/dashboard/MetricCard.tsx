import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Money } from "@/components/ui/Money";

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: "green" | "blue" | "purple" | "red" | "amber";
  detail?: ReactNode;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
  detail,
}: MetricCardProps) {
  return (
    <section className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__header">
        <span className="metric-card__icon">
          <Icon size={20} />
        </span>
        <div>
          <p className="metric-card__label">{label}</p>
          <Money value={value} className="metric-card__value" />
        </div>
      </div>
      {detail && <div className="metric-card__detail">{detail}</div>}
    </section>
  );
}
