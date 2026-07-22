import { useMemo, useRef, useState } from "react";
import { Camera, ScanLine, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/ui/Money";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  extractFromScreenshot,
  isScreenshotImportAvailable,
} from "@/services/screenshotService";
import {
  findDuplicateTransactions,
  dueDayFromDate,
  matchAccount,
  sampleExtraction,
  ScreenshotExtraction,
} from "@/lib/screenshot";
import {
  useAccounts,
  useBills,
  useCreateAccount,
  useCreateBill,
  useImportTransactions,
  useTransactions,
  useUpdateAccountBalance,
} from "@/hooks/useFinancialData";
import { formatDate } from "@/lib/format";

type Step = "pick" | "extracting" | "review" | "applying" | "done";

/** Per-balance-row action: apply to an account id, create new, or skip. */
type BalanceTarget = string | "create" | "skip";

interface ScreenshotImportModalProps {
  onClose: () => void;
}

export function ScreenshotImportModal({ onClose }: ScreenshotImportModalProps) {
  const { data: accounts } = useAccounts();
  const { data: bills } = useBills();
  const { data: existingTransactions } = useTransactions();
  const importTransactions = useImportTransactions();
  const updateBalance = useUpdateAccountBalance();
  const createAccount = useCreateAccount();
  const createBill = useCreateBill();

  const available = isScreenshotImportAvailable();
  const fileInput = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("pick");
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ScreenshotExtraction | null>(
    null,
  );
  const [balanceTargets, setBalanceTargets] = useState<BalanceTarget[]>([]);
  const [includedBills, setIncludedBills] = useState<Set<number>>(new Set());
  const [includedTx, setIncludedTx] = useState<Set<number>>(new Set());
  const [txAccountId, setTxAccountId] = useState("");
  const [summary, setSummary] = useState<string[]>([]);

  const duplicateTx = useMemo(() => {
    if (!extraction) return new Set<number>();
    return findDuplicateTransactions(
      extraction.transactions,
      existingTransactions ?? [],
    );
  }, [extraction, existingTransactions]);

  function beginReview(result: ScreenshotExtraction) {
    setExtraction(result);
    setBalanceTargets(
      result.balances.map((balance) => {
        const match = matchAccount(balance, accounts ?? []);
        return match ? match.id : "create";
      }),
    );
    const existingBillNames = new Set(
      (bills ?? []).map((bill) => bill.name.toLowerCase().trim()),
    );
    setIncludedBills(
      new Set(
        result.bills
          .map((bill, index) =>
            existingBillNames.has(bill.name.toLowerCase().trim()) ? -1 : index,
          )
          .filter((index) => index >= 0),
      ),
    );
    const duplicates = findDuplicateTransactions(
      result.transactions,
      existingTransactions ?? [],
    );
    setIncludedTx(
      new Set(
        result.transactions
          .map((_, index) => index)
          .filter((index) => !duplicates.has(index)),
      ),
    );
    const checking = (accounts ?? []).find(
      (account) => account.accountType === "checking",
    );
    setTxAccountId(checking?.id ?? (accounts ?? [])[0]?.id ?? "");
    setStep("review");
  }

  async function handleFile(file: File) {
    setError(null);
    setStep("extracting");
    try {
      const result = await extractFromScreenshot(file);
      beginReview(result);
    } catch (extractionError) {
      setError(
        extractionError instanceof Error
          ? extractionError.message
          : "Extraction failed",
      );
      setStep("pick");
    }
  }

  async function handleApply() {
    if (!extraction) return;
    setStep("applying");
    const applied: string[] = [];

    for (let index = 0; index < extraction.balances.length; index++) {
      const target = balanceTargets[index];
      const balance = extraction.balances[index];
      if (target === "skip") continue;
      if (target === "create") {
        await createAccount.mutateAsync({
          name: balance.accountName,
          accountType: "checking",
          lastFour: balance.lastFour,
          currentBalance: balance.balance,
          includeInSafeToSpend: false,
        });
        applied.push(`Created account “${balance.accountName}”`);
      } else {
        await updateBalance.mutateAsync({
          accountId: target,
          balance: balance.balance,
        });
        const name = (accounts ?? []).find((a) => a.id === target)?.name;
        applied.push(`Updated ${name ?? "account"} balance`);
      }
    }

    for (const index of includedBills) {
      const bill = extraction.bills[index];
      if (!bill) continue;
      await createBill.mutateAsync({
        name: bill.name,
        expectedAmount: Math.abs(bill.amount),
        dueDay: dueDayFromDate(bill.dueDate),
        frequency: "monthly",
        autopay: bill.autopay ?? false,
      });
      applied.push(`Added bill “${bill.name}”`);
    }

    const txInputs = [...includedTx]
      .map((index) => extraction.transactions[index])
      .filter(Boolean)
      .map((transaction) => ({
        accountId: txAccountId,
        transactionDate: transaction.date,
        merchant: transaction.merchant,
        amount: transaction.amount,
        transactionType:
          transaction.amount >= 0 ? ("income" as const) : ("expense" as const),
      }));
    if (txInputs.length > 0 && txAccountId) {
      const count = await importTransactions.mutateAsync(txInputs);
      applied.push(`Imported ${count} transaction${count === 1 ? "" : "s"}`);
    }

    setSummary(
      applied.length > 0 ? applied : ["Nothing selected — no changes made."],
    );
    setStep("done");
  }

  return (
    <Modal title="Import from screenshot" onClose={onClose}>
      {step === "pick" && (
        <div className="form-grid">
          {error && (
            <div className="demo-banner" role="alert">
              {error}
            </div>
          )}
          {available ? (
            <>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                Upload a screenshot of a banking app, bill, or statement.
                Balances, upcoming bills, and transactions are extracted for
                review — nothing is applied until you confirm. Full account
                numbers are never captured.
              </p>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleFile(file);
                  event.target.value = "";
                }}
              />
              <Button onClick={() => fileInput.current?.click()}>
                <Camera size={16} /> Choose screenshot
              </Button>
            </>
          ) : (
            <>
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                Screenshot import uses an AI extraction service that runs in a
                Supabase Edge Function, so it needs the app connected to
                Supabase with an Anthropic API key configured:
              </p>
              <ol
                style={{
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                  paddingLeft: "1.2rem",
                  display: "grid",
                  gap: 6,
                  margin: 0,
                }}
              >
                <li>Connect Supabase (see README) and sign in.</li>
                <li>
                  <code>supabase secrets set ANTHROPIC_API_KEY=sk-ant-…</code>
                </li>
                <li>
                  <code>supabase functions deploy extract-screenshot</code>
                </li>
              </ol>
              <Button variant="secondary" onClick={() => beginReview(sampleExtraction)}>
                <Sparkles size={15} /> Preview the flow with sample data
              </Button>
            </>
          )}
        </div>
      )}

      {step === "extracting" && (
        <div className="empty-state">
          <div className="empty-state__icon">
            <ScanLine size={22} />
          </div>
          <div className="empty-state__title">Reading your screenshot…</div>
          <div>Balances, bills, and transactions are being extracted.</div>
        </div>
      )}

      {(step === "review" || step === "applying") && extraction && (
        <div className="form-grid">
          {extraction.sourceDescription && (
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Detected: {extraction.sourceDescription}
            </p>
          )}

          {extraction.balances.length > 0 && (
            <div>
              <div className="sidebar-section__title" style={{ padding: 0 }}>
                Account balances
              </div>
              <div className="data-list">
                {extraction.balances.map((balance, index) => (
                  <div className="data-list__row" key={index}>
                    <div className="data-list__main">
                      <div className="data-list__title">
                        {balance.accountName}
                        {balance.lastFour ? ` ····${balance.lastFour}` : ""}
                      </div>
                      <Money value={balance.balance} />
                    </div>
                    <select
                      value={balanceTargets[index]}
                      onChange={(event) =>
                        setBalanceTargets((current) =>
                          current.map((value, i) =>
                            i === index
                              ? (event.target.value as BalanceTarget)
                              : value,
                          ),
                        )
                      }
                      aria-label={`Action for ${balance.accountName}`}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "0.3rem 0.5rem",
                        font: "inherit",
                        fontSize: "0.8rem",
                        maxWidth: 180,
                      }}
                    >
                      {(accounts ?? []).map((account) => (
                        <option key={account.id} value={account.id}>
                          Update {account.name}
                        </option>
                      ))}
                      <option value="create">Create new account</option>
                      <option value="skip">Skip</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {extraction.bills.length > 0 && (
            <div>
              <div className="sidebar-section__title" style={{ padding: 0 }}>
                Upcoming bills
              </div>
              <div className="data-list">
                {extraction.bills.map((bill, index) => (
                  <label className="data-list__row" key={index} style={{ cursor: "pointer" }}>
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={includedBills.has(index)}
                        onChange={(event) =>
                          setIncludedBills((current) => {
                            const next = new Set(current);
                            if (event.target.checked) next.add(index);
                            else next.delete(index);
                            return next;
                          })
                        }
                      />
                      <span>
                        <span className="data-list__title">{bill.name}</span>
                        <span className="data-list__subtitle" style={{ display: "block" }}>
                          {bill.dueDate ? `Due ${formatDate(bill.dueDate)}` : "No due date"}
                          {bill.autopay ? " · Auto-pay" : ""}
                          {!includedBills.has(index) &&
                          (bills ?? []).some(
                            (existing) =>
                              existing.name.toLowerCase().trim() ===
                              bill.name.toLowerCase().trim(),
                          )
                            ? " · already tracked"
                            : ""}
                        </span>
                      </span>
                    </span>
                    <Money value={Math.abs(bill.amount)} />
                  </label>
                ))}
              </div>
            </div>
          )}

          {extraction.transactions.length > 0 && (
            <div>
              <div
                className="sidebar-section__title"
                style={{ padding: 0, display: "flex", justifyContent: "space-between" }}
              >
                <span>Transactions</span>
                <select
                  value={txAccountId}
                  onChange={(event) => setTxAccountId(event.target.value)}
                  aria-label="Account for imported transactions"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: "0.15rem 0.4rem",
                    font: "inherit",
                    fontSize: "0.75rem",
                  }}
                >
                  {(accounts ?? []).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="data-list">
                {extraction.transactions.map((transaction, index) => (
                  <label className="data-list__row" key={index} style={{ cursor: "pointer" }}>
                    <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={includedTx.has(index)}
                        onChange={(event) =>
                          setIncludedTx((current) => {
                            const next = new Set(current);
                            if (event.target.checked) next.add(index);
                            else next.delete(index);
                            return next;
                          })
                        }
                      />
                      <span>
                        <span className="data-list__title">{transaction.merchant}</span>
                        <span className="data-list__subtitle" style={{ display: "block" }}>
                          {formatDate(transaction.date)}
                          {duplicateTx.has(index) ? " " : ""}
                        </span>
                      </span>
                      {duplicateTx.has(index) && (
                        <StatusBadge tone="amber">Duplicate</StatusBadge>
                      )}
                    </span>
                    <Money value={transaction.amount} signed />
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={step === "applying"}>
              {step === "applying" ? "Applying…" : "Apply to HomeVault"}
            </Button>
          </div>
        </div>
      )}

      {step === "done" && (
        <div className="form-grid">
          <div className="empty-state" style={{ paddingBottom: 0 }}>
            <div className="empty-state__title">Done — forecast updated</div>
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: "1.2rem",
              fontSize: "0.88rem",
              display: "grid",
              gap: 4,
            }}
          >
            {summary.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
          <div className="form-actions">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
