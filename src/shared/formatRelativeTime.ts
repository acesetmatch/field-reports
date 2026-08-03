/**
 * Coarse "how long ago" copy for the list's freshness stamp.
 *
 * Deliberately imprecise. The question a field worker is asking is "can I trust
 * this?", not "what is the exact age?" — so the buckets are wide enough that the
 * label stays true for a while rather than needing a timer to stay honest.
 *
 * `now` is a parameter rather than a `Date.now()` call inside so the function
 * stays pure and testable without faking timers.
 */

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(timestamp: number, now: number): string {
  const elapsed = now - timestamp;

  // A clock skew or a future timestamp should not render "in -3 minutes".
  if (elapsed < 45 * SECOND) return 'just now';

  if (elapsed < 90 * SECOND) return '1 minute ago';
  if (elapsed < HOUR) return `${Math.round(elapsed / MINUTE)} minutes ago`;

  if (elapsed < 90 * MINUTE) return '1 hour ago';
  if (elapsed < DAY) return `${Math.round(elapsed / HOUR)} hours ago`;

  const days = Math.round(elapsed / DAY);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}
