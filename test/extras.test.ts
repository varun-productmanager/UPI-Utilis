import { describe, it, expect } from 'vitest';
import { formatInr, maskVpa, maskMobile } from '../src/format.js';
import { generateRrn, generateTxnRef } from '../src/txref.js';
import { classifyTransaction } from '../src/classify.js';

describe('formatInr — Indian lakh/crore grouping', () => {
  it('groups by the Indian system', () => {
    expect(formatInr(100000)).toBe('₹1,00,000');
    expect(formatInr(10000000)).toBe('₹1,00,00,000');
    expect(formatInr(1234)).toBe('₹1,234');
  });

  it('shows paise when the amount is fractional', () => {
    expect(formatInr(149.5)).toBe('₹149.50');
  });

  it('can drop the symbol', () => {
    expect(formatInr(100000, { symbol: false })).toBe('1,00,000');
  });
});

describe('maskVpa', () => {
  it('keeps two chars of the local part and the full handle', () => {
    expect(maskVpa('varun@okhdfcbank')).toBe('va•••@okhdfcbank');
  });
});

describe('maskMobile', () => {
  it('keeps the first and last two digits', () => {
    expect(maskMobile('9876543210')).toBe('98XXXXXX10');
  });
});

describe('generateRrn', () => {
  it('is 12 numeric digits', () => {
    expect(generateRrn()).toMatch(/^\d{12}$/);
  });

  it('is unlikely to collide', () => {
    const set = new Set(Array.from({ length: 1000 }, () => generateRrn()));
    expect(set.size).toBeGreaterThan(990);
  });
});

describe('generateTxnRef', () => {
  it('has prefix + timestamp + random suffix', () => {
    expect(generateTxnRef()).toMatch(/^TXN\d{8}T\d{6}[A-Z0-9]{6}$/);
    expect(generateTxnRef({ prefix: 'ORD' })).toMatch(/^ORD/);
  });
});

describe('classifyTransaction', () => {
  it('is P2M when a merchant category code is present', () => {
    expect(classifyTransaction({ mc: '5814' })).toBe('P2M');
  });

  it('is P2P otherwise', () => {
    expect(classifyTransaction({})).toBe('P2P');
    expect(classifyTransaction({ mc: '' })).toBe('P2P');
  });
});
