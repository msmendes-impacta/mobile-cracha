import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/useTheme';

/** Shown while stored data and the session are resolved: the badge clip outline and a progress indicator. */
export function StartupScreen() {
  const { colors, space } = useTheme();
  return (
    <View
      style={[styles.root, { backgroundColor: colors.background, gap: space.lg }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
    >
      <View style={[styles.clip, { borderColor: colors.outline }]}>
        <View style={[styles.slot, { backgroundColor: colors.outline }]} />
      </View>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  clip: { width: 72, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  slot: { width: 36, height: 6, borderRadius: 3 },
});
