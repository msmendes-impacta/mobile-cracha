/**
 * Color roles for the "Crachá Corporativo" direction (design-shape.md §3).
 * Navy badge band is the brand; everything else follows Material 3 roles.
 * Every text/UI pairing is contrast-checked in __tests__/theme/contrast.test.ts.
 */
export interface ColorRoles {
  /** Screen ground behind badges and lists. */
  background: string;
  onBackground: string;
  /** Rows, fields, dialogs. */
  surface: string;
  onSurface: string;
  onSurfaceVariant: string;
  surfaceContainer: string;
  /** The white PVC badge card. */
  badgeCard: string;
  /** The solid band across the top of every badge. */
  badgeBand: string;
  onBadgeBand: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  /** Field borders and other meaningful component outlines (≥ 3:1). */
  outline: string;
  /** Dividers and decoration only (no contrast requirement). */
  outlineVariant: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  /** Keyboard / accessibility focus ring (≥ 3:1). */
  focus: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  scrim: string;
}

export const lightColors: ColorRoles = {
  background: '#E8EDF3',
  onBackground: '#1A1C1E',
  surface: '#FFFFFF',
  onSurface: '#1A1C1E',
  onSurfaceVariant: '#44474E',
  surfaceContainer: '#F3F5F9',
  badgeCard: '#FFFFFF',
  badgeBand: '#0B3D91',
  onBadgeBand: '#FFFFFF',
  primary: '#0B3D91',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D8E2FF',
  onPrimaryContainer: '#001A41',
  outline: '#6F737C',
  outlineVariant: '#C4C6CF',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  focus: '#0B3D91',
  inverseSurface: '#2F3033',
  inverseOnSurface: '#F1F0F4',
  inversePrimary: '#ADC6FF',
  scrim: 'rgba(0, 0, 0, 0.45)',
};

export const darkColors: ColorRoles = {
  background: '#0F141A',
  onBackground: '#E2E2E6',
  surface: '#1A2027',
  onSurface: '#E2E2E6',
  onSurfaceVariant: '#C4C6D0',
  surfaceContainer: '#222A33',
  badgeCard: '#222A33',
  badgeBand: '#3D6FD1',
  onBadgeBand: '#FFFFFF',
  primary: '#ADC6FF',
  onPrimary: '#002E69',
  primaryContainer: '#1E4A99',
  onPrimaryContainer: '#D8E2FF',
  outline: '#8E9099',
  outlineVariant: '#43474E',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  focus: '#ADC6FF',
  inverseSurface: '#E2E2E6',
  inverseOnSurface: '#2F3033',
  inversePrimary: '#0B3D91',
  scrim: 'rgba(0, 0, 0, 0.6)',
};

/** 8 dp grid (design-shape §3); `half` exists only for optical adjustments. */
export const space = { half: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 } as const;

export const radius = { sm: 8, md: 12, lg: 20, xl: 28, full: 999 } as const;

/** Minimum touch target (Android / WCAG 2.5.8 at our stricter 48 dp). */
export const minTouchTarget = 48;
