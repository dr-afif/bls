export interface CsvColumn<T> {
  key: keyof T | string;
  header: string;
  getValue?: (row: T) => unknown;
}

/**
 * Neutralizes potential formula injection in user-supplied text strings.
 * If a text string (after trimming leading whitespace/control characters)
 * begins with '=', '+', '-', or '@', it is prefixed with a single quote (').
 * Pure numeric values must NOT be passed to this function.
 */
export function sanitizeFormulaInjection(value: string): string {
  let startIndex = 0;
  while (startIndex < value.length) {
    const code = value.charCodeAt(startIndex);
    // ASCII control (0-31, 127) or whitespace
    if (code <= 32 || code === 127) {
      startIndex++;
    } else {
      break;
    }
  }

  const trimmed = value.slice(startIndex);
  if (['=', '+', '-', '@'].some((prefix) => trimmed.startsWith(prefix))) {
    return "'" + value;
  }
  return value;
}

/**
 * Sanitizes a filename or component to prevent directory traversal and invalid characters.
 */
export function sanitizeFilename(name: string): string {
  const printable = Array.from(name)
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('');

  return printable
    .replace(/[/\\]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Builds a deterministic, sanitized export filename.
 * Example: bls_COHORT-1_roster_2026-09-08.csv
 */
export function buildExportFilename(
  cohortCode: string,
  exportType: string,
  date: Date = new Date()
): string {
  const safeCode = sanitizeFilename(cohortCode) || 'cohort';
  const safeType = sanitizeFilename(exportType);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  return `bls_${safeCode}_${safeType}_${dateStr}.csv`;
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Trusted numeric types remain numeric and are never formula-sanitized
  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }

  let strValue = typeof value === 'string' ? value : String(value);

  // Neutralize formula injection for text
  strValue = sanitizeFormulaInjection(strValue);

  // RFC-4180 CSV escaping: double quotes, commas, newlines require quotes
  if (
    strValue.includes('"') ||
    strValue.includes(',') ||
    strValue.includes('\n') ||
    strValue.includes('\r')
  ) {
    strValue = '"' + strValue.replace(/"/g, '""') + '"';
  }

  return strValue;
}

/**
 * Generates RFC-4180 compliant CSV string using deterministic columns.
 * Zero rows produce headers + CRLF with no data rows.
 */
export function generateCsv<T>(
  data: T[],
  columns: CsvColumn<T>[]
): string {
  const headerRow = columns.map((col) => escapeCsvCell(col.header)).join(',');

  if (!data || data.length === 0) {
    return headerRow + '\r\n';
  }

  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const val = col.getValue
          ? col.getValue(row)
          : (row as Record<string, unknown>)[col.key as string];
        return escapeCsvCell(val);
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Ephemeral browser download helper.
 * Memory Blob -> Object URL -> Trigger Link -> Revoke URL.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const sanitized = sanitizeFilename(filename) || 'export.csv';
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', sanitized.endsWith('.csv') ? sanitized : `${sanitized}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
