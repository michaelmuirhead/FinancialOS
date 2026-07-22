/**
 * Minimal RFC-4180-ish CSV parser: handles quoted fields, escaped quotes,
 * commas inside quotes, and CR/LF line endings. Bank exports are messy, so
 * blank lines are skipped and rows may have uneven lengths.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

/**
 * Normalizes bank-export amount strings: "$1,234.56", "(45.00)" (negative),
 * "-45.00", "45.00-". Returns undefined when unparseable.
 */
export function parseAmount(raw: string): number | undefined {
  let text = raw.trim();
  if (!text) return undefined;
  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }
  if (text.endsWith("-")) {
    negative = true;
    text = text.slice(0, -1);
  }
  if (text.startsWith("-")) {
    negative = true;
    text = text.slice(1);
  }
  text = text.replace(/[$,\s]/g, "");
  if (!/^\d*\.?\d+$/.test(text)) return undefined;
  const value = Number(text);
  if (!Number.isFinite(value)) return undefined;
  return negative ? -value : value;
}

/**
 * Normalizes common bank date formats to ISO (YYYY-MM-DD):
 * "2026-07-22", "07/22/2026", "7/22/26", "Jul 22, 2026".
 */
export function parseDate(raw: string): string | undefined {
  const text = raw.trim();
  if (!text) return undefined;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);

  const usMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (usMatch) {
    const [, month, day, yearRaw] = usMatch;
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return undefined;
}

/** Case-insensitive header matching for auto-detecting column mappings. */
export function guessColumn(
  headers: string[],
  candidates: string[],
): number | undefined {
  const lowered = headers.map((header) => header.toLowerCase().trim());
  for (const candidate of candidates) {
    const index = lowered.findIndex((header) => header.includes(candidate));
    if (index !== -1) return index;
  }
  return undefined;
}
