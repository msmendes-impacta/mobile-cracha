import { usePreventRemove, useNavigation, type NavigationAction } from '@react-navigation/native';
import { useState } from 'react';

import { ConfirmDialog } from '../ConfirmDialog';

/**
 * Asks "Descartar alterações?" when the person leaves a dirty form by the header back or
 * the system Back (FR-012a). A clean form leaves without asking. Session expiry unmounts
 * the whole stack, which is not a screen removal, so it discards without asking.
 */
export function useDiscardPrompt(dirty: boolean) {
  const navigation = useNavigation();
  const [pending, setPending] = useState<NavigationAction | null>(null);

  usePreventRemove(dirty, ({ data }) => setPending(data.action));

  return (
    <ConfirmDialog
      visible={pending !== null}
      title="Descartar alterações?"
      message="O que você digitou neste formulário será perdido."
      confirmLabel="Descartar"
      cancelLabel="Continuar editando"
      destructive
      onConfirm={() => {
        const action = pending;
        setPending(null);
        if (action) navigation.dispatch(action);
      }}
      onCancel={() => setPending(null)}
    />
  );
}
