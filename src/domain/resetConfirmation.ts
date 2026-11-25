/** The word the person must type to erase all app data (spec §Clarifications, FR-031). */
export const RESET_CONFIRMATION_WORD = 'APAGAR';

/** Exact, case-sensitive match with no trimming: anything else keeps the confirm action disabled. */
export function isResetConfirmed(typed: string): boolean {
  return typed === RESET_CONFIRMATION_WORD;
}
