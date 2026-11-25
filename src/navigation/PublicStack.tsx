import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useSession } from '../contexts/SessionContext';
import { LoginPage } from '../pages/LoginPage';
import { FirstUserPage } from '../pages/UserFormPage';
import { useReducedMotion, useTheme } from '../theme/useTheme';
import type { PublicStackParamList } from './types';

const Stack = createNativeStackNavigator<PublicStackParamList>();

/** Signed-out screens. `firstUser` is mounted only while no user exists (FR-001). */
export function PublicStack() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();
  const { usersExist } = useSession();

  return (
    <Stack.Navigator
      screenOptions={{
        animation: reducedMotion ? 'none' : 'default',
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.onSurface,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="login" component={LoginPage} options={{ headerShown: false, title: 'Acesso' }} />
      {!usersExist ? (
        <Stack.Screen name="firstUser" component={FirstUserPage} options={{ title: 'Novo Usuário' }} />
      ) : null}
    </Stack.Navigator>
  );
}
