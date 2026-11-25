import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { SessionWarningDialog } from '../components/SessionWarningDialog';
import { UserFormPage } from '../pages/UserFormPage';
import { UserListPage } from '../pages/UserListPage';
import { useReducedMotion, useTheme } from '../theme/useTheme';
import type { PrivateStackParamList } from './types';

const Stack = createNativeStackNavigator<PrivateStackParamList>();

/**
 * Signed-in screens. `users` is the first route, so both sign-in and the first-user signup
 * land on the list. The inactivity warning sits over every signed-in screen.
 */
export function PrivateStack() {
  const { colors } = useTheme();
  const reducedMotion = useReducedMotion();

  return (
    <>
      <Stack.Navigator
        initialRouteName="users"
        screenOptions={{
          animation: reducedMotion ? 'none' : 'default',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.onSurface,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="users" component={UserListPage} options={{ title: 'Usuários' }} />
        <Stack.Screen
          name="userForm"
          component={UserFormPage}
          options={({ route }) => ({ title: route.params?.id ? 'Editar Usuário' : 'Novo Usuário' })}
        />
      </Stack.Navigator>
      <SessionWarningDialog />
    </>
  );
}
