import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';

export interface MiniBadgeAvatarProps {
  initials: string;
  size?: number;
}

/**
 * A tiny ID badge: rounded square with a navy band strip and the person's initials.
 * Decorative: the row it sits in already announces the name (design-shape §7).
 */
export function MiniBadgeAvatar({ initials, size = 40 }: MiniBadgeAvatarProps) {
  const { colors, type, dark } = useTheme();
  // Navy initials on the white light-theme card; light ink on the dark-theme card.
  const ink = dark ? colors.onSurface : colors.badgeBand;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        styles.card,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: colors.badgeCard,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={[styles.band, { height: size / 6, backgroundColor: colors.badgeBand }]} />
      <View style={styles.center}>
        {/* Fixed size on purpose: the avatar is decorative and must keep its square shape. */}
        <Text
          allowFontScaling={false}
          style={[type.label, { color: ink, fontSize: size * 0.34, lineHeight: size * 0.42, fontWeight: '700' }]}
        >
          {initials}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  band: { width: '100%' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
