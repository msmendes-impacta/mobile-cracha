/** A person with access, as stored on the device. Never sent to screens (see UserView). */
export interface User {
  id: string;
  name: string;
  /** Normalized: trimmed and lowercase. Unique across users. */
  username: string;
  /** Hex SHA-256 of `salt + password`. */
  passwordHash: string;
  /** 16 random bytes as hex (32 chars). Regenerated on every password change. */
  salt: string;
}

/** What screens may see about a user: never the hash or the salt (FR-030). */
export interface UserView {
  id: string;
  name: string;
  username: string;
}

/** Raw values typed into the create/edit form. */
export interface UserInput {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export type UserFormMode = { kind: 'create' } | { kind: 'edit'; id: string };

export type UserField = keyof UserInput;

/** Validation messages (pt-BR) keyed by field. An empty object means valid. */
export type FieldErrors = Partial<Record<UserField, string>>;

export function toUserView(user: User): UserView {
  return { id: user.id, name: user.name, username: user.username };
}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.name === 'string' &&
    typeof v.username === 'string' &&
    typeof v.passwordHash === 'string' &&
    typeof v.salt === 'string'
  );
}

export function isUserArray(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser);
}
