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
