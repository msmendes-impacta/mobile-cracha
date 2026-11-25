import { hasErrors, MESSAGES, validateUser } from '../../src/domain/validateUser';
import type { UserInput } from '../../src/models/user';

const valid: UserInput = {
  name: 'Matheus Mendes',
  username: 'matheus',
  password: 'senha123',
  confirmPassword: 'senha123',
};
const existing = [
  { id: 'u1', username: 'matheus' },
  { id: 'u2', username: 'nicoli.f' },
];
const create = { kind: 'create' } as const;

describe('validateUser: create mode', () => {
  it('returns no errors for valid input with no existing users', () => {
    expect(validateUser(valid, create, [])).toEqual({});
    expect(hasErrors({})).toBe(false);
  });

  it('requires a trimmed name of 2 to 80 characters', () => {
    expect(validateUser({ ...valid, name: ' A ' }, create, []).name).toBe(MESSAGES.nameLength);
    expect(validateUser({ ...valid, name: '   ' }, create, []).name).toBe(MESSAGES.nameLength);
    expect(validateUser({ ...valid, name: 'Al' }, create, []).name).toBeUndefined();
    expect(validateUser({ ...valid, name: 'a'.repeat(80) }, create, []).name).toBeUndefined();
    expect(validateUser({ ...valid, name: 'a'.repeat(81) }, create, []).name).toBe(MESSAGES.nameTooLong);
  });

  it('checks the username format after normalization', () => {
    expect(validateUser({ ...valid, username: ' Ana.Lima ' }, create, []).username).toBeUndefined();
    expect(validateUser({ ...valid, username: 'ab' }, create, []).username).toBe(MESSAGES.usernameFormat);
    expect(validateUser({ ...valid, username: 'joão' }, create, []).username).toBe(MESSAGES.usernameFormat);
  });

  it('rejects a username already used, in any case or spacing', () => {
    const errors = validateUser({ ...valid, username: ' MATHEUS ' }, create, existing);
    expect(errors.username).toBe(MESSAGES.usernameTaken);
    expect(hasErrors(errors)).toBe(true);
  });

  it('requires a password on create', () => {
    const errors = validateUser({ ...valid, password: '', confirmPassword: '' }, create, []);
    expect(errors.password).toBe(MESSAGES.passwordRequired);
    expect(errors.confirmPassword).toBeUndefined();
  });

  it('accepts passwords of 6 to 128 characters and never trims them', () => {
    const short = validateUser({ ...valid, password: '12345', confirmPassword: '12345' }, create, []);
    expect(short.password).toBe(MESSAGES.passwordLength);
    const long = 'x'.repeat(129);
    expect(validateUser({ ...valid, password: long, confirmPassword: long }, create, []).password).toBe(
      MESSAGES.passwordLength,
    );
    // "  1234  " is 8 characters: spaces count.
    expect(validateUser({ ...valid, password: '  1234  ', confirmPassword: '  1234  ' }, create, [])).toEqual({});
  });

  it('requires the confirmation to match', () => {
    const errors = validateUser({ ...valid, confirmPassword: 'senha124' }, create, []);
    expect(errors.confirmPassword).toBe(MESSAGES.passwordMismatch);
  });
});

describe('validateUser: edit mode', () => {
  const edit = { kind: 'edit', id: 'u1' } as const;
  const keepPassword = { ...valid, password: '', confirmPassword: '' };

  it('allows a blank password (keeps the current one)', () => {
    expect(validateUser(keepPassword, edit, existing)).toEqual({});
  });

  it('does not treat the user\'s own username as a duplicate', () => {
    expect(validateUser({ ...keepPassword, username: 'MATHEUS' }, edit, existing)).toEqual({});
  });

  it('rejects another user\'s username', () => {
    expect(validateUser({ ...keepPassword, username: 'nicoli.f' }, edit, existing).username).toBe(
      MESSAGES.usernameTaken,
    );
  });

  it('treats a filled confirmation alone as a password change attempt', () => {
    const errors = validateUser({ ...keepPassword, confirmPassword: 'senha123' }, edit, existing);
    expect(errors.confirmPassword).toBe(MESSAGES.passwordMismatch);
    expect(errors.password).toBeUndefined();
  });

  it('validates a new password when one is entered', () => {
    const errors = validateUser({ ...keepPassword, password: '123', confirmPassword: '123' }, edit, existing);
    expect(errors.password).toBe(MESSAGES.passwordLength);
  });
});
