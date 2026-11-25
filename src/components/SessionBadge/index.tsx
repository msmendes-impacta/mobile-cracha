import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import {
  firstName,
  initials,
  sessionBadgeAccessibilityLabel,
  sessionValidityLabel,
  userCountLabel,
} from '../../domain/userPresentation';
import { useTheme } from '../../theme/useTheme';
import { MiniBadgeAvatar } from '../MiniBadgeAvatar';

export interface SessionBadgeProps {
  name: string;
  username: string;
  userCount: number;
  /** Minutes until the session expires by inactivity. Fed by the session controller in US5. */
  validMinutesLeft?: number;
}

/** From this font scale on, the badge stacks vertically so nothing clips (FR-038). */
const STACK_FONT_SCALE = 1.5;

/**
 * The signed-in person's own badge at the top of the list (design-shape §3):
 * navy band, initials, a display-size greeting, the login as an ID number, the user count,
 * and the validity line. Screen readers get it as one element.
 */
export function SessionBadge({ name, username, userCount, validMinutesLeft }: SessionBadgeProps) {
  const { colors, type, space, radius, dark } = useTheme();
  const { fontScale } = useWindowDimensions();
  const stacked = fontScale >= STACK_FONT_SCALE;

  return (
    <View
      accessible
      accessibilityLabel={sessionBadgeAccessibilityLabel({ name, username, userCount, validMinutesLeft })}
      style={[
        styles.card,
        {
          backgroundColor: colors.badgeCard,
          borderColor: colors.outlineVariant,
          borderRadius: radius.lg,
          shadowOpacity: dark ? 0 : 0.1,
        },
      ]}
    >
      <View style={[styles.band, { backgroundColor: colors.badgeBand }]} />

      <View
        style={[
          stacked ? styles.bodyStacked : styles.bodyRow,
          { padding: space.md, gap: space.md },
        ]}
      >
        <MiniBadgeAvatar initials={initials(name)} size={64} />

        <View style={[styles.text, stacked && styles.textStacked]}>
          <Text style={[type.display, { color: colors.onSurface }]}>Olá, {firstName(name)}</Text>
          <Text style={[type.idNumber, { color: colors.onSurfaceVariant, marginTop: space.half }]}>
            @{username}
          </Text>
          <Text style={[type.bodySmall, { color: colors.onSurfaceVariant, marginTop: space.xs }]}>
            {userCountLabel(userCount)}
          </Text>
          {validMinutesLeft !== undefined ? (
            <View style={[styles.validity, { marginTop: space.half, gap: space.half }]}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primary} />
              <Text style={[type.labelSmall, { color: colors.primary }]}>
                {sessionValidityLabel(validMinutesLeft)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 2,
    shadowColor: '#0B1B33',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  band: { height: 16 },
  bodyRow: { flexDirection: 'row', alignItems: 'center' },
  bodyStacked: { flexDirection: 'column', alignItems: 'flex-start' },
  text: { flexShrink: 1 },
  textStacked: { alignSelf: 'stretch' },
  validity: { flexDirection: 'row', alignItems: 'center' },
});
