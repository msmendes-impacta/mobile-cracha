import { StyleSheet, Text, View } from 'react-native';

import { initials } from '../../domain/userPresentation';
import { normalizeUsername } from '../../domain/username';
import { useTheme } from '../../theme/useTheme';
import { MiniBadgeAvatar } from '../MiniBadgeAvatar';

export interface BadgePreviewProps {
  name: string;
  username: string;
}

/**
 * Live preview of the badge being created or edited (design-shape §3).
 * Decorative: the form fields already carry this information, so TalkBack skips it.
 */
export function BadgePreview({ name, username }: BadgePreviewProps) {
  const { colors, type, space, radius } = useTheme();
  const displayName = name.trim() || 'Nome do usuário';
  const login = normalizeUsername(username);
  const displayLogin = login ? `@${login}` : '@login';

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        styles.card,
        {
          backgroundColor: colors.badgeCard,
          borderColor: colors.outlineVariant,
          borderRadius: radius.md,
          marginBottom: space.lg,
        },
      ]}
    >
      <View style={[styles.band, { backgroundColor: colors.badgeBand }]} />
      <View style={[styles.body, { padding: space.md, gap: space.md }]}>
        <MiniBadgeAvatar initials={initials(name) || '?'} size={56} />
        <View style={styles.text}>
          <Text style={[type.titleMedium, { color: colors.onSurface }]} numberOfLines={2}>
            {displayName}
          </Text>
          <Text style={[type.idNumber, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
            {displayLogin}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  band: { height: 12 },
  body: { flexDirection: 'row', alignItems: 'center' },
  text: { flex: 1 },
});
