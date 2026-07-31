import { useQuery } from '@tanstack/react-query';

import { fetchReports } from '../api/fetchReports';
import type { RemoteReport } from '../types';

export const reportsQueryKey = ['reports'] as const;

/**
 * Server state for the report list.
 *
 * Deliberately returns only remote reports — merging in locally-created ones is
 * the list screen's job. Writing user-created items into the query cache would
 * conflate client-owned and server-owned state, and a background refetch would
 * silently drop them.
 */
export function useReports() {
  return useQuery<RemoteReport[]>({
    queryKey: reportsQueryKey,
    queryFn: ({ signal }) => fetchReports(signal),
  });
}
