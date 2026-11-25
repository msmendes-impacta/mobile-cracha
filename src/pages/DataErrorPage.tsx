import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '../components/PrimaryButton';
import { TypedConfirmDialog } from '../components/TypedConfirmDialog';
import { useSession } from '../contexts/SessionContext';
import { useTheme } from '../theme/useTheme';

const TITLE = 'Não foi possível ler os dados';
const EXPLANATION =
  'Os dados salvos neste aparelho estão danificados, então o app não consegue confirmar quem pode entrar.';
const CONSEQUENCE =
  'Para voltar a usar o Crachá, apague os dados e crie o primeiro usuário de novo. Todos os usuários cadastrados serão perdidos.';
const RESET_FAILED = 'Não foi possível apagar os dados. Tente novamente.';

/**
 * Corrupted storage (FR-031, fail closed): no "Criar primeiro usuário" here. The only way out
 * is the reset, confirmed by typing APAGAR; cancelling keeps this screen.
 */
export function DataErrorPage() {
  const { colors, type, space, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { resetAllData } = useSession();

  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | undefined>();

  // This screen replaces whatever was showing; say why.
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${TITLE}. ${EXPLANATION}`);
  }, []);

  const open = () => {
    setResetError(undefined);
    setConfirming(true);
  };

  const reset = async () => {
    setResetting(true);
    const ok = await resetAllData();
    // On success the provider swaps this screen for first access, so nothing else to do.
    if (!ok) {
      setResetting(false);
      setResetError(RESET_FAILED);
      AccessibilityInfo.announceForAccessibility(RESET_FAILED);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + space.xl,
            paddingBottom: insets.bottom + space.lg,
            paddingLeft: insets.left + space.lg,
            paddingRight: insets.right + space.lg,
          },
        ]}
      >
        <View style={styles.body}>
          <View
            style={[styles.iconWrap, { backgroundColor: colors.errorContainer, borderRadius: radius.full }]}
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden
          >
            <MaterialCommunityIcons name="database-alert-outline" size={40} color={colors.onErrorContainer} />
          </View>
          <Text
            style={[type.headline, styles.center, { color: colors.onBackground, marginTop: space.lg }]}
            accessibilityRole="header"
          >
            {TITLE}
          </Text>
          <Text style={[type.body, styles.center, { color: colors.onSurfaceVariant, marginTop: space.md }]}>
            {EXPLANATION}
          </Text>
          <Text style={[type.body, styles.center, { color: colors.onSurfaceVariant, marginTop: space.sm }]}>
            {CONSEQUENCE}
          </Text>
        </View>

        <View style={{ marginTop: space.xl }}>
          <PrimaryButton
            label="Apagar dados e recomeçar"
            icon="delete-outline"
            variant="destructive"
            onPress={open}
            accessibilityHint="Abre uma confirmação. Pede para digitar APAGAR."
          />
        </View>
      </ScrollView>

      <TypedConfirmDialog
        visible={confirming}
        title="Apagar todos os dados?"
        message="Isso apaga todos os usuários e não pode ser desfeito."
        confirmLabel="Apagar"
        busy={resetting}
        error={resetError}
        onConfirm={reset}
        onCancel={() => setConfirming(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', width: '100%', maxWidth: 480, alignSelf: 'center' },
  body: { alignItems: 'center' },
  iconWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
});
