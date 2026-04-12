/**
 * Shared security validation helpers for API routes.
 * Centralises input validation to prevent invalid/malicious data.
 */

/** Returns true if `val` is a finite positive integer (≥ 1). */
export function isPositiveInt(val: unknown): val is number {
  const n = Number(val);
  return Number.isFinite(n) && Number.isInteger(n) && n >= 1;
}

/** Returns true if `val` is a finite number > 0. */
export function isPositiveNumber(val: unknown): val is number {
  const n = Number(val);
  return Number.isFinite(n) && n > 0;
}

/** Returns true if `val` is a finite number ≥ 0. */
export function isNonNegativeNumber(val: unknown): val is number {
  const n = Number(val);
  return Number.isFinite(n) && n >= 0;
}

/** Returns true if `val` is a valid month number (1-12). */
export function isValidMonth(val: unknown): val is number {
  const n = Number(val);
  return Number.isInteger(n) && n >= 1 && n <= 12;
}

/** Returns true if `val` is a plausible year (2000-2100). */
export function isValidYear(val: unknown): val is number {
  const n = Number(val);
  return Number.isInteger(n) && n >= 2000 && n <= 2100;
}

/** Returns true if `val` can be parsed to a valid Date. */
export function isValidDate(val: unknown): boolean {
  if (!val) return false;
  const d = new Date(val as string | number);
  return !isNaN(d.getTime());
}

/** Returns true if `val` is a non-empty trimmed string within maxLen. */
export function isValidName(val: unknown, maxLen = 200): boolean {
  return typeof val === 'string' && val.trim().length > 0 && val.trim().length <= maxLen;
}

/** Returns true if `val` matches the institute entry number format. */
export function isValidEntryNo(val: unknown): boolean {
  return typeof val === 'string' && /^\d{4}[A-Z]{2,4}\d{4}$/.test(val.trim().toUpperCase());
}

/** Maximum upload file size in bytes (10 MB). */
export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

/** Allowed MIME types for Excel file uploads. */
const VALID_EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',                                          // .xls
  'application/octet-stream',                                          // some browsers send this
];

/** Allowed file extensions for Excel uploads. */
const VALID_EXCEL_EXTENSIONS = ['.xlsx', '.xls'];

/**
 * Validates that the uploaded file is a legitimate Excel file.
 * Checks both file extension and MIME type.
 */
export function isValidExcelFile(file: File): boolean {
  const fileName = file.name?.toLowerCase() ?? '';
  const ext = fileName.substring(fileName.lastIndexOf('.'));
  const hasValidExtension = VALID_EXCEL_EXTENSIONS.includes(ext);
  const hasValidMimeType = VALID_EXCEL_MIME_TYPES.includes(file.type);
  return hasValidExtension && hasValidMimeType;
}

/**
 * Sanitise an error for API responses.
 * In production, never expose internal messages; in development, keep them for debugging.
 */
export function sanitizeErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV === 'development') {
    return error instanceof Error ? error.message : String(error);
  }
  return fallback;
}
