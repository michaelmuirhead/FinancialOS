import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
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

type Mode = "both" | "actual" | "forecast";

const MODES: { value: Mode; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "actual", label: "Actual" },
  { value: "forecast", label: "Forecast" },
];

const HORIZONS = [30, 60, 90] as const;

export function CashFlowChart({ data, minimumBuffer }: CashFlowChartProps) {
  const [mode, setMode] = useState<Mode>("both");
  const [horizon, setHorizon] = useState<(typeof HORIZONS)[number]>(30);

  const today = new Date().toISOString().slice(0, 10);
  const horizonEnd = new Date();
  horizonEnd.setDate(horizonEnd.getDate() + horizon);
  const horizonIso = horizonEnd.toISOString().slice(0, 10);

  const visible = data.filter((point) => {
    if (point.forecast && point.date > horizonIso) return false;
    if (mode === "actual") return !point.forecast;
    if (mode === "forecast") return Boolean(point.forecast) || point.date === today;
    return true;
  });

  const breach =
    minimumBuffer != null ? findBufferBreach(visible, minimumBuffer) : undefined;

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    border: "1px solid var(--border)",
    background: active ? "var(--blue-100)" : "var(--surface)",
    color: active ? "var(--blue-600)" : "var(--text-secondary)",
    borderRadius: 8,
    padding: "0.15rem 0.5rem",
    fontSize: "0.72rem",
    fontWeight: 600,
    cursor: "pointer",
  });

  return (
    <Card
      title="Cash Flow"
      className="cash-flow-panel"
      action={
        <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
          {MODES.map((m) => (
            <button
              key={m.value}
              style={toggleStyle(mode === m.value)}
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </button>
          ))}
          {HORIZONS.map((days) => (
            <button
              key={days}
              style={toggleStyle(horizon === days)}
              onClick={() => setHorizon(days)}
              title={`${days}-day forecast horizon`}
            >
              {days}d
            </button>
          ))}
        </span>
      }
    >
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={visible}>
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
          {mode !== "actual" && (
            <ReferenceLine
              x={today}
              stroke="var(--text-secondary)"
              strokeDasharray="4 4"
              label={{ value: "today", fontSize: 10, position: "top" }}
            />
          )}
          {minimumBuffer != null && (
            <ReferenceLine
              y={minimumBuffer}
              stroke="var(--amber-500)"
              strokeDasharray="4 4"
            />
          )}
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
