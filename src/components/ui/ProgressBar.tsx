interface ProgressBarProps {
  percent: number;
  tone?: "blue" | "green" | "amber" | "red" | "purple";
}

export function ProgressBar({ percent, tone = "blue" }: ProgressBarProps) {
  const width = Math.max(0, Math.min(100, percent));
  const toneClass = tone === "blue" ? "" : ` progress-bar__fill--${tone}`;
  return (
    <div
      className="progress-bar"
      role="progressbar"
      aria-valuenow={Math.round(width)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`progress-bar__fill${toneClass}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export function budgetTone(percent: number): "green" | "amber" | "red" {
  if (percent > 90) return "red";
  if (percent >= 75) return "amber";
  return "green";
}
