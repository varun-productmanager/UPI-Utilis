/**
 * PSP-suffix resolution: the part outsiders never know.
 *
 * A UPI `@handle` does **not** map cleanly to "a bank". It maps to a PSP (the
 * payment app / TPAP that issued the address) and a *sponsor bank* (the bank
 * that actually holds the NPCI membership the app rides on). `@ybl` is not
 * "Yes Bank's app" — it's **PhonePe**, sponsored by Yes Bank.
 *
 * This mapping is a living dataset, not hardcoded truth: handles are added and
 * retired, and there is no official public registry. We treat it as a
 * versioned JSON file with a `lastVerified` date (see `src/data/handles.json`).
 */

import handleData from './data/handles.json';
import { isValidVpa, splitVpa, type VpaParts } from './vpa.js';

interface HandleRecord {
  psp: string;
  sponsorBank: string;
}

const handles = handleData.handles as Record<string, HandleRecord>;

/** ISO date the handle dataset was last cross-checked. */
export const HANDLES_LAST_VERIFIED: string = handleData.lastVerified;

export interface HandleInfo {
  /** The handle key, normalized to lower case. */
  handle: string;
  /** The payment app / TPAP that issues addresses on this handle. */
  psp: string;
  /** The bank whose NPCI membership the PSP rides on. */
  sponsorBank: string;
}

/**
 * Resolves a bare handle (no `@`) to its PSP + sponsor bank, or `null` if the
 * handle isn't in the dataset. Case-insensitive.
 */
export function lookupHandle(handle: string): HandleInfo | null {
  const key = handle.trim().toLowerCase();
  const record = handles[key];
  if (!record) return null;
  return { handle: key, psp: record.psp, sponsorBank: record.sponsorBank };
}

export interface ParsedVpa extends VpaParts {
  /** PSP name, or `null` if the handle isn't in the dataset. */
  psp: string | null;
  /** Sponsor bank, or `null` if the handle isn't in the dataset. */
  sponsorBank: string | null;
  /** Whether the handle resolved against the dataset. */
  known: boolean;
}

/**
 * Validates, splits, and resolves a VPA in one call.
 *
 * Returns `null` for a syntactically invalid VPA. For a valid VPA on an
 * unknown handle, returns the parts with `psp`/`sponsorBank` as `null` and
 * `known: false` — a valid address can sit on a handle we simply haven't
 * catalogued yet.
 *
 * @example
 * parseVpa('merchant@ybl')
 * // { local: 'merchant', handle: 'ybl', psp: 'PhonePe', sponsorBank: 'Yes Bank', known: true }
 */
export function parseVpa(vpa: string): ParsedVpa | null {
  if (!isValidVpa(vpa)) return null;
  const parts = splitVpa(vpa);
  if (!parts) return null;

  const info = lookupHandle(parts.handle);
  return {
    local: parts.local,
    handle: parts.handle,
    psp: info?.psp ?? null,
    sponsorBank: info?.sponsorBank ?? null,
    known: info !== null,
  };
}

/** Every handle currently in the dataset, sorted by handle. */
export function listHandles(): HandleInfo[] {
  return Object.entries(handles)
    .map(([handle, record]) => ({ handle, psp: record.psp, sponsorBank: record.sponsorBank }))
    .sort((a, b) => a.handle.localeCompare(b.handle));
}
