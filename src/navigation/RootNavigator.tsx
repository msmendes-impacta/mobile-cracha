import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { useSession } from '../contexts/SessionContext';
import { StartupScreen } from '../pages/StartupScreen';
import { useTheme } from '../theme/useTheme';
import { PublicStack } from './PublicStack';

/**
 * Interim signed-in screen until the user list arrives in US2 (T040 replaces it with PrivateStack).
 */
function SignedInPlaceholder() {
  const { colors, type, space } = useTheme();
  const { signOut } = useSession();
  return (
    <View style={[styles.center, { backgroundColor: colors.background, padding: space.lg, gap: space.md }]}>
      <Text style={[type.title, { color: colors.onBackground }]} accessibilityRole="header">
        Você entrou.
      </Text>
      <Text style={[type.body, { color: colors.onSurfaceVariant }]}>A listagem de usuários chega na próxima fase.</Text>
      <PrimaryButton label="Sair" icon="logout" onPress={signOut} />
    </View>
  );
}

/**
 * Chooses which screens exist based on the session status (research R2). Screens of the
 * other status are not mounted, so system Back can never reach them (FR-025).
 * The data error screen arrives in T058; until then corrupt data keeps the startup screen.
 */
export function RootNavigator() {
  const { status } = useSession();
  switch (status) {
    case 'signedOut':
      return <PublicStack />;
    case 'signedIn':
      return <SignedInPlaceholder />;
    case 'loading':
    case 'dataError':
    default:
      return <StartupScreen />;
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
