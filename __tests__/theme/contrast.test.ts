import { darkColors, lightColors, type ColorRoles } from '../../src/theme/tokens';

/** WCAG 2.x relative luminance contrast ratio for opaque #RRGGBB colors. */
function contrast(fg: string, bg: string): number {
  const lum = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    }) as [number, number, number];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

type Pair = [keyof ColorRoles, keyof ColorRoles];

/** Text pairs need 4.5:1 (FR-036). */
const textPairs: Pair[] = [
  ['onBackground', 'background'],
  ['onSurface', 'surface'],
  ['onSurfaceVariant', 'surface'],
  ['onSurfaceVariant', 'background'],
  ['onSurface', 'surfaceContainer'],
  ['onSurfaceVariant', 'surfaceContainer'],
  ['onSurface', 'badgeCard'],
  ['onSurfaceVariant', 'badgeCard'],
  ['onBadgeBand', 'badgeBand'],
  ['onPrimary', 'primary'],
  ['primary', 'surface'],
  ['primary', 'badgeCard'],
  ['primary', 'background'],
  ['onPrimaryContainer', 'primaryContainer'],
  ['error', 'surface'],
  ['error', 'background'],
  ['onError', 'error'],
  ['onErrorContainer', 'errorContainer'],
  ['inverseOnSurface', 'inverseSurface'],
  ['inversePrimary', 'inverseSurface'],
];

/** UI component pairs (borders, focus, icons) need 3:1 (FR-036). */
const uiPairs: Pair[] = [
  ['outline', 'surface'],
  ['outline', 'background'],
  ['outline', 'badgeCard'],
  ['focus', 'surface'],
  ['focus', 'background'],
  ['badgeBand', 'badgeCard'],
  ['badgeBand', 'background'],
];

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
])('%s theme contrast', (_name, colors) => {
  it.each(textPairs)('text %s on %s is at least 4.5:1', (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
  });

  it.each(uiPairs)('UI %s on %s is at least 3:1', (fg, bg) => {
    expect(contrast(colors[fg], colors[bg])).toBeGreaterThanOrEqual(3);
  });
});
