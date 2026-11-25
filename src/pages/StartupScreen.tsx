import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/useTheme';

/** Shown while stored data and the session are resolved. Refined in T032. */
export function StartupScreen() {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.root, { backgroundColor: colors.background }]}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando"
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
