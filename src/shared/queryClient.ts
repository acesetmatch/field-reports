import { QueryClient } from '@tanstack/react-query';

/**
 * Defaults tuned for a mobile client:
 *
 * - `staleTime` of 5 minutes: report content is not real-time, so refetching on
 *   every screen focus would burn battery and cellular data for no benefit.
 * - `retry: 2` with backoff: mobile networks drop packets, and a transient
 *   failure should not surface as an error screen on the first blip.
 * - `gcTime` of 30 minutes so returning to the list after a detour is instant.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
    },
  });
}
