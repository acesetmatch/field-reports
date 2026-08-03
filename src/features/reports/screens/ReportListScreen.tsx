import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import type { RootStackScreenProps } from '../../../navigation/types';
import { Banner } from '../../../shared/components/Banner';
import { Screen } from '../../../shared/components/Screen';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/StateViews';
import { formatRelativeTime } from '../../../shared/formatRelativeTime';
import { colors, spacing, typography } from '../../../shared/theme';
import { ReportsError } from '../api/fetchReports';
import { ReportCard } from '../components/ReportCard';
import { useReportList } from '../hooks/useReportList';
import type { Report } from '../types';

/** How often the "updated N ago" stamp re-evaluates while the screen is open. */
const STAMP_REFRESH_MS = 60 * 1000;

export function ReportListScreen({
  navigation,
}: RootStackScreenProps<'ReportList'>) {
  const {
    reports,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
    dataUpdatedAt,
    errorUpdatedAt,
  } = useReportList();

  // Keyed to `errorUpdatedAt` rather than a boolean. Dismissing sets it to the
  // failure the user acknowledged, so the banner stays gone — but the next
  // failure bumps the timestamp and it returns. A plain `dismissed` flag would
  // swallow every later failure and rebuild the silent-refresh bug one layer up.
  const [dismissedErrorAt, setDismissedErrorAt] = useState<number | null>(null);

  // The freshness stamp has to age on its own, or it sits at "just now" for an
  // hour while the screen is open — a confidently wrong label, which is the bug
  // this whole feature exists to remove. A minute is finer than the label's
  // smallest bucket, and `FlatList` virtualises, so a tick re-renders the
  // handful of visible rows rather than all hundred.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), STAMP_REFRESH_MS);
    return () => clearInterval(tick);
  }, []);

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

  // Everything below here has reports to show. A failure from this point on is
  // a failed *refresh*, so it is reported without disturbing what is on screen.
  const showFailureBanner = isError && errorUpdatedAt !== dismissedErrorAt;

  return (
    <Screen>
      {showFailureBanner ? (
        <View style={styles.bannerSlot}>
          <Banner
            message={toUserMessage(error)}
            onDismiss={() => setDismissedErrorAt(errorUpdatedAt)}
          />
        </View>
      ) : null}

      <FlatList
        data={reports}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        // The stamp answers "how stale", the banner answers "why". The stamp is
        // the one that keeps earning when nothing has failed.
        ListHeaderComponent={
          dataUpdatedAt ? (
            <Text style={styles.updatedAt}>
              Updated {formatRelativeTime(dataUpdatedAt, now)}
            </Text>
          ) : null
        }
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
  bannerSlot: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  updatedAt: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  emptyContent: {
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
});
