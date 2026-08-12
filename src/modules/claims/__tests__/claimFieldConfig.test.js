import { describe, it, expect } from 'vitest';
import { CLAIM_TYPES, CLAIM_FIELD_CONFIG, splitFormValues } from '../claimFieldConfig';

describe('CLAIM_FIELD_CONFIG', () => {
  it('defines exactly the three claim types', () => {
    expect(CLAIM_TYPES).toEqual(['Health', 'Motor', 'Non-Motor']);
  });

  it('every field in every type has a label, field key, target, and type', () => {
    for (const type of CLAIM_TYPES) {
      for (const f of CLAIM_FIELD_CONFIG[type]) {
        expect(f.label).toBeTruthy();
        expect(f.field).toBeTruthy();
        expect(['top', 'details']).toContain(f.target);
        expect(f.type).toBeTruthy();
      }
    }
  });

  it('every type has a client_name field marked required (the name field)', () => {
    for (const type of CLAIM_TYPES) {
      const nameField = CLAIM_FIELD_CONFIG[type].find((f) => f.field === 'client_name');
      expect(nameField).toBeDefined();
      expect(nameField.required).toBe(true);
    }
  });

  it('every type includes Claim Intimation Date', () => {
    // Regression test: Health originally lacked this field until explicitly requested.
    for (const type of CLAIM_TYPES) {
      const hasIntimationDate = CLAIM_FIELD_CONFIG[type].some((f) => f.field === 'claim_intimation_date');
      expect(hasIntimationDate).toBe(true);
    }
  });
});

describe('splitFormValues', () => {
  it('splits top-level and details fields correctly for Health', () => {
    const values = {
      client_name: 'Jane Doe',
      patient_name: 'John Doe',
      claim_amount: '50000',
      insurance_company: 'Bajaj',
    };
    const { top, details } = splitFormValues('Health', values);
    expect(top.client_name).toBe('Jane Doe');
    expect(top.claim_amount).toBe(50000); // number field should be coerced to a Number
    expect(details.patient_name).toBe('John Doe');
    expect(details.insurance_company).toBe('Bajaj');
    expect(details.client_name).toBeUndefined(); // top-level fields shouldn't leak into details
  });

  it('excludes status-typed fields entirely (set later via workflow, not at creation)', () => {
    const { top, details } = splitFormValues('Health', { client_name: 'X' });
    expect(top.status).toBeUndefined();
    expect(details.status).toBeUndefined();
  });

  it('skips empty-string values instead of writing blanks', () => {
    const { top, details } = splitFormValues('Motor', { client_name: 'X', vehicle_number: '' });
    expect('vehicle_number' in details).toBe(false);
  });

  it('handles an unknown claim type gracefully (empty config, no crash)', () => {
    const { top, details } = splitFormValues('NotARealType', { client_name: 'X' });
    expect(top).toEqual({});
    expect(details).toEqual({});
  });
});
