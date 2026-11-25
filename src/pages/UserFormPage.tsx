import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { useDiscardPrompt } from '../components/DiscardPrompt';
import { PrimaryButton } from '../components/PrimaryButton';
import { UserForm } from '../components/UserForm';
import { useSession } from '../contexts/SessionContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import { isFormDirty } from '../domain/formDirty';
import type { UserInput } from '../models/user';
import type { PrivateStackParamList } from '../navigation/types';
import { useTheme } from '../theme/useTheme';

const EMPTY: UserInput = { name: '', username: '', password: '', confirmPassword: '' };

const USER_GONE = 'Este usuário não existe mais.';

/**
 * First access (public `firstUser` route, FR-001): creates the first user and signs them in.
 */
export function FirstUserPage() {
  const { colors, type, space } = useTheme();
  const { createFirstUser } = useSession();
  const [current, setCurrent] = useState<UserInput>(EMPTY);
  const discardPrompt = useDiscardPrompt(isFormDirty(EMPTY, current));

  return (
    <>
      <UserForm
        initial={EMPTY}
        onChange={setCurrent}
        onSubmit={createFirstUser}
        intro={
          <Text style={[type.body, { color: colors.onSurfaceVariant, marginBottom: space.lg }]}>
            Crie o primeiro usuário para começar a usar o Crachá. Depois, só quem estiver conectado poderá
            cadastrar novas pessoas.
          </Text>
        }
      />
      {discardPrompt}
    </>
  );
}

type UserFormProps = NativeStackScreenProps<PrivateStackParamList, 'userForm'>;

/**
 * Signed-in create and edit (`userForm`, FR-012): one screen, prefilled on edit, where a blank
 * password keeps the current one. Leaving with unsaved changes asks first (FR-012a).
 * Editing someone else offers "Excluir" behind a confirmation naming them (FR-018); the
 * signed-in user's own record never shows it.
 */
export function UserFormPage({ navigation, route }: UserFormProps) {
  const { colors, space } = useTheme();
  const { userId, createUser, getUser, updateUser, deleteUser } = useSession();
  const { showSnackbar } = useSnackbar();
  const editingId = route.params?.id;

  /** What the form opened with; null while the user to edit is loading. */
  const [initial, setInitial] = useState<UserInput | null>(editingId ? null : EMPTY);
  const [current, setCurrent] = useState<UserInput>(EMPTY);
  /** Set once the screen may close without asking (saved, or the user is gone). */
  const [leaveMessage, setLeaveMessage] = useState<string | null>(null);
  /** The stored name, so the confirmation names the user, not unsaved edits. */
  const [storedName, setStoredName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!editingId) return;
    let active = true;
    getUser(editingId).then((user) => {
      if (!active) return;
      if (!user) {
        setLeaveMessage(USER_GONE);
        return;
      }
      const loaded = { name: user.name, username: user.username, password: '', confirmPassword: '' };
      setStoredName(user.name);
      setInitial(loaded);
      setCurrent(loaded);
    });
    return () => {
      active = false;
    };
  }, [editingId, getUser]);

  const dirty = leaveMessage === null && initial !== null && isFormDirty(initial, current);
  const discardPrompt = useDiscardPrompt(dirty);

  // Leave only after the render that turned the discard guard off.
  useEffect(() => {
    if (leaveMessage === null) return;
    showSnackbar(leaveMessage);
    navigation.goBack();
  }, [leaveMessage, navigation, showSnackbar]);

  async function save(input: UserInput) {
    const result = editingId ? await updateUser(editingId, input) : await createUser(input);
    if (result.ok) setLeaveMessage('Usuário salvo');
    else if ('notFound' in result) setLeaveMessage(USER_GONE);
    return result.ok ? result : { ok: false, errors: 'errors' in result ? result.errors : {} };
  }

  async function confirmDelete() {
    if (!editingId || deleting) return; // no duplicate deletes (FR-017)
    setDeleting(true);
    const deleted = await deleteUser(editingId);
    setDeleting(false);
    setConfirmingDelete(false);
    if (deleted) setLeaveMessage('Usuário excluído');
  }

  const canDelete = Boolean(editingId) && editingId !== userId;

  if (initial === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" accessibilityLabel="Carregando usuário" />
      </View>
    );
  }

  return (
    <>
      <UserForm
        initial={initial}
        editing={Boolean(editingId)}
        onChange={setCurrent}
        onSubmit={save}
        footer={
          canDelete ? (
            <View style={{ marginTop: space.md }}>
              <PrimaryButton
                label="Excluir"
                icon="delete-outline"
                variant="destructive"
                accessibilityHint={`Remove o acesso de ${storedName}`}
                onPress={() => setConfirmingDelete(true)}
                loading={deleting}
              />
            </View>
          ) : null
        }
      />
      <ConfirmDialog
        visible={confirmingDelete}
        title={`Excluir ${storedName}?`}
        message="Essa pessoa perde o acesso ao Crachá. Não é possível desfazer."
        confirmLabel="Excluir"
        destructive
        confirmDisabled={deleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          if (!deleting) setConfirmingDelete(false);
        }}
      />
      {discardPrompt}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
