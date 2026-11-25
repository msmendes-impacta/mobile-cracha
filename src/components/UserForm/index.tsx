import { useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FieldErrors, UserField, UserInput } from '../../models/user';
import { useTheme } from '../../theme/useTheme';
import { BadgePreview } from '../Badge/BadgePreview';
import { PrimaryButton } from '../PrimaryButton';
import { TextField } from '../TextField';

const FIELD_ORDER: UserField[] = ['name', 'username', 'password', 'confirmPassword'];

export interface UserFormProps {
  initial: UserInput;
  /** Edit mode shows the "keep current password" hint (FR-012). */
  editing?: boolean;
  /** Persists the input; returns field errors when the data layer refuses it. */
  onSubmit(input: UserInput): Promise<{ ok: boolean; errors?: FieldErrors }>;
  /** Called on every change so the screen can track unsaved edits (FR-012a). */
  onChange?(input: UserInput): void;
  /** Extra actions under Salvar (e.g. Excluir in edit mode). */
  footer?: ReactNode;
  intro?: ReactNode;
}

/**
 * Create/edit form: persistent labels, visible length counters, errors per field on save,
 * focus on the first invalid field, announcements, and passwords cleared after every save attempt.
 */
export function UserForm({ initial, editing = false, onSubmit, onChange, footer, intro }: UserFormProps) {
  const { colors, space } = useTheme();
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState<UserInput>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const usernameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);

  function focusField(field: UserField) {
    const target = { name: nameRef, username: usernameRef, password: passwordRef, confirmPassword: confirmRef }[field];
    target.current?.focus();
  }

  function update(field: UserField, value: string) {
    const next = { ...input, [field]: value };
    setInput(next);
    onChange?.(next);
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSave() {
    if (saving) return; // no duplicate submissions (FR-017)
    setSaving(true);
    const result = await onSubmit(input);
    setSaving(false);

    // Never keep passwords around after an attempt, success or failure (FR-033).
    const cleared = { ...input, password: '', confirmPassword: '' };
    setInput(cleared);
    onChange?.(cleared);

    if (!result.ok && result.errors) {
      setErrors(result.errors);
      const first = FIELD_ORDER.find((field) => result.errors?.[field]);
      if (first) {
        focusField(first);
        AccessibilityInfo.announceForAccessibility(`Corrija os campos destacados. ${result.errors[first]}`);
      }
    }
  }

  const passwordHint = editing ? 'Deixe em branco para manter a senha atual.' : undefined;

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { padding: space.lg, paddingBottom: insets.bottom + space.xl },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <BadgePreview name={input.name} username={input.username} />
      {intro}

      <TextField
        ref={nameRef}
        label="Nome"
        value={input.name}
        onChangeText={(v) => update('name', v)}
        error={errors.name}
        maxLength={80}
        showCounter
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => focusField('username')}
      />
      <TextField
        ref={usernameRef}
        label="Login"
        value={input.username}
        onChangeText={(v) => update('username', v)}
        error={errors.username}
        maxLength={30}
        showCounter
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username-new"
        textContentType="username"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => focusField('password')}
      />
      <TextField
        ref={passwordRef}
        label="Senha"
        value={input.password}
        onChangeText={(v) => update('password', v)}
        error={errors.password}
        hint={passwordHint}
        maxLength={128}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        submitBehavior="submit"
        onSubmitEditing={() => focusField('confirmPassword')}
      />
      <TextField
        ref={confirmRef}
        label="Confirmar senha"
        value={input.confirmPassword}
        onChangeText={(v) => update('confirmPassword', v)}
        error={errors.confirmPassword}
        maxLength={128}
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
        onSubmitEditing={handleSave}
      />

      <PrimaryButton label="Salvar" icon="content-save-outline" onPress={handleSave} loading={saving} />
      {footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
});
