# upi-utils

[![CI](https://github.com/varun-productmanager/UPI-Utilis/actions/workflows/ci.yml/badge.svg)](https://github.com/varun-productmanager/UPI-Utilis/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)
![Zero dependencies](https://img.shields.io/badge/runtime%20deps-0-success.svg)

> Correct, dependency-free TypeScript utilities for India's UPI payment rails.

**What is UPI?** UPI (Unified Payments Interface) is India's real-time bank-to-bank payment network — the rails behind apps like PhonePe, Google Pay, and Paytm, moving billions of transactions a month. You pay someone using a **VPA** (Virtual Payment Address) that looks like `varun@okhdfcbank`, or by scanning a QR that encodes a `upi://pay?...` link.

This library handles the parts that are easy to get *subtly* wrong unless you've actually shipped on these rails: case-insensitive VPA validation, resolving an `@handle` to the **PSP and sponsor bank** behind it, building spec-correct deep links and QR payloads, and Indian-format currency.

```bash
npm install upi-utils
```

- **Zero runtime dependencies.** `qrcode` is an *optional* peer dependency, only needed if you want `renderQr`.
- **TypeScript-first**, ships ESM + CJS + types.
- Designed for the front end (React Native / Expo / web), where deep links and QRs actually live.

---

## Module 1 — VPA validation

A VPA is `{identifier}@{handle}`, case-insensitive, with a constrained character set. The naive version is a one-line regex; the credible version handles case normalization, length bounds, rejecting leading/trailing/double dots, and treating "syntactically valid" as distinct from "known handle".

```ts
import { isValidVpa, normalizeVpa } from 'upi-utils';

isValidVpa('varun@okhdfcbank');  // true
isValidVpa('9876543210@paytm');  // true
isValidVpa('bad vpa@@x');        // false
normalizeVpa('Varun@OKHDFCBANK'); // 'varun@okhdfcbank'
```

## Module 2 — PSP-suffix parsing

The `@handle` does **not** map cleanly to a bank. It maps to a **PSP** (the app/TPAP that issued the address) and a **sponsor bank** (whose NPCI membership the app rides on). `@ybl` is **PhonePe**, not "Yes Bank's app".

```ts
import { parseVpa } from 'upi-utils';

parseVpa('merchant@ybl');
// { local: 'merchant', handle: 'ybl', psp: 'PhonePe', sponsorBank: 'Yes Bank', known: true }

parseVpa('user@okaxis').psp;  // 'Google Pay'
parseVpa('shop@apl').psp;     // 'Amazon Pay'
parseVpa('x@paytm').psp;      // 'Paytm'  (sponsorBank: 'Paytm Payments Bank')
```

> ⚠️ **This mapping is a living dataset, not hardcoded truth.** There is no official public NPCI registry of handles; they get added and retired over time. It lives in [`src/data/handles.json`](src/data/handles.json) with a `lastVerified` date and is community-maintained — see [CONTRIBUTING.md](CONTRIBUTING.md). A valid VPA on an uncatalogued handle returns `known: false` rather than failing.

## Module 3 — UPI intent / deep links

`upi://pay?...` is the canonical NPCI deep-link spec. Getting it right means URL-encoding the VPA (`@` → `%40`) and note, fixing `cu=INR`, and — the bug a non-payments dev ships — serializing `am` as a **string with exactly two decimals**, because some PSP apps choke on a bare integer.

```ts
import { buildUpiLink, buildAppUpiLink } from 'upi-utils';

buildUpiLink({
  pa: 'merchant@ybl',  // payee VPA (required)
  pn: 'Chai Point',    // payee name (required)
  am: 149,             // amount → serialized as "149.00"
  tn: 'Order 8821',    // note
  tr: 'TXN20260618093',// txn reference
  mc: '5814',          // merchant category code
});
// upi://pay?pa=merchant%40ybl&pn=Chai%20Point&am=149.00&cu=INR&tn=Order%208821&tr=TXN20260618093&mc=5814

buildAppUpiLink('phonepe', { pa: 'merchant@ybl', pn: 'Chai Point', am: 149 });
// phonepe://pay?pa=merchant%40ybl&pn=Chai%20Point&am=149.00&cu=INR
```

**Android intent-chooser note:** a plain `upi://pay` link opens the system chooser listing every installed UPI app. App-specific schemes (`phonepe://`, `paytmmp://`, `tez://upi/pay`) jump straight to one app — but only if it's installed, so always keep `upi://` as the fallback.

## Module 4 — QR payloads

A UPI QR just encodes the same `upi://pay?...` string. The useful distinction is **static** (no amount — payer types it in) vs **dynamic** (amount + ref baked in for a single sale).

```ts
import { buildQrPayload, qrType, renderQr } from 'upi-utils';

buildQrPayload({ pa: 'merchant@ybl', pn: 'Chai Point' });          // static
buildQrPayload({ pa: 'merchant@ybl', pn: 'Chai Point', am: 149, tr: 'INV42' }); // dynamic
qrType({ pa: 'merchant@ybl', pn: 'Chai Point', am: 149 });         // 'dynamic'

// Optional — requires the `qrcode` peer dependency:
const dataUrl = await renderQr(buildQrPayload({ pa: 'merchant@ybl', pn: 'Chai Point' }));
```

**Advanced tier (not implemented in v1, but on the roadmap):**
- **BharatQR** — the EMVCo-based QR standard that's interoperable across cards *and* UPI.
- **Signed QRs** — a `sign` param carrying a merchant signature so a QR can be verified as issued by a registered merchant.

## Extras

```ts
import { formatInr, maskVpa, maskMobile, generateRrn, generateTxnRef, classifyTransaction } from 'upi-utils';

formatInr(100000);                  // '₹1,00,000'   (Indian lakh/crore grouping)
formatInr(10000000);                // '₹1,00,00,000'
maskVpa('varun@okhdfcbank');        // 'va•••@okhdfcbank'
maskMobile('9876543210');           // '98XXXXXX10'
generateRrn();                      // '402913847562'  (12-digit RRN-shaped ref)
generateTxnRef({ prefix: 'ORD' });  // 'ORD20260619T101530XYZ123'
classifyTransaction({ mc: '5814' });// 'P2M'  (P2P otherwise — mc is the only reliable signal)
```

---

## Deliberately *not* built

- **Phone number → VPA inference.** There is no privacy-preserving way to map a mobile number to someone's VPA. This is impossible *by design*, and that's a feature of UPI, not a gap in this library.
- **Hardcoded per-transaction limits.** UPI limits shift over time and vary by bank, app, and merchant category (some categories have higher caps). If you need limits, source them into a dated config you keep current — never bake numbers in from memory.

## API surface

| Function | Returns |
| --- | --- |
| `isValidVpa(vpa)` | `boolean` |
| `normalizeVpa(vpa)` | `string` |
| `splitVpa(vpa)` | `{ local, handle } \| null` |
| `parseVpa(vpa)` | `{ local, handle, psp, sponsorBank, known } \| null` |
| `lookupHandle(handle)` | `{ handle, psp, sponsorBank } \| null` |
| `listHandles()` | `HandleInfo[]` |
| `buildUpiLink(params)` | `string` |
| `buildAppUpiLink(app, params)` | `string` |
| `buildQrPayload(params)` | `string` |
| `qrType(params)` | `'static' \| 'dynamic'` |
| `renderQr(payload, opts?)` | `Promise<string>` (data URL) |
| `formatInr(amount, opts?)` | `string` |
| `maskVpa(vpa)` / `maskMobile(num)` | `string` |
| `generateRrn()` / `generateTxnRef(opts?)` | `string` |
| `classifyTransaction(input)` | `'P2P' \| 'P2M'` |

## Development

```bash
npm install
npm test          # vitest
npm run typecheck # tsc --noEmit
npm run build     # tsup → dist/ (esm + cjs + d.ts)
```

## License

MIT © Varun Singla
