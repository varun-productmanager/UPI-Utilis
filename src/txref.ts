/**
 * Transaction-reference helpers.
 *
 * An RRN (Retrieval Reference Number) is the 12-digit numeric reference that
 * travels with an interbank transaction and is what you quote to a bank when
 * chasing a payment. The real value is assigned by the network, not the client
 * — this generates a correctly-*shaped* reference for your own `tr` field and
 * for tests/mocks, not a network-authoritative RRN.
 */

const DIGITS = '0123456789';
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function randomInt(max: number): number {
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    // Reject the small modulo-bias tail for uniformity.
    const limit = Math.floor(0xffffffff / max) * max;
    let v = buf[0]!;
    while (v >= limit) {
      cryptoObj.getRandomValues(buf);
      v = buf[0]!;
    }
    return v % max;
  }
  return Math.floor(Math.random() * max);
}

function randomString(length: number, alphabet: string): string {
  let out = '';
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

/**
 * Generates a 12-digit RRN-shaped reference.
 *
 * @example
 * generateRrn() // '402913847562'
 */
export function generateRrn(): string {
  return randomString(12, DIGITS);
}

export interface TxnRefOptions {
  /** Leading label. Defaults to `'TXN'`. */
  prefix?: string;
  /** Length of the random suffix. Defaults to `6`. */
  randomLength?: number;
}

/**
 * Generates a readable, collision-resistant transaction reference combining a
 * prefix, a UTC timestamp, and a random suffix. Suitable for the `tr` param of
 * a UPI link.
 *
 * @example
 * generateTxnRef()                  // 'TXN20260619T101530A1B2C3'
 * generateTxnRef({ prefix: 'ORD' }) // 'ORD20260619T101530XYZ123'
 */
export function generateTxnRef(options: TxnRefOptions = {}): string {
  const prefix = options.prefix ?? 'TXN';
  const randomLength = options.randomLength ?? 6;
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, '')
    .replace(/T/, 'T'); // -> YYYYMMDDTHHMMSS
  return `${prefix}${stamp}${randomString(randomLength, ALNUM)}`;
}
