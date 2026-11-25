import { DarkTheme, DefaultTheme, NavigationContainer, type Theme as NavTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider } from './src/contexts/SessionContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useTheme } from './src/theme/useTheme';

function AppShell() {
  const theme = useTheme();
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
    // Root view: touch activity is wired to the session controller in US5 (T054).
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <NavigationContainer theme={navTheme}>
        <RootNavigator />
      </NavigationContainer>
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
