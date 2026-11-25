import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '../components/Badge';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextField } from '../components/TextField';
import { useSession } from '../contexts/SessionContext';
import type { PublicStackParamList } from '../navigation/types';
import { useTheme } from '../theme/useTheme';

type Props = NativeStackScreenProps<PublicStackParamList, 'login'>;

const INVALID_MESSAGE = 'Login ou senha inválidos.';
const EXPIRED_MESSAGE = 'Sua sessão expirou por inatividade. Entre novamente.';
const lockMessage = (seconds: number) =>
  `Muitas tentativas. Tente novamente em ${seconds} ${seconds === 1 ? 'segundo' : 'segundos'}.`;

export function LoginPage({ navigation }: Props) {
  const { colors, type, space } = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, usersExist, expiredNotice } = useSession();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockSeconds, setLockSeconds] = useState(0);

  const usernameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  // Lock countdown: submit stays disabled until it reaches zero (FR-006).
  useEffect(() => {
    if (lockedUntil === null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockSeconds(left);
      if (left === 0) {
        setLockedUntil(null);
        setFormError(null);
      }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  // The login replaced the signed-in screens; say why (FR-024).
  useEffect(() => {
    if (expiredNotice) AccessibilityInfo.announceForAccessibility(EXPIRED_MESSAGE);
  }, [expiredNotice]);

  const locked = lockedUntil !== null && lockSeconds > 0;
  const shownError = locked ? lockMessage(lockSeconds) : formError;

  async function handleSubmit() {
    if (submitting || locked) return;

    const missing = {
      username: username.trim() ? undefined : 'Informe o login.',
      password: password ? undefined : 'Informe a senha.',
    };
    setFieldErrors(missing);
    if (missing.username || missing.password) {
      (missing.username ? usernameRef : passwordRef).current?.focus();
      return;
    }

    setSubmitting(true);
    setFormError(null);
    const result = await signIn(username, password);
    setPassword(''); // never keep the password after an attempt (FR-033)
    setSubmitting(false);

    if (result.status === 'invalid') {
      setFormError(INVALID_MESSAGE);
      AccessibilityInfo.announceForAccessibility(INVALID_MESSAGE);
      passwordRef.current?.focus();
    } else if (result.status === 'locked') {
      setLockedUntil(Date.now() + result.seconds * 1000);
      setLockSeconds(result.seconds);
      AccessibilityInfo.announceForAccessibility(lockMessage(result.seconds));
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl, paddingHorizontal: space.lg },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {expiredNotice ? (
        <View
          style={[
            styles.notice,
            { backgroundColor: colors.inverseSurface, borderRadius: 8, padding: space.md, marginBottom: space.md },
          ]}
        >
          <MaterialCommunityIcons name="timer-sand-complete" size={20} color={colors.inverseOnSurface} />
          <Text style={[type.bodySmall, styles.formErrorText, { color: colors.inverseOnSurface }]}>
            {EXPIRED_MESSAGE}
          </Text>
        </View>
      ) : null}

      <Badge>
        <TextField
          ref={usernameRef}
          label="Login"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            if (fieldErrors.username) setFieldErrors((e) => ({ ...e, username: undefined }));
          }}
          error={fieldErrors.username}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Senha"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
          }}
          error={fieldErrors.password}
          secure
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        {shownError ? (
          // No live region: the lock countdown changes every second. Messages are announced explicitly.
          <View
            style={[
              styles.formError,
              { backgroundColor: colors.errorContainer, borderRadius: 8, padding: space.sm, marginBottom: space.md },
            ]}
          >
            <MaterialCommunityIcons
              name={locked ? 'lock-clock' : 'alert-circle'}
              size={20}
              color={colors.onErrorContainer}
            />
            <Text style={[type.bodySmall, styles.formErrorText, { color: colors.onErrorContainer }]}>
              {shownError}
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          label="Entrar"
          icon="login"
          onPress={handleSubmit}
          loading={submitting}
          disabled={locked}
        />
      </Badge>

      {!usersExist ? (
        <View style={{ marginTop: space.lg }}>
          <Text style={[type.bodySmall, styles.centered, { color: colors.onSurfaceVariant, marginBottom: space.xs }]}>
            Nenhum usuário cadastrado ainda.
          </Text>
          <PrimaryButton
            label="Criar primeiro usuário"
            icon="account-plus-outline"
            variant="text"
            onPress={() => navigation.navigate('firstUser')}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center' },
  formError: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%', maxWidth: 420, alignSelf: 'center' },
  formErrorText: { flex: 1 },
  centered: { textAlign: 'center' },
});
