import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { UserForm } from '../components/UserForm';
import { useSession } from '../contexts/SessionContext';
import type { UserInput } from '../models/user';
import type { PrivateStackParamList } from '../navigation/types';
import { useTheme } from '../theme/useTheme';

const EMPTY: UserInput = { name: '', username: '', password: '', confirmPassword: '' };

/**
 * First access (public `firstUser` route, FR-001): creates the first user and signs them in.
 */
export function FirstUserPage() {
  const { colors, type, space } = useTheme();
  const { createFirstUser } = useSession();

  return (
    <UserForm
      initial={EMPTY}
      onSubmit={createFirstUser}
      intro={
        <Text style={[type.body, { color: colors.onSurfaceVariant, marginBottom: space.lg }]}>
          Crie o primeiro usuário para começar a usar o Crachá. Depois, só quem estiver conectado poderá
          cadastrar novas pessoas.
        </Text>
      }
    />
  );
}

type UserFormProps = NativeStackScreenProps<PrivateStackParamList, 'userForm'>;

/**
 * Signed-in create/edit route (`userForm`). Create works now; edit mode, the saved snackbar
 * and the discard prompt arrive in US3 (T044, T045).
 */
export function UserFormPage({ navigation, route }: UserFormProps) {
  const { colors, type, space } = useTheme();
  const { createUser } = useSession();
  const editingId = route.params?.id;

  if (editingId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: space.lg }]}>
        <Text style={[type.body, styles.centerText, { color: colors.onSurfaceVariant }]}>
          A edição de usuários chega na próxima fase.
        </Text>
      </View>
    );
  }

  return (
    <UserForm
      initial={EMPTY}
      onSubmit={async (input) => {
        const result = await createUser(input);
        if (result.ok) navigation.goBack();
        return result;
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerText: { textAlign: 'center' },
});
