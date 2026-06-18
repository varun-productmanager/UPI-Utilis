import { describe, it, expect } from 'vitest';
import { isValidVpa, normalizeVpa, splitVpa } from '../src/vpa.js';

describe('isValidVpa', () => {
  it('accepts real-world VPAs', () => {
    const valid = [
      'varun@okhdfcbank',
      '9876543210@paytm',
      'merchant@ybl',
      'chai.point@okaxis',
      'shop-42@apl',
      'user_name@ibl',
    ];
    for (const vpa of valid) expect(isValidVpa(vpa), vpa).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isValidVpa('Varun@OKHDFCBANK')).toBe(true);
  });

  it('rejects malformed VPAs', () => {
    const invalid = [
      'bad vpa@@x',     // space + double @
      'nohandle',       // no @
      '@okhdfcbank',    // empty local
      'varun@',         // empty handle
      'a@b',            // too short
      'varun@@okhdfc',  // double @
      'varun@ok hdfc',  // space in handle
      '.varun@okaxis',  // leading dot
      'varun.@okaxis',  // trailing dot in local
      'va..run@okaxis', // consecutive dots
      'varun@9bank',    // handle must start with a letter
    ];
    for (const vpa of invalid) expect(isValidVpa(vpa), vpa).toBe(false);
  });

  it('rejects non-strings', () => {
    // @ts-expect-error testing runtime guard
    expect(isValidVpa(null)).toBe(false);
    // @ts-expect-error testing runtime guard
    expect(isValidVpa(undefined)).toBe(false);
  });
});

describe('normalizeVpa', () => {
  it('lower-cases and trims', () => {
    expect(normalizeVpa('  Varun@OKHDFCBANK ')).toBe('varun@okhdfcbank');
  });
});

describe('splitVpa', () => {
  it('splits into local and handle', () => {
    expect(splitVpa('merchant@ybl')).toEqual({ local: 'merchant', handle: 'ybl' });
  });

  it('returns null on bad structure', () => {
    expect(splitVpa('nope')).toBeNull();
    expect(splitVpa('a@b@c')).toBeNull();
    expect(splitVpa('@x')).toBeNull();
  });
});
