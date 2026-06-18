import { describe, it, expect } from 'vitest';
import { parseVpa, lookupHandle, listHandles, HANDLES_LAST_VERIFIED } from '../src/handles.js';

describe('parseVpa — the PSP knowledge that matters', () => {
  it('resolves @ybl to PhonePe on Yes Bank (not "Yes Bank\'s app")', () => {
    expect(parseVpa('merchant@ybl')).toEqual({
      local: 'merchant',
      handle: 'ybl',
      psp: 'PhonePe',
      sponsorBank: 'Yes Bank',
      known: true,
    });
  });

  it('maps the well-known PSP suffixes correctly', () => {
    expect(parseVpa('user@okaxis')?.psp).toBe('Google Pay');
    expect(parseVpa('user@okhdfcbank')?.psp).toBe('Google Pay');
    expect(parseVpa('shop@apl')?.psp).toBe('Amazon Pay');
    expect(parseVpa('x@paytm')?.psp).toBe('Paytm');
    expect(parseVpa('x@paytm')?.sponsorBank).toBe('Paytm Payments Bank');
    expect(parseVpa('biz@axl')?.psp).toBe('PhonePe');
    expect(parseVpa('me@waaxis')?.psp).toBe('WhatsApp Pay');
  });

  it('returns parts with known:false for a valid VPA on an uncatalogued handle', () => {
    const parsed = parseVpa('someone@brandnewpsp');
    expect(parsed).toMatchObject({
      local: 'someone',
      handle: 'brandnewpsp',
      psp: null,
      sponsorBank: null,
      known: false,
    });
  });

  it('returns null for an invalid VPA', () => {
    expect(parseVpa('bad vpa@@x')).toBeNull();
  });
});

describe('lookupHandle', () => {
  it('is case-insensitive', () => {
    expect(lookupHandle('YBL')?.psp).toBe('PhonePe');
  });

  it('returns null for unknown handles', () => {
    expect(lookupHandle('definitelynotahandle')).toBeNull();
  });
});

describe('dataset metadata', () => {
  it('exposes a last-verified date', () => {
    expect(HANDLES_LAST_VERIFIED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('lists handles sorted, with complete records', () => {
    const handles = listHandles();
    expect(handles.length).toBeGreaterThan(10);
    for (const h of handles) {
      expect(h.handle).toBeTruthy();
      expect(h.psp).toBeTruthy();
      expect(h.sponsorBank).toBeTruthy();
    }
    const names = handles.map((h) => h.handle);
    expect(names).toEqual([...names].sort());
  });
});
