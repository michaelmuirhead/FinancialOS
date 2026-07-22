import { formatCurrency } from "@/lib/format";

interface MoneyProps {
  value: number;
  className?: string;
  signed?: boolean;
}

export function Money({ value, className, signed = false }: MoneyProps) {
  const tone = signed
    ? value > 0
      ? " money--positive"
      : value < 0
        ? " money--negative"
        : ""
    : "";
  const prefix = signed && value > 0 ? "+" : "";
  return (
    <span className={`money${tone}${className ? ` ${className}` : ""}`}>
      {prefix}
      {formatCurrency(value)}
    </span>
  );
}
