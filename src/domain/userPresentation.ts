/** Lowercase, accent-free key so "Álvaro" sorts next to "alvaro" (FR-009, research R11). */
export function compareKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Alphabetical by name ignoring case and accents; ties broken by id. Returns a new array. */
export function sortUsersByName<T extends { id: string; name: string }>(users: T[]): T[] {
  return [...users].sort((a, b) => {
    const ka = compareKey(a.name);
    const kb = compareKey(b.name);
    if (ka !== kb) return ka < kb ? -1 : 1;
    if (a.id === b.id) return 0;
    return a.id < b.id ? -1 : 1;
  });
}

function words(name: string): string[] {
  return name.trim().split(/\s+/).filter(Boolean);
}

/** "Matheus Mendes" → "Matheus" (greeting, FR-008). */
export function firstName(name: string): string {
  return words(name)[0] ?? '';
}

/** First letters of the first and last words: "Matheus Mendes" → "MM". */
export function initials(name: string): string {
  const parts = words(name);
  const first = parts[0];
  if (!first) return '';
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
  return (first.charAt(0) + (last?.charAt(0) ?? '')).toUpperCase();
}

export function userCountLabel(count: number): string {
  return count === 1 ? '1 usuário cadastrado' : `${count} usuários cadastrados`;
}

/** One entry of the user list, ready to render (FR-009). */
export interface UserRow {
  id: string;
  name: string;
  username: string;
  initials: string;
  /** The signed-in person, marked "você". */
  isSelf: boolean;
}

/** Sorted rows with initials and the self marker. */
export function buildUserRows(
  users: readonly { id: string; name: string; username: string }[],
  currentUserId: string | undefined,
): UserRow[] {
  return sortUsersByName([...users]).map(({ id, name, username }) => ({
    id,
    name,
    username,
    initials: initials(name),
    isSelf: id === currentUserId,
  }));
}

/** A row is a single screen-reader element: "Matheus Mendes (você), login matheus". */
export function userRowAccessibilityLabel(row: Pick<UserRow, 'name' | 'username' | 'isSelf'>): string {
  return `${row.name}${row.isSelf ? ' (você)' : ''}, login ${row.username}`;
}

/** The validity line on the signed-in badge: "Sessão válida por 4 min". */
export function sessionValidityLabel(minutesLeft: number): string {
  return minutesLeft >= 1 ? `Sessão válida por ${minutesLeft} min` : 'Sessão válida por menos de 1 min';
}

function spokenMinutes(minutesLeft: number): string {
  if (minutesLeft < 1) return 'menos de 1 minuto';
  return minutesLeft === 1 ? '1 minuto' : `${minutesLeft} minutos`;
}

/** The SessionBadge reads as one element (design-shape §7). */
export function sessionBadgeAccessibilityLabel(badge: {
  name: string;
  username: string;
  userCount: number;
  validMinutesLeft?: number;
}): string {
  const parts = [badge.name, `login ${badge.username}`, userCountLabel(badge.userCount)];
  if (badge.validMinutesLeft !== undefined) parts.push(`sessão válida por ${spokenMinutes(badge.validMinutesLeft)}`);
  return parts.join(', ');
}
