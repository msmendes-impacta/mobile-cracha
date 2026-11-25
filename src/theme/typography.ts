import type { TextStyle } from 'react-native';

/**
 * Material type scale in sp (React Native scales fontSize and lineHeight with the
 * system font size). Roboto is the Android system face, so no fontFamily is set.
 */
export const typography = {
  /** The greeting on the signed-in badge ("Olá, Matheus"): a real display size. */
  display: { fontSize: 36, lineHeight: 44, fontWeight: '700', letterSpacing: -0.25 },
  headline: { fontSize: 28, lineHeight: 36, fontWeight: '600' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '500' },
  titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500', letterSpacing: 0.15 },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0.25 },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0.25 },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.1 },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.5 },
  /** Login printed like a badge ID number: tracked caps, tabular digits. */
  idNumber: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;

export type TypographyRole = keyof typeof typography;
