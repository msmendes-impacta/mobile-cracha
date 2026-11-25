import { DarkTheme, DefaultTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from './src/contexts/SessionContext';
import { SnackbarProvider } from './src/contexts/SnackbarContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useTheme } from './src/theme/useTheme';

function AppShell() {
  const theme = useTheme();
  const { recordActivity } = useSession();
  const base = theme.dark ? DarkTheme : DefaultTheme;
  const navTheme: NavTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.onSurface,
      border: theme.colors.outlineVariant,
      notification: theme.colors.error,
    },
  };

  return (
    // Any touch or screen change counts as activity for the inactivity timeout (FR-021).
    <View style={[styles.root, { backgroundColor: theme.colors.background }]} onTouchStart={recordActivity}>
      <SnackbarProvider>
        <NavigationContainer theme={navTheme} onStateChange={recordActivity}>
          <RootNavigator />
        </NavigationContainer>
      </SnackbarProvider>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <AppShell />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
