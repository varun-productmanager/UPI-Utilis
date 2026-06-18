/**
 * UPI intent / deep-link generation.
 *
 * `upi://pay?...` is the canonical NPCI deep-link spec. Building it correctly
 * means a few things people miss:
 *  - URL-encode every value (`@` → `%40`, space → `%20`).
 *  - `cu` is fixed to `INR` and should always be present.
 *  - `am` must serialize as a string with **exactly two decimals** (`149.00`,
 *    not `149` or `149.0`) — some PSP apps reject or mis-parse a bare integer.
 *  - Parameter casing matters; they are the short codes below, not friendly
 *    names.
 */

import { isValidVpa, normalizeVpa } from './vpa.js';

export interface UpiLinkParams {
  /** Payee VPA (required). */
  pa: string;
  /** Payee name (required). */
  pn: string;
  /** Amount. Serialized to a two-decimal string. */
  am?: number | string;
  /** Currency. Defaults to `INR` (the only value UPI supports today). */
  cu?: string;
  /** Minimum amount, for "pay at least" flows. Two-decimal string. */
  mam?: number | string;
  /** Transaction note / remarks. */
  tn?: string;
  /** Transaction reference id (your RRN / order ref). */
  tr?: string;
  /** Transaction id, set by the PSP for merchant-initiated flows. */
  tid?: string;
  /** Merchant category code (MCC), e.g. `5814` for fast food. */
  mc?: string;
  /** Mode (`00`–`04`); rarely needed for app-to-app intents. */
  mode?: string;
  /** Purpose code. */
  purpose?: string;
  /** Callback / verification URL for signed merchant flows. */
  url?: string;
}

/** Apps that expose their own UPI intent scheme in addition to `upi://`. */
export type UpiApp = 'phonepe' | 'paytm' | 'gpay' | 'bhim';

const APP_SCHEMES: Record<UpiApp, string> = {
  phonepe: 'phonepe://pay',
  paytm: 'paytmmp://pay',
  gpay: 'tez://upi/pay',
  bhim: 'bhim://pay',
};

function formatAmount(value: number | string, field: string): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`buildUpiLink: "${field}" must be a non-negative number, got ${String(value)}`);
  }
  // Two decimals, as a string — this is the bug a non-payments dev ships.
  return n.toFixed(2);
}

/**
 * Builds a canonical `upi://pay?...` deep link.
 *
 * Throws if `pa` is missing/invalid, `pn` is missing, or an amount is negative.
 * Parameter order follows the conventional NPCI ordering
 * (`pa, pn, am, cu, ...`) so output is stable and diff-friendly.
 *
 * @example
 * buildUpiLink({ pa: 'merchant@ybl', pn: 'Chai Point', am: 149, tn: 'Order 8821', mc: '5814' })
 * // upi://pay?pa=merchant%40ybl&pn=Chai%20Point&am=149.00&cu=INR&tn=Order%208821&mc=5814
 */
export function buildUpiLink(params: UpiLinkParams): string {
  if (!params.pa) throw new Error('buildUpiLink: "pa" (payee VPA) is required');
  if (!isValidVpa(params.pa)) {
    throw new Error(`buildUpiLink: invalid payee VPA "${params.pa}"`);
  }
  if (!params.pn || params.pn.trim() === '') {
    throw new Error('buildUpiLink: "pn" (payee name) is required');
  }

  const query: Array<[string, string]> = [];
  query.push(['pa', normalizeVpa(params.pa)]);
  query.push(['pn', params.pn]);
  if (params.am !== undefined) query.push(['am', formatAmount(params.am, 'am')]);
  query.push(['cu', params.cu ?? 'INR']);
  if (params.mam !== undefined) query.push(['mam', formatAmount(params.mam, 'mam')]);
  if (params.tn) query.push(['tn', params.tn]);
  if (params.tr) query.push(['tr', params.tr]);
  if (params.tid) query.push(['tid', params.tid]);
  if (params.mc) query.push(['mc', params.mc]);
  if (params.mode) query.push(['mode', params.mode]);
  if (params.purpose) query.push(['purpose', params.purpose]);
  if (params.url) query.push(['url', params.url]);

  const qs = query.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `upi://pay?${qs}`;
}

/**
 * Same payload as {@link buildUpiLink}, but using an app-specific scheme so the
 * intent opens directly in one app instead of the Android chooser.
 *
 * Note: on Android, a plain `upi://pay` link triggers the system intent
 * chooser listing every installed UPI app. App-specific schemes
 * (`phonepe://`, `paytmmp://`, `tez://upi/pay`) bypass the chooser but only
 * work if that app is installed — always keep `upi://` as the fallback.
 */
export function buildAppUpiLink(app: UpiApp, params: UpiLinkParams): string {
  return buildUpiLink(params).replace(/^upi:\/\/pay/, APP_SCHEMES[app]);
}
