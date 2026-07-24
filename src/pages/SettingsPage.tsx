import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  useHousehold,
  useRules,
  useUpdateRules,
} from "@/hooks/useFinancialData";
import { demoStore } from "@/data/demoStore";
import { isDemoMode, missingFirebaseVars } from "@/services/firebase";
import { useQueryClient } from "@tanstack/react-query";

export function SettingsPage() {
  const { data: household } = useHousehold();
  const { data: rules } = useRules();
  const updateRules = useUpdateRules();
  const queryClient = useQueryClient();
  const [buffer, setBuffer] = useState<number | null>(null);

  const currentBuffer = buffer ?? rules?.minimumCheckingBuffer ?? 500;

  function saveRules() {
    if (!rules) return;
    updateRules.mutate({ ...rules, minimumCheckingBuffer: currentBuffer });
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Household preferences, financial rules, and data controls."
      />
      <div className="two-col">
        <Card title="Household">
          <div className="data-list">
            <div className="data-list__row">
              <span>Household name</span>
              <span style={{ fontWeight: 600 }}>{household?.name ?? "—"}</span>
            </div>
            <div className="data-list__row">
              <span>Currency</span>
              <span>{household?.currency ?? "USD"}</span>
            </div>
            <div className="data-list__row">
              <span>Timezone</span>
              <span>{household?.timezone ?? "America/Chicago"}</span>
            </div>
            <div className="data-list__row">
              <span>Backend</span>
              <span>{isDemoMode ? "Demo mode (local data)" : "Firebase"}</span>
            </div>
            {isDemoMode && (
              <div className="data-list__row">
                <span>Missing env vars</span>
                <span style={{ color: "var(--amber-500)", textAlign: "right" }}>
                  {missingFirebaseVars.join(", ")}
                </span>
              </div>
            )}
          </div>
        </Card>
        <Card title="Financial rules">
          <div className="form-grid">
            <label className="form-field__label">
              Minimum checking buffer ($)
              <input
                className="form-field__input"
                type="number"
                min={0}
                step={50}
                value={currentBuffer}
                onChange={(event) => setBuffer(Number(event.target.value) || 0)}
              />
            </label>
            <div className="data-list">
              <div className="data-list__row">
                <span>Giving target</span>
                <span>{rules?.givingPercentOfGross ?? 10}% of gross income</span>
              </div>
              <div className="data-list__row">
                <span>Utilization warning</span>
                <span>above {rules?.utilizationWarningPercent ?? 30}%</span>
              </div>
              <div className="data-list__row">
                <span>Bonus split</span>
                <span>
                  {rules?.bonusSplitDebtPercent ?? 50}% debt /{" "}
                  {100 - (rules?.bonusSplitDebtPercent ?? 50)}% savings
                </span>
              </div>
            </div>
            <div className="form-actions">
              <Button onClick={saveRules}>Save rules</Button>
            </div>
          </div>
        </Card>
        <Card title="PWA installation">
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
            On iPhone or iPad, open this app in Safari and choose
            Share&nbsp;→&nbsp;Add to Home Screen. It installs as a full-screen
            app with offline support for the shell and your last-viewed data.
          </p>
        </Card>
        {isDemoMode && (
          <Card title="Demo data">
            <p
              style={{
                fontSize: "0.88rem",
                color: "var(--text-secondary)",
                marginBottom: 10,
              }}
            >
              Reset the sample household back to its original state.
            </p>
            <Button
              variant="danger"
              onClick={() => {
                demoStore.reset();
                queryClient.invalidateQueries();
              }}
            >
              Reset demo data
            </Button>
          </Card>
        )}
      </div>
    </>
  );
}
