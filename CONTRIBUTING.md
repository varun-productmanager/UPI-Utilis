# Contributing

Thanks for helping keep `upi-utils` correct. The most valuable contribution is
keeping the **handle dataset** current.

## Updating the handle mapping

The mapping in [`src/data/handles.json`](src/data/handles.json) is
community-maintained — **there is no official public NPCI registry** of UPI
handles, so this is best-effort and needs upkeep as PSPs add and retire handles.

When you add or correct an entry:

1. Add it under `handles`, keyed by the **lower-case** handle (no `@`):
   ```json
   "newhandle": { "psp": "App Name", "sponsorBank": "Sponsor Bank Name" }
   ```
   - `psp` is the app / TPAP that issues addresses on this handle (e.g.
     `PhonePe`, `Google Pay`), **not** necessarily the bank.
   - `sponsorBank` is the bank whose NPCI membership the PSP rides on.
2. Bump `lastVerified` to the date (`YYYY-MM-DD`) you confirmed the mapping.
3. In your PR description, say **how** you verified it — a live VPA you tested, a
   screenshot, or official PSP documentation. "I think it's X" isn't enough for
   data that can route money.
4. Keep entries grouped by PSP and roughly ordered as they already are.

## Code changes

```bash
npm install
npm test
npm run typecheck
```

- Zero runtime dependencies is a hard rule. `qrcode` stays an **optional** peer
  dependency.
- New behavior needs tests. Prefer named, real-world VPAs in test cases — they
  double as documentation.
- Don't add per-transaction limit constants, and don't add phone-number → VPA
  inference. See the README for why both are intentionally out of scope.
