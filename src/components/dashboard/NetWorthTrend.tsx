import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";

interface NetWorthTrendProps {
  data: { month: string; netWorth: number }[];
}

function monthShort(month: string): string {
  return new Date(month + "-01T00:00:00").toLocaleDateString("en-US", {
    month: "short",
  });
}

export function NetWorthTrend({ data }: NetWorthTrendProps) {
  return (
    <Card title="Net Worth — 12-month trend" className="networth-panel">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--blue-600)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--blue-600)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
            tickFormatter={monthShort}
            tick={{ fontSize: 11 }}
          />
          <YAxis
            tickFormatter={(v: number) => formatCompactCurrency(v)}
            tick={{ fontSize: 11 }}
            width={54}
            domain={["auto", "auto"]}
          />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Area
            type="monotone"
            dataKey="netWorth"
            name="Net Worth"
            stroke="var(--blue-600)"
            strokeWidth={2}
            fill="url(#netWorthFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
