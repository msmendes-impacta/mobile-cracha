import { Text } from 'react-native';

import { UserForm } from '../components/UserForm';
import { useSession } from '../contexts/SessionContext';
import type { UserInput } from '../models/user';
import { useTheme } from '../theme/useTheme';

const EMPTY: UserInput = { name: '', username: '', password: '', confirmPassword: '' };

/**
 * First access (public `firstUser` route, FR-001): creates the first user and signs them in.
 * The signed-in create/edit route is added in US3 (T045).
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
