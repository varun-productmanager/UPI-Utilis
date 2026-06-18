/**
 * P2P vs P2M classification.
 *
 * Person-to-person (P2P) and person-to-merchant (P2M) transactions are treated
 * differently by NPCI — different limits, MDR rules, and settlement. The honest
 * truth: the only *reliable* signal inside a `upi://pay` link is the merchant
 * category code (`mc`). A merchant intent carries an MCC; a P2P transfer does
 * not. Handle names are **not** a reliable signal — plenty of merchants collect
 * on consumer handles, so we don't pretend otherwise.
 */

export type TxnClassification = 'P2P' | 'P2M';

export interface ClassifyInput {
  /** Merchant category code, if present in the intent. */
  mc?: string;
  /** Payee VPA (currently informational; reserved for future heuristics). */
  pa?: string;
}

/**
 * Classifies a transaction as P2P or P2M from its UPI intent params.
 *
 * Returns `'P2M'` when a non-empty merchant category code is present, `'P2P'`
 * otherwise. This intentionally relies only on `mc` — see the module note on
 * why handle-based guessing is unreliable.
 *
 * @example
 * classifyTransaction({ mc: '5814' }) // 'P2M'
 * classifyTransaction({})             // 'P2P'
 */
export function classifyTransaction(input: ClassifyInput): TxnClassification {
  return input.mc && input.mc.trim() !== '' ? 'P2M' : 'P2P';
}
