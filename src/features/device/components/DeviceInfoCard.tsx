import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../../shared/theme';
import type { DeviceSnapshot } from '../types';

/**
 * Renders a captured device snapshot.
 *
 * Fields the platform could not answer show an explicit "Not available" rather
 * than being hidden or shown as a dash — the reader should be able to tell the
 * difference between "we asked and got nothing" and "we never asked".
 */
export function DeviceInfoCard({
  snapshot,
  title = 'Device information',
}: {
  snapshot: DeviceSnapshot;
  title?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <Row label="Operating system" value={snapshot.os} />
      <Row label="OS version" value={snapshot.osVersion} />
      <Row label="Device model" value={snapshot.model} />
      <Row
        label="Battery level"
        value={
          snapshot.batteryLevel === null ? null : `${snapshot.batteryLevel}%`
        }
      />
      <Row label="Captured" value={formatTimestamp(snapshot.capturedAt)} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  const isUnavailable = value === null;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[styles.value, isUnavailable && styles.unavailable]}
        numberOfLines={1}
      >
        {isUnavailable ? 'Not available' : value}
      </Text>
    </View>
  );
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleString();
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textMuted,
    flexShrink: 0,
  },
  value: {
    ...typography.body,
    color: colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  unavailable: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
