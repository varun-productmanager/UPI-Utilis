import { describe, it, expect } from 'vitest';
import { buildQrPayload, qrType, renderQr } from '../src/qr.js';

describe('qrType', () => {
  it('is static without an amount', () => {
    expect(qrType({ pa: 'merchant@ybl', pn: 'Chai Point' })).toBe('static');
  });

  it('is dynamic once an amount is present', () => {
    expect(qrType({ pa: 'merchant@ybl', pn: 'Chai Point', am: 149 })).toBe('dynamic');
  });
});

describe('buildQrPayload', () => {
  it('produces the same canonical upi:// string a deep link would', () => {
    const payload = buildQrPayload({ pa: 'merchant@ybl', pn: 'Chai Point' });
    expect(payload).toBe('upi://pay?pa=merchant%40ybl&pn=Chai%20Point&cu=INR');
  });
});

describe('renderQr', () => {
  it('renders a payload to a PNG data URL when qrcode is available', async () => {
    const payload = buildQrPayload({ pa: 'merchant@ybl', pn: 'Chai Point', am: 149 });
    const dataUrl = await renderQr(payload);
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
  });
});
