import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import type { RootStackScreenProps } from '../../../navigation/types';
import { Screen } from '../../../shared/components/Screen';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/StateViews';
import { colors, spacing } from '../../../shared/theme';
import { ReportsError } from '../api/fetchReports';
import { ReportCard } from '../components/ReportCard';
import { useReportList } from '../hooks/useReportList';
import type { Report } from '../types';

export function ReportListScreen({
  navigation,
}: RootStackScreenProps<'ReportList'>) {
  const { reports, isPending, isError, error, refetch, isRefetching } =
    useReportList();

  const openReport = useCallback(
    (reportId: number) => navigation.navigate('ReportDetail', { reportId }),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Report }) => (
      <ReportCard report={item} onPress={openReport} />
    ),
    [openReport],
  );

  // Only a first load with nothing to show warrants a full-screen spinner.
  // Once there is data, refreshes surface through the RefreshControl instead,
  // so the list never blanks out under the user.
  if (isPending && reports.length === 0) {
    return (
      <Screen>
        <LoadingState />
      </Screen>
    );
  }

  // Likewise, a failed background refetch should not replace a list the user
  // is already reading — only show the error screen when there is nothing else.
  if (isError && reports.length === 0) {
    return (
      <Screen>
        <ErrorState message={toUserMessage(error)} onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={reports}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.content,
          reports.length === 0 && styles.emptyContent,
        ]}
        ItemSeparatorComponent={Separator}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title="No reports yet"
            description="Pull to refresh, or tap New to file the first one."
          />
        }
        // Android-only: detaches offscreen rows from the native view hierarchy.
        removeClippedSubviews
      />
    </Screen>
  );
}

function keyExtractor(report: Report) {
  return String(report.id);
}

function Separator() {
  return <View style={styles.separator} />;
}

function toUserMessage(error: unknown): string {
  return error instanceof ReportsError
    ? error.userMessage
    : 'An unexpected error occurred.';
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
  },
  emptyContent: {
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
});
