import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderAction } from '../components/HeaderAction';
import { SessionBadge } from '../components/SessionBadge';
import { UserRow } from '../components/UserRow';
import { useSession } from '../contexts/SessionContext';
import { buildUserRows, type UserRow as UserRowData } from '../domain/userPresentation';
import type { UserView } from '../models/user';
import type { PrivateStackParamList } from '../navigation/types';
import { useTheme } from '../theme/useTheme';

type Props = NativeStackScreenProps<PrivateStackParamList, 'users'>;

/**
 * Home screen after sign-in (US2): the signed-in badge, then everyone with access sorted by
 * name. "Adicionar usuário" and "Sair" live in the header, as in the assignment's reference.
 */
export function UserListPage({ navigation }: Props) {
  const { colors, type, space } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId, listUsers, signOut } = useSession();
  const [users, setUsers] = useState<UserView[] | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.actions}>
          <HeaderAction icon="account-plus" label="Adicionar usuário" onPress={() => navigation.navigate('userForm')} />
          <HeaderAction icon="logout" label="Sair" onPress={signOut} />
        </View>
      ),
    });
  }, [navigation, signOut]);

  // Reload every time the screen gains focus, so changes show up without a manual refresh (FR-010).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      listUsers().then((list) => {
        if (active) setUsers(list);
      });
      return () => {
        active = false;
      };
    }, [listUsers]),
  );

  const rows = useMemo(() => (users ? buildUserRows(users, userId) : []), [users, userId]);
  const me = rows.find((row) => row.isSelf);

  const openUser = useCallback((id: string) => navigation.navigate('userForm', { id }), [navigation]);
  const renderItem = useCallback(({ item }: { item: UserRowData }) => <UserRow row={item} onPress={openUser} />, [openUser]);

  if (users === null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" accessibilityLabel="Carregando usuários" />
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: insets.bottom + space.lg }}
      data={rows}
      keyExtractor={(row) => row.id}
      renderItem={renderItem}
      ItemSeparatorComponent={RowDivider}
      ListHeaderComponent={
        <View style={{ padding: space.md, paddingBottom: space.lg }}>
          {me ? <SessionBadge name={me.name} username={me.username} userCount={rows.length} /> : null}
        </View>
      }
      ListFooterComponent={
        rows.length === 1 ? (
          <View style={[styles.hint, { padding: space.lg, gap: space.sm }]}>
            <MaterialCommunityIcons
              name="account-plus-outline"
              size={24}
              color={colors.onSurfaceVariant}
              importantForAccessibility="no"
              accessibilityElementsHidden
            />
            <Text style={[type.bodySmall, styles.hintText, { color: colors.onSurfaceVariant }]}>
              Por enquanto, só você tem acesso. Toque em Adicionar usuário, no topo da tela, para cadastrar
              outra pessoa.
            </Text>
          </View>
        ) : undefined
      }
    />
  );
}

/** Inset divider aligned with the text column (16 dp padding + 40 dp avatar + 16 dp gap). */
function RowDivider() {
  const { colors, space } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.outlineVariant, marginLeft: space.md + 40 + space.md }]} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row' },
  divider: { height: StyleSheet.hairlineWidth },
  hint: { flexDirection: 'row', alignItems: 'flex-start' },
  hintText: { flex: 1 },
});
