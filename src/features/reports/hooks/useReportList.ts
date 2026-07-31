import { useMemo } from 'react';

import { useLocalReports } from '../store/localReportsStore';
import type { Report } from '../types';
import { useReports } from './useReports';

/**
 * The list the UI actually renders: locally-created reports (newest first)
 * above the reports fetched from the API.
 *
 * The merge happens here rather than in the query cache so that a background
 * refetch can never drop user-created reports. Server state and client state
 * stay in their own stores and are combined at the point of use.
 */
export function useReportList() {
  const query = useReports();
  const { localReports } = useLocalReports();

  const reports = useMemo<Report[]>(() => {
    const local: Report[] = localReports.map((report) => ({
      origin: 'local',
      ...report,
    }));
    const remote: Report[] = (query.data ?? []).map((report) => ({
      origin: 'remote',
      ...report,
    }));
    return [...local, ...remote];
  }, [localReports, query.data]);

  return { ...query, reports };
}

/**
 * Looks a single report up by id from the same merged view.
 *
 * The detail screen receives only a `reportId` route param, so it reads the
 * full record from the cache rather than having it passed through navigation
 * state — which must stay small and serialisable.
 */
export function useReport(reportId: number) {
  const { reports, isPending, isError, error } = useReportList();

  const report = useMemo(
    () => reports.find((candidate) => candidate.id === reportId),
    [reports, reportId],
  );

  return { report, isPending, isError, error };
}
