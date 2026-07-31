import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { MIN_TOUCH_TARGET, colors, radius, spacing, typography } from '../theme';

/**
 * The three non-happy-path views a data screen needs. Grouped in one file
 * because they share layout and are always considered together.
 */

export function LoadingState({ label = 'Loading reports…' }: { label?: string }) {
  return (
    <View style={styles.centered} accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{label}</Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.centered}>
      <View style={styles.errorBadge}>
        <Text style={styles.errorBadgeText}>!</Text>
      </View>
      <Text style={styles.heading}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.centered}>
      <Text style={styles.heading}>{title}</Text>
      {description ? <Text style={styles.message}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  heading: {
    ...typography.heading,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dangerSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBadgeText: {
    ...typography.heading,
    color: colors.danger,
  },
  retry: {
    marginTop: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  retryPressed: {
    opacity: 0.8,
  },
  retryText: {
    ...typography.caption,
    color: colors.primaryText,
  },
});
