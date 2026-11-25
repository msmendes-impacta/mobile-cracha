import type { FieldErrors, UserFormMode, UserInput } from '../models/user';
import { isValidUsernameFormat, normalizeUsername } from './username';

/** User-facing validation messages (pt-BR), data-model.md §User. */
export const MESSAGES = {
  nameLength: 'Informe o nome (mínimo 2 caracteres).',
  nameTooLong: 'O nome pode ter no máximo 80 caracteres.',
  usernameFormat: 'Login deve ter 3 a 30 caracteres: letras, números, ponto, _ ou -.',
  usernameTaken: 'Este login já está em uso.',
  passwordRequired: 'Informe a senha.',
  passwordLength: 'A senha deve ter entre 6 e 128 caracteres.',
  passwordMismatch: 'As senhas não conferem.',
} as const;

const NAME_MIN = 2;
const NAME_MAX = 80;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

type ExistingUser = { id: string; username: string };

/**
 * Pure validation shared by the form and the repository (FR-014, FR-016).
 * Edit mode: a blank password keeps the current one; the user's own username is not a duplicate.
 */
export function validateUser(input: UserInput, mode: UserFormMode, existing: ExistingUser[]): FieldErrors {
  const errors: FieldErrors = {};

  const name = input.name.trim();
  if (name.length < NAME_MIN) errors.name = MESSAGES.nameLength;
  else if (name.length > NAME_MAX) errors.name = MESSAGES.nameTooLong;

  const username = normalizeUsername(input.username);
  if (!isValidUsernameFormat(username)) {
    errors.username = MESSAGES.usernameFormat;
  } else if (existing.some((u) => u.username === username && (mode.kind === 'create' || u.id !== mode.id))) {
    errors.username = MESSAGES.usernameTaken;
  }

  // Passwords are never trimmed: spaces are part of the password.
  const { password, confirmPassword } = input;
  const changingPassword = password.length > 0 || confirmPassword.length > 0;
  if (password.length === 0) {
    if (mode.kind === 'create') errors.password = MESSAGES.passwordRequired;
  } else if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    errors.password = MESSAGES.passwordLength;
  }
  if (changingPassword && password.length > 0 && confirmPassword !== password) {
    errors.confirmPassword = MESSAGES.passwordMismatch;
  } else if (mode.kind === 'edit' && password.length === 0 && confirmPassword.length > 0) {
    errors.confirmPassword = MESSAGES.passwordMismatch;
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
