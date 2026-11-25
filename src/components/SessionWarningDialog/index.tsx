import { useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';

import { useSession } from '../../contexts/SessionContext';
import { sessionWarningMessage } from '../../domain/userPresentation';
import { ConfirmDialog } from '../ConfirmDialog';

/**
 * Inactivity warning over the signed-in screens (FR-023): a live countdown, "Continuar
 * conectado" (counts as activity) and "Sair". It is announced once when it opens, not on
 * every second. System Back keeps the session, since pressing it is activity too.
 */
export function SessionWarningDialog() {
  const { warningSecondsLeft, keepAlive, signOut } = useSession();
  const visible = warningSecondsLeft !== undefined;
  const announced = useRef(false);

  useEffect(() => {
    if (!visible) {
      announced.current = false;
      return;
    }
    if (announced.current) return;
    announced.current = true;
    AccessibilityInfo.announceForAccessibility(
      `${sessionWarningMessage(warningSecondsLeft)} Toque em Continuar conectado para continuar.`,
    );
  }, [visible, warningSecondsLeft]);

  return (
    <ConfirmDialog
      visible={visible}
      title="Você ainda está aí?"
      message={sessionWarningMessage(warningSecondsLeft ?? 0)}
      confirmLabel="Continuar conectado"
      cancelLabel="Sair"
      onConfirm={keepAlive}
      onCancel={signOut}
      onRequestClose={keepAlive}
    />
  );
}
