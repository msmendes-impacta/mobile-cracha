import { useState } from 'react';

import { isResetConfirmed, RESET_CONFIRMATION_WORD } from '../../domain/resetConfirmation';
import { ConfirmDialog } from '../ConfirmDialog';
import { TextField } from '../TextField';

export interface TypedConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Disables both actions while the confirmed action runs. */
  busy?: boolean;
  /** Shown under the field when the confirmed action failed. */
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Destructive confirmation that requires typing `APAGAR` exactly (FR-031). The confirm action
 * stays disabled until the text matches; "Cancelar" and system Back close it and change nothing.
 * The typed text is cleared each time the dialog opens.
 */
export function TypedConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  busy = false,
  error,
  onConfirm,
  onCancel,
}: TypedConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const [wasVisible, setWasVisible] = useState(visible);
  // Clear the text on every opening (state adjusted during render, not in an effect).
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setTyped('');
  }
  const confirmed = isResetConfirmed(typed);

  const confirm = () => {
    if (confirmed && !busy) onConfirm();
  };
  const cancel = () => {
    if (!busy) onCancel();
  };

  return (
    <ConfirmDialog
      visible={visible}
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      destructive
      confirmDisabled={!confirmed || busy}
      cancelDisabled={busy}
      onConfirm={confirm}
      onCancel={cancel}
    >
      <TextField
        label={`Digite ${RESET_CONFIRMATION_WORD} para confirmar`}
        value={typed}
        onChangeText={setTyped}
        error={error}
        autoFocus
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        importantForAutofill="no"
        maxLength={20}
        returnKeyType="done"
        onSubmitEditing={confirm}
        editable={!busy}
      />
    </ConfirmDialog>
  );
}
