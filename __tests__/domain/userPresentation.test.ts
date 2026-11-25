import { compareKey, firstName, initials, sortUsersByName, userCountLabel } from '../../src/domain/userPresentation';

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
