/**
 * UPI QR payloads.
 *
 * A UPI QR just encodes the same `upi://pay?...` string a deep link does. The
 * distinction worth modelling is **static vs dynamic**:
 *  - **static**  — no amount; the payer types it in. Print once, reuse forever.
 *  - **dynamic** — amount (and usually a `tr` ref) baked in for a single sale.
 *
 * Advanced tiers not implemented here but worth knowing (see README):
 *  - **BharatQR** — the EMVCo-based, card+UPI interoperable QR standard.
 *  - **Signed QRs** — a `sign` param carrying a merchant signature so the QR
 *    can be verified as issued by a registered merchant.
 */

import { buildUpiLink, type UpiLinkParams } from './deeplink.js';

export type QrType = 'static' | 'dynamic';

/** A QR is dynamic once it carries an amount; otherwise it's static. */
export function qrType(params: UpiLinkParams): QrType {
  return params.am !== undefined ? 'dynamic' : 'static';
}

/**
 * Builds the `upi://pay?...` string to encode into a QR. Identical to a deep
 * link — the QR is just the transport.
 *
 * @example
 * buildQrPayload({ pa, pn })               // static — payer enters the amount
 * buildQrPayload({ pa, pn, am, tr })       // dynamic — amount + ref baked in
 */
export function buildQrPayload(params: UpiLinkParams): string {
  return buildUpiLink(params);
}

export interface RenderQrOptions {
  /** Error-correction level. Defaults to `'M'`. */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  /** Quiet-zone margin in modules. Defaults to `1`. */
  margin?: number;
  /** Pixel width of the output image. */
  width?: number;
}

/**
 * Renders a payload to a PNG data URL.
 *
 * `qrcode` is an **optional** peer dependency — it isn't pulled in unless you
 * call this. Install it yourself (`npm install qrcode`) if you need rendering;
 * a clear error is thrown otherwise. Most callers only need
 * {@link buildQrPayload} and render with their own front-end QR component.
 */
export async function renderQr(payload: string, options: RenderQrOptions = {}): Promise<string> {
  let mod: typeof import('qrcode');
  try {
    mod = await import('qrcode');
  } catch {
    throw new Error(
      'renderQr requires the optional peer dependency "qrcode". Install it with: npm install qrcode',
    );
  }
  const qrcode = (mod as { default?: typeof import('qrcode') }).default ?? mod;
  return qrcode.toDataURL(payload, {
    errorCorrectionLevel: options.errorCorrectionLevel ?? 'M',
    margin: options.margin ?? 1,
    ...(options.width ? { width: options.width } : {}),
  });
}
