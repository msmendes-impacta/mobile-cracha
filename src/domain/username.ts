/** 3–30 characters from a-z, 0-9, dot, underscore and hyphen (after normalization). */
const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;

/** Logins are compared and stored trimmed and lowercase, so "Matheus " === "matheus". */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Expects an already normalized value; invalid characters are rejected, never stripped. */
export function isValidUsernameFormat(normalized: string): boolean {
  return USERNAME_PATTERN.test(normalized);
}
