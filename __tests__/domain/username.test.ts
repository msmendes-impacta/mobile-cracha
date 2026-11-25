import { isValidUsernameFormat, normalizeUsername } from '../../src/domain/username';

describe('normalizeUsername', () => {
  it('trims and lowercases', () => {
    expect(normalizeUsername(' MATHEUS ')).toBe('matheus');
    expect(normalizeUsername('Nicoli.F')).toBe('nicoli.f');
  });

  it('does not strip invalid characters (they are rejected by the format check instead)', () => {
    expect(normalizeUsername('João')).toBe('joão');
  });
});

describe('isValidUsernameFormat', () => {
  it.each(['abc', 'matheus', 'nicoli.f', 'user_01', 'a-b', 'a'.repeat(30)])('accepts %s', (value) => {
    expect(isValidUsernameFormat(value)).toBe(true);
  });

  it.each([
    ['too short', 'ab'],
    ['too long', 'a'.repeat(31)],
    ['accent', 'joão'],
    ['inner space', 'ana lima'],
    ['uppercase (not normalized)', 'Ana'],
    ['symbol', 'ana@x'],
    ['empty', ''],
  ])('rejects %s', (_label, value) => {
    expect(isValidUsernameFormat(value)).toBe(false);
  });
});
