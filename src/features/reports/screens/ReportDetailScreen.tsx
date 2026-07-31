import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { RootStackScreenProps } from '../../../navigation/types';
import { Screen } from '../../../shared/components/Screen';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/StateViews';
import { colors, radius, spacing, typography } from '../../../shared/theme';
import { DeviceInfoCard } from '../../device/components/DeviceInfoCard';
import { ReportsError } from '../api/fetchReports';
import { useReport } from '../hooks/useReportList';

export function ReportDetailScreen({
  route,
}: RootStackScreenProps<'ReportDetail'>) {
  const { reportId } = route.params;
  const { report, isPending, isError, error } = useReport(reportId);

  if (!report) {
    // The screen reads from the shared cache, so a missing report means either
    // the list is still loading, the fetch failed, or the id genuinely is not
    // there (e.g. restored navigation state pointing at a stale local report).
    if (isPending) {
      return (
        <Screen>
          <LoadingState label="Loading report…" />
        </Screen>
      );
    }
    if (isError) {
      return (
        <Screen>
          <ErrorState message={toUserMessage(error)} />
        </Screen>
      );
    }
    return (
      <Screen>
        <EmptyState
          title="Report not found"
          description={`No report with ID ${reportId} is available.`}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>Report ID</Text>
            <Text style={styles.metaValue}>#{report.id}</Text>
          </View>

          <Text style={styles.title}>{report.title}</Text>
          <Text style={styles.body}>{report.body}</Text>
        </View>

        {/*
          Only reports created on this device carry a snapshot. The union's
          `origin` discriminant means TypeScript narrows `device` into scope
          here rather than requiring an optional-chain on every report.
        */}
        {report.origin === 'local' && report.device ? (
          <DeviceInfoCard snapshot={report.device} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function toUserMessage(error: unknown): string {
  return error instanceof ReportsError
    ? error.userMessage
    : 'An unexpected error occurred.';
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaValue: {
    ...typography.caption,
    color: colors.text,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  body: {
    ...typography.body,
    color: colors.text,
    lineHeight: 22,
  },
});
