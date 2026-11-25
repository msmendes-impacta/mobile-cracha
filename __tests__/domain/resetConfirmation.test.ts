import { isResetConfirmed, RESET_CONFIRMATION_WORD } from '../../src/domain/resetConfirmation';

describe('isResetConfirmed (FR-031, typed APAGAR)', () => {
  it('uses the word APAGAR', () => {
    expect(RESET_CONFIRMATION_WORD).toBe('APAGAR');
  });

  it('accepts exactly APAGAR', () => {
    expect(isResetConfirmed('APAGAR')).toBe(true);
  });

  it.each(['', 'A', 'APAGA', 'apagar', 'Apagar', 'APAGAr', ' APAGAR', 'APAGAR ', 'APAGARR', 'APÁGAR'])(
    'rejects %j (case-sensitive, no trimming)',
    (typed) => {
      expect(isResetConfirmed(typed)).toBe(false);
    },
  );
});
