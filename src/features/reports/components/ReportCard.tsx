import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  MIN_TOUCH_TARGET,
  colors,
  radius,
  spacing,
  typography,
} from '../../../shared/theme';
import { toBodyPreview, type Report } from '../types';

type ReportCardProps = {
  report: Report;
  onPress: (reportId: number) => void;
};

/**
 * Memoised because `FlatList` re-renders rows on any parent state change
 * (pull-to-refresh, a new local report). `onPress` takes the id rather than a
 * closure so the callback prop stays referentially stable across renders.
 */
export const ReportCard = memo(function ReportCard({
  report,
  onPress,
}: ReportCardProps) {
  return (
    <Pressable
      onPress={() => onPress(report.id)}
      accessibilityRole="button"
      accessibilityLabel={`Report ${report.id}: ${report.title}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.id}>#{report.id}</Text>
        {report.origin === 'local' ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>On this device</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {report.title}
      </Text>
      <Text style={styles.preview} numberOfLines={2}>
        {toBodyPreview(report.body)}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    minHeight: MIN_TOUCH_TARGET,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  id: {
    ...typography.caption,
    color: colors.textMuted,
  },
  badge: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primary,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  preview: {
    ...typography.body,
    color: colors.textMuted,
  },
});
