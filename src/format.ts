/**
 * Display helpers.
 *
 * The non-obvious one is Indian digit grouping. India groups by the
 * lakh/crore system — `1,00,000` and `10,00,000`, not `100,000` and
 * `1,000,000`. `Intl.NumberFormat('en-IN', ...)` knows this; hand-rolling it
 * with `toLocaleString()` defaults is where people quietly get it wrong.
 */

export interface FormatInrOptions {
  /**
   * Fixed number of fraction digits. Defaults to `0` for whole rupees and `2`
   * otherwise, so `formatInr(100000)` is `₹1,00,000` and `formatInr(149.5)` is
   * `₹149.50`.
   */
  decimals?: number;
  /** Drop the `₹` symbol and return just the grouped number. */
  symbol?: boolean;
}

/**
 * Formats an amount as Indian rupees with lakh/crore grouping.
 *
 * @example
 * formatInr(100000)   // '₹1,00,000'
 * formatInr(10000000) // '₹1,00,00,000'
 * formatInr(149.5)    // '₹149.50'
 */
export function formatInr(amount: number, options: FormatInrOptions = {}): string {
  if (!Number.isFinite(amount)) {
    throw new Error(`formatInr: expected a finite number, got ${String(amount)}`);
  }
  const decimals = options.decimals ?? (Number.isInteger(amount) ? 0 : 2);
  const grouped = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return options.symbol === false ? grouped : `₹${grouped}`;
}

/**
 * Masks a VPA for display in logs or receipts, keeping just enough to be
 * recognizable: first two chars of the local part, the handle intact.
 *
 * @example
 * maskVpa('varun@okhdfcbank') // 'va•••@okhdfcbank'
 */
export function maskVpa(vpa: string): string {
  const at = vpa.indexOf('@');
  if (at <= 0) return vpa;
  const local = vpa.slice(0, at);
  const handle = vpa.slice(at + 1);
  const shown = local.slice(0, 2);
  const hidden = '•'.repeat(Math.max(local.length - 2, 1));
  return `${shown}${hidden}@${handle}`;
}

/**
 * Masks a mobile number, keeping the first two and last two digits.
 *
 * @example
 * maskMobile('9876543210') // '98XXXXXX10'
 */
export function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 5) return mobile;
  const middle = 'X'.repeat(digits.length - 4);
  return `${digits.slice(0, 2)}${middle}${digits.slice(-2)}`;
}
