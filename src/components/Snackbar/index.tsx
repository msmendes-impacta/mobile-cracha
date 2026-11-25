import { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/useTheme';

export interface SnackbarProps {
  message: string | null;
  onDismiss: () => void;
  /** Auto-hide delay in ms. */
  duration?: number;
}

/** Transient feedback ("Usuário salvo"), announced to screen readers (FR-039). */
export function Snackbar({ message, onDismiss, duration = 4000 }: SnackbarProps) {
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    AccessibilityInfo.announceForAccessibility(message);
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onDismiss]);

  if (!message) return null;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.bar,
        {
          bottom: insets.bottom + space.md,
          left: space.md,
          right: space.md,
          backgroundColor: colors.inverseSurface,
          borderRadius: radius.sm,
          paddingHorizontal: space.md,
          paddingVertical: space.sm,
        },
      ]}
    >
      <Text style={[type.bodySmall, { color: colors.inverseOnSurface }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    minHeight: 48,
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
