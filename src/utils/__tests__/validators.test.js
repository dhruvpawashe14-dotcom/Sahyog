import { describe, it, expect } from 'vitest';
import { validatePAN, validateAadhaar, validateMobile, validateEmail, validateFileSize, MAX_FILE_SIZE_MB } from '../validators';

describe('validatePAN', () => {
  it('accepts a correctly formatted PAN', () => {
    expect(validatePAN('ABCDE1234F')).toBeNull();
  });
  it('rejects a malformed PAN', () => {
    expect(validatePAN('12345')).not.toBeNull();
    expect(validatePAN('ABCDEFGHIJ')).not.toBeNull();
  });
  it('treats empty as valid (optional field)', () => {
    expect(validatePAN('')).toBeNull();
  });
});

describe('validateAadhaar', () => {
  it('accepts exactly 12 digits', () => {
    expect(validateAadhaar('123456789012')).toBeNull();
  });
  it('rejects wrong length or non-numeric', () => {
    expect(validateAadhaar('12345')).not.toBeNull();
    expect(validateAadhaar('12345678901A')).not.toBeNull();
  });
  it('treats empty as valid — Aadhaar is optional (corporate clients)', () => {
    expect(validateAadhaar('')).toBeNull();
  });
});

describe('validateMobile', () => {
  it('accepts a valid 10-digit Indian mobile number', () => {
    expect(validateMobile('9876543210')).toBeNull();
  });
  it('rejects numbers starting with 0-5', () => {
    expect(validateMobile('1234567890')).not.toBeNull();
  });
  it('rejects wrong length', () => {
    expect(validateMobile('98765')).not.toBeNull();
  });
});

describe('validateEmail', () => {
  it('accepts a well-formed email', () => {
    expect(validateEmail('test@example.com')).toBeNull();
  });
  it('rejects malformed email', () => {
    expect(validateEmail('not-an-email')).not.toBeNull();
  });
});

describe('validateFileSize', () => {
  it(`rejects files over ${MAX_FILE_SIZE_MB}MB`, () => {
    const bigFile = { name: 'huge.pdf', size: (MAX_FILE_SIZE_MB + 1) * 1024 * 1024 };
    expect(validateFileSize(bigFile)).not.toBeNull();
  });
  it('accepts files under the limit', () => {
    const smallFile = { name: 'small.pdf', size: 1024 * 1024 };
    expect(validateFileSize(smallFile)).toBeNull();
  });
});
