import { PasswordValidator } from './PasswordValidator';

describe('PasswordValidator', () => {
  it('accepts a strong password', () => {
    const result = PasswordValidator.validate('Abcd1234!');
    expect(result.isSuccess).toBe(true);
  });

  it('rejects short passwords', () => {
    const result = PasswordValidator.validate('Ab1!');
    expect(result.isFailure).toBe(true);
    expect(result.error).toMatch(/at least 8 characters/);
  });

  it('requires uppercase letters', () => {
    const result = PasswordValidator.validate('abcd1234!');
    expect(result.isFailure).toBe(true);
    expect(result.error).toMatch(/uppercase/);
  });

  it('requires lowercase letters', () => {
    const result = PasswordValidator.validate('ABCD1234!');
    expect(result.isFailure).toBe(true);
    expect(result.error).toMatch(/lowercase/);
  });

  it('requires numbers', () => {
    const result = PasswordValidator.validate('AbcdABCD!');
    expect(result.isFailure).toBe(true);
    expect(result.error).toMatch(/numeric/);
  });

  it('requires special characters', () => {
    const result = PasswordValidator.validate('Abcd1234');
    expect(result.isFailure).toBe(true);
    expect(result.error).toMatch(/special character/);
  });

  it('rejects whitespace', () => {
    const result = PasswordValidator.validate('Abcd 1234!');
    expect(result.isFailure).toBe(true);
    expect(result.error).toMatch(/whitespace/);
  });
});