import { describe, it, expect } from 'vitest';
import { buildUpiLink, buildAppUpiLink } from '../src/deeplink.js';

describe('buildUpiLink', () => {
  it('builds a canonical link with encoding and two-decimal amount', () => {
    const link = buildUpiLink({
      pa: 'merchant@ybl',
      pn: 'Chai Point',
      am: 149,
      tn: 'Order 8821',
      tr: 'TXN20260618093',
      mc: '5814',
    });
    expect(link).toBe(
      'upi://pay?pa=merchant%40ybl&pn=Chai%20Point&am=149.00&cu=INR&tn=Order%208821&tr=TXN20260618093&mc=5814',
    );
  });

  it('encodes @ as %40 and space as %20', () => {
    const link = buildUpiLink({ pa: 'a.b@okaxis', pn: 'Acme Pvt Ltd' });
    expect(link).toContain('pa=a.b%40okaxis');
    expect(link).toContain('pn=Acme%20Pvt%20Ltd');
  });

  it('always emits cu=INR', () => {
    expect(buildUpiLink({ pa: 'x@ybl', pn: 'X' })).toContain('cu=INR');
  });

  it('serializes am with exactly two decimals (the PSP-choke bug)', () => {
    expect(buildUpiLink({ pa: 'x@ybl', pn: 'X', am: 149 })).toContain('am=149.00');
    expect(buildUpiLink({ pa: 'x@ybl', pn: 'X', am: 149.5 })).toContain('am=149.50');
    expect(buildUpiLink({ pa: 'x@ybl', pn: 'X', am: '149' })).toContain('am=149.00');
  });

  it('throws on missing/invalid required params', () => {
    expect(() => buildUpiLink({ pa: '', pn: 'X' })).toThrow(/pa/);
    expect(() => buildUpiLink({ pa: 'bad vpa@@x', pn: 'X' })).toThrow(/invalid/);
    expect(() => buildUpiLink({ pa: 'x@ybl', pn: '' })).toThrow(/pn/);
    expect(() => buildUpiLink({ pa: 'x@ybl', pn: 'X', am: -5 })).toThrow(/am/);
  });
});

describe('buildAppUpiLink', () => {
  it('swaps in app-specific schemes, keeping the payload', () => {
    const params = { pa: 'merchant@ybl', pn: 'Chai Point', am: 149 };
    expect(buildAppUpiLink('phonepe', params)).toMatch(/^phonepe:\/\/pay\?pa=merchant%40ybl/);
    expect(buildAppUpiLink('paytm', params)).toMatch(/^paytmmp:\/\/pay\?/);
    expect(buildAppUpiLink('gpay', params)).toMatch(/^tez:\/\/upi\/pay\?/);
    expect(buildAppUpiLink('bhim', params)).toMatch(/^bhim:\/\/pay\?/);
  });
});
