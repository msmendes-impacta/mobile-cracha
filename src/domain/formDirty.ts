import type { UserField, UserInput } from '../models/user';

const FIELDS: UserField[] = ['name', 'username', 'password', 'confirmPassword'];

/**
 * True when any field differs from what the form opened with (FR-012a). Exact comparison:
 * a whitespace-only change counts, and reverting a change makes the form clean again.
 */
export function isFormDirty(initial: UserInput, current: UserInput): boolean {
  return FIELDS.some((field) => initial[field] !== current[field]);
}
