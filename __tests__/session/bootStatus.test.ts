import type { User } from '../../src/models/user';
import { resolveBootStatus } from '../../src/session/bootStatus';

const user: User = { id: 'u1', name: 'Ana Lima', username: 'ana', passwordHash: 'h', salt: 's' };
const session = { userId: 'u1', lastActivityAt: 1 };

describe('resolveBootStatus', () => {
  it('routes corrupt user data to the data error screen regardless of the session', () => {
    expect(resolveBootStatus({ status: 'corrupt' }, session)).toEqual({
      status: 'dataError',
      usersExist: true,
      clearSession: false,
    });
  });

  it('offers first access only when users were never stored, clearing any stray session', () => {
    expect(resolveBootStatus({ status: 'absent' }, null)).toEqual({
      status: 'signedOut',
      usersExist: false,
      clearSession: false,
    });
    expect(resolveBootStatus({ status: 'absent' }, session)).toEqual({
      status: 'signedOut',
      usersExist: false,
      clearSession: true,
    });
  });

  it('is signed out when users exist and there is no session', () => {
    expect(resolveBootStatus({ status: 'ok', value: [user] }, null)).toEqual({
      status: 'signedOut',
      usersExist: true,
      clearSession: false,
    });
  });

  it('resumes the session when its user still exists', () => {
    expect(resolveBootStatus({ status: 'ok', value: [user] }, session)).toEqual({
      status: 'signedIn',
      usersExist: true,
      userId: 'u1',
      clearSession: false,
    });
  });

  it('ends the session when its user no longer exists', () => {
    expect(resolveBootStatus({ status: 'ok', value: [user] }, { userId: 'gone', lastActivityAt: 1 })).toEqual({
      status: 'signedOut',
      usersExist: true,
      clearSession: true,
    });
  });
});
