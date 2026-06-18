/**
 * upi-utils — correct, dependency-free helpers for India's UPI rails.
 *
 * Deliberately **not** implemented (and why):
 *  - Phone number → VPA inference. There is no privacy-preserving way to map a
 *    mobile number to someone's VPA, and doing so would be a privacy hole by
 *    design. Don't build it.
 *  - Hardcoded per-transaction limits. UPI limits shift over time and vary by
 *    bank, app, and merchant category. If you need limits, source them into a
 *    dated config you keep current — never bake numbers in from memory.
 */

// Module 1 — VPA validation & normalization
export {
  isValidVpa,
  normalizeVpa,
  splitVpa,
  VPA_MIN_LENGTH,
  VPA_MAX_LENGTH,
  type VpaParts,
} from './vpa.js';

// Module 2 — PSP-suffix parsing
export {
  parseVpa,
  lookupHandle,
  listHandles,
  HANDLES_LAST_VERIFIED,
  type HandleInfo,
  type ParsedVpa,
} from './handles.js';

// Module 3 — UPI intent / deep-link generation
export {
  buildUpiLink,
  buildAppUpiLink,
  type UpiLinkParams,
  type UpiApp,
} from './deeplink.js';

// Module 4 — QR payloads
export {
  buildQrPayload,
  qrType,
  renderQr,
  type QrType,
  type RenderQrOptions,
} from './qr.js';

// Extras — formatting, masking, references, classification
export {
  formatInr,
  maskVpa,
  maskMobile,
  type FormatInrOptions,
} from './format.js';
export { generateRrn, generateTxnRef, type TxnRefOptions } from './txref.js';
export { classifyTransaction, type TxnClassification, type ClassifyInput } from './classify.js';
