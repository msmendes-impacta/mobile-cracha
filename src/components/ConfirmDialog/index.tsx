import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Renders the confirm action in the error color (deletion, reset). */
  destructive?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  /** Extra content, e.g. the typed-confirmation field. */
  children?: ReactNode;
}

/** Material 3 dialog for decisions that must interrupt (delete, discard, reset). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancelar',
  destructive,
  confirmDisabled,
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  const { colors, type, space, radius, minTouchTarget } = useTheme();
  const confirmColor = destructive ? colors.error : colors.primary;

  const action = (label: string, color: string, onPress: () => void, disabled = false) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      android_ripple={{ color: colors.outlineVariant }}
      style={[styles.action, { minHeight: minTouchTarget, paddingHorizontal: space.sm, opacity: disabled ? 0.38 : 1 }]}
    >
      <Text style={[type.label, { color }]}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={[styles.scrim, { backgroundColor: colors.scrim, padding: space.lg }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            { backgroundColor: colors.surfaceContainer, borderRadius: radius.xl, padding: space.lg },
          ]}
        >
          <Text style={[type.headline, { color: colors.onSurface }]} accessibilityRole="header">
            {title}
          </Text>
          {message ? (
            <Text style={[type.body, { color: colors.onSurfaceVariant, marginTop: space.md }]}>{message}</Text>
          ) : null}
          {children ? <View style={{ marginTop: space.md }}>{children}</View> : null}
          <View style={[styles.actions, { marginTop: space.lg, gap: space.xs }]}>
            {action(cancelLabel, colors.primary, onCancel)}
            {action(confirmLabel, confirmColor, onConfirm, confirmDisabled)}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 400 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap' },
  action: { justifyContent: 'center', borderRadius: 999 },
});
