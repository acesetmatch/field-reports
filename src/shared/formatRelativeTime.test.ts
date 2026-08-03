import { formatRelativeTime } from './formatRelativeTime';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Fixed "now" so the assertions do not depend on the clock. */
const NOW = 1_700_000_000_000;

const ago = (elapsed: number) => formatRelativeTime(NOW - elapsed, NOW);

describe('formatRelativeTime', () => {
  it('collapses anything recent to "just now"', () => {
    expect(ago(0)).toBe('just now');
    expect(ago(44 * SECOND)).toBe('just now');
  });

  it('does not render a negative age when the timestamp is ahead of now', () => {
    // Clock skew between device and server is normal; "in -3 minutes" is not.
    expect(formatRelativeTime(NOW + 5 * MINUTE, NOW)).toBe('just now');
  });

  it('singularises the first minute and the first hour', () => {
    expect(ago(45 * SECOND)).toBe('1 minute ago');
    expect(ago(89 * SECOND)).toBe('1 minute ago');
    expect(ago(60 * MINUTE)).toBe('1 hour ago');
    expect(ago(89 * MINUTE)).toBe('1 hour ago');
  });

  it('reports minutes below an hour', () => {
    expect(ago(10 * MINUTE)).toBe('10 minutes ago');
    expect(ago(59 * MINUTE)).toBe('59 minutes ago');
  });

  it('reports hours below a day', () => {
    expect(ago(90 * MINUTE)).toBe('2 hours ago');
    expect(ago(5 * HOUR)).toBe('5 hours ago');
  });

  it('reports days beyond that, singularising the first', () => {
    expect(ago(DAY)).toBe('1 day ago');
    expect(ago(3 * DAY)).toBe('3 days ago');
  });

  it('is exclusive at each boundary, so no bucket reports the next one down', () => {
    expect(ago(45 * SECOND)).not.toBe('just now');
    expect(ago(HOUR)).not.toBe('60 minutes ago');
    expect(ago(DAY)).not.toBe('24 hours ago');
  });
});
