import { z } from 'zod';

import type { DeviceSnapshot } from '../device/types';

/**
 * Shape of a post as returned by jsonplaceholder.
 *
 * `fetch().json()` returns `any`, so casting with `as Report[]` would assert a
 * shape nobody verified. Parsing instead means the type is *derived from* a
 * runtime check — validate at the boundary, assert nowhere.
 */
export const remoteReportSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  title: z.string(),
  body: z.string(),
});

export const remoteReportListSchema = z.array(remoteReportSchema);

export type RemoteReport = z.infer<typeof remoteReportSchema>;

/**
 * A report created on-device.
 *
 * `device` is optional because attaching device information is an explicit user
 * action, and `origin` discriminates local from remote reports in the type
 * system rather than by checking whether some field happens to be present.
 */
export type LocalReport = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  device?: DeviceSnapshot;
};

export type Report =
  | ({ origin: 'remote' } & RemoteReport)
  | ({ origin: 'local' } & LocalReport);

/** Characters of `body` shown in the list before truncating. */
const PREVIEW_LENGTH = 120;

/**
 * Collapses the whitespace jsonplaceholder embeds in `body` (it contains raw
 * newlines) and truncates on a word boundary so the preview does not end
 * mid-word.
 */
export function toBodyPreview(body: string, maxLength = PREVIEW_LENGTH): string {
  const normalised = body.replace(/\s+/g, ' ').trim();
  if (normalised.length <= maxLength) return normalised;

  const clipped = normalised.slice(0, maxLength);
  const lastSpace = clipped.lastIndexOf(' ');
  const truncated = lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped;

  return `${truncated.trimEnd()}…`;
}
