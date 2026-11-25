import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  /** filled: main action. text: secondary. destructive: irreversible action (text + icon + color). */
  variant?: 'filled' | 'text' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
}

/** Full-width, 48 dp minimum, disabled while loading (FR-017, FR-037). */
export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = 'filled',
  loading = false,
  disabled = false,
  accessibilityHint,
}: PrimaryButtonProps) {
  const { colors, type, radius, space, minTouchTarget } = useTheme();
  const inactive = disabled || loading;

  const palette = {
    filled: { bg: colors.primary, fg: colors.onPrimary, ripple: colors.primaryContainer },
    text: { bg: 'transparent', fg: colors.primary, ripple: colors.primaryContainer },
    destructive: { bg: colors.errorContainer, fg: colors.onErrorContainer, ripple: colors.error },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      android_ripple={{ color: palette.ripple }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: minTouchTarget,
          borderRadius: radius.full,
          paddingHorizontal: space.lg,
          backgroundColor: palette.bg,
          opacity: inactive && !loading ? 0.38 : pressed ? 0.88 : 1,
          alignSelf: variant === 'text' ? 'center' : 'stretch',
        },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.fg} />
        ) : icon ? (
          <MaterialCommunityIcons name={icon} size={20} color={palette.fg} />
        ) : null}
        <Text style={[type.label, { color: palette.fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { justifyContent: 'center', overflow: 'hidden' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
});
