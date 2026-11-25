import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { useSnackbar } from '../../contexts/SnackbarContext';
import { useTheme } from '../../theme/useTheme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface HeaderActionProps {
  icon: IconName;
  /** Required: icon-only buttons must have a spoken name (FR-035). */
  label: string;
  onPress: () => void;
}

/**
 * Icon button for the top app bar, with a 48 dp target. A long press shows its name, like the
 * tooltip on Material top app bar icons, so sighted users can learn what an icon does.
 */
export function HeaderAction({ icon, label, onPress }: HeaderActionProps) {
  const { colors, minTouchTarget } = useTheme();
  const { showSnackbar } = useSnackbar();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => showSnackbar(label)}
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
