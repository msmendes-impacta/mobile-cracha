import { useEffect, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import { darkColors, lightColors, minTouchTarget, radius, space, type ColorRoles } from './tokens';
import { typography } from './typography';

export interface Theme {
  dark: boolean;
  colors: ColorRoles;
  type: typeof typography;
  space: typeof space;
  radius: typeof radius;
  minTouchTarget: number;
}

/** Follows the device light/dark setting and updates when it changes (FR-034). */
export function useTheme(): Theme {
  const dark = useColorScheme() === 'dark';
  return {
    dark,
    colors: dark ? darkColors : lightColors,
    type: typography,
    space,
    radius,
    minTouchTarget,
  };
}

/** True when the device asks to remove animations (FR-040). */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}
