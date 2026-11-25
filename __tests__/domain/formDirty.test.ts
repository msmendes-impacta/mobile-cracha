import { isFormDirty } from '../../src/domain/formDirty';
import type { UserInput } from '../../src/models/user';

const initial: UserInput = { name: 'Ana Souza', username: 'ana', password: '', confirmPassword: '' };

describe('isFormDirty (FR-012a)', () => {
  it('is false when nothing changed', () => {
    expect(isFormDirty(initial, { ...initial })).toBe(false);
  });

  it.each<keyof UserInput>(['name', 'username', 'password', 'confirmPassword'])('is true when %s changed', (field) => {
    expect(isFormDirty(initial, { ...initial, [field]: `${initial[field]}x` })).toBe(true);
  });

  it('is false again after a change is reverted', () => {
    const changed = { ...initial, name: 'Ana S.' };
    expect(isFormDirty(initial, changed)).toBe(true);
    expect(isFormDirty(initial, { ...changed, name: 'Ana Souza' })).toBe(false);
  });

  it('counts a whitespace-only change in the name as a change', () => {
    expect(isFormDirty(initial, { ...initial, name: 'Ana Souza ' })).toBe(true);
  });
});
