import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '../../theme/useTheme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface HeaderActionProps {
  icon: IconName;
  /** Required: icon-only buttons must have a spoken name (FR-035). */
  label: string;
  onPress: () => void;
}

/** Icon button for the top app bar, with a 48 dp target. */
export function HeaderAction({ icon, label, onPress }: HeaderActionProps) {
  const { colors, minTouchTarget } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      android_ripple={{ color: colors.outlineVariant, borderless: true, radius: minTouchTarget / 2 }}
      style={[styles.target, { width: minTouchTarget, height: minTouchTarget }]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={colors.onSurface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  target: { alignItems: 'center', justifyContent: 'center' },
});
