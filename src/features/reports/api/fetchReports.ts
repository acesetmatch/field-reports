import { remoteReportListSchema, type RemoteReport } from '../types';

const REPORTS_URL = 'https://jsonplaceholder.typicode.com/posts';

/** Give up rather than hang forever on a stalled mobile connection. */
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * The three ways this request can fail, kept distinct so the UI can show a
 * useful message instead of a generic one. A malformed payload is a different
 * problem from a dead network, and telling the user "check your connection"
 * when the server sent bad JSON is actively misleading.
 */
export type ReportsErrorKind = 'network' | 'http' | 'malformed';

export class ReportsError extends Error {
  readonly kind: ReportsErrorKind;
  readonly status?: number;

  constructor(kind: ReportsErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'ReportsError';
    this.kind = kind;
    this.status = status;
  }

  /** Copy suitable for showing to a user. */
  get userMessage(): string {
    switch (this.kind) {
      case 'network':
        return 'Could not reach the server. Check your connection and try again.';
      case 'http':
        return `The server responded with an error (${this.status ?? 'unknown'}).`;
      case 'malformed':
        return 'The server sent data in an unexpected format.';
    }
  }
}

export async function fetchReports(signal?: AbortSignal): Promise<RemoteReport[]> {
  const response = await requestReports(signal);

  if (!response.ok) {
    throw new ReportsError(
      'http',
      `GET ${REPORTS_URL} failed with ${response.status}`,
      response.status,
    );
  }

  const payload: unknown = await response.json();
  const parsed = remoteReportListSchema.safeParse(payload);

  if (!parsed.success) {
    // Keep the validation detail in the message for logs; the UI shows
    // `userMessage` instead of this.
    throw new ReportsError('malformed', parsed.error.message);
  }

  return parsed.data;
}

async function requestReports(signal?: AbortSignal): Promise<Response> {
  // Compose the caller's cancellation (React Query aborts on unmount) with our
  // own timeout, so whichever fires first wins.
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  try {
    return await fetch(REPORTS_URL, {
      headers: { Accept: 'application/json' },
      signal: combined,
    });
  } catch (error) {
    // Let a caller-initiated cancellation propagate untouched — React Query
    // treats it as a cancellation, not a failure.
    if (signal?.aborted) throw error;

    throw new ReportsError(
      'network',
      error instanceof Error ? error.message : 'Network request failed',
    );
  }
}
