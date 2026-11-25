import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ComponentRef, type Ref } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../../theme/useTheme';

export interface TextFieldProps extends Omit<TextInputProps, 'style' | 'secureTextEntry'> {
  /** Persistent visible label above the field (FR-039). */
  label: string;
  error?: string;
  /** Helper text under the field, e.g. the "keep current password" hint. */
  hint?: string;
  /** Shows "n/maxLength" while typing (visible limits, design-shape §3). */
  showCounter?: boolean;
  /** Password field: hidden by default with an accessible show/hide toggle (FR-033). */
  secure?: boolean;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function TextField({
  label,
  error,
  hint,
  showCounter,
  secure,
  maxLength,
  value,
  onFocus,
  onBlur,
  ref,
  ...inputProps
}: TextFieldProps) {
  const { colors, type, space, radius } = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.focus : colors.outline;
  const a11yLabel = error ? `${label}, erro: ${error}` : label;

  return (
    <View style={{ marginBottom: space.md }}>
      <View style={styles.labelRow}>
        {/* The input's accessibilityLabel already carries the label and the error. */}
        <Text
          style={[type.label, { color: error ? colors.error : colors.onSurfaceVariant }]}
          importantForAccessibility="no"
          accessibilityElementsHidden
        >
          {label}
        </Text>
        {showCounter && maxLength ? (
          <Text
            style={[type.labelSmall, { color: colors.onSurfaceVariant }]}
            importantForAccessibility="no"
            accessibilityElementsHidden
          >
            {`${value?.length ?? 0}/${maxLength}`}
          </Text>
        ) : null}
      </View>

      <View
        style={[
          styles.box,
          {
            borderColor,
            borderWidth: focused || error ? 2 : 1,
            borderRadius: radius.sm,
            backgroundColor: colors.surface,
            marginTop: space.half,
          },
        ]}
      >
        <TextInput
          ref={ref}
          value={value}
          maxLength={maxLength}
          secureTextEntry={secure && !revealed}
          accessibilityLabel={a11yLabel}
          accessibilityHint={hint}
          placeholderTextColor={colors.onSurfaceVariant}
          cursorColor={colors.primary}
          selectionColor={colors.inversePrimary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[type.body, styles.input, { color: colors.onSurface, paddingHorizontal: space.md }]}
          {...inputProps}
        />
        {secure ? (
          <Pressable
            onPress={() => setRevealed((r) => !r)}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar senha' : 'Mostrar senha'}
            hitSlop={4}
            style={styles.toggle}
            android_ripple={{ color: colors.outlineVariant, borderless: true }}
          >
            <MaterialCommunityIcons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color={colors.onSurfaceVariant}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View
          style={[styles.messageRow, { marginTop: space.half }]}
          importantForAccessibility="no-hide-descendants"
          accessibilityElementsHidden
        >
          <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} style={styles.messageIcon} />
          <Text style={[type.bodySmall, styles.messageText, { color: colors.error }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text
          style={[type.bodySmall, { color: colors.onSurfaceVariant, marginTop: space.half }]}
          importantForAccessibility="no"
        >
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 },
  box: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  input: { flex: 1, minHeight: 52, paddingVertical: 12 },
  toggle: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  messageIcon: { marginTop: 2 },
  messageText: { flex: 1 },
});
