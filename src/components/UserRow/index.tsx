import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { userRowAccessibilityLabel, type UserRow as UserRowData } from '../../domain/userPresentation';
import { useTheme } from '../../theme/useTheme';
import { MiniBadgeAvatar } from '../MiniBadgeAvatar';

export interface UserRowProps {
  row: UserRowData;
  onPress(id: string): void;
}

/** Row height from design-shape §3. It grows, never clips, with larger fonts. */
const ROW_HEIGHT = 72;

/**
 * One person in the list: mini badge, name (wraps to 2 lines, never truncated), login as an
 * ID number (ellipsis; full value in the accessibility label) and the "você" tag.
 * Not a card: a flat Material list row with ripple, tonal pressed state and a 3:1 focus outline.
 */
function UserRowComponent({ row, onPress }: UserRowProps) {
  const { colors, type, space, radius } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      onPress={() => onPress(row.id)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      accessibilityRole="button"
      accessibilityLabel={userRowAccessibilityLabel(row)}
      accessibilityHint="Toque duas vezes para editar"
      android_ripple={{ color: colors.outlineVariant }}
      style={({ pressed }) => [
        styles.row,
        {
          minHeight: ROW_HEIGHT,
          paddingHorizontal: space.md,
          paddingVertical: space.xs,
          gap: space.md,
          backgroundColor: pressed ? colors.surfaceContainer : colors.surface,
          borderColor: focused ? colors.focus : 'transparent',
        },
        pressed && styles.pressed,
      ]}
    >
      <MiniBadgeAvatar initials={row.initials} />

      <View style={styles.text}>
        <View style={[styles.nameLine, { gap: space.xs }]}>
          <Text numberOfLines={2} style={[type.body, styles.name, { color: colors.onSurface }]}>
            {row.name}
          </Text>
          {row.isSelf ? (
            <View
              style={[
                styles.tag,
                { backgroundColor: colors.primaryContainer, borderRadius: radius.full, paddingHorizontal: space.xs },
              ]}
            >
              <Text style={[type.labelSmall, { color: colors.onPrimaryContainer }]}>você</Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} ellipsizeMode="tail" style={[type.idNumber, { color: colors.onSurfaceVariant }]}>
          @{row.username}
        </Text>
      </View>
    </Pressable>
  );
}

export const UserRow = memo(UserRowComponent);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 2 },
  // Tonal elevation while pressed (design-shape §6).
  pressed: { elevation: 1 },
  text: { flex: 1 },
  nameLine: { flexDirection: 'row', alignItems: 'center' },
  name: { flexShrink: 1 },
  tag: { paddingVertical: 2 },
});
