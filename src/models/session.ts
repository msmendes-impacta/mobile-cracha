/** The current sign-in. Holds only what is needed to resume and expire it (FR-029). */
export interface Session {
  userId: string;
  /** Epoch milliseconds of the last touch or screen change. */
  lastActivityAt: number;
}

export function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.userId === 'string' &&
    v.userId.length > 0 &&
    typeof v.lastActivityAt === 'number' &&
    Number.isFinite(v.lastActivityAt)
  );
}
