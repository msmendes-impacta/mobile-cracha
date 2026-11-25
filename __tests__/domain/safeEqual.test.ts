import { safeEqual } from '../../src/domain/safeEqual';

describe('safeEqual', () => {
  it('returns true for identical strings', () => {
    expect(safeEqual('a1b2c3', 'a1b2c3')).toBe(true);
  });

  it('returns true for two empty strings', () => {
    expect(safeEqual('', '')).toBe(true);
  });

  it('returns false when the first character differs', () => {
    expect(safeEqual('x1b2c3', 'a1b2c3')).toBe(false);
  });

  it('returns false when the last character differs', () => {
    expect(safeEqual('a1b2c3', 'a1b2c4')).toBe(false);
  });

  it('returns false for different lengths, including a prefix', () => {
    expect(safeEqual('a1b2', 'a1b2c3')).toBe(false);
    expect(safeEqual('a1b2c3', '')).toBe(false);
  });
});
