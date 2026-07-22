import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CashFlowPoint, findBufferBreach } from "@/calculations";
import { Card } from "@/components/ui/Card";
import { formatCompactCurrency, formatCurrency, formatDate } from "@/lib/format";

interface CashFlowChartProps {
  data: CashFlowPoint[];
  minimumBuffer?: number;
}

export function CashFlowChart({ data, minimumBuffer }: CashFlowChartProps) {
  const breach =
    minimumBuffer != null ? findBufferBreach(data, minimumBuffer) : undefined;

  return (
    <Card title="Cash Flow — actual & 30-day forecast" className="cash-flow-panel">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11 }}
            minTickGap={40}
          />
          <YAxis
            tickFormatter={(v: number) => formatCompactCurrency(v)}
            tick={{ fontSize: 11 }}
            width={54}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            labelFormatter={(label) => formatDate(String(label))}
          />
          <Line
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="var(--green-600)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="expenses"
            name="Expenses"
            stroke="var(--red-600)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="runningBalance"
            name="Running Balance"
            stroke="var(--blue-600)"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {breach && (
        <div className="demo-banner" role="alert">
          Projected to fall below your {formatCurrency(minimumBuffer ?? 0)}{" "}
          buffer on {formatDate(breach.date)} (
          {formatCurrency(breach.projectedBalance)}).
        </div>
      )}
    </Card>
  );
}
