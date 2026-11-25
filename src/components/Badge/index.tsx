import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';
import { Barcode } from './Barcode';

export interface BadgeProps {
  children: ReactNode;
}

/**
 * The login badge (design-shape §3): lanyard clip, navy band with the product name,
 * an initials "photo" slot, the form, and a decorative barcode foot.
 * Clip, photo and barcode are decorative and hidden from screen readers.
 */
export function Badge({ children }: BadgeProps) {
  const { colors, type, space, radius, dark } = useTheme();

  return (
    <View style={styles.wrapper}>
      {/* Lanyard clip */}
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={styles.clipArea}>
        <View style={[styles.clip, { backgroundColor: colors.outline }]}>
          <View style={[styles.clipSlot, { backgroundColor: colors.background }]} />
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.badgeCard,
            borderRadius: radius.lg,
            borderColor: colors.outlineVariant,
            shadowOpacity: dark ? 0 : 0.12,
          },
        ]}
      >
        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel="Crachá, controle de acesso"
          style={[styles.band, { backgroundColor: colors.badgeBand, padding: space.lg }]}
        >
          <View style={styles.bandText}>
            <Text style={[type.headline, { color: colors.onBadgeBand }]}>Crachá</Text>
            <Text style={[type.bodySmall, { color: colors.onBadgeBand }]}>Controle de acesso</Text>
          </View>
          <View
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
            style={[styles.photo, { backgroundColor: colors.badgeCard, borderRadius: radius.md }]}
          >
            <MaterialCommunityIcons name="account" size={40} color={dark ? colors.onSurfaceVariant : colors.badgeBand} />
          </View>
        </View>

        <View style={{ padding: space.lg }}>{children}</View>

        <View style={[styles.foot, { paddingBottom: space.lg }]}>
          <Barcode />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  clipArea: { alignItems: 'center', marginBottom: -8, zIndex: 1 },
  clip: { width: 72, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  clipSlot: { width: 36, height: 6, borderRadius: 3 },
  card: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 3,
    shadowColor: '#0B1B33',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  band: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bandText: { flex: 1 },
  photo: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  foot: { alignItems: 'center' },
});
