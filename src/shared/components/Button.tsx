import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { MIN_TOUCH_TARGET, colors, radius, spacing, typography } from '../theme';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary';
};

export function Button({
  label,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      // Communicates the disabled state to assistive technology, which the
      // greyed-out background alone does not.
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        state.pressed && styles.pressed,
        disabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <Text
        style={[
          styles.label,
          variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel,
          disabled && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    backgroundColor: colors.disabled,
    borderColor: colors.disabled,
  },
  label: {
    ...typography.heading,
  },
  primaryLabel: {
    color: colors.primaryText,
  },
  secondaryLabel: {
    color: colors.primary,
  },
  disabledLabel: {
    color: colors.surface,
  },
});
