/**
 * VPA = Virtual Payment Address: the `{local}@{handle}` identifier a user shares
 * to receive a UPI payment (e.g. `varun@okhdfcbank`).
 *
 * Things a generic validator gets subtly wrong, and which this one handles:
 *  - VPAs are **case-insensitive** — `Varun@OKHDFCBANK` and `varun@okhdfcbank`
 *    are the same address. Always normalize before comparing or persisting.
 *  - The character set is far tighter than email. The local part allows
 *    alphanumerics plus `.`, `-`, `_`; the handle is alphanumeric and starts
 *    with a letter. No spaces, exactly one `@`.
 *  - A leading/trailing dot or a `..` run is invalid, even though the chars are.
 *  - "Syntactically valid" is not the same as "real handle" — that distinction
 *    lives in {@link parseVpa}, not here.
 */

/** Shortest plausible VPA, e.g. `a@bc`. */
export const VPA_MIN_LENGTH = 4;
/** Generous upper bound; real VPAs are far shorter. */
export const VPA_MAX_LENGTH = 255;

// Local part: alphanumerics plus . _ - , but must start and end alphanumeric.
const LOCAL_PART = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
// Handle: starts with a letter, then alphanumerics. Real handles carry no
// punctuation (okhdfcbank, ybl, paytm, barodampay).
const HANDLE_PART = /^[a-z][a-z0-9]+$/;

export interface VpaParts {
  /** The identifier before the `@`, normalized to lower case. */
  local: string;
  /** The handle after the `@`, normalized to lower case. */
  handle: string;
}

/**
 * Lower-cases and trims a VPA so two spellings of the same address compare
 * equal. Does not validate — pair with {@link isValidVpa}.
 */
export function normalizeVpa(vpa: string): string {
  return vpa.trim().toLowerCase();
}

/**
 * Splits a VPA into its local and handle parts, normalizing case. Returns
 * `null` if there isn't exactly one non-empty part on each side of a single
 * `@`. This is a structural split only — it does not enforce the character set.
 */
export function splitVpa(vpa: string): VpaParts | null {
  if (typeof vpa !== 'string') return null;
  const normalized = normalizeVpa(vpa);
  const at = normalized.indexOf('@');
  // Exactly one '@': first and last index must agree, and not be at an edge.
  if (at <= 0 || at !== normalized.lastIndexOf('@') || at === normalized.length - 1) {
    return null;
  }
  return {
    local: normalized.slice(0, at),
    handle: normalized.slice(at + 1),
  };
}

/**
 * True if `vpa` is a syntactically valid Virtual Payment Address. This checks
 * structure and character set only — use {@link parseVpa} to additionally
 * resolve a *known* handle.
 */
export function isValidVpa(vpa: string): boolean {
  if (typeof vpa !== 'string') return false;
  const normalized = normalizeVpa(vpa);
  if (normalized.length < VPA_MIN_LENGTH || normalized.length > VPA_MAX_LENGTH) return false;
  if (/\s/.test(normalized)) return false;
  if (normalized.includes('..')) return false;

  const parts = splitVpa(normalized);
  if (!parts) return false;

  return LOCAL_PART.test(parts.local) && HANDLE_PART.test(parts.handle);
}
