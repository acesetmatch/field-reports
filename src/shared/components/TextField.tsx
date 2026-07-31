import { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

type TextFieldProps = TextInputProps & {
  label: string;
  /** Shown only when the field has been touched — see CreateReportScreen. */
  error?: string | null;
  /** Rendered under the input when there is no error. */
  hint?: string;
};

/**
 * Labelled text input with inline validation messaging.
 *
 * `forwardRef` so a screen can move focus between fields on submit-editing.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(
  function TextField({ label, error, hint, style, ...inputProps }, ref) {
    const hasError = Boolean(error);

    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          ref={ref}
          style={[styles.input, hasError && styles.inputError, style]}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          // Announces the error to screen readers rather than relying on the
          // red border alone to convey state.
          accessibilityHint={error ?? hint}
          {...inputProps}
        />
        {hasError ? (
          <Text style={styles.error}>{error}</Text>
        ) : hint ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
  },
  input: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
