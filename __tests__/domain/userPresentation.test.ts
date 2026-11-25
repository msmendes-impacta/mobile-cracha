import {
  buildUserRows,
  compareKey,
  firstName,
  initials,
  sessionBadgeAccessibilityLabel,
  sessionValidityLabel,
  sortUsersByName,
  userCountLabel,
  userRowAccessibilityLabel,
} from '../../src/domain/userPresentation';

describe('sortUsersByName', () => {
  it('sorts ignoring case and accents, without mutating the input', () => {
    const users = [
      { id: '3', name: 'bruno' },
      { id: '1', name: 'Álvaro' },
      { id: '2', name: 'alvaro' },
      { id: '4', name: 'Ana' },
    ];
    const sorted = sortUsersByName(users);
    expect(sorted.map((u) => u.id)).toEqual(['1', '2', '4', '3']);
    expect(users[0]!.id).toBe('3');
  });

  it('breaks ties by id for a stable order', () => {
    const sorted = sortUsersByName([
      { id: 'b', name: 'Ana' },
      { id: 'a', name: 'ANA' },
      { id: 'a', name: 'ana' },
    ]);
    expect(sorted.map((u) => u.id)).toEqual(['a', 'a', 'b']);
  });

  it('builds the compare key without accents or case', () => {
    expect(compareKey('  Álvaro Ção ')).toBe('alvaro cao');
  });
});

describe('firstName', () => {
  it('returns the first word of the trimmed name', () => {
    expect(firstName('  Matheus   Mendes ')).toBe('Matheus');
    expect(firstName('Heitor')).toBe('Heitor');
    expect(firstName('   ')).toBe('');
  });
});

describe('initials', () => {
  it('uses the first letters of the first and last words', () => {
    expect(initials('Matheus Mendes')).toBe('MM');
    expect(initials('nicoli ferreira da silva')).toBe('NS');
    expect(initials('Heitor')).toBe('H');
    expect(initials('  ')).toBe('');
  });
});

describe('userCountLabel', () => {
  it('uses singular and plural correctly', () => {
    expect(userCountLabel(0)).toBe('0 usuários cadastrados');
    expect(userCountLabel(1)).toBe('1 usuário cadastrado');
    expect(userCountLabel(4)).toBe('4 usuários cadastrados');
  });
});

describe('buildUserRows', () => {
  const users = [
    { id: 'u2', name: 'Bruno Lima', username: 'bruno' },
    { id: 'u1', name: 'Álvaro Dias', username: 'alvaro' },
    { id: 'u3', name: 'ana', username: 'ana.s' },
  ];

  it('sorts by name and marks only the signed-in user as self', () => {
    const rows = buildUserRows(users, 'u2');
    expect(rows.map((r) => r.id)).toEqual(['u1', 'u3', 'u2']);
    expect(rows.map((r) => r.isSelf)).toEqual([false, false, true]);
  });

  it('adds initials and keeps name and username', () => {
    const [first] = buildUserRows(users, undefined);
    expect(first).toEqual({ id: 'u1', name: 'Álvaro Dias', username: 'alvaro', initials: 'ÁD', isSelf: false });
  });

  it('returns an empty list for no users', () => {
    expect(buildUserRows([], 'u1')).toEqual([]);
  });
});

describe('userRowAccessibilityLabel', () => {
  it('reads name and login', () => {
    expect(userRowAccessibilityLabel({ name: 'Ana Souza', username: 'ana', isSelf: false })).toBe(
      'Ana Souza, login ana',
    );
  });

  it('adds "(você)" for the signed-in user', () => {
    expect(userRowAccessibilityLabel({ name: 'Matheus Mendes', username: 'matheus', isSelf: true })).toBe(
      'Matheus Mendes (você), login matheus',
    );
  });
});

describe('sessionValidityLabel', () => {
  it('shows the minutes left', () => {
    expect(sessionValidityLabel(4)).toBe('Sessão válida por 4 min');
    expect(sessionValidityLabel(1)).toBe('Sessão válida por 1 min');
  });

  it('never shows zero or negative minutes', () => {
    expect(sessionValidityLabel(0)).toBe('Sessão válida por menos de 1 min');
    expect(sessionValidityLabel(-3)).toBe('Sessão válida por menos de 1 min');
  });
});

describe('sessionBadgeAccessibilityLabel', () => {
  const base = { name: 'Matheus Mendes', username: 'matheus', userCount: 4 };

  it('reads name, login, count and validity as one sentence', () => {
    expect(sessionBadgeAccessibilityLabel({ ...base, validMinutesLeft: 4 })).toBe(
      'Matheus Mendes, login matheus, 4 usuários cadastrados, sessão válida por 4 minutos',
    );
  });

  it('uses the singular for one minute and one user', () => {
    expect(sessionBadgeAccessibilityLabel({ ...base, userCount: 1, validMinutesLeft: 1 })).toBe(
      'Matheus Mendes, login matheus, 1 usuário cadastrado, sessão válida por 1 minuto',
    );
  });

  it('says "menos de 1 minuto" when under a minute', () => {
    expect(sessionBadgeAccessibilityLabel({ ...base, validMinutesLeft: 0 })).toBe(
      'Matheus Mendes, login matheus, 4 usuários cadastrados, sessão válida por menos de 1 minuto',
    );
  });

  it('omits the validity part when it is not known yet', () => {
    expect(sessionBadgeAccessibilityLabel(base)).toBe('Matheus Mendes, login matheus, 4 usuários cadastrados');
  });
});
