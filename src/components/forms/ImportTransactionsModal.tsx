import { useMemo, useState } from "react";
import { FileUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Money } from "@/components/ui/Money";
import { guessColumn, parseAmount, parseCsv, parseDate } from "@/lib/csv";
import { applyCategoryRules, NewTransactionInput } from "@/services/dataService";
import {
  useAccounts,
  useCategories,
  useCategoryRules,
  useImportTransactions,
  useTransactions,
} from "@/hooks/useFinancialData";

interface ImportTransactionsModalProps {
  onClose: () => void;
}

interface ParsedRow {
  index: number;
  date?: string;
  merchant: string;
  amount?: number;
  categoryId?: string;
  duplicate: boolean;
  valid: boolean;
}

export function ImportTransactionsModal({
  onClose,
}: ImportTransactionsModalProps) {
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();
  const { data: rules } = useCategoryRules();
  const { data: existing } = useTransactions();
  const importTransactions = useImportTransactions();

  const [rows, setRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState("");
  const [hasHeader, setHasHeader] = useState(true);
  const [dateCol, setDateCol] = useState(0);
  const [merchantCol, setMerchantCol] = useState(1);
  const [amountCol, setAmountCol] = useState(2);
  const [accountId, setAccountId] = useState("");
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [done, setDone] = useState<number | null>(null);

  async function handleFile(file: File) {
    const text = await file.text();
    const parsed = parseCsv(text);
    setFileName(file.name);
    setRows(parsed);
    setExcluded(new Set());
    setDone(null);
    if (parsed.length > 0) {
      const headers = parsed[0];
      const headerLike = headers.some((cell) =>
        /date|desc|merchant|amount|payee/i.test(cell),
      );
      setHasHeader(headerLike);
      if (headerLike) {
        setDateCol(guessColumn(headers, ["date"]) ?? 0);
        setMerchantCol(
          guessColumn(headers, ["description", "merchant", "payee", "name"]) ?? 1,
        );
        setAmountCol(guessColumn(headers, ["amount"]) ?? 2);
      }
    }
  }

  const headers = hasHeader && rows.length > 0 ? rows[0] : undefined;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const existingKeys = useMemo(
    () =>
      new Set(
        (existing ?? []).map(
          (t) =>
            `${t.transactionDate}|${Math.abs(t.amount).toFixed(2)}|${t.merchant.toLowerCase().trim()}`,
        ),
      ),
    [existing],
  );

  const parsed: ParsedRow[] = useMemo(() => {
    const seenInFile = new Set<string>();
    return dataRows.map((row, index) => {
      const date = parseDate(row[dateCol] ?? "");
      const merchant = (row[merchantCol] ?? "").trim();
      const amount = parseAmount(row[amountCol] ?? "");
      const key =
        date != null && amount != null
          ? `${date}|${Math.abs(amount).toFixed(2)}|${merchant.toLowerCase()}`
          : undefined;
      const duplicate =
        key != null && (existingKeys.has(key) || seenInFile.has(key));
      if (key != null) seenInFile.add(key);
      return {
        index,
        date,
        merchant,
        amount,
        categoryId: applyCategoryRules(merchant, rules ?? []),
        duplicate,
        valid: date != null && amount != null && merchant !== "",
      };
    });
  }, [dataRows, dateCol, merchantCol, amountCol, existingKeys, rules]);

  // Duplicates default to excluded but stay re-includable, since identical
  // charges can be legitimate. `excluded` stores per-row overrides of the
  // default inclusion.
  const isIncluded = (row: ParsedRow) =>
    row.valid && (excluded.has(row.index) ? row.duplicate : !row.duplicate);

  const importable = parsed.filter(isIncluded);
  const categoryName = new Map((categories ?? []).map((c) => [c.id, c.name]));

  async function handleImport() {
    if (!accountId || importable.length === 0) return;
    const inputs: NewTransactionInput[] = importable.map((row) => ({
      accountId,
      transactionDate: row.date!,
      merchant: row.merchant,
      amount: row.amount!,
      transactionType: row.amount! >= 0 ? "income" : "expense",
      categoryId: row.categoryId,
    }));
    const count = await importTransactions.mutateAsync(inputs);
    setDone(count);
  }

  return (
    <Modal title="Import transactions from CSV" onClose={onClose}>
      {done != null ? (
        <div className="form-grid">
          <p>
            Imported <strong>{done}</strong> transaction{done === 1 ? "" : "s"}{" "}
            from {fileName}. Merchant rules were applied automatically —
            anything uncategorized can be fixed right in the ledger, and the
            app will remember your choice.
          </p>
          <div className="form-actions">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="form-grid">
          <label className="form-field__label">
            Bank or card CSV file
            <input
              className="form-field__input"
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleFile(file);
              }}
            />
          </label>
          {rows.length > 0 && (
            <>
              <div className="form-field form-field--checkbox">
                <input
                  id="csv-header"
                  type="checkbox"
                  checked={hasHeader}
                  onChange={(event) => setHasHeader(event.target.checked)}
                />
                <label htmlFor="csv-header" className="form-field__label">
                  First row is a header
                </label>
              </div>
              <div className="three-col">
                {(
                  [
                    ["Date column", dateCol, setDateCol],
                    ["Merchant column", merchantCol, setMerchantCol],
                    ["Amount column", amountCol, setAmountCol],
                  ] as const
                ).map(([label, value, setValue]) => (
                  <label className="form-field__label" key={label}>
                    {label}
                    <select
                      value={value}
                      onChange={(event) => setValue(Number(event.target.value))}
                    >
                      {(headers ?? rows[0]).map((header, index) => (
                        <option key={index} value={index}>
                          {hasHeader ? header || `Column ${index + 1}` : `Column ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              <label className="form-field__label">
                Import into account
                <select
                  value={accountId}
                  onChange={(event) => setAccountId(event.target.value)}
                >
                  <option value="">Choose an account…</option>
                  {(accounts ?? []).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="table-wrap" style={{ maxHeight: 260, overflowY: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Date</th>
                      <th>Merchant</th>
                      <th>Category</th>
                      <th className="num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 200).map((row) => (
                      <tr key={row.index} style={{ opacity: row.duplicate || !row.valid ? 0.5 : 1 }}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isIncluded(row)}
                            disabled={!row.valid}
                            onChange={() =>
                              setExcluded((current) => {
                                const next = new Set(current);
                                if (next.has(row.index)) next.delete(row.index);
                                else next.add(row.index);
                                return next;
                              })
                            }
                            aria-label={`Include row ${row.index + 1}`}
                          />
                        </td>
                        <td>{row.date ?? "?"}</td>
                        <td>{row.merchant || "?"}</td>
                        <td>
                          {row.duplicate ? (
                            <StatusBadge tone="amber">Duplicate</StatusBadge>
                          ) : !row.valid ? (
                            <StatusBadge tone="red">Unreadable</StatusBadge>
                          ) : row.categoryId ? (
                            categoryName.get(row.categoryId)
                          ) : (
                            <StatusBadge tone="gray">Review</StatusBadge>
                          )}
                        </td>
                        <td className="num">
                          {row.amount != null ? <Money value={row.amount} signed /> : "?"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="form-actions">
                <Button type="button" variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    !accountId ||
                    importable.length === 0 ||
                    importTransactions.isPending
                  }
                >
                  <FileUp size={15} /> Import {importable.length} transaction
                  {importable.length === 1 ? "" : "s"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
