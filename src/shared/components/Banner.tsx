import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MIN_TOUCH_TARGET, colors, radius, spacing, typography } from '../theme';

/**
 * A non-blocking failure notice shown above content the user can still read.
 *
 * Distinct from `ErrorState`, which replaces the screen. This one exists for the
 * case where there is something worth keeping on screen — a refresh that failed
 * over a list that is still perfectly readable. Replacing that list would cost
 * the user data they already had; saying nothing would let them believe it is
 * fresh. The banner is the middle.
 *
 * Not a toast: the condition it reports ("this data is stale") stays true after
 * four seconds, and transient copy for a persistent condition just means the
 * user who looked away is uninformed again.
 */
export function Banner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <View
      style={styles.banner}
      // `alert` so TalkBack/VoiceOver announce it when it appears, rather than
      // only on focus — the user is looking at the list, not at this.
      accessibilityRole="alert"
    >
      <Text style={styles.message}>{message}</Text>

      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
        hitSlop={12}
        style={({ pressed }) => [styles.dismiss, pressed && styles.pressed]}
      >
        <Text style={styles.dismissText}>Dismiss</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dangerSurface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.caption,
    color: colors.danger,
    flex: 1,
  },
  dismiss: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  dismissText: {
    ...typography.caption,
    color: colors.danger,
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.6,
  },
});
